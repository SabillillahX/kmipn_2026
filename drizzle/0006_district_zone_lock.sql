ALTER TYPE "public"."user_role" RENAME TO "user_role_old";
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'CAMAT', 'OPD');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role" USING CASE WHEN "role"::text = 'gov_employee' THEN 'ADMIN'::"public"."user_role" ELSE "role"::text::"public"."user_role" END;
ALTER TABLE "tickets" ALTER COLUMN "assigned_to_role" TYPE "public"."user_role" USING CASE WHEN "assigned_to_role"::text = 'gov_employee' THEN 'OPD'::"public"."user_role" ELSE "assigned_to_role"::text::"public"."user_role" END;
DROP TYPE "public"."user_role_old";

CREATE TABLE "districts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(120) NOT NULL,
  "code" varchar(32) NOT NULL,
  "boundary" geometry(polygon),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "districts_name_unique" UNIQUE("name"),
  CONSTRAINT "districts_code_unique" UNIQUE("code")
);
CREATE TABLE "user_districts" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "district_id" uuid NOT NULL REFERENCES "districts"("id") ON DELETE cascade
);
CREATE INDEX "user_districts_user_district_idx" ON "user_districts" USING btree ("user_id", "district_id");
ALTER TABLE "reports" ADD COLUMN "district_id" uuid REFERENCES "districts"("id");
ALTER TABLE "tickets" ADD COLUMN "district_id" uuid REFERENCES "districts"("id");
CREATE TABLE "zone_locks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "district_id" uuid NOT NULL REFERENCES "districts"("id") ON DELETE cascade,
  "ticket_id" uuid NOT NULL REFERENCES "tickets"("id") ON DELETE cascade,
  "center" geometry(point) NOT NULL,
  "radius_meters" integer DEFAULT 500 NOT NULL,
  "locked_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "released_at" timestamp with time zone,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "zone_locks_ticket_id_unique" UNIQUE("ticket_id")
);
CREATE INDEX "zone_locks_district_idx" ON "zone_locks" USING btree ("district_id");
