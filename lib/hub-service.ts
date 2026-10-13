/**
 * Firestore data access for the signed-in user. Every path is scoped to
 * `users/{uid}/...`, which the security rules restrict to the owner.
 */
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore";
import { getDb } from "./firebase";
import {
  DEFAULT_MEMORY_STATUS,
  isDifficulty,
  isMemoryStatus,
  type DailyRecommendations,
  type LeetCodeProblem,
  type LeetCodeProfileSnapshot,
  type MemoryStatus,
  type ProblemSource,
  type RecommendationResponse,
  type SolvedProblem,
  type UpsertResult,
  type UserProfile,
} from "./types";

/** Firestore allows at most 500 writes per batch; stay safely below it. */
const BATCH_LIMIT = 400;

export function userDoc(uid: string): DocumentReference {
  return doc(getDb(), "users", uid);
}

export function problemsCollection(uid: string) {
  return collection(getDb(), "users", uid, "solvedProblems");
}

function problemDoc(uid: string, titleSlug: string): DocumentReference {
  return doc(problemsCollection(uid), titleSlug);
}

export function dailyDoc(uid: string, dateKey: string): DocumentReference {
  return doc(getDb(), "users", uid, "dailyRecommendations", dateKey);
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function parseUserProfile(data: DocumentData | undefined): UserProfile | null {
  if (!data) return null;
  return {
    githubUsername: typeof data.githubUsername === "string" ? data.githubUsername : "",
    leetcodeUsername: typeof data.leetcodeUsername === "string" ? data.leetcodeUsername : "",
    displayName: typeof data.displayName === "string" ? data.displayName : undefined,
    preferredLanguage: typeof data.preferredLanguage === "string" ? data.preferredLanguage : "java",
    totalSolved: toCount(data.totalSolved),
    easySolved: toCount(data.easySolved),
    mediumSolved: toCount(data.mediumSolved),
    hardSolved: toCount(data.hardSolved),
    lastSyncedAt: toDate(data.lastSyncedAt),
  };
}

export function parseSolvedProblem(id: string, data: DocumentData): SolvedProblem | null {
  if (!isDifficulty(data.difficulty)) return null;
  const memoryStatus: MemoryStatus = isMemoryStatus(data.memoryStatus)
    ? data.memoryStatus
    : DEFAULT_MEMORY_STATUS;

  return {
    titleSlug: id,
    title: typeof data.title === "string" ? data.title : id,
    difficulty: data.difficulty,
    topics: toStringArray(data.topics),
    leetcodeUrl: typeof data.leetcodeUrl === "string" ? data.leetcodeUrl : `https://leetcode.com/problems/${id}`,
    memoryStatus,
    notes: typeof data.notes === "string" ? data.notes : "",
    code: typeof data.code === "string" ? data.code : undefined,
    codeLanguage: typeof data.codeLanguage === "string" ? data.codeLanguage : undefined,
    runtime: typeof data.runtime === "string" ? data.runtime : undefined,
    memoryUsage: typeof data.memoryUsage === "string" ? data.memoryUsage : undefined,
    lastRevisedAt: toDate(data.lastRevisedAt),
    solvedAt: toDate(data.solvedAt),
    source: data.source === "manual" ? "manual" : "sync",
    pinned: data.pinned === true,
  };
}

export function parseDailyRecommendations(
  dateKey: string,
  data: DocumentData | undefined,
): DailyRecommendations | null {
  if (!data || !Array.isArray(data.items)) return null;
  return {
    dateKey,
    summary: typeof data.summary === "string" ? data.summary : "",
    items: data.items as DailyRecommendations["items"],
    model: typeof data.model === "string" ? data.model : "",
    generatedAt: toDate(data.generatedAt),
  };
}

/** Creates `users/{uid}` on first sign-in, or refreshes the GitHub handle afterwards. */
export async function ensureUserDocument(user: User, githubUsername: string | null): Promise<void> {
  const ref = userDoc(user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const handle = githubUsername ?? "";
    await setDoc(ref, {
      githubUsername: handle,
      leetcodeUsername: handle,
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      lastSyncedAt: null,
      createdAt: serverTimestamp(),
    });
    return;
  }

  const current = snapshot.data().githubUsername;
  if (githubUsername && current !== githubUsername) {
    await updateDoc(ref, { githubUsername });
  }
}

export async function setLeetCodeUsername(uid: string, leetcodeUsername: string): Promise<void> {
  await updateDoc(userDoc(uid), { leetcodeUsername });
}

export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; leetcodeUsername?: string; preferredLanguage?: string },
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.leetcodeUsername !== undefined) updateData.leetcodeUsername = data.leetcodeUsername;
  if (data.preferredLanguage !== undefined) updateData.preferredLanguage = data.preferredLanguage;
  await updateDoc(userDoc(uid), updateData);
}

/**
 * Upserts problems without clobbering learner-owned fields. New problems get
 * defaults; existing problems only have their LeetCode metadata refreshed, so
 * memoryStatus, notes and lastRevisedAt survive every sync.
 */
export async function upsertProblems(
  uid: string,
  problems: LeetCodeProblem[],
  source: ProblemSource,
): Promise<UpsertResult> {
  if (problems.length === 0) return { added: 0, existing: 0 };

  const existingSnapshot = await getDocs(problemsCollection(uid));
  const existingIds = new Set(existingSnapshot.docs.map((snapshot) => snapshot.id));

  let added = 0;
  let existing = 0;

  for (let offset = 0; offset < problems.length; offset += BATCH_LIMIT) {
    const batch = writeBatch(getDb());

    for (const problem of problems.slice(offset, offset + BATCH_LIMIT)) {
      const ref = problemDoc(uid, problem.titleSlug);
      const metadata: Record<string, unknown> = {
        title: problem.title,
        titleSlug: problem.titleSlug,
        difficulty: problem.difficulty,
        topics: problem.topics,
        leetcodeUrl: problem.leetcodeUrl,
      };
      if (problem.code) metadata.code = problem.code;
      if (problem.codeLanguage) metadata.codeLanguage = problem.codeLanguage;
      if (problem.runtime) metadata.runtime = problem.runtime;
      if (problem.memoryUsage) metadata.memoryUsage = problem.memoryUsage;

      if (existingIds.has(problem.titleSlug)) {
        batch.set(ref, metadata, { merge: true });
        existing += 1;
        continue;
      }

      const solvedAt = problem.solvedAt ? Timestamp.fromDate(new Date(problem.solvedAt)) : null;
      batch.set(ref, {
        ...metadata,
        memoryStatus: DEFAULT_MEMORY_STATUS,
        notes: "",
        pinned: false,
        solvedAt,
        lastRevisedAt: solvedAt ?? serverTimestamp(),
        source,
      });
      added += 1;
    }

    await batch.commit();
  }

  return { added, existing };
}

/** Writes the profile totals and sync timestamp, then upserts the recent problems. */
export async function applySyncSnapshot(
  uid: string,
  snapshot: LeetCodeProfileSnapshot,
): Promise<UpsertResult> {
  await setDoc(
    userDoc(uid),
    {
      leetcodeUsername: snapshot.username,
      totalSolved: snapshot.totalSolved,
      easySolved: snapshot.easySolved,
      mediumSolved: snapshot.mediumSolved,
      hardSolved: snapshot.hardSolved,
      lastSyncedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return upsertProblems(uid, snapshot.recentProblems, "sync");
}

export async function setMemoryStatus(uid: string, titleSlug: string, status: MemoryStatus): Promise<void> {
  await updateDoc(problemDoc(uid, titleSlug), {
    memoryStatus: status,
    lastRevisedAt: serverTimestamp(),
  });
}

export async function saveNotes(uid: string, titleSlug: string, notes: string): Promise<void> {
  await updateDoc(problemDoc(uid, titleSlug), {
    notes,
    lastRevisedAt: serverTimestamp(),
  });
}

export async function saveDailyRecommendations(
  uid: string,
  response: RecommendationResponse,
): Promise<void> {
  await setDoc(dailyDoc(uid, response.dateKey), {
    summary: response.summary,
    items: response.items,
    model: response.model,
    generatedAt: serverTimestamp(),
  });
}

export async function setProblemPinned(uid: string, titleSlug: string, pinned: boolean): Promise<void> {
  await updateDoc(problemDoc(uid, titleSlug), { pinned });
}

export async function saveProblemCode(
  uid: string,
  titleSlug: string,
  code: string,
  codeLanguage?: string,
): Promise<void> {
  const data: Record<string, unknown> = {
    code,
    lastRevisedAt: serverTimestamp(),
  };
  if (codeLanguage) data.codeLanguage = codeLanguage;
  await updateDoc(problemDoc(uid, titleSlug), data);
}

