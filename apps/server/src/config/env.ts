import path from "path";

import dotenv from "dotenv";

import { ENVIRONMENT } from "@/enums/env";

const NODE_ENV =
  (process.env["NODE_ENV"] as ENVIRONMENT) ?? ENVIRONMENT.DEVELOPMENT;

dotenv.config({
  path: path.resolve(
    process.cwd(),
    NODE_ENV === ENVIRONMENT.DEVELOPMENT ? ".env" : `.env.${NODE_ENV}`,
  ),
});

function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.trim();
}

function getOptionalEnvVariable(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export const env = {
  NODE_ENV,
  PORT: Number(getEnvVariable("PORT")),
  IS_DEVELOPMENT: NODE_ENV === ENVIRONMENT.DEVELOPMENT,
  IS_PRODUCTION: NODE_ENV === ENVIRONMENT.PRODUCTION,
  IS_STAGING: NODE_ENV === ENVIRONMENT.STAGING,
  LOG_LEVEL: getEnvVariable("LOG_LEVEL"),
  DATABASE_URL: getEnvVariable("DATABASE_URL"),
  JWT_ACCESS_SECRET: getEnvVariable("JWT_ACCESS_SECRET"),
  JWT_ACCESS_EXPIRY: getEnvVariable("JWT_ACCESS_EXPIRY"),
  COOKIE_SECRET: getEnvVariable("COOKIE_SECRET"),
  RESEND_API_KEY: getEnvVariable("RESEND_API_KEY"),
  EMAIL_FROM: getEnvVariable("EMAIL_FROM"),
  EMAIL_PROVIDER: getEnvVariable("EMAIL_PROVIDER"),
  STORAGE_PROVIDER: getEnvVariable("STORAGE_PROVIDER"),
  // R2 — optional, required only when STORAGE_PROVIDER=r2
  R2_ENDPOINT: getOptionalEnvVariable("R2_ENDPOINT"),
  R2_ACCESS_KEY_ID: getOptionalEnvVariable("R2_ACCESS_KEY_ID"),
  R2_SECRET_ACCESS_KEY: getOptionalEnvVariable("R2_SECRET_ACCESS_KEY"),
  R2_BUCKET: getOptionalEnvVariable("R2_BUCKET"),
  // Supabase Storage — optional, required only when STORAGE_PROVIDER=supabase
  SUPABASE_URL: getOptionalEnvVariable("SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: getOptionalEnvVariable("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_STORAGE_BUCKET: getOptionalEnvVariable("SUPABASE_STORAGE_BUCKET"),

  WHATSAPP_PROVIDER: getEnvVariable("WHATSAPP_PROVIDER"),
  INTERAKT_API_KEY: getEnvVariable("INTERAKT_API_KEY"),
} as const;
