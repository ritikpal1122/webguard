import { defineConfig } from "webguard";

export default defineConfig({
  baseURL: "https://example.com",

  pages: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ],

  audits: {
    httpStatus: true,
    contentVisibility: true,
    accessibility: true,
    consoleErrors: true,
  },

  output: {
    dir: "./webguard-results",
    formats: ["terminal", "html", "json"],
    screenshots: true,
  },
});
