/** @type {import('next').NextConfig} */
const parseAllowedDevOrigins = () => {
  const raw = (process.env.NEXT_ALLOWED_DEV_ORIGINS || '').trim();
  if (!raw) return ['172.16.6.87'];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const nextConfig = {
  reactStrictMode: true,
  // Allow LAN/dev origins through env override for team-specific local networks.
  allowedDevOrigins: parseAllowedDevOrigins(),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
};

export default nextConfig;
