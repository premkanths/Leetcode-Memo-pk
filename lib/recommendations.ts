/**
 * Builds the learner digest sent to the AI coach and validates it on the server.
 * Pure functions only, so this file is shared by the client and the API route.
 */
import type {
  Difficulty,
  MemoryStatus,
  ProblemDigest,
  RecommendationRequest,
  SolvedProblem,
  TopicStat,
} from "./types";
import { isDifficulty, isMemoryStatus } from "./types";
import { isValidTitleSlug } from "./leetcode-links";

const MAX_TOPICS = 40;
const MAX_RECENT = 30;
const MAX_WEAK = 40;
const MAX_SOLVED_SLUGS = 2000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar date as `YYYY-MM-DD`, used as the daily cache key. */
export function getLocalDateKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function bySolvedDesc(a: SolvedProblem, b: SolvedProblem): number {
  return (b.solvedAt?.getTime() ?? 0) - (a.solvedAt?.getTime() ?? 0);
}

function toDigest(problem: SolvedProblem): ProblemDigest {
  return {
    title: problem.title,
    titleSlug: problem.titleSlug,
    difficulty: problem.difficulty,
    topics: problem.topics.slice(0, 5),
    memoryStatus: problem.memoryStatus,
  };
}

export function buildRecommendationRequest(
  problems: SolvedProblem[],
  dateKey: string,
): RecommendationRequest {
  const topicMap = new Map<string, TopicStat>();
  const difficulty = { easy: 0, medium: 0, hard: 0 };

  for (const problem of problems) {
    if (problem.difficulty === "Easy") difficulty.easy += 1;
    if (problem.difficulty === "Medium") difficulty.medium += 1;
    if (problem.difficulty === "Hard") difficulty.hard += 1;

    for (const topic of problem.topics) {
      const stat = topicMap.get(topic) ?? {
        topic,
        solved: 0,
        mastered: 0,
        needsReview: 0,
        confused: 0,
      };
      stat.solved += 1;
      if (problem.memoryStatus === "Mastered") stat.mastered += 1;
      if (problem.memoryStatus === "Needs Review") stat.needsReview += 1;
      if (problem.memoryStatus === "Confused") stat.confused += 1;
      topicMap.set(topic, stat);
    }
  }

  const sorted = [...problems].sort(bySolvedDesc);

  return {
    dateKey,
    totalTracked: problems.length,
    difficulty,
    topics: [...topicMap.values()].sort((a, b) => b.solved - a.solved).slice(0, MAX_TOPICS),
    recentProblems: sorted.slice(0, MAX_RECENT).map(toDigest),
    weakProblems: sorted
      .filter((problem) => problem.memoryStatus !== "Mastered")
      .slice(0, MAX_WEAK)
      .map(toDigest),
    solvedSlugs: problems.slice(0, MAX_SOLVED_SLUGS).map((problem) => problem.titleSlug),
  };
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length <= max ? value : null;
}

function readCount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function readArray<T>(
  value: unknown,
  max: number,
  mapItem: (item: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const out: T[] = [];
  for (const item of value) {
    const mapped = mapItem(item);
    if (mapped === null) return null;
    out.push(mapped);
  }
  return out;
}

function readDigest(value: unknown): ProblemDigest | null {
  if (!isRecord(value)) return null;
  const title = readString(value.title, 300);
  const titleSlug = readString(value.titleSlug, 120);
  const topics = readArray(value.topics, 10, (t) => readString(t, 80));
  if (title === null || titleSlug === null || topics === null) return null;
  if (!isDifficulty(value.difficulty) || !isMemoryStatus(value.memoryStatus)) return null;
  return {
    title,
    titleSlug,
    difficulty: value.difficulty as Difficulty,
    topics,
    memoryStatus: value.memoryStatus as MemoryStatus,
  };
}

function readTopicStat(value: unknown): TopicStat | null {
  if (!isRecord(value)) return null;
  const topic = readString(value.topic, 80);
  const solved = readCount(value.solved);
  const mastered = readCount(value.mastered);
  const needsReview = readCount(value.needsReview);
  const confused = readCount(value.confused);
  if ([topic, solved, mastered, needsReview, confused].includes(null)) return null;
  return {
    topic: topic as string,
    solved: solved as number,
    mastered: mastered as number,
    needsReview: needsReview as number,
    confused: confused as number,
  };
}

/** Validates an untrusted request body. Returns a descriptive error instead of throwing. */
export function parseRecommendationRequest(input: unknown): ParseResult<RecommendationRequest> {
  if (!isRecord(input)) return { ok: false, error: "Request body must be a JSON object." };

  const dateKey = readString(input.dateKey, 10);
  if (dateKey === null || !DATE_KEY_PATTERN.test(dateKey)) {
    return { ok: false, error: "dateKey must be formatted as YYYY-MM-DD." };
  }

  const totalTracked = readCount(input.totalTracked);
  const difficultyInput = isRecord(input.difficulty) ? input.difficulty : null;
  const easy = readCount(difficultyInput?.easy);
  const medium = readCount(difficultyInput?.medium);
  const hard = readCount(difficultyInput?.hard);
  if (totalTracked === null || easy === null || medium === null || hard === null) {
    return { ok: false, error: "Learner counts are missing or invalid." };
  }

  const topics = readArray(input.topics, MAX_TOPICS, readTopicStat);
  const recentProblems = readArray(input.recentProblems, MAX_RECENT, readDigest);
  const weakProblems = readArray(input.weakProblems, MAX_WEAK, readDigest);
  const solvedSlugs = readArray(input.solvedSlugs, MAX_SOLVED_SLUGS, (slug) => {
    const value = readString(slug, 120);
    return value !== null && isValidTitleSlug(value) ? value : null;
  });
  if (!topics || !recentProblems || !weakProblems || !solvedSlugs) {
    return { ok: false, error: "Learner digest is malformed or too large." };
  }
  if (solvedSlugs.length === 0) {
    return { ok: false, error: "Sync or add at least one problem before requesting recommendations." };
  }

  return {
    ok: true,
    value: {
      dateKey,
      totalTracked,
      difficulty: { easy, medium, hard },
      topics,
      recentProblems,
      weakProblems,
      solvedSlugs,
    },
  };
}

