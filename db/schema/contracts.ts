import { pgTable, text, timestamp, boolean, integer, foreignKey } from "drizzle-orm/pg-core";
import { subcategories } from "./subcategories";
import { categories } from "./categories";

export const contracts = pgTable("contracts", {
	id: text().notNull(),
	buyerEdrpou: text("buyer_edrpou").notNull(),
	dateSigned: timestamp("date_signed", { mode: 'string' }),
	dateModified: timestamp("date_modified", { mode: 'string' }),
	status: text(),
	reported: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	subcategoryId: integer("subcategory_id").notNull(),
	categoryId: integer("category_id").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.categoryId],
		foreignColumns: [categories.id],
		name: "contract_category_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.subcategoryId],
		foreignColumns: [subcategories.id],
		name: "contract_subcategory_id_fkey"
	}).onDelete("cascade"),
],
);

