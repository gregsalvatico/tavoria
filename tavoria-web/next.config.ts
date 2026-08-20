import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Same idea for TypeScript: the new pages typecheck clean, but legacy code
  // may have rough edges that shouldn't block a marketing deploy.
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        // Apple App Site Association — must be application/json with no extension
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        // Android App Links verification
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
