import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permitir temporalmente todos para facilitar integración de API desconocida
      },
    ],
  },
};


export default nextConfig;
