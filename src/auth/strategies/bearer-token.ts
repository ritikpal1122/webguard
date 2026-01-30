import fs from "fs";
import path from "path";
import { ensureDir } from "../../utils/fs.js";
import type { AuthResult } from "../index.js";

interface BearerConfig {
  method: "bearer-token";
  token: string;
}

export async function bearerToken(
  config: BearerConfig,
  outputDir: string
): Promise<AuthResult> {
  const authDir = path.join(outputDir, ".auth");
  ensureDir(authDir);
  const storagePath = path.join(authDir, "storageState.json");

  fs.writeFileSync(
    storagePath,
    JSON.stringify({ cookies: [], origins: [] })
  );

  return {
    storageStatePath: storagePath,
    extraHeaders: { Authorization: `Bearer ${config.token}` },
  };
}
