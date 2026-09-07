import type { Metadata } from "next";

import {
  Anton,
  Inter,
  JetBrains_Mono,
} from "next/font/google";

import "./globals.css";

// =========================
// FONTES
// =========================

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// =========================
// METADATA
// =========================

export const metadata: Metadata = {
  title: {
    default: "PizzaSystem",
    template: "%s | PizzaSystem",
  },

  description:
    "Peça suas pizzas favoritas de forma rápida e acompanhe seu pedido.",
};

// =========================
// ROOT LAYOUT
// =========================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`
        ${anton.variable}
        ${inter.variable}
        ${jetBrainsMono.variable}
      `}
    >
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}