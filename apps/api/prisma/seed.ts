import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: { name: "Secundaria Demo SCA" },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Secundaria Demo SCA",
    },
  });

  const year = new Date().getFullYear();
  const existingCycle = await prisma.academicCycle.findFirst({
    where: { schoolId: school.id, name: `${year}-${year + 1}` },
  });
  if (!existingCycle) {
    await prisma.academicCycle.create({
      data: {
        schoolId: school.id,
        name: `${year}-${year + 1}`,
        startsAt: new Date(`${year}-08-15`),
        endsAt: new Date(`${year + 1}-07-15`),
        isActive: true,
      },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@sca.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "Administrador SCA",
      role: Role.ADMIN,
      schoolId: school.id,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
    create: {
      email: adminEmail,
      fullName: "Administrador SCA",
      role: Role.ADMIN,
      schoolId: school.id,
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  console.log(`Seed OK — admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
