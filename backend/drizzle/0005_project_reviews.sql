ALTER TABLE "reflections" ADD COLUMN "project_id" uuid;
--> statement-breakpoint
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
