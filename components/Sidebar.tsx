"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  PlusCircleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  UserGroupIcon,
  FlagIcon,
  AdjustmentsHorizontalIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Rentals", href: "/rentals", icon: BuildingOfficeIcon },
  { name: "Add Rental", href: "/rentals/new", icon: PlusCircleIcon },
  { name: "Messages", href: "/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Ads", href: "/ads", icon: MegaphoneIcon },
  { name: "Ad Verification", href: "/advertisers", icon: UserGroupIcon },
  { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
  { name: "ID Verification", href: "/verification", icon: CheckBadgeIcon },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
];

const superAdminNavigation = [
  { name: "Super Admin", href: "/super-admin", icon: ShieldCheckIcon },
  { name: "Verify Businesses", href: "/advertisers/verify", icon: UserGroupIcon },
  { name: "Ad Approvals", href: "/super-admin/ad-approvals", icon: ClipboardDocumentCheckIcon },
  { name: "All Users", href: "/super-admin/users", icon: UsersIcon },
  { name: "All Rentals", href: "/super-admin/rentals", icon: BuildingOfficeIcon },
  { name: "Pending Approvals", href: "/super-admin/pending", icon: ClipboardDocumentCheckIcon },
  { name: "Reports", href: "/super-admin/reports", icon: FlagIcon },
  { name: "Sponsored Ads", href: "/super-admin/sponsored-ads", icon: MegaphoneIcon },
  { name: "Ad Settings", href: "/super-admin/ad-settings", icon: AdjustmentsHorizontalIcon },
  { name: "Ad Analytics", href: "/super-admin/ad-analytics", icon: PresentationChartLineIcon },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isSuperAdmin } = useAuth();
  const navItems = useMemo(
    () => (isSuperAdmin ? [...navigation, ...superAdminNavigation] : navigation),
    [isSuperAdmin]
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Prefetch dashboard routes for instant client-side tab switches.
  useEffect(() => {
    if (!isAuthenticated) return;
    navItems.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [isAuthenticated, navItems, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col bg-gray-900 text-white
          transform transition-all duration-300 ease-in-out
          lg:h-screen lg:overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "w-64"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {!isCollapsed && (
            <h1 className="text-xl font-bold truncate">Real Estate Admin</h1>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <span className="text-xl font-bold">RE</span>
            </div>
          )}
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href) && !pathname.startsWith("/super-admin"));
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch
                onClick={handleNavClick}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                } ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Super Admin Section */}
          {isSuperAdmin && (
            <>
              {!isCollapsed && (
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Super Admin
                  </p>
                </div>
              )}
              {isCollapsed && <div className="border-t border-gray-700 my-2" />}
              {superAdminNavigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/super-admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch
                    onClick={handleNavClick}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-amber-600 text-white"
                        : "text-amber-300 hover:bg-gray-800 hover:text-amber-200"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"}`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Collapse toggle button - desktop only */}
        <div className="hidden lg:flex px-3 py-2 border-t border-gray-800">
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-full p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* User section */}
        <div className="p-3 border-t border-gray-800">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <div className={`flex items-center ${isCollapsed ? "" : "min-w-0 flex-1"}`}>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {user?.firstName?.[0] || "U"}
                </span>
              </div>
              {!isCollapsed && (
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          {isCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full mt-2 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
