export type AuditSeverity = "pass" | "warning" | "fail" | "skip";

export interface AuditResult {
  audit: string;
  page: string;
  passed: boolean;
  severity: AuditSeverity;
  message: string;
  details?: unknown;
  duration?: number;
}

export interface PageResult {
  page: string;
  path: string;
  url: string;
  audits: AuditResult[];
  screenshotPath?: string;
  duration: number;
}

export interface RunResult {
  timestamp: string;
  config: {
    baseURL: string;
    totalPages: number;
    auditsEnabled: string[];
  };
  pages: PageResult[];
  summary: {
    totalAudits: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
    duration: number;
  };
}
