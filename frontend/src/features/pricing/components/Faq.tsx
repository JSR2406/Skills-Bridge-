'use client';

// ── FEATURE: Pricing — Faq
// Single-open accordion. Native <details> keeps it accessible for free.
import { ChevronDown } from 'lucide-react';
import type { PricingFaq } from '../types';

interface FaqProps {
  items: PricingFaq[];
}

export function Faq({ items }: FaqProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl px-5 py-4 transition-colors"
          style={{
            background: 'rgba(19,27,46,0.55)',
            border: '1px solid rgba(79,219,200,0.08)',
          }}
        >
          <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-[14px] font-bold text-[#dae2fd] hover:text-[#4fdbc8] transition-colors">
            {item.question}
            <ChevronDown className="w-4 h-4 shrink-0 text-[#8899b8] transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="text-[13px] text-[#8899b8] leading-relaxed mt-3">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}