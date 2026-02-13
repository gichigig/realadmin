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
} from "@heroicons/react/24/outline";

const webFeatures = [
  {
    icon: DocumentMagnifyingGlassIcon,
    title: "Scan ID Documents",
    description: "Upload images of found IDs and our OCR technology will extract key information automatically.",
  },
  {
    icon: CloudArrowUpIcon,
    title: "Submit Found IDs",
    description: "Submit found identification documents to our secure database for matching.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure Processing",
    description: "All data is encrypted and handled with strict privacy protections.",
  },
];

const appFeatures = [
  {
    icon: DocumentMagnifyingGlassIcon,
    title: "Search Database",
    description: "Search our database of found IDs to locate your lost documents.",
  },
  {
    icon: BellAlertIcon,
    title: "Instant Notifications",
    description: "Get notified immediately when someone finds an ID matching your search.",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "Secure Messaging",
    description: "Communicate with finders through our secure in-app messaging system.",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Camera Scanning",
    description: "Scan IDs directly using your phone's camera for faster submission.",
  },
];

const steps = {
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
      title: "Review Results",
      description: "Check the extracted data for accuracy. The system will show detected ID type and key information.",
    },
    {
      step: 5,
      title: "Download App to Submit",
      description: "For submitting found IDs and searching, download our mobile app.",
    },
  ],
  app: [
    {
      step: 1,
      title: "Download the App",
      description: "Get FindMyID from the App Store (iOS) or Google Play (Android).",
    },
    {
      step: 2,
      title: "Create an Account",
      description: "Sign up with your email or social media account.",
    },
    {
      step: 3,
      title: "Report Lost ID",
      description: "Enter details about your lost ID to create a search alert.",
    },
    {
      step: 4,
      title: "Get Notified",
      description: "Receive notifications when a matching ID is found.",
    },
    {
      step: 5,
      title: "Contact Finder",
      description: "Use secure messaging to arrange the return of your ID.",
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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">FindMyID</span>
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
            Learn how to use FindMyID to scan, submit, and search for lost identification documents.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#features" className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              Features
            </a>
            <a href="#how-to-scan" className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              How to Scan
            </a>
            <a href="#using-the-app" className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              Using the App
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
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Platform Features</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            FindMyID offers different features on web and mobile to provide the best experience for each platform.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Web Features */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DocumentMagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
                </div>
                Website Features
              </h3>
              <div className="space-y-6">
                {webFeatures.map((feature) => (
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

            {/* App Features */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-green-600" />
                </div>
                Mobile App Features
              </h3>
              <div className="space-y-6">
                {appFeatures.map((feature) => (
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

        {/* How to Scan Section */}
        <section id="how-to-scan" className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">How to Use the Web Scanner</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Follow these steps to scan a found ID document using our website.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-8">
              {steps.scanner.map((item, index) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                    {index < steps.scanner.length - 1 && (
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

            <div className="mt-10 p-6 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="font-semibold text-amber-800 mb-2">📱 Note: Searching Requires the App</h4>
              <p className="text-amber-700">
                The website is designed for scanning found IDs only. To search for your lost ID or submit found IDs to our database, please download the FindMyID mobile app.
              </p>
            </div>
          </div>
        </section>

        {/* Using the App Section */}
        <section id="using-the-app" className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Using the Mobile App</h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Get the full FindMyID experience with our mobile app.
          </p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="space-y-8">
              {steps.app.map((item, index) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                    {index < steps.app.length - 1 && (
                      <div className="w-0.5 h-12 bg-green-200 mx-auto mt-2" />
                    )}
                  </div>
                  <div className="pt-2">
                    <h4 className="font-semibold text-gray-900 text-lg">{item.title}</h4>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section id="download" className="mb-20">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-4">Download the FindMyID App</h2>
                <p className="text-gray-300 mb-8">
                  Get full access to all features including searching for lost IDs, receiving notifications, and secure messaging.
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
