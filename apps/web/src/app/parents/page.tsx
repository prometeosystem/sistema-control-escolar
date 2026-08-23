"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthUser,
  ChildSummary,
  ParentLinkRequest,
  approveParentLink,
  getAccessToken,
  getStoredUser,
  listParentLinkRequests,
  listParentChildren,
  rejectParentLink,
  requestParentLink,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function ParentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [requests, setRequests] = useState<ParentLinkRequest[]>([]);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload(token: string, role: string) {
    const reqs = await listParentLinkRequests(token);
    setRequests(reqs);
    if (role === "PARENT" || role === "ADMIN") {
      setChildren(await listParentChildren(token));
    }
  }

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (!["PARENT", "STUDENT", "ADMIN"].includes(stored.role)) {
      router.replace("/dashboard");
      return;
    }
    setUser(stored);
    reload(token, stored.role).catch((err) =>
      setError(err instanceof Error ? err.message : "Error al cargar"),
    );
  }, [router]);

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await requestParentLink(token, studentEmail);
      setMessage("Solicitud enviada. El alumno debe aprobarla.");
      setStudentEmail("");
      await reload(token, user?.role ?? "PARENT");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setLoading(false);
    }
  }

  async function onApprove(id: string) {
    const token = getAccessToken();
    if (!token || !user) return;
    await approveParentLink(token, id);
    await reload(token, user.role);
  }

  async function onReject(id: string) {
    const token = getAccessToken();
    if (!token || !user) return;
    await rejectParentLink(token, id);
    await reload(token, user.role);
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <p className={styles.muted}>Cargando…</p>
      </main>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Padres y tutores</h1>
          <p className={styles.muted}>
            Vinculá tu cuenta al correo del alumno y consultá su progreso.
          </p>
        </div>
        <Link className={styles.ghost} href="/dashboard">
          Dashboard
        </Link>
      </header>

      {error ? <p role="alert">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      {user.role === "PARENT" || user.role === "ADMIN" ? (
        <>
          <section className={styles.form}>
            <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
              Solicitar vínculo
            </h2>
            <form onSubmit={onRequest}>
              <label className={styles.label}>
                Correo del alumno
                <input
                  className={styles.input}
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  required
                />
              </label>
              <button className={styles.button} type="submit" disabled={loading}>
                Enviar solicitud
              </button>
            </form>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
              Hijos vinculados
            </h2>
            <ul className={styles.list}>
              {children.length === 0 ? (
                <li className={styles.muted}>Aún no hay vínculos aprobados.</li>
              ) : (
                children.map((c) => (
                  <li key={c.id} className={styles.item}>
                    <Link href={`/parents/children/${c.id}`}>{c.fullName}</Link>
                    <p className={styles.muted}>{c.email}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      ) : null}

      {user.role === "STUDENT" || user.role === "ADMIN" ? (
        <section style={{ marginTop: "2rem" }}>
          <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
            Solicitudes {user.role === "STUDENT" ? "recibidas" : "pendientes"}
          </h2>
          <ul className={styles.list}>
            {pending.length === 0 ? (
              <li className={styles.muted}>No hay solicitudes pendientes.</li>
            ) : (
              pending.map((r) => (
                <li key={r.id} className={styles.item}>
                  <strong>{r.parent.fullName}</strong>
                  <p className={styles.muted}>
                    Quiere vincularse con {r.student.fullName} ({r.parent.email})
                  </p>
                  {user.role === "STUDENT" || user.role === "ADMIN" ? (
                    <div className={styles.actions}>
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() => onApprove(r.id)}
                      >
                        Aprobar
                      </button>
                      <button
                        className={styles.ghost}
                        type="button"
                        onClick={() => onReject(r.id)}
                      >
                        Rechazar
                      </button>
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
