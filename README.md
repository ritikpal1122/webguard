# webguard

Full-page web audit framework built on Playwright. Run HTTP status, accessibility, performance, broken links, and console error checks across your entire UI with a single command.

## Why webguard?

Web applications break in ways users notice first — slow loads, missing content, broken links, accessibility barriers, and silent JavaScript errors. Manual QA catches some of these, but not consistently across every page, every deploy.

**webguard** automates the entire surface-level health check of your UI:

- **Catch UI regressions before users do** — Run after every deploy to verify all pages load correctly, render visible content, and have zero console errors
- **Shift-left on accessibility** — WCAG 2.0/2.1 audits (axe-core) run on every page automatically, so a11y issues are caught in CI, not by compliance audits months later
- **One config, full coverage** — Define your pages once and webguard runs 6 different audit types on each, instead of maintaining separate scripts for status checks, a11y, broken links, etc.
- **Works behind auth walls** — 5 built-in auth strategies (API login, form login, cookies, bearer token, none) so you can audit protected pages without custom auth scripts
- **Built for CI/CD** — Non-zero exit on failures, JSON output for pipeline integration, HTML reports for human review
- **No test files to maintain** — Unlike Playwright Test or Cypress, there are no `.spec.ts` files. Your config defines pages and webguard handles the rest
- **Real browser, real results** — Powered by Playwright's Chromium, not synthetic HTTP calls. Every audit sees exactly what your users see
- **Detailed evidence** — Full-page screenshots, axe violation JSON, Lighthouse reports, and broken link lists — all timestamped per run

### Who is this for?

| Team | Use Case |
|------|----------|
| **Frontend / UI teams** | Verify every page renders correctly after deploys |
| **QA engineers** | Automated smoke tests across the entire app surface |
| **Accessibility teams** | Continuous WCAG compliance monitoring |
| **DevOps / SRE** | Post-deploy health checks in CI pipelines |
| **Open source maintainers** | Ensure docs/marketing sites stay healthy |

## Features

- **HTTP Status** — Verify every page returns the expected status code
- **Content Visibility** — Ensure pages render visible, meaningful content
- **Accessibility** — WCAG 2.0/2.1 audit via axe-core
- **Lighthouse** — Performance, SEO, best practices scores (optional)
- **Broken Links** — Crawl `<a>` hrefs and detect 404s
- **Console Errors** — Capture `console.error` and `console.warn`
- **Screenshots** — Full-page screenshots per page (pass/fail)
- **Multiple Auth Strategies** — API login, form login, cookie injection, bearer token
- **Reports** — Terminal, HTML, and JSON output

## Quick Start

```bash
# Install
npm install webguardx

# Scaffold a config
npx webguardx init

# Edit webguard.config.ts with your pages

# Run audits
npx webguardx run
```

## Configuration

Create `webguard.config.ts` in your project root:

```ts
import { defineConfig } from "webguardx";

export default defineConfig({
  baseURL: "https://myapp.com",

  pages: [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Settings", path: "/settings" },
    { name: "Profile", path: "/profile" },
  ],

  auth: {
    method: "api-login",
    loginUrl: "https://auth.myapp.com/api/login",
    payload: {
      email: process.env.EMAIL!,
      password: process.env.PASSWORD!,
    },
  },

  audits: {
    httpStatus: true,
    contentVisibility: true,
    accessibility: true,
    lighthouse: false,
    brokenLinks: false,
    consoleErrors: true,
  },

  retry: { maxRetries: 3, delayMs: 5000 },

  output: {
    dir: "./webguard-results",
    formats: ["terminal", "html", "json"],
    screenshots: true,
  },
});
```

## CLI

| Command | Description |
|---------|-------------|
| `webguard init` | Scaffold config file, `.env.example`, update `.gitignore` |
| `webguard run` | Run all audits |
| `webguard run --headed` | Run with visible browser |
| `webguard run --pages "Home,Settings"` | Run specific pages only |
| `webguard run --audits "httpStatus,accessibility"` | Run specific audits only |
| `webguard run --config ./custom.config.ts` | Use custom config path |
| `webguard report` | Show path to latest HTML report |
| `webguard report --open` | Open HTML report in browser |

## Auth Strategies

### API Login (POST)

```ts
auth: {
  method: "api-login",
  loginUrl: "https://auth.example.com/api/login",
  payload: { email: "user@example.com", password: "secret" },
  headers: { "Content-Type": "application/json" },  // optional
}
```

### Form Login

```ts
auth: {
  method: "form-login",
  loginUrl: "https://example.com/login",
  fields: [
    { selector: "#email", value: "user@example.com" },
    { selector: "#password", value: "secret" },
  ],
  submitSelector: "button[type=submit]",
  waitAfterLogin: "https://example.com/dashboard",  // optional URL to wait for
}
```

### Cookie Injection

```ts
auth: {
  method: "cookie",
  cookies: [
    { name: "session", value: "abc123", domain: "example.com", path: "/" },
  ],
}
```

### Bearer Token

```ts
auth: {
  method: "bearer-token",
  token: process.env.AUTH_TOKEN!,
}
```

### No Auth

```ts
auth: {
  method: "none",
}
```

## Audits

### Built-in Audits

| Audit | Key | Default | Description |
|-------|-----|---------|-------------|
| HTTP Status | `httpStatus` | `true` | Checks response status matches `expectedStatus` (default 200) |
| Content Visibility | `contentVisibility` | `true` | Verifies body is visible with meaningful content |
| Accessibility | `accessibility` | `true` | Runs axe-core WCAG audit |
| Lighthouse | `lighthouse` | `false` | Performance, a11y, best practices, SEO scores |
| Broken Links | `brokenLinks` | `false` | HEAD requests all `<a>` hrefs for 404s |
| Console Errors | `consoleErrors` | `true` | Captures `console.error` and `console.warn` |

### Per-Page Configuration

Skip specific audits on individual pages:

```ts
pages: [
  { name: "Home", path: "/" },
  { name: "Login", path: "/login", skipAudits: ["accessibility"] },
  { name: "API Docs", path: "/docs", expectedStatus: 301 },
]
```

### Accessibility Options

```ts
// WCAG tags to check (default: all Level A and AA)
wcagTags: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
```

### Lighthouse Thresholds

```ts
// Install optional deps: npm install lighthouse chrome-launcher
lighthouseThresholds: {
  performance: 50,
  accessibility: 90,
  bestPractices: 80,
  seo: 80,
},
```

## Output

Each run creates a timestamped directory:

```
webguard-results/
  run-2026-01-30T10-30-00/
    results.json        # Machine-readable results
    report.html         # Self-contained HTML report
    screenshots/
      Dashboard/
        page-pass.png
      Settings/
        page-fail.png
```

## Programmatic API

```ts
import { defineConfig, run, loadConfig } from "webguardx";

// Option 1: Define config inline
const config = defineConfig({
  baseURL: "https://example.com",
  pages: [{ name: "Home", path: "/" }],
});

const result = await run(config);
console.log(result.summary);

// Option 2: Load from file
const fileConfig = await loadConfig("./webguard.config.ts");
const result2 = await run(fileConfig);
```

## Terminal Output

```
  webguard v0.1.0

  i Base URL: https://myapp.com
  i Pages:    3
  i Audits:   httpStatus, contentVisibility, accessibility, consoleErrors

  [1/3] Dashboard (/dashboard)
    ✓ httpStatus           200 OK                         12ms
    ✓ contentVisibility    47 elements                     8ms
    ✓ accessibility        0 violations                  892ms
    ✓ consoleErrors        0 errors                        2ms

  [2/3] Settings (/settings)
    ✓ httpStatus           200 OK                         15ms
    ✓ contentVisibility    23 elements                     6ms
    ✗ accessibility        3 violations                  743ms
    ✓ consoleErrors        0 errors                        1ms

  ────────────────────────────────────────────────────────────
    Summary
  ────────────────────────────────────────────────────────────

    Total audits:  8
    ✓ Passed:      7
    ✗ Failed:      1
    Duration:      3.2s

    Result: FAIL (1 failure(s))
```

## Requirements

- Node.js >= 18
- Playwright browsers: `npx playwright install chromium`

## Contributing

Contributions are welcome! Whether it's a bug fix, new audit, plugin, or documentation improvement — all contributions help make webguardx better for everyone.

Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a pull request. It covers:

- Setting up the development environment
- Project structure overview
- How to add a new audit
- Code style and conventions
- Pull request process

If you find a bug or have a feature request, please [open an issue](https://github.com/user/webguard/issues).

## License

MIT
