"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminStats,
  AuthUser,
  getAccessToken,
  getAdminStats,
  getStoredUser,
  inviteUser,
  listUsers,
} from "@/shared/api-client";
import { PasswordField } from "@/shared/ui/PasswordField";
import { AppShell } from "@/shared/ui/AppShell";
import { Modal } from "@/shared/ui/Modal";
import styles from "@/features/classes/classes.module.css";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Profesor",
  STUDENT: "Alumno",
  PARENT: "Padre",
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<
    Array<{ id: string; email: string; fullName: string; role: string }>
  >([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TEACHER" | "STUDENT" | "PARENT" | "ADMIN">(
    "TEACHER",
  );
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function reload(token: string) {
    const [s, u] = await Promise.all([
      getAdminStats(token),
      listUsers(token, {}),
    ]);
    setStats(s);
    setUsers(u.data);
  }

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (stored.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    setUser(stored);
    reload(token)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar admin"),
      )
      .finally(() => setPageLoading(false));
  }, [router]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  function openModal() {
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("TEACHER");
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setFormError(null);
    setError(null);
    setMessage(null);
    try {
      await inviteUser(token, { email, fullName, role, password });
      setMessage(`Usuario ${email} creado.`);
      closeModal();
      await reload(token);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo crear");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <AppShell title="Panel admin" loading loadingLabel="Cargando panel…">
        {null}
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Panel admin"
      lead="Acá se crean y administran cuentas de la escuela. La pantalla Padres es solo para vincular un padre con un alumno."
      loading={pageLoading}
      loadingLabel="Cargando estadísticas…"
      actions={
        <button type="button" className={styles.button} onClick={openModal}>
          Agregar usuario
        </button>
      }
    >
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className={styles.muted}>{message}</p> : null}

      {stats ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Estadísticas</h2>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <p className={styles.statValue}>{stats.users}</p>
              <p className={styles.statLabel}>Usuarios totales</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>{stats.teachers}</p>
              <p className={styles.statLabel}>Profesores</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>{stats.students}</p>
              <p className={styles.statLabel}>Alumnos</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>{stats.classes}</p>
              <p className={styles.statLabel}>Clases</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>{stats.pendingParentLinks}</p>
              <p className={styles.statLabel}>Vínculos pendientes</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Usuarios registrados ({filteredUsers.length})
        </h2>
        <div className={styles.tableToolbar}>
          <input
            className={styles.input}
            type="search"
            placeholder="Buscar por nombre o correo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar usuarios"
          />
          <select
            className={styles.input}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="">Todos los roles</option>
            <option value="ADMIN">Admin</option>
            <option value="TEACHER">Profesor</option>
            <option value="STUDENT">Alumno</option>
            <option value="PARENT">Padre</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyRow}>
                    No hay usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={styles.roleBadge}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} title="Agregar usuario" onClose={closeModal}>
        <form className={styles.modalForm} onSubmit={onInvite}>
          <label className={styles.label}>
            Nombre
            <input
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              autoFocus
            />
          </label>
          <label className={styles.label}>
            Correo
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <PasswordField
            label="Contraseña temporal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <label className={styles.label}>
            Rol
            <select
              className={styles.input}
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value as "TEACHER" | "STUDENT" | "PARENT" | "ADMIN",
                )
              }
            >
              <option value="TEACHER">Profesor</option>
              <option value="STUDENT">Alumno</option>
              <option value="PARENT">Padre / tutor (cuenta)</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <p className={styles.muted}>
            Crear un padre acá solo da de alta la cuenta. El vínculo con el
            alumno se hace en la pantalla Padres.
          </p>
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
              {loading ? "Creando…" : "Crear usuario"}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
