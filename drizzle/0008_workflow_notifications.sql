ALTER TABLE "tickets" ADD COLUMN "assigned_to_user_id" uuid REFERENCES "users"("id");
CREATE TABLE "ticket_proof_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" uuid NOT NULL REFERENCES "tickets"("id") ON DELETE cascade,
  "uploaded_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "url" varchar(512) NOT NULL,
  "mime_type" varchar(64) NOT NULL,
  "size_bytes" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "ticket_proof_images_ticket_idx" ON "ticket_proof_images" USING btree ("ticket_id");
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "ticket_id" uuid REFERENCES "tickets"("id") ON DELETE cascade,
  "title" varchar(160) NOT NULL,
  "message" text NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id", "read_at");
