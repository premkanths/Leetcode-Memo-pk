"use client";

import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import {
  dailyDoc,
  parseDailyRecommendations,
  parseSolvedProblem,
  parseUserProfile,
  problemsCollection,
  userDoc,
} from "@/lib/hub-service";
import { getErrorMessage } from "@/lib/utils";
import type { DailyRecommendations, SolvedProblem, UserProfile } from "@/lib/types";

interface LiveState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/** Live `users/{uid}` document. */
export function useUserProfile(uid: string | null): LiveState<UserProfile | null> {
  const [state, setState] = useState<LiveState<UserProfile | null>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      userDoc(uid),
      (snapshot) => setState({ data: parseUserProfile(snapshot.data()), loading: false, error: null }),
      (error) => setState({ data: null, loading: false, error: getErrorMessage(error) }),
    );
  }, [uid]);

  return state;
}

/** Live `users/{uid}/solvedProblems` collection, sorted by title. */
export function useSolvedProblems(uid: string | null): LiveState<SolvedProblem[]> {
  const [state, setState] = useState<LiveState<SolvedProblem[]>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      problemsCollection(uid),
      (snapshot) => {
        const problems = snapshot.docs
          .map((doc) => parseSolvedProblem(doc.id, doc.data()))
          .filter((problem): problem is SolvedProblem => problem !== null)
          .sort((a, b) => a.title.localeCompare(b.title));
        setState({ data: problems, loading: false, error: null });
      },
      (error) => setState({ data: [], loading: false, error: getErrorMessage(error) }),
    );
  }, [uid]);

  return state;
}

/** Live cached coaching plan for a specific day. */
export function useDailyRecommendationDoc(
  uid: string | null,
  dateKey: string,
): LiveState<DailyRecommendations | null> {
  const [state, setState] = useState<LiveState<DailyRecommendations | null>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      dailyDoc(uid, dateKey),
      (snapshot) =>
        setState({
          data: parseDailyRecommendations(dateKey, snapshot.data()),
          loading: false,
          error: null,
        }),
      (error) => setState({ data: null, loading: false, error: getErrorMessage(error) }),
    );
  }, [uid, dateKey]);

  return state;
}
