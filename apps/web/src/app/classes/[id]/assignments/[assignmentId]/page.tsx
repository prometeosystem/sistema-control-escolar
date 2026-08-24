"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Assignment,
  Submission,
  getAccessToken,
  getAssignment,
  getStoredUser,
  gradeSubmission,
  listSubmissions,
  mySubmission,
  submitAssignment,
} from "@/shared/api-client";
import { AppShell } from "@/shared/ui/AppShell";
import styles from "@/features/classes/classes.module.css";

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string; assignmentId: string }>();
  const router = useRouter();
  const user = getStoredUser();
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mine, setMine] = useState<Submission | null>(null);
  const [all, setAll] = useState<Submission[]>([]);
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    getAssignment(token, params.assignmentId)
      .then(async (a) => {
        setAssignment(a);
        if (isTeacher) {
          setAll(await listSubmissions(token, params.assignmentId));
        } else {
          setMine(await mySubmission(token, params.assignmentId));
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar"),
      )
      .finally(() => setPageLoading(false));
  }, [params.assignmentId, router, isTeacher]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await submitAssignment(token, params.assignmentId, {
        content,
        linkAttachments:
          linkUrl && linkTitle
            ? [{ url: linkUrl, title: linkTitle }]
            : undefined,
      });
      setMine(result);
      setContent("");
      setLinkUrl("");
      setLinkTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entregar");
    } finally {
      setLoading(false);
    }
  }

  async function onGrade(submissionId: string, score: number) {
    const token = getAccessToken();
    if (!token) return;
    try {
      await gradeSubmission(token, submissionId, { score });
      setAll(await listSubmissions(token, params.assignmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo calificar");
    }
  }

  return (
    <AppShell
      title={assignment?.title ?? "Tarea"}
      lead={
        assignment
          ? `Entrega hasta ${new Date(assignment.dueAt).toLocaleString("es-MX")} · ${assignment.maxScore} pts · ${assignment.mode}`
          : undefined
      }
      loading={pageLoading}
      loadingLabel="Cargando tarea…"
      actions={
        <Link
          className={styles.ghost}
          href={`/classes/${params.id}/assignments`}
        >
          Volver a tareas
        </Link>
      }
    >
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {assignment ? (
        <section className={styles.post}>
          <p>{assignment.description}</p>
          {assignment.attachments?.length ? (
            <ul className={styles.list}>
              {assignment.attachments.map((a) => (
                <li key={a.id} className={styles.muted}>
                  {a.kind === "link" && a.externalUrl ? (
                    <a href={a.externalUrl} target="_blank" rel="noreferrer">
                      {a.originalName}
                    </a>
                  ) : (
                    `${a.originalName} (${a.mimeType})`
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {!isTeacher ? (
        <form className={styles.form} onSubmit={onSubmit}>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Tu entrega</h2>
          {mine ? (
            <p className={styles.muted}>
              Estado: {mine.status}
              {mine.grade
                ? ` · Nota: ${mine.grade.score}/${assignment?.maxScore}`
                : ""}
            </p>
          ) : null}
          <label className={styles.label}>
            Comentario / texto
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            Link de entrega (Drive, Canva, etc.)
            <input
              className={styles.input}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className={styles.label}>
            Título del link
            <input
              className={styles.input}
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
            />
          </label>
          <p className={styles.muted}>
            También podés adjuntar PDF/DOC/imágenes vía API de archivos (máx. 10
            MB).
          </p>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Enviando…" : "Entregar"}
          </button>
        </form>
      ) : (
        <section className={styles.feed}>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Entregas</h2>
          {all.length === 0 ? (
            <p className={styles.muted}>Todavía no hay entregas.</p>
          ) : (
            all.map((s) => (
              <article key={s.id} className={styles.post}>
                <h3>{s.student?.fullName ?? "Equipo"}</h3>
                <p className={styles.muted}>
                  {s.status}
                  {s.submittedAt
                    ? ` · ${new Date(s.submittedAt).toLocaleString("es-MX")}`
                    : ""}
                </p>
                <p>{s.content}</p>
                {s.attachments?.map((a) => (
                  <p key={a.id} className={styles.muted}>
                    {a.kind === "link" && a.externalUrl ? (
                      <a href={a.externalUrl} target="_blank" rel="noreferrer">
                        {a.originalName}
                      </a>
                    ) : (
                      a.originalName
                    )}
                  </p>
                ))}
                {s.grade ? (
                  <p>Nota: {s.grade.score}</p>
                ) : (
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() =>
                      onGrade(
                        s.id,
                        Number(prompt("Nota:", String(assignment?.maxScore ?? 10)) ?? 0),
                      )
                    }
                  >
                    Calificar
                  </button>
                )}
              </article>
            ))
          )}
        </section>
      )}
    </AppShell>
  );
}
