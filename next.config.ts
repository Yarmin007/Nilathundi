import type { NextConfig } from "next";

// @ts-ignore: next-pwa types workaround
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Moved to root based on Next.js 16 error logs
  reactCompiler: true,
};

export default withPWA(nextConfig);