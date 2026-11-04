import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
