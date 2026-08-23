"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAccessToken,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationItem,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

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
    load(token, unreadOnly).catch((err) =>
      setError(err instanceof Error ? err.message : "Error al cargar"),
    );
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
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Notificaciones</h1>
          <p className={styles.muted}>
            {unreadCount} sin leer
          </p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.ghost} href="/dashboard">
            Dashboard
          </Link>
          <button className={styles.ghost} type="button" onClick={onMarkAll}>
            Marcar todas leídas
          </button>
        </div>
      </header>

      <label className={styles.label}>
        <span>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />{" "}
          Solo no leídas
        </span>
      </label>

      {error ? <p role="alert">{error}</p> : null}

      <ul className={styles.list}>
        {items.length === 0 ? (
          <li className={styles.muted}>No hay notificaciones.</li>
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
                >
                  Marcar leída
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
