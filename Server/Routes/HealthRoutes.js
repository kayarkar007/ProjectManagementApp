const express = require("express");
const router = express.Router();
const databaseManager = require("../config/database");
const { asyncHandler } = require("../middleware/errorHandler");

// Basic health check
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const healthCheck = {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };

    res.status(200).json(healthCheck);
  })
);

// Detailed health check
router.get(
  "/detailed",
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    // Database health check
    const dbHealth = await databaseManager.healthCheck();

    // System information
    const os = require("os");
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
    };

    // Process information
    const processInfo = {
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
    };

    // Check if all required environment variables are set
    const requiredEnvVars = ["NODE_ENV", "MONGODB_URI", "JWT_SECRET", "PORT"];

    const envCheck = requiredEnvVars.reduce((acc, envVar) => {
      acc[envVar] = !!process.env[envVar];
      return acc;
    }, {});

    const healthCheck = {
      status: dbHealth.status === "healthy" ? "OK" : "DEGRADED",
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      database: dbHealth,
      system: systemInfo,
      process: processInfo,
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        port: process.env.PORT || 5000,
        requiredEnvVars: envCheck,
      },
      services: {
        database: dbHealth.status === "healthy",
        api: true,
      },
    };

    const statusCode = healthCheck.status === "OK" ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  })
);

// Database health check
router.get(
  "/database",
  asyncHandler(async (req, res) => {
    const dbHealth = await databaseManager.healthCheck();
    const statusCode = dbHealth.status === "healthy" ? 200 : 503;

    res.status(statusCode).json({
      status: dbHealth.status,
      message: dbHealth.message,
      timestamp: new Date().toISOString(),
      details: dbHealth,
    });
  })
);

// Memory usage check
router.get(
  "/memory",
  asyncHandler(async (req, res) => {
    const memoryUsage = process.memoryUsage();
    const os = require("os");

    const memoryInfo = {
      process: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      system: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: (
          ((os.totalmem() - os.freemem()) / os.totalmem()) *
          100
        ).toFixed(2),
      },
      timestamp: new Date().toISOString(),
    };

    // Check if memory usage is high (warning threshold: 80%)
    const memoryPercentage = parseFloat(memoryInfo.system.percentage);
    const statusCode =
      memoryPercentage > 90 ? 503 : memoryPercentage > 80 ? 200 : 200;

    res.status(statusCode).json(memoryInfo);
  })
);

// CPU usage check
router.get(
  "/cpu",
  asyncHandler(async (req, res) => {
    const startUsage = process.cpuUsage();

    // Wait a bit to measure CPU usage
    await new Promise((resolve) => setTimeout(resolve, 100));

    const endUsage = process.cpuUsage(startUsage);
    const os = require("os");

    const cpuInfo = {
      process: {
        user: endUsage.user,
        system: endUsage.system,
        total: endUsage.user + endUsage.system,
      },
      system: {
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
        model: os.cpus()[0]?.model || "Unknown",
      },
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(cpuInfo);
  })
);

// Disk usage check
router.get(
  "/disk",
  asyncHandler(async (req, res) => {
    const fs = require("fs").promises;
    const path = require("path");

    try {
      const appDir = process.cwd();
      const stats = await fs.stat(appDir);

      const diskInfo = {
        appDirectory: appDir,
        size: stats.size,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(diskInfo);
    } catch (error) {
      res.status(500).json({
        error: "Failed to get disk information",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// Service dependencies check
router.get(
  "/dependencies",
  asyncHandler(async (req, res) => {
    const dependencies = {
      database: {
        status: "checking",
        connection: null,
      },
      redis: {
        status: "not_configured",
        connection: null,
      },
      email: {
        status: process.env.EMAIL_USER ? "configured" : "not_configured",
        service: process.env.EMAIL_SERVICE || "not_set",
      },
      ssl: {
        status: process.env.NODE_ENV === "production" ? "required" : "optional",
      },
    };

    // Check database
    try {
      const dbHealth = await databaseManager.healthCheck();
      dependencies.database.status =
        dbHealth.status === "healthy" ? "connected" : "disconnected";
      dependencies.database.connection = dbHealth.connectionInfo;
    } catch (error) {
      dependencies.database.status = "error";
      dependencies.database.error = error.message;
    }

    // Check Redis if configured
    if (process.env.REDIS_URL) {
      try {
        const redis = require("redis");
        const client = redis.createClient({ url: process.env.REDIS_URL });
        await client.connect();
        await client.ping();
        await client.disconnect();
        dependencies.redis.status = "connected";
      } catch (error) {
        dependencies.redis.status = "error";
        dependencies.redis.error = error.message;
      }
    }

    const allHealthy = Object.values(dependencies).every(
      (dep) =>
        dep.status === "connected" ||
        dep.status === "configured" ||
        dep.status === "optional"
    );

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? "healthy" : "unhealthy",
      dependencies,
      timestamp: new Date().toISOString(),
    });
  })
);

// Readiness probe for Kubernetes
router.get(
  "/ready",
  asyncHandler(async (req, res) => {
    const dbHealth = await databaseManager.healthCheck();

    if (dbHealth.status === "healthy") {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        reason: "Database not connected",
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// Liveness probe for Kubernetes
router.get(
  "/live",
  asyncHandler(async (req, res) => {
    res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  })
);

module.exports = router;
