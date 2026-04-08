import { pgTable, serial, text, varchar, integer, timestamp, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  name: varchar("name", { length: 255 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  leadUserId: integer("lead_user_id").notNull().references(() => usersTable.id),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  description: text("description"),
  reviewDate: date("review_date"),
  trend: varchar("trend", { length: 10 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_projects_team_id").on(table.teamId),
  index("idx_projects_lead_user_id").on(table.leadUserId),
  index("idx_projects_status").on(table.status),
  index("idx_projects_updated_at").on(table.updatedAt),
]);

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
