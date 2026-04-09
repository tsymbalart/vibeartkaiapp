import { pgTable, serial, text, integer, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { teamsTable } from "./teams";
import { usersTable } from "./users";

export const invitationsTable = pgTable("invitations", {
  id: serial("id").primaryKey(),
  // Always stored lowercase — see normalizeEmail in routes/auth.ts.
  email: varchar("email").notNull(),
  role: text("role").notNull().default("member"),
  teamId: integer("team_id").references(() => teamsTable.id, { onDelete: "cascade" }),
  invitedBy: integer("invited_by").references(() => usersTable.id, { onDelete: "set null" }),
  token: varchar("token").notNull().unique(),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_invitations_email_status").on(table.email, table.status),
  index("idx_invitations_team_id").on(table.teamId),
]);
