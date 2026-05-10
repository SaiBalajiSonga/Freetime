import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/tests/weekly',
        destination: '/exams',
        permanent: true,
      },
      {
        source: '/tests/weekly/:examId',
        destination: '/exams/:examId',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
