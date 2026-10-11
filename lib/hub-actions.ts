/**
 * High-level user actions that combine API calls with Firestore writes.
 * Components call these instead of talking to fetch/Firestore directly.
 */
import type { User } from "firebase/auth";
import { apiRequest } from "./api-client";
import { applySyncSnapshot, saveDailyRecommendations, upsertProblems } from "./hub-service";
import { isValidLeetCodeUsername, parseProblemSlug } from "./leetcode-links";
import { buildRecommendationRequest, getLocalDateKey } from "./recommendations";
import type {
  DailyRecommendations,
  LeetCodeProblem,
  LeetCodeProfileSnapshot,
  RecommendationResponse,
  SolvedProblem,
  UpsertResult,
} from "./types";

export interface SyncOutcome extends UpsertResult {
  username: string;
  totalSolved: number;
}

/** Fetches the public LeetCode profile and merges it into the user's hub. */
export async function syncLeetCodeProgress(user: User, leetcodeUsername: string): Promise<SyncOutcome> {
  const username = leetcodeUsername.trim();
  if (!isValidLeetCodeUsername(username)) {
    throw new Error("Enter a valid LeetCode username (letters, numbers, hyphens or underscores).");
  }

  const snapshot = await apiRequest<LeetCodeProfileSnapshot>(
    user,
    `/api/leetcode?username=${encodeURIComponent(username)}`,
  );
  const result = await applySyncSnapshot(user.uid, snapshot);

  return {
    username: snapshot.username,
    totalSolved: snapshot.totalSolved,
    ...result,
  };
}

/** Adds a single problem (by URL or slug) that LeetCode's recent-submissions list no longer shows. */
export async function addProblemByInput(user: User, input: string): Promise<LeetCodeProblem> {
  const slug = parseProblemSlug(input);
  if (!slug) {
    throw new Error("Enter a LeetCode problem URL (leetcode.com/problems/...) or a slug like two-sum.");
  }

  const problem = await apiRequest<LeetCodeProblem>(
    user,
    `/api/leetcode?problem=${encodeURIComponent(slug)}`,
  );
  await upsertProblems(user.uid, [problem], "manual");
  return problem;
}

/** Generates today's AI coaching plan from the learner's hub and caches it in Firestore. */
export async function generateDailyRecommendations(
  user: User,
  problems: SolvedProblem[],
  dateKey: string = getLocalDateKey(),
): Promise<DailyRecommendations> {
  const body = buildRecommendationRequest(problems, dateKey);
  const response = await apiRequest<RecommendationResponse>(user, "/api/recommendations", {
    method: "POST",
    body: JSON.stringify(body),
  });

  await saveDailyRecommendations(user.uid, response);

  return {
    dateKey: response.dateKey,
    summary: response.summary,
    items: response.items,
    model: response.model,
    generatedAt: new Date(response.generatedAt),
  };
}
