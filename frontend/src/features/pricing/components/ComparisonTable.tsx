'use client';

// ── FEATURE: Pricing — ComparisonTable
// Side-by-side feature matrix for the three tiers of one audience.
import { Check, Info, Minus } from 'lucide-react';
import type { Plan, PlanComparisonRow } from '../types';

interface ComparisonTableProps {
  plans: Plan[];
  rows: PlanComparisonRow[];
}

function renderValue(value: string | boolean | undefined) {
  if (value === undefined) return <Minus className="w-4 h-4 mx-auto text-[#8899b8]/30" />;
  if (value === true) return <Check className="w-4 h-4 mx-auto text-[#4fdbc8]" />;
  if (value === false) return <Minus className="w-4 h-4 mx-auto text-[#8899b8]/30" />;
  return <span className="text-[13px] font-semibold text-[#dae2fd]">{value}</span>;
}

export function ComparisonTable({ plans, rows }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="text-left py-4 pr-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8899b8]/70">
              Feature
            </th>
            {plans.map((plan) => (
              <th key={plan.id} className="py-4 px-3 text-center">
                <span className="block text-sm font-extrabold text-[#dae2fd]">{plan.name}</span>
                <span className="block text-[11px] text-[#8899b8] mt-0.5">
                  {plan.priceMonthly === 0 ? 'Free' : `₹${plan.priceMonthly.toLocaleString('en-IN')}/mo`}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label} style={{ background: i % 2 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
              <td className="py-3.5 pr-4 text-[13px] text-[#c8d4f0]">
                <span className="inline-flex items-center gap-1.5">
                  {row.label}
                  {row.hint && (
                    <span title={row.hint} className="cursor-help text-[#8899b8]/50">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  )}
                </span>
              </td>
              {plans.map((plan) => (
                <td key={plan.id} className="py-3.5 px-3 text-center">
                  {renderValue(row.values[plan.id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}