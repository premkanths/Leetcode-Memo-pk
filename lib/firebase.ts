import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, GithubAuthProvider, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase client configuration. These values are public by design (they identify
 * the project; access is enforced by Firestore rules and Auth), so they use the
 * NEXT_PUBLIC_ prefix and are read inline so Next.js can inline them at build time.
 */
function getAuthDomain(): string | undefined {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return window.location.host;
  }
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
}

export function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: getAuthDomain(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

const REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "appId"] as const;

/** True when the minimum set of Firebase env vars is present. */
export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return REQUIRED_KEYS.every((key) => Boolean(config[key]));
}

let cachedApp: FirebaseApp | undefined;

/**
 * Lazily initialises the app so that importing this module during `next build`
 * (before env vars are available) never throws.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and fill in the NEXT_PUBLIC_FIREBASE_* values.",
    );
  }
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
  }
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

/** GitHub OAuth provider. `read:user` is requested so the profile (login, avatar) is available. */
export function createGithubProvider(): GithubAuthProvider {
  const provider = new GithubAuthProvider();
  provider.addScope("read:user");
  return provider;
}

/** Google OAuth provider. */
export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

