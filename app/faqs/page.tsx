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
        question: "What is RealEstate?",
        answer:
          "RealEstate is a free platform connecting landlords with tenants. Landlords use the web platform to list rental properties and manage advertisements, while tenants use the mobile app to browse listings, save favorites, and contact landlords directly.",
      },
      {
        question: "Is RealEstate free to use?",
        answer:
          "Yes! RealEstate is 100% free for everyone. Both the web platform for landlords and the mobile app for tenants are completely free. We rely on community donations to keep the platform running and continue adding new features.",
      },
      {
        question: "How does RealEstate make money?",
        answer:
          "We are a donation-supported platform. We believe housing search should be free and accessible to everyone. We rely on generous donations from our community to cover hosting, database, and development costs. We never charge users or sell data.",
      },
      {
        question: "In which areas is RealEstate available?",
        answer:
          "RealEstate is currently focused on Kenya, with coverage across major cities including Nairobi, Mombasa, Kisumu, and surrounding areas. We are continuously expanding to more regions.",
      },
    ],
  },
  {
    category: "For Landlords (Web Platform)",
    questions: [
      {
        question: "How do I list my rental property?",
        answer:
          "Sign up on the web platform, go to 'Add Rental', and fill in your property details including photos, location, price, number of bedrooms, amenities, and contact information. Your listing will be visible to tenants on the mobile app after approval.",
      },
      {
        question: "Can I list multiple properties?",
        answer:
          "Absolutely! You can list as many rental properties as you have. There are no limits on the number of listings you can create, and it's completely free.",
      },
      {
        question: "How do I manage my rental listings?",
        answer:
          "From your dashboard, you can view all your listings, edit details, update availability status (Active, Rented, Pending), view analytics, and manage inquiries from potential tenants.",
      },
      {
        question: "What are advertisements and how do they work?",
        answer:
          "Advertisements allow businesses to promote their services to our users. You can create ads that appear in the mobile app. Ads go through a verification process before being published to ensure quality and safety.",
      },
      {
        question: "How do I communicate with potential tenants?",
        answer:
          "When tenants are interested in your property, they can message you through the app. You'll receive these messages in your 'Messages' section on the web platform, where you can respond and arrange viewings.",
      },
    ],
  },
  {
    category: "For Tenants (Mobile App)",
    questions: [
      {
        question: "How do I find rental properties?",
        answer:
          "Download the RealEstate app from the App Store or Google Play. Browse listings on the Explore page, use filters to narrow down by location, price range, number of bedrooms, and other criteria to find your perfect rental.",
      },
      {
        question: "Why do I need the mobile app to search for rentals?",
        answer:
          "The mobile app is optimized for tenants to browse, search, and connect with landlords. It offers features like location-based search, saved favorites, instant notifications, and direct messaging — all designed for the best rental hunting experience.",
      },
      {
        question: "Can I save properties I'm interested in?",
        answer:
          "Yes! Tap the bookmark icon on any listing to save it to your Saved page. You can also set up rental alerts to be notified when new properties matching your criteria are listed.",
      },
      {
        question: "How do I contact a landlord?",
        answer:
          "When you find a property you're interested in, tap the 'Message' button to send a message directly to the landlord through our secure in-app messaging system. You can discuss details and arrange property viewings.",
      },
      {
        question: "Do I need an account to browse rentals?",
        answer:
          "You can browse listings without an account, but creating a free account lets you save favorites, message landlords, set up alerts, and track your rental search history.",
      },
    ],
  },
  {
    category: "Lost ID Feature",
    questions: [
      {
        question: "What is the Lost ID feature?",
        answer:
          "As a community service, we offer a Lost ID feature. If someone finds a lost identification document, they can scan and register it on the web platform. People who lost their IDs can search for them through the mobile app.",
      },
      {
        question: "How do I report a found ID?",
        answer:
          "On the web platform, go to 'Scan ID', take a clear photo of the found ID, and our system will extract the relevant information. The ID will be registered in our database so the owner can find it.",
      },
      {
        question: "How do I search for my lost ID?",
        answer:
          "Download the mobile app and use the Lost ID search feature. Enter your details (name, ID number) to check if someone has found and registered your document. You'll be notified if there's a match.",
      },
      {
        question: "Is the Lost ID feature free?",
        answer:
          "Yes, the Lost ID feature is completely free as part of our community service mission. We want to help people reunite with their important documents.",
      },
    ],
  },
  {
    category: "Account & Security",
    questions: [
      {
        question: "How do I create an account?",
        answer:
          "Click 'Sign Up' on the web platform or download the mobile app and tap 'Create Account'. You'll need to provide your email, create a password, and verify your email address.",
      },
      {
        question: "Is my personal information secure?",
        answer:
          "Yes, we take security seriously. All data is encrypted, and we follow industry-standard security practices. We never sell or share your personal information with third parties.",
      },
      {
        question: "How do I reset my password?",
        answer:
          "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a password reset link. Follow the instructions in the email to create a new password.",
      },
      {
        question: "Can I delete my account?",
        answer:
          "Yes, you can delete your account at any time from the Settings page. Upon deletion, all your personal data and listings will be permanently removed from our systems.",
      },
    ],
  },
  {
    category: "Support & Donations",
    questions: [
      {
        question: "How can I support RealEstate?",
        answer:
          "As a free platform, we rely on community support. Donations help us pay for database hosting, server costs, storage, and continued development of new features. Donation link coming soon!",
      },
      {
        question: "What do donations pay for?",
        answer:
          "Donations cover essential costs: database management for storing listings and user data, server hosting to keep the platform running 24/7, cloud storage for property images, and development costs for building new features and improvements.",
      },
      {
        question: "How do I report a problem or bug?",
        answer:
          "Contact our support team through the Help page or send an email describing the issue. Include details like what you were trying to do, what happened, and any error messages you saw.",
      },
      {
        question: "Can I volunteer or contribute to the project?",
        answer:
          "We appreciate community involvement! If you're interested in contributing as a developer, designer, or in any other capacity, please reach out through our contact page.",
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
