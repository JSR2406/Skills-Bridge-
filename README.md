# 🌟 SkillBridge: Peer-to-Peer AI Learning Platform

SkillBridge is a modern ecosystem built for students to bridge the gap between doubts and mastery. It combines a vibrant peer-to-peer discussion feed with advanced AI tutoring and integrated mentorship.

**Live Demo**: [https://skillsbridge-jet.vercel.app/](https://skillsbridge-jet.vercel.app/)

## ✨ Key Features

### 🧠 AI Productivity & Study Module (NEW) 🚀
- **AI Study Plan Generator**: Analyzes your recent activities (Doubt history, Test scores, Mentor sessions) to generate custom 24-hour study priorities.
- **Smart Task Management**: Integrated scheduler that allows you to "Quick Add" follow-up tasks directly from AI answers or mentor slots.
- **Progress Tracking**: Real-time stats on tasks completed and subjects mastered.

### ❓ Smart Doubt Resolution
- **AI First-Response**: AI attempts to solve student doubts in under 5 seconds with structured explanations.
- **Peer Feed**: If the AI doesn't solve it, the doubt is published to a global community feed for peer resolution.
- **Verified Answers**: Authors can mark "Accepted" answers, awarding reputation to contributors.

### 🤝 Expert Mentorship
- **Direct Consultations**: Real-time messaging and video sessions with peer experts.
- **WebRTC Integration**: Seamless in-app calls using Jitsi Meet.
- **Mentor Reputation**: Mentors build trust through feedback and successfully resolved doubts.

### 🏆 Gamification Engine
- **Reputation Points**: Earn points for answering, completing tests, and following your study plan.
- **Premium Badges**: Unlockable achievements (e.g., "Novice Solver", "Productivity Pro") with animated unlock ceremonies.
- **Leaderboards**: Subject-specific leaderboards to showcase top contributors.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Backend / DB / Auth**: Firebase (Firestore, Authentication, Storage)
- **AI Engine**: OpenRouter (Gemini 2.0 Flash)
- **Animations**: Framer Motion
- **Styling**: Vanilla CSS (Modern Glassmorphism Design System)
- **Deployment**: Vercel

## 📂 Project Structure

```bash
src/
├── app/               # Next.js Routes & App Logic
├── components/        # Reusable UI & Layout Components
├── features/          # Domain-driven Modules (Auth, Doubts, Mentors, Productivity)
├── lib/               # Shared Utilities & Firebase Config
└── styles/            # Core CSS & Design Tokens
```

## 🏁 How to Judge / Test

1. **Sign Up / Login**: Use the "Demo Student" login or create a new account to see the **Multi-Step Onboarding**.
2. **Post a Doubt**: Go to "Ask Doubt" and type a question to see the AI analysis in action.
3. **Optimize Study**: Use the "Productivity" tab to generate your first AI Study Plan based on your interests.
4. **Complete Goals**: Complete a task to see the Reputation and Badge system respond.

---

Built with ❤️ for the **Modern Student**.
📄 [Judge's Presentation Guide](./HACKATHON_PRESENTATION.md)
