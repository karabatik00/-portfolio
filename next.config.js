/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the 'output: export' line to enable server-side rendering and API routes
  images: {
    domains: ['i.scdn.co'], // Use 'domains' instead of 'remotePatterns' for simplicity
    // Remove 'unoptimized: true' to enable Vercel's image optimization
  },
  // Remove 'trailingSlash: true' unless you specifically need it
};

module.exports = nextConfig;