import { pgTable, serial, varchar, timestamp, foreignKey, integer } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const subcategories = pgTable("subcategories", {
	id: serial().notNull(),
	categoryId: integer("category_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [categories.id],
		name: "subcategories_category_id_fkey"
	}).onDelete("cascade"),
]);

