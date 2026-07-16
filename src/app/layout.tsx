import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono, DM_Serif_Display, Playfair_Display, Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const fontHeading = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const fontEditorial = DM_Serif_Display({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400"],
});

const fontDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const fontGeist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "JEEsociety Plus - Master JEE with depth-first problem solving",
  description: "A premium, focused practice workspace for physics, chemistry, and mathematics with analytics that surface what to drill next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} ${fontEditorial.variable} ${fontDisplay.variable} ${fontGeist.variable} bg-background text-foreground antialiased min-h-screen text-[15px] leading-relaxed`} suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
