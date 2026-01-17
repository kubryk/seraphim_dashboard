import { pgTable, serial, text, timestamp, integer, boolean, jsonb, varchar } from "drizzle-orm/pg-core";

export const apiRequestsLog = pgTable("api_requests_log", {
	id: serial().notNull(),
	executionId: integer("execution_id"),
	establishmentId: integer("establishment_id"),
	edrpouCode: varchar("edrpou_code", { length: 20 }).notNull(),
	url: text().notNull(),
	method: varchar("method", { length: 10 }).notNull().default("POST"),
	startDate: varchar("start_date", { length: 10 }).notNull(),
	endDate: varchar("end_date", { length: 10 }).notNull(),
	page: integer().default(1),
	statusCode: integer("status_code"),
	success: boolean().default(false),
	contractsCount: integer("contracts_count").default(0),
	totalPages: integer("total_pages"),
	totalContracts: integer("total_contracts"),
	errorMessage: text("error_message"),
	errorDetails: jsonb("error_details"),
	responseTime: integer("response_time"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
