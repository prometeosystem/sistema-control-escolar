"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthUser,
  ChildSummary,
  ParentLinkRequest,
  approveParentLink,
  getAccessToken,
  getStoredUser,
  listParentLinkRequests,
  listParentChildren,
  rejectParentLink,
  requestParentLink,
} from "@/shared/api-client";
import { AppShell } from "@/shared/ui/AppShell";
import { Modal } from "@/shared/ui/Modal";
import styles from "@/features/classes/classes.module.css";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export default function ParentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [requests, setRequests] = useState<ParentLinkRequest[]>([]);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [childSearch, setChildSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("pending");
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function reload(token: string, role: string) {
    const reqs = await listParentLinkRequests(token);
    setRequests(reqs);
    if (role === "PARENT" || role === "ADMIN") {
      setChildren(await listParentChildren(token));
    }
  }

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (!["PARENT", "STUDENT", "ADMIN"].includes(stored.role)) {
      router.replace("/dashboard");
      return;
    }
    setUser(stored);
    if (stored.role === "STUDENT") setRequestStatus("pending");
    reload(token, stored.role)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => setPageLoading(false));
  }, [router]);

  const filteredChildren = useMemo(() => {
    const q = childSearch.trim().toLowerCase();
    if (!q) return children;
    return children.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [children, childSearch]);

  const filteredRequests = useMemo(() => {
    const q = requestSearch.trim().toLowerCase();
    return requests.filter((r) => {
      if (requestStatus && r.status !== requestStatus) return false;
      if (!q) return true;
      return (
        r.parent.fullName.toLowerCase().includes(q) ||
        r.parent.email.toLowerCase().includes(q) ||
        r.student.fullName.toLowerCase().includes(q) ||
        r.student.email.toLowerCase().includes(q)
      );
    });
  }, [requests, requestSearch, requestStatus]);

  function openModal() {
    setFormError(null);
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError(null);
    setStudentEmail("");
  }

  async function onRequest(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setFormError(null);
    setError(null);
    setMessage(null);
    try {
      await requestParentLink(token, studentEmail);
      setMessage("Solicitud enviada. El alumno debe aprobarla.");
      closeModal();
      await reload(token, user?.role ?? "PARENT");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setLoading(false);
    }
  }

  async function onApprove(id: string) {
    const token = getAccessToken();
    if (!token || !user) return;
    await approveParentLink(token, id);
    await reload(token, user.role);
  }

  async function onReject(id: string) {
    const token = getAccessToken();
    if (!token || !user) return;
    await rejectParentLink(token, id);
    await reload(token, user.role);
  }

  if (!user) {
    return (
      <AppShell title="Padres y tutores" loading loadingLabel="Cargando…">
        {null}
      </AppShell>
    );
  }

  const canManageLinks = user.role === "PARENT" || user.role === "ADMIN";
  const canReviewRequests = user.role === "STUDENT" || user.role === "ADMIN";

  return (
    <AppShell
      title="Padres y tutores"
      lead="Vinculá tu cuenta al correo del alumno y consultá su progreso."
      loading={pageLoading}
      loadingLabel="Cargando vínculos…"
      actions={
        canManageLinks ? (
          <button type="button" className={styles.button} onClick={openModal}>
            Solicitar vínculo
          </button>
        ) : undefined
      }
    >
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className={styles.muted}>{message}</p> : null}

      {canManageLinks ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Hijos vinculados ({filteredChildren.length})
          </h2>
          <div className={styles.tableToolbar}>
            <input
              className={styles.input}
              type="search"
              placeholder="Buscar por nombre o correo…"
              value={childSearch}
              onChange={(e) => setChildSearch(e.target.value)}
              aria-label="Buscar hijos vinculados"
            />
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyRow}>
                      {children.length === 0
                        ? "Aún no hay vínculos aprobados. Usá “Solicitar vínculo” para agregar uno."
                        : "No hay resultados para esa búsqueda."}
                    </td>
                  </tr>
                ) : (
                  filteredChildren.map((c) => (
                    <tr key={c.id}>
                      <td>{c.fullName}</td>
                      <td>{c.email}</td>
                      <td>
                        <span className={styles.roleBadge}>
                          {c.role === "STUDENT" ? "Alumno" : c.role}
                        </span>
                      </td>
                      <td>
                        <Link
                          className={styles.ghost}
                          href={`/parents/children/${c.id}`}
                        >
                          Ver progreso
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {canReviewRequests ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Solicitudes ({filteredRequests.length})
          </h2>
          <div className={styles.tableToolbar}>
            <input
              className={styles.input}
              type="search"
              placeholder="Buscar por padre o alumno…"
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              aria-label="Buscar solicitudes"
            />
            <select
              className={styles.input}
              value={requestStatus}
              onChange={(e) => setRequestStatus(e.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Padre / tutor</th>
                  <th>Correo</th>
                  <th>Alumno</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyRow}>
                      {requests.length === 0
                        ? "No hay solicitudes."
                        : "No hay resultados con esos filtros."}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.parent.fullName}</td>
                      <td>{r.parent.email}</td>
                      <td>
                        {r.student.fullName}
                        <div className={styles.muted}>{r.student.email}</div>
                      </td>
                      <td>
                        <span className={styles.roleBadge}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td>
                        {new Date(r.createdAt).toLocaleDateString("es-MX")}
                      </td>
                      <td>
                        {r.status === "pending" ? (
                          <div className={styles.actions}>
                            <button
                              className={styles.button}
                              type="button"
                              onClick={() => onApprove(r.id)}
                            >
                              Aprobar
                            </button>
                            <button
                              className={styles.ghost}
                              type="button"
                              onClick={() => onReject(r.id)}
                            >
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span className={styles.muted}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Modal open={modalOpen} title="Solicitar vínculo" onClose={closeModal}>
        <form className={styles.modalForm} onSubmit={onRequest}>
          <label className={styles.label}>
            Correo del alumno
            <input
              className={styles.input}
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
              placeholder="alumno@colegio.edu"
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
              disabled={loading}
            >
              Cancelar
            </button>
            <button className={styles.button} type="submit" disabled={loading}>
              {loading ? "Enviando…" : "Enviar solicitud"}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
