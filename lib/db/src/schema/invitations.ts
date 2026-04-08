import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export const invitationsTable = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  role: text("role").notNull().default("member"),
  teamId: integer("team_id").references(() => teamsTable.id),
  invitedBy: integer("invited_by").references(() => usersTable.id),
  token: varchar("token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
