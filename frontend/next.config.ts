import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Use relative asset paths in exported builds so the static site can be
  // copied into backend/dist/frontend_web and served from the backend.
  // In dev: use '' so next/font and dev server work correctly.
  assetPrefix: isProd ? './' : '',
  // allowedDevOrigins allows mobile devices on local network to connect
  // Note: this is a dev-only feature, no effect in production builds
  ...(isProd ? {} : { experimental: {} }),
};

export default nextConfig;
