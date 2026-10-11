"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, Brain, CalendarClock, Layers, Sparkles, TriangleAlert } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { GithubMark } from "@/components/github-mark";
import { GoogleMark } from "@/components/google-mark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/utils";

const FEATURES = [
  {
    icon: CalendarClock,
    title: "One-click sync",
    body: "Sign in with GitHub and we pull your recent accepted submissions from LeetCode, with topics and difficulty.",
  },
  {
    icon: Layers,
    title: "Topic-based revision hub",
    body: "Problems are grouped into topic folders. Mark each one Mastered, Needs Review or Confused, and keep notes on the trick.",
  },
  {
    icon: Brain,
    title: "Daily AI coach",
    body: "Gemini reviews your weak spots every day and recommends three concepts or problems, each linked to LeetCode.",
  },
];

export default function HomePage() {
  const { user, loading, configured, authError, signInWithGithub, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signingInProvider, setSigningInProvider] = useState<"github" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/dashboard";
    }
  }, [loading, user]);

  const handleGithubSignIn = async () => {
    setError(null);
    setSigningInProvider("github");
    try {
      await signInWithGithub();
      window.location.href = "/dashboard";
    } catch (err) {
      setError(getErrorMessage(err, "GitHub sign-in failed. Please try again."));
    } finally {
      setSigningInProvider(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSigningInProvider("google");
    try {
      await signInWithGoogle();
      window.location.href = "/dashboard";
    } catch (err) {
      setError(getErrorMessage(err, "Google sign-in failed. Please try again."));
    } finally {
      setSigningInProvider(null);
    }
  };

  const isBusy = !configured || loading || signingInProvider !== null;
  const activeError = error || authError;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.12),transparent_50%)]" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <BookMarked className="size-5 text-white" />
          </span>
          <span className="font-semibold text-zinc-100">LeetCode Memory Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoogleSignIn} disabled={isBusy} className="gap-2">
            <GoogleMark /> Google
          </Button>
          <Button variant="outline" size="sm" onClick={handleGithubSignIn} disabled={isBusy} className="gap-2">
            <GithubMark /> GitHub
          </Button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:pt-20">
        {!configured && (
          <Card className="mb-10 border-amber-500/30 bg-amber-500/5 p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-300" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-amber-200">Firebase is not configured yet</p>
                <p className="text-amber-200/70">
                  Copy <code className="rounded bg-black/30 px-1.5 py-0.5">.env.example</code> to{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code> and add your
                  NEXT_PUBLIC_FIREBASE_* values, then restart the dev server.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 px-3 py-1 text-violet-200">
              <Sparkles className="size-3.5" /> Powered by Google Gemini
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
              Turn every LeetCode solve into{" "}
              <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                lasting memory.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-zinc-400">
              LeetCode Memory Hub &amp; Concept Coach syncs your solved problems, organises them into revision
              folders, and gives you a daily plan for the concepts you are about to forget.
            </p>

            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={handleGoogleSignIn} disabled={isBusy} className="gap-2.5 bg-white font-medium text-zinc-900 shadow-md hover:bg-zinc-100">
                  <GoogleMark className="size-5" />
                  {signingInProvider === "google" ? "Opening Google…" : "Continue with Google"}
                </Button>
                <Button size="lg" onClick={handleGithubSignIn} disabled={isBusy} className="gap-2.5 bg-zinc-800 text-white hover:bg-zinc-700">
                  <GithubMark className="size-5" />
                  {signingInProvider === "github" ? "Opening GitHub…" : "Continue with GitHub"}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Sign in to sync your solves and get daily coaching. You can set or change your LeetCode username anytime.
              </p>
              {activeError && (
                <div role="alert" className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                  {activeError}
                </div>
              )}
            </div>
          </div>

          <PreviewCard />
        </div>

        <section className="mt-24 grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="p-6 transition-colors hover:border-violet-500/30">
              <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                <feature.icon className="size-5 text-violet-300" />
              </span>
              <h2 className="font-semibold text-zinc-100">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.body}</p>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}

/** Static illustration of the dashboard so visitors see the product before signing in. */
function PreviewCard() {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-violet-500/20 blur-3xl" />
      <Card className="relative space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-100">Two Sum</p>
          <Badge variant="easy">Easy</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Array", "Hash Table"].map((topic) => (
            <span key={topic} className="rounded-md bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-400">
              {topic}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950/60 p-1 text-xs">
          <span className="rounded-md bg-emerald-500/15 py-1.5 text-center font-medium text-emerald-300 ring-1 ring-emerald-500/40">Mastered</span>
          <span className="py-1.5 text-center text-zinc-500">Needs Review</span>
          <span className="py-1.5 text-center text-zinc-500">Confused</span>
        </div>
        <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs leading-relaxed text-zinc-400">
          Pattern: complement lookup. Store value → index in a hash map and check <code>target - x</code> before inserting.
        </p>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.07] p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-violet-200">
            <Sparkles className="size-3.5" /> AI Coach · Today
          </p>
          <div className="space-y-2 text-xs">
            <p className="rounded-lg bg-zinc-950/50 p-2.5 text-zinc-300">Concept: Sliding Window (variable size)</p>
            <p className="rounded-lg bg-zinc-950/50 p-2.5 text-zinc-300">Problem: Longest Substring Without Repeating Characters</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
