import { pgTable, serial, varchar, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export const allowedEmailsTable = pgTable("allowed_emails", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  teamId: integer("team_id").references(() => teamsTable.id, { onDelete: "cascade" }),
  invitedByUserId: integer("invited_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_allowed_emails_team_id").on(table.teamId),
]);

export const insertAllowedEmailSchema = createInsertSchema(allowedEmailsTable).omit({ id: true, createdAt: true });
export type InsertAllowedEmail = z.infer<typeof insertAllowedEmailSchema>;
export type AllowedEmail = typeof allowedEmailsTable.$inferSelect;
