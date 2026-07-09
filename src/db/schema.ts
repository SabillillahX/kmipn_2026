import { pgTable, uuid, text, vector } from "drizzle-orm/pg-core";

export const images = pgTable("images", {
    id: uuid("id").primaryKey().defaultRandom(),
    imageUrl: text("image_url").notNull(),
    embedding: vector("embedding", { dimensions: 384 }),
});