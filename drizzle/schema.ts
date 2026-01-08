import { pgTable, serial, varchar, timestamp, foreignKey, integer, text, boolean, index, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const categories = pgTable("categories", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

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

export const botUsers = pgTable("bot_users", {
	id: serial().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
	username: text(),
	role: text().default('user').notNull(),
	isActive: boolean("is_active").default(true),
	lastInteraction: timestamp("last_interaction", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_bot_users_telegram_id").using("btree", table.telegramId.asc().nullsLast().op("int8_ops")),
]);
