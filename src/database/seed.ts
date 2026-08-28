import { db } from './index';
import { users, districts, userDistricts } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    console.log("🌱 Memulai seeding data pengguna & OPD...");

    // 1. Seed / Ensure District exists
    let [district] = await db.select().from(districts).where(eq(districts.code, "3374010")).limit(1);
    if (!district) {
      const [inserted] = await db.insert(districts).values({
        name: "Kecamatan Sukamaju",
        code: "3374010",
      }).returning();
      district = inserted;
      console.log(`✅ Berhasil membuat wilayah: ${district.name}`);
    }

    // 2. Seed Admin & Camat users
    const defaultUsers = [
      {
        name: "Administrator Layanan",
        email: "kocak@gmail.com",
        passwordHash: "kocak123",
        role: "ADMIN" as const,
      },
      {
        name: "Drs. H. Ahmad Fauzi, M.Si. (Camat)",
        email: "camat@sukamaju.go.id",
        passwordHash: "camat123",
        role: "CAMAT" as const,
      },
    ];

    // 3. Seed Official OPD users
    const opdUsers = [
      {
        name: "Dinas Pekerjaan Umum & Penataan Ruang (PUPR)",
        email: "opd.pupr@sukamaju.go.id",
        passwordHash: "opd12345",
        role: "OPD" as const,
      },
      {
        name: "Dinas Lingkungan Hidup (DLH)",
        email: "opd.dlh@sukamaju.go.id",
        passwordHash: "opd12345",
        role: "OPD" as const,
      },
      {
        name: "Dinas Perhubungan (Dishub)",
        email: "opd.dishub@sukamaju.go.id",
        passwordHash: "opd12345",
        role: "OPD" as const,
      },
      {
        name: "Dinas Kesehatan (Dinkes)",
        email: "opd.dinkes@sukamaju.go.id",
        passwordHash: "opd12345",
        role: "OPD" as const,
      },
      {
        name: "Satuan Polisi Pamong Praja (Satpol PP)",
        email: "opd.satpolpp@sukamaju.go.id",
        passwordHash: "opd12345",
        role: "OPD" as const,
      },
    ];

    const allUsersToSeed = [...defaultUsers, ...opdUsers];

    for (const u of allUsersToSeed) {
      const [existing] = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
      let userId = existing?.id;

      if (!existing) {
        const [inserted] = await db.insert(users).values({
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          role: u.role,
        }).returning({ id: users.id });
        userId = inserted.id;
        console.log(`✅ Berhasil menambahkan akun (${u.role}): ${u.name} [${u.email}]`);
      } else {
        console.log(`ℹ️ Akun sudah ada (${u.role}): ${u.name} [${u.email}]`);
      }

      // Link User to District
      if (userId && district?.id) {
        await db.insert(userDistricts).values({
          userId: userId,
          districtId: district.id,
        }).onConflictDoNothing();
      }
    }

    console.log("🎉 Seeding database OPD & Camat selesai dengan sukses!");
  } catch (e) {
    console.error("❌ Seeding gagal:", e);
  } finally {
    process.exit(0);
  }
}

seed();
