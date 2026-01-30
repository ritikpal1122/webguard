// Core API
export { defineConfig } from "./config/defaults.js";
export { loadConfig } from "./config/loader.js";
export { run } from "./runner/index.js";

// Types
export type { WebguardConfig, PageEntry, AuthConfig } from "./config/schema.js";
export type { AuditResult, PageResult, RunResult, AuditSeverity } from "./types/index.js";
export type { RunOptions } from "./runner/index.js";
export type { Audit, AuditContext } from "./audits/index.js";

// Audits (for custom composition)
export { HttpStatusAudit } from "./audits/http-status.js";
export { ContentVisibilityAudit } from "./audits/content-visibility.js";
export { AccessibilityAudit } from "./audits/accessibility.js";
export { LighthouseAudit } from "./audits/lighthouse.js";
export { BrokenLinksAudit } from "./audits/broken-links.js";
export { ConsoleErrorsAudit } from "./audits/console-errors.js";
