import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified Buildings & Residential Complexes",
  description:
    "Explore top-rated residential buildings, apartment complexes, and commercial estates managed by verified landlords on Dwelly across Kenya.",
  openGraph: {
    title: "Verified Buildings & Residential Complexes | Dwelly",
    description: "Explore top-rated residential complexes and commercial estates across Kenya.",
    url: "https://ishinadwelly.com/buildings",
  },
};

export default function BuildingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
