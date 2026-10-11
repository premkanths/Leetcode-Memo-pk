import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const QUESTION_DETAIL_QUERY = `
  query questionDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      content
      difficulty
      likes
      dislikes
      stats
      topicTags {
        name
        slug
      }
      sampleTestCase
    }
  }
`;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();

  if (!slug) {
    return NextResponse.json({ error: "Missing 'slug' query parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: "https://leetcode.com/",
        "User-Agent": "Mozilla/5.0 (compatible; LeetCodeMemoryHub/1.0)",
      },
      body: JSON.stringify({
        query: QUESTION_DETAIL_QUERY,
        variables: { titleSlug: slug },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `LeetCode responded with status ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const question = data.data?.question;

    if (!question) {
      return NextResponse.json(
        { error: `No problem found for slug '${slug}'` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        questionId: question.questionId,
        questionFrontendId: question.questionFrontendId,
        title: question.title,
        titleSlug: question.titleSlug,
        content: question.content,
        difficulty: question.difficulty,
        topicTags: question.topicTags?.map((t: { name: string }) => t.name) || [],
        sampleTestCase: question.sampleTestCase,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch problem details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch problem details" },
      { status: 500 }
    );
  }
}
