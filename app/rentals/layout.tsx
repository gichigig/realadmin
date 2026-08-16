import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Verified Rental Apartments & Homes",
  description:
    "Search and filter through hundreds of verified residential and commercial rental properties across Nairobi, Mombasa, and all over Kenya. Connect directly with landlords.",
  openGraph: {
    title: "Browse Verified Rental Apartments & Homes | Dwelly",
    description: "Search and filter through verified rental properties across Kenya.",
    url: "https://ishinadwelly.com/rentals",
  },
};

export default function RentalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
