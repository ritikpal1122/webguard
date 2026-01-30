# Plugin System

Plugins let you extend webguard with custom audits, reporters, and lifecycle hooks — without modifying the framework source code.

## Plugin Structure

A plugin is a plain object implementing the `WebguardPlugin` interface:

```ts
import type { WebguardPlugin } from "webguardx";

const myPlugin: WebguardPlugin = {
  name: "my-plugin",

  // Custom audits
  audits: [
    {
      name: "seoMetaTags",
      description: "Check for essential SEO meta tags",
      async run(ctx) {
        const title = await ctx.page.title();
        const description = await ctx.page.$eval(
          'meta[name="description"]',
          (el) => el.getAttribute("content")
        ).catch(() => null);

        const passed = !!title && !!description;
        return {
          audit: "seoMetaTags",
          page: ctx.pageEntry.name,
          passed,
          severity: passed ? "pass" : "warning",
          message: passed
            ? "Title and description present"
            : `Missing: ${!title ? "title" : ""} ${!description ? "description" : ""}`.trim(),
        };
      },
    },
  ],

  // Custom reporters
  reporters: [
    {
      name: "csv-export",
      run(result, runDir) {
        // Write CSV file to runDir
      },
    },
  ],

  // Lifecycle hooks
  hooks: {
    beforeAll({ config, browserContext }) {
      console.log(`Starting audit of ${config.baseURL}`);
    },
    afterPage({ pageEntry, pageResult }) {
      console.log(`Finished ${pageEntry.name}: ${pageResult.audits.length} audits`);
    },
  },
};

export default myPlugin;
```

## Using Plugins

### Inline (object)

```ts
import { defineConfig } from "webguardx";
import myPlugin from "./my-plugin";

export default defineConfig({
  baseURL: "https://example.com",
  pages: [{ name: "Home", path: "/" }],
  plugins: [myPlugin],
});
```

### From npm package

```ts
plugins: ["webguard-plugin-seo", "webguard-plugin-slack"],
```

### From local file path

```ts
plugins: ["./plugins/my-custom-plugin.ts"],
```

## Lifecycle Hooks

| Hook | When it runs | Context |
|------|-------------|---------|
| `beforeAll` | After browser launch, before any pages | `{ config, browserContext }` |
| `afterAll` | After all pages complete | `{ config, result }` |
| `beforePage` | After page is created, before navigation | `{ config, pageEntry, page }` |
| `afterPage` | After all audits on a page | `{ config, pageEntry, pageResult }` |
| `beforeAudit` | Before each audit runs | `{ audit, auditContext }` |
| `afterAudit` | After each audit completes | `{ audit, result }` |

## Controlling Audit Toggles

Plugin-provided audits are enabled by default. Disable them in the `audits` config:

```ts
audits: {
  httpStatus: true,
  seoMetaTags: false,  // Disable the plugin audit
},
```
