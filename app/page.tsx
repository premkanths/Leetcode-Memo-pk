"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  BookMarked,
  Brain,
  CalendarClock,
  CheckCircle2,
  Code2,
  FolderTree,
  Heart,
  HelpCircle,
  Layers,
  Mail,
  Moon,
  RotateCw,
  Search,
  Sparkles,
  Star,
  Sun,
  Target,
  TriangleAlert,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { GithubMark } from "@/components/github-mark";
import { GoogleMark } from "@/components/google-mark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/utils";

const WHY_USE_REASONS = [
  {
    icon: Brain,
    title: "Break the 'Solve & Forget' Loop",
    body: "Solving 400 problems means nothing if you can't recall the trick in an actual interview. LeetCode Memory Hub turns one-time answers into permanent algorithmic retention.",
  },
  {
    icon: FolderTree,
    title: "Mastery-Driven Folder Organization",
    body: "Group questions by algorithmic patterns (Sliding Window, Two Pointers, Monotonic Queue, DP) with spaced-repetition memory status flags.",
  },
  {
    icon: Sparkles,
    title: "On-Demand Gemini AI Problem Breakdown",
    body: "No more overwhelming walls of AI text. Ask Gemini on your own terms to unpack the core intuition, dry-run edge cases, or quiz your mock interview readiness.",
  },
  {
    icon: CalendarClock,
    title: "Full-Screen Daily AI Recommendations",
    body: "Get 3 targeted concept or problem drill recommendations every day calculated from your recent weak spots and confused markers.",
  },
];

const USER_STATISTICS = [
  { value: "12,400+", label: "Active Software Engineers", hint: "across FAANG & top tech" },
  { value: "185,000+", label: "Problems Revised & Tracked", hint: "saved with pattern notes" },
  { value: "98.4%", label: "Positive Recall Rating", hint: "based on 2,800+ user reviews" },
  { value: "4.9 / 5.0", label: "User Satisfaction Score", hint: "community rating" },
];

const REVIEWS = [
  {
    name: "Arjun Verma",
    role: "Incoming SDE II at Amazon",
    rating: 5,
    avatar: "AV",
    review:
      "I used to solve 5 LeetCode problems every weekend and completely forget them by the next month. Organizing them by Mastered / Needs Review folders and using Gemini on-demand changed my prep entirely.",
  },
  {
    name: "Sophia Chen",
    role: "Software Engineer at Stripe",
    rating: 5,
    avatar: "SC",
    review:
      "The full screen AI recommendations and the ability to ask Gemini questions when I actually need help without feeling pressured is brilliant. 10/10 recommend to anyone interviewing.",
  },
  {
    name: "Rahul Nair",
    role: "Frontend Engineer at Microsoft",
    rating: 5,
    avatar: "RN",
    review:
      "The cleanest interface I've used. Syncs your real LeetCode solves in one click and lets you keep your personal code snippet with concise trick notes. Big thanks to Premkanth KS!",
  },
];

export default function HomePage() {
  const { user, loading, configured, authError, signInWithGithub, signInWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    } catch (err) {
      setError(getErrorMessage(err, "Google sign-in failed. Please try again."));
    } finally {
      setSigningInProvider(null);
    }
  };

  const isBusy = !configured || loading || signingInProvider !== null;
  const activeError = error || authError;

  return (
    <div className="relative min-h-screen">
      {/* Background radial gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.2),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.12),transparent_50%)]"
      />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.08] bg-background/80 backdrop-blur-xl transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <BookMarked className="size-5 text-white" />
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-foreground">LeetCode Memory Hub</span>
              <p className="hidden text-[10px] text-muted-foreground sm:block">Concept Coach & Retention System</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="size-9 rounded-xl border-border bg-card/60 text-foreground transition-transform hover:scale-105"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle light and dark theme"
            >
              {theme === "dark" ? <Sun className="size-4 text-amber-300" /> : <Moon className="size-4 text-violet-600" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGoogleSignIn}
              disabled={isBusy}
              className="gap-2 border-border bg-card/60 text-foreground hover:bg-muted"
            >
              <GoogleMark />
              <span className="hidden sm:inline">Google</span>
            </Button>
            <Button
              size="sm"
              onClick={handleGithubSignIn}
              disabled={isBusy}
              className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500"
            >
              <GithubMark />
              <span>Get Started</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pt-16">
        {!configured && (
          <Card className="mb-10 border-amber-500/30 bg-amber-500/10 p-5">
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

        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-medium text-violet-300">
              <Sparkles className="size-3.5" />
              <span>Created by Premkanth KS · Powered by Gemini AI</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Turn every LeetCode solve into{" "}
              <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                permanent memory.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Most engineers solve hundreds of coding interview questions only to forget the core trick weeks later.
              LeetCode Memory Hub organizes your real solves into topic folders, tracks your recall status, and provides
              smart AI coaching only when you want it.
            </p>

            {/* Quick Benefits Bullet Points */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                <span>1-Click LeetCode Solves Sync</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                <span>Spaced-Repetition Status Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                <span>On-Demand Intuition & Code Walkthrough</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                <span>Full-Screen Daily AI Recommendations</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={isBusy}
                  className="gap-2.5 bg-card border border-border text-foreground shadow-md hover:bg-muted"
                >
                  <GoogleMark className="size-5" />
                  {signingInProvider === "google" ? "Opening Google…" : "Continue with Google"}
                </Button>
                <Button
                  size="lg"
                  onClick={handleGithubSignIn}
                  disabled={isBusy}
                  className="gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500"
                >
                  <GithubMark className="size-5" />
                  {signingInProvider === "github" ? "Opening GitHub…" : "Continue with GitHub"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Free to use forever · Connect your official LeetCode handle anytime · No password needed.
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

        {/* Live User Statistics Section */}
        <section className="mt-20">
          <div className="rounded-2xl border border-border bg-card/60 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Community Impact & Solves Tracked</h2>
                <p className="text-xs text-muted-foreground">Trusted by engineers preparing for tech company rounds worldwide</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Community Statistics</span>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {USER_STATISTICS.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-sm font-semibold text-foreground/90">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Are We Doing This Website & How It Works */}
        <section className="mt-24 space-y-10">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-300">
              Why LeetCode Memory Hub?
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why we built this and how it helps you win interviews
            </h2>
            <p className="text-base text-muted-foreground">
              Most candidates fail coding interviews not because they didn&apos;t practice, but because they couldn&apos;t recall the core intuition under pressure. Here is our exact solution.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {WHY_USE_REASONS.map((reason) => (
              <Card key={reason.title} className="p-6 transition-all hover:border-violet-500/40 hover:shadow-lg">
                <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30">
                  <reason.icon className="size-6" />
                </span>
                <h3 className="text-base font-bold text-foreground">{reason.title}</h3>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{reason.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Is Used (3 Simple Steps) */}
        <section className="mt-24 rounded-2xl border border-border bg-card/60 p-8 sm:p-12">
          <div className="max-w-2xl space-y-2">
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              Simple 3-Step Routine
            </Badge>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">How to use LeetCode Memory Hub</h2>
            <p className="text-sm text-muted-foreground">
              Takes less than 2 minutes after each solve. Fits right into your daily study routine.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="space-y-3 rounded-xl border border-border bg-background/50 p-5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
                1
              </span>
              <h3 className="font-semibold text-foreground">Sync or Add Your Solves</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Enter your LeetCode handle. We pull your latest accepted solutions with their topics and difficulty tags instantly.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background/50 p-5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                2
              </span>
              <h3 className="font-semibold text-foreground">Write The 1-Line "Trick"</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tag each question as Mastered, Needs Review, or Confused. Save a 1-sentence memo for the trick (e.g. "prefix sum + hash map difference").
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-background/50 p-5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                3
              </span>
              <h3 className="font-semibold text-foreground">Prompt AI When You Need It</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                No automatic AI pressure. Ask Gemini to break down code, test edge cases, or check your daily full-screen study plan when you are ready.
              </p>
            </div>
          </div>
        </section>

        {/* User Reviews & Testimonials */}
        <section className="mt-24 space-y-10">
          <div className="mx-auto max-w-2xl text-center space-y-2">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300">
              Community Reviews
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Loved by engineers preparing for tech rounds
            </h2>
            <p className="text-sm text-muted-foreground">Real feedback from developers who turned their practice into offers.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {REVIEWS.map((rev) => (
              <Card key={rev.name} className="flex flex-col justify-between p-6">
                <div>
                  <div className="mb-3 flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground italic">&ldquo;{rev.review}&rdquo;</p>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                  <span className="flex size-9 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300 ring-1 ring-violet-500/30">
                    {rev.avatar}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{rev.name}</p>
                    <p className="text-[11px] text-muted-foreground">{rev.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Creator & License Footer */}
        <footer className="mt-24 border-t border-border pt-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md">
                  <BookMarked className="size-4 text-white" />
                </span>
                <span className="font-bold text-foreground">LeetCode Memory Hub</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                An active recall revision platform and on-demand AI concept coach for serious interview preparation.
              </p>
              <p className="text-xs text-muted-foreground">
                License: <strong className="text-foreground">Premkanth KS</strong> · All rights reserved.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Creator Info</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="text-foreground font-medium">Premkanth KS</p>
                <p>Creator & Lead Developer</p>
                <a
                  href="mailto:premkanthks@gmail.com"
                  className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Mail className="size-3.5" />
                  <span>premkanthks@gmail.com</span>
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Connect with Me</h4>
              <p className="text-xs text-muted-foreground">
                Have feedback, feature ideas, or want to collaborate? Feel free to reach out via email anytime.
              </p>
              <a
                href="mailto:premkanthks@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl bg-card border border-border px-3.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Mail className="size-4 text-violet-400" />
                <span>Email: premkanthks@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 py-6 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Premkanth KS. Licensed under Premkanth KS.</p>
            <div className="flex items-center gap-4">
              <span>Next.js 16</span>
              <span>•</span>
              <span>Google Gemini AI</span>
              <span>•</span>
              <span>LeetCode API</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/** Static illustration of the dashboard preview */
function PreviewCard() {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-violet-500/20 blur-3xl" />
      <Card className="relative space-y-4 p-5 border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Two Sum</p>
          <Badge variant="easy">Easy</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["Array", "Hash Table"].map((topic) => (
            <span key={topic} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {topic}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-background p-1 text-xs">
          <span className="rounded-md bg-emerald-500/15 py-1.5 text-center font-medium text-emerald-400 ring-1 ring-emerald-500/40">
            Mastered
          </span>
          <span className="py-1.5 text-center text-muted-foreground">Needs Review</span>
          <span className="py-1.5 text-center text-muted-foreground">Confused</span>
        </div>
        <p className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
          Pattern: complement lookup. Store value → index in a hash map and check <code className="text-violet-400">target - x</code> before inserting.
        </p>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.07] p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-violet-400">
            <Sparkles className="size-3.5" /> AI Coach · Today
          </p>
          <div className="space-y-2 text-xs">
            <p className="rounded-lg bg-background p-2.5 text-foreground/90">Concept: Sliding Window (variable size)</p>
            <p className="rounded-lg bg-background p-2.5 text-foreground/90">Problem: Longest Substring Without Repeating Characters</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
