import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Dwelly Mobile App - iOS & Android",
  description:
    "Download the official IshinaDwelly mobile app from Google Play and Apple App Store. Manage rental listings, communicate with tenants, hire verified helpers, and track payments on the go across Kenya.",
  openGraph: {
    title: "Download Dwelly Mobile App - iOS & Android | IshinaDwelly",
    description:
      "Get the official IshinaDwelly mobile app for iOS and Android. Manage rentals, hire local helpers, and browse listings anywhere in Kenya.",
    url: "https://ishinadwelly.com/download",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "IshinaDwelly App Logo",
      },
    ],
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Safe hardcoded static JSON-LD for Google Rich Snippets & App Download Sitelinks */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            "name": "IshinaDwelly Mobile App",
            "operatingSystem": "ANDROID, IOS",
            "applicationCategory": "BusinessApplication",
            "description":
              "Manage rental listings, communicate with tenants, hire verified helpers, and track payments on the go across Kenya.",
            "url": "https://ishinadwelly.com/download",
            "installUrl": "https://play.google.com/store/apps/details?id=com.ishinadwelly.app",
            "publisher": {
              "@type": "Organization",
              "name": "Dwelly",
              "url": "https://ishinadwelly.com"
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "KES"
            }
          }),
        }}
      />
    </>
  );
}
