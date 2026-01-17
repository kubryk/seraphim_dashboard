import { NextResponse } from "next/server";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = async () => {
  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.key);

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = {
        id: setting.id,
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
      };
      return acc;
    }, {} as Record<string, { id: number; value: string; description: string | null; updatedAt: string | null }>);

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch settings";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};

export const PUT = async (request: Request) => {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: "Key and value are required" },
        { status: 400 }
      );
    }

    // Перевірка, чи існує налаштування
    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: `Setting with key "${key}" not found` },
        { status: 404 }
      );
    }

    // Оновлення налаштування
    await db
      .update(systemSettings)
      .set({
        value: String(value),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(systemSettings.key, key));

    return NextResponse.json({
      success: true,
      message: "Setting updated successfully",
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update setting";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};
