import { LoginForm } from "@/features/auth/LoginForm";
import styles from "@/features/auth/auth.module.css";

export default function LoginPage() {
  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <p className={styles.brand}>SCA</p>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <LoginForm />
      </div>
    </main>
  );
}
