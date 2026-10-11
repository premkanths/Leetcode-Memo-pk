import { describe, expect, it } from "vitest";
import {
  buildProblemUrl,
  buildTagUrl,
  isValidLeetCodeUsername,
  isValidTitleSlug,
  parseProblemSlug,
  topicToTagSlug,
} from "@/lib/leetcode-links";

describe("parseProblemSlug", () => {
  it("accepts a bare slug", () => {
    expect(parseProblemSlug("two-sum")).toBe("two-sum");
  });

  it("extracts the slug from a full problem URL", () => {
    expect(parseProblemSlug("https://leetcode.com/problems/two-sum/description/")).toBe("two-sum");
    expect(parseProblemSlug("  leetcode.com/problems/Valid-Parentheses  ")).toBe("valid-parentheses");
  });

  it("rejects anything that is not a slug", () => {
    expect(parseProblemSlug("")).toBeNull();
    expect(parseProblemSlug("two sum")).toBeNull();
    expect(parseProblemSlug("../../etc/passwd")).toBeNull();
    expect(parseProblemSlug("https://example.com/problems/two-sum")).toBeNull();
  });
});

describe("isValidTitleSlug", () => {
  it("only allows lowercase hyphenated tokens", () => {
    expect(isValidTitleSlug("3sum-closest")).toBe(true);
    expect(isValidTitleSlug("Two-Sum")).toBe(false);
    expect(isValidTitleSlug("two--sum")).toBe(false);
    expect(isValidTitleSlug("-two-sum")).toBe(false);
  });
});

describe("isValidLeetCodeUsername", () => {
  it("validates length and characters", () => {
    expect(isValidLeetCodeUsername("jane_doe-99")).toBe(true);
    expect(isValidLeetCodeUsername("")).toBe(false);
    expect(isValidLeetCodeUsername("has space")).toBe(false);
    expect(isValidLeetCodeUsername("a".repeat(41))).toBe(false);
  });
});

describe("URL builders", () => {
  it("builds problem and tag URLs", () => {
    expect(buildProblemUrl("two-sum")).toBe("https://leetcode.com/problems/two-sum");
    expect(buildTagUrl("Dynamic Programming")).toBe("https://leetcode.com/tag/dynamic-programming/");
    expect(topicToTagSlug("  Two Pointers! ")).toBe("two-pointers");
    expect(topicToTagSlug("Hash Table")).toBe("hash-table");
  });
});
