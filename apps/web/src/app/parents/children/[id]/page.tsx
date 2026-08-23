"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChildGrade,
  ChildSubmission,
  getAccessToken,
  getChildGrades,
  getChildSubmissions,
  getStoredUser,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function ChildProgressPage() {
  const router = useRouter();
  const params = useParams();
  const childId = String(params.id);
  const [grades, setGrades] = useState<ChildGrade[]>([]);
  const [submissions, setSubmissions] = useState<ChildSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (!["PARENT", "ADMIN"].includes(stored.role)) {
      router.replace("/dashboard");
      return;
    }
    Promise.all([
      getChildGrades(token, childId),
      getChildSubmissions(token, childId),
    ])
      .then(([g, s]) => {
        setGrades(g);
        setSubmissions(s);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar"),
      );
  }, [router, childId]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Progreso del alumno</h1>
        </div>
        <Link className={styles.ghost} href="/parents">
          Volver
        </Link>
      </header>

      {error ? <p role="alert">{error}</p> : null}

      <section>
        <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
          Calificaciones
        </h2>
        <ul className={styles.list}>
          {grades.length === 0 ? (
            <li className={styles.muted}>Sin calificaciones aún.</li>
          ) : (
            grades.map((g) => (
              <li key={g.id} className={styles.item}>
                <strong>{g.assignment?.title ?? "Tarea"}</strong>
                <p className={styles.muted}>
                  {String(g.score)}/{String(g.maxScore)}
                  {g.feedback ? ` · ${g.feedback}` : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
          Entregas
        </h2>
        <ul className={styles.list}>
          {submissions.length === 0 ? (
            <li className={styles.muted}>Sin entregas registradas.</li>
          ) : (
            submissions.map((s) => (
              <li key={s.id} className={styles.item}>
                <strong>{s.assignment?.title ?? "Tarea"}</strong>
                <p className={styles.muted}>
                  Estado: {s.status}
                  {s.submittedAt
                    ? ` · ${new Date(s.submittedAt).toLocaleString("es-MX")}`
                    : ""}
                  {s.grade
                    ? ` · Nota ${String(s.grade.score)}/${String(s.grade.maxScore ?? "?")}`
                    : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
