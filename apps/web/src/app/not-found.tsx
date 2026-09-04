import Link from "next/link";
import styles from "./error.module.css";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Página no encontrada</h1>
      <p className={styles.lead}>
        La ruta que buscás no existe o fue movida. Volvé al inicio o iniciá
        sesión de nuevo.
      </p>
      <div className={styles.actions}>
        <Link className={styles.primary} href="/dashboard">
          Ir al inicio
        </Link>
        <Link className={styles.secondary} href="/login">
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
