CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sub_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#6366f1' NOT NULL,
	"team_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar,
	"google_id" varchar,
	"avatar_url" text,
	"role" text DEFAULT 'member' NOT NULL,
	"team_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role_title" varchar(255),
	"lead_user_id" integer,
	"employment_status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" text,
	"review_date" date,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sub_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sub_team_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sub_teams_unique" UNIQUE("user_id","sub_team_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer,
	"pillar" text NOT NULL,
	"question_text" text NOT NULL,
	"input_type" text NOT NULL,
	"options" text[],
	"order" integer NOT NULL,
	"impact_weight" real DEFAULT 1 NOT NULL,
	"frequency_class" text DEFAULT 'standard' NOT NULL,
	"is_core" boolean DEFAULT false NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"source" text,
	"follow_up_logic" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "check_ins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cadence" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"check_in_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"numeric_value" real,
	"text_value" text,
	"emoji_value" text,
	"selected_options" text[],
	"traffic_light" text,
	"normalized_score" real
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pulse_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"session_size" integer DEFAULT 8 NOT NULL,
	"pillar_weights" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scoring_mode" text DEFAULT 'latest_only' NOT NULL,
	CONSTRAINT "pulse_settings_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intent_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"content" text NOT NULL,
	"author_role" text NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intent_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"question_id" integer,
	"user_id" integer,
	"pillar" text NOT NULL,
	"topic" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kudos" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"from_user_id" integer NOT NULL,
	"to_user_id" integer NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'recognition' NOT NULL,
	"emoji" text DEFAULT '🦎' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"team_id" integer,
	"invited_by" integer,
	"token" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "one_on_one_action_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"text" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "one_on_one_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"lead_user_id" integer NOT NULL,
	"member_user_id" integer NOT NULL,
	"meeting_date" date NOT NULL,
	"check_in" text,
	"looking_back" text,
	"looking_forward" text,
	"additional_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "one_on_one_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"lead_user_id" integer NOT NULL,
	"member_user_id" integer NOT NULL,
	"interval_weeks" integer DEFAULT 4 NOT NULL,
	"next_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "one_on_one_reminders_unique" UNIQUE("team_id","lead_user_id","member_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "allowed_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"team_id" integer,
	"invited_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "allowed_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"lead_user_id" integer,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"description" text,
	"review_date" date,
	"trend" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_health_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"created_by_user_id" integer,
	"capacity" integer NOT NULL,
	"client_satisfaction" integer NOT NULL,
	"team_satisfaction" integer NOT NULL,
	"quality" integer NOT NULL,
	"summary_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_health_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_by_user_id" integer,
	"energy" integer NOT NULL,
	"workload_balance" integer NOT NULL,
	"role_clarity" integer NOT NULL,
	"level_fit" integer NOT NULL,
	"engagement" integer NOT NULL,
	"support" integer NOT NULL,
	"summary_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	CONSTRAINT "project_assignments_user_project_unique" UNIQUE("user_id","project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "register_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"linked_to" varchar(20) NOT NULL,
	"project_id" integer,
	"user_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"impact" integer,
	"probability" integer,
	"confidence" integer,
	"value" integer,
	"due_date" date,
	"responsible_user_id" integer,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "sub_teams" ADD CONSTRAINT "sub_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_lead_user_id_users_id_fk" FOREIGN KEY ("lead_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_sub_teams" ADD CONSTRAINT "user_sub_teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_sub_teams" ADD CONSTRAINT "user_sub_teams_sub_team_id_sub_teams_id_fk" FOREIGN KEY ("sub_team_id") REFERENCES "public"."sub_teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "questions" ADD CONSTRAINT "questions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "responses" ADD CONSTRAINT "responses_check_in_id_check_ins_id_fk" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "responses" ADD CONSTRAINT "responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "pulse_settings" ADD CONSTRAINT "pulse_settings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "intent_messages" ADD CONSTRAINT "intent_messages_thread_id_intent_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."intent_threads"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "intent_messages" ADD CONSTRAINT "intent_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "intent_threads" ADD CONSTRAINT "intent_threads_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "intent_threads" ADD CONSTRAINT "intent_threads_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "intent_threads" ADD CONSTRAINT "intent_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "kudos" ADD CONSTRAINT "kudos_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "kudos" ADD CONSTRAINT "kudos_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "kudos" ADD CONSTRAINT "kudos_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "one_on_one_action_items" ADD CONSTRAINT "one_on_one_action_items_note_id_one_on_one_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."one_on_one_notes"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "one_on_one_notes" ADD CONSTRAINT "one_on_one_notes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "one_on_one_notes" ADD CONSTRAINT "one_on_one_notes_lead_user_id_users_id_fk" FOREIGN KEY ("lead_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "one_on_one_notes" ADD CONSTRAINT "one_on_one_notes_member_user_id_users_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "one_on_one_reminders" ADD CONSTRAINT "one_on_one_reminders_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "one_on_one_reminders" ADD CONSTRAINT "one_on_one_reminders_lead_user_id_users_id_fk" FOREIGN KEY ("lead_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "one_on_one_reminders" ADD CONSTRAINT "one_on_one_reminders_member_user_id_users_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "allowed_emails" ADD CONSTRAINT "allowed_emails_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "allowed_emails" ADD CONSTRAINT "allowed_emails_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_user_id_users_id_fk" FOREIGN KEY ("lead_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "project_health_checks" ADD CONSTRAINT "project_health_checks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "project_health_checks" ADD CONSTRAINT "project_health_checks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_health_checks" ADD CONSTRAINT "user_health_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_health_checks" ADD CONSTRAINT "user_health_checks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "register_items" ADD CONSTRAINT "register_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "register_items" ADD CONSTRAINT "register_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "register_items" ADD CONSTRAINT "register_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "register_items" ADD CONSTRAINT "register_items_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "register_items" ADD CONSTRAINT "register_items_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END; $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sub_teams_team_id" ON "sub_teams" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_team_id" ON "questions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_pillar" ON "questions" USING btree ("pillar");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_order" ON "questions" USING btree ("order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_check_ins_user_id" ON "check_ins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_check_ins_status_created" ON "check_ins" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_check_ins_user_status_created" ON "check_ins" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_responses_check_in_id" ON "responses" USING btree ("check_in_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_responses_question_id" ON "responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_intent_messages_thread_id" ON "intent_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_intent_threads_team_created" ON "intent_threads" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_intent_threads_user_id" ON "intent_threads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kudos_team_created" ON "kudos" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kudos_to_user_id" ON "kudos" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kudos_from_user_id" ON "kudos" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitations_email_status" ON "invitations" USING btree ("email","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_invitations_team_id" ON "invitations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_allowed_emails_team_id" ON "allowed_emails" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_team_id" ON "projects" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_lead_user_id" ON "projects" USING btree ("lead_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_updated_at" ON "projects" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_hc_project_id" ON "project_health_checks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_hc_created_at" ON "project_health_checks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_hc_created_by" ON "project_health_checks" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_hc_user_id" ON "user_health_checks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_hc_created_at" ON "user_health_checks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_hc_created_by" ON "user_health_checks" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_assignments_user_id" ON "project_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_assignments_project_id" ON "project_assignments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_team_id" ON "register_items" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_project_id" ON "register_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_user_id" ON "register_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_type_status" ON "register_items" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_status" ON "register_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_responsible" ON "register_items" USING btree ("responsible_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_created_by" ON "register_items" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_linked_to" ON "register_items" USING btree ("linked_to");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_updated_at" ON "register_items" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_register_items_priority" ON "register_items" USING btree ("priority");