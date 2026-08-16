import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about listing rental properties, premium sponsorships, M-Pesa payments, helper hiring, and mobile app features on Dwelly.",
  openGraph: {
    title: "Frequently Asked Questions | Dwelly Help Center",
    description: "Answers to common questions about Dwelly rental listings, payments, and services.",
    url: "https://ishinadwelly.com/faqs",
  },
};

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
