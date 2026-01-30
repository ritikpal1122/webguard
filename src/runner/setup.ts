import path from "path";
import { ensureDir, cleanDir } from "../utils/fs.js";

export interface RunDirs {
  runDir: string;
  screenshotsDir: string;
}

export function setupRunDirectory(outputBaseDir: string): RunDirs {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(outputBaseDir, `run-${timestamp}`);
  const screenshotsDir = path.join(runDir, "screenshots");

  // Clean previous runs
  cleanDir(outputBaseDir);

  // Create fresh directories
  ensureDir(screenshotsDir);

  return { runDir, screenshotsDir };
}
