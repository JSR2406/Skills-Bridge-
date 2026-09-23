# SkillBridge — Backend (`backend/`)

The "backend" of SkillBridge is **Firebase as a service** (Firestore, Authentication,
Storage) with the Next.js server acting as a thin **BFF** — its API route handlers
(`frontend/src/app/api/*`) proxy/aggregate server-side work such as AI calls and payments.

This folder holds everything server-side *outside* the Next.js app: Firebase
config/schema, seeding tooling, and the VAPID key generator.

## 📁 Layout

```
backend/
├── config/                 # Firebase project configuration & schema
│   ├── firebase.json       #   Firestore location, rules/indexes refs, Auth providers, hosting
│   ├── .firebaserc         #   Firebase project alias mapping (currently empty)
│   ├── firestore.rules     #   Security rules (who can read/write what)
│   └── firestore.indexes.json
├── scripts/                # CLI tooling (not part of the app build)
│   ├── seed.ts             #   Demo seed — mentors, users, sample conversation (web SDK)
│   ├── seed/
│   │   └── seedMentorData.ts  # Emulator-first mentor/student seed (Admin SDK)
│   ├── tsconfig.seed.json  #   TS config for the seed scripts
│   └── gen-vapid.cjs       #   Generates a VAPID keypair for web-push
├── package.json            # Backend dev deps (firebase, firebase-admin, tsx) + seed scripts
└── README.md
```

---

## 🌍 Where each piece of data lives (region map)

| Layer | Where it lives | Region / notes |
|---|---|---|
| **Firestore — all app data** | `(default)` database | **`asia-south1` (Mumbai)** — set in `config/firebase.json` → `firestore.location` |
| **Firestore rules & indexes** | same database | Deployed with the Firebase CLI: `firebase deploy --only firestore` (requires a project alias in `config/.firebaserc`) |
| **Authentication** | Firebase Authentication | Global service; **Google** sign-in provider is pre-configured in `config/firebase.json` → `auth.providers` |
| **App hosting** | **Vercel** (not Firebase Hosting) | `config/firebase.json` → `hosting` still points at a legacy `out/` export — **unused**; the live app deploys from `frontend/` to Vercel |
| **Serverless API routes (BFF)** | Vercel functions (`frontend/src/app/api/*`) | Run on Vercel's function infrastructure (default project region). API routes talk to Firebase, OpenRouter, Razorpay. For lowest latency to `asia-south1` data, pin **Functions Region = asia-south1** in Vercel project settings |
| **Web push subscriptions** | Firestore | Stored per user at `users/{uid}/pushSubscriptions/main`, delivered via `web-push` in `POST /api/notifications/send` |
| **Cloud Storage bucket** | Firebase Storage | Wired up in `frontend/src/lib/firebase/config.ts` but **not actively used** by app code. Default bucket + region configured in the Firebase console (verify there — commonly the project's default GCP location) |
| **Vercel cron** | Vercel Cron | `GET /api/cron/session-reminders` fires daily at `00:00 UTC` (`frontend/vercel.json`) |

> ⚠️ Firestore region is set at database creation and **cannot be changed** later —
> it's `asia-south1` for this project.

---

## 📦 Firestore data model — what is stored in which collection

All collections below live in the `asia-south1` Firestore database.

| Collection (path) | Stores | Primary readers / writers |
|---|---|---|
| `users` | Auth profiles: role, display name, streak, reputation, karma, onboarding state | Auth flow, TopHeader (chips), admin |
| `mentors` | Mentor profile: bio, subjects, fees, **aggregate** `averageRating` / `totalRatings` / `sessionCount` | Mentor directory + smart ranking, rating flow |
| `mentorSlots` | Mentor availability slots (1 doc per session slot) | Mentor slot manager, booking transaction |
| `bookings` | Session bookings: student/mentor ids, slot, status | Booking flow, "My sessions", cron reminders |
| `mentorRatings` | Individual star rating + review per session | `RateSessionModal` |
| `doubts` | Doubt posts for the feed (title, body, tags, votes, resolve flag) | Feed, admin moderation |
| `answers` | Answer posts (one doc per answer, `doubtId` field): text, votes, `isAccepted` | Doubt thread, reputation/achievements |
| `conversations` | 1:1 chat metadata: participants, last message, per-user unread counts | Messages feature |
| `conversations/{convId}/messages` | Message stream incl. `call_invite` messages | Messages feature, Jitsi call links |
| `tests` | AI-generated practice tests (questions + answers) | Test generator, test-taking UI |
| `testAttempts` | Per-user attempt results & scores | Test results, productivity context |
| `notifications` | In-app bell notifications (type, title, message, `read`) | Notification bell, cron reminders, admin |
| `tasks` | Productivity planner tasks (type, priority, status, due date) | `features/productivity` |
| `aiProductivityLogs` | One AI study-plan output per request (summary, blocks, follow-ups) | Productivity Coach, dashboard |
| `reputationEvents` | Gamification ledger (one doc per points event) | `features/reputation/api` |

### Subcollections / special paths
- `users/{uid}/pushSubscriptions/main` — web-push subscription for that user.
- `conversations/{convId}/messages` — message stream is stored as a **subcollection**
  of each conversation.
- Answer votes and doubt votes are stored in the top-level `votes` collection
  (one doc per user+doubt for idempotency) — see `frontend/src/features/doubts/api`.

---

## 🔧 CLI tooling

Run everything **from this folder** (`backend/`):

```bash
npm install                # install backend dev deps (once)
npm run seed               # demo seed (web SDK) — needs NEXT_PUBLIC_FIREBASE_* env vars
npm run seed:mentors       # mentor/student seed — emulator-first via Firestore Emulator (Admin SDK)
npm run vapid:generate     # print a fresh VAPID keypair (paste into Vercel env vars)
```

### `seed:mentors` details
- By default targets the **Firestore Emulator** on `localhost:8080` (no credentials needed).
- To run against production set `ALLOW_PRODUCTION_SEED=true` and provide
  `GOOGLE_APPLICATION_CREDENTIALS` (service-account JSON) or
  `GCLOUD_PROJECT` when emulating.

### Env vars (see `.env.example`)
| Var | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | demo `seed` | Project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | demo `seed` | auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | all seeds | project id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | demo `seed` | storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | demo `seed` | messaging sender id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | demo `seed` | app id |
| `FIRESTORE_EMULATOR_HOST` | `seed:mentors` | defaults to `localhost:8080` in emulator mode |
| `GCLOUD_PROJECT` | `seed:mentors` (emulator) | emulated project id |
| `ALLOW_PRODUCTION_SEED` | `seed:mentors` | must be `"true"` to touch production |
| `GOOGLE_APPLICATION_CREDENTIALS` | `seed:mentors` (prod) | service-account JSON path |

---

## 🔐 Deploying schema changes

1. Edit `config/firestore.rules` and/or `config/firestore.indexes.json`.
2. Bind your project once in `config/.firebaserc` (or run `firebase use <project>`).
3. Deploy only Firestore:
   ```bash
   firebase deploy --only firestore
   ```

> The frontend itself deploys from `frontend/` on **Vercel** — see the repo root README.