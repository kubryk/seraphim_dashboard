import { NextResponse } from "next/server";
import { db } from "@/db";
import { contractCollectionExecutions, apiRequestsLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const executionId = parseInt(id);
    
    if (isNaN(executionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid execution ID" },
        { status: 400 }
      );
    }

    // Отримуємо execution
    const execution = await db
      .select()
      .from(contractCollectionExecutions)
      .where(eq(contractCollectionExecutions.id, executionId))
      .limit(1);

    if (execution.length === 0) {
      return NextResponse.json(
        { success: false, error: "Execution not found" },
        { status: 404 }
      );
    }

    const exec = execution[0];

    // Отримуємо всі запити цього execution
    const requests = await db
      .select()
      .from(apiRequestsLog)
      .where(eq(apiRequestsLog.executionId, executionId))
      .orderBy(apiRequestsLog.createdAt);

    return NextResponse.json({
      success: true,
      execution: {
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
      },
      requests: requests.map((req) => ({
        id: req.id,
        executionId: req.executionId,
        establishmentId: req.establishmentId,
        edrpouCode: req.edrpouCode,
        url: req.url,
        method: req.method,
        startDate: req.startDate,
        endDate: req.endDate,
        page: req.page,
        statusCode: req.statusCode,
        success: req.success,
        contractsCount: req.contractsCount,
        totalPages: req.totalPages,
        totalContracts: req.totalContracts,
        errorMessage: req.errorMessage,
        errorDetails: req.errorDetails,
        responseTime: req.responseTime,
        createdAt: req.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching execution details:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch execution details";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};
