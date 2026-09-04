import type { NextConfig } from "next";
import path from "node:path";

/** En producción bajo prothec.com.mx/SCAE; en local queda vacío. */
const basePath = (process.env.NEXT_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  transpilePackages: ["@sca/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  ...(basePath ? { basePath } : {}),
  async redirects() {
    // Rutas legacy: crear clase y unirse con código ahora son modales en /classes
    return [
      { source: "/classes/new", destination: "/classes", permanent: false },
      { source: "/classes/join", destination: "/classes", permanent: false },
      {
        source: "/admin/smtp",
        destination: "/admin/settings/email",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
