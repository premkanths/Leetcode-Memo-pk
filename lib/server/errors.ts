import { NextResponse } from "next/server";

/** An error with an HTTP status and a message that is safe to show to the client. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Converts any thrown value into a JSON error response without leaking internals. */
export function toErrorResponse(error: unknown, context: string): NextResponse<{ error: string }> {
  if (error instanceof HttpError) {
    if (error.status >= 500) {
      console.error(`[${context}] ${error.message}`, error.cause ?? "");
    }
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(`[${context}] Unexpected error`, error);
  return NextResponse.json(
    { error: "Something went wrong on the server. Please try again." },
    { status: 500 },
  );
}
