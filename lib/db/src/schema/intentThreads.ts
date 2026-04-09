import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { questionsTable } from "./questions";
import { usersTable } from "./users";

export const intentThreadsTable = pgTable("intent_threads", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").references(() => questionsTable.id, { onDelete: "set null" }),
  // `set null` on delete so removing a teammate anonymises their threads
  // rather than cascading a delete of sensitive feedback.
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  pillar: text("pillar").notNull(),
  topic: text("topic").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_intent_threads_team_created").on(table.teamId, table.createdAt),
  index("idx_intent_threads_user_id").on(table.userId),
]);

export const intentMessagesTable = pgTable("intent_messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .notNull()
    .references(() => intentThreadsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorRole: text("author_role").notNull(),
  // Must reference a real user if present, but delete-safe (anonymised).
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_intent_messages_thread_id").on(table.threadId),
]);

export const insertIntentThreadSchema = createInsertSchema(intentThreadsTable).omit({ id: true, createdAt: true });
export type InsertIntentThread = z.infer<typeof insertIntentThreadSchema>;
export type IntentThread = typeof intentThreadsTable.$inferSelect;

export const insertIntentMessageSchema = createInsertSchema(intentMessagesTable).omit({ id: true, createdAt: true });
export type InsertIntentMessage = z.infer<typeof insertIntentMessageSchema>;
export type IntentMessage = typeof intentMessagesTable.$inferSelect;
