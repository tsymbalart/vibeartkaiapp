import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pulseSettingsTable = pgTable("pulse_settings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().default(1),
  sessionSize: integer("session_size").notNull().default(8),
  pillarWeights: jsonb("pillar_weights").notNull().default({}),
  scoringMode: text("scoring_mode").notNull().default("latest_only"),
});

export const insertPulseSettingsSchema = createInsertSchema(pulseSettingsTable).omit({ id: true });
export type InsertPulseSettings = z.infer<typeof insertPulseSettingsSchema>;
export type PulseSettings = typeof pulseSettingsTable.$inferSelect;
