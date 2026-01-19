import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker containerization with minimal image size
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
