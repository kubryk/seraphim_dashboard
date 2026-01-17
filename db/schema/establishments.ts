import { pgTable, serial, varchar, timestamp, foreignKey, integer } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { subcategories } from "./subcategories";

export const establishments = pgTable("establishments", {
	id: serial().notNull(),
	categoryId: integer("category_id").notNull(),
	subcategoryId: integer("subcategory_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	edrpouCode: varchar("edrpou_code", { length: 20 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [categories.id],
		name: "establishments_category_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.subcategoryId],
		foreignColumns: [subcategories.id],
		name: "establishments_subcategory_id_fkey"
	}).onDelete("cascade"),
]);

