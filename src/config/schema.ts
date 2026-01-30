import { z } from "zod";

const AuthApiLoginSchema = z.object({
  method: z.literal("api-login"),
  loginUrl: z.string().url(),
  payload: z.record(z.string()),
  headers: z.record(z.string()).optional(),
});

const AuthFormLoginSchema = z.object({
  method: z.literal("form-login"),
  loginUrl: z.string().url(),
  fields: z.array(
    z.object({
      selector: z.string(),
      value: z.string(),
    })
  ),
  submitSelector: z.string(),
  waitAfterLogin: z.string().optional(),
});

const AuthCookieSchema = z.object({
  method: z.literal("cookie"),
  cookies: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      domain: z.string(),
      path: z.string().default("/"),
    })
  ),
});

const AuthBearerSchema = z.object({
  method: z.literal("bearer-token"),
  token: z.string(),
});

const AuthNoneSchema = z.object({
  method: z.literal("none"),
});

const AuthSchema = z.discriminatedUnion("method", [
  AuthApiLoginSchema,
  AuthFormLoginSchema,
  AuthCookieSchema,
  AuthBearerSchema,
  AuthNoneSchema,
]);

const PageSchema = z.object({
  name: z.string(),
  path: z.string(),
  expectedStatus: z.number().default(200),
  skipAudits: z.array(z.string()).optional(),
});

const LighthouseThresholdsSchema = z
  .object({
    performance: z.number().min(0).max(100).default(50),
    accessibility: z.number().min(0).max(100).default(90),
    bestPractices: z.number().min(0).max(100).default(80),
    seo: z.number().min(0).max(100).default(80),
  })
  .partial();

export const WebguardConfigSchema = z.object({
  baseURL: z.string().url(),

  pages: z.array(PageSchema).min(1),

  auth: AuthSchema.default({ method: "none" }),

  // Open record — built-in keys have defaults, custom audit keys are allowed
  audits: z
    .record(z.string(), z.boolean())
    .default({
      httpStatus: true,
      contentVisibility: true,
      accessibility: true,
      lighthouse: false,
      brokenLinks: false,
      consoleErrors: true,
    }),

  // Custom audits defined inline in config
  customAudits: z.array(z.any()).default([]),

  // Plugins — objects or string paths to npm packages / local files
  plugins: z.array(z.any()).default([]),

  wcagTags: z
    .array(z.string())
    .default(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]),

  lighthouseThresholds: LighthouseThresholdsSchema.default({}),

  retry: z
    .object({
      maxRetries: z.number().min(1).default(3),
      delayMs: z.number().min(0).default(5000),
    })
    .default({}),

  runner: z
    .object({
      concurrency: z.number().min(1).default(1),
      failFast: z.boolean().default(false),
    })
    .default({}),

  browser: z
    .object({
      headless: z.boolean().default(true),
      timeout: z.number().default(60000),
      viewport: z
        .object({
          width: z.number().default(1280),
          height: z.number().default(720),
        })
        .default({}),
    })
    .default({}),

  output: z
    .object({
      dir: z.string().default("./webguard-results"),
      formats: z
        .array(z.enum(["terminal", "html", "json", "junit"]))
        .default(["terminal", "html", "json"]),
      screenshots: z.boolean().default(true),
      screenshotOnFailOnly: z.boolean().default(false),
    })
    .default({}),

  baseline: z
    .object({
      enabled: z.boolean().default(false),
      updateOnPass: z.boolean().default(true),
    })
    .default({}),

  notifications: z.array(z.any()).default([]),
});

export type WebguardConfig = z.infer<typeof WebguardConfigSchema>;
export type PageEntry = z.infer<typeof PageSchema>;
export type AuthConfig = z.infer<typeof AuthSchema>;
export type AuditsConfig = WebguardConfig["audits"];
