import { defineConfig } from "webguard";

export default defineConfig({
  baseURL: "https://example.com",

  pages: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ],

  auth: {
    method: "none",
  },

  audits: {
    httpStatus: true,
    contentVisibility: true,
    accessibility: true,
    lighthouse: false,
    brokenLinks: false,
    consoleErrors: true,
  },

  retry: {
    maxRetries: 3,
    delayMs: 5000,
  },

  output: {
    dir: "./webguard-results",
    formats: ["terminal", "html", "json"],
    screenshots: true,
  },
});
