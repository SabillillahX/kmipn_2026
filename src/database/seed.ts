import { db } from './index';
import { users } from './schema';

async function seed() {
    try {
        console.log("Seeding database...");
        await db.insert(users).values({
            name: "Gov Employee Kocak",
            email: "kocak@gmail.com",
            passwordHash: "kocak123", // Using plain password based on the prompt instructions, ideally this should be hashed.
            role: "gov_employee",
        });
        console.log("Seeding completed successfully.");
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        process.exit(0);
    }
}

seed();
