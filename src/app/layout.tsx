import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site, withBasePath } from "@/platform/site";
import "@/styles/globals.css";

/* Vendored Latin WOFF2s — avoid next/font/google CI flakes (extensionless /l/font URLs). */
const mulish = localFont({
  src: [
    { path: "./fonts/Mulish-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Mulish-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-primary-face",
  display: "swap",
});

const encodeSans = localFont({
  src: [
    {
      path: "./fonts/EncodeSansCondensed-500.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-secondary-face",
  display: "swap",
});

const arimo = localFont({
  src: [{ path: "./fonts/Arimo-400.woff2", weight: "400", style: "normal" }],
  variable: "--font-display-face",
  display: "swap",
});

const itim = localFont({
  src: [{ path: "./fonts/Itim-400.woff2", weight: "400", style: "normal" }],
  variable: "--font-game-face",
  display: "swap",
});

const anton = localFont({
  src: [{ path: "./fonts/Anton-400.woff2", weight: "400", style: "normal" }],
  variable: "--font-rakko-face",
  display: "swap",
});

const bowlbyOne = localFont({
  src: [
    { path: "./fonts/BowlbyOne-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-rakko-tray",
  display: "swap",
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
    <html
      lang="en"
      className={`${mulish.variable} ${encodeSans.variable} ${arimo.variable} ${itim.variable} ${anton.variable} ${bowlbyOne.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
