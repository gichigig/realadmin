import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the official Dwelly Privacy Policy. Learn how we protect, process, and secure your personal data and property listing information.",
  openGraph: {
    title: "Privacy Policy | Dwelly",
    description: "Official Privacy Policy regarding data protection and security on Dwelly.",
    url: "https://ishinadwelly.com/privacy-policy",
  },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
