"use server";

import { db } from "@/db";
import { establishments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const deleteEstablishment = async (id: number, categoryId: number, subcategoryId: number) => {
  try {
    await db.delete(establishments).where(eq(establishments.id, id));
    revalidatePath(`/categories/${categoryId}/${subcategoryId}`);
    revalidatePath(`/categories/${categoryId}`);
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting establishment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete establishment";
    return { success: false, error: errorMessage };
  }
};

export const updateEstablishment = async (
  id: number,
  categoryId: number,
  subcategoryId: number,
  name: string,
  edrpouCode: string
) => {
  try {
    // Валідація на сервері
    const validationError = validateEdrpou(edrpouCode);
    if (validationError) {
      return { success: false, error: validationError };
    }

    if (!name.trim()) {
      return { success: false, error: "Назва закладу обов'язкова" };
    }

    await db
      .update(establishments)
      .set({ 
        name: name.trim(),
        edrpouCode: edrpouCode.trim(),
        updatedAt: sql`now()` 
      })
      .where(eq(establishments.id, id));
    revalidatePath(`/categories/${categoryId}/${subcategoryId}`);
    revalidatePath(`/categories/${categoryId}`);
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error updating establishment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update establishment";
    return { success: false, error: errorMessage };
  }
};

const validateEdrpou = (code: string): string | null => {
  const trimmed = code.trim();
  if (!trimmed) {
    return "ЄДРПОУ код обов'язковий";
  }
  if (!/^\d+$/.test(trimmed)) {
    return "ЄДРПОУ код повинен містити тільки цифри";
  }
  if (trimmed.length !== 8) {
    return "ЄДРПОУ код повинен містити рівно 8 цифр";
  }
  return null;
};

export const createEstablishment = async (
  categoryId: number,
  subcategoryId: number,
  name: string,
  edrpouCode: string
) => {
  try {
    // Валідація на сервері
    const validationError = validateEdrpou(edrpouCode);
    if (validationError) {
      return { success: false, error: validationError };
    }

    if (!name.trim()) {
      return { success: false, error: "Назва закладу обов'язкова" };
    }

    await db.insert(establishments).values({ 
      categoryId, 
      subcategoryId, 
      name: name.trim(), 
      edrpouCode: edrpouCode.trim()
    });
    revalidatePath(`/categories/${categoryId}/${subcategoryId}`);
    revalidatePath(`/categories/${categoryId}`);
    revalidatePath("/categories");
    return { success: true };
  } catch (error) {
    console.error("Error creating establishment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create establishment";
    return { success: false, error: errorMessage };
  }
};

