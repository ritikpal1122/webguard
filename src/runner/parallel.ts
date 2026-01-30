import type { BrowserContext } from "playwright";
import type { PageEntry, WebguardConfig } from "../config/schema.js";
import type { PageResult } from "../types/index.js";
import type { Audit } from "../audits/index.js";
import type { PluginRegistry } from "../plugins/registry.js";
import { runPageAudits } from "./page-runner.js";
import { log } from "../utils/logger.js";

export async function runPagesParallel(
  pages: PageEntry[],
  config: WebguardConfig,
  browserContext: BrowserContext,
  audits: Audit[],
  runDir: string,
  registry: PluginRegistry,
  concurrency: number,
  failFast: boolean
): Promise<PageResult[]> {
  const results: PageResult[] = new Array(pages.length);
  let currentIndex = 0;
  let aborted = false;

  async function worker(): Promise<void> {
    while (!aborted) {
      const index = currentIndex++;
      if (index >= pages.length) break;

      const pageEntry = pages[index];
      log.plain(`  [${index + 1}/${pages.length}] ${pageEntry.name} (${pageEntry.path})`);

      const result = await runPageAudits(
        pageEntry,
        config,
        browserContext,
        audits,
        runDir,
        registry
      );
      results[index] = result;

      // Print inline results
      for (const audit of result.audits) {
        const icon = audit.passed
          ? "  \u2713"
          : audit.severity === "warning"
            ? "  \u26A0"
            : "  \u2717";
        const duration = audit.duration ? `${audit.duration}ms` : "";
        log.plain(
          `${icon} ${audit.audit.padEnd(20)} ${audit.message.padEnd(30)} ${duration}`
        );
      }
      log.plain("");

      if (failFast && result.audits.some((a) => a.severity === "fail")) {
        log.warn("Fail fast enabled — stopping after first failure");
        aborted = true;
      }
    }
  }

  const workerCount = Math.min(concurrency, pages.length);
  const workers = Array.from({ length: workerCount }, () => worker());

  await Promise.all(workers);

  return results.filter(Boolean);
}
