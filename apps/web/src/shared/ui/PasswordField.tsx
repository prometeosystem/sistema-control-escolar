"use client";

import { InputHTMLAttributes, useState } from "react";
import styles from "@/features/auth/auth.module.css";

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
};

export function PasswordField({ label, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className={styles.label}>
      {label}
      <span className={styles.passwordWrap}>
        <input
          {...props}
          className={`${styles.input} ${styles.passwordInput} ${className ?? ""}`}
          type={visible ? "text" : "password"}
        />
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          tabIndex={-1}
        >
          {visible ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 3l18 18M10.58 10.58A2 2 0 0012 14a2 2 0 001.41-3.41M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 01-2.16 3.19M6.61 6.61A11.8 11.8 0 001 12.5C2.73 16.39 7 19.5 12 19.5c1.05 0 2.06-.13 3-.37"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M2 12.5C3.73 8.11 8 5 13 5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S3.73 16.89 2 12.5z"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <circle cx="13" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          )}
        </button>
      </span>
    </label>
  );
}
