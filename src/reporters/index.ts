import type { RunResult } from "../types/index.js";
import type { WebguardConfig } from "../config/schema.js";
import { reportJson } from "./json.js";
import { reportTerminal } from "./terminal.js";
import { reportHtml } from "./html.js";
import { reportScreenshots } from "./screenshot.js";
import { log } from "../utils/logger.js";

export async function runReporters(
  result: RunResult,
  config: WebguardConfig,
  runDir: string
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

  if (config.output.screenshots) {
    reportScreenshots(result);
  }

  log.plain("");
}
