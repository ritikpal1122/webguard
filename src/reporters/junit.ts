import fs from "fs";
import path from "path";
import type { RunResult, PageResult, AuditResult } from "../types/index.js";
import { ensureDir } from "../utils/fs.js";
import { log } from "../utils/logger.js";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildTestCase(audit: AuditResult): string {
  const name = escapeXml(`${audit.page} - ${audit.audit}`);
  const time = audit.duration ? (audit.duration / 1000).toFixed(3) : "0.000";

  if (audit.severity === "pass") {
    return `    <testcase name="${name}" classname="${escapeXml(audit.page)}" time="${time}" />\n`;
  }

  if (audit.severity === "skip") {
    return `    <testcase name="${name}" classname="${escapeXml(audit.page)}" time="${time}">\n      <skipped message="${escapeXml(audit.message)}" />\n    </testcase>\n`;
  }

  const tag = audit.severity === "fail" ? "failure" : "failure";
  return `    <testcase name="${name}" classname="${escapeXml(audit.page)}" time="${time}">\n      <${tag} message="${escapeXml(audit.message)}" type="${escapeXml(audit.severity)}">${escapeXml(audit.message)}</${tag}>\n    </testcase>\n`;
}

function buildTestSuite(page: PageResult, index: number): string {
  const tests = page.audits.length;
  const failures = page.audits.filter((a) => a.severity === "fail").length;
  const skipped = page.audits.filter((a) => a.severity === "skip").length;
  const time = (page.duration / 1000).toFixed(3);

  let xml = `  <testsuite name="${escapeXml(page.page)}" tests="${tests}" failures="${failures}" skipped="${skipped}" time="${time}" id="${index}">\n`;
  for (const audit of page.audits) {
    xml += buildTestCase(audit);
  }
  xml += `  </testsuite>\n`;
  return xml;
}

export function reportJunit(result: RunResult, runDir: string): void {
  const { summary } = result;
  const time = (summary.duration / 1000).toFixed(3);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="webguardx" tests="${summary.totalAudits}" failures="${summary.failed}" skipped="${summary.skipped}" time="${time}">\n`;

  result.pages.forEach((page, i) => {
    xml += buildTestSuite(page, i);
  });

  xml += `</testsuites>\n`;

  const filePath = path.join(runDir, "results.xml");
  ensureDir(runDir);
  fs.writeFileSync(filePath, xml, "utf-8");
  log.dim(`  JUnit report: ${filePath}`);
}
