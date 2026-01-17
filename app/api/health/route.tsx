import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: "ok" | "error";
      responseTime?: number;
      error?: string;
    };
    environment: {
      status: "ok" | "error";
      missing?: string[];
    };
  };
}

export const GET = async () => {
  const result: HealthCheckResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: "ok" },
      environment: { status: "ok" },
    },
  };

  // Перевірка environment variables
  const requiredEnvVars = ["DATABASE_URL", "API_KEY"];
  const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missingEnvVars.length > 0) {
    result.checks.environment = {
      status: "error",
      missing: missingEnvVars,
    };
    result.status = "unhealthy";
  }

  // Перевірка бази даних
  try {
    const dbStartTime = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbResponseTime = Date.now() - dbStartTime;
    
    result.checks.database = {
      status: "ok",
      responseTime: dbResponseTime,
    };
  } catch (error) {
    result.checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Database connection failed",
    };
    result.status = "unhealthy";
  }

  // Визначення загального статусу
  if (result.status === "healthy" && result.checks.database.responseTime && result.checks.database.responseTime > 1000) {
    result.status = "degraded"; // База даних повільна, але працює
  }

  const statusCode = result.status === "healthy" ? 200 : result.status === "degraded" ? 200 : 503;

  return NextResponse.json(result, { status: statusCode });
};
