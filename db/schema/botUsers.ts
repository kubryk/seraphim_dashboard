import { pgTable, serial, text, boolean, timestamp, bigint, index } from "drizzle-orm/pg-core";

export const botUsers = pgTable("bot_users", {
	id: serial().notNull(),
	telegramId: bigint("telegram_id", { mode: "number" }).notNull(),
	username: text(),
	role: text().default('user').notNull(),
	isActive: boolean("is_active").default(true),
	lastInteraction: timestamp("last_interaction", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_bot_users_telegram_id").using("btree", table.telegramId.asc().nullsLast().op("int8_ops")),
]);

