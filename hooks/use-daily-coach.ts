"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { generateDailyRecommendations } from "@/lib/hub-actions";
import { getErrorMessage } from "@/lib/utils";
import type { DailyRecommendations, SolvedProblem } from "@/lib/types";
import { useDailyRecommendationDoc } from "./use-hub-data";

interface DailyCoachState {
  recommendations: DailyRecommendations | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  regenerate: () => Promise<void>;
}

/**
 * Serves today's cached coaching plan from Firestore. When none exists yet, it
 * generates one automatically once the hub has data (at most once per mount and day).
 */
export function useDailyCoach(
  user: User,
  problems: SolvedProblem[],
  problemsReady: boolean,
  dateKey: string,
): DailyCoachState {
  const live = useDailyRecommendationDoc(user.uid, dateKey);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedForRef = useRef<string | null>(null);

  const regenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      await generateDailyRecommendations(user, problems, dateKey);
    } catch (err) {
      setError(getErrorMessage(err, "Could not generate recommendations."));
    } finally {
      setGenerating(false);
    }
  }, [user, problems, dateKey]);

  const hasProblems = problems.length > 0;
  const hasToday = live.data !== null;

  useEffect(() => {
    if (live.loading || hasToday || !problemsReady || !hasProblems) return;
    if (attemptedForRef.current === dateKey) return;
    attemptedForRef.current = dateKey;
    void regenerate();
  }, [live.loading, hasToday, problemsReady, hasProblems, dateKey, regenerate]);

  return {
    recommendations: live.data,
    loading: live.loading,
    generating,
    error: error ?? live.error,
    regenerate,
  };
}
