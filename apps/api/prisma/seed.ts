import {
  ParentLinkStatus,
  PrismaClient,
  Role,
  RoleInClass,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_USERS = [
  { email: "profesor@sca.local", fullName: "Profesora Demo", role: Role.TEACHER },
  { email: "alumno@sca.local", fullName: "Alumno Demo", role: Role.STUDENT },
  { email: "padre@sca.local", fullName: "Padre Demo", role: Role.PARENT },
] as const;

/**
 * Crea un usuario por rol para poder recorrer el sistema desde cada vista.
 * Solo corre si SEED_DEMO_PASSWORD está definida, así nunca aparecen por
 * accidente en un entorno real.
 */
async function seedDemoUsers(schoolId: string, cycleId: string) {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password) return;

  const passwordHash = await bcrypt.hash(password, 10);
  const created = new Map<Role, string>();

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: { fullName: demo.fullName, role: demo.role, schoolId, passwordHash },
      create: { ...demo, schoolId, passwordHash },
    });
    created.set(demo.role, user.id);
  }

  const teacherId = created.get(Role.TEACHER)!;
  const studentId = created.get(Role.STUDENT)!;
  const parentId = created.get(Role.PARENT)!;

  const demoClass =
    (await prisma.class.findFirst({ where: { joinCode: "DEMO01" } })) ??
    (await prisma.class.create({
      data: {
        schoolId,
        cycleId,
        name: "Matemáticas 2A",
        section: "2A",
        subject: "Matemáticas",
        joinCode: "DEMO01",
      },
    }));

  for (const [userId, roleInClass] of [
    [teacherId, RoleInClass.teacher],
    [studentId, RoleInClass.student],
  ] as const) {
    await prisma.classMembership.upsert({
      where: { classId_userId: { classId: demoClass.id, userId } },
      update: { roleInClass },
      create: { classId: demoClass.id, userId, roleInClass },
    });
  }

  await prisma.parentLink.upsert({
    where: { parentId_studentId: { parentId, studentId } },
    update: { status: ParentLinkStatus.approved },
    create: { parentId, studentId, status: ParentLinkStatus.approved },
  });

  console.log(
    `Usuarios demo listos: ${DEMO_USERS.map((u) => u.email).join(", ")}`,
  );
}

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
  const cycle =
    existingCycle ??
    (await prisma.academicCycle.create({
      data: {
        schoolId: school.id,
        name: `${year}-${year + 1}`,
        startsAt: new Date(`${year}-08-15`),
        endsAt: new Date(`${year + 1}-07-15`),
        isActive: true,
      },
    }));

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@sca.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "Definí SEED_ADMIN_PASSWORD en .env antes de correr el seed (ver .env.example).",
    );
  }
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

  await seedDemoUsers(school.id, cycle.id);

  console.log(`Seed OK — admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
