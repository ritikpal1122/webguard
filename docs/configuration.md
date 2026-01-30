# Configuration Reference

Full reference for `webguard.config.ts`.

## Minimal Config

```ts
import { defineConfig } from "webguardx";

export default defineConfig({
  baseURL: "https://example.com",
  pages: [{ name: "Home", path: "/" }],
});
```

## Full Config

```ts
import { defineConfig } from "webguardx";

export default defineConfig({
  // Required: base URL for all pages
  baseURL: "https://example.com",

  // Required: at least one page
  pages: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about", expectedStatus: 200 },
    { name: "Login", path: "/login", skipAudits: ["accessibility"] },
  ],

  // Auth strategy (default: none)
  auth: { method: "none" },

  // Toggle audits on/off
  audits: {
    httpStatus: true,
    contentVisibility: true,
    accessibility: true,
    lighthouse: false,
    brokenLinks: false,
    consoleErrors: true,
  },

  // Custom audits (inline Audit objects)
  customAudits: [],

  // Plugins (objects or npm package names)
  plugins: [],

  // WCAG tags for accessibility audit
  wcagTags: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],

  // Lighthouse score thresholds
  lighthouseThresholds: {
    performance: 50,
    accessibility: 90,
    bestPractices: 80,
    seo: 80,
  },

  // Retry on navigation failure
  retry: { maxRetries: 3, delayMs: 5000 },

  // Runner settings
  runner: {
    concurrency: 1,   // Pages to audit in parallel
    failFast: false,   // Stop on first failure
  },

  // Browser settings
  browser: {
    headless: true,
    timeout: 60000,
    viewport: { width: 1280, height: 720 },
  },

  // Output settings
  output: {
    dir: "./webguard-results",
    formats: ["terminal", "html", "json"],  // also: "junit"
    screenshots: true,
    screenshotOnFailOnly: false,
  },

  // Baseline comparison
  baseline: {
    enabled: false,
    updateOnPass: true,
  },

  // Notification channels
  notifications: [],
});
```

## Config Formats

webguard supports these config file formats (searched in order):
1. `webguard.config.ts`
2. `webguard.config.js`
3. `webguard.config.mjs`
4. `webguard.config.json`

TypeScript configs are loaded at runtime via jiti — no build step required.
