"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "./Sidebar";
import LandingPage from "./LandingPage";
import { Bars3Icon } from "@heroicons/react/24/outline";
import GoogleAdBanner from "./GoogleAdBanner";
import DwellyOrbitingLoader from "./DwellyOrbitingLoader";
import FcmProvider from "./FcmProvider";

const publicPaths = [
  "/login", 
  "/signup", 
  "/scan-id", 
  "/faqs", 
  "/privacy-policy", 
  "/terms-and-conditions", 
  "/help",
  "/forgot-password",
  "/verify-email",
  "/landing",
  "/payments/mpesa",
  "/delete-account",
  "/download",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const isPublicPath = publicPaths.includes(pathname);
  const isHomePage = pathname === "/";
  const isMessagesPage = pathname?.startsWith("/messages");

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Redirect unverified users
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.emailVerified === false && !isPublicPath) {
      router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
    }
  }, [isLoading, isAuthenticated, user, isPublicPath, router]);

  // Save collapsed state to localStorage
  const handleToggleCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
  };

  // Public pages render immediately — no auth check, no sidebar, no spinner
  if (isPublicPath) {
    return <>{children}</>;
  }

  // To achieve perfect SEO and LCP, assume the home page is the Landing Page during SSR and initial load.
  // Once auth resolves, if they are authenticated, they will see the Dashboard (children).
  if (isHomePage && (isLoading || !isAuthenticated)) {
    return <LandingPage />;
  }

  if (isLoading || (isAuthenticated && user && user.emailVerified === false)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <DwellyOrbitingLoader size={72} />
      </div>
    );
  }

  return (
    <FcmProvider>
      <div className="flex h-screen h-[100dvh] bg-gray-50 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapse={handleToggleCollapse}
        />
        
        {/* Sidebar spacer for desktop - pushes content over */}
        <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-56"}`} />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Mobile header */}
          <header className="lg:hidden flex-shrink-0 flex items-center h-13 px-3 bg-white border-b border-gray-200 shadow-sm">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <img src="/icon.png" alt="Dwelly Logo" className="ml-2 w-7 h-7 rounded-full object-cover flex-shrink-0" />
            <h1 className="ml-2 text-base font-semibold text-gray-900 truncate">IshinaDwelly Admin</h1>
          </header>
          
          <main className={`flex-1 min-h-0 ${isMessagesPage ? "p-0 md:p-6 lg:p-8 overflow-hidden flex flex-col" : "p-4 md:p-6 lg:p-8 overflow-y-auto"}`}>
            {children}
          </main>
          
          {/* Ad Banner at the bottom of the screen */}
          {!(user?.isPremiumActive || user?.premiumActive) && (
            <div className={`flex-shrink-0 px-4 md:px-6 lg:px-8 bg-gray-50 border-t border-gray-200 ${isMessagesPage ? "hidden lg:block" : ""}`}>
              <GoogleAdBanner />
            </div>
          )}
        </div>
      </div>
    </FcmProvider>
  );
}

