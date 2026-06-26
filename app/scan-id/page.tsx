"use client";

import IDScanner from "@/components/IDScanner";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ScanIDPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center">
                  <img src="/icon.png" alt="IshinaDwelly Logo" className="w-10 h-10 object-contain" />
                </div>
                <span className="text-xl font-bold text-gray-900">FindMyID</span>
              </div>
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
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Scan Lost ID Document
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload an image of a found ID to extract information and help reunite it with its owner.
            Our OCR technology will automatically detect and extract key details.
          </p>
        </div>

        <IDScanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
