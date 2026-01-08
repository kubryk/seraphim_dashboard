import { relations } from "drizzle-orm/relations";
import { categories, subcategories, establishments } from "./schema";

export const subcategoriesRelations = relations(subcategories, ({one, many}) => ({
	category: one(categories, {
		fields: [subcategories.categoryId],
		references: [categories.id]
	}),
	establishments: many(establishments),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	subcategories: many(subcategories),
	establishments: many(establishments),
}));

export const establishmentsRelations = relations(establishments, ({one}) => ({
	category: one(categories, {
		fields: [establishments.categoryId],
		references: [categories.id]
	}),
	subcategory: one(subcategories, {
		fields: [establishments.subcategoryId],
		references: [subcategories.id]
	}),
}));