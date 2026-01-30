import type { Page, Response } from "playwright";
import { sleep } from "../utils/sleep.js";
import { log } from "../utils/logger.js";

export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
}

export async function navigateWithRetry(
  page: Page,
  url: string,
  retry: RetryConfig,
  waitUntil: "domcontentloaded" | "networkidle" | "load" = "domcontentloaded"
): Promise<Response | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retry.maxRetries; attempt++) {
    try {
      const response = await page.goto(url, {
        waitUntil,
        timeout: 30_000,
      });

      if (response && response.ok()) {
        return response;
      }

      if (attempt < retry.maxRetries) {
        log.warn(
          `Attempt ${attempt}/${retry.maxRetries} for ${url} returned ${response?.status()}. Retrying in ${retry.delayMs / 1000}s...`
        );
        await sleep(retry.delayMs);
      }

      if (attempt === retry.maxRetries) return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retry.maxRetries) {
        log.warn(
          `Attempt ${attempt}/${retry.maxRetries} for ${url} failed. Retrying in ${retry.delayMs / 1000}s...`
        );
        await sleep(retry.delayMs);
      }
    }
  }

  throw (
    lastError ??
    new Error(`Failed to load ${url} after ${retry.maxRetries} attempts`)
  );
}
