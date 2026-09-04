import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automatize Soluções Digitais — Bio Link",
  description:
    "Automação e inteligência artificial para transformar atendimento, vendas e operação.",
  icons: {
    icon: "https://bio.automatizedigital.cloud/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
