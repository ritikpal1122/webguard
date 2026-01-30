import { defineConfig } from "webguardx";
import type { Audit } from "webguardx";

// Custom audit: check that every page has a <h1> tag
const headingAudit: Audit = {
  name: "hasH1",
  description: "Check that every page has an H1 heading",
  async run(ctx) {
    const h1 = await ctx.page.$("h1");
    const text = h1 ? await h1.textContent() : null;
    return {
      audit: "hasH1",
      page: ctx.pageEntry.name,
      passed: !!h1,
      severity: h1 ? "pass" : "warning",
      message: h1 ? `H1: "${text?.trim()}"` : "No H1 found",
    };
  },
};

export default defineConfig({
  baseURL: "https://example.com",

  pages: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ],

  customAudits: [headingAudit],

  audits: {
    httpStatus: true,
    contentVisibility: true,
    accessibility: false,
    consoleErrors: true,
    hasH1: true, // Enable our custom audit
  },
});
