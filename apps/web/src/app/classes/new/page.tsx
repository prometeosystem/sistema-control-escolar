"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AcademicCycle,
  createClass,
  getAccessToken,
  listCycles,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function NewClassPage() {
  const router = useRouter();
  const [cycles, setCycles] = useState<AcademicCycle[]>([]);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    listCycles(token)
      .then((data) => {
        setCycles(data);
        const active = data.find((c) => c.isActive) ?? data[0];
        if (active) setCycleId(active.id);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudieron cargar ciclos"),
      );
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createClass(token, {
        name,
        cycleId,
        section: section || undefined,
        subject: subject || undefined,
      });
      router.push(`/classes/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la clase");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <p className={styles.brand}>SCA</p>
      <h1 className={styles.title}>Nueva clase</h1>
      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label}>
          Nombre
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </label>
        <label className={styles.label}>
          Sección
          <input
            className={styles.input}
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="2A"
          />
        </label>
        <label className={styles.label}>
          Materia
          <input
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Matemáticas"
          />
        </label>
        <label className={styles.label}>
          Ciclo escolar
          <select
            className={styles.input}
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            required
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.isActive ? " (activo)" : ""}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <button className={styles.button} type="submit" disabled={loading || !cycleId}>
          {loading ? "Creando…" : "Crear clase"}
        </button>
        <Link className={styles.ghost} href="/classes">
          Cancelar
        </Link>
      </form>
    </main>
  );
}
