import express, { NextFunction, Request, Response } from "express";

import { logger } from "./config/logger.js";
import { httpLogger } from "./config/http-logger.js";
import { testConnection } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import bodyParser from "body-parser";

const app = express();

app.use(express.json());
app.use(httpLogger);
app.use(bodyParser.json())

// Health check endpoint (checks both server and database)
app.get("/health-check", async (_req: Request, res: Response) => {
  const isDbConnected = await testConnection();

  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    message: isDbConnected ? "Application and database are healthy" : "Database connection failed",
    status: isDbConnected ? "UP" : "DOWN",
    database: isDbConnected ? "CONNECTED" : "DISCONNECTED",
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);

// 404 Not Found handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  logger.info(`Server is running on port ${PORT}`);
  await testConnection();
});
