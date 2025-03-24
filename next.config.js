/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  reactStrictMode: true,
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'avatar.tobi.sh',
      'cloudflare-ipfs.com',
      'loremflickr.com',
      'picsum.photos'
    ]
  },
  experimental: {
    legacyBrowsers: false
  }
};

module.exports = nextConfig;
