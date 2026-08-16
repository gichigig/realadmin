import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    // Console logs enabled for debugging
    removeConsole: false,
  },
  async headers() {
    return [];
  },
};

export default nextConfig;
