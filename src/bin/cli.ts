import { Command } from "commander";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { loadConfig } from "../config/loader.js";
import { run } from "../runner/index.js";
import { saveBaseline, loadBaseline, compareRuns } from "../baseline/index.js";
import { log } from "../utils/logger.js";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../../package.json", import.meta.url), "utf-8")
);

const program = new Command();

program
  .name("webguard")
  .description("Full-page web audit framework")
  .version(pkg.version);

// ── init ─────────────────────────────────────────────
program
  .command("init")
  .description("Scaffold a webguard config in the current directory")
  .action(async () => {
    const cwd = process.cwd();
    const configPath = path.join(cwd, "webguard.config.ts");

    if (fs.existsSync(configPath)) {
      log.warn("webguard.config.ts already exists. Skipping.");
      return;
    }

    // Copy template files
    const templatesDir = path.resolve(
      new URL("../../templates/init", import.meta.url).pathname
    );

    // Config file
    const templateConfig = path.join(templatesDir, "webguard.config.ts");
    if (fs.existsSync(templateConfig)) {
      fs.copyFileSync(templateConfig, configPath);
      log.success("Created webguard.config.ts");
    } else {
      // Inline fallback
      fs.writeFileSync(
        configPath,
        `import { defineConfig } from "webguard";

export default defineConfig({
  baseURL: "https://example.com",

  pages: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ],

  auth: {
    method: "none",
  },

  audits: {
    httpStatus: true,
    contentVisibility: true,
    accessibility: true,
    lighthouse: false,
    brokenLinks: false,
    consoleErrors: true,
  },

  output: {
    dir: "./webguard-results",
    formats: ["terminal", "html", "json"],
    screenshots: true,
  },
});
`,
        "utf-8"
      );
      log.success("Created webguard.config.ts");
    }

    // .env.example
    const envExampleDest = path.join(cwd, ".env.example");
    if (!fs.existsSync(envExampleDest)) {
      const templateEnv = path.join(templatesDir, ".env.example");
      if (fs.existsSync(templateEnv)) {
        fs.copyFileSync(templateEnv, envExampleDest);
      } else {
        fs.writeFileSync(
          envExampleDest,
          `# Webguard environment variables\n# EMAIL=user@example.com\n# PASSWORD=your-password\n`,
          "utf-8"
        );
      }
      log.success("Created .env.example");
    }

    // Update .gitignore
    const gitignorePath = path.join(cwd, ".gitignore");
    const gitignoreEntries = ["webguard-results/", ".env"];
    if (fs.existsSync(gitignorePath)) {
      const existing = fs.readFileSync(gitignorePath, "utf-8");
      const toAdd = gitignoreEntries.filter(
        (e) => !existing.includes(e)
      );
      if (toAdd.length > 0) {
        fs.appendFileSync(
          gitignorePath,
          `\n# Webguard\n${toAdd.join("\n")}\n`
        );
        log.success("Updated .gitignore");
      }
    } else {
      fs.writeFileSync(
        gitignorePath,
        `node_modules/\n# Webguard\n${gitignoreEntries.join("\n")}\n`,
        "utf-8"
      );
      log.success("Created .gitignore");
    }

    console.log("");
    log.info("Next steps:");
    log.plain("  1. Edit webguard.config.ts with your pages & auth");
    log.plain("  2. Run: npx webguard run");
    console.log("");
  });

// ── run ──────────────────────────────────────────────
program
  .command("run")
  .description("Run all audits")
  .option("-c, --config <path>", "Path to config file")
  .option("--headed", "Run browser in headed mode")
  .option(
    "--pages <names>",
    "Comma-separated page names to audit",
    (val: string) => val.split(",").map((s) => s.trim())
  )
  .option(
    "--audits <names>",
    "Comma-separated audit names to run",
    (val: string) => val.split(",").map((s) => s.trim())
  )
  .option("--diff", "Compare results with saved baseline")
  .action(async (opts) => {
    try {
      // Load dotenv from cwd
      const dotenv = await import("dotenv");
      dotenv.config();

      console.log("");
      console.log(
        chalk.bold(`  webguard ${chalk.dim(`v${pkg.version}`)}`)
      );
      console.log("");

      const config = await loadConfig(opts.config);

      const result = await run(config, {
        headed: opts.headed,
        pagesFilter: opts.pages,
        auditsFilter: opts.audits,
      });

      // Baseline comparison
      if (opts.diff || config.baseline.enabled) {
        const outputDir = path.resolve(config.output.dir);
        const baseline = loadBaseline(outputDir);
        if (baseline) {
          const comparison = compareRuns(baseline, result);
          console.log(chalk.bold("  Baseline Comparison:"));
          if (comparison.summary.regressions > 0) {
            console.log(chalk.red(`    ${comparison.summary.regressions} regression(s)`));
          }
          if (comparison.summary.improvements > 0) {
            console.log(chalk.green(`    ${comparison.summary.improvements} improvement(s)`));
          }
          console.log(chalk.dim(`    ${comparison.summary.unchanged} unchanged`));
          if (comparison.summary.newAudits > 0) {
            console.log(chalk.blue(`    ${comparison.summary.newAudits} new audit(s)`));
          }
          console.log("");
        } else {
          log.dim("  No baseline found. Run 'webguard baseline save' to create one.");
        }

        // Auto-save baseline if all pass
        if (config.baseline.updateOnPass && result.summary.failed === 0) {
          saveBaseline(result, path.resolve(config.output.dir));
        }
      }

      // Exit with non-zero if any audits failed
      if (result.summary.failed > 0) {
        process.exit(1);
      }
    } catch (err) {
      log.error((err as Error).message);
      process.exit(1);
    }
  });

// ── report ───────────────────────────────────────────
program
  .command("report")
  .description("Open or regenerate the HTML report from the last run")
  .option("-c, --config <path>", "Path to config file")
  .option("--open", "Open the report in default browser")
  .action(async (opts) => {
    try {
      const config = await loadConfig(opts.config);
      const outputDir = path.resolve(config.output.dir);

      if (!fs.existsSync(outputDir)) {
        log.error(`No output directory found at ${outputDir}`);
        process.exit(1);
      }

      // Find the latest run directory
      const runs = fs
        .readdirSync(outputDir)
        .filter((d) => d.startsWith("run-"))
        .sort()
        .reverse();

      if (runs.length === 0) {
        log.error("No runs found. Run 'webguard run' first.");
        process.exit(1);
      }

      const latestRun = path.join(outputDir, runs[0]);
      const htmlReport = path.join(latestRun, "report.html");
      const jsonReport = path.join(latestRun, "results.json");

      if (!fs.existsSync(htmlReport) && fs.existsSync(jsonReport)) {
        // Regenerate HTML from JSON
        const { reportHtml } = await import("../reporters/html.js");
        const result = JSON.parse(fs.readFileSync(jsonReport, "utf-8"));
        reportHtml(result, latestRun);
        log.success("Regenerated HTML report");
      }

      if (fs.existsSync(htmlReport)) {
        log.info(`Report: ${htmlReport}`);

        if (opts.open) {
          const { exec } = await import("child_process");
          const openCmd =
            process.platform === "darwin"
              ? "open"
              : process.platform === "win32"
                ? "start"
                : "xdg-open";
          exec(`${openCmd} "${htmlReport}"`);
        }
      } else {
        log.error("No HTML report found. Run 'webguard run' first.");
        process.exit(1);
      }
    } catch (err) {
      log.error((err as Error).message);
      process.exit(1);
    }
  });

// ── validate ─────────────────────────────────────────
program
  .command("validate")
  .description("Validate config file without running audits")
  .option("-c, --config <path>", "Path to config file")
  .action(async (opts) => {
    try {
      const config = await loadConfig(opts.config);
      log.success("Config is valid");
      log.info(`Base URL: ${config.baseURL}`);
      log.info(`Pages:    ${config.pages.length}`);
      log.info(`Audits:   ${Object.entries(config.audits).filter(([, v]) => v).map(([k]) => k).join(", ")}`);
      if (config.plugins.length > 0) {
        log.info(`Plugins:  ${config.plugins.length}`);
      }
    } catch (err) {
      log.error((err as Error).message);
      process.exit(1);
    }
  });

// ── baseline ─────────────────────────────────────────
const baselineCmd = program
  .command("baseline")
  .description("Manage baseline for regression comparison");

baselineCmd
  .command("save")
  .description("Save the latest run as baseline")
  .option("-c, --config <path>", "Path to config file")
  .action(async (opts) => {
    try {
      const config = await loadConfig(opts.config);
      const outputDir = path.resolve(config.output.dir);

      // Find latest run
      const runs = fs
        .readdirSync(outputDir)
        .filter((d) => d.startsWith("run-"))
        .sort()
        .reverse();

      if (runs.length === 0) {
        log.error("No runs found. Run 'webguard run' first.");
        process.exit(1);
      }

      const latestRun = path.join(outputDir, runs[0]);
      const jsonReport = path.join(latestRun, "results.json");

      if (!fs.existsSync(jsonReport)) {
        log.error("No results.json found in latest run.");
        process.exit(1);
      }

      const result = JSON.parse(fs.readFileSync(jsonReport, "utf-8"));
      saveBaseline(result, outputDir);
    } catch (err) {
      log.error((err as Error).message);
      process.exit(1);
    }
  });

baselineCmd
  .command("show")
  .description("Show current baseline summary")
  .option("-c, --config <path>", "Path to config file")
  .action(async (opts) => {
    try {
      const config = await loadConfig(opts.config);
      const outputDir = path.resolve(config.output.dir);
      const baseline = loadBaseline(outputDir);

      if (!baseline) {
        log.info("No baseline saved yet.");
        return;
      }

      log.info(`Baseline from: ${baseline.timestamp}`);
      log.info(`Pages: ${baseline.pages.length}`);
      log.info(
        `Results: ${baseline.summary.passed} passed, ${baseline.summary.failed} failed, ${baseline.summary.warnings} warnings`
      );
    } catch (err) {
      log.error((err as Error).message);
      process.exit(1);
    }
  });

// ── diff ─────────────────────────────────────────────
program
  .command("diff")
  .description("Compare the latest run with the baseline")
  .option("-c, --config <path>", "Path to config file")
  .action(async (opts) => {
    try {
      const config = await loadConfig(opts.config);
      const outputDir = path.resolve(config.output.dir);

      const baseline = loadBaseline(outputDir);
      if (!baseline) {
        log.error("No baseline found. Run 'webguard baseline save' first.");
        process.exit(1);
      }

      // Find latest run
      const runs = fs
        .readdirSync(outputDir)
        .filter((d) => d.startsWith("run-"))
        .sort()
        .reverse();

      if (runs.length === 0) {
        log.error("No runs found. Run 'webguard run' first.");
        process.exit(1);
      }

      const latestRun = path.join(outputDir, runs[0]);
      const jsonReport = path.join(latestRun, "results.json");

      if (!fs.existsSync(jsonReport)) {
        log.error("No results.json found in latest run.");
        process.exit(1);
      }

      const current = JSON.parse(fs.readFileSync(jsonReport, "utf-8"));
      const comparison = compareRuns(baseline, current);

      console.log("");
      console.log(chalk.bold("  Baseline Comparison"));
      console.log(chalk.dim(`  ${comparison.baselineTimestamp} → ${comparison.currentTimestamp}`));
      console.log("");

      if (comparison.summary.regressions > 0) {
        console.log(chalk.red.bold(`  Regressions: ${comparison.summary.regressions}`));
        for (const c of comparison.changes.filter((x) => x.type === "regression")) {
          console.log(chalk.red(`    ✗ ${c.page} → ${c.audit}: ${c.baseline?.severity} → ${c.current?.severity}`));
        }
        console.log("");
      }

      if (comparison.summary.improvements > 0) {
        console.log(chalk.green.bold(`  Improvements: ${comparison.summary.improvements}`));
        for (const c of comparison.changes.filter((x) => x.type === "improvement")) {
          console.log(chalk.green(`    ✓ ${c.page} → ${c.audit}: ${c.baseline?.severity} → ${c.current?.severity}`));
        }
        console.log("");
      }

      console.log(chalk.dim(`  Unchanged: ${comparison.summary.unchanged}`));
      if (comparison.summary.newAudits > 0) {
        console.log(chalk.blue(`  New audits: ${comparison.summary.newAudits}`));
      }
      if (comparison.summary.removedAudits > 0) {
        console.log(chalk.yellow(`  Removed audits: ${comparison.summary.removedAudits}`));
      }
      console.log("");
    } catch (err) {
      log.error((err as Error).message);
      process.exit(1);
    }
  });

program.parse();
