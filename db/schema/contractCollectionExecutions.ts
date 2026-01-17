import { pgTable, serial, varchar, timestamp, integer, text, jsonb } from "drizzle-orm/pg-core";

export const contractCollectionExecutions = pgTable("contract_collection_executions", {
	id: serial().notNull(),
	startDate: varchar("start_date", { length: 10 }).notNull(),
	endDate: varchar("end_date", { length: 10 }).notNull(),
	establishmentsProcessed: integer("establishments_processed").default(0),
	totalRequests: integer("total_requests").default(0),
	successfulRequests: integer("successful_requests").default(0),
	failedRequests: integer("failed_requests").default(0),
	totalContractsCollected: integer("total_contracts_collected").default(0),
	totalContractsUpdated: integer("total_contracts_updated").default(0),
	totalErrors: integer("total_errors").default(0),
	duration: integer().notNull(),
	status: varchar("status", { length: 20 }).notNull().default("success"),
	errorMessage: text("error_message"),
	errorDetails: jsonb("error_details"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
