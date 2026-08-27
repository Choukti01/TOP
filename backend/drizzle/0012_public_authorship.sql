ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "parent_comment_id" uuid;
ALTER TABLE "post_comments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
DO $$ BEGIN
  ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_comment_id_post_comments_id_fk"
    FOREIGN KEY ("parent_comment_id") REFERENCES "post_comments"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS "post_comments_post_parent_created_idx" ON "post_comments" USING btree ("post_id", "parent_comment_id", "created_at");
