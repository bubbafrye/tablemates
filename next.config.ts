import type { NextConfig } from "next";

const pagesBasePath = process.env.PAGES_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(pagesBasePath
    ? {
        basePath: pagesBasePath,
        assetPrefix: pagesBasePath,
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: pagesBasePath,
  },
};

export default nextConfig;
