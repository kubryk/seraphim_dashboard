import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Для Docker deployment
};

export default nextConfig;
