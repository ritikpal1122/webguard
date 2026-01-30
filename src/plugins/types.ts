import type { Page, BrowserContext } from "playwright";
import type { Audit, AuditContext } from "../audits/index.js";
import type { AuditResult, PageResult, RunResult } from "../types/index.js";
import type { WebguardConfig, PageEntry } from "../config/schema.js";

export interface WebguardPlugin {
  name: string;
  audits?: Audit[];
  reporters?: Reporter[];
  hooks?: Partial<LifecycleHooks>;
}

export interface Reporter {
  name: string;
  run(
    result: RunResult,
    runDir: string,
    config: WebguardConfig
  ): Promise<void> | void;
}

export interface LifecycleHooks {
  beforeAll(ctx: {
    config: WebguardConfig;
    browserContext: BrowserContext;
  }): Promise<void> | void;

  afterAll(ctx: {
    config: WebguardConfig;
    result: RunResult;
  }): Promise<void> | void;

  beforePage(ctx: {
    config: WebguardConfig;
    pageEntry: PageEntry;
    page: Page;
  }): Promise<void> | void;

  afterPage(ctx: {
    config: WebguardConfig;
    pageEntry: PageEntry;
    pageResult: PageResult;
  }): Promise<void> | void;

  beforeAudit(ctx: {
    audit: Audit;
    auditContext: AuditContext;
  }): Promise<void> | void;

  afterAudit(ctx: {
    audit: Audit;
    result: AuditResult;
  }): Promise<void> | void;
}
