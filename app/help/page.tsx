"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import {
  DevicePhoneMobileIcon,
  DocumentMagnifyingGlassIcon,
  CloudArrowUpIcon,
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  SparklesIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const landlordFeatures = [
  {
    icon: BuildingOfficeIcon,
    title: "Basic Listing (Free)",
    description: "Post unlimited rental listings with high-quality photos, detailed descriptions, and connect with tenants for free.",
  },
  {
    icon: SparklesIcon,
    title: "Video Listings (Premium)",
    description: "For 300 KSH, enhance your listing with a video walkthrough to get 3x more views and rent faster.",
  },
  {
    icon: CurrencyDollarIcon,
    title: "Targeted Sponsorships",
    description: "For 350 KSH, boost your listing to appear on the Map Radar for nearby users, or pin it to the top of area searches.",
  },
];

const tenantFeatures = [
  {
    icon: DevicePhoneMobileIcon,
    title: "Standard App Search",
    description: "Search for rentals, save favorites, and message landlords securely from our mobile app for free.",
  },
  {
    icon: MapPinIcon,
    title: "Map Radar Premium",
    description: "Upgrade to see real-time dots of premium listings exactly where you point your phone using our interactive compass.",
  },
  {
    icon: UserGroupIcon,
    title: "Hire a Helper",
    description: "Don't have time to search? Hire a local Helper agent to curate options and schedule viewings for you.",
  },
];

const idScannerFeatures = [
  {
    icon: DocumentMagnifyingGlassIcon,
    title: "Scan & Submit",
    description: "Find a lost ID? Use our OCR technology to scan and securely upload it to our database.",
  },
  {
    icon: BellAlertIcon,
    title: "Get Notified",
    description: "Get instantly notified when your lost ID is found by someone in the community.",
  },
];

const steps = {
  helpers: [
    {
      step: 1,
      title: "Tell Us What You Need",
      description: "Specify your budget, preferred location, and required amenities.",
    },
    {
      step: 2,
      title: "Pay the Service Fee",
      description: "Pay the Helper's flat service fee to engage their personalized services.",
    },
    {
      step: 3,
      title: "Review Curated Homes",
      description: "Your Helper will send you a curated list of homes matching your exact needs.",
    },
    {
      step: 4,
      title: "Tour & Move In",
      description: "The Helper schedules the viewings. You tour the best options and sign the lease!",
    },
  ],
  scanner: [
    {
      step: 1,
      title: "Navigate to Scan ID",
      description: "Click on 'Scan ID' from the landing page or navigation menu.",
    },
    {
      step: 2,
      title: "Upload Image",
      description: "Click the upload area or drag and drop an image of the ID document.",
    },
    {
      step: 3,
      title: "Wait for Processing",
      description: "Our OCR system will analyze the image and extract text information.",
    },
    {
      step: 4,
      title: "Download App to Connect",
      description: "If you lost an ID or found one, download our mobile app to securely communicate.",
    },
  ],
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/icon.png" alt="IshinaDwelly Logo" className="w-10 h-10 object-contain" />
              </div>
              <span className="text-xl font-bold text-gray-900">Dwelly Support</span>
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
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <QuestionMarkCircleIcon className="w-16 h-16 text-blue-200 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Help & Documentation</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Learn how to manage properties, find your dream home, hire a helper, and use our FindMyID scanning system.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#features" className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              Platform Features
            </a>
            <a href="#helpers" className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              Hire a Helper
            </a>
            <a href="#findmyid" className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              FindMyID (Lost & Found)
            </a>
            <a href="#download" className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              Download App
            </a>
            <a href="#contact" className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Features Section */}
        <section id="features" className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Dwelly Features</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            A comprehensive platform connecting landlords with tenants, loaded with premium tools.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Landlords */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                </div>
                For Landlords (Web)
              </h3>
              <div className="space-y-6">
                {landlordFeatures.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenants */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-green-600" />
                </div>
                For Tenants (Mobile App)
              </h3>
              <div className="space-y-6">
                {tenantFeatures.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Helpers Section */}
        <section id="helpers" className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">How to Hire a Helper</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Don't have time to search for a rental? Our network of independent helpers are here to do the legwork for you!
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-8">
              {steps.helpers.map((item, index) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                    {index < steps.helpers.length - 1 && (
                      <div className="w-0.5 h-12 bg-blue-200 mx-auto mt-2" />
                    )}
                  </div>
                  <div className="pt-2">
                    <h4 className="font-semibold text-gray-900 text-lg">{item.title}</h4>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-blue-50 border border-blue-200 rounded-xl flex gap-4 items-start">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Transparent Helper Pricing</h4>
                <p className="text-blue-800 text-sm">
                  Independent helpers set their own flat service fees. You pay this fee securely through the platform to engage their services. Helpers receive their earnings after a standard 10% platform fee and 5% KRA withholding tax deduction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FindMyID Section */}
        <section id="findmyid" className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">FindMyID (Lost & Found)</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            A built-in utility to scan and report found National ID documents.
          </p>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">How to Scan a Found ID</h3>
              <div className="space-y-6">
                {steps.scanner.map((item, index) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                    </div>
                    <div className="pt-1">
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-sm p-8 text-white">
              <h3 className="text-xl font-bold mb-6">FindMyID App Features</h3>
              <div className="space-y-6">
                {idScannerFeatures.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{feature.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section id="download" className="mb-20">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-4">Download the Dwelly App</h2>
                <p className="text-gray-300 mb-8">
                  Get full access to tenant features including searching for rentals, hiring a helper, and our Premium Map Radar.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <a
                    href="#"
                    className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">Download on the</div>
                      <div className="text-lg font-semibold">App Store</div>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-8 h-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs">Get it on</div>
                      <div className="text-lg font-semibold">Google Play</div>
                    </div>
                  </a>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center">
                  <DevicePhoneMobileIcon className="w-24 h-24 text-white opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Tips for Best Results</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Good Lighting",
                description: "Ensure the ID is well-lit without shadows or glare for accurate scanning.",
              },
              {
                title: "Clear Image",
                description: "Use a high-resolution image where all text is clearly readable.",
              },
              {
                title: "Full Document",
                description: "Make sure the entire ID is visible in the frame without cutting off edges.",
              },
              {
                title: "Flat Surface",
                description: "Place the ID on a flat, contrasting background for best results.",
              },
              {
                title: "No Obstructions",
                description: "Remove any objects covering parts of the ID, including fingers.",
              },
              {
                title: "Steady Camera",
                description: "Keep your camera steady to avoid blur when taking photos.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{tip.title}</h4>
                <p className="text-gray-600 text-sm">{tip.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Contact Us</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 text-sm mb-4">For general inquiries and support</p>
              <a href="mailto:support@findmyid.com" className="text-blue-600 hover:underline font-medium">
                support@findmyid.com
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <PhoneIcon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 text-sm mb-4">Available Mon-Fri, 9AM-5PM PST</p>
              <a href="tel:+1-800-FINDMYID" className="text-blue-600 hover:underline font-medium">
                1-800-FINDMYID
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Office</h3>
              <p className="text-gray-600 text-sm mb-4">For mail correspondence</p>
              <p className="text-gray-700">
                123 Tech Street<br />
                San Francisco, CA 94102
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Have a quick question?</p>
            <Link
              href="/faqs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <QuestionMarkCircleIcon className="w-5 h-5" />
              Browse FAQs
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
