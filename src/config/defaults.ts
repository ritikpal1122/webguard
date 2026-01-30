import { z } from "zod";
import { WebguardConfigSchema, type WebguardConfig } from "./schema.js";

type WebguardConfigInput = z.input<typeof WebguardConfigSchema>;

export function defineConfig(config: WebguardConfigInput): WebguardConfig {
  return WebguardConfigSchema.parse(config);
}
