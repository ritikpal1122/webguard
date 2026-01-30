import path from "path";
import type { Audit, AuditContext } from "./index.js";
import type { AuditResult } from "../types/index.js";
import { sanitize } from "../utils/sanitize.js";
import { writeJson, ensureDir } from "../utils/fs.js";

export const LighthouseAudit: Audit = {
  name: "lighthouse",
  description:
    "Lighthouse performance, accessibility, best practices, and SEO audit",

  async run(ctx: AuditContext): Promise<AuditResult> {
    let lighthouse: any;
    let chromeLauncher: any;

    try {
      lighthouse = await import("lighthouse");
      chromeLauncher = await import("chrome-launcher");
    } catch {
      return {
        audit: this.name,
        page: ctx.pageEntry.name,
        passed: false,
        severity: "skip",
        message:
          'Lighthouse not installed. Run: npm install lighthouse chrome-launcher',
      };
    }

    const chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox"],
    });

    const url = `${ctx.config.baseURL}${ctx.pageEntry.path}`;
    const thresholds = ctx.config.lighthouseThresholds;

    try {
      const result = await lighthouse.default(url, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
      });

      await chrome.kill();

      if (!result?.lhr) {
        return {
          audit: this.name,
          page: ctx.pageEntry.name,
          passed: false,
          severity: "fail",
          message: "Lighthouse failed to produce results",
        };
      }

      const scores = {
        performance: Math.round(
          (result.lhr.categories.performance?.score ?? 0) * 100
        ),
        accessibility: Math.round(
          (result.lhr.categories.accessibility?.score ?? 0) * 100
        ),
        bestPractices: Math.round(
          (result.lhr.categories["best-practices"]?.score ?? 0) * 100
        ),
        seo: Math.round((result.lhr.categories.seo?.score ?? 0) * 100),
      };

      const failures: string[] = [];
      if (thresholds.performance && scores.performance < thresholds.performance)
        failures.push(
          `Performance: ${scores.performance} < ${thresholds.performance}`
        );
      if (
        thresholds.accessibility &&
        scores.accessibility < thresholds.accessibility
      )
        failures.push(
          `Accessibility: ${scores.accessibility} < ${thresholds.accessibility}`
        );
      if (
        thresholds.bestPractices &&
        scores.bestPractices < thresholds.bestPractices
      )
        failures.push(
          `Best Practices: ${scores.bestPractices} < ${thresholds.bestPractices}`
        );
      if (thresholds.seo && scores.seo < thresholds.seo)
        failures.push(`SEO: ${scores.seo} < ${thresholds.seo}`);

      const pageDir = path.join(
        ctx.runDir,
        "screenshots",
        sanitize(ctx.pageEntry.name)
      );
      ensureDir(pageDir);
      writeJson(path.join(pageDir, "lighthouse-report.json"), result.lhr);

      return {
        audit: this.name,
        page: ctx.pageEntry.name,
        passed: failures.length === 0,
        severity: failures.length > 0 ? "fail" : "pass",
        message:
          failures.length > 0
            ? `Failed: ${failures.join("; ")}`
            : `perf=${scores.performance} a11y=${scores.accessibility} bp=${scores.bestPractices} seo=${scores.seo}`,
        details: { scores, thresholds, failures },
      };
    } catch (err) {
      await chrome.kill().catch(() => {});
      return {
        audit: this.name,
        page: ctx.pageEntry.name,
        passed: false,
        severity: "fail",
        message: `Lighthouse error: ${(err as Error).message}`,
      };
    }
  },
};
