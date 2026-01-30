import type { NotificationChannel } from "./types.js";

export interface SlackOptions {
  channel?: string;
  onlyOnFailure?: boolean;
}

export function createSlackNotifier(
  webhookUrl: string,
  options: SlackOptions = {}
): NotificationChannel {
  return {
    name: "slack",
    async send(result, config) {
      if (options.onlyOnFailure && result.summary.failed === 0) return;

      const color = result.summary.failed > 0 ? "#ef4444" : "#22c55e";
      const status = result.summary.failed > 0 ? "FAIL" : "PASS";
      const { summary } = result;

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: options.channel,
          attachments: [
            {
              color,
              title: `Webguardx: ${status}`,
              title_link: config.baseURL,
              text: `${summary.passed} passed, ${summary.failed} failed, ${summary.warnings} warnings`,
              fields: [
                { title: "Base URL", value: config.baseURL, short: true },
                { title: "Pages", value: `${config.pages.length}`, short: true },
                { title: "Duration", value: `${(summary.duration / 1000).toFixed(1)}s`, short: true },
              ],
              footer: "webguardx",
              ts: Math.floor(Date.now() / 1000),
            },
          ],
        }),
      });
    },
  };
}
