import { pgTable, serial, integer, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";
import { usersTable } from "./users";

export const projectAssignmentsTable = pgTable("project_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
}, (table) => [
  unique("project_assignments_user_project_unique").on(table.userId, table.projectId),
  index("idx_project_assignments_user_id").on(table.userId),
  index("idx_project_assignments_project_id").on(table.projectId),
]);

export const insertProjectAssignmentSchema = createInsertSchema(projectAssignmentsTable).omit({ id: true });
export type InsertProjectAssignment = z.infer<typeof insertProjectAssignmentSchema>;
export type ProjectAssignment = typeof projectAssignmentsTable.$inferSelect;
