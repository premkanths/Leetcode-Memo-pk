import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLeetCodeSnapshot, fetchSingleProblem } from "@/lib/server/leetcode";
import { HttpError } from "@/lib/server/errors";

const TWO_SUM_NODE = {
  title: "Two Sum",
  titleSlug: "two-sum",
  difficulty: "Easy",
  isPaidOnly: false,
  topicTags: [
    { name: "Array", slug: "array" },
    { name: "Hash Table", slug: "hash-table" },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("LeetCode GraphQL client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps totals, de-duplicates submissions and attaches topics", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            matchedUser: {
              username: "jane",
              submitStatsGlobal: {
                acSubmissionNum: [
                  { difficulty: "All", count: 120 },
                  { difficulty: "Easy", count: 60 },
                  { difficulty: "Medium", count: 50 },
                  { difficulty: "Hard", count: 10 },
                ],
              },
            },
            recentAcSubmissionList: [
              { title: "Two Sum", titleSlug: "two-sum", timestamp: "1700000000" },
              { title: "Two Sum", titleSlug: "two-sum", timestamp: "1710000000" },
            ],
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { q0: TWO_SUM_NODE } }));

    const snapshot = await fetchLeetCodeSnapshot("jane");

    expect(snapshot.totalSolved).toBe(120);
    expect(snapshot.easySolved).toBe(60);
    expect(snapshot.mediumSolved).toBe(50);
    expect(snapshot.hardSolved).toBe(10);
    expect(snapshot.recentProblems).toHaveLength(1);
    expect(snapshot.recentProblems[0]).toMatchObject({
      titleSlug: "two-sum",
      difficulty: "Easy",
      topics: ["Array", "Hash Table"],
      leetcodeUrl: "https://leetcode.com/problems/two-sum",
    });
    // Keeps the most recent accepted timestamp for the duplicate submission.
    expect(snapshot.recentProblems[0].solvedAt).toBe(new Date(1710000000 * 1000).toISOString());
  });

  it("sends a Referer header and a POST body to the GraphQL endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          matchedUser: { username: "jane", submitStatsGlobal: { acSubmissionNum: [] } },
          recentAcSubmissionList: [],
        },
      }),
    );

    await fetchLeetCodeSnapshot("jane");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://leetcode.com/graphql");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Referer).toBe("https://leetcode.com/");
    const body = JSON.parse(String(init?.body)) as { variables: { username: string; limit: number } };
    expect(body.variables).toEqual({ username: "jane", limit: 20 });
  });

  it("returns 404 when the username does not exist", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: { matchedUser: null, recentAcSubmissionList: null } }),
    );

    await expect(fetchLeetCodeSnapshot("nobody-here")).rejects.toMatchObject({ status: 404 });
  });

  it("surfaces rate limiting as 429", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 429 }));
    await expect(fetchLeetCodeSnapshot("jane")).rejects.toMatchObject({ status: 429 });
  });

  it("surfaces GraphQL errors as 502 HttpErrors", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ errors: [{ message: "boom" }] }));
    const error = await fetchLeetCodeSnapshot("jane").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(502);
  });

  it("resolves a single problem by slug and reports unknown slugs as 404", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { q0: TWO_SUM_NODE } }));
    await expect(fetchSingleProblem("two-sum")).resolves.toMatchObject({ title: "Two Sum", solvedAt: null });

    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { q0: null } }));
    await expect(fetchSingleProblem("does-not-exist")).rejects.toMatchObject({ status: 404 });
  });
});
