import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ビルド時にESLintのチェックを無視する
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
