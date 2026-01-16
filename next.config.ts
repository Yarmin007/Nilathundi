import type { NextConfig } from "next";

// @ts-ignore: next-pwa types workaround
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  // In Next.js 16, reactCompiler is moved to the root, not 'experimental'
  reactCompiler: true,
};

export default withPWA(nextConfig);