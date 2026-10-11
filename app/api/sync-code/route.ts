import { NextResponse, type NextRequest } from "next/server";
import { fetchQuestionMetadata } from "@/lib/server/leetcode";
import { upsertProblems } from "@/lib/hub-service";
import type { LeetCodeProblem, Difficulty } from "@/lib/types";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface IncomingSubmission {
  title: string;
  code: string;
  lang: string;
  runtime?: string;
  memory?: string;
  timestamp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      submissions?: IncomingSubmission[];
    };

    const { userId, submissions } = body;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid userId" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return NextResponse.json(
        { error: "No submissions provided" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Map each submission to a slug, keeping the latest code per problem
    const submissionMap = new Map<string, IncomingSubmission>();
    for (const sub of submissions) {
      if (!sub.title || !sub.code) continue;
      const slug = titleToSlug(sub.title);
      if (!submissionMap.has(slug)) {
        submissionMap.set(slug, sub);
      }
    }

    const slugs = Array.from(submissionMap.keys());
    let metadataMap = new Map<string, LeetCodeProblem>();
    try {
      metadataMap = await fetchQuestionMetadata(slugs);
    } catch (err) {
      console.warn("Could not fetch metadata for all slugs, using defaults", err);
    }

    const problemsToUpsert: LeetCodeProblem[] = [];
    for (const [slug, sub] of submissionMap) {
      const meta = metadataMap.get(slug);
      const difficulty: Difficulty = meta ? meta.difficulty : "Medium";
      const topics: string[] = meta ? meta.topics : [];
      const title = meta ? meta.title : sub.title;

      problemsToUpsert.push({
        title,
        titleSlug: slug,
        difficulty,
        topics,
        leetcodeUrl: `https://leetcode.com/problems/${slug}/`,
        code: sub.code,
        codeLanguage: sub.lang,
        runtime: sub.runtime,
        memoryUsage: sub.memory,
        solvedAt: sub.timestamp ? new Date(sub.timestamp * 1000).toISOString() : new Date().toISOString(),
      });
    }

    const result = await upsertProblems(userId, problemsToUpsert, "sync");

    return NextResponse.json(
      {
        success: true,
        added: result.added,
        existing: result.existing,
        total: problemsToUpsert.length,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("Failed to sync submissions and code:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
