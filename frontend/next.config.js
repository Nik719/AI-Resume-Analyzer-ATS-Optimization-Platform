/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Preserve trailing slashes so Vercel doesn't 308-redirect /api/v1/auth/login/
  // to /api/v1/auth/login before the rewrite proxy fires. Django requires trailing
  // slashes (APPEND_SLASH=True), and without this setting the redirect loop breaks
  // every API call.
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },
  async rewrites() {
    const backendOrigin = process.env.BACKEND_INTERNAL_URL || "http://backend:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
