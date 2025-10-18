import type { NextConfig } from "next";

const http_hosts = ["ik.imagekit.io", "lh3.googleusercontent.com"];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: http_hosts.map((host) => ({
      port: "",
      pathname: "/**",
      protocol: "https",
      hostname: host,
    })),
  },
};

export default nextConfig;
