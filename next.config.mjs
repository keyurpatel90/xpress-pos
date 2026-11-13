/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{
      source: '/api/:path*',
      headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' }],
    }];
  },
};
export default nextConfig;
