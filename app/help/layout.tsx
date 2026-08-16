import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support Center",
  description:
    "Get support for your Dwelly account, rental management, tenant communication, and premium sponsorships. Contact our 24/7 support team.",
  openGraph: {
    title: "Help & Support Center | Dwelly",
    description: "Get support for your Dwelly account, listings, and tenant management.",
    url: "https://ishinadwelly.com/help",
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
