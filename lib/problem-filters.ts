/** Pure filter, sort and grouping helpers for the problem hub. */
import type { Difficulty, MemoryStatus, SolvedProblem } from "./types";

export type SortMode = "recent" | "review" | "title" | "difficulty";
export type ViewMode = "files" | "cards" | "folders" | "list";

export interface ProblemFilters {
  query: string;
  topic: string;
  difficulty: Difficulty | "all";
  status: MemoryStatus | "all";
  sort: SortMode;
}

export const DEFAULT_FILTERS: ProblemFilters = {
  query: "",
  topic: "all",
  difficulty: "all",
  status: "all",
  sort: "recent",
};

export const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "recent", label: "Recently solved" },
  { value: "review", label: "Least recently revised" },
  { value: "difficulty", label: "Difficulty" },
  { value: "title", label: "Title A–Z" },
];

const DIFFICULTY_RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

export function hasActiveFilters(filters: ProblemFilters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.topic !== "all" ||
    filters.difficulty !== "all" ||
    filters.status !== "all" ||
    filters.sort !== "recent"
  );
}

export function sortProblems(problems: SolvedProblem[], sort: SortMode): SolvedProblem[] {
  const copy = [...problems];
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => (b.solvedAt?.getTime() ?? 0) - (a.solvedAt?.getTime() ?? 0));
    case "review":
      // Never-revised problems first, then the ones that have gone longest without review.
      return copy.sort((a, b) => (a.lastRevisedAt?.getTime() ?? 0) - (b.lastRevisedAt?.getTime() ?? 0));
    case "difficulty":
      return copy.sort(
        (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || a.title.localeCompare(b.title),
      );
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export function filterProblems(problems: SolvedProblem[], filters: ProblemFilters): SolvedProblem[] {
  const query = filters.query.trim().toLowerCase();

  const matching = problems.filter((problem) => {
    if (filters.difficulty !== "all" && problem.difficulty !== filters.difficulty) return false;
    if (filters.status !== "all" && problem.memoryStatus !== filters.status) return false;
    if (filters.topic !== "all" && !problem.topics.includes(filters.topic)) return false;
    if (query) {
      const haystack = `${problem.title} ${problem.titleSlug} ${problem.topics.join(" ")} ${problem.notes}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return sortProblems(matching, filters.sort);
}

export interface TopicCount {
  topic: string;
  count: number;
}

/** Every topic present in the hub, most common first. */
export function collectTopics(problems: SolvedProblem[]): TopicCount[] {
  const counts = new Map<string, number>();
  for (const problem of problems) {
    for (const topic of problem.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

export interface TopicFolder {
  topic: string;
  problems: SolvedProblem[];
  mastered: number;
}

/** Topic "folders". A problem with several topics appears in each of its folders. */
export function groupByTopic(problems: SolvedProblem[]): TopicFolder[] {
  const folders = new Map<string, TopicFolder>();
  for (const problem of problems) {
    for (const topic of problem.topics) {
      const folder = folders.get(topic) ?? { topic, problems: [], mastered: 0 };
      folder.problems.push(problem);
      if (problem.memoryStatus === "Mastered") folder.mastered += 1;
      folders.set(topic, folder);
    }
  }
  return [...folders.values()].sort(
    (a, b) => b.problems.length - a.problems.length || a.topic.localeCompare(b.topic),
  );
}
