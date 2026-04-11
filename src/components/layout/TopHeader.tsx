'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Menu, Search, LogOut, User as UserIcon, Settings, Bell, Zap, BellRing, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function TopHeader() {
  const { toggleSidebar } = useAppStore();
  const { profile } = useAuth();
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const isFirstLoad = useRef(true);
  const knownNotifIds = useRef(new Set<string>());

  useEffect(() => {
    if (!profile?.uid) return;
    let isSubscribed = true;
    
    import('@/features/notifications/api').then(({ subscribeToNotifications }) => {
      const unsub = subscribeToNotifications(profile.uid, async (notifs) => {
        if (!isSubscribed) return;
        setUnreadCount(notifs.filter(n => !n.read).length);
        
        if (isFirstLoad.current) {
          notifs.forEach(n => knownNotifIds.current.add(n.id));
          isFirstLoad.current = false;
          return;
        }

        const newUnread = notifs.filter(n => !n.read && !knownNotifIds.current.has(n.id));
        if (newUnread.length > 0) {
          const { toast } = await import('sonner');
          newUnread.forEach(n => {
            toast(n.title, {
              description: n.message,
              icon: <BellRing className="w-4 h-4 text-[#4fdbc8]" />,
              style: {
                background: 'rgba(19, 27, 46, 0.95)',
                border: '1px solid rgba(79, 219, 200, 0.2)',
                color: '#dae2fd',
                boxShadow: '0 8px 32px rgba(79, 219, 200, 0.1)',
                backdropFilter: 'blur(20px)',
              }
            });
            knownNotifIds.current.add(n.id);
          });
        }
      });
      return unsub;
    }).then(unsub => {
      if (!isSubscribed && unsub) unsub();
      return () => {
        isSubscribed = false;
        if (unsub) unsub();
      };
    });
    
    return () => { isSubscribed = false; };
  }, [profile?.uid]);

  // Subscribe to unread messages
  useEffect(() => {
    if (!profile?.uid) return;
    let isSubscribed = true;
    import('@/features/messages/api').then(({ subscribeToConversations }) => {
      const unsub = subscribeToConversations(profile.uid, (convs) => {
        if (!isSubscribed) return;
        const total = convs.reduce((acc, c) => acc + (profile?.uid ? (c.unreadCount?.[profile.uid] || 0) : 0), 0);
        setUnreadMessages(total);
      });
      return unsub;
    });
    return () => { isSubscribed = false; };
  }, [profile?.uid]);

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header
      className="h-16 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6"
      style={{
        background: 'rgba(11, 19, 38, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(79, 219, 200, 0.08)',
      }}
    >
      {/* Left: Toggle + Search */}
      <div className="flex items-center gap-3 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden md:flex w-9 h-9 rounded-lg text-[#8899b8] hover:text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.08)] transition-colors"
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Search bar */}
        <div
          className="relative w-full max-w-md hidden sm:block transition-all duration-300"
          style={{ maxWidth: searchFocused ? '420px' : '320px' }}
        >
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#4fdbc8]/50" />
          <input
            type="text"
            placeholder="Search doubts, mentors, tags..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-9 pl-9 pr-4 text-sm font-[Manrope] text-[#dae2fd] placeholder:text-[#8899b8]/60 rounded-lg transition-all duration-300 outline-none"
            style={{
              background: searchFocused ? 'rgba(28, 36, 64, 0.9)' : 'rgba(19, 27, 46, 0.6)',
              border: searchFocused
                ? '1px solid rgba(79, 219, 200, 0.4)'
                : '1px solid rgba(79, 219, 200, 0.1)',
              boxShadow: searchFocused ? '0 0 16px rgba(79, 219, 200, 0.1)' : 'none',
            }}
          />
          {searchFocused && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8899b8]/50 font-mono">
              ⌘K
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Reputation pill */}
        {profile && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{
              background: 'rgba(79, 219, 200, 0.08)',
              border: '1px solid rgba(79, 219, 200, 0.15)',
              color: '#4fdbc8',
            }}
          >
            <Zap className="w-3 h-3" />
            {profile.reputation} pts
          </div>
        )}

        {/* Messages */}
        <Link href="/messages">
          <Button
            variant="ghost"
            size="icon"
            className="relative w-9 h-9 rounded-lg text-[#8899b8] hover:text-[#ddb7ff] hover:bg-[rgba(221,183,255,0.08)] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMessages > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-[#0b1326]"
                style={{ background: '#ddb7ff', boxShadow: '0 0 8px rgba(221,183,255,0.6)' }}
              />
            )}
          </Button>
        </Link>

        {/* Notifications */}
        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative w-9 h-9 rounded-lg text-[#8899b8] hover:text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.08)] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-[#0b1326]"
                style={{ background: '#4fdbc8', boxShadow: '0 0 8px rgba(79,219,200,0.6)' }}
              />
            )}
          </Button>
        </Link>

        {/* Avatar + Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 rounded-full outline-none ring-2 ring-transparent hover:ring-[rgba(79,219,200,0.3)] transition-all bg-transparent border-0 p-0 cursor-pointer flex items-center justify-center m-0">
            <div className="relative h-9 w-9">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatarUrl} alt={profile?.name || 'User'} />
                <AvatarFallback
                  className="text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #4fdbc8 0%, #ddb7ff 100%)',
                    color: '#00201c',
                  }}
                >
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0b1326]"
                style={{ background: '#4fdbc8', boxShadow: '0 0 6px rgba(79,219,200,0.5)' }}
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60"
            align="end"
            style={{
              background: 'rgba(19, 27, 46, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(79, 219, 200, 0.12)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 32px rgba(79,219,200,0.05)',
            }}
          >
            <DropdownMenuLabel className="font-normal p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatarUrl} alt={profile?.name || 'User'} />
                  <AvatarFallback
                    className="font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #4fdbc8 0%, #ddb7ff 100%)',
                      color: '#00201c',
                    }}
                  >
                    {profile?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-[#dae2fd]">{profile?.name}</p>
                  <p className="text-xs text-[#8899b8] truncate max-w-[140px]">{profile?.email}</p>
                  {profile?.role === 'mentor' && (
                    <span className="text-[10px] font-semibold text-[#4fdbc8] mt-0.5">✦ Mentor</span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[rgba(79,219,200,0.08)]" />
            {profile?.uid && (
              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="cursor-pointer text-[#8899b8] hover:text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.08)] transition-colors mx-1 rounded-md"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="cursor-pointer text-[#8899b8] hover:text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.08)] transition-colors mx-1 rounded-md"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[rgba(79,219,200,0.08)]" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-[#ff4444] hover:text-[#ff6b6b] hover:bg-[rgba(255,68,68,0.08)] transition-colors mx-1 rounded-md mb-1"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
