import { pgTable, serial, varchar, text, integer, timestamp, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { projectsTable } from "./projects";
import { usersTable } from "./users";

const scoreField = z.number().int().min(1).max(3);

/**
 * Unified risk/opportunity register.
 * - `type`: "risk" | "opportunity"
 * - `linkedTo`: "project" | "user" (user replaces check's "person")
 * - For risks: probability + impact (1-3), score = P*I
 * - For opportunities: confidence + value (1-3), score = C*V
 */
export const registerItemsTable = pgTable("register_items", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(),
  linkedTo: varchar("linked_to", { length: 20 }).notNull(),
  projectId: integer("project_id").references(() => projectsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  impact: integer("impact"),
  probability: integer("probability"),
  confidence: integer("confidence"),
  value: integer("value"),
  dueDate: date("due_date"),
  responsibleUserId: integer("responsible_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  priority: integer("priority").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdByUserId: integer("created_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
}, (table) => [
  index("idx_register_items_team_id").on(table.teamId),
  index("idx_register_items_project_id").on(table.projectId),
  index("idx_register_items_user_id").on(table.userId),
  index("idx_register_items_type_status").on(table.type, table.status),
  index("idx_register_items_status").on(table.status),
  index("idx_register_items_responsible").on(table.responsibleUserId),
  index("idx_register_items_created_by").on(table.createdByUserId),
  index("idx_register_items_linked_to").on(table.linkedTo),
  index("idx_register_items_updated_at").on(table.updatedAt),
  index("idx_register_items_priority").on(table.priority),
]);

export const insertRegisterItemSchema = createInsertSchema(registerItemsTable)
  .omit({ id: true, createdAt: true, updatedAt: true, closedAt: true })
  .extend({
    type: z.enum(["risk", "opportunity"]),
    linkedTo: z.enum(["project", "user"]),
    impact: scoreField.nullable().optional(),
    probability: scoreField.nullable().optional(),
    confidence: scoreField.nullable().optional(),
    value: scoreField.nullable().optional(),
  })
  .refine(
    (d) => (d.linkedTo === "project" ? d.projectId != null : d.userId != null),
    { message: "projectId required when linkedTo=project; userId required when linkedTo=user" }
  );

export type InsertRegisterItem = z.infer<typeof insertRegisterItemSchema>;
export type RegisterItem = typeof registerItemsTable.$inferSelect;
