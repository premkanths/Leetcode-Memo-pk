import { describe, expect, it } from "vitest";
import {
  collectTopics,
  DEFAULT_FILTERS,
  filterProblems,
  groupByTopic,
  hasActiveFilters,
  sortProblems,
} from "@/lib/problem-filters";
import type { SolvedProblem } from "@/lib/types";

const make = (slug: string, extra: Partial<SolvedProblem> = {}): SolvedProblem => ({
  titleSlug: slug,
  title: slug.replace(/-/g, " "),
  difficulty: "Easy",
  topics: [],
  leetcodeUrl: `https://leetcode.com/problems/${slug}`,
  memoryStatus: "Needs Review",
  notes: "",
  lastRevisedAt: null,
  solvedAt: null,
  source: "sync",
  pinned: false,
  ...extra,
});

const PROBLEMS: SolvedProblem[] = [
  make("two-sum", {
    difficulty: "Easy",
    topics: ["Array", "Hash Table"],
    memoryStatus: "Mastered",
    solvedAt: new Date("2026-01-03"),
    lastRevisedAt: new Date("2026-05-01"),
  }),
  make("coin-change", {
    difficulty: "Medium",
    topics: ["Dynamic Programming"],
    memoryStatus: "Confused",
    solvedAt: new Date("2026-01-05"),
    lastRevisedAt: new Date("2026-02-01"),
    notes: "bottom-up table over amounts",
  }),
  make("merge-intervals", {
    difficulty: "Medium",
    topics: ["Array", "Sorting"],
    memoryStatus: "Needs Review",
    solvedAt: new Date("2026-01-01"),
    lastRevisedAt: null,
  }),
];

describe("filterProblems", () => {
  it("returns everything with default filters, newest solve first", () => {
    const result = filterProblems(PROBLEMS, DEFAULT_FILTERS);
    expect(result.map((p) => p.titleSlug)).toEqual(["coin-change", "two-sum", "merge-intervals"]);
  });

  it("combines difficulty, status and topic filters", () => {
    const result = filterProblems(PROBLEMS, {
      ...DEFAULT_FILTERS,
      difficulty: "Medium",
      status: "Needs Review",
      topic: "Array",
    });
    expect(result.map((p) => p.titleSlug)).toEqual(["merge-intervals"]);
  });

  it("searches titles, topics, slugs and notes case-insensitively", () => {
    expect(filterProblems(PROBLEMS, { ...DEFAULT_FILTERS, query: "TABLE" }).map((p) => p.titleSlug)).toEqual([
      "coin-change",
      "two-sum",
    ]);
    expect(filterProblems(PROBLEMS, { ...DEFAULT_FILTERS, query: "amounts" }).map((p) => p.titleSlug)).toEqual([
      "coin-change",
    ]);
    expect(filterProblems(PROBLEMS, { ...DEFAULT_FILTERS, query: "hash" }).map((p) => p.titleSlug)).toEqual([
      "two-sum",
    ]);
    expect(filterProblems(PROBLEMS, { ...DEFAULT_FILTERS, query: "  " })).toHaveLength(3);
  });
});

describe("sortProblems", () => {
  it("sorts least recently revised first, never-revised first", () => {
    const sorted = sortProblems(PROBLEMS, "review").map((p) => p.titleSlug);
    expect(sorted).toEqual(["merge-intervals", "coin-change", "two-sum"]);
  });

  it("sorts by difficulty then title", () => {
    const sorted = sortProblems(PROBLEMS, "difficulty").map((p) => p.titleSlug);
    expect(sorted).toEqual(["two-sum", "coin-change", "merge-intervals"]);
  });
});

describe("grouping and topics", () => {
  it("counts topics, most common first", () => {
    const topics = collectTopics(PROBLEMS);
    expect(topics[0]).toEqual({ topic: "Array", count: 2 });
    expect(topics.map((t) => t.topic)).toContain("Sorting");
  });

  it("places a multi-topic problem in every matching folder", () => {
    const folders = groupByTopic(PROBLEMS);
    const array = folders.find((f) => f.topic === "Array");
    expect(array?.problems.map((p) => p.titleSlug).sort()).toEqual(["merge-intervals", "two-sum"]);
    expect(array?.mastered).toBe(1);
  });
});

describe("hasActiveFilters", () => {
  it("is false for defaults and true once anything changes", () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, sort: "title" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: "x" })).toBe(true);
  });
});
