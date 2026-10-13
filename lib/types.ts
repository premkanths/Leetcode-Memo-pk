/**
 * Shared domain types. This module must stay free of server-only and
 * browser-only imports so it can be used by both the API routes and the UI.
 */

export const MEMORY_STATUSES = ["Mastered", "Needs Review", "Confused"] as const;
export type MemoryStatus = (typeof MEMORY_STATUSES)[number];

export const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DEFAULT_MEMORY_STATUS: MemoryStatus = "Needs Review";
export const MAX_NOTES_LENGTH = 10_000;

export type ProblemSource = "sync" | "manual";

export function isMemoryStatus(value: unknown): value is MemoryStatus {
  return typeof value === "string" && (MEMORY_STATUSES as readonly string[]).includes(value);
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

/** `users/{uid}/solvedProblems/{problemSlug}` */
export interface SolvedProblem {
  /** Firestore document id, identical to `titleSlug`. */
  titleSlug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  leetcodeUrl: string;
  memoryStatus: MemoryStatus;
  notes: string;
  code?: string;
  codeLanguage?: string;
  runtime?: string;
  memoryUsage?: string;
  lastRevisedAt: Date | null;
  /** When the problem was solved on LeetCode (null for manually added problems). */
  solvedAt: Date | null;
  source: ProblemSource;
  pinned: boolean;
}

/** `users/{uid}` */
export interface UserProfile {
  githubUsername: string;
  leetcodeUsername: string;
  displayName?: string;
  preferredLanguage?: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  lastSyncedAt: Date | null;
}

/** Problem metadata as returned by `GET /api/leetcode`. */
export interface LeetCodeProblem {
  title: string;
  titleSlug: string;
  difficulty: Difficulty;
  topics: string[];
  leetcodeUrl: string;
  code?: string;
  codeLanguage?: string;
  runtime?: string;
  memoryUsage?: string;
  /** ISO-8601 timestamp of the accepted submission, or null for manual lookups. */
  solvedAt: string | null;
}

/** Response shape of `GET /api/leetcode?username=...`. */
export interface LeetCodeProfileSnapshot {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  /** Recent accepted submissions (LeetCode caps this list at ~20 items). */
  recentProblems: LeetCodeProblem[];
  fetchedAt: string;
}

export interface UpsertResult {
  added: number;
  existing: number;
}

export type RecommendationType = "concept" | "problem";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  topic: string;
  reason: string;
  difficulty: Difficulty | null;
  url: string;
  titleSlug: string | null;
}

/** Response shape of `POST /api/recommendations`. */
export interface RecommendationResponse {
  dateKey: string;
  summary: string;
  items: Recommendation[];
  model: string;
  generatedAt: string;
}

/** `users/{uid}/dailyRecommendations/{dateKey}` */
export interface DailyRecommendations extends Omit<RecommendationResponse, "generatedAt"> {
  generatedAt: Date | null;
}

export interface TopicStat {
  topic: string;
  solved: number;
  mastered: number;
  needsReview: number;
  confused: number;
}

export interface ProblemDigest {
  title: string;
  titleSlug: string;
  difficulty: Difficulty;
  topics: string[];
  memoryStatus: MemoryStatus;
}

/** Compact, privacy-light learner digest sent to `POST /api/recommendations`. */
export interface RecommendationRequest {
  dateKey: string;
  totalTracked: number;
  difficulty: { easy: number; medium: number; hard: number };
  topics: TopicStat[];
  recentProblems: ProblemDigest[];
  weakProblems: ProblemDigest[];
  solvedSlugs: string[];
}
