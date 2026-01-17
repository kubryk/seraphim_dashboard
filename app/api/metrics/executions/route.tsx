import { NextResponse } from "next/server";
import { db } from "@/db";
import { contractCollectionExecutions } from "@/db/schema";
import { sql, desc, gte, lte, and } from "drizzle-orm";

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
    
    // Обмеження пагінації: максимум 100 записів, offset не може бути від'ємним
    const requestedLimit = parseInt(searchParams.get("limit") || "50");
    const requestedOffset = parseInt(searchParams.get("offset") || "0");
    const limit = Math.min(Math.max(1, requestedLimit), 100); // Мінімум 1, максимум 100
    const offset = Math.max(0, requestedOffset); // Мінімум 0

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
      conditions.push(gte(contractCollectionExecutions.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(contractCollectionExecutions.createdAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Отримуємо executions
    const executions = await db
      .select()
      .from(contractCollectionExecutions)
      .where(whereClause)
      .orderBy(desc(contractCollectionExecutions.createdAt))
      .limit(limit)
      .offset(offset);

    // Загальна кількість для пагінації
    const totalCount = await db
      .select({
        count: sql<number>`count(*)`.as("count"),
      })
      .from(contractCollectionExecutions)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      executions: executions.map((exec) => ({
        id: exec.id,
        startDate: exec.startDate,
        endDate: exec.endDate,
        establishmentsProcessed: exec.establishmentsProcessed,
        totalRequests: exec.totalRequests,
        successfulRequests: exec.successfulRequests,
        failedRequests: exec.failedRequests,
        totalContractsCollected: exec.totalContractsCollected,
        totalContractsUpdated: exec.totalContractsUpdated,
        totalErrors: exec.totalErrors,
        duration: exec.duration,
        status: exec.status,
        errorMessage: exec.errorMessage,
        errorDetails: exec.errorDetails,
        createdAt: exec.createdAt,
        successRate: (exec.totalRequests ?? 0) > 0
          ? (((exec.successfulRequests ?? 0) / (exec.totalRequests ?? 1)) * 100).toFixed(2)
          : "0.00",
      })),
      total: Number(totalCount[0]?.count || 0),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching executions:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch executions";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};
