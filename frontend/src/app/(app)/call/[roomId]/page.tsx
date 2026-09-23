'use client';

/**
 * /call/[roomId] — Direct room-name call route
 * Supports: /call/skillsbridge-BOOKING_ID
 * Strips the "skillsbridge-" prefix if present so it doesn't double up.
 */

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';
import { JitsiCall } from '@/features/mentors/components/JitsiCall';
import { Video } from 'lucide-react';

function RoomCallInner() {
  const params = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawRoomId = decodeURIComponent(params.roomId || '');
  // Strip leading "skillsbridge-" prefix so JitsiCall doesn't double it
  const roomId = rawRoomId.replace(/^skillsbridge-/, '');
  const displayName = searchParams.get('name') || 'Participant';

  const handleClose = useCallback(() => {
    router.push('/sessions');
  }, [router]);

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#090f1c' }}>
        <p className="text-[#8899b8]">Invalid room ID.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <JitsiCall roomName={roomId} displayName={displayName} onClose={handleClose} />
    </div>
  );
}

export default function RoomCallPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#090f1c' }}>
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
              style={{ background: 'linear-gradient(135deg, rgba(79,219,200,0.15), rgba(221,183,255,0.08))' }}
            >
              <Video className="w-6 h-6 text-[#4fdbc8]" />
            </div>
            <p className="text-[#556780] text-sm">Joining room…</p>
          </div>
        </div>
      }
    >
      <RoomCallInner />
    </Suspense>
  );
}
