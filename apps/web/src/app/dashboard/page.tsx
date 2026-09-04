"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthUser, getStoredUser } from "@/shared/api-client";
import { AppShell } from "@/shared/ui/AppShell";
import styles from "@/features/classes/classes.module.css";

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const tiles = [
    {
      href: "/classes",
      title: "Clases",
      meta: "Muro, tareas y exámenes",
      roles: ["ADMIN", "TEACHER", "STUDENT"],
    },
    {
      href: "/parents",
      title: "Padres / vínculos",
      meta: "Solicitudes y progreso",
      roles: ["ADMIN", "STUDENT", "PARENT"],
    },
    {
      href: "/admin",
      title: "Panel admin",
      meta: "Usuarios y estadísticas",
      roles: ["ADMIN"],
    },
    {
      href: "/admin/settings/email",
      title: "Configuración",
      meta: "Correo electrónico (SMTP)",
      roles: ["ADMIN"],
    },
  ].filter((t) => !user || t.roles.includes(user.role));

  return (
    <AppShell
      title={user ? `Hola, ${user.fullName.split(" ")[0]}` : "Inicio"}
      lead="Elegí un módulo para continuar."
      loading={!user}
      loadingLabel="Cargando inicio…"
    >
      <div className={styles.grid}>
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className={styles.tile}>
            <p className={styles.tileTitle}>{tile.title}</p>
            <p className={styles.tileMeta}>{tile.meta}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
