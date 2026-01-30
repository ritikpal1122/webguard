export type { BaselineComparison, AuditChange } from "./types.js";
export { saveBaseline, loadBaseline, baselineExists } from "./storage.js";
export { compareRuns } from "./diff.js";
