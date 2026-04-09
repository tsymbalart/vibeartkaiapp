import { pgTable, text, serial, integer, boolean, real, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

/**
 * Pulse questionnaire bank, scoped per team. A `teamId = null` row is a
 * "global template" question that all teams see unless they override it
 * locally. When a team customises a question, a new row is created with
 * their teamId; the global row stays unchanged.
 */
export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teamsTable.id, { onDelete: "cascade" }),
  pillar: text("pillar").notNull(),
  questionText: text("question_text").notNull(),
  inputType: text("input_type").notNull(),
  options: text("options").array(),
  order: integer("order").notNull(),
  impactWeight: real("impact_weight").notNull().default(1.0),
  frequencyClass: text("frequency_class").notNull().default("standard"),
  isCore: boolean("is_core").notNull().default(false),
  isRequired: boolean("is_required").notNull().default(true),
  source: text("source"),
  followUpLogic: jsonb("follow_up_logic"),
}, (table) => [
  index("idx_questions_team_id").on(table.teamId),
  index("idx_questions_pillar").on(table.pillar),
  index("idx_questions_order").on(table.order),
]);

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
