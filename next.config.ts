import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empacota servidor + dependencias minimas em .next/standalone,
  // que e o que a imagem Docker copia.
  // Site 100% estatico: gera HTML/CSS/JS em out/ para servir por nginx.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
