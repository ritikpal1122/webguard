# Contributing to webguard

Thanks for your interest in contributing to webguard!

## Development Setup

```bash
# Clone the repo
git clone https://github.com/user/webguard.git
cd webguard

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Build
npm run build

# Type check
npm run typecheck
```

## Project Structure

```
src/
  bin/cli.ts            # CLI entry point (commander)
  config/               # Config schema (Zod), loader (jiti), defineConfig
  auth/                 # Auth orchestrator + strategies
  audits/               # Audit interface + built-in audits
  runner/               # Main runner, page runner, retry
  reporters/            # Terminal, HTML, JSON, screenshot reporters
  types/                # TypeScript interfaces
  utils/                # Logger, sleep, sanitize, fs helpers
  index.ts              # Public API exports
```

## Adding a New Audit

1. Create `src/audits/my-audit.ts`:

```ts
import type { Audit, AuditContext } from "./index.js";
import type { AuditResult } from "../types/index.js";

export const MyAudit: Audit = {
  name: "myAudit",
  description: "Description of what this audit checks",

  async run(ctx: AuditContext): Promise<AuditResult> {
    // ctx.page — Playwright Page object
    // ctx.pageEntry — { name, path, expectedStatus }
    // ctx.config — Full WebguardConfig
    // ctx.navigationResponse — Response from page.goto()

    return {
      audit: this.name,
      page: ctx.pageEntry.name,
      passed: true,
      severity: "pass",
      message: "All checks passed",
    };
  },
};
```

2. Register it in `src/audits/index.ts`
3. Add a toggle in `src/config/schema.ts` under the `audits` object
4. Export from `src/index.ts`

## Pull Request Process

1. Fork the repo and create a feature branch
2. Make your changes
3. Run `npm run typecheck` and `npm run build`
4. Open a PR with a clear description of the change

## Code Style

- TypeScript strict mode
- No default exports (except config files)
- Audits return `AuditResult` data — never throw for audit failures
- Use chalk for colored terminal output via the `log` utility
