"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL, getAccessToken } from "@/shared/api-client";
import { AppShell } from "@/shared/ui/AppShell";
import styles from "@/features/classes/classes.module.css";

type ResultRow = {
  id: string;
  attemptNo: number;
  score: string | number | null;
  maxScore: string | number | null;
  passed: boolean | null;
  student: { fullName: string; email: string };
};

export default function ExamResultsPage() {
  const params = useParams<{ id: string; examId: string }>();
  const router = useRouter();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetch(`${API_URL}/exams/${params.examId}/results`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(setRows)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => setPageLoading(false));
  }, [params.examId, router]);

  return (
    <AppShell
      title="Resultados del examen"
      loading={pageLoading}
      loadingLabel="Cargando resultados…"
      actions={
        <Link className={styles.ghost} href={`/classes/${params.id}/exams`}>
          Volver
        </Link>
      }
    >
      {error ? <p className={styles.error}>{error}</p> : null}
      <ul className={styles.list}>
        {rows.map((r) => (
          <li key={r.id} className={styles.item}>
            <strong>{r.student.fullName}</strong>
            <p className={styles.muted}>
              Intento {r.attemptNo} · {r.score}/{r.maxScore}
              {r.passed == null ? "" : r.passed ? " · Aprobado" : " · No aprobado"}
            </p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
