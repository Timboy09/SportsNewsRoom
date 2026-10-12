import type { NextConfig } from "next";

// Public origin used inside copy-codes (embed + API snippets). On Vercel this
// resolves to the production domain automatically; override with NEXT_PUBLIC_SITE_URL.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_SITE_URL: siteUrl },
};

export default nextConfig;
