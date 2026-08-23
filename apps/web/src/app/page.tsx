import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <p className={styles.brand}>SCA</p>
      <h1 className={styles.title}>Control de actividades escolares</h1>
      <p className={styles.lead}>
        Plataforma para clases de secundaria: publicaciones, tareas individuales
        o por equipo, exámenes y seguimiento para padres.
      </p>
      <div className={styles.actions}>
        <Link className={styles.primary} href="/login">
          Iniciar sesión
        </Link>
        <Link className={styles.secondary} href="/register">
          Crear cuenta
        </Link>
      </div>
      <p className={styles.meta}>Fase 3 — tareas, entregas y calificaciones</p>
    </main>
  );
}
