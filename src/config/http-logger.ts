import { pinoHttp } from "pino-http";
import { logger } from "./logger.js";

export const httpLogger = pinoHttp({
  logger,
  quietReqLogger: true,
  quietResLogger: true,
  serializers: {
    req: () => undefined,
    res: () => undefined
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return "error";
    }
    if (res.statusCode >= 400) {
      return "warn";
    }
    return "info";
  },
  customSuccessObject: () => ({}),
  customErrorObject: () => ({}),
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`
});
