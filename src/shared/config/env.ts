// src/shared/config/env.ts

/**
 * Get a required environment variable, throwing on missing values.
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Strictly typed environment variables accessor.
 * Provides compile-time safety for required env vars.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ?? "",
  N8N_API_KEY: process.env.N8N_API_KEY ?? "",
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;