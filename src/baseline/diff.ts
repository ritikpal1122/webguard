import type { RunResult } from "../types/index.js";
import type { BaselineComparison, AuditChange } from "./types.js";

export function compareRuns(
  baseline: RunResult,
  current: RunResult
): BaselineComparison {
  const changes: AuditChange[] = [];

  // Build lookup maps: "page::audit" -> { severity, message }
  const baselineMap = new Map<string, { severity: string; message: string }>();
  for (const page of baseline.pages) {
    for (const audit of page.audits) {
      baselineMap.set(`${page.page}::${audit.audit}`, {
        severity: audit.severity,
        message: audit.message,
      });
    }
  }

  const currentMap = new Map<string, { severity: string; message: string }>();
  for (const page of current.pages) {
    for (const audit of page.audits) {
      const key = `${page.page}::${audit.audit}`;
      const entry = { severity: audit.severity, message: audit.message };
      currentMap.set(key, entry);

      const prev = baselineMap.get(key);
      if (!prev) {
        changes.push({
          page: page.page,
          audit: audit.audit,
          type: "new",
          current: entry,
        });
      } else if (prev.severity !== audit.severity) {
        const type =
          audit.severity === "pass" || audit.severity === "skip"
            ? "improvement"
            : "regression";
        changes.push({
          page: page.page,
          audit: audit.audit,
          type,
          baseline: prev,
          current: entry,
        });
      } else {
        changes.push({
          page: page.page,
          audit: audit.audit,
          type: "unchanged",
          baseline: prev,
          current: entry,
        });
      }
    }
  }

  // Detect removed audits
  for (const [key, val] of baselineMap) {
    if (!currentMap.has(key)) {
      const [page, audit] = key.split("::");
      changes.push({ page, audit, type: "removed", baseline: val });
    }
  }

  return {
    baselineTimestamp: baseline.timestamp,
    currentTimestamp: current.timestamp,
    changes,
    summary: {
      regressions: changes.filter((c) => c.type === "regression").length,
      improvements: changes.filter((c) => c.type === "improvement").length,
      unchanged: changes.filter((c) => c.type === "unchanged").length,
      newAudits: changes.filter((c) => c.type === "new").length,
      removedAudits: changes.filter((c) => c.type === "removed").length,
    },
  };
}
