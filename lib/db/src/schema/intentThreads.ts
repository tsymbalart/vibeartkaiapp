import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { questionsTable } from "./questions";
import { usersTable } from "./users";

export const intentThreadsTable = pgTable("intent_threads", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  questionId: integer("question_id").references(() => questionsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  pillar: text("pillar").notNull(),
  topic: text("topic").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const intentMessagesTable = pgTable("intent_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => intentThreadsTable.id),
  content: text("content").notNull(),
  authorRole: text("author_role").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIntentThreadSchema = createInsertSchema(intentThreadsTable).omit({ id: true, createdAt: true });
export type InsertIntentThread = z.infer<typeof insertIntentThreadSchema>;
export type IntentThread = typeof intentThreadsTable.$inferSelect;

export const insertIntentMessageSchema = createInsertSchema(intentMessagesTable).omit({ id: true, createdAt: true });
export type InsertIntentMessage = z.infer<typeof insertIntentMessageSchema>;
export type IntentMessage = typeof intentMessagesTable.$inferSelect;
