'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { 
  Home, 
  MessageSquarePlus, 
  Users, 
  Calendar, 
  BookOpenCheck,
  Bell,
  Settings,
  ShieldAlert,
  Sparkles,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const NAV_ITEMS = [
  { name: 'Feed', href: '/feed', icon: Home },
  { name: 'Ask Doubt', href: '/ask', icon: MessageSquarePlus },
  { name: 'Mentors', href: '/mentors', icon: Users },
  { name: 'My Sessions', href: '/sessions', icon: Calendar },
  { name: 'Practice Tests', href: '/tests', icon: BookOpenCheck },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useAppStore();
  const { profile } = useAuth();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-30",
        "bg-[#0a1020] border-r",
        "border-[rgba(79,219,200,0.08)]",
        sidebarCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center shrink-0 border-b border-[rgba(79,219,200,0.08)]",
        sidebarCollapsed ? "justify-center px-0" : "px-5 gap-3"
      )}>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-[0_0_16px_rgba(79,219,200,0.4)]">
            <BookOpenCheck className="w-4 h-4 text-[#00201c]" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#ddb7ff] rounded-full border-2 border-[#0a1020]" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col leading-none">
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #4fdbc8 0%, #ddb7ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SkillBridge
            </span>
            <span className="text-[10px] text-[#4fdbc8]/50 font-medium tracking-wider uppercase mt-0.5">
              Peer Learning
            </span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] shadow-[inset_3px_0_0_#4fdbc8]"
                  : "text-[#8899b8] hover:bg-[rgba(79,219,200,0.05)] hover:text-[#dae2fd]"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px] shrink-0 transition-colors", isActive ? "text-[#4fdbc8]" : "")} />
              {!sidebarCollapsed && (
                <span className="font-medium text-[13px] tracking-wide">{item.name}</span>
              )}

              {/* Collapse tooltip */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1c2440] text-[#dae2fd] text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 z-50 whitespace-nowrap shadow-xl border border-[rgba(79,219,200,0.12)] transition-opacity">
                  {item.name}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1c2440]" />
                </div>
              )}
            </Link>
          );
        })}

        {/* Admin section */}
        {profile?.role === 'admin' && (
          <>
            <div className={cn("mt-5 mb-2", sidebarCollapsed ? "text-center" : "px-3")}>
              <span className="text-[10px] font-semibold text-[#8899b8]/60 uppercase tracking-[0.12em]">
                {!sidebarCollapsed ? 'Admin' : '···'}
              </span>
            </div>
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                pathname.startsWith('/admin')
                  ? "bg-[rgba(255,68,68,0.1)] text-[#ff4444] shadow-[inset_3px_0_0_#ff4444]"
                  : "text-[#8899b8] hover:bg-[rgba(255,68,68,0.05)] hover:text-[#ff6b6b]"
              )}
            >
              <ShieldAlert className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <span className="font-medium text-[13px] tracking-wide">Dashboard</span>}
            </Link>
          </>
        )}
      </div>

      {/* Bottom: User Profile */}
      {!sidebarCollapsed && profile && (
        <div className="p-3 border-t border-[rgba(79,219,200,0.08)]">
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[rgba(79,219,200,0.05)] transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-purple-600 flex items-center justify-center text-[#00201c] text-xs font-bold shrink-0 overflow-hidden">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                : profile.name?.charAt(0) || 'U'
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[#dae2fd] truncate">{profile.name}</p>
              <p className="text-[10px] text-[#8899b8] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-[#4fdbc8]" />
                {profile.reputation} pts
              </p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
