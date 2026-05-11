import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono, Archivo_Black } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const heavy = Archivo_Black({
  variable: "--font-heavy",
  subsets: ["latin"],
  weight: "400",
});

const sans = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teardown — editorial single-page techniques",
  description:
    "Educational reconstruction of editorial single-page techniques: vertical rhythm, draggable elements, marquees, hover-states.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${heavy.variable} ${sans.variable} ${mono.variable} antialiased`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
