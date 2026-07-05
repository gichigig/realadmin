"use client";

import Link from "next/link";
import { FaGithub, FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaEnvelope, FaWhatsapp, FaTiktok } from "react-icons/fa";

const footerLinks = {
  product: [
    { name: "List Property", href: "/properties/new" },
    { name: "Advertising", href: "/advertising" },
    { name: "Features", href: "/help#features" },
    { name: "Download App", href: "/help#download" },
  ],
  support: [
    { name: "Help Center", href: "/help" },
    { name: "FAQs", href: "/faqs" },
    { name: "Contact Us", href: "/help#contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms-and-conditions" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center">
                <img src="/icon.png" alt="IshinaDwelly Logo" className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full" />
              </div>
              <span className="text-xl font-bold text-white">IshinaDwelly</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              The all-in-one platform for property management and business growth. List rentals, reach tenants, and advertise your business to thousands of customers.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:ngangabildad@gmail.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Email">
                <span className="sr-only">Email</span>
                <FaEnvelope className="w-5 h-5" />
              </a>
              <a href="https://github.com/gichigig" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="GitHub">
                <span className="sr-only">GitHub</span>
                <FaGithub className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/bildad-mwangi/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="LinkedIn">
                <span className="sr-only">LinkedIn</span>
                <FaLinkedin className="w-5 h-5" />
              </a>
              <a href="https://wa.me/254106546233" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="WhatsApp">
                <span className="sr-only">WhatsApp</span>
                <FaWhatsapp className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/billy_bill021" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Twitter / X">
                <span className="sr-only">Twitter</span>
                <FaTwitter className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@billy_bill021" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="TikTok">
                <span className="sr-only">TikTok</span>
                <FaTiktok className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/billy_bill021" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Facebook">
                <span className="sr-only">Facebook</span>
                <FaFacebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/gichigi_m.n" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Instagram">
                <span className="sr-only">Instagram</span>
                <FaInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} IshinaDwelly. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link
                href="/privacy-policy"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms-and-conditions"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/faqs"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                FAQs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
