"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import DonateModal from "@/components/DonateModal";
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  MegaphoneIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  IdentificationIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

// Dynamically import AnimatedGlobe to avoid SSR issues with canvas
const AnimatedGlobe = dynamic(() => import("@/components/AnimatedGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-[400px] h-[400px] md:w-[500px] md:h-[500px] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

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
  
  return (
    <div className="min-h-screen bg-white">
      {/* Donate Modal */}
      <DonateModal isOpen={isDonateModalOpen} onClose={() => setIsDonateModalOpen(false)} />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <HomeModernIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RealEstate</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
                How it Works
              </Link>
              <Link href="/faqs" className="text-gray-600 hover:text-gray-900 transition-colors">
                FAQs
              </Link>
              <Link href="/help#download" className="text-gray-600 hover:text-gray-900 transition-colors">
                Download App
              </Link>
            </div>
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
                Get Started
              </Link>
            </div>
          </div>
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

              {/* Free App Notice */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <SparklesIcon className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 text-sm font-medium">
                  100% Free Forever — No hidden fees!
                </span>
              </div>

              {/* Download App Notice */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl inline-block">
                <p className="text-blue-800 text-sm flex items-center gap-2">
                  <DevicePhoneMobileIcon className="w-5 h-5" />
                  <span>
                    <strong>Full features</strong> available in our mobile app.{" "}
                    <Link href="/help#download" className="underline hover:no-underline">
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
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
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
                  step: "1",
                  title: "Create Your Account",
                  description: "Sign up for free on the web platform and set up your landlord profile.",
                },
                {
                  step: "2",
                  title: "List Your Rentals",
                  description: "Add your rental properties with photos, details, pricing, and location to attract tenants.",
                },
                {
                  step: "3",
                  title: "Manage & Advertise",
                  description: "Create ads to boost visibility, manage inquiries, and track your listings' performance.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
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
                  step: "1",
                  title: "Download the App",
                  description: "Get the RealEstate app from the App Store or Google Play — it's completely free.",
                },
                {
                  step: "2",
                  title: "Browse & Search",
                  description: "Explore thousands of rental listings, filter by location, price, and amenities.",
                },
                {
                  step: "3",
                  title: "Connect & Move In",
                  description: "Save favorites, message landlords directly, and find your perfect rental home.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-gray-900 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
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
              Dwelly is <strong className="text-white">absolutely free</strong> for everyone. We rely on generous donations from our community to keep the platform running and continue improving it.
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
                  <path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16zM12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
                </svg>
                Donate Now via M-Pesa
              </button>
            </div>

            {/* Manual Paybill Option */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 2H7C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16zM12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
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
                    <p className="text-white text-2xl font-bold tracking-wider">123456</p>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText('123456')}
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
                    <p className="text-white text-2xl font-bold tracking-wider">DONATE</p>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText('DONATE')}
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
              Whether you&apos;re looking for a home, managing properties, or growing your business — we&apos;ve got you covered. <strong className="text-blue-400">100% Free!</strong>
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
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-75">Download on the</div>
                    <div className="text-lg font-semibold">App Store</div>
                  </div>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
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
                    <HomeModernIcon className="w-20 h-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg opacity-75">RealEstate App</p>
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
