ALTER TABLE "project_messages" ADD COLUMN IF NOT EXISTS "kind" text NOT NULL DEFAULT 'update';
CREATE INDEX IF NOT EXISTS "project_messages_project_created_idx" ON "project_messages" USING btree ("project_id", "created_at");
