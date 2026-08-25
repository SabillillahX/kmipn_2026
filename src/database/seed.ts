import { db } from './index';
import { users } from './schema';

async function seed() {
    try {
        console.log("Seeding database...");
        await db.insert(users).values({
            name: "Gov Employee Kocak",
            email: "kocak@gmail.com",
            passwordHash: "kocak123",
            role: "ADMIN",
        });
        console.log("Seeding completed successfully.");
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        process.exit(0);
    }
}

seed();
