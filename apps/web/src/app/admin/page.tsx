"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminStats,
  AuthUser,
  getAccessToken,
  getAdminStats,
  getStoredUser,
  inviteUser,
  listUsers,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<
    Array<{ id: string; email: string; fullName: string; role: string }>
  >([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TEACHER" | "STUDENT" | "PARENT" | "ADMIN">(
    "TEACHER",
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload(token: string) {
    const [s, u] = await Promise.all([
      getAdminStats(token),
      listUsers(token, {}),
    ]);
    setStats(s);
    setUsers(u.data);
  }

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (stored.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    setUser(stored);
    reload(token).catch((err) =>
      setError(err instanceof Error ? err.message : "Error al cargar admin"),
    );
  }, [router]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await inviteUser(token, { email, fullName, role, password });
      setMessage(`Usuario ${email} creado.`);
      setEmail("");
      setFullName("");
      setPassword("");
      await reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo invitar");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <p className={styles.muted}>Cargando…</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Panel admin</h1>
          <p className={styles.muted}>
            Resumen de la escuela, altas de usuarios y SMTP.
          </p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.ghost} href="/admin/smtp">
            SMTP
          </Link>
          <Link className={styles.ghost} href="/parents">
            Vínculos padres
          </Link>
          <Link className={styles.ghost} href="/dashboard">
            Dashboard
          </Link>
        </div>
      </header>

      {error ? <p role="alert">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      {stats ? (
        <section style={{ marginBottom: "2rem" }}>
          <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
            Estadísticas
          </h2>
          <ul className={styles.list}>
            <li className={styles.item}>
              Usuarios: {stats.users} (T {stats.teachers} · S {stats.students} ·
              P {stats.parents})
            </li>
            <li className={styles.item}>Clases: {stats.classes}</li>
            <li className={styles.item}>
              Tareas: {stats.assignments} · Entregas: {stats.submissions} ·
              Exámenes: {stats.exams}
            </li>
            <li className={styles.item}>
              Vínculos parentales pendientes: {stats.pendingParentLinks}
            </li>
          </ul>
        </section>
      ) : null}

      <section className={styles.form}>
        <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
          Invitar / crear usuario
        </h2>
        <form onSubmit={onInvite}>
          <label className={styles.label}>
            Nombre
            <input
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label className={styles.label}>
            Correo
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Contraseña temporal
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <label className={styles.label}>
            Rol
            <select
              className={styles.input}
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value as "TEACHER" | "STUDENT" | "PARENT" | "ADMIN",
                )
              }
            >
              <option value="TEACHER">Profesor</option>
              <option value="STUDENT">Alumno</option>
              <option value="PARENT">Padre</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Creando…" : "Crear usuario"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
          Usuarios recientes
        </h2>
        <ul className={styles.list}>
          {users.slice(0, 20).map((u) => (
            <li key={u.id} className={styles.item}>
              <strong>{u.fullName}</strong>
              <p className={styles.muted}>
                {u.email} · {u.role}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
