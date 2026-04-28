-- Track the IANA timezone the user picked their reminderDay/reminderHour in.
-- Without this, the cron compared local hours against UTC and never matched.
ALTER TABLE "pulse_settings" ADD COLUMN IF NOT EXISTS "reminder_timezone" text DEFAULT 'UTC' NOT NULL;
