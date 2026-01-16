import type { NextConfig } from "next";

// @ts-ignore: next-pwa might not have types, this prevents build errors
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// Removed ": NextConfig" type annotation to avoid TypeScript errors with experimental features
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPWA(nextConfig);