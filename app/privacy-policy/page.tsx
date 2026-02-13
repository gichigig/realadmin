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
              FindMyID (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application (collectively, the &quot;Service&quot;).
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
              <li>Profile information</li>
              <li>Payment information (for premium features)</li>
              <li>Communications with us (support requests, feedback)</li>
            </ul>

            <h3>ID Document Information</h3>
            <p>When you scan or submit an ID document, we collect:</p>
            <ul>
              <li>Images of identification documents</li>
              <li>Extracted text data from documents (names, ID numbers, dates)</li>
              <li>Document type and issuing country</li>
              <li>Metadata about the scan (date, location if permitted)</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>We automatically collect certain information when you use our Service:</p>
            <ul>
              <li>Device information (type, operating system, unique identifiers)</li>
              <li>IP address and general location</li>
              <li>Browser type and settings</li>
              <li>Usage data (pages visited, features used, timestamps)</li>
              <li>Crash reports and performance data</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>To provide and maintain our Service</li>
              <li>To match found IDs with their owners</li>
              <li>To process transactions and send related information</li>
              <li>To send notifications about matches and updates</li>
              <li>To respond to your inquiries and provide support</li>
              <li>To improve our Service and develop new features</li>
              <li>To detect and prevent fraud and abuse</li>
              <li>To comply with legal obligations</li>
            </ul>

            <h2>Data Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>With Your Consent:</strong> We share information when you give us permission to do so.</li>
              <li><strong>For ID Matching:</strong> Limited information is shared between users when a match is found to facilitate the return of documents.</li>
              <li><strong>Service Providers:</strong> We may share information with third-party vendors who perform services on our behalf (hosting, analytics, payment processing).</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights and the safety of others.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred.</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your information, including:
            </p>
            <ul>
              <li>Encryption of data in transit (TLS/SSL) and at rest (AES-256)</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and employee training</li>
              <li>Secure data centers with physical security measures</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>

            <h2>Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. ID document data is retained for a period necessary to facilitate matching, typically up to 2 years unless you request earlier deletion.
            </p>
            <p>
              Upon account deletion or at your request, we will delete or anonymize your personal information within 30 days, except where retention is required by law.
            </p>

            <h2>Your Rights and Choices</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a portable copy of your data</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at privacy@findmyid.com.
            </p>

            <h2>International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place, such as standard contractual clauses, to protect your information during such transfers.
            </p>

            <h2>Children&apos;s Privacy</h2>
            <p>
              Our Service is not directed to children under 16. We do not knowingly collect personal information from children under 16. If we learn that we have collected information from a child under 16, we will delete that information promptly.
            </p>

            <h2>Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
            </p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the updated policy.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <ul>
              <li>Email: privacy@findmyid.com</li>
              <li>Address: FindMyID Inc., 123 Tech Street, San Francisco, CA 94102</li>
            </ul>

            <h2>GDPR Compliance (For EU/EEA Users)</h2>
            <p>
              If you are located in the European Union or European Economic Area, the following additional information applies:
            </p>
            <ul>
              <li><strong>Legal Basis:</strong> We process your data based on consent, contract performance, legitimate interests, or legal obligations.</li>
              <li><strong>Data Protection Officer:</strong> You can contact our DPO at dpo@findmyid.com</li>
              <li><strong>Supervisory Authority:</strong> You have the right to lodge a complaint with your local data protection authority.</li>
            </ul>

            <h2>CCPA Compliance (For California Residents)</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul>
              <li>Right to know what personal information is collected and how it is used</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
