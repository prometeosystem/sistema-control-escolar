import Link from "next/link";
import styles from "../error.module.css";

/** Página de error 505 (servidor) — diseño listo para uso manual o redirección */
export default function ServerErrorPage() {
  return (
    <main className={styles.main}>
      <p className={styles.code}>505</p>
      <h1 className={styles.title}>Error del servidor</h1>
      <p className={styles.lead}>
        El servicio no pudo completar la solicitud. Probá más tarde o contactá
        al administrador.
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
