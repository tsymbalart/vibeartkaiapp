import { pgTable, text, serial, integer, timestamp, boolean, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export const oneOnOneNotesTable = pgTable("one_on_one_notes", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  leadUserId: integer("lead_user_id").notNull().references(() => usersTable.id),
  memberUserId: integer("member_user_id").notNull().references(() => usersTable.id),
  meetingDate: date("meeting_date").notNull(),
  checkIn: text("check_in"),
  lookingBack: text("looking_back"),
  lookingForward: text("looking_forward"),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const oneOnOneActionItemsTable = pgTable("one_on_one_action_items", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => oneOnOneNotesTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const oneOnOneRemindersTable = pgTable("one_on_one_reminders", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  leadUserId: integer("lead_user_id").notNull().references(() => usersTable.id),
  memberUserId: integer("member_user_id").notNull().references(() => usersTable.id),
  intervalWeeks: integer("interval_weeks").notNull().default(4),
  nextDate: date("next_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("one_on_one_reminders_unique").on(table.teamId, table.leadUserId, table.memberUserId),
]);

export const insertOneOnOneNoteSchema = createInsertSchema(oneOnOneNotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOneOnOneNote = z.infer<typeof insertOneOnOneNoteSchema>;
export type OneOnOneNote = typeof oneOnOneNotesTable.$inferSelect;

export const insertOneOnOneActionItemSchema = createInsertSchema(oneOnOneActionItemsTable).omit({ id: true, createdAt: true });
export type InsertOneOnOneActionItem = z.infer<typeof insertOneOnOneActionItemSchema>;
export type OneOnOneActionItem = typeof oneOnOneActionItemsTable.$inferSelect;

export type OneOnOneReminder = typeof oneOnOneRemindersTable.$inferSelect;
