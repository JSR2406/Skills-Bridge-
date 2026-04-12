'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useCallback } from 'react';
import { JitsiCall } from '@/features/mentors/components/JitsiCall';
import { Video, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// ─── Inner component (needs useSearchParams inside Suspense) ─────────────────
function CallInner() {
  const params = useSearchParams();
  const router = useRouter();

  const sessionId = params.get('session');
  const displayName = params.get('name') || 'Student';
  const [videoMuted, setVideoMuted] = useState(false);

  const handleClose = useCallback(() => {
    router.push('/sessions');
  }, [router]);

  // Missing session param
  if (!sessionId) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
        style={{ background: '#090f1c' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)' }}
        >
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div className="text-center max-w-sm">
          <h1
            className="text-2xl font-extrabold text-[#dae2fd] mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Invalid Meeting Link
          </h1>
          <p className="text-[#8899b8] text-sm leading-relaxed">
            This call link is missing required information. Please use the &quot;Join Call&quot; button
            from your sessions page.
          </p>
        </div>
        <Link
          href="/sessions"
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-[#dae2fd] transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Camera toggle — shown before call starts */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
        style={{
          background: 'rgba(9,15,28,0.75)',
          border: '1px solid rgba(79,219,200,0.1)',
          backdropFilter: 'blur(10px)',
          pointerEvents: 'none',
          opacity: 0, // hidden once Jitsi loads its own controls
        }}
      >
        <Video className="w-4 h-4 text-[#4fdbc8]" />
        <span className="text-xs text-[#8899b8]">Jitsi controls available inside the call</span>
      </div>

      <JitsiCall
        roomName={sessionId}
        displayName={displayName}
        startWithVideoMuted={videoMuted}
        onClose={handleClose}
      />
    </div>
  );
}

// ─── Page wrapper with Suspense (required for useSearchParams in Next.js) ────
export default function CallPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#090f1c' }}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
              style={{ background: 'linear-gradient(135deg, rgba(79,219,200,0.15), rgba(221,183,255,0.08))' }}
            >
              <Video className="w-6 h-6 text-[#4fdbc8]" />
            </div>
            <p className="text-[#556780] text-sm font-medium">Preparing your call…</p>
          </div>
        </div>
      }
    >
      <CallInner />
    </Suspense>
  );
}
