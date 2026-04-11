'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp,
  Users, Copy, CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

function CallRoom() {
  const params = useParams() as { roomId: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = params.roomId;
  const callType = (searchParams.get('type') || 'video') as 'video' | 'voice';
  const displayName = searchParams.get('name') || 'SkillBridge User';

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [isJitsiReady, setIsJitsiReady] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const callLink = typeof window !== 'undefined'
    ? `${window.location.origin}/call/${roomId}?type=${callType}&name=Guest`
    : '';

  // Load Jitsi SDK and init
  useEffect(() => {
    const scriptId = 'jitsi-api-script';

    const init = () => {
      if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return;

      const options = {
        roomName: roomId,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: callType === 'voice',
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          toolbarButtons: [],       // we use our own controls
          notifications: [],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_ALWAYS_VISIBLE: false,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          filmStripOnly: false,
          DEFAULT_BACKGROUND: '#0b1326',
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', options);

      apiRef.current.addEventListener('videoConferenceJoined', () => {
        setIsJitsiReady(true);
        if (callType === 'voice') {
          apiRef.current?.executeCommand('toggleVideo');
        }
      });

      apiRef.current.addEventListener('participantJoined', () => {
        setParticipantCount((n) => n + 1);
      });

      apiRef.current.addEventListener('participantLeft', () => {
        setParticipantCount((n) => Math.max(1, n - 1));
      });

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        router.back();
      });

      apiRef.current.addEventListener('audioMuteStatusChanged', ({ muted }: any) => {
        setIsMuted(muted);
      });

      apiRef.current.addEventListener('videoMuteStatusChanged', ({ muted }: any) => {
        setIsVideoOff(muted);
      });
    };

    if (document.getElementById(scriptId)) {
      if (window.JitsiMeetExternalAPI) init();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);

    return () => {
      apiRef.current?.dispose();
    };
  }, [roomId, displayName, callType]);

  // Call duration timer
  useEffect(() => {
    if (!isJitsiReady) return;
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [isJitsiReady]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleMute = () => {
    apiRef.current?.executeCommand('toggleAudio');
  };

  const toggleVideo = () => {
    apiRef.current?.executeCommand('toggleVideo');
  };

  const toggleScreenShare = () => {
    apiRef.current?.executeCommand('toggleShareScreen');
  };

  const endCall = () => {
    apiRef.current?.executeCommand('hangup');
    router.back();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(callLink);
    setCopied(true);
    toast.success('Call link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#070e1f' }}
    >
      {/* ── Top bar ── */}
      <div
        className="h-14 shrink-0 flex items-center justify-between px-5 z-10"
        style={{
          background: 'rgba(11,19,38,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(79,219,200,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
            style={{ background: 'rgba(79,219,200,0.1)', color: '#4fdbc8', border: '1px solid rgba(79,219,200,0.2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4fdbc8] animate-pulse" />
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </div>
          {isJitsiReady && (
            <span className="text-sm font-mono text-[#8899b8]">{formatDuration(callDuration)}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8899b8]">
            <Users className="w-3.5 h-3.5" />
            <span>{participantCount}</span>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#8899b8] hover:text-[#dae2fd] transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-[#4fdbc8]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Invite'}
          </button>
        </div>
      </div>

      {/* ── Jitsi iframe container ── */}
      <div className="flex-1 relative overflow-hidden">
        {!isJitsiReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
            style={{ background: '#070e1f' }}>
            <div className="relative mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(79,219,200,0.15), rgba(221,183,255,0.1))',
                  border: '1px solid rgba(79,219,200,0.2)',
                  boxShadow: '0 0 60px rgba(79,219,200,0.15)',
                }}
              >
                {callType === 'video'
                  ? <Video className="w-9 h-9 text-[#4fdbc8]" />
                  : <Mic className="w-9 h-9 text-[#4fdbc8]" />
                }
              </div>
              <div className="absolute inset-0 rounded-2xl border border-[rgba(79,219,200,0.3)] animate-ping" />
            </div>
            <p className="text-lg font-bold text-[#dae2fd] mb-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Connecting…
            </p>
            <p className="text-sm text-[#8899b8]">Setting up your {callType} call</p>
          </div>
        )}
        <div
          ref={jitsiContainerRef}
          className="w-full h-full"
          style={{ opacity: isJitsiReady ? 1 : 0, transition: 'opacity 0.5s ease' }}
        />
      </div>

      {/* ── Bottom controls ── */}
      <div
        className="h-20 shrink-0 flex items-center justify-center gap-4 z-10"
        style={{
          background: 'rgba(11,19,38,0.9)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(79,219,200,0.08)',
        }}
      >
        {/* Mute */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted
              ? 'bg-[rgba(255,68,68,0.15)] text-[#ff6b6b] border border-[rgba(255,68,68,0.3)]'
              : 'bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] border border-[rgba(79,219,200,0.2)] hover:bg-[rgba(79,219,200,0.18)]'
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video toggle */}
        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOff
                ? 'bg-[rgba(255,68,68,0.15)] text-[#ff6b6b] border border-[rgba(255,68,68,0.3)]'
                : 'bg-[rgba(79,219,200,0.1)] text-[#4fdbc8] border border-[rgba(79,219,200,0.2)] hover:bg-[rgba(79,219,200,0.18)]'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Share screen */}
        {callType === 'video' && (
          <button
            onClick={toggleScreenShare}
            title="Share screen"
            className="w-12 h-12 rounded-full flex items-center justify-center bg-[rgba(221,183,255,0.08)] text-[#ddb7ff] border border-[rgba(221,183,255,0.15)] hover:bg-[rgba(221,183,255,0.15)] transition-all"
          >
            <MonitorUp className="w-5 h-5" />
          </button>
        )}

        {/* End call */}
        <button
          onClick={endCall}
          title="End call"
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
          style={{
            background: 'linear-gradient(135deg, #ff4444, #cc2222)',
            boxShadow: '0 0 24px rgba(255,68,68,0.3)',
          }}
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#070e1f' }}>
        <div className="text-[#4fdbc8] text-sm animate-pulse">Connecting…</div>
      </div>
    }>
      <CallRoom />
    </Suspense>
  );
}
