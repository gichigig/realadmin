import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ishinadwelly.com"),
  title: {
    template: "%s | Dwelly",
    default: "Dwelly - Find Your Dream Home & Rental Properties in Kenya",
  },
  description:
    "Discover verified rental apartments, homes, commercial properties, and trusted local helper services across Kenya with Dwelly. Fast, secure, and transparent real estate management.",
  keywords: [
    "real estate Kenya",
    "rental properties Nairobi",
    "find apartments",
    "house rentals",
    "verified landlords",
    "property management",
    "domestic helpers",
    "Dwelly rentals",
    "IshinaDwelly",
  ],
  authors: [{ name: "Dwelly Team", url: "https://ishinadwelly.com" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://ishinadwelly.com",
    title: "Dwelly - Find Your Dream Home & Rental Properties in Kenya",
    description:
      "Discover verified rental apartments, homes, commercial properties, and trusted local helper services across Kenya.",
    siteName: "Dwelly",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Dwelly Logo & Brand Icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dwelly - Find Your Dream Home & Rental Properties in Kenya",
    description: "Discover verified rental apartments, homes, and local helper services across Kenya with Dwelly.",
    images: ["/icon.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          id="google-adsense"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7814990820270971"
          crossOrigin="anonymous"
        />
        {/* Safe hardcoded static JSON-LD for Google Rich Snippets & Sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://ishinadwelly.com/#website",
                  "url": "https://ishinadwelly.com",
                  "name": "Dwelly",
                  "alternateName": "IshinaDwelly",
                  "description": "Discover verified rental apartments, homes, and local helper services across Kenya.",
                  "publisher": {
                    "@id": "https://ishinadwelly.com/#organization",
                  },
                },
                {
                  "@type": "Organization",
                  "@id": "https://ishinadwelly.com/#organization",
                  "name": "Dwelly",
                  "url": "https://ishinadwelly.com",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://ishinadwelly.com/icon.png",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
