import { request } from "playwright";
import path from "path";
import { ensureDir } from "../../utils/fs.js";
import type { AuthResult } from "../index.js";

interface ApiLoginConfig {
  method: "api-login";
  loginUrl: string;
  payload: Record<string, string>;
  headers?: Record<string, string>;
}

export async function apiLogin(
  config: ApiLoginConfig,
  outputDir: string
): Promise<AuthResult> {
  const authDir = path.join(outputDir, ".auth");
  ensureDir(authDir);
  const storagePath = path.join(authDir, "storageState.json");

  const origin = new URL(config.loginUrl).origin;
  const context = await request.newContext({ baseURL: origin });

  const response = await context.post(config.loginUrl, {
    data: config.payload,
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...config.headers,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    await context.dispose();
    throw new Error(`Login failed (HTTP ${response.status()}): ${body}`);
  }

  await context.storageState({ path: storagePath });
  await context.dispose();

  return { storageStatePath: storagePath };
}
