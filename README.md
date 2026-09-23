# 🌟 SkillBridge

Peer-to-peer AI learning platform — real-time doubt resolution, AI tutoring,
mentorship, productivity coaching, and gamification.

> **Full architecture reference:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## 📦 Monorepo layout

```
skillsbridge/
├── frontend/          # Next.js 16 app (React 19, TypeScript) — deployable on Vercel
│   ├── src/           #   app (pages + BFF API routes), components, features, lib, store
│   ├── public/        #   static assets + service worker (sw.js)
│   ├── package.json   #   frontend dependencies + build/dev scripts
│   ├── vercel.json    #   cron schedule (session reminders)
│   └── README.md      #   app features, demo credentials, judging guide
├── backend/           # Firebase config & CLI tooling — NOT deployed to Vercel
│   ├── config/        #   firebase.json, firestore.rules, firestore.indexes.json
│   ├── scripts/       #   seed tooling (demo + mentor admin seeds), VAPID generator
│   ├── package.json   #   backend deps (firebase-admin, tsx) + seed scripts
│   └── README.md      #   Firebase data model + "what lives in which region" map
├── docs/              # Architecture documentation
└── PROJECT_OVERVIEW.md
```

## 🚀 Quick start

**1. Frontend (the app)**

```bash
cd frontend
npm install          # or npm ci
npm run dev          # http://localhost:3000  (needs .env.local — see .env.example)
```

**2. Backend (Firebase + seeds)** — see [`backend/README.md`](./backend/README.md)

```bash
cd backend
npm install
npm run seed:mentors   # emulator-first mentor/student seed
```

## ☁️ Deployment

| Surface | Where | How |
|---|---|---|
| **App + API routes** | Vercel | Deploys from `frontend/` — set the Vercel project's **Root Directory** to `frontend/` |
| **Vercel cron** | `frontend/vercel.json` | Daily `00:00 UTC` → `GET /api/cron/session-reminders` |
| **Firestore rules/indexes** | Firebase | `firebase deploy --only firestore` from `backend/` |
| **Auth / Storage** | Firebase | Configured in Firebase console / `backend/config/firebase.json` |

## 📖 Docs

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — module map, data flows, API reference
- [`backend/README.md`](./backend/README.md) — Firestore data model + region map
- [`frontend/README.md`](./frontend/README.md) — app features, demo accounts, test guide
- [`PROJECT_OVERVIEW.md`](./PROJECT_OVERVIEW.md) — product overview

**Live demo:** https://skillsbridge-jet.vercel.app/