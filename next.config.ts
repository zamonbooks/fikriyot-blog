import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ISR (Incremental Static Regeneration)
  experimental: {
    // Enable experimental features if needed
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'telegram.org',
      },
      {
        protocol: 'https',
        hostname: 'api.telegram.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.telesco.pe',
      },
    ],
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=120',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
