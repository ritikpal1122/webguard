import type { AuthResult } from "../index.js";

export async function noAuth(): Promise<AuthResult | null> {
  return null;
}
