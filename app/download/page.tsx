"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import {
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  SparklesIcon,
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function DownloadPage() {
  const googlePlayUrl = "https://play.google.com/store/apps/details?id=com.ishinadwelly.app";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <img src="/icon.png" alt="Dwelly Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Dwelly
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/rentals"
              className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100/50"
            >
              <span className="sm:hidden">Rentals</span>
              <span className="hidden sm:inline">Browse Rentals</span>
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <span className="xs:hidden">Admin</span>
              <span className="hidden xs:inline">Admin Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24 pb-28 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Text & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-semibold mb-4 sm:mb-6 animate-pulse">
              <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Official Mobile App for Android & iOS
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight sm:leading-tight">
              Manage Properties & Hire Helpers{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                On The Go
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Experience the fastest, most reliable way to find verified rental apartments, connect directly with landlords, post maintenance requests, and book professional home helpers anywhere across Kenya.
            </p>

            {/* Download Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <a
                href={googlePlayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl border border-gray-800"
              >
                <svg className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 font-medium leading-none mb-1">Get it on</div>
                  <div className="text-lg sm:text-xl font-bold leading-none">Google Play</div>
                </div>
              </a>

              <button
                onClick={() => alert("Apple iOS version is finalizing review and arriving on the App Store soon!")}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3.5 sm:py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-2xl font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all shadow-md"
              >
                <svg className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-gray-900 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-medium leading-none mb-1">Coming Soon</div>
                  <div className="text-lg sm:text-xl font-bold leading-none">App Store</div>
                </div>
              </button>
            </div>

            {/* Quick Badges */}
            <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-700 font-medium text-xs sm:text-sm">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                <span>Free to Download</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-medium text-xs sm:text-sm">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                <span>Instant Push Alerts</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 font-medium text-xs sm:text-sm col-span-2 sm:col-span-1 justify-center sm:justify-start">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                <span>Verified Landlords</span>
              </div>
            </div>
          </div>

          {/* Right Visual Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center mt-4 sm:mt-0">
            <div className="relative w-full max-w-[300px] xs:max-w-[340px] sm:max-w-sm">
              <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-[2.5rem] sm:rounded-[3rem] blur-2xl opacity-20 animate-pulse" />
              <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl border-4 border-gray-800 flex flex-col items-center justify-center text-center min-h-[440px] sm:min-h-[500px]">
                <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex items-center justify-center mb-4 sm:mb-6 shadow-inner">
                  <img src="/icon.png" alt="Dwelly App Icon" className="w-full h-full object-contain rounded-xl sm:rounded-2xl" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">IshinaDwelly App</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-xs">
                  Your all-in-one property radar, rental chat, and domestic helper hub.
                </p>
                <div className="mt-6 sm:mt-8 w-full bg-white/5 rounded-2xl p-3.5 sm:p-4 border border-white/10 text-left">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400">Live Status</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-300">
                    Over <span className="text-white font-bold">500+ properties</span> and verified service helpers available across Kenya right now.
                  </p>
                </div>
                <a
                  href={googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 sm:mt-8 w-full py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm sm:text-base font-semibold rounded-xl transition-colors shadow-lg block text-center"
                >
                  Install Now
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 sm:mb-5">
              <MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-2.5">Radar Property Map</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Use our interactive mobile radar to discover rental houses, apartments, and commercial units in your immediate neighborhood with transparent pricing.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 sm:mb-5">
              <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-2.5">Direct Instant Chat</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Message landlords and helpers instantly right within the app without sharing private phone numbers until you are ready.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 sm:mb-5">
              <ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-2.5">Verified & Secure</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Every building, landlord, and domestic helper undergoes strict identity and background verification to ensure total peace of mind.
            </p>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Mobile Action Bar (Visible only on mobile/small devices) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg text-white px-4 py-3 border-t border-gray-800 shadow-[0_-8px_30px_rgb(0,0,0,0.3)]">
        <div className="flex items-center justify-between max-w-sm mx-auto gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/icon.png" alt="Dwelly Icon" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-white/10" />
            <div className="min-w-0">
              <h4 className="text-sm font-bold truncate text-white">IshinaDwelly App</h4>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <SparklesIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">FREE on Google Play</span>
              </div>
            </div>
          </div>
          <a
            href={googlePlayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-gray-950 font-bold text-sm rounded-xl shadow-md flex-shrink-0 transition-transform active:scale-95"
          >
            Install
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
