import Link from "next/link";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center bg-blue-600 rounded-lg p-2">
                <span className="text-white font-bold">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Dwelly</span>
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
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-xl text-blue-100">Last updated: February 8, 2026</p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <h2>Introduction</h2>
            <p>
              Dwelly (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the &quot;Service&quot;).
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using our Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
            </p>

            <h2>Information We Collect</h2>
            
            <h3>Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide when using our Service, including:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials (username and password)</li>
              <li>Profile information and preferences</li>
              <li>Payment history (for premium features and marketplace orders)</li>
              <li>Communications with us (support requests, feedback)</li>
            </ul>

            <h3>Device Data & Permissions (Google Play Requirements)</h3>
            <p>To provide core features of Dwelly, we request access to the following sensitive data:</p>
            <ul>
              <li><strong>Contacts List:</strong> With your permission, we securely collect and upload your device's contact list to our servers (`api.ishinadwelly.com`). This is used exclusively to help you find and connect with friends who are already on Dwelly, enabling in-app chatting and sharing. We do not sell or share your contact list with third parties.</li>
              <li><strong>Location Data:</strong> We collect approximate and precise location data to show you nearby rental properties on the Map Radar, and to help you search for local marketplace items.</li>
              <li><strong>Photos & Camera:</strong> We require access to your camera or photo gallery so you can upload profile pictures, post rental listings, or list items on the marketplace.</li>
              <li><strong>Device IDs & App Activity:</strong> We collect device identifiers and usage data to provide Push Notifications, personalize your "For You" feed, and serve relevant advertisements via Google AdMob.</li>
              <li><strong>App Info and Performance (Crash Logs & Diagnostics):</strong> We collect crash logs, diagnostics, and other app performance data to help us identify and fix bugs, improve app stability, and monitor the overall health of the service.</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>To provide, maintain, and personalize our Service</li>
              <li>To connect tenants with landlords and buyers with sellers</li>
              <li>To sync your contacts so you can chat with friends</li>
              <li>To process transactions and track premium statuses</li>
              <li>To send push notifications regarding messages, rentals, and updates</li>
              <li>To improve our Service, monitor analytics, and prevent fraud</li>
            </ul>

            <h2>Data Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>With Other Users:</strong> When you list a property or item, your public profile (name, contact info) is visible to interested users.</li>
              <li><strong>Service Providers:</strong> We may share information with third-party vendors who perform services on our behalf (e.g., Google AdMob for advertising, Firebase for notifications).</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights and the safety of others.</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement robust technical security measures to protect your information, including encryption of data in transit (HTTPS/TLS) and secure database storage. While we strive to protect your information, no electronic transmission is 100% secure.
            </p>

            <h2>Data Retention & Deletion</h2>
            <p>
              We retain your personal information for as long as your account is active. You have the right to request the deletion of your data at any time.
            </p>
            <p>
              <strong>How to delete your data:</strong> You can delete your account and all associated data directly within the Dwelly app by navigating to Account Settings &gt; Delete Account. Upon request, we will delete or anonymize your personal information within 30 days.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or how we handle your Contacts and Location data, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@ishinadwelly.com</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
