# Writing Custom Audits

You can add custom audits without creating a full plugin.

## Inline Custom Audit

```ts
import { defineConfig } from "webguard";
import type { Audit } from "webguard";

const checkPageTitle: Audit = {
  name: "pageTitle",
  description: "Ensure every page has a non-empty title",
  async run(ctx) {
    const title = await ctx.page.title();
    return {
      audit: "pageTitle",
      page: ctx.pageEntry.name,
      passed: title.length > 0,
      severity: title.length > 0 ? "pass" : "fail",
      message: title.length > 0 ? `"${title}"` : "Empty title",
    };
  },
};

export default defineConfig({
  baseURL: "https://example.com",
  pages: [{ name: "Home", path: "/" }],
  customAudits: [checkPageTitle],
});
```

## Audit Context

Every audit receives an `AuditContext` with:

```ts
interface AuditContext {
  page: Page;                    // Playwright Page (already navigated)
  browserContext: BrowserContext; // Shared browser context
  pageEntry: PageEntry;          // { name, path, expectedStatus }
  config: WebguardConfig;        // Full config
  runDir: string;                // Output directory for this run
  navigationResponse: Response | null;  // Response from page.goto()
  consoleMessages: Array<{ type: string; text: string }>;
}
```

## Audit Result

Return an `AuditResult`:

```ts
interface AuditResult {
  audit: string;       // Audit name
  page: string;        // Page name
  passed: boolean;     // Pass/fail
  severity: "pass" | "warning" | "fail" | "skip";
  message: string;     // Human-readable result
  details?: unknown;   // Optional structured data
  duration?: number;   // Auto-set by runner
}
```

## Guidelines

- Never throw errors for audit failures — return `{ passed: false, severity: "fail" }`
- Use `severity: "warning"` for non-critical issues
- Use `severity: "skip"` when an audit can't run (e.g., missing dependency)
- Write structured data to `details` for machine consumption
- Use `ctx.runDir` to save additional files (JSON reports, etc.)
