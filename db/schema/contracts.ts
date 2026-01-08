import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const contracts = pgTable("contracts", {
	id: text().notNull(),
	buyerEdrpou: text("buyer_edrpou").notNull(),
	dateSigned: timestamp("date_signed", { mode: 'string' }),
	dateModified: timestamp("date_modified", { mode: 'string' }),
	status: text(),
	reported: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

