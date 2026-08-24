import styles from "./loader.module.css";

type LoaderProps = {
  label?: string;
  variant?: "inline" | "full" | "fullScreen";
};

export function Loader({ label = "Cargando…", variant = "inline" }: LoaderProps) {
  const variantClass =
    variant === "fullScreen"
      ? styles.fullScreen
      : variant === "full"
        ? styles.full
        : styles.inline;

  return (
    <div
      className={`${styles.wrap} ${variantClass}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className={`${styles.loader} ${variant === "inline" ? styles.sizeSm : ""}`}
      />
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  );
}
