CREATE TABLE IF NOT EXISTS "oauth_identities" (
  "provider" text NOT NULL,
  "provider_subject" text NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "email" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("provider", "provider_subject")
);
CREATE INDEX IF NOT EXISTS "oauth_identities_user_idx" ON "oauth_identities" USING btree ("user_id");
