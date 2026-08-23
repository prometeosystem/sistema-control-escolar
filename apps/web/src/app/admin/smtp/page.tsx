"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthUser,
  getAccessToken,
  getSmtpSettings,
  getStoredUser,
  SmtpPublicSettings,
  testSmtp,
  updateSmtpSettings,
} from "@/shared/api-client";
import styles from "@/features/classes/classes.module.css";

export default function AdminSmtpPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [settings, setSettings] = useState<SmtpPublicSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("SCA");
  const [testTo, setTestTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      router.replace("/login");
      return;
    }
    if (stored.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    setUser(stored);
    setTestTo(stored.email);
    getSmtpSettings(token)
      .then((data) => {
        setSettings(data);
        setEnabled(data.enabled);
        setHost(data.host);
        setPort(data.port);
        setSecure(data.secure);
        setUsername(data.username ?? "");
        setFromEmail(data.fromEmail);
        setFromName(data.fromName || "SCA");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar SMTP"),
      );
  }, [router]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await updateSmtpSettings(token, {
        enabled,
        host,
        port,
        secure,
        username: username || null,
        password: password.trim() ? password : null,
        fromEmail,
        fromName,
      });
      setSettings(data);
      setPassword("");
      setMessage("Configuración SMTP guardada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  }

  async function onTest() {
    const token = getAccessToken();
    if (!token || !testTo) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await testSmtp(token, testTo);
      if (result.skipped) {
        setMessage("SMTP no está habilitado; el correo se omitió.");
      } else {
        setMessage(`Correo de prueba enviado a ${testTo}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prueba fallida");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <p className={styles.muted}>Cargando…</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>SCA</p>
          <h1 className={styles.title}>SMTP (admin)</h1>
          <p className={styles.muted}>
            Configurá el servidor de correo para notificaciones. La contraseña
            nunca se muestra; dejala vacía para conservar la actual.
          </p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.ghost} href="/dashboard">
            Dashboard
          </Link>
          <Link className={styles.ghost} href="/notifications">
            Notificaciones
          </Link>
        </div>
      </header>

      {settings ? (
        <p className={styles.muted}>
          Estado: {settings.configured ? "guardado en DB" : "sin configurar"} ·
          fuente {settings.sourceHint}
          {settings.hasPassword ? " · hay contraseña guardada" : ""}
        </p>
      ) : null}

      {error ? <p role="alert">{error}</p> : null}
      {message ? <p>{message}</p> : null}

      <form className={styles.form} onSubmit={onSave}>
        <label className={styles.label}>
          <span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />{" "}
            Habilitado
          </span>
        </label>
        <label className={styles.label}>
          Host
          <input
            className={styles.input}
            value={host}
            onChange={(e) => setHost(e.target.value)}
            required
            placeholder="smtp.ejemplo.com"
          />
        </label>
        <label className={styles.label}>
          Puerto
          <input
            className={styles.input}
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            required
          />
        </label>
        <label className={styles.label}>
          <span>
            <input
              type="checkbox"
              checked={secure}
              onChange={(e) => setSecure(e.target.checked)}
            />{" "}
            TLS/SSL (secure)
          </span>
        </label>
        <label className={styles.label}>
          Usuario
          <input
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className={styles.label}>
          Contraseña
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={
              settings?.hasPassword ? "(conservar actual)" : "opcional"
            }
          />
        </label>
        <label className={styles.label}>
          From (email)
          <input
            className={styles.input}
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          From (nombre)
          <input
            className={styles.input}
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            required
          />
        </label>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </form>

      <section style={{ marginTop: "2rem" }}>
        <h2 className={styles.title} style={{ fontSize: "1.1rem" }}>
          Probar envío
        </h2>
        <label className={styles.label}>
          Destinatario
          <input
            className={styles.input}
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
          />
        </label>
        <button
          className={styles.ghost}
          type="button"
          onClick={onTest}
          disabled={loading || !testTo}
        >
          Enviar correo de prueba
        </button>
      </section>
    </main>
  );
}
