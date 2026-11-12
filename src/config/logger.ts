import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    timestamp: isProduction ? pino.stdTimeFunctions.isoTime : false,
    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "res.headers['set-cookie']"
        ],
        censor: "[REDACTED]"
    },
    transport: isProduction
        ? undefined
        : {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  ignore: "pid,hostname,time,req,res,responseTime"
              }
          }
});