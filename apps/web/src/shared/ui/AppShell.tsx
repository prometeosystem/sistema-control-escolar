"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  clearSession,
  getAccessToken,
  getStoredUser,
  listNotifications,
} from "@/shared/api-client";
import { playNotificationAlert } from "@/shared/lib/notificationSound";
import { useMinDuration } from "@/shared/lib/useMinDuration";
import { Loader } from "@/shared/ui/Loader";
import styles from "./shell.module.css";

type AppShellProps = {
  title: string;
  lead?: string;
  actions?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  roles?: string[];
  match?: (path: string) => boolean;
};

type SettingsItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio" },
  {
    href: "/classes",
    label: "Clases",
    match: (p) => p.startsWith("/classes"),
  },
  {
    href: "/parents",
    label: "Padres",
    roles: ["PARENT", "STUDENT", "ADMIN"],
    match: (p) => p.startsWith("/parents"),
  },
  {
    href: "/admin",
    label: "Admin",
    roles: ["ADMIN"],
    match: (p) => p === "/admin",
  },
];

const SETTINGS: SettingsItem[] = [
  {
    href: "/admin/settings/email",
    label: "Configuración del correo electrónico",
  },
];

export function AppShell({
  title,
  lead,
  actions,
  loading = false,
  loadingLabel,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    listNotifications(token, { unreadOnly: true })
      .then((page) => {
        const count = page.meta.unreadCount;
        setUnreadCount(count);
        if (count > 0) playNotificationAlert();
      })
      .catch(() => setUnreadCount(0))
      .finally(() => setBooting(false));
  }, [router]);

  useEffect(() => {
    if (pathname.startsWith("/admin/settings")) setConfigOpen(true);
  }, [pathname]);

  const links = useMemo(() => {
    if (!user) return [];
    return NAV.filter((item) => !item.roles || item.roles.includes(user.role));
  }, [user]);

  const showSettings = user?.role === "ADMIN";
  const settingsActive = pathname.startsWith("/admin/settings");
  const showBooting = useMinDuration(booting, 650);
  const showLoading = useMinDuration(loading);

  function logout() {
    clearSession();
    router.push("/login");
  }

  if (showBooting || !user) {
    return <Loader variant="fullScreen" label="Preparando tu espacio…" />;
  }

  return (
    <div className={`${styles.frame} ${open ? styles.drawerOpen : ""}`}>
      {open ? (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <Link href="/dashboard" className={styles.brand} onClick={() => setOpen(false)}>
            SCA
          </Link>
          <p className={styles.brandSub}>Control de actividades escolares</p>
        </div>

        <nav className={styles.nav} aria-label="Principal">
          {links.map((item) => {
            const active = item.match
              ? item.match(pathname)
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          {showSettings ? (
            <div className={styles.navGroup}>
              <button
                type="button"
                className={`${styles.navLink} ${styles.navToggle} ${settingsActive ? styles.navLinkActive : ""}`}
                onClick={() => setConfigOpen((v) => !v)}
                aria-expanded={configOpen}
              >
                Configuración
                <span className={styles.chevron}>{configOpen ? "▾" : "▸"}</span>
              </button>
              {configOpen ? (
                <div className={styles.subNav}>
                  {SETTINGS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.subNavLink} ${pathname === item.href ? styles.subNavActive : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className={styles.userBox}>
          <p className={styles.userName}>{user.fullName}</p>
          <p className={styles.userMeta}>
            {user.role} · {user.email}
          </p>
          <Link
            href="/notifications"
            className={`${styles.notifBtn} ${pathname.startsWith("/notifications") ? styles.notifBtnActive : ""}`}
            onClick={() => setOpen(false)}
            aria-label={
              unreadCount > 0
                ? `Notificaciones, ${unreadCount} sin leer`
                : "Notificaciones"
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Avisos</span>
            {unreadCount > 0 ? (
              <span className={styles.badge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <button type="button" className={styles.logout} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setOpen(true)}
          >
            Menú
          </button>
          <Link href="/dashboard" className={styles.brand}>
            SCA
          </Link>
        </div>

        <div className={styles.content}>
          <header className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>{title}</h1>
              {lead ? <p className={styles.pageLead}>{lead}</p> : null}
            </div>
            {actions ? <div className={styles.actions}>{actions}</div> : null}
          </header>

          {showLoading ? (
            <Loader variant="full" label={loadingLabel ?? "Cargando contenido…"} />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
