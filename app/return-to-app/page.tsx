"use client";

import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function ReturnToAppPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          Account Created!
        </h2>
        <p className="mt-4 text-lg text-gray-600 leading-relaxed">
          Your RealAdmin property management account has been successfully created and configured.
        </p>
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-blue-800 font-medium">
            You can now close this browser tab and return to the Dwelly app to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
