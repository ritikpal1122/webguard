import { defineConfig } from "webguard";

export default defineConfig({
  baseURL: "https://myapp.com",

  pages: [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Settings", path: "/settings" },
    { name: "Profile", path: "/profile" },
  ],

  auth: {
    method: "api-login",
    loginUrl: "https://auth.myapp.com/api/login",
    payload: {
      email: process.env.EMAIL!,
      password: process.env.PASSWORD!,
    },
  },

  audits: {
    httpStatus: true,
    contentVisibility: true,
    accessibility: true,
    consoleErrors: true,
  },

  retry: { maxRetries: 3, delayMs: 5000 },

  output: {
    dir: "./webguard-results",
    formats: ["terminal", "html", "json"],
    screenshots: true,
  },
});
