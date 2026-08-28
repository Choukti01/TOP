ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp with time zone;

CREATE TABLE IF NOT EXISTS "account_action_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "purpose" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "account_action_tokens_hash_unique" ON "account_action_tokens" USING btree ("token_hash");
CREATE INDEX IF NOT EXISTS "account_action_tokens_user_purpose_idx" ON "account_action_tokens" USING btree ("user_id", "purpose", "expires_at");

CREATE TABLE IF NOT EXISTS "user_blocks" (
  "blocker_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "blocked_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("blocker_id", "blocked_id"),
  CONSTRAINT "user_blocks_no_self_block" CHECK ("blocker_id" <> "blocked_id")
);
CREATE INDEX IF NOT EXISTS "user_blocks_blocked_idx" ON "user_blocks" USING btree ("blocked_id");

CREATE TABLE IF NOT EXISTS "safety_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "reason" text NOT NULL,
  "note" text,
  "status" text DEFAULT 'open' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "safety_reports_status_created_idx" ON "safety_reports" USING btree ("status", "created_at");
CREATE INDEX IF NOT EXISTS "safety_reports_target_idx" ON "safety_reports" USING btree ("target_type", "target_id");
