'use client';

// ── FEATURE: Pricing — PlanCard
// One tier. Renders either as the user's current plan, as a selectable free
// tier, or as a paid tier whose checkout is not wired up yet.
import { Check, Minus, Sparkles, IndianRupee } from 'lucide-react';
import type { Plan } from '../types';
import { cn } from '@/lib/utils';

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  isBusy: boolean;
  onSelect: (plan: Plan) => void;
}

export function PlanCard({ plan, isCurrent, isBusy, onSelect }: PlanCardProps) {
  const isHighlighted = Boolean(plan.highlight);

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl p-6 sm:p-7 transition-all duration-300',
        isCurrent
          ? 'bg-[rgba(79,219,200,0.06)] border-[rgba(79,219,200,0.3)] shadow-[0_0_32px_rgba(79,219,200,0.08)]'
          : isHighlighted
            ? 'bg-[rgba(221,183,255,0.05)] border-[rgba(221,183,255,0.25)]'
            : 'bg-[rgba(19,27,46,0.6)] border-[rgba(255,255,255,0.06)]',
      )}
    >
      {plan.highlight && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
          style={{
            background: 'linear-gradient(135deg, #4fdbc8 0%, #2ec4b6 100%)',
            color: '#00201c',
            boxShadow: '0 0 16px rgba(79,219,200,0.3)',
          }}
        >
          <Sparkles className="w-3 h-3" />
          {plan.highlight}
        </span>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h3
          className="text-xl font-extrabold text-[#dae2fd]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {plan.name}
        </h3>
        {isCurrent && (
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
            style={{
              background: 'rgba(79,219,200,0.12)',
              border: '1px solid rgba(79,219,200,0.25)',
              color: '#4fdbc8',
            }}
          >
            Your plan
          </span>
        )}
      </div>

      <p className="text-[13px] text-[#8899b8] mt-1.5 leading-relaxed min-h-[40px]">
        {plan.tagline}
      </p>

      <div className="mt-5 flex items-baseline gap-1">
        {plan.priceMonthly === 0 ? (
          <span
            className="text-4xl font-extrabold text-[#dae2fd]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            ₹0
          </span>
        ) : (
          <>
            <IndianRupee className="w-6 h-6 text-[#4fdbc8]" />
            <span
              className="text-4xl font-extrabold text-[#dae2fd]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {plan.priceMonthly.toLocaleString('en-IN')}
            </span>
          </>
        )}
        {plan.priceMonthly > 0 && <span className="text-sm text-[#8899b8] ml-1">/ month</span>}
      </div>
      <p className="text-[11px] text-[#8899b8]/80 mt-1">
        {plan.priceNote ?? (plan.priceMonthly > 0 ? 'Billed monthly · cancel anytime' : '')}
      </p>

      {plan.payoutRate && (
        <p className="text-[11px] font-semibold text-[#4fdbc8] mt-2">
          You keep {Math.round(plan.payoutRate * 100)}% of every session fee
        </p>
      )}

      <button
        onClick={() => onSelect(plan)}
        disabled={isCurrent || isBusy || plan.paid}
        className={cn(
          'w-full mt-6 py-3 rounded-xl text-sm font-bold transition-all duration-200',
          isCurrent && 'cursor-default',
          plan.paid && !isCurrent && 'cursor-not-allowed opacity-60',
          !isCurrent && !plan.paid && 'hover:-translate-y-0.5',
        )}
        style={
          isCurrent
            ? { background: 'rgba(79,219,200,0.08)', border: '1px solid rgba(79,219,200,0.2)', color: '#4fdbc8' }
            : plan.paid
              ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8899b8' }
              : { background: 'linear-gradient(135deg, #4fdbc8 0%, #2ec4b6 100%)', color: '#00201c' }
        }
        title={plan.paid ? 'Paid upgrades are not available yet' : undefined}
      >
        {isBusy ? 'Switching…' : isCurrent ? 'Your current plan' : plan.paid ? 'Coming soon' : plan.cta}
      </button>

      {plan.paid && (
        <p className="text-[10px] text-[#8899b8]/70 text-center mt-2">
          Card checkout isn&apos;t connected yet — no charge has been made.
        </p>
      )}

      <ul className="mt-6 pt-6 space-y-3 border-t border-[rgba(255,255,255,0.05)]">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2.5">
            {feature.value === true ? (
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#4fdbc8]" />
            ) : feature.value === false ? (
              <Minus className="w-4 h-4 shrink-0 mt-0.5 text-[#8899b8]/40" />
            ) : (
              <span className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ddb7ff]" />
              </span>
            )}
            <span className="text-[13px] leading-relaxed text-[#c8d4f0]">{feature.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}