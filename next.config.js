/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com'],
  },
  experimental: {
    scrollRestoration: true,
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  },
  // 優化路由處理
  onDemandEntries: {
    // 頁面保持在記憶體中的時間（毫秒）
    maxInactiveAge: 60 * 1000,
    // 同時保持在記憶體中的頁面數量
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;
