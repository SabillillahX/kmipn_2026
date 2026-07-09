CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"image_url" text NOT NULL,
	"embedding" vector(384)
);
