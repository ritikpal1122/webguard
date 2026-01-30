import type { RunResult } from "../types/index.js";
import { log } from "../utils/logger.js";

export function reportScreenshots(result: RunResult): void {
  const captured = result.pages.filter((p) => p.screenshotPath);
  if (captured.length > 0) {
    log.dim(`  Screenshots:  ${captured.length} page(s) captured`);
  }
}
