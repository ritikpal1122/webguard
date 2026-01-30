import type { WebguardPlugin } from "./types.js";
import { log } from "../utils/logger.js";

export async function loadPlugins(
  pluginEntries: Array<WebguardPlugin | string>
): Promise<WebguardPlugin[]> {
  const plugins: WebguardPlugin[] = [];

  for (const entry of pluginEntries) {
    if (typeof entry === "string") {
      try {
        const { createJiti } = await import("jiti");
        const jiti = createJiti(import.meta.url);
        const mod = await jiti.import(entry);
        const plugin = (mod as any).default ?? mod;
        plugins.push(plugin as WebguardPlugin);
        log.dim(`  Loaded plugin: ${plugin.name ?? entry}`);
      } catch (err) {
        log.warn(`Failed to load plugin '${entry}': ${(err as Error).message}`);
      }
    } else {
      plugins.push(entry);
    }
  }

  return plugins;
}
