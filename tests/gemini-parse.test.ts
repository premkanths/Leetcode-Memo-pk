import { describe, expect, it } from "vitest";
import { parseCoachingPlan } from "@/lib/server/gemini";

const GOOD = {
  summary: "Strong on arrays; sliding window needs work.",
  recommendations: [
    {
      type: "concept",
      title: "Sliding window (variable size)",
      topic: "Sliding Window",
      difficulty: "Medium",
      reason: "Two confused problems use this pattern.",
      titleSlug: null,
    },
    {
      type: "problem",
      title: "Minimum Window Substring",
      topic: "Sliding Window",
      difficulty: "Hard",
      reason: "Extends the window pattern you marked confused.",
      titleSlug: "Minimum-Window-Substring",
    },
    {
      type: "problem",
      title: "Climbing Stairs",
      topic: "Dynamic Programming",
      difficulty: "Easy",
      reason: "Warm-up for DP.",
      titleSlug: "climbing-stairs",
    },
  ],
};

describe("parseCoachingPlan", () => {
  it("parses a valid plan and normalises problem slugs", () => {
    const plan = parseCoachingPlan(JSON.stringify(GOOD));
    expect(plan.summary).toMatch(/Strong on arrays/);
    expect(plan.items).toHaveLength(3);
    expect(plan.items[1].titleSlug).toBe("minimum-window-substring");
    expect(plan.items[0].titleSlug).toBeNull();
  });

  it("tolerates markdown code fences around the JSON", () => {
    const plan = parseCoachingPlan("```json\n" + JSON.stringify(GOOD) + "\n```");
    expect(plan.items).toHaveLength(3);
  });

  it("caps the output at three items", () => {
    const extra = { ...GOOD, recommendations: [...GOOD.recommendations, GOOD.recommendations[0]] };
    expect(parseCoachingPlan(JSON.stringify(extra)).items).toHaveLength(3);
  });

  it("drops a problem slug that is not a valid slug and defaults difficulty", () => {
    const raw = {
      summary: "ok",
      recommendations: [{ ...GOOD.recommendations[2], titleSlug: "not a slug!", difficulty: "Impossible" }],
    };
    const [item] = parseCoachingPlan(JSON.stringify(raw)).items;
    expect(item.titleSlug).toBeNull();
    expect(item.difficulty).toBe("Medium");
  });

  it("rejects malformed JSON, wrong shapes and empty lists", () => {
    expect(() => parseCoachingPlan("not json")).toThrow(/malformed/);
    expect(() => parseCoachingPlan(JSON.stringify({ summary: 1, recommendations: [] }))).toThrow();
    expect(() => parseCoachingPlan(JSON.stringify({ summary: "x", recommendations: [] }))).toThrow(
      /usable recommendations/,
    );
  });
});
