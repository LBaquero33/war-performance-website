import type { Metadata } from "next";
import "./globals.css";

const title = "WAR Performance | Elite Athletic Training in Boca Raton";
const description =
  "Elite strength, speed, recovery and baseball development for athletes in Boca Raton, Florida.";

export const metadata: Metadata = {
  metadataBase: new URL("https://war-performance.lukeb721.chatgpt.site"),
  title,
  description,
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 864 }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
