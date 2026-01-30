import type { Audit, AuditContext } from "./index.js";
import type { AuditResult } from "../types/index.js";

export const ContentVisibilityAudit: Audit = {
  name: "contentVisibility",
  description: "Verify the page has visible rendered content",

  async run(ctx: AuditContext): Promise<AuditResult> {
    const { page } = ctx;

    const bodyVisible = await page
      .locator("body")
      .isVisible()
      .catch(() => false);

    if (!bodyVisible) {
      return {
        audit: this.name,
        page: ctx.pageEntry.name,
        passed: false,
        severity: "fail",
        message: "Page body is not visible",
        details: { bodyVisible: false, textLength: 0, elementCount: 0 },
      };
    }

    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    const textLength = bodyText.trim().length;

    const elementCount = await page
      .locator(
        "body h1, body h2, body p, body main, body div, body section, body nav, body header"
      )
      .count();

    const passed = textLength > 0 && elementCount > 0;

    return {
      audit: this.name,
      page: ctx.pageEntry.name,
      passed,
      severity: passed ? "pass" : "fail",
      message: passed
        ? `${elementCount} elements visible`
        : `Content check failed (text: ${textLength} chars, elements: ${elementCount})`,
      details: { bodyVisible: true, textLength, elementCount },
    };
  },
};
