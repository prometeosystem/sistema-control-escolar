"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChildGrade,
  ChildSubmission,
  getAccessToken,
  getChildGrades,
  getChildSubmissions,
  getStoredUser,
} from "@/shared/api-client";
import { AppShell } from "@/shared/ui/AppShell";
import styles from "@/features/classes/classes.module.css";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  submitted: "Entregada",
  graded: "Calificada",
  late: "Tarde",
};

function toNumber(value: string | number | null | undefined) {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function scorePercent(score: string | number, max: string | number) {
  const s = toNumber(score);
  const m = toNumber(max);
  if (s == null || m == null || m <= 0) return null;
  return Math.round((s / m) * 1000) / 10;
}

export default function ChildProgressPage() {
  const router = useRouter();
  const params = useParams();
  const childId = String(params.id);
  const [grades, setGrades] = useState<ChildGrade[]>([]);
  const [submissions, setSubmissions] = useState<ChildSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [gradeSearch, setGradeSearch] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
      )
      .finally(() => setPageLoading(false));
  }, [router, childId]);

  const filteredGrades = useMemo(() => {
    const q = gradeSearch.trim().toLowerCase();
    if (!q) return grades;
    return grades.filter((g) =>
      (g.assignment?.title ?? "").toLowerCase().includes(q),
    );
  }, [grades, gradeSearch]);

  const filteredSubmissions = useMemo(() => {
    const q = submissionSearch.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!q) return true;
      return (s.assignment?.title ?? "").toLowerCase().includes(q);
    });
  }, [submissions, submissionSearch, statusFilter]);

  const chartRows = useMemo(() => {
    return grades
      .map((g) => {
        const pct = scorePercent(g.score, g.maxScore);
        if (pct == null) return null;
        return {
          id: g.id,
          label: g.assignment?.title ?? "Tarea",
          percent: pct,
          score: toNumber(g.score) ?? 0,
          max: toNumber(g.maxScore) ?? 0,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  }, [grades]);

  const average =
    chartRows.length > 0
      ? Math.round(
          (chartRows.reduce((sum, r) => sum + r.percent, 0) / chartRows.length) *
            10,
        ) / 10
      : null;

  const submittedCount = submissions.filter((s) =>
    ["submitted", "graded", "late"].includes(s.status),
  ).length;

  return (
    <AppShell
      title="Progreso del alumno"
      lead="Calificaciones y entregas en tabla, con promedio visual."
      loading={pageLoading}
      loadingLabel="Cargando progreso…"
      actions={
        <Link className={styles.ghost} href="/parents">
          Volver
        </Link>
      }
    >
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <section className={styles.statRow} aria-label="Resumen">
        <div className={styles.stat}>
          <p className={styles.statValue}>{grades.length}</p>
          <p className={styles.statLabel}>Calificaciones</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>
            {average != null ? `${average}%` : "—"}
          </p>
          <p className={styles.statLabel}>Promedio</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{submittedCount}</p>
          <p className={styles.statLabel}>Entregas hechas</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{submissions.length}</p>
          <p className={styles.statLabel}>Entregas totales</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Gráfica de calificaciones</h2>
        {chartRows.length === 0 ? (
          <p className={styles.muted}>Todavía no hay notas para graficar.</p>
        ) : (
          <div className={styles.chartPanel} role="img" aria-label="Gráfica de barras de calificaciones">
            <div className={styles.chartBars}>
              {chartRows.map((row) => (
                <div key={row.id} className={styles.chartItem}>
                  <div className={styles.chartBarTrack}>
                    <div
                      className={styles.chartBarFill}
                      style={{ height: `${Math.max(row.percent, 4)}%` }}
                      title={`${row.label}: ${row.score}/${row.max} (${row.percent}%)`}
                    />
                  </div>
                  <p className={styles.chartValue}>{row.percent}%</p>
                  <p className={styles.chartLabel} title={row.label}>
                    {row.label}
                  </p>
                </div>
              ))}
            </div>
            {average != null ? (
              <p className={styles.muted}>
                Línea de referencia: promedio {average}%
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Tabla de calificaciones ({filteredGrades.length})
        </h2>
        <div className={styles.tableToolbar}>
          <input
            className={styles.input}
            type="search"
            placeholder="Buscar por tarea…"
            value={gradeSearch}
            onChange={(e) => setGradeSearch(e.target.value)}
            aria-label="Buscar calificaciones"
          />
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Nota</th>
                <th>%</th>
                <th>Retroalimentación</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    {grades.length === 0
                      ? "Sin calificaciones aún."
                      : "No hay resultados para esa búsqueda."}
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g) => {
                  const pct = scorePercent(g.score, g.maxScore);
                  return (
                    <tr key={g.id}>
                      <td>{g.assignment?.title ?? "Tarea"}</td>
                      <td>
                        {String(g.score)}/{String(g.maxScore)}
                      </td>
                      <td>{pct != null ? `${pct}%` : "—"}</td>
                      <td>{g.feedback || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Tabla de entregas ({filteredSubmissions.length})
        </h2>
        <div className={styles.tableToolbar}>
          <input
            className={styles.input}
            type="search"
            placeholder="Buscar por tarea…"
            value={submissionSearch}
            onChange={(e) => setSubmissionSearch(e.target.value)}
            aria-label="Buscar entregas"
          />
          <select
            className={styles.input}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="submitted">Entregada</option>
            <option value="graded">Calificada</option>
            <option value="late">Tarde</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Estado</th>
                <th>Fecha de entrega</th>
                <th>Nota</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyRow}>
                    {submissions.length === 0
                      ? "Sin entregas registradas."
                      : "No hay resultados con esos filtros."}
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.assignment?.title ?? "Tarea"}</td>
                    <td>
                      <span className={styles.roleBadge}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td>
                      {s.submittedAt
                        ? new Date(s.submittedAt).toLocaleString("es-MX")
                        : "—"}
                    </td>
                    <td>
                      {s.grade
                        ? `${String(s.grade.score)}/${String(s.grade.maxScore ?? "?")}`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
