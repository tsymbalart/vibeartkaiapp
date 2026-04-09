import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const subTeamsTable = pgTable("sub_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  teamId: integer("team_id")
    .notNull()
    .references(() => teamsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_sub_teams_team_id").on(table.teamId),
]);

export const insertSubTeamSchema = createInsertSchema(subTeamsTable).omit({ id: true, createdAt: true });
export type InsertSubTeam = z.infer<typeof insertSubTeamSchema>;
export type SubTeam = typeof subTeamsTable.$inferSelect;
