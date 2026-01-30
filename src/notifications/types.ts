import type { RunResult } from "../types/index.js";
import type { WebguardConfig } from "../config/schema.js";

export interface NotificationChannel {
  name: string;
  send(result: RunResult, config: WebguardConfig): Promise<void>;
}
