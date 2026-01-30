export interface BaselineComparison {
  baselineTimestamp: string;
  currentTimestamp: string;
  changes: AuditChange[];
  summary: {
    regressions: number;
    improvements: number;
    unchanged: number;
    newAudits: number;
    removedAudits: number;
  };
}

export interface AuditChange {
  page: string;
  audit: string;
  type: "regression" | "improvement" | "unchanged" | "new" | "removed";
  baseline?: { severity: string; message: string };
  current?: { severity: string; message: string };
}
