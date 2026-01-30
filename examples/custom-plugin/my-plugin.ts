import type { WebguardPlugin } from "webguard";
import fs from "fs";
import path from "path";

const myPlugin: WebguardPlugin = {
  name: "my-plugin",

  audits: [
    {
      name: "noJsErrors",
      description: "Ensure no uncaught JS errors appear in the page",
      async run(ctx) {
        const errors = ctx.consoleMessages.filter(
          (m) => m.type === "error" && m.text.includes("Uncaught")
        );
        return {
          audit: "noJsErrors",
          page: ctx.pageEntry.name,
          passed: errors.length === 0,
          severity: errors.length > 0 ? "fail" : "pass",
          message:
            errors.length > 0
              ? `${errors.length} uncaught error(s)`
              : "No uncaught errors",
          details: errors.map((e) => e.text),
        };
      },
    },
  ],

  reporters: [
    {
      name: "csv",
      run(result, runDir) {
        const lines = ["page,audit,severity,message,duration"];
        for (const page of result.pages) {
          for (const audit of page.audits) {
            lines.push(
              `"${page.page}","${audit.audit}","${audit.severity}","${audit.message}",${audit.duration ?? 0}`
            );
          }
        }
        fs.writeFileSync(path.join(runDir, "results.csv"), lines.join("\n"));
      },
    },
  ],

  hooks: {
    beforeAll({ config }) {
      console.log(`[my-plugin] Auditing ${config.baseURL}`);
    },
    afterAll({ result }) {
      console.log(
        `[my-plugin] Done: ${result.summary.passed} passed, ${result.summary.failed} failed`
      );
    },
  },
};

export default myPlugin;
