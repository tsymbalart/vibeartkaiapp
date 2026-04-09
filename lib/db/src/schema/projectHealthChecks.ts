import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { usersTable } from "./users";

const scoreField = z.number().int().min(1).max(3);

export const projectHealthChecksTable = pgTable("project_health_checks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  capacity: integer("capacity").notNull(),
  clientSatisfaction: integer("client_satisfaction").notNull(),
  teamSatisfaction: integer("team_satisfaction").notNull(),
  quality: integer("quality").notNull(),
  summaryNote: text("summary_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_project_hc_project_id").on(table.projectId),
  index("idx_project_hc_created_at").on(table.createdAt),
  index("idx_project_hc_created_by").on(table.createdByUserId),
]);

export const insertProjectHealthCheckSchema = createInsertSchema(projectHealthChecksTable)
  .omit({ id: true, createdAt: true })
  .extend({
    capacity: scoreField,
    clientSatisfaction: scoreField,
    teamSatisfaction: scoreField,
    quality: scoreField,
  });

export type InsertProjectHealthCheck = z.infer<typeof insertProjectHealthCheckSchema>;
export type ProjectHealthCheck = typeof projectHealthChecksTable.$inferSelect;
