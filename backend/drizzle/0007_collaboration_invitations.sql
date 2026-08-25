CREATE TABLE "project_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "inviter_id" uuid NOT NULL,
  "invitee_id" uuid NOT NULL,
  "role" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_invitations_project_invitee_unique" ON "project_invitations" USING btree ("project_id", "invitee_id");
--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_invitee_id_users_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "entity_id" uuid,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "detail" text,
  "href" text,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
