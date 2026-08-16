import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Review the Terms and Conditions for using the Dwelly real estate and rental management platform in Kenya.",
  openGraph: {
    title: "Terms & Conditions | Dwelly",
    description: "Official Terms and Conditions for using Dwelly platform services.",
    url: "https://ishinadwelly.com/terms-and-conditions",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
