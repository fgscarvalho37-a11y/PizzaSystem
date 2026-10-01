import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(self), usb=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value:
      "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "X-Permitted-Cross-Domain-Policies",
    value: "none",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },

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
