import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_URL
      ? `${process.env.APP_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`
  ),
  title: "Sawari Admin",
  description: "Sawari Admin Panel for car rental management",
  icons: {
    icon: [
      { url: "/logo1.png", type: "image/png", sizes: "32x32" } // Correct type and cache-busting
    ]
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Sawari Admin",
    description: "Admin panel for Sawari - luxury car rentals",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sawari Admin",
    description: "Admin panel for Sawari - luxury car rentals",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png?v=2" type="image/png" sizes="32x32" />
      </head>
      <body className={GeistSans.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}