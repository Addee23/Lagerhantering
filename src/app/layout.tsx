import type { Metadata } from "next";
import { Oswald, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Design-identitet: en kantig, industriell rubrikstil (Oswald - lastbrygga/
// stencil-känsla) ihop med en saklig, mycket läsbar textstil (IBM Plex Sans -
// gjord för teknisk/data-tung läsning) och en mono-stil för nummer/koder
// (ordernummer, reklamationsnummer, streckkoder).
const displayFont = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono-data",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Hela Rubbet - Lager",
  description: "Lager-, leverans- och reklamationssystem för Hela Rubbet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
