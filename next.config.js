/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets integration tests run a second server without fighting over .next/dev/lock.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  redirects: async () => {
    return [];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
};

module.exports = nextConfig;
