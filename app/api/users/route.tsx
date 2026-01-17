import { NextResponse } from "next/server";
import { db } from "@/db";
import { botUsers } from "@/db/schema";
import { eq, desc, and, or, like, isNotNull } from "drizzle-orm";

// Допустимі ролі в системі
const VALID_ROLES = ["user", "admin", "moderator"] as const;

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    // Базові умови фільтрації
    const conditions = [];
    
    if (search) {
      const searchConditions = [];
      // Пошук по username
      searchConditions.push(like(botUsers.username, `%${search}%`));
      // Пошук по telegramId
      const numericSearch = Number(search);
      if (!isNaN(numericSearch)) {
        searchConditions.push(eq(botUsers.telegramId, numericSearch));
      }
      if (searchConditions.length > 0) {
        conditions.push(or(...searchConditions));
      }
    }
    
    if (role) {
      conditions.push(eq(botUsers.role, role));
    }
    
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(botUsers.isActive, isActive === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const users = await db
      .select()
      .from(botUsers)
      .where(whereClause)
      .orderBy(desc(botUsers.createdAt));

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        lastInteraction: user.lastInteraction,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { telegramId, username, role = "user", isActive = true } = body;

    if (!telegramId) {
      return NextResponse.json(
        { success: false, error: "telegramId is required" },
        { status: 400 }
      );
    }

    // Валідація telegramId: має бути позитивним цілим числом
    const telegramIdNum = Number(telegramId);
    if (isNaN(telegramIdNum) || telegramIdNum <= 0 || !Number.isInteger(telegramIdNum)) {
      return NextResponse.json(
        { success: false, error: "telegramId must be a positive integer" },
        { status: 400 }
      );
    }

    // Валідація username: максимум 255 символів
    if (username !== undefined && username !== null && username.length > 255) {
      return NextResponse.json(
        { success: false, error: "Username too long (max 255 characters)" },
        { status: 400 }
      );
    }

    // Валідація role: має бути однією з допустимих ролей
    if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Перевірка, чи існує користувач з таким telegram_id
    const existingUser = await db
      .select()
      .from(botUsers)
      .where(eq(botUsers.telegramId, telegramIdNum))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "User with this telegram ID already exists" },
        { status: 409 }
      );
    }

    // Створення нового користувача
    const newUser = await db
      .insert(botUsers)
      .values({
        telegramId: telegramIdNum,
        username: username && username.trim() ? username.trim() : null,
        role: role || "user",
        isActive: isActive !== false,
        lastInteraction: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      user: {
        id: newUser[0].id,
        telegramId: newUser[0].telegramId,
        username: newUser[0].username,
        role: newUser[0].role,
        isActive: newUser[0].isActive,
        lastInteraction: newUser[0].lastInteraction,
        createdAt: newUser[0].createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};

export const PUT = async (request: Request) => {
  try {
    const body = await request.json();
    const { id, username, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    // Перевірка, чи існує користувач
    const existingUser = await db
      .select()
      .from(botUsers)
      .where(eq(botUsers.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Оновлення користувача
    const updateData: {
      username?: string | null;
      role?: string;
      isActive?: boolean;
    } = {};

    // Валідація username: максимум 255 символів
    if (username !== undefined) {
      if (username !== null && username.length > 255) {
        return NextResponse.json(
          { success: false, error: "Username too long (max 255 characters)" },
          { status: 400 }
        );
      }
      updateData.username = username && username.trim() ? username.trim() : null;
    }
    // Валідація role: має бути однією з допустимих ролей
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
        return NextResponse.json(
          { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await db
      .update(botUsers)
      .set(updateData)
      .where(eq(botUsers.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser[0].id,
        telegramId: updatedUser[0].telegramId,
        username: updatedUser[0].username,
        role: updatedUser[0].role,
        isActive: updatedUser[0].isActive,
        lastInteraction: updatedUser[0].lastInteraction,
        createdAt: updatedUser[0].createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid id" },
        { status: 400 }
      );
    }

    // Перевірка, чи існує користувач
    const existingUser = await db
      .select()
      .from(botUsers)
      .where(eq(botUsers.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Видалення користувача
    await db
      .delete(botUsers)
      .where(eq(botUsers.id, userId));

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};
