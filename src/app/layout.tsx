import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Grupzap - Gestão de Grupos WhatsApp para Lançamentos",
  description: "A ferramenta de gestão de grupos WhatsApp mais acessível do Brasil. Centralize grupos, agende mensagens e monitore leads em tempo real. 50% mais barato que a concorrência.",
  keywords: ["whatsapp", "grupos", "lançamento digital", "automação", "infoprodutores", "gestão de grupos"],
  authors: [{ name: "Grupzap" }],
  openGraph: {
    title: "Grupzap - Gestão de Grupos WhatsApp",
    description: "Centralize seus grupos de WhatsApp, agende mensagens e monitore leads em tempo real.",
    url: "https://grupzap.com",
    siteName: "Grupzap",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grupzap - Gestão de Grupos WhatsApp",
    description: "A forma mais fácil de gerenciar grupos WhatsApp para lançamentos.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
