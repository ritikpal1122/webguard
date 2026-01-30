import type { Audit, AuditContext } from "./index.js";
import type { AuditResult } from "../types/index.js";

export const BrokenLinksAudit: Audit = {
  name: "brokenLinks",
  description: "Find broken links (4xx/5xx) on the page",

  async run(ctx: AuditContext): Promise<AuditResult> {
    const links: string[] = await ctx.page.$$eval("a[href]", (anchors) =>
      anchors
        .map((a) => a.getAttribute("href"))
        .filter((href): href is string => !!href)
    );

    const baseOrigin = new URL(ctx.config.baseURL).origin;
    const uniqueLinks = [
      ...new Set(
        links
          .map((href) => {
            try {
              return new URL(href, ctx.config.baseURL).href;
            } catch {
              return null;
            }
          })
          .filter(
            (url): url is string =>
              !!url &&
              (url.startsWith("http://") || url.startsWith("https://"))
          )
      ),
    ];

    const broken: Array<{ url: string; status: number }> = [];

    for (const url of uniqueLinks) {
      try {
        const response = await ctx.page.request.head(url, { timeout: 10000 });
        if (response.status() >= 400) {
          broken.push({ url, status: response.status() });
        }
      } catch {
        broken.push({ url, status: 0 });
      }
    }

    return {
      audit: this.name,
      page: ctx.pageEntry.name,
      passed: broken.length === 0,
      severity: broken.length > 0 ? "warning" : "pass",
      message:
        broken.length === 0
          ? `All ${uniqueLinks.length} links valid`
          : `${broken.length} broken link(s) of ${uniqueLinks.length}`,
      details: { totalLinks: uniqueLinks.length, broken },
    };
  },
};
