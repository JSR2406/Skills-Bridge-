# 🌟 SkillBridge: Peer-to-Peer AI Learning Platform

SkillBridge is a modern ecosystem built for students to bridge the gap between doubts and mastery. It combines a vibrant peer-to-peer discussion feed with advanced AI tutoring and integrated mentorship.

**Live Demo**: [https://skillsbridge-jet.vercel.app/](https://skillsbridge-jet.vercel.app/)

**Demo video**: [https://express.adobe.com/id/urn:aaid:sc:AP:5b2aa685-0ab3-466e-9113-141300c268d6?invite=true&accept=true%3Fpreload%3Dsharesheet&promoid=Z2G1FQKR&mv=other](https://express.adobe.com/id/urn:aaid:sc:AP:5b2aa685-0ab3-466e-9113-141300c268d6?invite=true&accept=true%3Fpreload%3Dsharesheet&promoid=Z2G1FQKR&mv=other)


## ✨ Key Features

### 🧠 AI Productivity & Study Module
- **AI Study Plan Generator**: Analyzes your recent activities (Doubt history, Test scores, Mentor sessions) to generate custom 24-hour study priorities.
- **Smart Task Management**: Integrated scheduler that allows you to "Quick Add" follow-up tasks directly from AI answers or mentor slots.
- **Progress Tracking**: Real-time stats on tasks completed and subjects mastered.

### ❓ Smart Doubt Resolution
- **AI First-Response**: AI attempts to solve student doubts in under 5 seconds with structured explanations.
- **Peer Feed**: If the AI doesn't solve it, the doubt is published to a global community feed for peer resolution.
- **Verified Answers**: Authors can mark "Accepted" answers, awarding reputation to contributors.

### 🤝 Expert Mentorship + Smart Matching
- **Smart Mentor Recommendations**: Heuristic engine ranks mentors using 5 signals — Topic Match (40 pts), Rating (25 pts), Availability (20 pts), Novelty (10 pts), Budget fit (5 pts). Score shown as X/100 with a "Why recommended?" breakdown per card.
- **Race-Condition-Safe Booking**: Slot booking uses Firestore `runTransaction` — two students cannot claim the same slot simultaneously.
- **Mentor Slot Manager** *(new)*: Mentors manage their own availability from `/mentor-slots` — add time slots with date, time, and fee; view upcoming/booked/expired slots; delete unbooked slots in one click.
- **Post-Session Rating Flow** *(new)*: After a session ends, students rate their mentor (1–5 stars + comment). Rating atomically updates the mentor's rolling `averageRating` via Firestore transaction and is idempotent — once submitted, the button changes to a "Rated" badge.
- **Direct Consultations**: Real-time messaging and video sessions with peer experts via Jitsi Meet.
- **Idempotent Session Reminders**: Cron-based reminders (30 min + 5 min before sessions) use atomic flag writes to guarantee at-most-once delivery.

### 🛡️ Admin Dashboard
- **Analytics**: Platform-wide stats — total users, solved doubts, active mentors, and test attempts.
- **User Management**: Role assignment (student / mentor / admin) for any user.
- **Content Moderation**: Browse and delete community doubts from the feed.
- **Mentor Approval Tab** *(new)*: Admins review pending mentor applications with full profile details (headline, college, subjects, fee). One-click **Approve** (makes the mentor live) or **Reject** (deletes the application). Live badge on the tab shows the number of pending applications.

### 🏆 Gamification Engine
- **Reputation Points**: Earn points for answering, completing tests, and following your study plan.
- **Premium Badges**: Unlockable achievements (e.g., "Novice Solver", "Productivity Pro") with animated unlock ceremonies.
- **Leaderboards**: Subject-specific leaderboards to showcase top contributors.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Backend / DB / Auth | Firebase (Firestore, Authentication, Storage) |
| AI Engine | OpenRouter (Gemini 2.0 Flash) |
| Animations | Framer Motion |
| Styling | Vanilla CSS (Glassmorphism Design System) |
| Payments | Razorpay |
| Deployment | Vercel |

## 📂 Project Structure

```bash
src/
├── app/               # Next.js Routes & App Logic
│   ├── (app)/         # Protected app pages
│   │   ├── mentors/       # Mentor directory + smart ranking
│   │   ├── mentor-slots/  # Mentor availability manager (new)
│   │   ├── sessions/      # My sessions + rating flow (new)
│   │   └── admin/         # Admin dashboard + mentor approvals (new)
│   └── api/           # Backend API routes (AI, payments, cron)
├── components/        # Reusable UI & Layout Components
├── features/          # Domain-driven Modules
│   └── mentors/
│       ├── api.ts           # Slot CRUD, rating, approval APIs (new)
│       ├── recommendation/  # Heuristic scoring engine
│       └── components/
│           └── RateSessionModal.tsx  # Post-session rating modal (new)
├── lib/               # Shared Utilities & Firebase Config
└── styles/            # Core CSS & Design Tokens
```

## 🏁 How to Judge / Test

1. **Sign Up / Login**: Use the demo accounts below or create a new account.
2. **Post a Doubt**: Go to "Ask Doubt" — see AI first-response in action.
3. **Browse Mentors**: View ranked mentor cards with match scores and "Why recommended?" breakdowns.
4. **Book a Session**: Pick a mentor slot — the booking is race-condition safe.
5. **Rate a Session**: After a session completes, the "Rate this session" button appears for the student.
6. **Mentor Onboarding**: Apply as a mentor → auto-redirected to "My Slots" to add availability.
7. **Admin Controls**: Login as admin → see the Mentors tab with pending approval queue.
8. **Productivity**: Generate an AI study plan based on your doubt and test history.

### 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Student | `demo.student@skillsbridge.app` | `Demo@1234` |
| Mentor | `demo.mentor@skillsbridge.app` | `Demo@1234` |
| Admin | `demo.admin@skillsbridge.app` | `Admin@1234` |

> Run the `/seed` page after login to populate demo mentors and doubt feed if the database is empty.

---

Built with ❤️ for the **Modern Student**.
📄 [Judge's Presentation Guide](./HACKATHON_PRESENTATION.md)
