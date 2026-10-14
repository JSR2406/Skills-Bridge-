// ── FEATURE: Pricing — Domain types
// The plan catalogue is static data (`plans.ts`); only the *selected* plan is
// persisted, on `users/{uid}.plan`.

export type PlanAudience = 'student' | 'mentor';

export type PlanId =
  // student tiers
  | 'free'
  | 'pro'
  | 'campus'
  // mentor tiers
  | 'starter'
  | 'pro_mentor'
  | 'partner';

export interface PlanFeature {
  label: string;
  /** Tri-state availability: yes / no / text (e.g. "3 / month"). */
  value: string | boolean;
}

export interface Plan {
  id: PlanId;
  audience: PlanAudience;
  name: string;
  tagline: string;
  /** Monthly price in INR. 0 = free tier. */
  priceMonthly: number;
  /** Rendered under the price when `priceMonthly` is 0. */
  priceNote?: string;
  /** Payout retained by SkillBridge for mentor tiers, e.g. 0.85 = 85%. */
  payoutRate?: number;
  highlight?: string;
  cta: string;
  /** Paid tiers are not purchasable yet — see `checkoutReady` below. */
  paid: boolean;
  features: PlanFeature[];
}

export interface PlanComparisonRow {
  label: string;
  /** Keyed by `PlanId`; missing key = not offered. */
  values: Partial<Record<PlanId, string | boolean>>;
  hint?: string;
}

export interface PricingFaq {
  question: string;
  answer: string;
}

/** `users/{uid}.plan` — which tier the user is on. */
export type UserPlan = PlanId;