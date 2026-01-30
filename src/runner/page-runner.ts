import path from "path";
import type { BrowserContext } from "playwright";
import type { PageEntry, WebguardConfig } from "../config/schema.js";
import type { AuditResult, PageResult } from "../types/index.js";
import type { Audit, AuditContext } from "../audits/index.js";
import { navigateWithRetry } from "./retry.js";
import { sanitize } from "../utils/sanitize.js";
import { ensureDir } from "../utils/fs.js";
import { log } from "../utils/logger.js";

export async function runPageAudits(
  pageEntry: PageEntry,
  config: WebguardConfig,
  browserContext: BrowserContext,
  audits: Audit[],
  runDir: string
): Promise<PageResult> {
  const start = Date.now();
  const url = `${config.baseURL}${pageEntry.path}`;
  const page = await browserContext.newPage();

  // Attach console listener before navigation
  const consoleMessages: Array<{ type: string; text: string }> = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Navigate with retry
  let navigationResponse = null;
  try {
    navigationResponse = await navigateWithRetry(
      page,
      url,
      config.retry,
      "domcontentloaded"
    );
  } catch (err) {
    log.error(`Failed to navigate to ${url}: ${(err as Error).message}`);
  }

  // Build audit context
  const ctx: AuditContext = {
    page,
    browserContext,
    pageEntry,
    config,
    runDir,
    navigationResponse,
    consoleMessages,
  };

  // Filter out skipped audits for this page
  const pageAudits = audits.filter(
    (a) => !pageEntry.skipAudits?.includes(a.name)
  );

  // Run each audit
  const auditResults: AuditResult[] = [];
  for (const audit of pageAudits) {
    const auditStart = Date.now();
    try {
      const result = await audit.run(ctx);
      result.duration = Date.now() - auditStart;
      auditResults.push(result);
    } catch (err) {
      auditResults.push({
        audit: audit.name,
        page: pageEntry.name,
        passed: false,
        severity: "fail",
        message: `Audit error: ${(err as Error).message}`,
        duration: Date.now() - auditStart,
      });
    }
  }

  // Capture screenshot
  let screenshotPath: string | undefined;
  if (config.output.screenshots) {
    const anyFailed = auditResults.some((r) => !r.passed);
    if (!config.output.screenshotOnFailOnly || anyFailed) {
      try {
        const pageDir = path.join(runDir, "screenshots", sanitize(pageEntry.name));
        ensureDir(pageDir);
        const status = anyFailed ? "fail" : "pass";
        screenshotPath = path.join(pageDir, `page-${status}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      } catch {
        // Screenshot failed, not critical
      }
    }
  }

  await page.close();

  return {
    page: pageEntry.name,
    path: pageEntry.path,
    url,
    audits: auditResults,
    screenshotPath,
    duration: Date.now() - start,
  };
}
