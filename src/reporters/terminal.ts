import chalk from "chalk";
import type { RunResult } from "../types/index.js";

export function reportTerminal(result: RunResult): void {
  const { summary } = result;

  console.log("");
  console.log(chalk.bold("─".repeat(60)));
  console.log(chalk.bold("  Summary"));
  console.log(chalk.bold("─".repeat(60)));
  console.log("");

  console.log(`  Total audits:  ${summary.totalAudits}`);
  console.log(
    `  ${chalk.green("✓ Passed:")}      ${summary.passed}`
  );

  if (summary.failed > 0) {
    console.log(
      `  ${chalk.red("✗ Failed:")}      ${summary.failed}`
    );
  }
  if (summary.warnings > 0) {
    console.log(
      `  ${chalk.yellow("⚠ Warnings:")}    ${summary.warnings}`
    );
  }
  if (summary.skipped > 0) {
    console.log(
      `  ${chalk.dim("○ Skipped:")}     ${summary.skipped}`
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
    console.log(chalk.red.bold("  Failed Audits:"));
    for (const audit of failedAudits) {
      console.log(
        chalk.red(`    ✗ ${audit.page} → ${audit.audit}: ${audit.message}`)
      );
    }
    console.log("");
  }

  // Exit status hint
  if (summary.failed > 0) {
    console.log(
      chalk.red.bold(`  Result: FAIL (${summary.failed} failure(s))`)
    );
  } else if (summary.warnings > 0) {
    console.log(
      chalk.yellow.bold(`  Result: PASS with ${summary.warnings} warning(s)`)
    );
  } else {
    console.log(chalk.green.bold("  Result: PASS"));
  }

  console.log("");
}
