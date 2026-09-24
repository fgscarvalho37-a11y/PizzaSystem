import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return {
      /*
       * Rotas reais do Next (como /api/auth/[...path])
       * precisam ser resolvidas ANTES do proxy genérico.
       *
       * O proxy /api fica em fallback justamente para
       * não engolir as rotas de autenticação do frontend.
       */
      beforeFiles: [],

      afterFiles: [
        {
          source: "/uploads/:path*",
          destination:
            "https://pizzasystem-api.onrender.com/uploads/:path*",
        },
      ],

      fallback: [
        {
          source: "/api/:path*",
          destination:
            "https://pizzasystem-api.onrender.com/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
