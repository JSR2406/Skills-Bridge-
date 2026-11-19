# SkillBridge Final QA Report — Static Review

**Repository:** [JSR2406/Skills-Bridge-](https://github.com/JSR2406/Skills-Bridge-)  
**Reviewed revision:** `560133aa98840bf1b0f6a1707df8a4f150f3643f` (`main`)  
**Report date:** 2026-11-19  
**Review type:** Repository/source review against the supplied SB-01…SB-14 QA plan  
**Execution status:** No app commands, browser tests, emulator tests, payment tests, AI evaluations, or performance measurements were run. All test cases remain **Not Run**.

## 1. Executive summary

The repository contains implementations for most planned product areas. Source presence is not runtime verification. QA execution and evidence collection remain outstanding.

Static inspection identified candidate concerns requiring controlled verification:

1. **Potential privilege escalation:** Firestore rules allow users to write their own entire user document, while the admin check reads `role` from that document.
2. **Broad Firestore write permissions:** Several collection rules permit authenticated updates/writes without narrowly restricting fields or related records.
3. **Rating consistency:** Rating aggregate and booking updates occur in a transaction, followed by a separate rating-document write; the rules reviewed have no `mentorRatings` match.
4. **Payment validation:** Order creation accepts request-provided amount/currency. Signature verification returns a result but the route itself does not visibly update a booking or bind the order to a booking.
5. **Mentor approval mismatch:** The application API auto-approves mentor profiles although admin approval functions also exist.
6. **Emulator setup:** Firebase config is located at `backend/config/firebase.json`; emulator instructions should identify that config path rather than assume the frontend directory has it.

These are **static-review concerns, not runtime-confirmed defects**. Validate them in an isolated emulator/test environment before making final defect determinations.

## 2. Scope and method

Reviewed repository files, selected frontend routes/APIs, Firebase configuration and Firestore rules. No installation, scripts, deployments, external service calls, or interactive tests were executed. Consequently, this report contains no Pass results, screenshots, runtime logs, API captures, or measured performance data.

The frontend package defines `build`, `lint`, and `test` (Vitest) scripts. The repository inventory reviewed did not show test files. See [frontend/package.json](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/package.json).

## 3. Execution summary

| Test group | Executed | Status |
|---|---:|---|
| SB-01 Auth | 0 | Not Run |
| SB-02 AI doubt solver | 0 | Not Run |
| SB-03 Peer doubts | 0 | Not Run |
| SB-04 Study planner | 0 | Not Run |
| SB-05 Practice tests | 0 | Not Run |
| SB-06 Mentor ranking | 0 | Not Run |
| SB-07 Booking | 0 | Not Run |
| SB-08 Razorpay | 0 | Not Run |
| SB-09 Sessions/ratings | 0 | Not Run |
| SB-10 Admin | 0 | Not Run |
| SB-11 Gamification | 0 | Not Run |
| SB-12 Notifications | 0 | Not Run |
| SB-13 Firestore rules | 0 | Not Run |
| SB-14 Compatibility/performance | 0 | Not Run |
| AI evaluation | 0 | Not Run |
| Automated checks | 0 | Not Run |

## 4. Candidate findings for verification

| ID | Suggested severity | Candidate concern | Repository evidence | Follow-up |
|---|---|---|---|---|
| SB-SEC-01 | Critical | Users may be able to set privileged fields in their own profile; admin checks trust the profile role. | [Firestore rules, user/admin helpers](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/backend/config/firestore.rules#L13-L21) | Emulator test: authenticated user attempts to change own role to admin. Restrict role updates to trusted server/admin paths. Do not treat as confirmed until reproduced. |
| SB-SEC-02 | High | Broad write conditions may allow unauthorized changes to doubts, answers, notifications, tests, slots, or bookings. | [Firestore rules](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/backend/config/firestore.rules#L24-L79) | Add emulator rule tests for cross-user edits, forged fields and invalid record relationships; narrow update fields and ownership constraints. |
| SB-RATE-01 | High | Rating aggregate/booking changes may persist even if the subsequent rating record write fails; no `mentorRatings` match was found in the inspected rules. | [Rating API](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/mentors/api.ts#L397-L434), [rules](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/backend/config/firestore.rules#L75-L79) | Test rating creation and partial failure. Add appropriate rules and consider atomic writes. |
| SB-PAY-01 | High | Order amount/currency are supplied by request; verification route does not visibly persist payment state or bind signature to an authorized booking. | [Create order](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app/api/razorpay/create-order/route.ts#L7-L28), [verify](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app/api/razorpay/verify/route.ts#L7-L29) | In Razorpay test mode, verify authentication, server-calculated amount, booking binding, invalid fields/signatures, replay handling and persisted state. |
| SB-MENTOR-01 | High | Mentor application sets `mentorApproved: true`, differing from a pending admin approval workflow. | [Mentor API](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/mentors/api.ts#L59-L90) | Confirm intended behavior; if approval is required, use pending status and restrict admin actions. |
| SB-AUTH-01 | Medium | Email/password registration scenarios do not match the current registration page, which reuses login and describes Google OAuth MVP flow. | [Register page](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app/%28auth%29/register/page.tsx#L1-L10) | Test the implemented Google flow unless email/password registration is added. |
| SB-AI-01 | Medium | Prompt-injection resistance is not demonstrated by the inspected code. | [AI doubt route](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app/api/ai/doubt/route.ts#L10-L22) | Evaluate against fixed adversarial cases and record outputs; do not infer a Pass from static inspection. |
| SB-SETUP-01 | Medium | Emulator command may not find Firebase config when run from frontend. | [Firebase config](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/backend/config/firebase.json) | Start CLI with working directory/config path explicitly set to `backend/config/firebase.json`; verify project/emulator targets. |
| SB-SETUP-02 | Low | Audit output path may fail if `test-reports` does not exist. | No report directory in reviewed repository inventory. | Create directory before writing audit output and capture command exit status. |

## 5. Chapter 5 — Testing and evaluation

### 5.1 Implementation mapping and execution needs

| Area | Implementation located | QA note |
|---|---|---|
| Auth | Auth routes/features and Firebase Auth setup | Registration reuses login; test Google auth and role enforcement. |
| AI doubt solver | `/api/ai/doubt`, OpenRouter and validation utilities | Test input/provider errors and evaluate quality/injection resistance empirically. |
| Peer doubts | Doubt/answer features and feed pages | Test ownership and unauthorized updates; rules are broad for updates. |
| Study planner | Productivity feature and generate API | Test generation, persistence, task state and failure handling. |
| Practice tests | Tests feature and generate-test API | Test schema, answer validation, scoring and attempt isolation. |
| Mentor ranking | Deterministic scorer | Weights match 40/25/20/10/5 in source; sorting, ties and boundaries remain untested. [Scorer](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/mentors/recommendation/scorer.ts#L25-L38) |
| Booking | Mentor API uses Firestore transaction | Test races and rules enforce booking/slot relationships. [Booking API](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/mentors/api.ts#L175-L223) |
| Razorpay | Create-order and verify routes; server client | Test only with sandbox keys; verify trusted amount and booking/payment binding. |
| Sessions/ratings | Session pages, rating modal/API, Jitsi integration | Rating rules and consistency require emulator testing. |
| Admin | Admin page and mentor approval functions | Verify authorization; auto-approval differs from pending-review expectation. |
| Gamification | Reputation, badges and leaderboard features | Test idempotency, ownership and persistence. |
| Notifications | Notification API, push subscription, cron reminder route | Test ownership, invalid subscriptions, schedule and duplicate prevention. |
| Firestore rules | `backend/config/firestore.rules` | Prioritize role and cross-user emulator tests. |
| Compatibility/performance | Responsive app routes and layout | Requires actual browser/device execution and measurement. |

### 5.2 Automated checks

TypeScript, lint, build, audit, and Vitest were not executed. Include `npm test` in the verification run. Create `test-reports` first, record Node/npm versions, capture each exit code, and preserve logs. Do not report a command as successful without its output.

### 5.3 Functional, AI, and performance results

- Browser tests: **Not Run**; no screenshots or logs.
- AI evaluation: **Not Run**; no fixed-dataset outputs or scores.
- Performance: **Not Run**; no environment, sample count, median or p95.
- Payment testing: **Not Run**; no sandbox transactions.
- Firestore rules testing: **Not Run**; no emulator result.

## 6. Traceability matrix

| Requirement | Implementation reference | Test case | Evidence |
|---|---|---|---|
| Auth | [Auth routes](https://github.com/JSR2406/Skills-Bridge-/tree/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app) | SB-01 | Source reviewed; runtime evidence absent |
| AI doubt solver | [AI doubt API](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app/api/ai/doubt/route.ts) | SB-02, AI evaluation | Source reviewed; cases not run |
| Peer doubts | [Doubt feature](https://github.com/JSR2406/Skills-Bridge-/tree/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/doubts) | SB-03 | Source reviewed; runtime evidence absent |
| Productivity | [Productivity feature](https://github.com/JSR2406/Skills-Bridge-/tree/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/productivity) | SB-04 | Source reviewed; runtime evidence absent |
| Practice tests | [Tests feature](https://github.com/JSR2406/Skills-Bridge-/tree/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/tests) | SB-05 | Source reviewed; runtime evidence absent |
| Mentor ranking | [Scorer](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/mentors/recommendation/scorer.ts) | SB-06 | Weights inspected; tests not run |
| Booking/sessions | [Mentor API](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/mentors/api.ts) | SB-07, SB-09 | Source reviewed; runtime evidence absent |
| Payments | [Razorpay routes](https://github.com/JSR2406/Skills-Bridge-/tree/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app/api/razorpay) | SB-08 | Source reviewed; no sandbox evidence |
| Admin/mentor approval | [Admin page](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app/%28app%29/admin/page.tsx), [mentor API](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/mentors/api.ts) | SB-10 | Source reviewed; authorization untested |
| Gamification | [Reputation API](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/reputation/api.ts) | SB-11 | Source reviewed; runtime evidence absent |
| Notifications | [Notification feature](https://github.com/JSR2406/Skills-Bridge-/tree/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/features/notifications) | SB-12 | Source reviewed; runtime evidence absent |
| Firestore security | [Rules file](https://github.com/JSR2406/Skills-Bridge-/blob/560133aa98840bf1b0f6a1707df8f4a150f3643f/backend/config/firestore.rules) | SB-13 | Static review only |
| Compatibility/performance | [App routes](https://github.com/JSR2406/Skills-Bridge-/tree/560133aa98840bf1b0f6a1707df8f4a150f3643f/frontend/src/app) | SB-14 | No runtime evidence |

## 7. Recommended next steps

1. Verify and remediate user role/self-promotion risk.
2. Add Firestore emulator tests for cross-user writes, field restrictions and record relationships.
3. Validate rating and payment flows in isolated emulator/Razorpay test mode, including partial failures and retries.
4. Align mentor approval behavior with the intended workflow.
5. Correct emulator setup to use the backend Firebase config; create the test report output directory.
6. Run automated checks and browser cases, capturing tool versions, exit codes, logs, screenshots and actual status.
7. Complete the CSVs and evidence bundle only from executed tests. No `.docx`, screenshots, or runtime evidence are included in this static review.

**Conclusion:** Most planned feature areas have corresponding source files. QA remains unexecuted, and the candidate security/payment/rating concerns should be verified before the project is considered ready for final QA sign-off.
