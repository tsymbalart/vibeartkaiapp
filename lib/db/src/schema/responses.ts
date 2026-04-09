import { pgTable, text, serial, integer, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { checkInsTable } from "./checkIns";
import { questionsTable } from "./questions";

export const responsesTable = pgTable("responses", {
  id: serial("id").primaryKey(),
  checkInId: integer("check_in_id")
    .notNull()
    .references(() => checkInsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questionsTable.id, { onDelete: "cascade" }),
  numericValue: real("numeric_value"),
  textValue: text("text_value"),
  emojiValue: text("emoji_value"),
  selectedOptions: text("selected_options").array(),
  trafficLight: text("traffic_light"),
  normalizedScore: real("normalized_score"),
}, (table) => [
  index("idx_responses_check_in_id").on(table.checkInId),
  index("idx_responses_question_id").on(table.questionId),
]);

export const insertResponseSchema = createInsertSchema(responsesTable).omit({ id: true });
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responsesTable.$inferSelect;
