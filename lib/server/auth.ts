import type { NextRequest } from "next/server";
import { HttpError } from "./errors";

/**
 * Verifies a Firebase ID token without the Admin SDK (no service-account key needed).
 * Firebase's Identity Toolkit `accounts:lookup` endpoint validates the token and
 * returns the owning user, which lets us trust the `localId` as the Firebase uid.
 */
const IDENTITY_TOOLKIT_LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";

export interface AuthenticatedUser {
  uid: string;
}

export async function verifyRequestUser(request: NextRequest): Promise<AuthenticatedUser> {
  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) {
    throw new HttpError(401, "Sign in is required.");
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, "Server is missing NEXT_PUBLIC_FIREBASE_API_KEY.");
  }

  let response: Response;
  try {
    response = await fetch(`${IDENTITY_TOOLKIT_LOOKUP_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: match[1] }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    throw new HttpError(503, "Could not verify your session. Please try again.", { cause: error });
  }

  if (response.status >= 500) {
    throw new HttpError(503, "Session verification is temporarily unavailable. Please try again.");
  }
  if (!response.ok) {
    throw new HttpError(401, "Your session has expired. Please sign in again.");
  }

  const body = (await response.json()) as { users?: { localId?: string }[] };
  const uid = body.users?.[0]?.localId;
  if (!uid) {
    throw new HttpError(401, "Your session is invalid. Please sign in again.");
  }

  return { uid };
}
