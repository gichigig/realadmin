"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import DonateModal from "@/components/DonateModal";
import { useAuth } from "@/lib/auth-context";
import {
  Bars3Icon,
  XMarkIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  MegaphoneIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  HeartIcon,
  IdentificationIcon,
  UserPlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

// Dynamically import AnimatedGlobe to avoid SSR issues with canvas
const AnimatedGlobe = dynamic(() => import("@/components/AnimatedGlobe"), {
  ssr: false,
  loading: () => (
    <div className="relative flex items-center justify-center">
      <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  ),
});

const MPESA_PAYBILL_NUMBER = process.env.NEXT_PUBLIC_MPESA_PAYBILL || "4326353";
const MPESA_ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_MPESA_ACCOUNT || "DONATE";

const features = [
  {
    name: "Property Management",
    description: "Easily manage all your rental properties in one place. Track tenants, payments, and maintenance.",
    icon: BuildingOfficeIcon,
  },
  {
    name: "Grow with Ads",
    description: "Advertise your properties to thousands of potential tenants actively searching for rentals.",
    icon: MegaphoneIcon,
  },
  {
    name: "Analytics Dashboard",
    description: "Get insights into your property performance with detailed analytics and reports.",
    icon: ChartBarIcon,
  },
  {
    name: "Mobile App",
    description: "Manage your rentals on the go with our powerful mobile app for iOS and Android.",
    icon: DevicePhoneMobileIcon,
  },
  {
    name: "Tenant Network",
    description: "Connect with verified tenants looking for quality rental properties in your area.",
    icon: UserGroupIcon,
  },
  {
    name: "Maximize Revenue",
    description: "Optimize your rental pricing and reduce vacancy rates with smart recommendations.",
    icon: CurrencyDollarIcon,
  },
];

export default function LandingPage() {
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Donate Modal */}
      <DonateModal isOpen={isDonateModalOpen} onClose={() => setIsDonateModalOpen(false)} />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center relative w-14 h-14 sm:w-16 sm:h-16">
                <Image src="/icon.png" alt="IshinaDwelly Logo" fill priority className="object-contain rounded-full" sizes="(max-width: 640px) 56px, 64px" />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">IshinaDwelly</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
                How it Works
              </Link>
              <Link href="/faqs" className="text-gray-600 hover:text-gray-900 transition-colors">
                FAQs
              </Link>
              <Link href="/download" className="text-gray-600 hover:text-gray-900 transition-colors">
                Download App
              </Link>
            </div>
            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/rentals"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  My Rentals
                </Link>
              ) : (
                <>
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
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 bg-white">
              <div className="flex flex-col space-y-4 px-2 pb-4">
                <Link
                  href="/help"
                  className="text-gray-600 hover:text-gray-900 font-medium px-2 py-2 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How it Works
                </Link>
                <Link
                  href="/faqs"
                  className="text-gray-600 hover:text-gray-900 font-medium px-2 py-2 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  FAQs
                </Link>
                <Link
                  href="/download"
                  className="text-gray-600 hover:text-gray-900 font-medium px-2 py-2 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Download App
                </Link>
                <div className="h-px bg-gray-100 my-2"></div>
                {isAuthenticated ? (
                  <Link
                    href="/rentals"
                    className="w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    My Rentals
                  </Link>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/login"
                      className="w-full text-center px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Manage Rentals &{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Grow Your Business
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-2xl">
                The all-in-one platform for property owners and managers. List rentals, reach tenants,
                advertise your business, and maximize your revenue with powerful tools.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="w-6 h-6" />
                  Start Free
                </Link>
                <Link
                  href="/scan-id"
                  className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <IdentificationIcon className="w-6 h-6" />
                  Scan ID
                </Link>
              </div>

              {/* Base App Notice */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <SparklesIcon className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 text-sm font-medium">
                  Free to list basics. Premium boosts available.
                </span>
              </div>

              {/* Download App Notice */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl inline-block">
                <p className="text-blue-800 text-sm flex items-center gap-2">
                  <DevicePhoneMobileIcon className="w-5 h-5" />
                  <span>
                    <strong>Full features</strong> available in our mobile app.{" "}
                    <Link href="/download" className="underline hover:no-underline">
                      Download now
                    </Link>
                  </span>
                </p>
              </div>
            </div>

            {/* Right - Animated Globe */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <AnimatedGlobe />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to manage properties and grow your rental business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 group cursor-pointer transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 transform group-hover:-translate-y-2 group-hover:scale-110 group-hover:bg-blue-600 group-hover:shadow-lg transition-all duration-300 rotate-3 group-hover:rotate-0">
                  <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.name}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Two platforms working together — list rentals on the web, find tenants through the app.
            </p>
          </div>

          {/* For Landlords - Web Platform */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-8 flex items-center justify-center gap-2">
              <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              For Landlords (Web Platform)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: UserPlusIcon,
                  title: "Create Your Account",
                  description: "Sign up for free on the web platform and set up your landlord profile.",
                },
                {
                  icon: HomeModernIcon,
                  title: "List Your Rentals",
                  description: "Add your rental properties with photos, details, pricing, and location to attract tenants.",
                },
                {
                  icon: MegaphoneIcon,
                  title: "Manage & Advertise",
                  description: "Create ads to boost visibility, manage inquiries, and track your listings' performance.",
                },
              ].map((item, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:-translate-y-3 group-hover:scale-110 group-hover:shadow-xl group-hover:bg-blue-500 transition-all duration-300 shadow-md rotate-3 group-hover:rotate-0">
                    <item.icon className="w-10 h-10 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* For Tenants - Mobile App */}
          <div className="bg-gray-100 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-8 flex items-center justify-center gap-2">
              <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />
              For Tenants (Mobile App)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: ArrowDownTrayIcon,
                  title: "Download the App",
                  description: "Get the IshinaDwelly app from the App Store or Google Play — it's completely free.",
                },
                {
                  icon: MagnifyingGlassIcon,
                  title: "Browse & Search",
                  description: "Explore thousands of rental listings, filter by location, price, and amenities.",
                },
                {
                  icon: ChatBubbleLeftRightIcon,
                  title: "Connect & Move In",
                  description: "Save favorites, message landlords directly, and find your perfect rental home.",
                },
              ].map((item, index) => (
                <div key={index} className="text-center group cursor-pointer">
                  <div className="w-20 h-20 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:-translate-y-3 group-hover:scale-110 group-hover:shadow-xl group-hover:bg-gray-800 transition-all duration-300 shadow-md -rotate-3 group-hover:rotate-0">
                    <item.icon className="w-10 h-10 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Transparent Pricing
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Our core platform is free to use. Stand out with our premium features designed to get your properties rented faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Basic Listing</h3>
              <div className="text-3xl font-bold text-blue-600 mb-4">Free</div>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Standard photos & text</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Appear in standard search</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Receive tenant messages</li>
              </ul>
              <details className="mt-4 group">
                <summary className="text-sm font-semibold text-blue-600 cursor-pointer list-none flex items-center gap-1">
                  Learn more
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pb-2">
                  <p>Our completely free tier allows you to list unlimited properties. You can add high-quality photos, write detailed descriptions, and connect directly with prospective tenants through our built-in messaging system.</p>
                  <p>Perfect for landlords just starting out or testing the waters.</p>
                </div>
              </details>
            </div>

            {/* Video Listing */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Video Listing</h3>
              <div className="text-3xl font-bold text-blue-600 mb-4">300 KSH</div>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Upload property walkthroughs</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Stand out in search results</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Higher tenant engagement</li>
              </ul>
              <details className="mt-4 group">
                <summary className="text-sm font-semibold text-blue-600 cursor-pointer list-none flex items-center gap-1">
                  Learn more
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pb-2">
                  <p>Enhance your listing by adding a high-definition video walkthrough. Properties with video get 3x more views and significantly faster rental times.</p>
                  <p>Tenants can take a virtual tour of your property right from the app, saving you from unnecessary physical viewings.</p>
                </div>
              </details>
            </div>

            {/* Local / Search Sponsorship */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm relative">
              <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Targeted Sponsorship</h3>
              <div className="text-3xl font-bold text-blue-600 mb-4">350 KSH</div>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> <b>Local:</b> Boost to nearby users</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> <b>OR Search:</b> Boost in area searches</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Shown on Premium Map Radar</li>
              </ul>
              <details className="mt-4 group">
                <summary className="text-sm font-semibold text-blue-600 cursor-pointer list-none flex items-center gap-1">
                  Learn more
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-3 text-sm text-gray-600 space-y-2 pb-2">
                  <p>Choose one of two powerful sponsorship methods to get your listing in front of the right eyes:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><b>Local Sponsorship:</b> Your listing gets a special beacon on the Map Radar, pushing it to tenants physically near the property.</li>
                    <li><b>Search Sponsorship:</b> Your listing is pinned to the top when users search for properties in your specific neighborhood.</li>
                  </ul>
                </div>
              </details>
            </div>

            {/* Max Bundle */}
            <div className="bg-blue-600 rounded-2xl p-8 shadow-xl text-white transform md:-translate-y-2">
              <h3 className="text-xl font-bold mb-2">Max Visibility Bundle</h3>
              <div className="text-3xl font-bold mb-4">600 KSH</div>
              <ul className="space-y-3 text-sm text-blue-100 mb-8">
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-white" /> Both Local & Search Sponsorship</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-white" /> Maximum reach & priority</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-white" /> Fastest way to find tenants</li>
              </ul>
              <details className="mt-4 group">
                <summary className="text-sm font-semibold text-blue-200 hover:text-white cursor-pointer list-none flex items-center gap-1">
                  Learn more
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-3 text-sm text-blue-100 space-y-2 pb-2">
                  <p>The ultimate marketing package. You get the benefits of both the Local Radar and the Area Search sponsorships at a discounted bundle rate.</p>
                  <p>This guarantees your property will be the first thing a tenant sees, whether they are walking near your building or searching from home. Highly recommended for premium units.</p>
                </div>
              </details>
            </div>
          </div>

          <div className="mt-16 text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              For Tenants (Dwelly App)
            </h3>
            <p className="mt-2 text-gray-600">
              Unlock powerful tools to find your dream home faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard User */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Standard App Access</h3>
              <div className="text-3xl font-bold text-blue-600 mb-4">Free</div>
              <ul className="space-y-3 text-sm text-gray-600 mb-8">
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Browse & search rentals</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Message landlords</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> Save favorites</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-500" /> videos of rentals</li>
              </ul>
            </div>

            {/* Premium User */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 shadow-xl text-white transform md:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">PREMIUM</div>
              <h3 className="text-xl font-bold mb-2">Map Radar Premium</h3>
              <div className="text-3xl font-bold text-blue-400 mb-4">Subscription</div>
              <ul className="space-y-3 text-sm text-gray-300 mb-8">
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-blue-400" /> Real-time Map Radar Cone</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-blue-400" /> See rentals exactly where you point</li>
                <li className="flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-blue-400" /> Interactive listing dots on map</li>
              </ul>
              <details className="mt-4 group">
                <summary className="text-sm font-semibold text-blue-400 hover:text-white cursor-pointer list-none flex items-center gap-1">
                  Learn more
                  <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-3 text-sm text-gray-400 space-y-2 pb-2">
                  <p>Upgrade your app experience with the interactive Map Radar. As you hold your phone, the compass tracks your real-time direction and projects a "radar cone" on the map.</p>
                  <p>You will instantly see dots representing premium listings exactly where you are pointing your device. Tap a dot to instantly reveal the listing details!</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Hire a Helper Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-16 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 md:w-2/3">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Don't have time to search? <br />Hire a Helper!
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Skip the hassle of browsing and calling landlords. Our dedicated local agents will find the perfect home for you based on your exact requirements.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold mb-3">1</div>
                  <h4 className="font-semibold mb-1">Tell us what you need</h4>
                  <p className="text-sm text-blue-200">Budget, location, and amenities.</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold mb-3">2</div>
                  <h4 className="font-semibold mb-1">Pay service fee</h4>
                  <p className="text-sm text-blue-200">A small fee to engage your personal agent.</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold mb-3">3</div>
                  <h4 className="font-semibold mb-1">Move in</h4>
                  <p className="text-sm text-blue-200">We curate options and schedule viewings.</p>
                </div>
              </div>

              <Link
                href="/help#helpers"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Learn More About Helpers
              </Link>
            </div>

            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20 pointer-events-none hidden md:block">
              <UserGroupIcon className="w-96 h-96 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Advertising Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-white text-sm mb-6">
                <ArrowTrendingUpIcon className="w-5 h-5" />
                Boost Your Visibility
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Advertise Your Business
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Reach thousands of potential customers with targeted advertising.
                Whether you&apos;re a property owner, real estate agent, or local business,
                our platform helps you connect with your audience.
              </p>
              <ul className="space-y-4 text-white mb-8">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Targeted local advertising
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Featured listings for maximum exposure
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Analytics to track ad performance
                </li>
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all"
              >
                Start Advertising
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MegaphoneIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Ad Performance</div>
                      <div className="text-sm text-gray-500">Last 30 days</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Impressions</span>
                      <span className="font-semibold text-gray-900">24,532</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Clicks</span>
                      <span className="font-semibold text-gray-900">1,847</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Conversions</span>
                      <span className="font-semibold text-gray-900">156</span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ROI</span>
                        <span className="font-bold text-blue-500 text-lg">+324%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-16 bg-gray-900" id="donate">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HeartIcon className="w-8 h-8 text-blue-400" />
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Support Our Mission
              </h2>
            </div>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              While our premium features help fund the platform, we still rely on generous donations from our community to keep the core platform accessible to everyone.
            </p>
          </div>

          {/* How Donations Help */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Database</h3>
              <p className="text-gray-400 text-sm">Securely store and manage millions of property listings and user data</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Hosting & Storage</h3>
              <p className="text-gray-400 text-sm">Keep our servers running 24/7 and store property images and documents</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Development</h3>
              <p className="text-gray-400 text-sm">Improve performance, fix bugs, and enhance the user experience</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">New Features</h3>
              <p className="text-gray-400 text-sm">Build exciting new tools like AI search, virtual tours, and more</p>
            </div>
          </div>

          {/* M-Pesa Donation Box */}
          <div className="max-w-2xl mx-auto">
            {/* Quick Donate - STK Push */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-xl mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Donate</h3>
                  <p className="text-green-100 text-sm">Instant M-Pesa STK Push</p>
                </div>
              </div>
              <p className="text-green-100 text-sm mb-4">
                Donate instantly! We&apos;ll send an M-Pesa prompt directly to your phone.
              </p>
              <button
                onClick={() => setIsDonateModalOpen(true)}
                className="w-full py-4 bg-white text-green-600 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16zM12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                </svg>
                Donate Now via M-Pesa
              </button>
            </div>

            {/* Manual Paybill Option */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16zM12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Manual M-Pesa</h3>
                  <p className="text-green-100 text-sm">Lipa na M-Pesa - Paybill</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-green-100 text-xs uppercase tracking-wide">Paybill Number</p>
                    <p className="text-white text-2xl font-bold tracking-wider">{MPESA_PAYBILL_NUMBER}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(MPESA_PAYBILL_NUMBER)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-green-100 text-xs uppercase tracking-wide">Account Number</p>
                    <p className="text-white text-2xl font-bold tracking-wider">{MPESA_ACCOUNT_NUMBER}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(MPESA_ACCOUNT_NUMBER)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-green-100 text-sm text-center">
                Or use the Paybill details above to donate manually 💚
              </p>
            </div>
          </div>

          {/* Large Donations */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-2">
              For large donations (KES 10,000+), please contact us:
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="mailto:donations@dwelly.co.ke"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us
              </a>
              <span className="text-gray-600">|</span>
              <a
                href="tel:+254700000000"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-gray-400">
              Whether you&apos;re looking for a home, managing properties, or growing your business — we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Tenants */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <UserGroupIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For Tenants</h3>
              <p className="text-gray-400 mb-6">
                Find your perfect rental home. Browse thousands of verified listings, connect with landlords, and secure your next place to live.
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Search rentals by location
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Message landlords directly
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Save favorites & get alerts
                </li>
              </ul>
            </div>

            {/* Landlords */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BuildingOfficeIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For Landlords</h3>
              <p className="text-gray-400 mb-6">
                Manage your rental properties with ease. List units, screen tenants, collect rent, and handle maintenance all in one place.
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  List unlimited properties
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Tenant screening & management
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Track rent & payments
                </li>
              </ul>
            </div>

            {/* Businesses */}
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <MegaphoneIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For Businesses</h3>
              <p className="text-gray-400 mb-6">
                Grow your business with targeted advertising. Reach thousands of potential customers in your area and boost your visibility.
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Create business ads
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Target local audiences
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Analytics & insights
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all inline-flex items-center gap-2"
            >
              <SparklesIcon className="w-6 h-6" />
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section id="download" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Download Our Mobile App
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Manage your rentals on the go. Browse listings, communicate with tenants,
                track payments, and grow your business - all from your phone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Apple iOS version is coming soon!");
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-75">Coming Soon on</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.ishinadwelly.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-75">Get it on</div>
                    <div className="text-lg font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="w-64 h-[500px] bg-gradient-to-b from-blue-500 to-blue-600 rounded-[3rem] shadow-2xl flex items-center justify-center">
                  <div className="text-white text-center p-6">
                    <img src="/icon.png" alt="IshinaDwelly App Logo" className="w-40 h-40 mx-auto mb-4 object-contain" />
                    <p className="text-lg opacity-75">IshinaDwelly App</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
