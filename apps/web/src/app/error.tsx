"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./error.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.main}>
      <p className={styles.code}>505</p>
      <h1 className={styles.title}>Error del servidor</h1>
      <p className={styles.lead}>
        Algo falló al cargar esta página. Podés reintentar o volver al inicio.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={reset}>
          Reintentar
        </button>
        <Link className={styles.secondary} href="/dashboard">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
