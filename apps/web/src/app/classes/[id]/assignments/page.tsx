"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createAssignment,
  getAccessToken,
  getStoredUser,
  listAssignments,
  publishAssignment,
  Assignment,
} from "@/shared/api-client";
import { AppShell } from "@/shared/ui/AppShell";
import styles from "@/features/classes/classes.module.css";

export default function ClassAssignmentsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = getStoredUser();
  const canManage = user?.role === "TEACHER" || user?.role === "ADMIN";
  const [items, setItems] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [maxScore, setMaxScore] = useState(10);
  const [mode, setMode] = useState<"individual" | "team">("individual");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  function reload(token: string) {
    return listAssignments(token, params.id).then(setItems);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    reload(token)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar tareas"),
      )
      .finally(() => setPageLoading(false));
  }, [params.id, router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createAssignment(token, params.id, {
        title,
        description,
        mode,
        dueAt: new Date(dueAt).toISOString(),
        maxScore,
        linkAttachments:
          linkUrl && linkTitle
            ? [{ url: linkUrl, title: linkTitle }]
            : undefined,
      });
      await publishAssignment(token, created.id);
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setLinkTitle("");
      await reload(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la tarea");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Tareas"
      lead="Archivos: PDF, DOC/DOCX e imágenes hasta 10 MB · también links"
      loading={pageLoading}
      loadingLabel="Cargando tareas…"
      actions={
        <>
          <Link className={styles.ghost} href={`/classes/${params.id}`}>
            Muro
          </Link>
          <Link className={styles.ghost} href="/classes">
            Clases
          </Link>
        </>
      }
    >
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {canManage ? (
        <form className={styles.form} onSubmit={onCreate}>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Nueva tarea</h2>
          <label className={styles.label}>
            Título
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Descripción
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Fecha límite
            <input
              className={styles.input}
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Puntaje máximo
            <input
              className={styles.input}
              type="number"
              min={1}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              required
            />
          </label>
          <label className={styles.label}>
            Modalidad
            <select
              className={styles.input}
              value={mode}
              onChange={(e) => setMode(e.target.value as "individual" | "team")}
            >
              <option value="individual">Individual</option>
              <option value="team">Por equipo</option>
            </select>
          </label>
          <label className={styles.label}>
            Link de apoyo (opcional)
            <input
              className={styles.input}
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
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
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Publicando…" : "Crear y publicar"}
          </button>
        </form>
      ) : null}

      <ul className={styles.list}>
        {items.map((a) => (
          <li key={a.id} className={styles.item}>
            <Link href={`/classes/${params.id}/assignments/${a.id}`}>
              {a.title}
            </Link>
            <p className={styles.muted}>
              {a.mode} · entrega {new Date(a.dueAt).toLocaleString("es-MX")} ·{" "}
              {a.maxScore} pts
              {!a.publishedAt ? " · borrador" : ""}
            </p>
          </li>
        ))}
      </ul>
      {items.length === 0 ? (
        <p className={styles.muted}>No hay tareas publicadas todavía.</p>
      ) : null}
    </AppShell>
  );
}
