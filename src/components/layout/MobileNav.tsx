'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquarePlus, Calendar, BookOpenCheck, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Ask', href: '/ask', icon: MessageSquarePlus },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Sessions', href: '/sessions', icon: Calendar },
  { name: 'Tests', href: '/tests', icon: BookOpenCheck },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-50 flex items-center justify-around px-2 pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1",
              isActive ? "text-brand-500" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "fill-current/20")} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
