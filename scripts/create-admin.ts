import "dotenv/config";
import { eq } from "drizzle-orm";
import { hashPassword } from "../app/lib/auth";
import { db } from "../src/database";
import { users } from "../src/database/schema";

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password || password.length < 12) throw new Error("Gunakan: npm run admin:create -- \"Nama Admin\" admin@contoh.id PasswordMinimal12");
const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
if (existing.length) throw new Error("Email admin tersebut sudah ada.");
await db.insert(users).values({ name, email: email.toLowerCase(), passwordHash: await hashPassword(password), role: "gov_employee" });
console.log(`Admin ${email} berhasil dibuat.`);
