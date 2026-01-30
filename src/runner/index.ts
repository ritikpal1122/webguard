import { chromium } from "playwright";
import type { WebguardConfig } from "../config/schema.js";
import type { RunResult, PageResult } from "../types/index.js";
import { authenticate } from "../auth/index.js";
import { getEnabledAudits } from "../audits/index.js";
import { runPageAudits } from "./page-runner.js";
import { runPagesParallel } from "./parallel.js";
import { setupRunDirectory } from "./setup.js";
import { runReporters } from "../reporters/index.js";
import { PluginRegistry, loadPlugins } from "../plugins/index.js";
import { log } from "../utils/logger.js";

export interface RunOptions {
  headed?: boolean;
  pagesFilter?: string[];
  auditsFilter?: string[];
}

export async function run(
  config: WebguardConfig,
  options: RunOptions = {}
): Promise<RunResult> {
  const start = Date.now();

  // Override headless from CLI
  if (options.headed !== undefined) {
    config.browser.headless = !options.headed;
  }

  // Load plugins
  const registry = new PluginRegistry();
  if (config.plugins.length > 0) {
    const plugins = await loadPlugins(config.plugins);
    for (const plugin of plugins) {
      registry.register(plugin);
    }
  }

  // Setup run directory
  const { runDir } = setupRunDirectory(config.output.dir);

  // Authenticate
  const authResult = await authenticate(config.auth, runDir);

  // Launch browser
  const browser = await chromium.launch({
    headless: config.browser.headless,
  });

  const contextOptions: any = {
    viewport: config.browser.viewport,
  };

  if (authResult?.storageStatePath) {
    contextOptions.storageState = authResult.storageStatePath;
  }
  if (authResult?.extraHeaders) {
    contextOptions.extraHTTPHeaders = authResult.extraHeaders;
  }

  const browserContext = await browser.newContext(contextOptions);

  // beforeAll hook
  await registry.runHook("beforeAll", { config, browserContext });

  // Get enabled audits (built-in + plugin + custom)
  let audits = getEnabledAudits(
    config.audits,
    registry.getPluginAudits(),
    config.customAudits
  );

  // Filter audits if specified
  if (options.auditsFilter?.length) {
    audits = audits.filter((a) => options.auditsFilter!.includes(a.name));
  }

  const enabledAuditNames = audits.map((a) => a.name);

  // Filter pages if specified
  let pages = config.pages;
  if (options.pagesFilter?.length) {
    pages = pages.filter((p) => options.pagesFilter!.includes(p.name));
  }

  log.plain("");
  log.info(`Base URL: ${config.baseURL}`);
  log.info(`Pages:    ${pages.length}`);
  log.info(`Audits:   ${enabledAuditNames.join(", ")}`);
  if (config.plugins.length > 0) {
    log.info(`Plugins:  ${config.plugins.length}`);
  }
  if (config.runner.concurrency > 1) {
    log.info(`Workers:  ${config.runner.concurrency}`);
  }
  log.plain("");

  // Run audits on each page
  let pageResults: PageResult[];

  if (config.runner.concurrency > 1) {
    // Parallel execution
    pageResults = await runPagesParallel(
      pages,
      config,
      browserContext,
      audits,
      runDir,
      registry,
      config.runner.concurrency,
      config.runner.failFast
    );
  } else {
    // Sequential execution
    pageResults = [];

    for (let i = 0; i < pages.length; i++) {
      const pageEntry = pages[i];
      log.plain(`  [${i + 1}/${pages.length}] ${pageEntry.name} (${pageEntry.path})`);

      const result = await runPageAudits(
        pageEntry,
        config,
        browserContext,
        audits,
        runDir,
        registry
      );
      pageResults.push(result);

      // Print inline results
      for (const audit of result.audits) {
        const icon = audit.passed ? "  \u2713" : audit.severity === "warning" ? "  \u26A0" : "  \u2717";
        const duration = audit.duration ? `${audit.duration}ms` : "";
        log.plain(`${icon} ${audit.audit.padEnd(20)} ${audit.message.padEnd(30)} ${duration}`);
      }
      log.plain("");

      // Fail fast
      if (config.runner.failFast && result.audits.some((a) => a.severity === "fail")) {
        log.warn("Fail fast enabled — stopping after first failure");
        break;
      }
    }
  }

  await browserContext.close();
  await browser.close();

  // Build summary
  const allAudits = pageResults.flatMap((p) => p.audits);
  const runResult: RunResult = {
    timestamp: new Date().toISOString(),
    config: {
      baseURL: config.baseURL,
      totalPages: pages.length,
      auditsEnabled: enabledAuditNames,
    },
    pages: pageResults,
    summary: {
      totalAudits: allAudits.length,
      passed: allAudits.filter((a) => a.severity === "pass").length,
      failed: allAudits.filter((a) => a.severity === "fail").length,
      warnings: allAudits.filter((a) => a.severity === "warning").length,
      skipped: allAudits.filter((a) => a.severity === "skip").length,
      duration: Date.now() - start,
    },
  };

  // afterAll hook
  await registry.runHook("afterAll", { config, result: runResult });

  // Run reporters (built-in + plugin)
  await runReporters(runResult, config, runDir, registry.getPluginReporters());

  return runResult;
}
