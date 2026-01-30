import type { RunResult } from "../types/index.js";
import type { WebguardConfig } from "../config/schema.js";
import type { NotificationChannel } from "./types.js";
import { log } from "../utils/logger.js";

export type { NotificationChannel } from "./types.js";
export { createWebhookNotifier } from "./webhook.js";
export type { WebhookOptions } from "./webhook.js";
export { createSlackNotifier } from "./slack.js";
export type { SlackOptions } from "./slack.js";

export async function sendNotifications(
  channels: NotificationChannel[],
  result: RunResult,
  config: WebguardConfig
): Promise<void> {
  for (const channel of channels) {
    try {
      await channel.send(result, config);
      log.dim(`  Notification sent: ${channel.name}`);
    } catch (err) {
      log.warn(
        `Notification '${channel.name}' failed: ${(err as Error).message}`
      );
    }
  }
}
