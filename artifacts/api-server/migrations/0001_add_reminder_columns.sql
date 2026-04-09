ALTER TABLE "pulse_settings" ADD COLUMN IF NOT EXISTS "reminder_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pulse_settings" ADD COLUMN IF NOT EXISTS "reminder_day" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "pulse_settings" ADD COLUMN IF NOT EXISTS "reminder_hour" integer DEFAULT 9 NOT NULL;--> statement-breakpoint
ALTER TABLE "pulse_settings" ADD COLUMN IF NOT EXISTS "last_reminder_sent_at" timestamp with time zone;
