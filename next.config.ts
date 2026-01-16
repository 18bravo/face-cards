import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'media.defense.gov',
      },
      {
        protocol: 'https',
        hostname: '**.wikipedia.org',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'd1ldvf68ux039x.cloudfront.net', // DVIDSHUB images
      },
      {
        protocol: 'https',
        hostname: 'api.army.mil',
      },
    ],
  },
};

export default nextConfig;
