"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ClassPost,
  Classroom,
  createPost,
  getAccessToken,
  getClass,
  getStoredUser,
  listPosts,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = getStoredUser();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canPost = user?.role === "TEACHER" || user?.role === "ADMIN";

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    Promise.all([getClass(token, params.id), listPosts(token, params.id)])
      .then(([c, p]) => {
        setClassroom(c);
        setPosts(p);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar la clase"),
      );
  }, [params.id, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const post = await createPost(token, params.id, { title, body });
      setPosts((prev) => [post, ...prev]);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>{classroom?.name ?? "Clase"}</h1>
          {classroom ? (
            <p className={styles.muted}>
              Código: <span className={styles.code}>{classroom.joinCode}</span>
              {classroom.subject ? ` · ${classroom.subject}` : ""}
            </p>
          ) : null}
        </div>
        <Link className={styles.ghost} href="/classes">
          Todas las clases
        </Link>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {canPost ? (
        <form className={styles.form} onSubmit={onSubmit}>
          <h2 className={styles.title} style={{ fontSize: "1.15rem" }}>
            Nueva publicación
          </h2>
          <label className={styles.label}>
            Título
            <input
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label className={styles.label}>
            Contenido
            <textarea
              className={styles.textarea}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </label>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Publicando…" : "Publicar en el muro"}
          </button>
        </form>
      ) : null}

      <section className={styles.feed} aria-label="Muro de la clase">
        {posts.length === 0 ? (
          <p className={styles.muted}>Aún no hay publicaciones en esta clase.</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className={styles.post}>
              <h3>{post.title}</h3>
              <p className={styles.muted}>
                {post.author.fullName} ·{" "}
                {new Date(post.createdAt).toLocaleString("es-MX")}
              </p>
              <p>{post.body}</p>
              {post.attachments?.length ? (
                <p className={styles.muted}>
                  Adjuntos:{" "}
                  {post.attachments.map((a) => a.originalName).join(", ")}
                </p>
              ) : null}
            </article>
          ))
        )}
      </section>
    </main>
  );
}
