'use client';

import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileNav } from './MobileNav';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PageTransition } from '../shared/PageTransition';
import { BadgeManager } from '@/features/reputation/components/BadgeManager';


export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isCallPage = pathname.startsWith('/call/');

  // Call page gets full viewport — no sidebar, header, or padding
  if (isCallPage) {
    return <>{children}</>;
  }

  // Messages page needs full height — skip inner container padding
  const isMessagesPage = pathname === '/messages';

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <TopHeader />
        <main className={isMessagesPage ? 'flex-1 overflow-hidden w-full pb-16 md:pb-0' : 'flex-1 overflow-y-auto w-full pb-16 md:pb-0'}>
          {isMessagesPage ? (
            <div className="h-full p-4 md:p-6">
              <PageTransition>{children}</PageTransition>
            </div>
          ) : (
            <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
              <PageTransition>{children}</PageTransition>
            </div>
          )}
        </main>
        <MobileNav />
        <BadgeManager />
      </div>
    </div>
  );
}
