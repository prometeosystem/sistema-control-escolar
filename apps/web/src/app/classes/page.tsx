"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Classroom,
  clearSession,
  getAccessToken,
  getStoredUser,
  listClasses,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const user = getStoredUser();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    listClasses(token)
      .then(setClasses)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar clases"),
      );
  }, [router]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Mis clases</h1>
          <p className={styles.muted}>
            {user?.fullName} · {user?.role}
          </p>
        </div>
        <div className={styles.actions}>
          {(user?.role === "TEACHER" || user?.role === "ADMIN") && (
            <Link className={styles.button} href="/classes/new">
              Nueva clase
            </Link>
          )}
          {(user?.role === "STUDENT" || user?.role === "ADMIN") && (
            <Link className={styles.ghost} href="/classes/join">
              Unirme con código
            </Link>
          )}
          <Link className={styles.ghost} href="/dashboard">
            Panel
          </Link>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
          >
            Salir
          </button>
        </div>
      </header>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {classes.length === 0 ? (
        <p className={styles.muted}>
          Todavía no hay clases.{" "}
          {user?.role === "TEACHER"
            ? "Creá la primera."
            : "Unite con el código que te dio tu profesor."}
        </p>
      ) : (
        <ul className={styles.list}>
          {classes.map((c) => (
            <li key={c.id} className={styles.item}>
              <Link href={`/classes/${c.id}`}>
                {c.name}
                {c.section ? ` · ${c.section}` : ""}
              </Link>
              <p className={styles.muted}>
                {c.subject ?? "Sin materia"} · {c._count?.memberships ?? 0}{" "}
                miembros · {c._count?.posts ?? 0} publicaciones
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
