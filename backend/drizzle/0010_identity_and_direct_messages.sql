ALTER TABLE "profiles" ADD COLUMN "avatar_data_url" text;

CREATE TABLE "direct_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sender_id" uuid NOT NULL,
  "recipient_id" uuid NOT NULL,
  "body" text NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "direct_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE cascade,
  CONSTRAINT "direct_messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE cascade
);

CREATE INDEX "direct_messages_sender_created_idx" ON "direct_messages" USING btree ("sender_id", "created_at");
CREATE INDEX "direct_messages_recipient_created_idx" ON "direct_messages" USING btree ("recipient_id", "created_at");
