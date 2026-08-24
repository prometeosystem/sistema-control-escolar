"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Assignment,
  ClassPost,
  Classroom,
  ExamSummary,
  createPost,
  getAccessToken,
  getClass,
  getStoredUser,
  listAssignments,
  listExams,
  listPosts,
  uploadFileAttachment,
} from "@/shared/api-client";
import { AppShell } from "@/shared/ui/AppShell";
import { Modal } from "@/shared/ui/Modal";
import styles from "@/features/classes/classes.module.css";

type DraftLink = { url: string; title: string };
type DraftFile = { file: File; id: string };

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = getStoredUser();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [unit, setUnit] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [files, setFiles] = useState<DraftFile[]>([]);
  const [links, setLinks] = useState<DraftLink[]>([{ url: "", title: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const canPost = user?.role === "TEACHER" || user?.role === "ADMIN";

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    Promise.all([
      getClass(token, params.id),
      listPosts(token, params.id),
      listAssignments(token, params.id),
      listExams(token, params.id),
    ])
      .then(([c, p, a, e]) => {
        setClassroom(c);
        setPosts(p);
        setAssignments(a);
        setExams(e);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "No se pudo cargar la clase",
        ),
      )
      .finally(() => setPageLoading(false));
  }, [params.id, router]);

  function openModal() {
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError(null);
    setTitle("");
    setBody("");
    setUnit("");
    setDueAt("");
    setFiles([]);
    setLinks([{ url: "", title: "" }]);
  }

  function onPickFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = Array.from(list).map((file) => ({
      file,
      id: `${file.name}-${file.size}-${file.lastModified}`,
    }));
    setFiles((prev) => {
      const ids = new Set(prev.map((f) => f.id));
      return [...prev, ...next.filter((f) => !ids.has(f.id))];
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setFormError(null);
    try {
      const attachmentIds: string[] = [];
      for (const item of files) {
        const uploaded = await uploadFileAttachment(token, item.file, "post");
        attachmentIds.push(uploaded.id);
      }

      const linkAttachments = links
        .map((l) => ({
          url: l.url.trim(),
          title: l.title.trim() || l.url.trim(),
        }))
        .filter((l) => l.url.length > 0);

      const post = await createPost(token, params.id, {
        title,
        body,
        unit: unit.trim() || undefined,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        attachmentIds: attachmentIds.length ? attachmentIds : undefined,
        linkAttachments: linkAttachments.length ? linkAttachments : undefined,
      });
      setPosts((prev) => [post, ...prev]);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setLoading(false);
    }
  }

  const attachmentCount = posts.reduce(
    (n, p) => n + (p.attachments?.length ?? 0),
    0,
  );

  return (
    <AppShell
      title={classroom?.name ?? "Clase"}
      lead={classroom?.subject ?? undefined}
      loading={pageLoading}
      loadingLabel="Cargando clase…"
      actions={
        <>
          {canPost ? (
            <button type="button" className={styles.button} onClick={openModal}>
              Crear publicación
            </button>
          ) : null}
          <Link
            className={styles.ghost}
            href={`/classes/${params.id}/assignments`}
          >
            Tareas
          </Link>
          <Link className={styles.ghost} href={`/classes/${params.id}/exams`}>
            Exámenes
          </Link>
          <Link className={styles.ghost} href="/classes">
            Todas las clases
          </Link>
        </>
      }
    >
      {classroom ? (
        <p className={styles.muted}>
          Código: <span className={styles.code}>{classroom.joinCode}</span>
        </p>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <section className={styles.statRow} aria-label="Resumen de la clase">
        <div className={styles.stat}>
          <p className={styles.statValue}>{posts.length}</p>
          <p className={styles.statLabel}>Publicaciones</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{assignments.length}</p>
          <p className={styles.statLabel}>Tareas</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{exams.length}</p>
          <p className={styles.statLabel}>Exámenes</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{attachmentCount}</p>
          <p className={styles.statLabel}>Materiales / archivos</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Actividades</h2>
        <div className={styles.grid}>
          <Link
            className={styles.tile}
            href={`/classes/${params.id}/assignments`}
          >
            <h3 className={styles.tileTitle}>Tareas</h3>
            <p className={styles.tileMeta}>
              {assignments.length === 0
                ? "Sin tareas todavía"
                : `${assignments.length} tarea${assignments.length === 1 ? "" : "s"}`}
            </p>
          </Link>
          <Link className={styles.tile} href={`/classes/${params.id}/exams`}>
            <h3 className={styles.tileTitle}>Exámenes</h3>
            <p className={styles.tileMeta}>
              {exams.length === 0
                ? "Sin exámenes todavía"
                : `${exams.length} examen${exams.length === 1 ? "" : "es"}`}
            </p>
          </Link>
        </div>
      </section>

      {(assignments.length > 0 || exams.length > 0) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Trabajo reciente</h2>
          <ul className={styles.list}>
            {assignments.slice(0, 4).map((a) => (
              <li key={a.id} className={styles.item}>
                <Link href={`/classes/${params.id}/assignments/${a.id}`}>
                  {a.title}
                </Link>
                <p className={styles.muted}>
                  Tarea · entrega {new Date(a.dueAt).toLocaleString("es-MX")} ·{" "}
                  {a.maxScore} pts
                </p>
              </li>
            ))}
            {exams.slice(0, 4).map((exam) => (
              <li key={exam.id} className={styles.item}>
                <Link href={`/classes/${params.id}/exams`}>{exam.title}</Link>
                <p className={styles.muted}>
                  Examen · {exam.publishedAt ? "Publicado" : "Borrador"}
                  {exam._count?.questions != null
                    ? ` · ${exam._count.questions} preguntas`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section} aria-label="Muro de la clase">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Muro y material</h2>
          {canPost ? (
            <button type="button" className={styles.ghost} onClick={openModal}>
              Crear publicación
            </button>
          ) : null}
        </div>
        <div className={styles.feed}>
          {posts.length === 0 ? (
            <p className={styles.muted}>
              Aún no hay publicaciones ni material en esta clase.
              {canPost
                ? " Usá “Crear publicación” para subir avisos, presentaciones o links."
                : ""}
            </p>
          ) : (
            posts.map((post) => (
              <article key={post.id} className={styles.post}>
                <h3>{post.title}</h3>
                <p className={styles.muted}>
                  {post.author.fullName} ·{" "}
                  {new Date(post.createdAt).toLocaleString("es-MX")}
                  {post.unit ? ` · ${post.unit}` : ""}
                  {post.dueAt
                    ? ` · Vence ${new Date(post.dueAt).toLocaleString("es-MX")}`
                    : ""}
                </p>
                <p>{post.body}</p>
                {post.attachments?.length ? (
                  <div className={styles.attachmentList}>
                    <p className={styles.muted}>Material:</p>
                    <ul>
                      {post.attachments.map((a) => (
                        <li key={a.id}>
                          {a.kind === "link" || a.externalUrl ? (
                            <a
                              href={a.externalUrl ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {a.originalName}
                            </a>
                          ) : (
                            a.originalName
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <Modal
        open={modalOpen}
        title="Crear publicación / material"
        onClose={closeModal}
        wide
      >
        <form className={styles.modalForm} onSubmit={onSubmit}>
          <label className={styles.label}>
            Título
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
              autoFocus
              placeholder="Ej. Presentación Unidad 2"
            />
          </label>
          <label className={styles.label}>
            Descripción / contenido
            <textarea
              className={styles.textarea}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Indicaciones para los alumnos…"
            />
          </label>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Unidad
              <input
                className={styles.input}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ej. Unidad 3 — Fracciones"
              />
            </label>
            <label className={styles.label}>
              Fecha y hora de vencimiento
              <input
                className={styles.input}
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </label>
          </div>

          <div className={styles.label}>
            <span>Archivos / presentaciones</span>
            <input
              className={styles.input}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {files.length > 0 ? (
              <ul className={styles.draftList}>
                {files.map((f) => (
                  <li key={f.id}>
                    <span>{f.file.name}</span>
                    <button
                      type="button"
                      className={styles.ghost}
                      onClick={() =>
                        setFiles((prev) => prev.filter((x) => x.id !== f.id))
                      }
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>
                PDF, Word, PowerPoint, Excel o imágenes (máx. 10 MB c/u).
              </p>
            )}
          </div>

          <div className={styles.label}>
            <span>Links</span>
            {links.map((link, idx) => (
              <div key={idx} className={styles.linkRow}>
                <input
                  className={styles.input}
                  placeholder="Título del link"
                  value={link.title}
                  onChange={(e) =>
                    setLinks((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, title: e.target.value } : l,
                      ),
                    )
                  }
                />
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://…"
                  value={link.url}
                  onChange={(e) =>
                    setLinks((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, url: e.target.value } : l,
                      ),
                    )
                  }
                />
                {links.length > 1 ? (
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() =>
                      setLinks((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className={styles.ghost}
              onClick={() =>
                setLinks((prev) => [...prev, { url: "", title: "" }])
              }
            >
              Agregar otro link
            </button>
          </div>

          {formError ? (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          ) : null}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.ghost}
              onClick={closeModal}
              disabled={loading}
            >
              Cancelar
            </button>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
