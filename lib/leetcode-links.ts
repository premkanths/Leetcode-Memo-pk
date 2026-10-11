/** Pure helpers for LeetCode URLs and identifiers. Safe for client and server. */

const TITLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEETCODE_USERNAME_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
const PROBLEM_URL_PATTERN = /leetcode\.com\/problems\/([a-z0-9-]+)/i;

export function isValidTitleSlug(value: string): boolean {
  return value.length <= 120 && TITLE_SLUG_PATTERN.test(value);
}

export function isValidLeetCodeUsername(value: string): boolean {
  return LEETCODE_USERNAME_PATTERN.test(value);
}

/** Accepts a bare slug ("two-sum") or a full problem URL and returns the slug, or null. */
export function parseProblemSlug(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = PROBLEM_URL_PATTERN.exec(trimmed)?.[1];
  const candidate = (fromUrl ?? trimmed).toLowerCase();
  return isValidTitleSlug(candidate) ? candidate : null;
}

export function buildProblemUrl(titleSlug: string): string {
  return `https://leetcode.com/problems/${titleSlug}`;
}

/** Converts a topic name ("Dynamic Programming") into LeetCode's tag slug ("dynamic-programming"). */
export function topicToTagSlug(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildTagUrl(topic: string): string {
  return `https://leetcode.com/tag/${topicToTagSlug(topic)}/`;
}
