import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // In production: use './' so Electron can load assets from file://
  // In dev: use '' (empty) so next/font and dev server work correctly
  assetPrefix: isProd ? './' : '',
  // Allow mobile devices on local network to connect to dev server
  experimental: {
    allowedDevOrigins: ['*'],
  },
};

export default nextConfig;
