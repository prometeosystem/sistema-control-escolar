"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { registerRequest, saveSession } from "@/shared/api-client";
import { PasswordField } from "@/shared/ui/PasswordField";
import styles from "./auth.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "TEACHER" | "PARENT">("STUDENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await registerRequest({
        email,
        password,
        fullName,
        role,
      });
      saveSession(session);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.label}>
        Nombre completo
        <input
          className={styles.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          minLength={2}
        />
      </label>
      <label className={styles.label}>
        Correo
        <input
          className={styles.input}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <PasswordField
        label="Contraseña (mín. 8)"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <label className={styles.label}>
        Rol
        <select
          className={styles.input}
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "STUDENT" | "TEACHER" | "PARENT")
          }
        >
          <option value="STUDENT">Alumno</option>
          <option value="TEACHER">Profesor</option>
          <option value="PARENT">Padre/Madre</option>
        </select>
      </label>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </button>
      <p className={styles.hint}>
        ¿Ya tenés cuenta? <Link href="/login">Iniciá sesión</Link>
      </p>
    </form>
  );
}
