import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

const scoreField = z.number().int().min(1).max(3);

/**
 * Health checks for a tracked user (design-ops person health).
 * Distinct from pulse `check_ins` / `responses` — this is the Design Team
 * Dashboard flow where a lead evaluates a user's well-being on a 1-3 scale.
 */
export const userHealthChecksTable = pgTable("user_health_checks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  energy: integer("energy").notNull(),
  workloadBalance: integer("workload_balance").notNull(),
  roleClarity: integer("role_clarity").notNull(),
  levelFit: integer("level_fit").notNull(),
  engagement: integer("engagement").notNull(),
  support: integer("support").notNull(),
  summaryNote: text("summary_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_user_hc_user_id").on(table.userId),
  index("idx_user_hc_created_at").on(table.createdAt),
  index("idx_user_hc_created_by").on(table.createdByUserId),
]);

export const insertUserHealthCheckSchema = createInsertSchema(userHealthChecksTable)
  .omit({ id: true, createdAt: true })
  .extend({
    energy: scoreField,
    workloadBalance: scoreField,
    roleClarity: scoreField,
    levelFit: scoreField,
    engagement: scoreField,
    support: scoreField,
  });

export type InsertUserHealthCheck = z.infer<typeof insertUserHealthCheckSchema>;
export type UserHealthCheck = typeof userHealthChecksTable.$inferSelect;
