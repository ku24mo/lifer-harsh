import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    serverActions: {
      // Allow the Devin browser preview proxy (dynamic port on 127.0.0.1)
      allowedOrigins: ["127.0.0.1", "localhost"],
    },
  },
};

export default nextConfig;
