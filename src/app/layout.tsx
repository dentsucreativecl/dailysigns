import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: "400",
});

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
  weight: "100 900",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "DailySigns",
  description: "News digest personalizado para líderes creativos",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DailySigns",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <link href="https://fonts.googleapis.com/css2?family=Boldonse&display=swap" rel="stylesheet" />
      </head>
      <body
        className={` ${instrumentSerif.variable} ${geist.variable} antialiased`}
        style={{ fontFamily: "var(--font-body), -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}

      >
        {children}
      </body>
    </html>
  );
}
