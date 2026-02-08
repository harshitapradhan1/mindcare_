/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    unoptimized: false,
  },
  async rewrites() {
    // Use env var in production, localhost when developing
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
