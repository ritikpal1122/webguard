import { defineConfig } from "webguard";
import myPlugin from "./my-plugin";

export default defineConfig({
  baseURL: "https://example.com",

  pages: [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ],

  plugins: [myPlugin],

  audits: {
    httpStatus: true,
    contentVisibility: true,
    accessibility: true,
    consoleErrors: true,
  },
});
