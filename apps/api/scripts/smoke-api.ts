/**
 * Smoke test E2E contra la API local (requiere API + Postgres + seed).
 * Uso: pnpm --filter @sca/api test:smoke
 */
const API = process.env.API_URL ?? "http://localhost:3001/api/v1";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@sca.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

type Auth = { accessToken: string; user: { id: string; role: string } };

async function req<T>(
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(
      `${opts.method ?? "GET"} ${path} → ${res.status}: ${JSON.stringify(body)}`,
    );
  }
  return body as T;
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
  if (!ADMIN_PASSWORD) {
    throw new Error("Definí SEED_ADMIN_PASSWORD para el smoke test");
  }

  const health = await req<{ status: string; phase: number }>("/health");
  assert(health.status === "ok", "health.status");
  assert(health.phase >= 6, "health.phase >= 6");

  const admin = await req<Auth>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert(admin.accessToken, "admin token");

  const stats = await req<{ users: number; classes: number }>("/admin/stats", {
    token: admin.accessToken,
  });
  assert(stats.users >= 1, "stats.users");

  const suffix = Date.now();
  const teacher = await req<Auth>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: `teacher.smoke.${suffix}@sca.local`,
      password: "SmokeTest123!",
      fullName: "Prof Smoke",
      role: "TEACHER",
    }),
  });
  const student = await req<Auth>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: `student.smoke.${suffix}@sca.local`,
      password: "SmokeTest123!",
      fullName: "Alumno Smoke",
      role: "STUDENT",
    }),
  });
  const parent = await req<Auth>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: `parent.smoke.${suffix}@sca.local`,
      password: "SmokeTest123!",
      fullName: "Padre Smoke",
      role: "PARENT",
    }),
  });

  const cycles = await req<Array<{ id: string; isActive: boolean }>>(
    "/cycles",
    { token: teacher.accessToken },
  );
  const cycle = cycles.find((c) => c.isActive) ?? cycles[0];
  assert(cycle, "cycle exists");

  const classroom = await req<{ id: string; joinCode: string }>("/classes", {
    method: "POST",
    token: teacher.accessToken,
    body: JSON.stringify({
      name: `Clase smoke ${suffix}`,
      cycleId: cycle.id,
      subject: "Demo",
    }),
  });

  await req("/classes/join", {
    method: "POST",
    token: student.accessToken,
    body: JSON.stringify({ joinCode: classroom.joinCode }),
  });

  const due = new Date(Date.now() + 86_400_000).toISOString();
  const assignment = await req<{ id: string }>(
    `/classes/${classroom.id}/assignments`,
    {
      method: "POST",
      token: teacher.accessToken,
      body: JSON.stringify({
        title: "Tarea smoke",
        description: "Entrega de prueba",
        mode: "individual",
        dueAt: due,
        maxScore: 10,
      }),
    },
  );

  await req(`/assignments/${assignment.id}/publish`, {
    method: "POST",
    token: teacher.accessToken,
    body: JSON.stringify({}),
  });

  const submission = await req<{ id: string }>(
    `/assignments/${assignment.id}/submit`,
    {
      method: "POST",
      token: student.accessToken,
      body: JSON.stringify({ content: "Listo" }),
    },
  );

  await req(`/submissions/${submission.id}/grade`, {
    method: "POST",
    token: teacher.accessToken,
    body: JSON.stringify({ score: 9, feedback: "Bien" }),
  });

  const link = await req<{ id: string; status: string }>(
    "/parents/link-request",
    {
      method: "POST",
      token: parent.accessToken,
      body: JSON.stringify({
        studentEmail: `student.smoke.${suffix}@sca.local`,
      }),
    },
  );
  assert(link.status === "pending", "parent link pending");

  const approved = await req<{ status: string }>(
    `/parents/link-requests/${link.id}/approve`,
    {
      method: "POST",
      token: student.accessToken,
      body: JSON.stringify({}),
    },
  );
  assert(approved.status === "approved", "parent link approved");

  const children = await req<Array<{ id: string }>>("/parents/children", {
    token: parent.accessToken,
  });
  assert(children.some((c) => c.id === student.user.id), "parent sees child");

  const grades = await req<unknown[]>(
    `/parents/children/${student.user.id}/grades`,
    { token: parent.accessToken },
  );
  assert(grades.length >= 1, "parent sees grades");

  const notifs = await req<{ data: unknown[] }>("/notifications", {
    token: student.accessToken,
  });
  assert(Array.isArray(notifs.data), "notifications list");

  const smtp = await req<{ configured: boolean }>("/admin/smtp", {
    token: admin.accessToken,
  });
  assert(typeof smtp.configured === "boolean", "smtp settings");

  // eslint-disable-next-line no-console
  console.log("✅ Smoke test OK — fases 1–6 verificadas");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Smoke test falló:", err instanceof Error ? err.message : err);
  process.exit(1);
});
