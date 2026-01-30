import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "bin/cli": "src/bin/cli.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  outDir: "dist",
  target: "node18",
  shims: true,
  banner({ format }) {
    if (format === "cjs") {
      return { js: "#!/usr/bin/env node" };
    }
    return {};
  },
});
