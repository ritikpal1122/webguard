import { Command } from "commander";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import { loadConfig } from "../config/loader.js";
import { run } from "../runner/index.js";
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

program.parse();
