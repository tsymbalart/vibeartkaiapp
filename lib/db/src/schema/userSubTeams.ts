import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { subTeamsTable } from "./subTeams";

export const userSubTeamsTable = pgTable("user_sub_teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  subTeamId: integer("sub_team_id").notNull().references(() => subTeamsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("user_sub_teams_unique").on(table.userId, table.subTeamId),
]);

export type UserSubTeam = typeof userSubTeamsTable.$inferSelect;
