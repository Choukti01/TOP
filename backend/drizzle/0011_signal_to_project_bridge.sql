ALTER TABLE "seeds" ADD COLUMN "source_public_post_id" uuid;
ALTER TABLE "projects" ADD COLUMN "source_public_post_id" uuid;
ALTER TABLE "public_posts" ADD COLUMN "project_id" uuid;

ALTER TABLE "seeds" ADD CONSTRAINT "seeds_source_public_post_id_public_posts_id_fk" FOREIGN KEY ("source_public_post_id") REFERENCES "public_posts"("id") ON DELETE set null;
ALTER TABLE "projects" ADD CONSTRAINT "projects_source_public_post_id_public_posts_id_fk" FOREIGN KEY ("source_public_post_id") REFERENCES "public_posts"("id") ON DELETE set null;
ALTER TABLE "public_posts" ADD CONSTRAINT "public_posts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE set null;

CREATE UNIQUE INDEX "seeds_creator_source_public_post_unique" ON "seeds" USING btree ("creator_id", "source_public_post_id") WHERE "source_public_post_id" IS NOT NULL;

CREATE TABLE "public_post_offers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "note" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "public_post_offers_post_id_public_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public_posts"("id") ON DELETE cascade,
  CONSTRAINT "public_post_offers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

CREATE UNIQUE INDEX "public_post_offers_post_user_unique" ON "public_post_offers" USING btree ("post_id", "user_id");
CREATE INDEX "public_post_offers_post_status_idx" ON "public_post_offers" USING btree ("post_id", "status");
