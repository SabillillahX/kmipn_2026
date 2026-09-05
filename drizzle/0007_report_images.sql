CREATE TABLE "report_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "report_id" uuid NOT NULL REFERENCES "reports"("id") ON DELETE cascade,
  "url" varchar(512) NOT NULL,
  "mime_type" varchar(64) NOT NULL,
  "size_bytes" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "report_images_report_idx" ON "report_images" USING btree ("report_id");
