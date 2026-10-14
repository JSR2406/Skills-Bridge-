'use client';

// ── APP: /pricing
// Plan catalogue for both audiences. The selected tier is persisted on
// `users/{uid}.plan`; paid tiers are shown but not purchasable yet (no
// Razorpay subscription flow) — see `features/pricing/plans.ts`.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { setUserPlan, getUserPlan } from '@/features/pricing/api';
import {
  DEFAULT_PLAN,
  MENTOR_COMPARISON,
  PLANS_BY_AUDIENCE,
  PRICING_FAQ,
  STUDENT_COMPARISON,
  getPlan,
} from '@/features/pricing/plans';
import type { Plan, PlanAudience, PlanId } from '@/features/pricing/types';
import { PlanCard } from '@/features/pricing/components/PlanCard';
import { ComparisonTable } from '@/features/pricing/components/ComparisonTable';
import { Faq } from '@/features/pricing/components/Faq';
import { cn } from '@/lib/utils';

const AUDIENCE_TABS: { id: PlanAudience; label: string; icon: typeof GraduationCap; blurb: string }[] = [
  {
    id: 'student',
    label: 'For students',
    icon: GraduationCap,
    blurb: 'Get unstuck faster with the AI tutor, and save when you need a human.',
  },
  {
    id: 'mentor',
    label: 'For mentors',
    icon: Users,
    blurb: 'Turn your know-how into paid 1-on-1 sessions and build your reputation.',
  },
];

export default function PricingPage() {
  const { profile } = useAuth();
  const uid = profile?.uid;

  // A mentor account reads as a mentor even before `role` finishes loading.
  const initialAudience: PlanAudience = profile?.role === 'mentor' ? 'mentor' : 'student';
  const [audience, setAudience] = useState<PlanAudience>(initialAudience);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    if (profile?.role === 'mentor') setAudience('mentor');
    else if (profile?.role === 'student') setAudience('student');
  }, [profile?.role]);

  // Until the profile resolves we don't know which tier the user is on; fall
  // back to the audience default so the page never flashes "no plan selected".
  const activePlanId = currentPlan ?? DEFAULT_PLAN[audience];

  useEffect(() => {
    if (!uid) {
      setCurrentPlan(null);
      return;
    }
    let cancelled = false;
    getUserPlan(uid, profile?.role === 'mentor' ? 'mentor' : 'student')
      .then((planId) => {
        if (!cancelled) setCurrentPlan(planId);
      })
      .catch((err) => {
        console.warn('[pricing] could not read the saved plan:', err);
        if (!cancelled) setCurrentPlan(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, profile?.role]);

  const plans = PLANS_BY_AUDIENCE[audience];
  const comparison = audience === 'student' ? STUDENT_COMPARISON : MENTOR_COMPARISON;

  // The stored tier belongs to one audience — don't imply the other one is active.
  const storedPlan = getPlan(activePlanId);
  const storedAudience = storedPlan?.audience ?? audience;
  const isViewingOwnPlan = storedPlan?.audience === audience;

  const handleSelect = useCallback(
    async (plan: Plan) => {
      if (!uid) {
        toast.error('Sign in to change your plan.');
        return;
      }
      if (plan.paid) {
        toast.info('Paid upgrades aren’t live yet — Razorpay subscriptions still need wiring up. No charge was made.');
        return;
      }

      setBusyPlan(plan.id);
      try {
        const saved = await setUserPlan(uid, plan.id);
        setCurrentPlan(saved);
        toast.success(`You’re now on ${getPlan(saved)?.name ?? saved}.`);
      } catch (err) {
        console.error('[pricing] could not save plan:', err);
        toast.error('Could not save your plan. Please try again.');
      } finally {
        setBusyPlan(null);
      }
    },
    [uid],
  );

  return (
    <div className="max-w-6xl mx-auto space-y-14 animate-fade-in pb-20 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-72 bg-gradient-to-b from-[#ddb7ff]/10 to-transparent blur-[90px] rounded-full pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="relative z-10 text-center pt-6">
        <div className="inline-flex items-center gap-2 mb-4 text-[#4fdbc8] font-bold text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          Pricing
        </div>
        <h1
          className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#dae2fd]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Pay for what you actually use
        </h1>
        <p className="text-[15px] text-[#8899b8] mt-4 leading-relaxed max-w-2xl mx-auto">
          The AI tutor, doubt feed and practice tests are free forever. Upgrade when you want deeper
          answers, or start earning if you&apos;re here to teach.
        </p>

        {/* Audience tabs */}
        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl mt-8"
          style={{ background: 'rgba(19,27,46,0.7)', border: '1px solid rgba(79,219,200,0.1)' }}
        >
          {AUDIENCE_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAudience(id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200',
                audience === id
                  ? 'text-[#00201c]'
                  : 'text-[#8899b8] hover:text-[#dae2fd]',
              )}
              style={
                audience === id
                  ? { background: 'linear-gradient(135deg, #4fdbc8 0%, #2ec4b6 100%)' }
                  : undefined
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <p className="text-[13px] text-[#8899b8] mt-4">
          {AUDIENCE_TABS.find((t) => t.id === audience)?.blurb}
        </p>
      </div>

      {/* ── Current plan ──
          The stored plan belongs to one audience. When the user is browsing the
          other audience we say so instead of implying the wrong tier is active. */}
      <div
        className="flex flex-wrap items-center justify-center gap-3 rounded-xl px-5 py-3.5 mx-auto max-w-2xl relative z-10"
        style={{ background: 'rgba(79,219,200,0.05)', border: '1px solid rgba(79,219,200,0.15)' }}
      >
        <ShieldCheck className="w-4 h-4 text-[#4fdbc8]" />
        {isViewingOwnPlan ? (
          <span className="text-sm text-[#dae2fd]">
            You&apos;re on{' '}
            <strong className="text-[#4fdbc8]">{getPlan(activePlanId)?.name}</strong>
            <span className="text-[#8899b8]"> · saved to your profile</span>
          </span>
        ) : (
          <span className="text-sm text-[#8899b8]">
            Your plan is{' '}
            <strong className="text-[#4fdbc8]">{getPlan(activePlanId)?.name}</strong> (a{' '}
            {storedAudience} plan) — switch to the {storedAudience} tab to manage it.
          </span>
        )}
      </div>

      {/* ── Plan cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start relative z-10">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === activePlanId}
            isBusy={busyPlan === plan.id}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* ── Comparison ── */}
      <section className="space-y-5 relative z-10">
        <div>
          <h2
            className="text-2xl font-extrabold tracking-tight text-[#dae2fd]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Compare every feature
          </h2>
          <p className="text-sm text-[#8899b8] mt-1.5">
            No hidden limits — everything each tier includes, in one table.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-2 sm:p-6 overflow-hidden">
          <ComparisonTable plans={plans} rows={comparison} />
        </div>
      </section>

      {/* ── Mentor economics note ── */}
      <section
        className="rounded-2xl p-6 sm:p-8 relative z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(79,219,200,0.07) 0%, rgba(221,183,255,0.05) 100%)',
          border: '1px solid rgba(79,219,200,0.15)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3
              className="text-lg font-extrabold text-[#dae2fd] mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              How mentor payouts work
            </h3>
            <p className="text-[13px] text-[#8899b8] leading-relaxed">
              Mentors set their own per-session fee. SkillBridge keeps a small platform share so
              hosting, payments and support stay free to run — you keep{' '}
              <strong className="text-[#4fdbc8]">85%</strong> on Starter and{' '}
              <strong className="text-[#4fdbc8]">95%</strong> once you upgrade. Payouts settle after
              each session completes.
            </p>
          </div>
          <Link
            href={audience === 'mentor' ? '/apply-mentor' : '/mentors'}
            className="btn-gradient shrink-0 px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center gap-2"
          >
            {audience === 'mentor' ? 'Apply as a mentor' : 'Browse mentors'}
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="space-y-5 relative z-10">
        <div>
          <h2
            className="text-2xl font-extrabold tracking-tight text-[#dae2fd]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Questions, answered
          </h2>
        </div>
        <Faq items={PRICING_FAQ} />
      </section>
    </div>
  );
}