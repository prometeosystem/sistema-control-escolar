import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "SCA — Control de actividades escolares",
  description:
    "Sistema tipo Classroom para secundaria: clases, tareas, exámenes y calificaciones.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
