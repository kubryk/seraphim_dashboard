import { pgTable, text, timestamp, boolean, integer, foreignKey } from "drizzle-orm/pg-core";
import { subcategories } from "./subcategories";
import { establishments } from "./establishments";

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
	establishmentId: integer("establishment_id").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.subcategoryId],
		foreignColumns: [subcategories.id],
		name: "contracts_subcategory_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.establishmentId],
		foreignColumns: [establishments.id],
		name: "contracts_establishment_id_fkey"
	}).onDelete("cascade"),
],
);

