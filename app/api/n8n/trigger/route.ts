import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const n8nWebhookUrl = process.env.N8N_COLLECT_CONTRACTS_WEBHOOK;
    const n8nApiKey = process.env.N8N_WEBHOOKS_API_KEY;

    if (!n8nWebhookUrl) {
      console.error("❌ [N8N Trigger] N8N_WEBHOOK_URL is not configured");
      return NextResponse.json(
        { success: false, error: "N8N webhook URL is not configured" },
        { status: 500 }
      );
    }

    if (!n8nApiKey) {
      console.error("❌ [N8N Trigger] N8N_API_KEY or API_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "N8N API key is not configured" },
        { status: 500 }
      );
    }

    // Отримуємо дані з запиту (опціонально)
    const body = await request.json().catch(() => ({}));

    console.log(`🚀 [N8N Trigger] Triggering n8n webhook: ${n8nWebhookUrl}`);

    // Формуємо headers з x-api-key
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": n8nApiKey,
    };

    // Відправляємо POST запит на n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...body,
        triggeredAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [N8N Trigger] n8n webhook returned error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `n8n webhook returned error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const responseData = await response.json().catch(() => ({}));

    console.log(`✅ [N8N Trigger] n8n webhook triggered successfully`);

    return NextResponse.json({
      success: true,
      message: "n8n workflow triggered successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("❌ [N8N Trigger] Error triggering n8n webhook:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      },
      { status: 500 }
    );
  }
};
