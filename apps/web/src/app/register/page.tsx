import { RegisterForm } from "@/features/auth/RegisterForm";
import styles from "@/features/auth/auth.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <p className={styles.heroBrand}>SCA</p>
        <p className={styles.heroLead}>
          Creá tu cuenta como profesor, alumno o padre/tutor.
        </p>
      </section>
      <section className={styles.panel}>
        <div className={styles.card}>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>
            El administrador también puede invitarte desde el panel.
          </p>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
