import { NextResponse, type NextRequest } from "next/server";
import { buildProblemUrl, buildTagUrl } from "@/lib/leetcode-links";
import { parseRecommendationRequest } from "@/lib/recommendations";
import { verifyRequestUser } from "@/lib/server/auth";
import { HttpError, toErrorResponse } from "@/lib/server/errors";
import { fetchQuestionMetadata } from "@/lib/server/leetcode";
import { type CoachingItem, generateCoachingPlan, getGeminiModelName } from "@/lib/server/gemini";
import type {
  LeetCodeProblem,
  Recommendation,
  RecommendationRequest,
  RecommendationResponse,
} from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Turns the AI's raw suggestions into verified recommendations:
 * - Problem items are checked against LeetCode so hallucinated slugs are dropped.
 * - Problems the learner already solved are removed.
 * - Concept items link to the matching LeetCode topic page.
 */
async function verifyRecommendations(
  items: CoachingItem[],
  solvedSlugs: Set<string>,
): Promise<Recommendation[]> {
  const candidateSlugs = items
    .map((item) => item.titleSlug)
    .filter((slug): slug is string => slug !== null && !solvedSlugs.has(slug));

  const verified: Map<string, LeetCodeProblem> = candidateSlugs.length
    ? await fetchQuestionMetadata(candidateSlugs)
    : new Map<string, LeetCodeProblem>();

  const recommendations: Recommendation[] = [];

  items.forEach((item, index) => {
    const id = `rec-${index + 1}`;

    if (item.type === "problem") {
      const slug = item.titleSlug;
      if (!slug || solvedSlugs.has(slug)) return;
      const problem = verified.get(slug);
      if (!problem) return;

      recommendations.push({
        id,
        type: "problem",
        title: problem.title,
        topic: item.topic,
        reason: item.reason,
        difficulty: problem.difficulty,
        url: buildProblemUrl(slug),
        titleSlug: slug,
      });
      return;
    }

    recommendations.push({
      id,
      type: "concept",
      title: item.title,
      topic: item.topic,
      reason: item.reason,
      difficulty: item.difficulty,
      url: buildTagUrl(item.topic),
      titleSlug: null,
    });
  });

  return recommendations;
}

/**
 * POST /api/recommendations
 * Body: RecommendationRequest (built client-side from the learner's Firestore data).
 * Requires a Firebase ID token in the Authorization header.
 */
export async function POST(request: NextRequest) {
  try {
    await verifyRequestUser(request);

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch (error) {
      throw new HttpError(400, "Request body must be valid JSON.", { cause: error });
    }

    const parsed = parseRecommendationRequest(rawBody);
    if (!parsed.ok) {
      throw new HttpError(400, parsed.error);
    }

    const body: RecommendationRequest = parsed.value;
    const plan = await generateCoachingPlan(body);
    const items = await verifyRecommendations(plan.items, new Set(body.solvedSlugs));

    if (items.length === 0) {
      throw new HttpError(502, "No valid recommendations were produced. Please regenerate.");
    }

    const response: RecommendationResponse = {
      dateKey: body.dateKey,
      summary: plan.summary,
      items,
      model: getGeminiModelName(),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return toErrorResponse(error, "api/recommendations");
  }
}
