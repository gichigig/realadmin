"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { requestAndGetFcmToken, onFcmMessage } from "@/lib/firebase";
import { notificationApi } from "@/lib/api";
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { MessagePayload } from "firebase/messaging";

interface ToastNotification {
  id: string;
  title: string;
  body: string;
  link?: string;
}

export default function FcmProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const currentUser = user;

    let isMounted = true;

    async function initFcm() {
      try {
        const token = await requestAndGetFcmToken();
        if (token && isMounted && token !== registeredTokenRef.current) {
          const cachedToken = localStorage.getItem("registeredFcmToken");
          const cachedUserId = localStorage.getItem("registeredFcmUserId");

          // Register with backend if token or user changed
          if (cachedToken !== token || cachedUserId !== String(currentUser.id)) {
            await notificationApi.registerDevice({
              fcmToken: token,
              deviceType: "WEB",
              deviceName: "RealAdmin Web",
              appVersion: "0.1.0",
            });
            localStorage.setItem("registeredFcmToken", token);
            localStorage.setItem("registeredFcmUserId", String(currentUser.id));
          }
          registeredTokenRef.current = token;
        }
      } catch (err) {
        console.error("Error initializing FCM in FcmProvider:", err);
      }
    }

    initFcm();

    // Listen to foreground FCM messages
    const unsubscribe = onFcmMessage((payload: MessagePayload) => {
      const title = payload.notification?.title || payload.data?.title || "New Notification";
      const body = payload.notification?.body || payload.data?.body || "";
      const link = payload.data?.link || payload.data?.url;

      // Show floating toast in RealAdmin UI
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, body, link }]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);

      // If page is hidden or unfocused, trigger browser notification
      if (typeof document !== "undefined" && document.hidden && "Notification" in window && Notification.permission === "granted") {
        try {
          const notification = new Notification(title, {
            body,
            icon: "/icon.png",
          });
          if (link) {
            notification.onclick = () => {
              window.focus();
              window.location.href = link;
            };
          }
        } catch (e) {
          console.error("Error showing browser notification:", e);
        }
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, user]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      {/* Floating In-App Notifications Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white rounded-xl shadow-lg border border-emerald-100 p-4 flex items-start gap-3 transform transition-all duration-300 animate-slide-in-right"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <BellIcon className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{toast.title}</h4>
                {toast.body && <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toast.body}</p>}
                {toast.link && (
                  <a
                    href={toast.link}
                    className="inline-block mt-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 underline"
                  >
                    View Details →
                  </a>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
