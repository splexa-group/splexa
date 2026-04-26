import { FastifyServerOptions } from "fastify";

import { ENV } from "./env";

type LoggerConfig = FastifyServerOptions["logger"];

const developmentLogger: LoggerConfig = {
  level: ENV.logLevel,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss",
      ignore: "pid,hostname",
      messageFormat: "{msg} {reqId}",
      singleLine: true,
    },
  },
};

const productionLogger: LoggerConfig = {
  level: ENV.logLevel,
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
        stack: error.stack || "",
      };
    },
  },
};

const loggerConfig: Record<string, LoggerConfig> = {
  development: developmentLogger,
  staging: developmentLogger,
  production: productionLogger,
};

export const logger = loggerConfig[ENV.NODE_ENV] ?? developmentLogger;
