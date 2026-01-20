import { NextResponse } from "next/server";
import { db } from "@/db";
import { apiRequestsLog, contractCollectionExecutions } from "@/db/schema";
import { sql, eq, and, gte, lte, desc, inArray, isNotNull } from "drizzle-orm";

const validateDate = (dateStr: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const edrpouCode = searchParams.get("edrpouCode");

    // Валідація дат
    if (startDate && !validateDate(startDate)) {
      return NextResponse.json(
        { success: false, error: "Invalid startDate format. Use YYYY-MM-DD format" },
        { status: 400 }
      );
    }
    if (endDate && !validateDate(endDate)) {
      return NextResponse.json(
        { success: false, error: "Invalid endDate format. Use YYYY-MM-DD format" },
        { status: 400 }
      );
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return NextResponse.json(
          { success: false, error: "startDate must be before or equal to endDate" },
          { status: 400 }
        );
      }
    }

    // Базові умови фільтрації
    const conditions = [];
    if (startDate) {
      conditions.push(gte(apiRequestsLog.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(apiRequestsLog.createdAt, endDate));
    }
    if (edrpouCode) {
      conditions.push(eq(apiRequestsLog.edrpouCode, edrpouCode));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Отримуємо список існуючих execution IDs
    const existingExecutions = await db
      .select({ id: contractCollectionExecutions.id })
      .from(contractCollectionExecutions);

    const executionIds = existingExecutions.map((e) => e.id);

    // Додаємо умову фільтрації по існуючим executions
    // Враховуємо тільки записи з executionId, які існують в таблиці executions
    const finalConditions = [...(conditions || [])];
    if (executionIds.length > 0) {
      // Фільтруємо тільки записи з існуючими executionId (не null і в списку)
      finalConditions.push(isNotNull(apiRequestsLog.executionId));
      finalConditions.push(inArray(apiRequestsLog.executionId, executionIds));
    } else {
      // Якщо немає executions, повертаємо нульові метрики
      finalConditions.push(sql`1 = 0`); // Неможлива умова
    }

    const finalWhereClause = finalConditions.length > 0 ? and(...finalConditions) : undefined;

    // Загальна статистика (тільки по існуючим executions)
    const totalStats = await db
      .select({
        totalRequests: sql<number>`count(*)`.as("total_requests"),
        successfulRequests: sql<number>`count(*) filter (where ${apiRequestsLog.success} = true)`.as("successful_requests"),
        failedRequests: sql<number>`count(*) filter (where ${apiRequestsLog.success} = false)`.as("failed_requests"),
        avgResponseTime: sql<number>`avg(${apiRequestsLog.responseTime})`.as("avg_response_time"),
        totalContracts: sql<number>`sum(${apiRequestsLog.contractsCount})`.as("total_contracts"),
        totalPages: sql<number>`sum(${apiRequestsLog.totalPages})`.as("total_pages"),
      })
      .from(apiRequestsLog)
      .where(finalWhereClause);

    // Топ помилок (тільки по існуючим executions)
    const errorConditions = [...finalConditions, eq(apiRequestsLog.success, false)];
    const topErrors = await db
      .select({
        errorMessage: apiRequestsLog.errorMessage,
        count: sql<number>`count(*)`.as("count"),
        statusCode: apiRequestsLog.statusCode,
      })
      .from(apiRequestsLog)
      .where(and(...errorConditions))
      .groupBy(apiRequestsLog.errorMessage, apiRequestsLog.statusCode)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(10);

    const stats = totalStats[0];

    return NextResponse.json({
      success: true,
      summary: {
        totalRequests: Number(stats?.totalRequests || 0),
        successfulRequests: Number(stats?.successfulRequests || 0),
        failedRequests: Number(stats?.failedRequests || 0),
        successRate: stats?.totalRequests
          ? ((Number(stats.successfulRequests) / Number(stats.totalRequests)) * 100).toFixed(2)
          : "0.00",
        avgResponseTime: stats?.avgResponseTime ? Math.round(Number(stats.avgResponseTime)) : 0,
        totalContracts: Number(stats?.totalContracts || 0),
        totalPages: Number(stats?.totalPages || 0),
      },
      topErrors: topErrors.map((error) => ({
        errorMessage: error.errorMessage,
        count: Number(error.count),
        statusCode: error.statusCode,
      })),
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch metrics";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};
