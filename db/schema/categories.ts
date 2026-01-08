import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
	id: serial().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

