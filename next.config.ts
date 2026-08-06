import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for the Docker image: bundles only the traced
  // dependencies into .next/standalone instead of shipping node_modules.
  output: "standalone",
};

export default nextConfig;
