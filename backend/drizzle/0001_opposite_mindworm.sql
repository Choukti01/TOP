CREATE TYPE "public"."milestone_status" AS ENUM('planned', 'completed');--> statement-breakpoint
CREATE TYPE "public"."project_artifact_kind" AS ENUM('atelier', 'canvas', 'blueprint', 'note', 'link', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_direction" AS ENUM('personal', 'creative', 'learning', 'community', 'venture', 'other');--> statement-breakpoint
CREATE TABLE "project_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"kind" "project_artifact_kind" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "milestone_status" DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "direction" "project_direction";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "next_action" text;--> statement-breakpoint
UPDATE "projects" SET "direction" = 'other', "next_action" = 'Choose a specific next action for this project.' WHERE "direction" IS NULL OR "next_action" IS NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "direction" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "next_action" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_artifacts" ADD CONSTRAINT "project_artifacts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
