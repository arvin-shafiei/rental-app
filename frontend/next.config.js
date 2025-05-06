/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Completely disable ESLint during builds
    ignoreDuringBuilds: true
  },
  // Disable type checking during builds for faster builds
  typescript: {
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig 