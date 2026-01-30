import path from "path";
import fs from "fs";
import { WebguardConfigSchema, type WebguardConfig } from "./schema.js";
import { log } from "../utils/logger.js";

const CONFIG_NAMES = [
  "webguard.config.ts",
  "webguard.config.js",
  "webguard.config.mjs",
  "webguard.config.json",
];

export async function loadConfig(
  configPath?: string
): Promise<WebguardConfig> {
  const resolvedPath = configPath
    ? path.resolve(configPath)
    : findConfigFile();

  if (!resolvedPath) {
    throw new Error(
      `No webguard config found. Run "webguardx init" to create one, or specify --config <path>.`
    );
  }

  log.info(`Loading config from ${path.relative(process.cwd(), resolvedPath)}`);

  let rawConfig: unknown;

  if (resolvedPath.endsWith(".json")) {
    const content = fs.readFileSync(resolvedPath, "utf-8");
    rawConfig = JSON.parse(content);
  } else {
    // Use jiti for runtime TypeScript/ESM loading
    const { createJiti } = await import("jiti");
    const jiti = createJiti(import.meta.url);
    const mod = await jiti.import(resolvedPath);
    rawConfig = (mod as any).default ?? mod;
  }

  const result = WebguardConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid webguard config:\n${errors}`);
  }

  return result.data;
}

function findConfigFile(): string | null {
  const cwd = process.cwd();
  for (const name of CONFIG_NAMES) {
    const fullPath = path.join(cwd, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}
