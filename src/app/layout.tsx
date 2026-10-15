import type { Metadata, Viewport } from "next";
import { site, withBasePath } from "@/platform/site";
import "@/styles/globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
