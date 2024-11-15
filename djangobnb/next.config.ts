import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**'
      },
      {
        protocol: 'http',
        hostname: '159.223.62.28',
        port: '1337',
        pathname: '/**'
      },
      {
        protocol: 'http',
        hostname: '159.223.62.28',
        port: '80',
        pathname: '/**'
      }
    ]
  },
};

export default nextConfig;
