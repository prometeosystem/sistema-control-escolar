import { LoginForm } from "@/features/auth/LoginForm";
import styles from "@/features/auth/auth.module.css";

export default function LoginPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.hero} aria-hidden={false}>
        <p className={styles.heroBrand}>SCA</p>
        <p className={styles.heroLead}>
          Controlá clases, entregas y calificaciones desde un solo panel.
        </p>
      </section>
      <section className={styles.panel}>
        <div className={styles.card}>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.subtitle}>
            Usá el correo y la contraseña de tu cuenta escolar.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
