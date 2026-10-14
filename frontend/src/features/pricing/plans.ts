// ── FEATURE: Pricing — plan catalogue
// Single source of truth for every number shown on /pricing. Prices are INR per
// month. Mentor `payoutRate` is the share of a session fee that reaches the
// mentor after SkillBridge's cut.
import type { Plan, PlanAudience, PlanComparisonRow, PlanId, PricingFaq } from './types';

export const STUDENT_PLANS: Plan[] = [
  {
    id: 'free',
    audience: 'student',
    name: 'Explorer',
    tagline: 'Everything you need to get unstuck.',
    priceMonthly: 0,
    priceNote: 'Free forever · no card needed',
    cta: 'Choose Explorer',
    paid: false,
    features: [
      { label: 'Doubt feed & community answers', value: true },
      { label: 'AI doubt answers', value: '3 / day' },
      { label: 'Deep-reasoning answers (shows its work)', value: false },
      { label: 'AI practice tests', value: '1 / month' },
      { label: 'AI 24h study plan', value: false },
      { label: 'Mentor matching', value: 'Basic' },
      { label: 'Mentor sessions', value: 'Pay per session' },
      { label: 'Leaderboard & badges', value: true },
    ],
  },
  {
    id: 'pro',
    audience: 'student',
    name: 'Scholar',
    tagline: 'For the semester you actually want to top.',
    priceMonthly: 299,
    highlight: 'Most popular',
    cta: 'Upgrade to Scholar',
    paid: true,
    features: [
      { label: 'Doubt feed & community answers', value: true },
      { label: 'AI doubt answers', value: 'Unlimited' },
      { label: 'Deep-reasoning answers (shows its work)', value: true },
      { label: 'AI practice tests', value: 'Unlimited' },
      { label: 'AI 24h study plan', value: true },
      { label: 'Mentor matching', value: 'Personalised' },
      { label: 'Mentor sessions', value: 'Pay per session' },
      { label: 'Leaderboard & badges', value: true },
    ],
  },
  {
    id: 'campus',
    audience: 'student',
    name: 'Campus',
    tagline: 'Everything in Scholar, plus two 1-on-1s a month.',
    priceMonthly: 599,
    cta: 'Upgrade to Campus',
    paid: true,
    features: [
      { label: 'Doubt feed & community answers', value: true },
      { label: 'AI doubt answers', value: 'Unlimited' },
      { label: 'Deep-reasoning answers (shows its work)', value: true },
      { label: 'AI practice tests', value: 'Unlimited' },
      { label: 'AI 24h study plan', value: true },
      { label: 'Mentor matching', value: 'Personalised + priority' },
      { label: 'Mentor sessions', value: '2 included / month' },
      { label: 'Leaderboard & badges', value: true },
    ],
  },
];

export const MENTOR_PLANS: Plan[] = [
  {
    id: 'starter',
    audience: 'mentor',
    name: 'Starter',
    tagline: 'Start earning from what you already know.',
    priceMonthly: 0,
    priceNote: 'Free forever',
    payoutRate: 0.85,
    cta: 'Choose Starter',
    paid: false,
    features: [
      { label: 'Mentor profile & subjects', value: true },
      { label: 'Availability slots', value: '3 active' },
      { label: 'Payout per session', value: '85%' },
      { label: 'Placement in mentor search', value: 'Standard' },
      { label: 'Session analytics', value: 'Basic' },
      { label: 'Verified badge', value: false },
      { label: 'Group sessions', value: false },
    ],
  },
  {
    id: 'pro_mentor',
    audience: 'mentor',
    name: 'Pro Mentor',
    tagline: 'More slots, better placement, higher payout.',
    priceMonthly: 999,
    highlight: 'Most popular',
    payoutRate: 0.95,
    cta: 'Upgrade to Pro Mentor',
    paid: true,
    features: [
      { label: 'Mentor profile & subjects', value: true },
      { label: 'Availability slots', value: 'Unlimited' },
      { label: 'Payout per session', value: '95%' },
      { label: 'Placement in mentor search', value: 'Priority' },
      { label: 'Session analytics', value: 'Full' },
      { label: 'Verified badge', value: true },
      { label: 'Group sessions', value: false },
    ],
  },
  {
    id: 'partner',
    audience: 'mentor',
    name: 'Campus Partner',
    tagline: 'For departments and student bodies at scale.',
    priceMonthly: 2499,
    payoutRate: 0.95,
    cta: 'Talk to us',
    paid: true,
    features: [
      { label: 'Mentor profile & subjects', value: true },
      { label: 'Availability slots', value: 'Unlimited' },
      { label: 'Payout per session', value: '95%' },
      { label: 'Placement in mentor search', value: 'Priority' },
      { label: 'Session analytics', value: 'Full + export' },
      { label: 'Verified badge', value: true },
      { label: 'Group sessions', value: true },
    ],
  },
];

export const PLANS: Plan[] = [...STUDENT_PLANS, ...MENTOR_PLANS];

export const PLANS_BY_AUDIENCE: Record<PlanAudience, Plan[]> = {
  student: STUDENT_PLANS,
  mentor: MENTOR_PLANS,
};

/** The tier a brand-new account starts on. */
export const DEFAULT_PLAN: Record<PlanAudience, PlanId> = {
  student: 'free',
  mentor: 'starter',
};

export function getPlan(id: PlanId | undefined | null): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Free tiers are selectable; paid tiers need a billing integration. */
export function isPlanCheckoutReady(plan: Plan): boolean {
  return !plan.paid;
}

export const STUDENT_COMPARISON: PlanComparisonRow[] = [
  { label: 'Doubt feed & community answers', values: { free: true, pro: true, campus: true } },
  { label: 'AI doubt answers per day', values: { free: '3', pro: 'Unlimited', campus: 'Unlimited' } },
  {
    label: 'Deep reasoning (shows its work + self-check)',
    values: { free: false, pro: true, campus: true },
    hint: 'Longer, self-verified answers from the AI tutor.',
  },
  { label: 'AI practice tests', values: { free: '1 / month', pro: 'Unlimited', campus: 'Unlimited' } },
  { label: 'AI 24h study plan', values: { free: false, pro: true, campus: true } },
  { label: 'Mentor matching', values: { free: 'Basic', pro: 'Personalised', campus: 'Priority' } },
  {
    label: 'Included mentor sessions',
    values: { free: '—', pro: '—', campus: '2 / month' },
    hint: 'Extra sessions are always bookable per-session.',
  },
  { label: 'Max session fee filter', values: { free: true, pro: true, campus: true } },
  { label: 'Leaderboard & badges', values: { free: true, pro: true, campus: true } },
];

export const MENTOR_COMPARISON: PlanComparisonRow[] = [
  { label: 'Mentor profile & subjects', values: { starter: true, pro_mentor: true, partner: true } },
  { label: 'Active availability slots', values: { starter: '3', pro_mentor: 'Unlimited', partner: 'Unlimited' } },
  {
    label: 'Payout per paid session',
    values: { starter: '85%', pro_mentor: '95%', partner: '95%' },
    hint: 'The remainder covers platform hosting, payments and support.',
  },
  { label: 'Placement in mentor search', values: { starter: 'Standard', pro_mentor: 'Priority', partner: 'Priority' } },
  { label: 'Session analytics', values: { starter: 'Basic', pro_mentor: 'Full', partner: 'Full + export' } },
  { label: 'Verified badge', values: { starter: false, pro_mentor: true, partner: true } },
  { label: 'Group sessions', values: { starter: false, pro_mentor: false, partner: true } },
];

export const PRICING_FAQ: PricingFaq[] = [
  {
    question: 'Do I need a card for the free tier?',
    answer:
      'No. The Explorer and Starter tiers need no payment method and have no time limit — they are the default for every new account.',
  },
  {
    question: 'How does mentor session pricing work?',
    answer:
      'Each mentor sets a fee per availability slot. You pay only for sessions you book, through Razorpay, and the mentor keeps the share shown on their tier (85% on Starter, 95% on Pro Mentor and Campus Partner).',
  },
  {
    question: 'Are mentor sessions included in a student plan?',
    answer:
      'Only Campus includes two 1-on-1 sessions per month. Every other tier books sessions individually, so you only ever pay for guidance you actually use.',
  },
  {
    question: 'Can I cancel or switch tiers?',
    answer:
      'Yes. Switch tiers any time from this page — your selection is saved to your profile immediately and there is no lock-in period.',
  },
  {
    question: 'What exactly does "deep reasoning" change?',
    answer:
      'Deep-reasoning answers show the reasoning chain, a worked example, a self-check and a calibrated confidence level before you accept the answer, instead of only the final steps. They take a little longer and use more tokens, which is why they sit behind the paid tiers.',
  },
  {
    question: 'Is payment processing secure?',
    answer:
      'Card details never touch our servers. Razorpay handles checkout and we verify the payment signature server-side before a booking is confirmed.',
  },
];