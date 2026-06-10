"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";

export default function GoogleAdBanner() {
  const { user, isAuthenticated } = useAuth();
  const adRef = useRef<boolean>(false);

  // Do not render ad if user is premium
  if (user?.isPremiumActive) {
    return null;
  }

  useEffect(() => {
    // Only push to adsbygoogle once
    if (adRef.current) return;
    adRef.current = true;
    
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-4 overflow-hidden rounded min-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: "block", minWidth: "250px", width: "100%", height: "100px" }}
        data-ad-client="ca-pub-0000000000000000" // Replace with real Publisher ID
        data-ad-slot="1234567890" // Replace with real Ad Slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
