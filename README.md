# LeetCode Memory Hub & Concept Coach

A web app for software engineers to sign in with GitHub, sync their solved LeetCode problems, organise them into a
revision hub with memory status and notes, and receive a **daily AI coaching plan** (3 concepts or problems) built
from their weak spots.

- **Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn-style UI · Lucide icons
- **Auth:** Firebase Auth with the GitHub provider
- **Database:** Cloud Firestore (owner-only security rules)
- **AI:** Google Gemini via `@google/generative-ai`
- **Data:** LeetCode public GraphQL (`https://leetcode.com/graphql`)

---

## Features

| Area | What it does |
| --- | --- |
| Sign-in | One-click GitHub login. The GitHub login is used as the LeetCode username; it can be changed in the header. |
| Auto-sync | Runs on first visit and again when data is more than 24 h old. Manual **Sync LeetCode** is always available. |
| Totals | Official totals (total / Easy / Medium / Hard) from LeetCode's `submitStatsGlobal`. |
| Revision hub | Problems grouped into **topic folders** or a flat list. Search plus filters for topic, difficulty, memory status and sort order. |
| Memory status | Per-problem segmented toggle: **Mastered / Needs Review / Confused**. |
| Notes | Collapsible markdown notes editor with write/preview tabs and Ctrl/⌘+S to save. |
| Backfill | **Add problem** accepts a LeetCode URL or slug for older solves outside the recent-submissions window. |
| AI Coach | Once per day, Gemini analyses topic strengths and weak spots and returns 3 recommendations. Problem links are verified against LeetCode, and already-solved problems are excluded. |

---

## Project structure

```
app/
  page.tsx                    Landing + GitHub sign-in
  dashboard/page.tsx          Auth-gated dashboard entry
  api/leetcode/route.ts       GET  ?username= | ?problem=   (LeetCode GraphQL proxy, auth required)
  api/recommendations/route.ts POST daily coaching plan     (Gemini, auth required)
components/
  auth-provider.tsx           Firebase auth context (GitHub sign-in / sign-out)
  dashboard/                  Header, stats, filter bar, problem cards, folders, AI coach widget, dialogs
  ui/                         Button, Badge, Card, Input, Textarea, Select, Dialog, Skeleton
hooks/                        Live Firestore subscriptions, daily coach orchestration
lib/
  firebase.ts                 Firebase app / Auth / Firestore (lazy init, safe at build time)
  hub-service.ts              Firestore reads and writes (upsert never clobbers notes/status)
  hub-actions.ts              Sync, add-by-URL and generate-coach orchestration
  leetcode-links.ts           Slug, username and URL helpers (shared)
  recommendations.ts          Builds and validates the learner digest sent to the AI (shared)
  problem-filters.ts          Pure filter, sort and group logic
  types.ts                    Domain types
  server/                     Server-only: token verification, LeetCode client, Gemini client, errors
firestore.rules               Owner-only security rules
tests/                        Vitest unit tests (URL parsing, LeetCode mapping, AI output parsing, filters)
```

### Firestore schema

```
users/{uid}
  githubUsername: string
  leetcodeUsername: string        (defaults to githubUsername; editable)
  totalSolved: number
  easySolved / mediumSolved / hardSolved: number
  lastSyncedAt: timestamp
  createdAt: timestamp

users/{uid}/solvedProblems/{problemSlug}
  title, titleSlug, difficulty, topics[], leetcodeUrl
  memoryStatus: "Mastered" | "Needs Review" | "Confused"
  notes: string (markdown)
  lastRevisedAt: timestamp
  solvedAt: timestamp | null      (null for manually added problems)
  source: "sync" | "manual"

users/{uid}/dailyRecommendations/{YYYY-MM-DD}
  summary, items[], model, generatedAt
```

The schema matches the spec, with the additional fields noted above.

---

## Setup

### 1. Prerequisites

- Node.js 20.9+ (22 LTS recommended)
- A Firebase project and a Google AI Studio API key

### 2. Install and configure

```bash
npm install
cp .env.example .env.local   # then fill in the values
```

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID` | Firebase console → Project settings → Your apps → Web app |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey). Server-only. |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-2.5-flash`. |

### 3. Firebase console

1. **Authentication → Sign-in method → GitHub → Enable.** Create a GitHub OAuth App at
   <https://github.com/settings/developers> and set its **Authorization callback URL** to the value Firebase shows
   (`https://<project-id>.firebaseapp.com/__/auth/handler`). Paste the Client ID and Secret back into Firebase.
2. **Authentication → Settings → Authorized domains.** Add `localhost` (already there) and your production domain.
3. **Firestore Database → Create database** (production mode).
4. Deploy the security rules:
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project <project-id>
   ```

### 4. Run

```bash
npm run dev        # http://localhost:3000
npm run test       # unit tests
npm run typecheck
npm run lint
npm run build && npm start
```

---

## How it works

1. **Login.** `signInWithPopup` with the GitHub provider. The handle comes from `additionalUserInfo.username`, with a
   fallback to `user.reloadUserInfo.screenName` on later sessions. `users/{uid}` is created on first login.
2. **Sync.** The browser calls `GET /api/leetcode?username=…` with the Firebase ID token. The server:
   - checks the token with Identity Toolkit `accounts:lookup`, so no service-account key is needed;
   - queries `matchedUser.submitStatsGlobal` and `recentAcSubmissionList`;
   - resolves topics and difficulty in one batched GraphQL request using aliases.

   The browser then writes to Firestore. Existing problems only have their LeetCode metadata refreshed, so memory
   status and notes are never overwritten.
3. **Coach.** The browser builds a compact digest (topic stats, weak problems, solved slugs) and calls
   `POST /api/recommendations`. The server:
   - asks Gemini for JSON, with a system prompt that treats the data as data, not instructions;
   - validates and caps the output;
   - checks every suggested problem against LeetCode, dropping hallucinated slugs and anything already solved;
   - links concepts to `leetcode.com/tag/<topic>/`.

   The result is cached at `users/{uid}/dailyRecommendations/{today}`, so Gemini runs at most once per day unless the
   user regenerates.

---

## Important limitations

- **LeetCode's API is undocumented.** `https://leetcode.com/graphql` is the public endpoint the website uses. It can
  change, and LeetCode may rate-limit or block server-side requests. The client handles 404 and 429 with clear messages.
- **Only recent accepted submissions are visible.** LeetCode caps `recentAcSubmissionList` at about 20 items and there
  is no public full "solved list" query. The hub therefore accumulates history over time, and older solves can be
  backfilled with **Add problem**. Totals still come from LeetCode's official counts.
- **Manual adds are trusted.** The app does not verify that a manually added problem was actually solved.
- **Gemini quota.** Free-tier limits are per project. The daily cache keeps usage low, and the UI surfaces quota errors.

---

## Security notes

- Firestore rules restrict every read and write to `request.auth.uid == uid`, validate memory status, difficulty and
  note size, and deny deletes. Deploy them before going live.
- API routes require a valid Firebase ID token. The LeetCode proxy cannot be used anonymously.
- Usernames and slugs are validated server-side before any outbound request.
- `GEMINI_API_KEY` is never exposed to the browser. Only `NEXT_PUBLIC_*` values ship to the client, and Firebase web
  config is public by design.
- Notes are rendered with `react-markdown`, which does not render raw HTML, and links open with `rel="noopener noreferrer"`.

---

## Deployment

Deploy to Vercel, Cloud Run or any Node host. Set every variable from `.env.example` in the host's environment,
and add the production domain to Firebase **Authorized domains**.
