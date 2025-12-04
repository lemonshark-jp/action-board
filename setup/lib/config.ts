// 設定型定義・変換

import { parse as parseJsoncLib, printParseErrorCode } from "jsonc-parser";
import { z } from "zod";

/**
 * TeamConfig のZodスキーマ
 * HEXカラーは#付きの3桁または6桁形式
 */
export const TeamConfigSchema = z.object({
  team: z.object({
    id: z.string().min(1, "team.id is required"),
    name: z.string().min(1, "team.name is required"),
    description: z.string().optional(),
  }),
  colors: z.object({
    primary: z
      .string()
      .regex(
        /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
        "primary must be a valid hex color (e.g., #FFF or #FFFFFF)",
      ),
    secondary: z
      .string()
      .regex(
        /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
        "secondary must be a valid hex color",
      )
      .optional(),
    accent: z
      .string()
      .regex(
        /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
        "accent must be a valid hex color",
      )
      .optional(),
    accentLight: z
      .string()
      .regex(
        /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
        "accentLight must be a valid hex color",
      )
      .optional(),
  }),
  features: z
    .object({
      missions: z.boolean().optional(),
      ranking: z.boolean().optional(),
      achievements: z.boolean().optional(),
    })
    .optional(),
  site: z
    .object({
      url: z.string().url("site.url must be a valid URL").optional(),
      email: z.string().email("site.email must be a valid email").optional(),
    })
    .optional(),
});

export type TeamConfig = z.infer<typeof TeamConfigSchema>;

export interface EnvConfig {
  NEXT_PUBLIC_TEAM_ID: string;
  NEXT_PUBLIC_TEAM_NAME: string;
  NEXT_PUBLIC_PRIMARY_COLOR: string;
  NEXT_PUBLIC_SECONDARY_COLOR?: string;
  NEXT_PUBLIC_ACCENT_COLOR?: string;
  NEXT_PUBLIC_ACCENT_LIGHT_COLOR?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_SUPPORT_EMAIL?: string;
}

export function teamConfigToEnv(config: TeamConfig): EnvConfig {
  return {
    NEXT_PUBLIC_TEAM_ID: config.team.id,
    NEXT_PUBLIC_TEAM_NAME: config.team.name,
    NEXT_PUBLIC_PRIMARY_COLOR: config.colors.primary,
    NEXT_PUBLIC_SECONDARY_COLOR: config.colors.secondary,
    NEXT_PUBLIC_ACCENT_COLOR: config.colors.accent,
    NEXT_PUBLIC_ACCENT_LIGHT_COLOR: config.colors.accentLight,
    NEXT_PUBLIC_SITE_URL: config.site?.url,
    NEXT_PUBLIC_SUPPORT_EMAIL: config.site?.email,
  };
}

/**
 * JSONC文字列をパースする
 * jsonc-parserライブラリを使用して安全にパース
 */
export function parseJsonc(content: string): unknown {
  const errors: import("jsonc-parser").ParseError[] = [];
  const result = parseJsoncLib(content, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => {
        const line = content.substring(0, e.offset).split("\n").length;
        return `Line ${line}: ${printParseErrorCode(e.error)}`;
      })
      .join("\n");
    throw new Error(`Failed to parse JSONC:\n${errorMessages}`);
  }

  return result;
}

/**
 * JSONC文字列をパースしてTeamConfigとしてバリデーション
 */
export function parseTeamConfig(content: string): TeamConfig {
  const parsed = parseJsonc(content);
  const result = TeamConfigSchema.safeParse(parsed);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid team config:\n${errorMessages}`);
  }

  return result.data;
}
