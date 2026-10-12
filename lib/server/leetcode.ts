import { buildProblemUrl, isValidTitleSlug } from "@/lib/leetcode-links";
import { isDifficulty, type LeetCodeProblem, type LeetCodeProfileSnapshot } from "@/lib/types";
import { HttpError } from "./errors";

/**
 * Client for LeetCode's public, undocumented GraphQL endpoint.
 * LeetCode caps `recentAcSubmissionList` at ~20 items, so this module only
 * returns what the public API exposes; history is accumulated across syncs.
 */

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const REQUEST_TIMEOUT_MS = 10_000;
const RECENT_SUBMISSION_LIMIT = 20;
const QUESTION_BATCH_SIZE = 20;

const PROFILE_QUERY = `
  query userProfileForHub($username: String!, $limit: Int!) {
    matchedUser(username: $username) {
      username
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
    recentAcSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
    }
  }
`;

interface GraphQLEnvelope<T> {
  data?: T | null;
  errors?: { message: string }[];
}

interface ProfileData {
  matchedUser: {
    username: string;
    submitStatsGlobal: { acSubmissionNum: { difficulty: string; count: number }[] };
  } | null;
  recentAcSubmissionList: { title: string; titleSlug: string; timestamp: string }[] | null;
}

interface QuestionNode {
  title: string;
  titleSlug: string;
  difficulty: string;
  isPaidOnly?: boolean;
  topicTags: { name: string; slug: string }[] | null;
}

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: "https://leetcode.com/",
        "User-Agent": "Mozilla/5.0 (compatible; LeetCodeMemoryHub/1.0)",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new HttpError(502, "Could not reach LeetCode. Please try again shortly.", { cause: error });
  }

  if (response.status === 429) {
    throw new HttpError(429, "LeetCode is rate limiting requests. Please wait a minute and retry.");
  }
  if (!response.ok) {
    throw new HttpError(502, `LeetCode responded with HTTP ${response.status}.`);
  }

  let envelope: GraphQLEnvelope<T>;
  try {
    envelope = (await response.json()) as GraphQLEnvelope<T>;
  } catch (error) {
    throw new HttpError(502, "LeetCode returned a response that could not be parsed.", { cause: error });
  }

  if (envelope.errors?.length) {
    const errorMsg = envelope.errors[0].message;
    if (/does not exist/i.test(errorMsg) || /not found/i.test(errorMsg)) {
      throw new HttpError(404, errorMsg);
    }
    throw new HttpError(502, `LeetCode error: ${errorMsg}`);
  }
  if (!envelope.data) {
    throw new HttpError(502, "LeetCode returned an empty response.");
  }
  return envelope.data;
}

function buildQuestionBatchQuery(count: number): string {
  const variables = Array.from({ length: count }, (_, i) => `$s${i}: String!`).join(", ");
  const fields = Array.from(
    { length: count },
    (_, i) =>
      `q${i}: question(titleSlug: $s${i}) { title titleSlug difficulty isPaidOnly topicTags { name slug } }`,
  ).join("\n");
  return `query questionBatchForHub(${variables}) {\n${fields}\n}`;
}

function toLeetCodeProblem(node: QuestionNode): LeetCodeProblem | null {
  if (!isDifficulty(node.difficulty) || !isValidTitleSlug(node.titleSlug)) return null;
  return {
    title: node.title,
    titleSlug: node.titleSlug,
    difficulty: node.difficulty,
    topics: (node.topicTags ?? []).map((tag) => tag.name),
    leetcodeUrl: buildProblemUrl(node.titleSlug),
    solvedAt: null,
  };
}

/**
 * Resolves problem metadata (title, difficulty, topics) for many slugs using
 * GraphQL aliases, so each batch costs a single request.
 * Slugs LeetCode does not recognise are simply absent from the returned map.
 */
export async function fetchQuestionMetadata(slugs: string[]): Promise<Map<string, LeetCodeProblem>> {
  const unique = [...new Set(slugs)].filter(isValidTitleSlug);
  const result = new Map<string, LeetCodeProblem>();

  for (let offset = 0; offset < unique.length; offset += QUESTION_BATCH_SIZE) {
    const chunk = unique.slice(offset, offset + QUESTION_BATCH_SIZE);
    const variables = Object.fromEntries(chunk.map((slug, i) => [`s${i}`, slug]));
    const data = await graphqlRequest<Record<string, QuestionNode | null>>(
      buildQuestionBatchQuery(chunk.length),
      variables,
    );

    chunk.forEach((slug, i) => {
      const node = data[`q${i}`];
      const problem = node ? toLeetCodeProblem(node) : null;
      if (problem) result.set(slug, problem);
    });
  }

  return result;
}

function countFor(
  counts: { difficulty: string; count: number }[],
  difficulty: string,
): number {
  return counts.find((entry) => entry.difficulty === difficulty)?.count ?? 0;
}

function toIsoFromUnixSeconds(timestamp: string): string | null {
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

/** Fetches totals plus the most recent accepted submissions for a public LeetCode profile. */
export async function fetchLeetCodeSnapshot(username: string): Promise<LeetCodeProfileSnapshot> {
  const data = await graphqlRequest<ProfileData>(PROFILE_QUERY, {
    username,
    limit: RECENT_SUBMISSION_LIMIT,
  });

  if (!data.matchedUser) {
    throw new HttpError(404, `No LeetCode user found for "${username}".`);
  }

  const counts = data.matchedUser.submitStatsGlobal.acSubmissionNum;

  // A problem can be accepted several times; keep the most recent accepted time per slug.
  const latestSolveBySlug = new Map<string, string | null>();
  for (const submission of data.recentAcSubmissionList ?? []) {
    const solvedAt = toIsoFromUnixSeconds(submission.timestamp);
    const previous = latestSolveBySlug.get(submission.titleSlug);
    if (previous === undefined || (solvedAt && (!previous || solvedAt > previous))) {
      latestSolveBySlug.set(submission.titleSlug, solvedAt);
    }
  }

  const metadata = await fetchQuestionMetadata([...latestSolveBySlug.keys()]);
  const recentProblems: LeetCodeProblem[] = [];
  for (const [slug, solvedAt] of latestSolveBySlug) {
    const problem = metadata.get(slug);
    if (problem) recentProblems.push({ ...problem, solvedAt });
  }

  return {
    username: data.matchedUser.username,
    totalSolved: countFor(counts, "All"),
    easySolved: countFor(counts, "Easy"),
    mediumSolved: countFor(counts, "Medium"),
    hardSolved: countFor(counts, "Hard"),
    recentProblems,
    fetchedAt: new Date().toISOString(),
  };
}

/** Looks up a single problem by slug, used for manually adding solved problems. */
export async function fetchSingleProblem(slug: string): Promise<LeetCodeProblem> {
  const metadata = await fetchQuestionMetadata([slug]);
  const problem = metadata.get(slug);
  if (!problem) {
    throw new HttpError(404, `No LeetCode problem found for "${slug}".`);
  }
  return problem;
}
