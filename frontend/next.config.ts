import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://pizzasystem-api.onrender.com/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination:
          "https://pizzasystem-api.onrender.com/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;