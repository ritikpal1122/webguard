import AxeBuilder from "@axe-core/playwright";
import path from "path";
import type { Audit, AuditContext } from "./index.js";
import type { AuditResult } from "../types/index.js";
import { sanitize } from "../utils/sanitize.js";
import { writeJson } from "../utils/fs.js";

export const AccessibilityAudit: Audit = {
  name: "accessibility",
  description: "WCAG accessibility audit via axe-core",

  async run(ctx: AuditContext): Promise<AuditResult> {
    const results = await new AxeBuilder({ page: ctx.page })
      .withTags(ctx.config.wcagTags)
      .analyze();

    const violations = results.violations;

    if (violations.length > 0) {
      const summary = violations.map((v) => ({
        rule: v.id,
        impact: v.impact,
        description: v.description,
        helpUrl: v.helpUrl,
        elements: v.nodes.length,
      }));

      const pageDir = path.join(
        ctx.runDir,
        "screenshots",
        sanitize(ctx.pageEntry.name)
      );
      writeJson(path.join(pageDir, "a11y-violations.json"), summary);
    }

    return {
      audit: this.name,
      page: ctx.pageEntry.name,
      passed: violations.length === 0,
      severity: violations.length === 0 ? "pass" : "warning",
      message:
        violations.length === 0
          ? "0 violations"
          : `${violations.length} violation(s)`,
      details: {
        violationCount: violations.length,
        violations: violations.map((v) => ({
          rule: v.id,
          impact: v.impact,
          description: v.description,
          elements: v.nodes.length,
        })),
      },
    };
  },
};
