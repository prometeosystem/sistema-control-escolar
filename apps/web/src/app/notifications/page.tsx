"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from "@/shared/api-client";
import { AppShell } from "@/shared/ui/AppShell";
import styles from "@/features/classes/classes.module.css";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load(token: string, onlyUnread: boolean) {
    const page = await listNotifications(token, { unreadOnly: onlyUnread });
    setItems(page.data);
    setUnreadCount(page.meta.unreadCount);
  }

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    load(token, unreadOnly)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar"),
      )
      .finally(() => setLoading(false));
  }, [router, unreadOnly]);

  async function onMarkRead(id: string) {
    const token = getAccessToken();
    if (!token) return;
    await markNotificationRead(token, id);
    await load(token, unreadOnly);
  }

  async function onMarkAll() {
    const token = getAccessToken();
    if (!token) return;
    await markAllNotificationsRead(token);
    await load(token, unreadOnly);
  }

  return (
    <AppShell
      title="Avisos"
      lead={`${unreadCount} sin leer`}
      loading={loading}
      loadingLabel="Cargando avisos…"
      actions={
        <button className={styles.ghost} type="button" onClick={onMarkAll}>
          Marcar todas leídas
        </button>
      }
    >
      <label className={styles.label} style={{ marginBottom: "1rem", maxWidth: "16rem" }}>
        <span>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setLoading(true);
              setUnreadOnly(e.target.checked);
            }}
          />{" "}
          Solo no leídas
        </span>
      </label>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <ul className={styles.list}>
        {items.length === 0 ? (
          <li className={styles.muted}>No hay avisos por ahora.</li>
        ) : (
          items.map((n) => (
            <li key={n.id} className={styles.item}>
              <strong>{n.title}</strong>
              {!n.readAt ? " · nueva" : null}
              <p className={styles.muted}>{n.body}</p>
              <p className={styles.muted}>
                {new Date(n.createdAt).toLocaleString("es-MX")} · {n.type}
              </p>
              {!n.readAt ? (
                <button
                  className={styles.ghost}
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  style={{ marginTop: "0.5rem" }}
                >
                  Marcar leída
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </AppShell>
  );
}
