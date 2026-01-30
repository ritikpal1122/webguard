import { defineConfig } from "webguardx";

export default defineConfig({
  baseURL: "https://myapp.com",

  pages: [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Reports", path: "/reports" },
  ],

  auth: {
    method: "form-login",
    loginUrl: "https://myapp.com/login",
    fields: [
      { selector: "#email", value: process.env.EMAIL! },
      { selector: "#password", value: process.env.PASSWORD! },
    ],
    submitSelector: "button[type=submit]",
    waitAfterLogin: "https://myapp.com/dashboard",
  },

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
    screenshotOnFailOnly: true,
  },
});
