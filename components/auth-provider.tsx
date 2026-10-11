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
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { ensureUserDocument } from "@/lib/hub-service";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGithub: () => Promise<void>;
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

  useEffect(() => {
    if (!configured) return;
    const auth = getFirebaseAuth();

    // Completes a redirect-based sign-in (used when the popup was blocked).
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) await ensureUserDocument(result.user, resolveHandleFromCredential(result));
      })
      .catch((error: unknown) => console.error("Redirect sign-in failed", error));

    return onAuthStateChanged(auth, (current) => {
      setUser(current);
      setLoading(false);
    });
  }, [configured]);

  const signInWithGithub = useCallback(async () => {
    const auth = getFirebaseAuth();
    try {
      const result = await signInWithPopup(auth, createGithubProvider());
      await ensureUserDocument(result.user, resolveHandleFromCredential(result));
    } catch (error) {
      if (hasErrorCode(error, "auth/popup-blocked")) {
        await signInWithRedirect(auth, createGithubProvider());
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
    () => ({ user, loading, configured, signInWithGithub, signOut }),
    [user, loading, configured, signInWithGithub, signOut],
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
