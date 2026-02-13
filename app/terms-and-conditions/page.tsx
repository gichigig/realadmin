import Link from "next/link";
import Footer from "@/components/Footer";

export default function TermsAndConditionsPage() {
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
          <h1 className="text-4xl font-bold text-white mb-4">Terms and Conditions</h1>
          <p className="text-xl text-blue-100">Last updated: February 8, 2026</p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the FindMyID website and mobile application (collectively, the &quot;Service&quot;), you agree to be bound by these Terms and Conditions (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and FindMyID Inc. (&quot;FindMyID,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
            </p>

            <h2>2. Description of Service</h2>
            <p>
              FindMyID provides a platform that:
            </p>
            <ul>
              <li>Allows users to scan and submit found identification documents</li>
              <li>Enables owners to search for their lost identification documents through our mobile app</li>
              <li>Facilitates communication between finders and owners to reunite documents</li>
              <li>Uses OCR (Optical Character Recognition) technology to extract information from ID images</li>
            </ul>

            <h2>3. User Accounts</h2>
            
            <h3>3.1 Account Creation</h3>
            <p>
              To access certain features of the Service, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as needed</li>
              <li>Keep your password confidential and secure</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h3>3.2 Account Eligibility</h3>
            <p>
              You must be at least 16 years old to create an account and use our Service. By creating an account, you represent that you meet this age requirement.
            </p>

            <h3>3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our sole discretion. You may also delete your account at any time through the app settings.
            </p>

            <h2>4. Acceptable Use</h2>
            
            <h3>4.1 Permitted Uses</h3>
            <p>You may use the Service to:</p>
            <ul>
              <li>Scan and submit legitimately found identification documents</li>
              <li>Search for your own lost identification documents</li>
              <li>Communicate with other users to arrange the return of documents</li>
              <li>Access documentation and help resources</li>
            </ul>

            <h3>4.2 Prohibited Uses</h3>
            <p>You agree NOT to:</p>
            <ul>
              <li>Submit false, fraudulent, or misleading information</li>
              <li>Upload IDs that you have stolen or obtained illegally</li>
              <li>Use the Service for identity theft, fraud, or any illegal purpose</li>
              <li>Attempt to access another user&apos;s account</li>
              <li>Interfere with or disrupt the Service or its servers</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Upload malware, viruses, or harmful code</li>
            </ul>

            <h2>5. ID Document Submissions</h2>
            
            <h3>5.1 Submission Guidelines</h3>
            <p>When submitting found ID documents, you must:</p>
            <ul>
              <li>Only submit IDs that you have legitimately found</li>
              <li>Provide accurate information about where and when the ID was found</li>
              <li>Make reasonable efforts to return the ID to its owner</li>
              <li>Not demand payment or reward for returning the ID (though owners may offer one voluntarily)</li>
            </ul>

            <h3>5.2 Legal Obligations</h3>
            <p>
              Depending on your jurisdiction, you may have legal obligations regarding found identification documents. These may include reporting to local authorities or turning in the document within a certain timeframe. It is your responsibility to comply with local laws.
            </p>

            <h3>5.3 Verification</h3>
            <p>
              We reserve the right to verify submissions and remove any that appear fraudulent or violate these Terms. We may also share information with law enforcement if we suspect illegal activity.
            </p>

            <h2>6. Intellectual Property</h2>
            
            <h3>6.1 Our Rights</h3>
            <p>
              The Service, including its design, features, content, and technology, is owned by FindMyID and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our permission.
            </p>

            <h3>6.2 Your Content</h3>
            <p>
              By submitting content (images, information) to the Service, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and process that content for the purpose of providing the Service. You retain ownership of your content.
            </p>

            <h3>6.3 Feedback</h3>
            <p>
              Any feedback, suggestions, or ideas you provide about the Service become our property and may be used without compensation or attribution.
            </p>

            <h2>7. Privacy</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> to understand how we collect, use, and protect your information.
            </p>

            <h2>8. Fees and Payments</h2>
            
            <h3>8.1 Free Features</h3>
            <p>
              Basic features of the Service, including scanning IDs and creating an account, are provided free of charge.
            </p>

            <h3>8.2 Premium Features</h3>
            <p>
              We may offer premium features for a fee. If you purchase premium features:
            </p>
            <ul>
              <li>Fees are non-refundable except as required by law</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>We may change pricing with reasonable notice</li>
              <li>You are responsible for applicable taxes</li>
            </ul>

            <h2>9. Disclaimers</h2>
            
            <h3>9.1 Service Availability</h3>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not guarantee that the Service will be uninterrupted, error-free, or secure.
            </p>

            <h3>9.2 Accuracy</h3>
            <p>
              We do not guarantee the accuracy of OCR extraction or the authenticity of submitted IDs. Users should verify information independently.
            </p>

            <h3>9.3 User Interactions</h3>
            <p>
              We are not responsible for interactions between users, including the successful return of IDs. We encourage users to exercise caution and meet in public places when exchanging documents.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FINDMYID SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p>
              OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless FindMyID, its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Your submissions or content</li>
            </ul>

            <h2>12. Dispute Resolution</h2>
            
            <h3>12.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of the State of California, USA, without regard to conflict of law principles.
            </p>

            <h3>12.2 Arbitration</h3>
            <p>
              Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in San Francisco, California, in accordance with the rules of the American Arbitration Association.
            </p>

            <h3>12.3 Class Action Waiver</h3>
            <p>
              You agree to resolve disputes with us individually and waive the right to participate in class actions or collective arbitration.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time by posting the updated Terms on our website. Material changes will be communicated through the Service or via email. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>

            <h2>14. General Provisions</h2>
            <ul>
              <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire agreement between you and FindMyID.</li>
              <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions will continue in effect.</li>
              <li><strong>Waiver:</strong> Our failure to enforce any right does not constitute a waiver of that right.</li>
              <li><strong>Assignment:</strong> You may not assign these Terms without our consent. We may assign our rights freely.</li>
              <li><strong>Force Majeure:</strong> We are not liable for delays or failures caused by events beyond our reasonable control.</li>
            </ul>

            <h2>15. Contact Information</h2>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <ul>
              <li>Email: legal@findmyid.com</li>
              <li>Address: FindMyID Inc., 123 Tech Street, San Francisco, CA 94102</li>
            </ul>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl">
              <p className="text-blue-800 font-medium">
                By using FindMyID, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
