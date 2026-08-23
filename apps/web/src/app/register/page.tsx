import { RegisterForm } from "@/features/auth/RegisterForm";
import styles from "@/features/auth/auth.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <p className={styles.brand}>SCA</p>
        <h1 className={styles.title}>Crear cuenta</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
