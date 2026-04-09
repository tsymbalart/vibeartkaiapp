import { pgTable, text, serial, integer, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const pulseSettingsTable = pgTable("pulse_settings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teamsTable.id, { onDelete: "cascade" }),
  sessionSize: integer("session_size").notNull().default(8),
  pillarWeights: jsonb("pillar_weights").notNull().default({}),
  scoringMode: text("scoring_mode").notNull().default("latest_only"),
}, (table) => [
  unique("pulse_settings_team_id_unique").on(table.teamId),
]);

export const insertPulseSettingsSchema = createInsertSchema(pulseSettingsTable).omit({ id: true });
export type InsertPulseSettings = z.infer<typeof insertPulseSettingsSchema>;
export type PulseSettings = typeof pulseSettingsTable.$inferSelect;
