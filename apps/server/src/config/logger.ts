import { FastifyServerOptions } from "fastify";
import pino from "pino";

import { env } from "./env";

type LoggerConfig = FastifyServerOptions["logger"];

const developmentLogger: LoggerConfig = {
  level: env.LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:mm:ss",
      ignore: "pid,hostname",
      messageFormat: "{msg} {reqId}",
      singleLine: true,
    },
  },
};

const productionLogger: LoggerConfig = {
  level: env.LOG_LEVEL,
  serializers: {
    req(request) {
      return {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      };
    },
    res(response) {
      return {
        statusCode: response.statusCode,
        responseTime: response.elapsedTime,
      };
    },
    err(error) {
      return {
        type: error.name,
        message: error.message,
        stack: error.stack ?? "",
      };
    },
  },
};

const loggerByEnv: Record<string, LoggerConfig> = {
  development: developmentLogger,
  staging: developmentLogger,
  production: productionLogger,
};

export const fastifyLogger = loggerByEnv[env.NODE_ENV] ?? developmentLogger;

export const logger = pino({ level: env.LOG_LEVEL });
