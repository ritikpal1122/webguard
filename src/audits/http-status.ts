import type { Audit, AuditContext } from "./index.js";
import type { AuditResult } from "../types/index.js";

export const HttpStatusAudit: Audit = {
  name: "httpStatus",
  description: "Verify the page returns the expected HTTP status code",

  async run(ctx: AuditContext): Promise<AuditResult> {
    const status = ctx.navigationResponse?.status() ?? 0;
    const expected = ctx.pageEntry.expectedStatus ?? 200;

    return {
      audit: this.name,
      page: ctx.pageEntry.name,
      passed: status === expected,
      severity: status === expected ? "pass" : "fail",
      message:
        status === expected
          ? `HTTP ${status} OK`
          : `Expected HTTP ${expected}, got ${status}`,
      details: { status, expected },
    };
  },
};
