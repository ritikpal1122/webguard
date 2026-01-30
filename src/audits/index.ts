import type { Page, BrowserContext, Response } from "playwright";
import type { PageEntry, WebguardConfig } from "../config/schema.js";
import type { AuditResult } from "../types/index.js";

export interface AuditContext {
  page: Page;
  browserContext: BrowserContext;
  pageEntry: PageEntry;
  config: WebguardConfig;
  runDir: string;
  navigationResponse: Response | null;
  consoleMessages: Array<{ type: string; text: string }>;
}

export interface Audit {
  name: string;
  description: string;
  run(ctx: AuditContext): Promise<AuditResult>;
}

import { HttpStatusAudit } from "./http-status.js";
import { ContentVisibilityAudit } from "./content-visibility.js";
import { AccessibilityAudit } from "./accessibility.js";
import { LighthouseAudit } from "./lighthouse.js";
import { BrokenLinksAudit } from "./broken-links.js";
import { ConsoleErrorsAudit } from "./console-errors.js";

const BUILTIN_AUDITS: Record<string, Audit> = {
  httpStatus: HttpStatusAudit,
  contentVisibility: ContentVisibilityAudit,
  accessibility: AccessibilityAudit,
  lighthouse: LighthouseAudit,
  brokenLinks: BrokenLinksAudit,
  consoleErrors: ConsoleErrorsAudit,
};

export function getEnabledAudits(
  auditsConfig: WebguardConfig["audits"]
): Audit[] {
  const enabled: Audit[] = [];
  for (const [name, audit] of Object.entries(BUILTIN_AUDITS)) {
    if (auditsConfig[name as keyof typeof auditsConfig]) {
      enabled.push(audit);
    }
  }
  return enabled;
}

export function getAuditByName(name: string): Audit | undefined {
  return BUILTIN_AUDITS[name];
}
