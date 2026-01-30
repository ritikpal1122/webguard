import type { AuthConfig } from "../config/schema.js";
import { apiLogin } from "./strategies/api-login.js";
import { formLogin } from "./strategies/form-login.js";
import { cookieInject } from "./strategies/cookie-inject.js";
import { bearerToken } from "./strategies/bearer-token.js";
import { log } from "../utils/logger.js";

export interface AuthResult {
  storageStatePath: string;
  extraHeaders?: Record<string, string>;
}

export async function authenticate(
  authConfig: AuthConfig,
  outputDir: string
): Promise<AuthResult | null> {
  if (authConfig.method === "none") {
    return null;
  }

  log.info(`Authenticating via ${authConfig.method}...`);

  let result: AuthResult;

  switch (authConfig.method) {
    case "api-login":
      result = await apiLogin(authConfig, outputDir);
      break;
    case "form-login":
      result = await formLogin(authConfig, outputDir);
      break;
    case "cookie":
      result = await cookieInject(authConfig, outputDir);
      break;
    case "bearer-token":
      result = await bearerToken(authConfig, outputDir);
      break;
  }

  log.success("Authenticated successfully");
  return result;
}
