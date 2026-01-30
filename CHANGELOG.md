# Changelog

## 0.1.0 (Unreleased)

### Features

- HTTP status check for all configured pages
- Content visibility verification (body rendered, elements visible)
- WCAG accessibility audit via axe-core (2.0/2.1 Level A & AA)
- Lighthouse performance, accessibility, best practices, and SEO audit (opt-in)
- Broken links detection (crawl page links, check for 4xx/5xx)
- Console error capture (browser console.error and console.warn)
- Generic auth system: API login, form login, cookie injection, bearer token
- Retry logic with configurable attempts and delay
- Per-page screenshot capture (pass and fail)
- Reporters: terminal (colored), HTML (self-contained), JSON
- CLI: `webguard init`, `webguard run`, `webguard report`
- TypeScript config with `defineConfig()` and full autocomplete
