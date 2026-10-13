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

const CORE_PILLARS = [
  { value: "Instant Sync", label: "Automated Tracking", hint: "Fetch solves via public LeetCode handle" },
  { value: "Spaced Recall", label: "Mastery Folders", hint: "Scheduled review for confused & weak patterns" },
  { value: "Daily Coach", label: "Targeted Drills", hint: "3 AI recommendations based on weak spots" },
  { value: "Markdown Export", label: "Interview Cheatsheet", hint: "Download your notes offline anytime" },
];

const PRODUCT_HIGHLIGHTS = [
  {
    title: "Keyboard-Driven Search (⌘K)",
    desc: "Jump straight to any problem, topic, or trick note in milliseconds with full keyboard navigation.",
    tag: "Fast Navigation",
  },
  {
    title: "Pinned Problem Shortcuts",
    desc: "Pin tricky patterns and high-frequency interview questions directly to your sidebar for instant access.",
    tag: "Favorites",
  },
  {
    title: "Dedicated Code Workspace",
    desc: "Store your personal syntax-highlighted solutions alongside pattern intuition notes and Gemini tutoring.",
    tag: "Retention",
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
    <div className="landing-backdrop relative min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-border/80 bg-card/70 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookMarked className="size-5" />
            </span>
            <div>
              <span className="text-base font-semibold tracking-tight text-foreground">LeetCode Memory Hub</span>
              <p className="hidden text-xs text-muted-foreground sm:block">A calm notebook for algorithmic retention</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="size-8.5 rounded-xl border-border bg-card text-foreground"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle light and dark theme"
            >
              {theme === "dark" ? <Sun className="size-4 text-amber-300" /> : <Moon className="size-4 text-zinc-600" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGoogleSignIn}
              disabled={isBusy}
              className="gap-2 border-border bg-card text-foreground hover:bg-muted"
            >
              <GoogleMark />
              <span className="hidden sm:inline">Google</span>
            </Button>
            <Button
              size="sm"
              onClick={handleGithubSignIn}
              disabled={isBusy}
              className="gap-2 bg-primary text-primary-foreground hover:opacity-90"
            >
              <GithubMark />
              <span>Get Started</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:pt-16">
        {!configured && (
          <Card className="mb-10 border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-200">Firebase is not configured yet</p>
                <p className="text-amber-700 dark:text-amber-300/80">
                  Copy <code className="rounded bg-black/10 px-1.5 py-0.5">.env.example</code> to{" "}
                  <code className="rounded bg-black/10 px-1.5 py-0.5">.env.local</code> and fill in your keys.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CORE_PILLARS.map((item) => (
            <div key={item.label} className="glass-panel rounded-2xl px-4 py-3">
              <p className="text-base font-semibold text-foreground sm:text-lg">{item.value}</p>
              <p className="text-[11px] font-medium text-foreground/80">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>Created by Premkanth KS · Open & thoughtful study tool</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
                Remember what you solve.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                Solving questions is only half the work. LeetCode Memory Hub quietly preserves your real solutions,
                tracks spaced revision dates, and coaches your problem intuition without overwhelm.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={isBusy}
                  className="gap-2.5 bg-card border border-border text-foreground hover:bg-muted"
                >
                  <GoogleMark className="size-4" />
                  {signingInProvider === "google" ? "Connecting…" : "Continue with Google"}
                </Button>
                <Button
                  size="lg"
                  onClick={handleGithubSignIn}
                  disabled={isBusy}
                  className="gap-2.5 bg-primary text-primary-foreground hover:opacity-90"
                >
                  <GithubMark className="size-4" />
                  {signingInProvider === "github" ? "Connecting…" : "Continue with GitHub"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Free to use · Link your LeetCode profile whenever you like · No passwords to manage
              </p>
              {activeError && (
                <div role="alert" className="mt-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-300">
                  {activeError}
                </div>
              )}
            </div>
          </div>

          <PreviewCard />
        </div>

        {/* 3-Step Section: Solve -> Save -> Revisit */}
        <section className="mt-24">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">A peaceful routine</p>
            <h2 className="text-2xl font-semibold text-foreground">Three steps to permanent recall</h2>
            <p className="text-sm text-muted-foreground">Built to feel as simple and calming as taking pencil notes.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="space-y-3 bg-card/85 p-6 backdrop-blur-md">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Code2 className="size-5" />
              </span>
              <h3 className="text-base font-semibold text-foreground">1. Solve</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Solve problems naturally on LeetCode. Sync your accepted code in one click or paste anytime.
              </p>
            </Card>

            <Card className="space-y-3 bg-card/85 p-6 backdrop-blur-md">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookMarked className="size-5" />
              </span>
              <h3 className="text-base font-semibold text-foreground">2. Save</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Jot down the 1-line intuition trick and mark whether you feel Mastered, Needs Review, or Confused.
              </p>
            </Card>

            <Card className="space-y-3 bg-card/85 p-6 backdrop-blur-md">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RotateCw className="size-5" />
              </span>
              <h3 className="text-base font-semibold text-foreground">3. Revisit</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Review at your own pace. Let gentle AI suggestions surface questions when you want targeted practice.
              </p>
            </Card>
          </div>
        </section>

        {/* Why this helps section (Warm & human) */}
        <section className="mt-24 rounded-2xl border border-border bg-card/85 p-8 shadow-lg backdrop-blur-md sm:p-12">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Why this helps</p>
              <h2 className="text-2xl font-semibold text-foreground">Quality of understanding over grind fatigue</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                In real technical interviews, memorizing 500 solutions by brute repetition almost always falls apart under stress.
                True confidence comes from recognizing invariant patterns—like knowing immediately why a prefix sum is needed instead of a two-pointer pass.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                LeetCode Memory Hub removes all neon dashboard noise and treats your practice like a quiet learning log. You own your notes, you review on your schedule, and Gemini acts as a friendly tutor only when you ask for clarification.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/40 p-6 text-center space-y-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Brain className="size-6" />
              </span>
              <h4 className="text-sm font-semibold text-foreground">Active Recall & Retention</h4>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Reviewing 3 weak spots once a week yields higher interview conversion than grinding 10 new problems each night.
              </p>
            </div>
          </div>
        </section>

        {/* Built for interview readiness */}
        <section className="mt-24 space-y-8">
          <div className="mx-auto max-w-xl space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Everything you need</p>
            <h2 className="text-2xl font-semibold text-foreground">Built for thoughtful algorithmic mastery</h2>
            <p className="text-sm text-muted-foreground">A clean, noise-free workspace to build enduring interview muscle memory.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PRODUCT_HIGHLIGHTS.map((item) => (
              <Card key={item.title} className="flex flex-col justify-between bg-card/85 p-6 backdrop-blur-md">
                <div className="space-y-2.5">
                  <span className="inline-block rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {item.tag}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Simple Footer */}
        <footer className="mt-24 border-t border-border pt-10 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">LeetCode Memory Hub</span>
              <span>·</span>
              <span>Created by Premkanth KS</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="mailto:premkanthks@gmail.com" className="hover:text-foreground transition-colors">
                premkanthks@gmail.com
              </a>
              <span>·</span>
              <span>License: Premkanth KS</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/** Static illustration of the gentle dashboard preview */
function PreviewCard() {
  return (
    <Card className="space-y-4 border-border bg-card/90 p-6 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Two Sum</p>
          <p className="text-xs text-muted-foreground">leetcode.com/problems/two-sum</p>
        </div>
        <Badge variant="easy">Easy</Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["Array", "Hash Table"].map((topic) => (
          <span key={topic} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {topic}
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--status-mastered-border)] bg-[var(--status-mastered-bg)] p-3 text-xs text-[var(--status-mastered-fg)]">
        <span className="font-semibold">Mastered:</span> Store complement in a hash map and check <code className="font-mono">target - x</code> in one pass.
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>Today for you</span>
        </div>
        <p>1 problem ready for a gentle review: Longest Substring Without Repeating Characters</p>
      </div>
    </Card>
  );
}
