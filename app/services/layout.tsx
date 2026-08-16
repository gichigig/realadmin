import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified Domestic Helpers & Home Services",
  description:
    "Hire vetted professional helpers, plumbers, electricians, cleaners, and moving services right at your doorstep with transparent pricing on Dwelly.",
  openGraph: {
    title: "Verified Domestic Helpers & Home Services | Dwelly",
    description: "Hire vetted professional helpers, cleaners, and home services across Kenya.",
    url: "https://ishinadwelly.com/services",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
