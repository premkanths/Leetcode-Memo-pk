/** Pure helpers for due reviews, streaks, weak topics, and notes export. */
import { getLocalDateKey } from "./recommendations";
import type { SolvedProblem, TopicStat } from "./types";

const DAY_MS = 86_400_000;
const REVIEW_DUE_AFTER_DAYS = 3;
const MASTERED_DUE_AFTER_DAYS = 14;

export type HubScope = "all" | "due" | "pinned";

export function isProblemDue(problem: SolvedProblem, now: Date = new Date()): boolean {
  if (problem.memoryStatus === "Confused") return true;

  const revisedAt = problem.lastRevisedAt?.getTime() ?? 0;
  const ageMs = now.getTime() - revisedAt;

  if (problem.memoryStatus === "Needs Review") {
    return ageMs >= REVIEW_DUE_AFTER_DAYS * DAY_MS;
  }

  return ageMs >= MASTERED_DUE_AFTER_DAYS * DAY_MS;
}

export function getDueProblems(problems: SolvedProblem[], now: Date = new Date()): SolvedProblem[] {
  const rank: Record<SolvedProblem["memoryStatus"], number> = {
    Confused: 0,
    "Needs Review": 1,
    Mastered: 2,
  };

  return problems
    .filter((problem) => isProblemDue(problem, now))
    .sort((a, b) => {
      const statusDiff = rank[a.memoryStatus] - rank[b.memoryStatus];
      if (statusDiff !== 0) return statusDiff;
      return (a.lastRevisedAt?.getTime() ?? 0) - (b.lastRevisedAt?.getTime() ?? 0);
    });
}

export function getPinnedProblems(problems: SolvedProblem[]): SolvedProblem[] {
  return problems.filter((problem) => problem.pinned);
}

function previousDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getLocalDateKey(date);
}

/** Consecutive calendar days with a solve or revision, GitHub-style (yesterday still counts). */
export function getRevisionStreak(problems: SolvedProblem[], now: Date = new Date()): number {
  const days = new Set<string>();
  for (const problem of problems) {
    if (problem.lastRevisedAt) days.add(getLocalDateKey(problem.lastRevisedAt));
    if (problem.solvedAt) days.add(getLocalDateKey(problem.solvedAt));
  }

  if (days.size === 0) return 0;

  let cursor = getLocalDateKey(now);
  if (!days.has(cursor)) {
    cursor = previousDateKey(cursor);
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }
  return streak;
}

export function getWeakTopics(problems: SolvedProblem[], limit = 3): TopicStat[] {
  const topicMap = new Map<string, TopicStat>();

  for (const problem of problems) {
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

  return [...topicMap.values()]
    .filter((stat) => stat.solved >= 2 && stat.confused + stat.needsReview > 0)
    .sort((a, b) => {
      const weakA = a.confused + a.needsReview;
      const weakB = b.confused + b.needsReview;
      if (weakB !== weakA) return weakB - weakA;
      const ratioA = weakA / a.solved;
      const ratioB = weakB / b.solved;
      return ratioB - ratioA || a.topic.localeCompare(b.topic);
    })
    .slice(0, limit);
}

export function buildNotesMarkdown(problems: SolvedProblem[]): string {
  const dated = new Date().toISOString().slice(0, 10);
  const withNotes = [...problems]
    .filter((problem) => problem.notes.trim().length > 0)
    .sort((a, b) => a.title.localeCompare(b.title));

  const lines = [
    `# LeetCode Memory Hub notes`,
    ``,
    `Exported ${dated} · ${withNotes.length} problem${withNotes.length === 1 ? "" : "s"} with notes.`,
    ``,
  ];

  if (withNotes.length === 0) {
    lines.push("_No notes saved yet._");
    return lines.join("\n");
  }

  for (const problem of withNotes) {
    lines.push(`## ${problem.title}`);
    lines.push(``);
    lines.push(`- Difficulty: ${problem.difficulty}`);
    lines.push(`- Memory: ${problem.memoryStatus}`);
    if (problem.topics.length > 0) lines.push(`- Topics: ${problem.topics.join(", ")}`);
    lines.push(`- Link: ${problem.leetcodeUrl}`);
    lines.push(``);
    lines.push(problem.notes.trim());
    lines.push(``);
  }

  return lines.join("\n");
}

export function downloadNotesMarkdown(problems: SolvedProblem[]): void {
  const markdown = buildNotesMarkdown(problems);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `leetcode-memory-notes-${stamp}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
