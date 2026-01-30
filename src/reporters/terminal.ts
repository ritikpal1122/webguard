import { c } from "../utils/colors.js";
import type { RunResult } from "../types/index.js";

export function reportTerminal(result: RunResult): void {
  const { summary } = result;

  console.log("");
  console.log(c.bold("─".repeat(60)));
  console.log(c.bold("  Summary"));
  console.log(c.bold("─".repeat(60)));
  console.log("");

  console.log(`  Total audits:  ${summary.totalAudits}`);
  console.log(
    `  ${c.green("✓ Passed:")}      ${summary.passed}`
  );

  if (summary.failed > 0) {
    console.log(
      `  ${c.red("✗ Failed:")}      ${summary.failed}`
    );
  }
  if (summary.warnings > 0) {
    console.log(
      `  ${c.yellow("⚠ Warnings:")}    ${summary.warnings}`
    );
  }
  if (summary.skipped > 0) {
    console.log(
      `  ${c.dim("○ Skipped:")}     ${summary.skipped}`
    );
  }

  console.log(
    `  Duration:      ${(summary.duration / 1000).toFixed(1)}s`
  );
  console.log("");

  // Show failed audits detail
  const failedAudits = result.pages.flatMap((p) =>
    p.audits.filter((a) => a.severity === "fail")
  );

  if (failedAudits.length > 0) {
    console.log(c.bold(c.red("  Failed Audits:")));
    for (const audit of failedAudits) {
      console.log(
        c.red(`    ✗ ${audit.page} → ${audit.audit}: ${audit.message}`)
      );
    }
    console.log("");
  }

  // Exit status hint
  if (summary.failed > 0) {
    console.log(
      c.bold(c.red(`  Result: FAIL (${summary.failed} failure(s))`))
    );
  } else if (summary.warnings > 0) {
    console.log(
      c.bold(c.yellow(`  Result: PASS with ${summary.warnings} warning(s)`))
    );
  } else {
    console.log(c.bold(c.green("  Result: PASS")));
  }

  console.log("");
}
