import { NextResponse, type NextRequest } from "next/server";
import { isValidLeetCodeUsername, parseProblemSlug } from "@/lib/leetcode-links";
import { verifyRequestUser } from "@/lib/server/auth";
import { HttpError, toErrorResponse } from "@/lib/server/errors";
import { fetchLeetCodeSnapshot, fetchSingleProblem } from "@/lib/server/leetcode";

export const dynamic = "force-dynamic";

/**
 * GET /api/leetcode?username=<leetcode-username>
 *   → LeetCodeProfileSnapshot (totals + recent accepted submissions with topics)
 *
 * GET /api/leetcode?problem=<slug-or-url>
 *   → LeetCodeProblem (used to add a solved problem manually)
 *
 * Requires a Firebase ID token in the `Authorization: Bearer <token>` header so the
 * endpoint cannot be used as an open proxy.
 */
export async function GET(request: NextRequest) {
  try {
    await verifyRequestUser(request);

    const username = request.nextUrl.searchParams.get("username")?.trim() ?? "";
    const problem = request.nextUrl.searchParams.get("problem")?.trim() ?? "";

    if (username && problem) {
      throw new HttpError(400, "Provide either username or problem, not both.");
    }

    if (username) {
      if (!isValidLeetCodeUsername(username)) {
        throw new HttpError(400, "That LeetCode username has an invalid format.");
      }
      const snapshot = await fetchLeetCodeSnapshot(username);
      return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
    }

    if (problem) {
      const slug = parseProblemSlug(problem);
      if (!slug) {
        throw new HttpError(400, "Enter a LeetCode problem URL (leetcode.com/problems/...) or slug.");
      }
      const result = await fetchSingleProblem(slug);
      return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    }

    throw new HttpError(400, "Missing required query parameter: username or problem.");
  } catch (error) {
    return toErrorResponse(error, "api/leetcode");
  }
}
