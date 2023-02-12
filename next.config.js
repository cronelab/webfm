/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  experimental: {
    appDir: true,

  },
  reactStrictMode: false,

  async rewrites() {
    return {
      // After checking all Next.js pages (including dynamic routes)
      // and static files we proxy any other requests
      fallback: [
        {
          source: '/:path*',
          destination: `http://localhost:8080/:path*`,
        },
      ],
    }
  }
}

module.exports = nextConfig