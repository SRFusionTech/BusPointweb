import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static site in `out/`, served by the NestJS backend (see BusPointBackend/src/web-static).
  output: "export",
  // cacheComponents / partialPrefetching are off: they need PPR, which a static export
  // cannot do ("PPR cannot be enabled in export mode").
  // Allow HMR from devices on the local network (phone, tablet testing)
  allowedDevOrigins: ['192.168.1.0/24', '192.168.0.0/24', '10.0.0.0/8'],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
