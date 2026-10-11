"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAdditionalUserInfo,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
  type UserCredential,
} from "firebase/auth";
import {
  createGithubProvider,
  createGoogleProvider,
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { ensureUserDocument } from "@/lib/hub-service";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  authError: string | null;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * GitHub login is the LeetCode username by convention. Firebase exposes it as
 * `additionalUserInfo.username` on sign-in and as `reloadUserInfo.screenName` on
 * later sessions. The latter is not in the public typings, hence the cast.
 */
export function getGithubHandle(user: User): string | null {
  const info = (user as User & { reloadUserInfo?: { screenName?: string | null } }).reloadUserInfo;
  return info?.screenName || null;
}

function resolveHandleFromCredential(result: UserCredential): string | null {
  return getAdditionalUserInfo(result)?.username || getGithubHandle(result.user);
}

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    const auth = getFirebaseAuth();

    // Completes a redirect-based sign-in (used when the popup was blocked).
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          try {
            await ensureUserDocument(result.user, resolveHandleFromCredential(result));
          } catch (e) {
            console.warn("Failed to ensure user document after redirect sign-in:", e);
          }
          window.location.href = "/dashboard";
        }
      })
      .catch((error: unknown) => {
        console.error("Redirect sign-in failed", error);
        setAuthError(error instanceof Error ? error.message : "Redirect sign-in failed");
      });

    return onAuthStateChanged(auth, (current) => {
      setUser(current);
      setLoading(false);
    });
  }, [configured]);

  const signInWithGithub = useCallback(async () => {
    setAuthError(null);
    const auth = getFirebaseAuth();
    try {
      const result = await signInWithPopup(auth, createGithubProvider());
      if (result.user) {
        try {
          await ensureUserDocument(result.user, resolveHandleFromCredential(result));
        } catch (e) {
          console.warn("Failed to ensure user document:", e);
        }
        window.location.href = "/dashboard";
      }
    } catch (error) {
      if (hasErrorCode(error, "auth/popup-blocked")) {
        setAuthError("Pop-up was blocked by your browser. Please allow pop-ups for this site in your address bar to sign in.");
        return;
      }
      if (hasErrorCode(error, "auth/popup-closed-by-user") || hasErrorCode(error, "auth/cancelled-popup-request")) {
        return;
      }
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const auth = getFirebaseAuth();
    try {
      const result = await signInWithPopup(auth, createGoogleProvider());
      if (result.user) {
        try {
          await ensureUserDocument(result.user, null);
        } catch (e) {
          console.warn("Failed to ensure user document:", e);
        }
        window.location.href = "/dashboard";
      }
    } catch (error) {
      if (hasErrorCode(error, "auth/popup-blocked")) {
        setAuthError("Pop-up was blocked by your browser. Please allow pop-ups for this site in your address bar to sign in.");
        return;
      }
      if (hasErrorCode(error, "auth/popup-closed-by-user") || hasErrorCode(error, "auth/cancelled-popup-request")) {
        return;
      }
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, configured, authError, signInWithGithub, signInWithGoogle, signOut }),
    [user, loading, configured, authError, signInWithGithub, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
