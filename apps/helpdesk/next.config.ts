import type { NextConfig } from "next";
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

const nextConfig: NextConfig = {
  /**
   * Required for Turborepo microfrontends so this app can live under
   * the /helpdesk prefix when proxied through the parent web app.
   */
  basePath: "/helpdesk",
};

export default withMicrofrontends(nextConfig);
