'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, MessageSquarePlus, Calendar, BookOpenCheck, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Planner', href: '/productivity', icon: Calendar },
  { name: 'Ask', href: '/ask', icon: MessageSquarePlus, special: true },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Tests', href: '/tests', icon: BookOpenCheck },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0b1326]/80 backdrop-blur-xl border-t border-[rgba(79,219,200,0.1)] z-50 flex items-center justify-around px-2 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        
        if (item.special) {
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative -top-3 flex items-center justify-center"
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-[0_8px_20px_rgba(79,219,200,0.3)]"
                style={{
                  background: 'linear-gradient(135deg, #4fdbc8, #2ec4b6)',
                  transform: isActive ? 'scale(1.1) translateY(-2px)' : 'scale(1)',
                }}
              >
                <item.icon className="w-6 h-6 text-[#00201c]" />
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-300",
              isActive ? "text-[#4fdbc8]" : "text-[#8899b8]"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="mobile-nav-indicator"
                className="absolute -top-1 w-8 h-1 bg-[#4fdbc8] rounded-full shadow-[0_0_10px_rgba(79,219,200,0.5)]"
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              />
            )}
            <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(79,219,200,0.3)]")} />
            <span className={cn("text-[9px] font-black uppercase tracking-tighter", isActive ? "opacity-100" : "opacity-60")}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

