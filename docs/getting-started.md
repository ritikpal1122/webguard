# Getting Started

## Installation

```bash
npm install webguard
```

Install the Playwright browser:

```bash
npx playwright install chromium
```

## Quick Setup

```bash
npx webguard init
```

This creates:
- `webguard.config.ts` — Your config file
- `.env.example` — Template for environment variables
- Updates `.gitignore` to exclude results and `.env`

## Your First Run

1. Edit `webguard.config.ts` with your site URL and pages:

```ts
import { defineConfig } from "webguard";

export default defineConfig({
  baseURL: "https://your-site.com",
  pages: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ],
});
```

2. Run audits:

```bash
npx webguard run
```

3. View results:

```bash
npx webguard report --open
```

## What Gets Audited

By default, webguard runs these audits on every page:

| Audit | What it checks |
|-------|---------------|
| HTTP Status | Page returns 200 OK |
| Content Visibility | Body is visible with meaningful content |
| Accessibility | WCAG 2.0/2.1 via axe-core |
| Console Errors | No `console.error` calls |

Optional audits (disabled by default):
- **Lighthouse** — Performance, SEO, best practices scores
- **Broken Links** — All `<a>` hrefs return valid responses

## Output

Each run creates a timestamped directory in `./webguard-results/`:

```
webguard-results/
  run-2026-01-30T10-30-00/
    results.json     # Machine-readable
    report.html      # Visual report
    results.xml      # JUnit XML (if enabled)
    screenshots/     # Per-page screenshots
```

## Next Steps

- [Configuration Reference](./configuration.md)
- [Auth Strategies](./auth-strategies.md)
- [Writing Custom Audits](./custom-audits.md)
- [Plugin System](./plugins.md)
