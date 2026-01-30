import type { WebguardPlugin, Reporter, LifecycleHooks } from "./types.js";
import type { Audit } from "../audits/index.js";
import { log } from "../utils/logger.js";

export class PluginRegistry {
  private plugins: WebguardPlugin[] = [];

  register(plugin: WebguardPlugin): void {
    this.plugins.push(plugin);
  }

  getPluginAudits(): Audit[] {
    return this.plugins.flatMap((p) => p.audits ?? []);
  }

  getPluginReporters(): Reporter[] {
    return this.plugins.flatMap((p) => p.reporters ?? []);
  }

  async runHook<K extends keyof LifecycleHooks>(
    hookName: K,
    ctx: Parameters<LifecycleHooks[K]>[0]
  ): Promise<void> {
    for (const plugin of this.plugins) {
      const hook = plugin.hooks?.[hookName];
      if (hook) {
        try {
          await (hook as (ctx: any) => Promise<void> | void)(ctx);
        } catch (err) {
          log.warn(
            `Plugin '${plugin.name}' hook '${hookName}' failed: ${(err as Error).message}`
          );
        }
      }
    }
  }
}
