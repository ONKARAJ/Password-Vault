import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if there are TypeScript errors
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
