"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const deleteCategory = async (id: number) => {
  try {
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete category";
    return { success: false, error: errorMessage };
  }
};

export const updateCategory = async (id: number, name: string) => {
  try {
    await db
      .update(categories)
      .set({ 
        name, 
        updatedAt: sql`now()` 
      })
      .where(eq(categories.id, id));
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update category";
    return { success: false, error: errorMessage };
  }
};

export const createCategory = async (name: string) => {
  try {
    await db.insert(categories).values({ name });
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error creating category:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create category";
    return { success: false, error: errorMessage };
  }
};

