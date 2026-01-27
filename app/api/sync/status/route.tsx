import { NextResponse } from "next/server";

type SyncStatusResponse = {
  lastSyncDate: string;
  lastOffset: string;
  contractsCount: number;
  status: string;
  syncPaused: boolean;
};

export const GET = async () => {
  try {
    const syncStatusUrl = process.env.SYNC_STATUS_URL;
    const apiKey = process.env.API_KEY;

    if (!syncStatusUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: "SYNC_STATUS_URL is not configured" 
        },
        { status: 500 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "API_KEY is not configured" 
        },
        { status: 500 }
      );
    }

    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    const response = await fetch(syncStatusUrl, {
      method: "GET",
      headers,
      // Додаємо timeout для запобігання зависання
      signal: AbortSignal.timeout(10000), // 10 секунд
    });

    if (!response.ok) {
      console.error(`❌ [Sync Status] Failed to fetch sync status: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch sync status: ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data: SyncStatusResponse = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        lastSyncDate: data.lastSyncDate,
        lastOffset: data.lastOffset,
        contractsCount: data.contractsCount,
        status: data.status,
        syncPaused: data.syncPaused,
      },
    });
  } catch (error) {
    console.error("❌ [Sync Status] Error fetching sync status:", error);
    
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Request timeout: sync status service is not responding" 
        },
        { status: 504 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch sync status";
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
};
