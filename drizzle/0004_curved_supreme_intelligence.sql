DROP TABLE "sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "ai_risk_score" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "ai_is_blocked" boolean DEFAULT false NOT NULL;