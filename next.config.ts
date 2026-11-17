import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.RIVERSIDE_TEST_DIST_DIR || ".next",
  typescript: {
    tsconfigPath: process.env.RIVERSIDE_TEST_TS_CONFIG || "tsconfig.json",
  },
  turbopack: { root: process.cwd() },
};
export default nextConfig;
