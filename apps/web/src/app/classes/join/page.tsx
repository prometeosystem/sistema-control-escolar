"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, joinClass } from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function JoinClassPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await joinClass(token, joinCode.trim());
      router.push(`/classes/${result.class.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo unir a la clase");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <p className={styles.brand}>SCA</p>
      <h1 className={styles.title}>Unirme a una clase</h1>
      <p className={styles.muted}>Ingresá el código que te compartió tu profesor.</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label}>
          Código
          <input
            className={styles.input}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            required
            minLength={4}
            placeholder="ABC123"
          />
        </label>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Uniéndome…" : "Unirme"}
        </button>
        <Link className={styles.ghost} href="/classes">
          Volver
        </Link>
      </form>
    </main>
  );
}
