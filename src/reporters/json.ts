import path from "path";
import type { RunResult } from "../types/index.js";
import { writeJson } from "../utils/fs.js";
import { log } from "../utils/logger.js";

export function reportJson(result: RunResult, runDir: string): void {
  const filePath = path.join(runDir, "results.json");
  writeJson(filePath, result);
  log.dim(`  JSON report: ${filePath}`);
}
