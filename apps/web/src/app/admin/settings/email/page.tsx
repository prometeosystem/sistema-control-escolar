"use client";

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
import { PasswordField } from "@/shared/ui/PasswordField";
import { AppShell } from "@/shared/ui/AppShell";
import styles from "@/features/classes/classes.module.css";

export default function EmailSettingsPage() {
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
  const [pageLoading, setPageLoading] = useState(true);

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
        setError(err instanceof Error ? err.message : "No se pudo cargar"),
      )
      .finally(() => setPageLoading(false));
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
      setMessage("Configuración guardada correctamente.");
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
        setMessage("El correo está deshabilitado; no se envió la prueba.");
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
      <AppShell title="Configuración del correo" loading loadingLabel="Cargando…">
        {null}
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Configuración del correo electrónico"
      lead="Servidor SMTP para notificaciones. Dejá la contraseña vacía para conservar la actual."
      loading={pageLoading}
      loadingLabel="Cargando configuración…"
    >
      {settings ? (
        <p className={styles.muted}>
          Estado: {settings.configured ? "configurado" : "sin configurar"} ·{" "}
          {settings.sourceHint}
          {settings.hasPassword ? " · contraseña guardada" : ""}
        </p>
      ) : null}

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {message ? <p className={styles.muted}>{message}</p> : null}

      <form className={`${styles.form} ${styles.formNarrow}`} onSubmit={onSave}>
        <label className={styles.label}>
          <span>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />{" "}
            Correo habilitado
          </span>
        </label>
        <label className={styles.label}>
          Host SMTP
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
            TLS/SSL
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
        <PasswordField
          label="Contraseña SMTP"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={
            settings?.hasPassword ? "(conservar actual)" : "opcional"
          }
        />
        <label className={styles.label}>
          Remitente (email)
          <input
            className={styles.input}
            type="email"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
            required
          />
        </label>
        <label className={styles.label}>
          Remitente (nombre)
          <input
            className={styles.input}
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            required
          />
        </label>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar configuración"}
        </button>
      </form>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Probar envío</h2>
        <div className={`${styles.form} ${styles.formNarrow}`}>
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
        </div>
      </section>
    </AppShell>
  );
}
