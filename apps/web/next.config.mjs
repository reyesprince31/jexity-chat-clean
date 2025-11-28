import { withMicrofrontends } from "@vercel/microfrontends/next/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/db", "@repo/auth"],
};

export default withMicrofrontends(nextConfig);
