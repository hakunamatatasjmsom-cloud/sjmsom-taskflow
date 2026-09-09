import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

// Inter for UI/body; Fraunces (an editorial serif) for display numbers and
// headings — gives the app a masthead/annual-report feel rather than a
// generic SaaS-sans look.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "SJMSOM TaskFlow — Fest Core Team",
  description:
    "Task management and progress tracking for the SJMSOM, IIT Bombay fest core team.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
