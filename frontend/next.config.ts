import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app folder (absolute) so Turbopack's root
  // detection never picks an unrelated lockfile (e.g. a parent directory).
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
