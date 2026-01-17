import { NextResponse } from "next/server";
import { db } from "@/db";
import { establishments, contracts, apiRequestsLog, contractCollectionExecutions } from "@/db/schema";
import { fetchAllContractsByEdrpou } from "@/lib/prozorro-api";
import { eq, sql } from "drizzle-orm";


const validateDate = (dateStr: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};




export const GET = async (request: Request) => {
  const startTime = Date.now();
  let executionId: number | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const edrpouCode = searchParams.get("edrpouCode") || "01981514,04528425,21103023,42264820,02007517";

    console.log(`🚀 [Contracts Collect] Starting collection process`);
    console.log(`📋 [Contracts Collect] Parameters: startDate=${startDateStr}, endDate=${endDateStr}, edrpouCode=${edrpouCode || 'all'}`);

    // Валідація параметрів дат
    if (!startDateStr || !endDateStr) {
      console.error(`❌ [Contracts Collect] Validation failed: Missing date parameters`);
      return NextResponse.json(
        { success: false, error: "startDate and endDate parameters are required" },
        { status: 400 }
      );
    }

    if (!validateDate(startDateStr) || !validateDate(endDateStr)) {
      console.error(`❌ [Contracts Collect] Validation failed: Invalid date format`);
      return NextResponse.json(
        { success: false, error: "Invalid date format. Use YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate > endDate) {
      console.error(`❌ [Contracts Collect] Validation failed: startDate > endDate`);
      return NextResponse.json(
        { success: false, error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    // Отримуємо всі заклади з їх EDRPOU кодами
    const allEstablishments = await db.select().from(establishments);

    console.log(`🏢 [Contracts Collect] Found ${allEstablishments.length} establishment(s) to process`);

    // Створюємо execution запис на початку процесу
    try {
      const [execution] = await db.insert(contractCollectionExecutions).values({
        startDate: startDateStr,
        endDate: endDateStr,
        establishmentsProcessed: allEstablishments.length,
        status: "running",
        duration: 0,
      }).returning({ id: contractCollectionExecutions.id });
      
      executionId = execution.id;
      console.log(`💾 [Contracts Collect] Execution created with ID: ${executionId}`);
    } catch (error) {
      console.error(`❌ [Contracts Collect] Error creating execution:`, error);
    }

    if (allEstablishments.length === 0) {
      console.log(`⚠️ [Contracts Collect] No establishments found, exiting`);
      // Оновлюємо execution якщо він був створений
      if (executionId) {
        try {
          await db
            .update(contractCollectionExecutions)
            .set({
              status: "success",
              duration: Date.now() - startTime,
            })
            .where(eq(contractCollectionExecutions.id, executionId));
        } catch (error) {
          console.error(`❌ [Contracts Collect] Error updating execution:`, error);
        }
      }
      return NextResponse.json({
        success: true,
        executionId: executionId,
        message: "No establishments found",
        collected: 0,
        errors: 0,
        dateRange: { start: startDateStr, end: endDateStr },
      });
    }

    let totalCollected = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const errors: Array<{ establishmentId: number; error: string }> = [];

    // Затримка між обробкою закладів (в мілісекундах)
    const DELAY_BETWEEN_ESTABLISHMENTS = 1000; // 1 секунда

    const delay = (ms: number): Promise<void> => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };

    // Обробляємо кожен заклад окремо
    for (let i = 0; i < allEstablishments.length; i++) {
      const establishment = allEstablishments[i];
      
      console.log(`🔄 [Contracts Collect] Processing establishment ${i + 1}/${allEstablishments.length}: ID=${establishment.id}, EDRPOU=${establishment.edrpouCode}, Name=${establishment.name}`);
      
      // Затримка перед обробкою закладу (крім першого)
      if (i > 0) {
        console.log(`⏳ [Contracts Collect] Waiting ${DELAY_BETWEEN_ESTABLISHMENTS}ms before next establishment...`);
        await delay(DELAY_BETWEEN_ESTABLISHMENTS);
      }

      try {
        console.log(`🌐 [Contracts Collect] Fetching contracts from Prozorro API for EDRPOU ${establishment.edrpouCode}...`);
        
        // Функція для логування API запитів
        const logRequest = async (logData: {
          establishmentId?: number;
          edrpouCode: string;
          url: string;
          method: string;
          startDate: string;
          endDate: string;
          page: number;
          statusCode?: number;
          success: boolean;
          contractsCount?: number;
          totalPages?: number;
          totalContracts?: number;
          errorMessage?: string;
          errorDetails?: Record<string, unknown>;
          responseTime: number;
        }) => {
          try {
            await db.insert(apiRequestsLog).values({
              executionId: executionId,
              establishmentId: logData.establishmentId,
              edrpouCode: logData.edrpouCode,
              url: logData.url,
              method: logData.method,
              startDate: logData.startDate,
              endDate: logData.endDate,
              page: logData.page,
              statusCode: logData.statusCode,
              success: logData.success,
              contractsCount: logData.contractsCount,
              totalPages: logData.totalPages,
              totalContracts: logData.totalContracts,
              errorMessage: logData.errorMessage,
              errorDetails: logData.errorDetails,
              responseTime: logData.responseTime,
            });
          } catch (error) {
            // Не блокуємо основний процес, якщо логування не вдалося
            console.error(`❌ [Contracts Collect] Error logging API request:`, error);
          }
        };
        
        const prozorroContracts = await fetchAllContractsByEdrpou(
          establishment.edrpouCode,
          startDateStr,
          endDateStr,
          establishment.id,
          logRequest
        );

        if (!prozorroContracts || prozorroContracts.length === 0) {
          console.log(`📭 [Contracts Collect] No contracts found for establishment ${establishment.id} (EDRPOU: ${establishment.edrpouCode})`);
          continue;
        }

        console.log(`📄 [Contracts Collect] Found ${prozorroContracts.length} contract(s) for establishment ${establishment.id}`);

        // Зберігаємо контракти в базу даних
        let establishmentCollected = 0;
        let establishmentUpdated = 0;

        for (let j = 0; j < prozorroContracts.length; j++) {
          const contract = prozorroContracts[j];
          
          try {
            // Оскільки запит робиться для конкретного закладу, всі контракти належать цьому закладу
            const buyerEdrpou = establishment.edrpouCode;
            
            // Перевіряємо, чи контракт вже існує
            const existingContract = await db
              .select()
              .from(contracts)
              .where(eq(contracts.id, contract.id))
              .limit(1);

            const dateModified = new Date().toISOString();

            if (existingContract.length > 0) {
              // Оновлюємо існуючий контракт
              const existing = existingContract[0];
              console.log(`🔄 [Contracts Collect] Updating contract: ID=${contract.id}, ContractID=${contract.contractID || 'N/A'}, Status=${contract.status}, DateSigned=${contract.dateSigned}`);
              console.log(`   Previous: Status=${existing.status}, DateSigned=${existing.dateSigned || 'N/A'}, DateModified=${existing.dateModified || 'N/A'}`);
              
              await db
                .update(contracts)
                .set({
                  dateSigned: contract.dateSigned,
                  dateModified: dateModified,
                  status: contract.status,
                  buyerEdrpou: buyerEdrpou,
                  updatedAt: sql`now()`,
                })
                .where(eq(contracts.id, contract.id));
              totalUpdated++;
              establishmentUpdated++;
            } else {
              // Створюємо новий контракт
              await db.insert(contracts).values({
                id: contract.id,
                buyerEdrpou: buyerEdrpou,
                dateSigned: contract.dateSigned,
                dateModified: dateModified,
                status: contract.status,
                categoryId: establishment.categoryId,
                subcategoryId: establishment.subcategoryId,
                reported: false,
              });
              totalCollected++;
              establishmentCollected++;
            }
            
            if ((j + 1) % 10 === 0 || j === prozorroContracts.length - 1) {
              console.log(`⚙️ [Contracts Collect] Processed ${j + 1}/${prozorroContracts.length} contracts for establishment ${establishment.id} (collected: ${establishmentCollected}, updated: ${establishmentUpdated})`);
            }
          } catch (error) {
            console.error(`❌ [Contracts Collect] Error saving contract ${contract.id} (${contract.contractID || 'N/A'}):`, error);
            totalErrors++;
            errors.push({
              establishmentId: establishment.id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
        
        console.log(`✅ [Contracts Collect] Completed establishment ${establishment.id}: collected=${establishmentCollected}, updated=${establishmentUpdated}`);
      } catch (error) {
        console.error(`❌ [Contracts Collect] Error processing establishment ${establishment.id} (EDRPOU: ${establishment.edrpouCode}):`, error);
        totalErrors++;
        errors.push({
          establishmentId: establishment.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [Contracts Collect] ===== Collection completed =====`);
    console.log(`📊 [Contracts Collect] Total establishments processed: ${allEstablishments.length}`);
    console.log(`📥 [Contracts Collect] Total contracts collected: ${totalCollected}`);
    console.log(`🔄 [Contracts Collect] Total contracts updated: ${totalUpdated}`);
    console.log(`❌ [Contracts Collect] Total errors: ${totalErrors}`);
    console.log(`⏱️ [Contracts Collect] Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`✅ [Contracts Collect] =================================`);

    // Підраховуємо запити з apiRequestsLog по executionId
    let stats = { totalRequests: 0, successfulRequests: 0, failedRequests: 0 };
    
    if (executionId) {
      try {
        const requestsStats = await db
          .select({
            totalRequests: sql<number>`count(*)`.as("total_requests"),
            successfulRequests: sql<number>`count(*) filter (where ${apiRequestsLog.success} = true)`.as("successful_requests"),
            failedRequests: sql<number>`count(*) filter (where ${apiRequestsLog.success} = false)`.as("failed_requests"),
          })
          .from(apiRequestsLog)
          .where(eq(apiRequestsLog.executionId, executionId));

        stats = requestsStats[0] || { totalRequests: 0, successfulRequests: 0, failedRequests: 0 };
        
        console.log(`📊 [Contracts Collect] Requests stats: total=${stats.totalRequests}, successful=${stats.successfulRequests}, failed=${stats.failedRequests}`);
      } catch (error) {
        console.error(`❌ [Contracts Collect] Error counting requests:`, error);
      }
    }

    // Оновлюємо execution з фінальними даними
    if (executionId) {
      try {
        await db
          .update(contractCollectionExecutions)
          .set({
            establishmentsProcessed: allEstablishments.length,
            totalRequests: Number(stats.totalRequests || 0),
            successfulRequests: Number(stats.successfulRequests || 0),
            failedRequests: Number(stats.failedRequests || 0),
            totalContractsCollected: totalCollected,
            totalContractsUpdated: totalUpdated,
            totalErrors: totalErrors,
            duration: duration,
            status: totalErrors === 0 ? "success" : "partial_success",
            errorDetails: errors.length > 0 ? errors : null,
          })
          .where(eq(contractCollectionExecutions.id, executionId));
        
        console.log(`💾 [Contracts Collect] Execution updated successfully`);
        console.log(`   - totalRequests: ${Number(stats.totalRequests || 0)}`);
        console.log(`   - successfulRequests: ${Number(stats.successfulRequests || 0)}`);
        console.log(`   - failedRequests: ${Number(stats.failedRequests || 0)}`);
      } catch (error) {
        // Не блокуємо основний процес, якщо логування не вдалося
        console.error(`❌ [Contracts Collect] Error updating execution:`, error);
        if (error instanceof Error) {
          console.error(`   Error message: ${error.message}`);
          console.error(`   Error stack: ${error.stack}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      executionId: executionId,
      collected: totalCollected,
      updated: totalUpdated,
      errors: totalErrors,
      dateRange: { start: startDateStr, end: endDateStr },
      establishmentsProcessed: allEstablishments.length,
      errorDetails: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 [Contracts Collect] ===== Fatal error after ${(duration / 1000).toFixed(2)}s =====`);
    console.error("💥 [Contracts Collect] Error collecting contracts:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to collect contracts";
    
    // Оновлюємо execution якщо він був створений, або створюємо новий якщо ні
    try {
      const { searchParams } = new URL(request.url);
      const startDateStr = searchParams.get("startDate") || "";
      const endDateStr = searchParams.get("endDate") || "";
      
      if (executionId) {
        // Оновлюємо існуючий execution
        await db
          .update(contractCollectionExecutions)
          .set({
            duration: duration,
            status: "failed",
            errorMessage: errorMessage,
          })
          .where(eq(contractCollectionExecutions.id, executionId));
        console.log(`💾 [Contracts Collect] Failed execution updated (ID: ${executionId})`);
      } else {
        // Створюємо новий execution для невдалого випадку
        const [execution] = await db.insert(contractCollectionExecutions).values({
          startDate: startDateStr,
          endDate: endDateStr,
          duration: duration,
          status: "failed",
          errorMessage: errorMessage,
        }).returning({ id: contractCollectionExecutions.id });
        executionId = execution.id;
        console.log(`💾 [Contracts Collect] Failed execution created (ID: ${executionId})`);
      }
    } catch (logError) {
      // Не блокуємо основний процес, якщо логування не вдалося
      console.error(`❌ [Contracts Collect] Error logging failed execution:`, logError);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        executionId: executionId,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
};