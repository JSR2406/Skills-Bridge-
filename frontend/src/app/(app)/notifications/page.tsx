'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { subscribeToNotifications, markAllAsRead, markAsRead, AppNotification } from '@/features/notifications/api';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead(user.uid);
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await markAsRead([id]);
  };

  if (isLoading) return <div className="max-w-2xl mx-auto mt-10"><LoadingSkeleton /></div>;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20 relative">
      <div className="absolute top-20 right-0 w-72 h-72 bg-gradient-to-tr from-[#ddb7ff]/5 to-[#4fdbc8]/10 blur-[80px] rounded-full pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[rgba(79,219,200,0.1)] relative">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2 text-[#ddb7ff] font-bold text-xs uppercase tracking-widest">
            <Bell className="w-4 h-4" />
            Activity Feed
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Notifications
          </h1>
          <p className="text-[15px] text-[#8899b8] mt-3 leading-relaxed">
            Stay updated on new answers to your doubts, mentor session requests, and reputation milestones.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(79,219,200,0.1)] bg-[rgba(79,219,200,0.08)] border border-[rgba(79,219,200,0.3)] text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.15)] hover:text-[#dae2fd]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-24 glass-card border-dashed">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-[rgba(79,219,200,0.05)] border border-[rgba(79,219,200,0.1)]">
              <Bell className="w-8 h-8 text-[#4fdbc8]/50" />
            </div>
            <p className="text-[#dae2fd] font-extrabold text-lg mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>You're all caught up!</p>
            <p className="text-sm text-[#8899b8]">No new notifications at the moment.</p>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <div 
              key={notif.id} 
              className={`relative overflow-hidden transition-all duration-300 p-5 sm:p-6 rounded-2xl ${
                notif.read 
                  ? 'bg-[rgba(19,27,46,0.6)] border border-[rgba(79,219,200,0.05)] opacity-80' 
                  : 'glass-card border-[rgba(79,219,200,0.2)] shadow-[0_0_24px_rgba(79,219,200,0.05)]'
              }`}
              style={{ animationDelay: `${i * 30}ms`, animationName: 'fade-in', animationFillMode: 'both' }}
            >
              {!notif.read && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#4fdbc8] to-[#ddb7ff]" />
              )}
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-extrabold text-[15px] ${notif.read ? 'text-[#8899b8]' : 'text-[#dae2fd]'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#8899b8] ml-4 bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(notif.createdAt)}
                    </span>
                  </div>
                  <p className={`text-[13px] leading-relaxed ${notif.read ? 'text-[#8899b8]/80' : 'text-[#8899b8]'}`}>
                    {notif.message}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between pl-4 border-l border-[rgba(255,255,255,0.05)] ml-2">
                   {!notif.read && (
                     <button 
                      className="w-7 h-7 rounded flex items-center justify-center text-[#8899b8] hover:bg-[rgba(79,219,200,0.1)] hover:text-[#4fdbc8] transition-colors"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                     >
                       <Check className="w-4 h-4" />
                     </button>
                   )}
                   {notif.linkTo && (
                      <Link 
                        href={notif.linkTo} 
                        onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                        className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors mt-auto pt-2 ${
                          notif.read ? 'text-[#8899b8] hover:text-[#dae2fd]' : 'text-[#ddb7ff] hover:text-[#dae2fd]'
                        }`}
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
