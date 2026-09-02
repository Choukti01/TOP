CREATE TABLE IF NOT EXISTS "topeye_threads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "title" text NOT NULL,
  "mode" text DEFAULT 'chat' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topeye_threads_owner_updated_idx" ON "topeye_threads" USING btree ("owner_id", "updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topeye_threads_project_idx" ON "topeye_threads" USING btree ("project_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topeye_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "thread_id" uuid NOT NULL REFERENCES "topeye_threads"("id") ON DELETE cascade,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "model" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topeye_messages_thread_created_idx" ON "topeye_messages" USING btree ("thread_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topeye_artifacts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "thread_id" uuid REFERENCES "topeye_threads"("id") ON DELETE set null,
  "project_id" uuid REFERENCES "projects"("id") ON DELETE set null,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topeye_artifacts_owner_updated_idx" ON "topeye_artifacts" USING btree ("owner_id", "updated_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topeye_artifacts_thread_idx" ON "topeye_artifacts" USING btree ("thread_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "topeye_artifacts_project_idx" ON "topeye_artifacts" USING btree ("project_id");
