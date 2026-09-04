"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AcademicCycle,
  Classroom,
  createClass,
  getAccessToken,
  getStoredUser,
  joinClass,
  listClasses,
  listCycles,
} from "@/shared/api-client";
import { classBannerColor } from "@/shared/lib/classColor";
import { AppShell } from "@/shared/ui/AppShell";
import { Modal } from "@/shared/ui/Modal";
import styles from "@/features/classes/classes.module.css";

type ModalKind = "create" | "join" | null;

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [cycles, setCycles] = useState<AcademicCycle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalKind>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [cycleId, setCycleId] = useState("");
  const user = getStoredUser();

  const canJoin = user?.role === "STUDENT" || user?.role === "ADMIN";
  const canCreate = user?.role === "TEACHER" || user?.role === "ADMIN";

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
      )
      .finally(() => setLoading(false));
  }, [router]);

  function closeModal() {
    setModal(null);
    setFormError(null);
    setJoinCode("");
    setName("");
    setSection("");
    setSubject("");
  }

  function openJoinModal() {
    setFormError(null);
    setJoinCode("");
    setModal("join");
  }

  async function openCreateModal() {
    setFormError(null);
    setModal("create");
    const token = getAccessToken();
    if (!token || cycles.length > 0) return;
    try {
      const data = await listCycles(token);
      setCycles(data);
      const active = data.find((c) => c.isActive) ?? data[0];
      if (active) setCycleId(active.id);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "No se pudieron cargar los ciclos",
      );
    }
  }

  async function onJoin(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await joinClass(token, joinCode.trim());
      closeModal();
      router.push(`/classes/${result.class.id}`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "No se pudo unir a la clase",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createClass(token, {
        name,
        cycleId,
        section: section || undefined,
        subject: subject || undefined,
      });
      closeModal();
      router.push(`/classes/${created.id}`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "No se pudo crear la clase",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Mis clases"
      lead="Entrá a una clase para ver el muro, tareas y exámenes."
      loading={loading}
      loadingLabel="Cargando clases…"
      actions={
        <>
          {canCreate ? (
            <button
              type="button"
              className={styles.button}
              onClick={openCreateModal}
            >
              Nueva clase
            </button>
          ) : null}
          {canJoin ? (
            <button
              type="button"
              className={styles.ghost}
              onClick={openJoinModal}
            >
              Unirme con código
            </button>
          ) : null}
        </>
      }
    >
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {!loading && classes.length === 0 ? (
        <p className={styles.muted}>
          Todavía no hay clases.{" "}
          {canCreate
            ? "Creá la primera con “Nueva clase”."
            : "Unite con el código que te dio tu profesor."}
        </p>
      ) : null}

      {!loading && classes.length > 0 ? (
        <div className={styles.classGrid}>
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/classes/${c.id}`}
              className={styles.classCard}
            >
              <div
                className={styles.classBanner}
                style={{ background: classBannerColor(c.name) }}
              />
              <div className={styles.classBody}>
                <h2 className={styles.classTitle}>
                  {c.name}
                  {c.section ? ` · ${c.section}` : ""}
                </h2>
                <p className={styles.classSubject}>
                  {c.subject ?? "Sin materia"}
                </p>
                <p className={styles.classMeta}>
                  {c._count?.memberships ?? 0} miembros · {c._count?.posts ?? 0}{" "}
                  publicaciones
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      <Modal
        open={modal !== null}
        title={modal === "create" ? "Nueva clase" : "Unirme con código"}
        onClose={closeModal}
      >
        {modal === "join" ? (
          <form className={styles.modalForm} onSubmit={onJoin}>
            <label className={styles.label}>
              Código de la clase
              <input
                className={styles.input}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                minLength={4}
                placeholder="ABC123"
                autoFocus
              />
            </label>
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
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                className={styles.button}
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Uniéndome…" : "Unirme"}
              </button>
            </div>
          </form>
        ) : (
          <form className={styles.modalForm} onSubmit={onCreate}>
            <label className={styles.label}>
              Nombre de la clase
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                autoFocus
                placeholder="Matemáticas 2A"
              />
              <span className={styles.fieldHint}>
                Es el título que verán los alumnos en su lista de clases.
              </span>
            </label>
            <div className={styles.formRow}>
              <label className={styles.label}>
                Grupo o sección
                <input
                  className={styles.input}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="2A"
                />
                <span className={styles.fieldHint}>Opcional.</span>
              </label>
              <label className={styles.label}>
                Materia
                <input
                  className={styles.input}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Matemáticas"
                />
                <span className={styles.fieldHint}>
                  Opcional. Sirve para agrupar y filtrar.
                </span>
              </label>
            </div>
            <label className={styles.label}>
              Ciclo escolar
              <select
                className={styles.input}
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                required
              >
                {cycles.length === 0 ? (
                  <option value="">Cargando ciclos…</option>
                ) : null}
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isActive ? " (activo)" : ""}
                  </option>
                ))}
              </select>
            </label>
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
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                className={styles.button}
                type="submit"
                disabled={submitting || !cycleId}
              >
                {submitting ? "Creando…" : "Crear clase"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
}
