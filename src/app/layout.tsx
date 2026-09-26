import type { Metadata, Viewport } from "next";
import { Arimo, Encode_Sans_Condensed, Mulish } from "next/font/google";
import { site, withBasePath } from "@/platform/site";
import "@/styles/globals.css";

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-primary-face",
});

const encodeSans = Encode_Sans_Condensed({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-secondary-face",
});

const arimo = Arimo({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display-face",
});

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    title: site.name,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f0e3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mulish.variable} ${encodeSans.variable} ${arimo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
