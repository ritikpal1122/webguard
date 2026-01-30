import fs from "fs";
import path from "path";
import type { RunResult, PageResult, AuditResult } from "../types/index.js";
import { ensureDir } from "../utils/fs.js";
import { log } from "../utils/logger.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function severityIcon(severity: string): string {
  switch (severity) {
    case "pass":
      return "&#x2713;";
    case "fail":
      return "&#x2717;";
    case "warning":
      return "&#x26A0;";
    case "skip":
      return "&#x25CB;";
    default:
      return "?";
  }
}

function severityClass(severity: string): string {
  return `severity-${severity}`;
}

function renderAuditRow(audit: AuditResult): string {
  return `
    <tr class="${severityClass(audit.severity)}">
      <td class="icon">${severityIcon(audit.severity)}</td>
      <td>${escapeHtml(audit.audit)}</td>
      <td>${escapeHtml(audit.message)}</td>
      <td class="duration">${audit.duration ? `${audit.duration}ms` : "—"}</td>
    </tr>`;
}

function renderPageSection(page: PageResult): string {
  const failCount = page.audits.filter((a) => a.severity === "fail").length;
  const status = failCount > 0 ? "fail" : "pass";

  return `
    <div class="page-section">
      <h2 class="page-header ${status}">
        <span class="page-name">${escapeHtml(page.page)}</span>
        <span class="page-path">${escapeHtml(page.path)}</span>
        <span class="page-duration">${(page.duration / 1000).toFixed(1)}s</span>
      </h2>
      <table class="audit-table">
        <thead>
          <tr>
            <th class="icon-col"></th>
            <th>Audit</th>
            <th>Result</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${page.audits.map(renderAuditRow).join("")}
        </tbody>
      </table>
    </div>`;
}

function buildHtml(result: RunResult): string {
  const { summary } = result;
  const overallStatus =
    summary.failed > 0 ? "FAIL" : summary.warnings > 0 ? "PASS (with warnings)" : "PASS";
  const statusClass = summary.failed > 0 ? "fail" : summary.warnings > 0 ? "warning" : "pass";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webguard Report — ${escapeHtml(result.config.baseURL)}</title>
  <style>
    :root {
      --pass: #22c55e;
      --fail: #ef4444;
      --warning: #f59e0b;
      --skip: #94a3b8;
      --bg: #0f172a;
      --surface: #1e293b;
      --text: #e2e8f0;
      --text-dim: #94a3b8;
      --border: #334155;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }

    .container { max-width: 900px; margin: 0 auto; }

    header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    header .meta {
      color: var(--text-dim);
      font-size: 0.875rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: var(--surface);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      border: 1px solid var(--border);
    }

    .summary-card .value {
      font-size: 2rem;
      font-weight: 700;
    }

    .summary-card .label {
      font-size: 0.75rem;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .summary-card.pass .value { color: var(--pass); }
    .summary-card.fail .value { color: var(--fail); }
    .summary-card.warning .value { color: var(--warning); }
    .summary-card.skip .value { color: var(--skip); }

    .overall-status {
      text-align: center;
      font-size: 1.25rem;
      font-weight: 700;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .overall-status.pass { background: rgba(34,197,94,0.15); color: var(--pass); }
    .overall-status.fail { background: rgba(239,68,68,0.15); color: var(--fail); }
    .overall-status.warning { background: rgba(245,158,11,0.15); color: var(--warning); }

    .page-section {
      background: var(--surface);
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .page-header {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border);
    }

    .page-header.fail { border-left: 4px solid var(--fail); }
    .page-header.pass { border-left: 4px solid var(--pass); }

    .page-name { font-weight: 600; }
    .page-path { color: var(--text-dim); font-size: 0.875rem; }
    .page-duration { margin-left: auto; color: var(--text-dim); font-size: 0.875rem; }

    .audit-table {
      width: 100%;
      border-collapse: collapse;
    }

    .audit-table th {
      text-align: left;
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-dim);
      border-bottom: 1px solid var(--border);
    }

    .audit-table td {
      padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border);
    }

    .audit-table tr:last-child td { border-bottom: none; }

    .icon-col { width: 40px; }
    .icon { text-align: center; font-size: 1.1rem; }
    .duration { color: var(--text-dim); font-size: 0.875rem; }

    .severity-pass .icon { color: var(--pass); }
    .severity-fail .icon { color: var(--fail); }
    .severity-warning .icon { color: var(--warning); }
    .severity-skip .icon { color: var(--skip); }

    footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      color: var(--text-dim);
      font-size: 0.75rem;
    }

    footer a { color: var(--text-dim); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Webguard Report</h1>
      <div class="meta">
        ${escapeHtml(result.config.baseURL)} &bull;
        ${escapeHtml(result.timestamp)} &bull;
        ${result.config.auditsEnabled.join(", ")}
      </div>
    </header>

    <div class="overall-status ${statusClass}">${overallStatus}</div>

    <div class="summary-grid">
      <div class="summary-card">
        <div class="value">${summary.totalAudits}</div>
        <div class="label">Total</div>
      </div>
      <div class="summary-card pass">
        <div class="value">${summary.passed}</div>
        <div class="label">Passed</div>
      </div>
      <div class="summary-card fail">
        <div class="value">${summary.failed}</div>
        <div class="label">Failed</div>
      </div>
      <div class="summary-card warning">
        <div class="value">${summary.warnings}</div>
        <div class="label">Warnings</div>
      </div>
      <div class="summary-card skip">
        <div class="value">${summary.skipped}</div>
        <div class="label">Skipped</div>
      </div>
      <div class="summary-card">
        <div class="value">${(summary.duration / 1000).toFixed(1)}s</div>
        <div class="label">Duration</div>
      </div>
    </div>

    ${result.pages.map(renderPageSection).join("")}

    <footer>
      Generated by <a href="https://github.com/webguard">webguard</a>
    </footer>
  </div>
</body>
</html>`;
}

export function reportHtml(result: RunResult, runDir: string): void {
  const filePath = path.join(runDir, "report.html");
  ensureDir(runDir);
  fs.writeFileSync(filePath, buildHtml(result), "utf-8");
  log.dim(`  HTML report: ${filePath}`);
}
