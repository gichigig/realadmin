import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to Dwelly - Find Rental Properties & Local Services",
  description:
    "Discover verified rental apartments, residential buildings, and professional local home helpers across Kenya. Connect directly with landlords and service providers.",
  openGraph: {
    title: "Welcome to Dwelly - Find Rental Properties & Local Services",
    description: "Discover verified rental apartments, residential buildings, and professional local services across Kenya.",
    url: "https://ishinadwelly.com/landing",
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
