import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};
const nextConfig: NextConfig = {/* config options here */};

export default nextConfig;
