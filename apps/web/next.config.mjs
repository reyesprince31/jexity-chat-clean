/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/db", "@repo/auth"],
};

export default nextConfig;
