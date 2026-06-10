"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { ChevronDownIcon, ChevronUpIcon, HomeModernIcon } from "@heroicons/react/24/outline";

const faqs = [
  {
    category: "General",
    questions: [
      {
        question: "What is Dwelly (RealEstate)?",
        answer:
          "Dwelly is a comprehensive property management platform connecting landlords with tenants. Landlords use the web platform to list rentals and purchase premium sponsorships, while tenants use the mobile app to browse listings, hire helpers, and use the Premium Map Radar.",
      },
      {
        question: "Is Dwelly free to use?",
        answer:
          "Yes and No. The core platform is completely free. Landlords can post unlimited basic listings for free, and tenants can browse and message landlords for free. However, we offer Premium tools (like Video Listings, Map Radar, and Helper Services) for a fee to enhance your experience.",
      },
      {
        question: "How does Dwelly make money?",
        answer:
          "We generate revenue through our premium features. Landlords can pay for Video Listings or Targeted Sponsorships to boost their visibility. Tenants can subscribe to Map Radar Premium or pay service fees to hire independent Helpers. We also take a standard platform fee from Helper earnings.",
      },
      {
        question: "In which areas is Dwelly available?",
        answer:
          "Dwelly is currently focused on Kenya, with coverage across major cities including Nairobi, Mombasa, Kisumu, and surrounding areas.",
      },
    ],
  },
  {
    category: "For Landlords (Web Platform)",
    questions: [
      {
        question: "How do I list my rental property?",
        answer:
          "Sign up on the web platform, go to 'Add Rental', and fill in your property details including photos, location, and price. Basic listings are 100% free.",
      },
      {
        question: "What are Premium Video Listings?",
        answer:
          "For 300 KSH, you can upload a video walkthrough of your property. Video listings get 3x more views and help you rent your property significantly faster.",
      },
      {
        question: "What is Targeted Sponsorship?",
        answer:
          "For 350 KSH, you can sponsor your listing. You can choose 'Local Sponsorship' to project your listing to nearby users on the Map Radar, or 'Search Sponsorship' to pin your listing to the top of area searches.",
      },
      {
        question: "What is the Max Visibility Bundle?",
        answer:
          "For 600 KSH, you get the ultimate marketing package: your listing benefits from both Local Radar and Area Search sponsorships.",
      },
    ],
  },
  {
    category: "For Tenants (Mobile App)",
    questions: [
      {
        question: "What is Map Radar Premium?",
        answer:
          "Map Radar Premium is a subscription feature on the mobile app. It uses your phone's compass to project a real-time 'radar cone' on the map, revealing premium listings in the exact direction you are pointing your phone.",
      },
      {
        question: "How do I hire a Helper?",
        answer:
          "If you don't have time to search for a rental, you can hire a Helper from the app. You pay their flat service fee securely, and they will curate a list of homes matching your exact needs and schedule viewings for you.",
      },
      {
        question: "Can I save properties I'm interested in?",
        answer:
          "Yes! Tap the bookmark icon on any listing to save it to your Favorites page for free.",
      },
      {
        question: "How do I contact a landlord?",
        answer:
          "When you find a property, tap the 'Message' button to send a message directly to the landlord through our secure in-app messaging system.",
      },
    ],
  },
  {
    category: "For Helpers",
    questions: [
      {
        question: "How do I become a Helper?",
        answer:
          "Helpers are independent agents verified by our team. Once approved, you get access to the Helper Dashboard on the web platform where you can set your own service rates.",
      },
      {
        question: "How do I get paid?",
        answer:
          "When a tenant hires you, they pay your service fee through the platform. These earnings go to your Helper Balance. You can withdraw your balance directly to M-Pesa at any time.",
      },
      {
        question: "What are the fees and taxes for Helpers?",
        answer:
          "Upon withdrawal, Dwelly deducts a 10% platform fee and a 5% KRA withholding tax (which you can use for your tax returns), along with standard M-Pesa withdrawal fees. Our dashboard provides a transparent breakdown before you withdraw.",
      },
    ],
  },
  {
    category: "FindMyID (Lost & Found)",
    questions: [
      {
        question: "What is the FindMyID feature?",
        answer:
          "As a community service, we have a built-in Lost & Found system. If you find a lost National ID, you can scan it using our web tool, and our OCR system will add it to the database.",
      },
      {
        question: "How do I search for my lost ID?",
        answer:
          "Download the mobile app and use the FindMyID search feature. You will be notified if someone scans and uploads an ID matching your details.",
      },
      {
        question: "Is the Lost ID feature free?",
        answer:
          "Yes, this is a completely free community service feature.",
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:text-blue-600 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-8">{question}</span>
        {isOpen ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-5 pr-12">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <HomeModernIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RealEstate</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Find answers to common questions about RealEstate. Can&apos;t find what you&apos;re looking for?{" "}
            <Link href="/help#contact" className="text-blue-400 underline hover:no-underline">
              Contact our support team
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {faqs.map((category) => (
          <div key={category.category} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {category.category}
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {category.questions.map((faq) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Still have questions */}
        <div className="mt-16 text-center bg-blue-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you with any questions or concerns.
          </p>
          <Link
            href="/help#contact"
            className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
