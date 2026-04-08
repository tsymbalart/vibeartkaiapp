import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export const kudosTable = pgTable("kudos", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teamsTable.id),
  fromUserId: integer("from_user_id").notNull().references(() => usersTable.id),
  toUserId: integer("to_user_id").notNull().references(() => usersTable.id),
  content: text("content").notNull(),
  category: text("category").notNull().default("recognition"),
  emoji: text("emoji").notNull().default("🦎"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKudosSchema = createInsertSchema(kudosTable).omit({ id: true, createdAt: true });
export type InsertKudos = z.infer<typeof insertKudosSchema>;
export type Kudos = typeof kudosTable.$inferSelect;
