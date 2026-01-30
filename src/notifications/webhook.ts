import type { NotificationChannel } from "./types.js";

export interface WebhookOptions {
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
  onlyOnFailure?: boolean;
}

export function createWebhookNotifier(
  url: string,
  options: WebhookOptions = {}
): NotificationChannel {
  return {
    name: `webhook:${new URL(url).hostname}`,
    async send(result, config) {
      if (options.onlyOnFailure && result.summary.failed === 0) return;

      await fetch(url, {
        method: options.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: JSON.stringify({
          tool: "webguard",
          status: result.summary.failed > 0 ? "fail" : "pass",
          baseURL: config.baseURL,
          timestamp: result.timestamp,
          summary: result.summary,
        }),
      });
    },
  };
}
