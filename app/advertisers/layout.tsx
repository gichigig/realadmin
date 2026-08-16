import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertiser Sponsorships & Premium Promotion",
  description:
    "Promote your real estate listings, businesses, or local services across the entire Dwelly ecosystem. Reach active tenants and landlords across Kenya.",
  openGraph: {
    title: "Advertiser Sponsorships & Premium Promotion | Dwelly",
    description: "Promote your listings and services across the Dwelly ecosystem in Kenya.",
    url: "https://ishinadwelly.com/advertisers",
  },
};

export default function AdvertisersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
