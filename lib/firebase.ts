"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging, MessagePayload } from "firebase/messaging";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken as getAppCheckTokenFn,
  AppCheck,
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let messagingInstance: Messaging | undefined;
let appCheckInstance: AppCheck | undefined;

export function getFirebaseApp(): FirebaseApp | undefined {
  if (typeof window === "undefined") return undefined;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

/**
 * Initialize Firebase App Check with ReCaptchaV3.
 * Must be called after getFirebaseApp().
 */
function ensureAppCheck(): AppCheck | undefined {
  if (typeof window === "undefined") return undefined;
  if (appCheckInstance) return appCheckInstance;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return undefined;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfBkIUtAAAAAJmOhZvzzS1AMFlWE6wepC8uREGV";
  if (!siteKey) {
    console.warn("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set; App Check will not be initialized.");
    return undefined;
  }

  try {
    appCheckInstance = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    return appCheckInstance;
  } catch (err) {
    console.error("Failed to initialize Firebase App Check:", err);
    return undefined;
  }
}

/**
 * Get a fresh Firebase App Check token.
 * Returns the token string, or empty string if unavailable.
 */
export async function getAppCheckToken(): Promise<string> {
  try {
    const ac = ensureAppCheck();
    if (!ac) return "";
    const result = await getAppCheckTokenFn(ac, /* forceRefresh */ false);
    return result.token;
  } catch (err) {
    console.error("Failed to get App Check token:", err);
    return "";
  }
}

export function getFirebaseMessaging(): Messaging | undefined {
  if (typeof window === "undefined") return undefined;
  if (!messagingInstance) {
    const firebaseApp = getFirebaseApp();
    if (firebaseApp && "serviceWorker" in navigator) {
      try {
        messagingInstance = getMessaging(firebaseApp);
      } catch (err) {
        console.error("Failed to initialize Firebase Messaging:", err);
      }
    }
  }
  return messagingInstance;
}

export async function requestAndGetFcmToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied or dismissed.");
      return null;
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    // Ensure service worker is registered with dynamic query params so it uses pure env credentials
    const swParams = new URLSearchParams({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    });
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swParams.toString()}`);

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;
    const currentToken = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey,
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.warn("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.error("Error retrieving FCM token:", err);
    return null;
  }
}

export function onFcmMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, callback);
    return unsubscribe;
  } catch (err) {
    console.error("Error subscribing to FCM messages:", err);
    return null;
  }
}

