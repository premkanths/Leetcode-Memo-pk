import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface ProblemAiRequest {
  problemTitle: string;
  problemSlug: string;
  difficulty: string;
  topics: string[];
  questionContent?: string;
  code?: string;
  codeLanguage?: string;
  notes?: string;
  messages?: ChatMessage[];
  userPrompt?: string;
}

const SYSTEM_INSTRUCTION = `You are an elite, calm, and friendly Technical Interview Coach and Staff Software Engineer.
Your goal is to help software engineers deeply master LeetCode problems, understand the algorithm intuition, and feel completely relaxed and confident in interviews.

Formatting rules:
- Format your response with clean GitHub-flavored Markdown.
- Use bold headers, clean bullet points, and code snippets where appropriate.
- State complexities clearly (e.g. \`O(N)\` time, \`O(N)\` space) with clear rationale.
- Be encouraging, concise, insightful, and easy to read.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as ProblemAiRequest;
    const {
      problemTitle,
      difficulty,
      topics,
      questionContent,
      code,
      codeLanguage,
      notes,
      messages,
      userPrompt,
    } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Strip HTML tags from questionContent if present
    const cleanQuestionText = questionContent
      ? questionContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000)
      : "";

    const contextPrefix = [
      `Problem: ${problemTitle} (${difficulty})`,
      `Topics: ${topics.join(", ") || "General"}`,
      cleanQuestionText ? `Problem Description:\n${cleanQuestionText}` : "",
      code
        ? `User's ${codeLanguage || "Java"} Solution Code:\n\`\`\`${codeLanguage || "java"}\n${code}\n\`\`\``
        : "User has not submitted solution code yet.",
      notes ? `User's Personal Notes:\n${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // Case 1: An ongoing interactive chat follow-up
    if (userPrompt && Array.isArray(messages) && messages.length > 0) {
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: `Here is the LeetCode problem context I am studying:\n\n${contextPrefix}` }],
          },
          {
            role: "model",
            parts: [
              {
                text: `I've analyzed the problem "${problemTitle}" and your code. I am ready to guide you. What would you like to explore or practice?`,
              },
            ],
          },
          ...history,
        ],
      });

      const result = await chat.sendMessage(userPrompt);
      const reply = result.response.text();
      return NextResponse.json({ reply });
    }

    // Case 2: Initial automatic summary upon opening
    // As requested: "first thing it to do is summarise the question , code , and output , later on can ask wheat ever user needs on that problem"
    const initialPrompt = [
      `Provide an instant, elegant breakdown for "${problemTitle}":`,
      "",
      "1. **📋 Question Summary**: Briefly summarize what the problem asks for, inputs, and expected output.",
      "2. **💡 Core Intuition & Interview Pattern**: The key mental trick or algorithmic pattern (e.g. Monotonic Stack, Two Pointers) to solve it effortlessly.",
      "3. **🔍 Code Walkthrough**: Explain how the user's code produces the correct output step-by-step.",
      "4. **⏱️ Complexity & Output Guarantees**: Time and Space complexity analysis with clear justification.",
      "5. **⚠️ Key Edge Cases**: 2-3 critical edge cases an interviewer will test.",
      "",
      "Keep it relaxed, crisp, and beautifully structured.",
    ].join("\n");

    const fullPrompt = `${contextPrefix}\n\n---\n\n${initialPrompt}`;
    const result = await model.generateContent(fullPrompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Problem AI error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI coach generation failed" },
      { status: 500 }
    );
  }
}
