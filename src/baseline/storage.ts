import path from "path";
import fs from "fs";
import type { RunResult } from "../types/index.js";
import { log } from "../utils/logger.js";

const BASELINE_FILENAME = "baseline.json";

export function saveBaseline(result: RunResult, outputDir: string): void {
  const baselinePath = path.join(outputDir, BASELINE_FILENAME);
  fs.writeFileSync(baselinePath, JSON.stringify(result, null, 2));
  log.success(`Baseline saved: ${baselinePath}`);
}

export function loadBaseline(outputDir: string): RunResult | null {
  const baselinePath = path.join(outputDir, BASELINE_FILENAME);
  if (!fs.existsSync(baselinePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(baselinePath, "utf-8"));
  } catch {
    log.warn("Failed to parse baseline file");
    return null;
  }
}

export function baselineExists(outputDir: string): boolean {
  return fs.existsSync(path.join(outputDir, BASELINE_FILENAME));
}
