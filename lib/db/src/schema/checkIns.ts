import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const checkInsTable = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  cadence: text("cadence").notNull(),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("idx_check_ins_user_id").on(table.userId),
  index("idx_check_ins_status_created").on(table.status, table.createdAt),
  index("idx_check_ins_user_status_created").on(table.userId, table.status, table.createdAt),
]);

export const insertCheckInSchema = createInsertSchema(checkInsTable).omit({ id: true, createdAt: true, completedAt: true, status: true });
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkInsTable.$inferSelect;
