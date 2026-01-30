import type { Audit, AuditContext } from "./index.js";
import type { AuditResult } from "../types/index.js";

export const ConsoleErrorsAudit: Audit = {
  name: "consoleErrors",
  description: "Capture browser console errors and warnings",

  async run(ctx: AuditContext): Promise<AuditResult> {
    const messages = ctx.consoleMessages;

    const errors = messages.filter((m) => m.type === "error");
    const warnings = messages.filter((m) => m.type === "warning");

    return {
      audit: this.name,
      page: ctx.pageEntry.name,
      passed: errors.length === 0,
      severity:
        errors.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass",
      message:
        errors.length === 0 && warnings.length === 0
          ? "0 errors"
          : `${errors.length} error(s), ${warnings.length} warning(s)`,
      details: {
        errors: errors.map((e) => e.text),
        warnings: warnings.map((w) => w.text),
      },
    };
  },
};
