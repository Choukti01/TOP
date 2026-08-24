ALTER TABLE "projects" ADD COLUMN "color" text DEFAULT '#dfae63' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "field_x" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "field_y" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "field_width" integer DEFAULT 270 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "field_height" integer DEFAULT 168 NOT NULL;