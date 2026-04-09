import { pgTable, text, serial, timestamp, integer, varchar, boolean, date, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email").unique(),
  googleId: varchar("google_id").unique(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("member"),
  teamId: integer("team_id").references(() => teamsTable.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  // Fused from Check's `people` table.
  // These fields describe a user as a tracked design-ops person, independent
  // of their pulse membership (which is covered by `role`, `teamId`, sub-teams).
  roleTitle: varchar("role_title", { length: 255 }),
  leadUserId: integer("lead_user_id").references((): AnyPgColumn => usersTable.id, { onDelete: "set null" }),
  employmentStatus: varchar("employment_status", { length: 20 }).notNull().default("active"),
  notes: text("notes"),
  reviewDate: date("review_date"),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
