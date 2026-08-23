"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthUser,
  clearSession,
  getAccessToken,
  getStoredUser,
  apiGet,
} from "@/shared/api-client";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    apiGet<AuthUser>("/auth/me", token)
      .then(setUser)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Sesión inválida");
        clearSession();
        router.replace("/login");
      });
  }, [router]);

  function logout() {
    clearSession();
    router.push("/login");
  }

  if (!user) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>Cargando sesión…</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Hola, {user.fullName}</h1>
          <p className={styles.muted}>
            Rol: {user.role} · {user.email}
          </p>
        </div>
        <button type="button" className={styles.button} onClick={logout}>
          Cerrar sesión
        </button>
      </header>
      {error ? <p role="alert">{error}</p> : null}
      <section className={styles.panel}>
        <h2>Fase 6 lista</h2>
        <p className={styles.muted}>
          Padres, panel admin y flujo completo de la escuela.
        </p>
        <nav className={styles.nav}>
          <Link href="/classes">Clases</Link>
          <Link href="/notifications">Notificaciones</Link>
          {["PARENT", "STUDENT", "ADMIN"].includes(user.role) ? (
            <Link href="/parents">Padres / vínculos</Link>
          ) : null}
          {user.role === "ADMIN" ? (
            <>
              <Link href="/admin">Panel admin</Link>
              <Link href="/admin/smtp">SMTP</Link>
            </>
          ) : null}
        </nav>
      </section>
    </main>
  );
}
