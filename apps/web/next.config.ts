import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@sca/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
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
