import { describe, expect, it } from "vitest";
import {
  buildNotesMarkdown,
  getDueProblems,
  getPinnedProblems,
  getRevisionStreak,
  getWeakTopics,
  isProblemDue,
} from "@/lib/hub-insights";
import type { SolvedProblem } from "@/lib/types";

const now = new Date("2026-10-13T12:00:00");

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

describe("due reviews", () => {
  it("treats confused problems as always due", () => {
    const problem = make("lru-cache", {
      memoryStatus: "Confused",
      lastRevisedAt: new Date("2026-10-12"),
    });
    expect(isProblemDue(problem, now)).toBe(true);
  });

  it("marks needs-review as due after three days, mastered after fourteen", () => {
    expect(
      isProblemDue(
        make("two-sum", { memoryStatus: "Needs Review", lastRevisedAt: new Date("2026-10-11") }),
        now,
      ),
    ).toBe(false);
    expect(
      isProblemDue(
        make("three-sum", { memoryStatus: "Needs Review", lastRevisedAt: new Date("2026-10-09") }),
        now,
      ),
    ).toBe(true);
    expect(
      isProblemDue(
        make("median", { memoryStatus: "Mastered", lastRevisedAt: new Date("2026-10-01") }),
        now,
      ),
    ).toBe(false);
    expect(
      isProblemDue(
        make("trapping-rain", { memoryStatus: "Mastered", lastRevisedAt: new Date("2026-09-20") }),
        now,
      ),
    ).toBe(true);
  });

  it("orders due list confused first, then oldest revision", () => {
    const due = getDueProblems(
      [
        make("a", { memoryStatus: "Needs Review", lastRevisedAt: new Date("2026-09-01") }),
        make("b", { memoryStatus: "Confused", lastRevisedAt: new Date("2026-10-01") }),
        make("c", { memoryStatus: "Mastered", lastRevisedAt: new Date("2026-10-12") }),
      ],
      now,
    );
    expect(due.map((p) => p.titleSlug)).toEqual(["b", "a"]);
  });
});

describe("pins and weak topics", () => {
  it("returns only pinned problems", () => {
    const pinned = getPinnedProblems([make("one", { pinned: true }), make("two")]);
    expect(pinned.map((p) => p.titleSlug)).toEqual(["one"]);
  });

  it("ranks topics with the most weak problems", () => {
    const weak = getWeakTopics([
      make("a", { topics: ["Array", "Hash Table"], memoryStatus: "Confused" }),
      make("b", { topics: ["Array"], memoryStatus: "Needs Review" }),
      make("c", { topics: ["Array"], memoryStatus: "Mastered" }),
      make("d", { topics: ["DP"], memoryStatus: "Confused" }),
      make("e", { topics: ["DP"], memoryStatus: "Mastered" }),
      make("f", { topics: ["Graph"], memoryStatus: "Confused" }),
    ]);
    expect(weak[0]?.topic).toBe("Array");
    expect(weak.map((t) => t.topic)).not.toContain("Graph");
  });
});

describe("revision streak", () => {
  it("counts consecutive days ending today", () => {
    const streak = getRevisionStreak(
      [
        make("a", { lastRevisedAt: new Date("2026-10-13") }),
        make("b", { solvedAt: new Date("2026-10-12") }),
        make("c", { lastRevisedAt: new Date("2026-10-11") }),
      ],
      now,
    );
    expect(streak).toBe(3);
  });

  it("keeps a streak if yesterday was active but today is not", () => {
    const streak = getRevisionStreak([make("a", { lastRevisedAt: new Date("2026-10-12") })], now);
    expect(streak).toBe(1);
  });

  it("returns 0 when the last activity is older than yesterday", () => {
    expect(getRevisionStreak([make("a", { lastRevisedAt: new Date("2026-10-10") })], now)).toBe(0);
  });
});

describe("notes export", () => {
  it("includes only problems with notes", () => {
    const markdown = buildNotesMarkdown([
      make("two-sum", { title: "Two Sum", notes: "hash map complement", difficulty: "Easy" }),
      make("empty"),
    ]);
    expect(markdown).toContain("## Two Sum");
    expect(markdown).toContain("hash map complement");
    expect(markdown).toContain("1 problem with notes");
    expect(markdown).not.toContain("empty");
  });
});
