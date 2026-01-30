import type { RunResult } from "../types/index.js";
import type { WebguardConfig } from "../config/schema.js";
import type { Reporter } from "../plugins/types.js";
import { reportJson } from "./json.js";
import { reportTerminal } from "./terminal.js";
import { reportHtml } from "./html.js";
import { reportJunit } from "./junit.js";
import { reportScreenshots } from "./screenshot.js";
import { log } from "../utils/logger.js";

export async function runReporters(
  result: RunResult,
  config: WebguardConfig,
  runDir: string,
  pluginReporters: Reporter[] = []
): Promise<void> {
  const formats = config.output.formats;

  if (formats.includes("terminal")) {
    reportTerminal(result);
  }

  log.dim("  Output:");

  if (formats.includes("json")) {
    reportJson(result, runDir);
  }

  if (formats.includes("html")) {
    reportHtml(result, runDir);
  }

  if (formats.includes("junit")) {
    reportJunit(result, runDir);
  }

  if (config.output.screenshots) {
    reportScreenshots(result);
  }

  // Plugin reporters
  for (const reporter of pluginReporters) {
    try {
      await reporter.run(result, runDir, config);
      log.dim(`  ${reporter.name}: done`);
    } catch (err) {
      log.warn(`Reporter '${reporter.name}' failed: ${(err as Error).message}`);
    }
  }

  log.plain("");
}
