# SkillBridge

A peer-learning web app for college students to ask questions, use an AI tutor, find mentors, and track study activity. The Next.js app contains the browser UI and server routes. Firebase provides authentication and persistence.

## Repository layout

| Path | Purpose |
| --- | --- |
| [frontend/src/app](frontend/src/app) | Pages and Next.js API routes |
| [frontend/src/features](frontend/src/features) | Doubts, mentor workflows, messaging, productivity, and reputation |
| [frontend/src/lib](frontend/src/lib) | Firebase, AI, and payment integrations |
| [backend/config](backend/config) | Firebase and Firestore configuration |
| [backend/scripts](backend/scripts) | Seed and maintenance tooling |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data model, module boundaries, and API reference |

## Run locally

Use Node.js 20.9 or later and npm. From the repository root, install the app dependencies and copy [the Firebase configuration example](frontend/.env.example) to `frontend/.env.local`. Fill it with settings from a development Firebase web app.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. For code checks, run `npm run lint`, `npm test`, and `npm run build` from `frontend/`. Review the [project overview](PROJECT_OVERVIEW.md) for the AI, notification, and mentor workflows. Test bookings and payments with sandbox services and test accounts.
