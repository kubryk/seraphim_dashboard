"use server";

import { db } from "@/db";
import { subcategories } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const deleteSubcategory = async (id: number, categoryId: number) => {
  try {
    await db.delete(subcategories).where(eq(subcategories.id, id));
    revalidatePath(`/categories/${categoryId}`);
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete subcategory";
    return { success: false, error: errorMessage };
  }
};

export const updateSubcategory = async (id: number, categoryId: number, name: string) => {
  try {
    await db
      .update(subcategories)
      .set({ 
        name, 
        updatedAt: sql`now()` 
      })
      .where(eq(subcategories.id, id));
    revalidatePath(`/categories/${categoryId}`);
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error updating subcategory:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update subcategory";
    return { success: false, error: errorMessage };
  }
};

export const createSubcategory = async (categoryId: number, name: string) => {
  try {
    await db.insert(subcategories).values({ categoryId, name });
    revalidatePath(`/categories/${categoryId}`);
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error creating subcategory:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create subcategory";
    return { success: false, error: errorMessage };
  }
};

