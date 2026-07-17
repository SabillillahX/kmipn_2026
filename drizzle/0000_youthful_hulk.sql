CREATE TYPE "public"."audit_action" AS ENUM('DISPOSISI', 'TOLAK', 'LOCK_AKTIF', 'SELESAI');--> statement-breakpoint
CREATE TYPE "public"."report_category" AS ENUM('INFRASTRUKTUR', 'KESEHATAN_LINGKUNGAN', 'KEBERSIHAN', 'PENERANGAN_JALAN');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('MENUNGGU_KLIRING', 'TERVALIDASI', 'DIPROSES_OPD', 'SHARED_LOCK', 'SELESAI');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CAMAT', 'OPD_PU', 'OPD_KESEHATAN', 'OPD_LH', 'OPD_PERHUBUNGAN');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid,
	"reporter_phone" varchar(20) NOT NULL,
	"category" "report_category" NOT NULL,
	"damage_level" integer NOT NULL,
	"description" text NOT NULL,
	"location" geometry(point) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "report_category" NOT NULL,
	"centroid_location" geometry(point) NOT NULL,
	"status" "ticket_status" DEFAULT 'MENUNGGU_KLIRING' NOT NULL,
	"urgency_score" real DEFAULT 0 NOT NULL,
	"assigned_to_role" "user_role",
	"report_count" integer DEFAULT 1 NOT NULL,
	"proof_image_url" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_location_gist_idx" ON "reports" USING gist ("location");--> statement-breakpoint
CREATE INDEX "tickets_centroid_location_gist_idx" ON "tickets" USING gist ("centroid_location");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");