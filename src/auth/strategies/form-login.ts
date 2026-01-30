import { chromium } from "playwright";
import path from "path";
import { ensureDir } from "../../utils/fs.js";
import type { AuthResult } from "../index.js";

interface FormLoginConfig {
  method: "form-login";
  loginUrl: string;
  fields: Array<{ selector: string; value: string }>;
  submitSelector: string;
  waitAfterLogin?: string;
}

export async function formLogin(
  config: FormLoginConfig,
  outputDir: string
): Promise<AuthResult> {
  const authDir = path.join(outputDir, ".auth");
  ensureDir(authDir);
  const storagePath = path.join(authDir, "storageState.json");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(config.loginUrl);

  for (const field of config.fields) {
    await page.fill(field.selector, field.value);
  }

  await page.click(config.submitSelector);

  if (config.waitAfterLogin) {
    if (config.waitAfterLogin.startsWith("http")) {
      await page.waitForURL(config.waitAfterLogin);
    } else {
      await page.waitForSelector(config.waitAfterLogin);
    }
  } else {
    await page.waitForLoadState("networkidle");
  }

  await context.storageState({ path: storagePath });
  await browser.close();

  return { storageStatePath: storagePath };
}
