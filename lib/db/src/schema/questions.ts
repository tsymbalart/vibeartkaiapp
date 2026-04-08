import { pgTable, text, serial, integer, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
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
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
