const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  
  // For Next.js 15, Turbopack config is under experimental
  experimental: {
    // If you want to use Turbopack in Next.js 15
    turbo: {
      // Your Turbopack configuration if needed
    }
  },
};

module.exports = nextConfig;