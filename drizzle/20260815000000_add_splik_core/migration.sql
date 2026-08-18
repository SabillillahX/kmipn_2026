CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" text NOT NULL DEFAULT 'admin',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text NOT NULL UNIQUE,
  "category" text NOT NULL,
  "severity" text NOT NULL,
  "description" text NOT NULL,
  "contact_phone" text NOT NULL,
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "status" text NOT NULL DEFAULT 'baru',
  "priority" text NOT NULL DEFAULT 'sedang',
  "assigned_to" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "resolved_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "reports_created_at_idx" ON "reports" ("created_at");
CREATE INDEX "reports_status_idx" ON "reports" ("status");
