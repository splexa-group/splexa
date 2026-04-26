import path from "path";

import dotenv from "dotenv";

import { ENVIRONMENT } from "@/enums/env";

const environment = process.env.NODE_ENV ?? ENVIRONMENT.DEVELOPMENT;

const isDevelopment = environment === ENVIRONMENT.DEVELOPMENT;

const fileName = isDevelopment ? ".env" : `.env.${environment}`;
const envFilePath = path.resolve(process.cwd(), fileName);

dotenv.config({
  path: envFilePath,
});

function getEnvVariable(name: string): string {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(
      `Environment variable ${name} is required but was not provided.`,
    );
  }
  return value.trim();
}

export const ENV = {
  NODE_ENV: environment,
  port: Number(process.env.PORT),
  isDevelopment: environment === ENVIRONMENT.DEVELOPMENT,
  isProduction: environment === ENVIRONMENT.PRODUCTION,
  isStaging: environment === ENVIRONMENT.STAGING,
  logLevel: process.env.LOG_LEVEL,
  databaseUrl: getEnvVariable("DATABASE_URL"),
};
