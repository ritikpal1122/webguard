import fs from "fs";
import path from "path";
import { ensureDir } from "../../utils/fs.js";
import type { AuthResult } from "../index.js";

interface CookieConfig {
  method: "cookie";
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
  }>;
}

export async function cookieInject(
  config: CookieConfig,
  outputDir: string
): Promise<AuthResult> {
  const authDir = path.join(outputDir, ".auth");
  ensureDir(authDir);
  const storagePath = path.join(authDir, "storageState.json");

  const storageState = {
    cookies: config.cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path || "/",
      expires: -1,
      httpOnly: false,
      secure: true,
      sameSite: "Lax" as const,
    })),
    origins: [],
  };

  fs.writeFileSync(storagePath, JSON.stringify(storageState, null, 2));
  return { storageStatePath: storagePath };
}
