'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Video, PhoneOff, AlertTriangle } from 'lucide-react';

interface JitsiCallProps {
  roomName: string;
  displayName: string;
  startWithVideoMuted?: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export function JitsiCall({ roomName, displayName, startWithVideoMuted = false, onClose }: JitsiCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const fullRoomName = `skillsbridge-${roomName}`;
  const jitsiDirectLink = `https://meet.jit.si/${fullRoomName}`;

  useEffect(() => {
    let cleanedUp = false;

    function initJitsi() {
      if (cleanedUp || !containerRef.current || !window.JitsiMeetExternalAPI) return;

      try {
        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: fullRoomName,
          parentNode: containerRef.current,
          userInfo: { displayName },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            disableInviteFunctions: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'hangup',
              'chat', 'tileview', 'fullscreen', 'settings',
              'videoquality', 'filmstrip',
            ],
            SETTINGS_SECTIONS: ['devices', 'language'],
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          },
        });

        apiRef.current.addListener('videoConferenceJoined', () => {
          if (!cleanedUp) setStatus('ready');
        });

        apiRef.current.addListener('readyToClose', () => {
          onClose();
        });

        apiRef.current.addListener('errorOccurred', (event: any) => {
          console.error('Jitsi error:', event);
          if (!cleanedUp) {
            setErrorMsg('A connection error occurred. Please try again or use the direct link below.');
            setStatus('error');
          }
        });

        // Fallback: mark ready after 8s even if the joined event doesn't fire
        setTimeout(() => {
          if (!cleanedUp && status === 'loading') setStatus('ready');
        }, 8000);

      } catch (err: any) {
        console.error('Failed to init Jitsi:', err);
        if (!cleanedUp) {
          setErrorMsg(err.message || 'Could not initialize video call.');
          setStatus('error');
        }
      }
    }

    // Inject Jitsi External API script if not already loaded
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const existing = document.getElementById('jitsi-api-script');
      if (existing) {
        existing.addEventListener('load', initJitsi);
      } else {
        const script = document.createElement('script');
        script.id = 'jitsi-api-script';
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = initJitsi;
        script.onerror = () => {
          if (!cleanedUp) {
            setErrorMsg('Failed to load Jitsi Meet. Check your internet connection.');
            setStatus('error');
          }
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      cleanedUp = true;
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {}
        apiRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullRoomName, displayName]);

  return (
    <div className="relative w-full h-full flex flex-col" style={{ minHeight: '100vh', background: '#090f1c' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3 z-20"
        style={{
          background: 'rgba(9,15,28,0.95)',
          borderBottom: '1px solid rgba(79,219,200,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)' }}
          >
            <Video className="w-4 h-4 text-[#090f1c]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#4fdbc8] uppercase tracking-widest">SkillBridge Call</p>
            <p className="text-[11px] text-[#556780] font-mono truncate max-w-[200px] sm:max-w-none">
              {fullRoomName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={jitsiDirectLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#8899b8] transition-all hover:text-[#dae2fd]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            Open in Browser
          </a>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #ff4d6d, #c9184a)' }}
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5" style={{ background: '#090f1c' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(79,219,200,0.15), rgba(221,183,255,0.08))', border: '1px solid rgba(79,219,200,0.2)' }}
          >
            <Video className="w-7 h-7 text-[#4fdbc8]" />
          </div>
          <div className="text-center">
            <p className="text-[#dae2fd] font-bold text-lg mb-1">Connecting to call…</p>
            <p className="text-[#556780] text-sm">Powered by Jitsi Meet — free &amp; secure</p>
          </div>
          <Loader2 className="w-6 h-6 text-[#4fdbc8] animate-spin" />
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.2)' }}
          >
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-[#dae2fd] font-bold text-lg mb-2">Could not start call</p>
            <p className="text-[#8899b8] text-sm leading-relaxed">{errorMsg}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={jitsiDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-[#090f1c] transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)' }}
            >
              Join via Browser →
            </a>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-[#8899b8] transition-all hover:text-[#dae2fd]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Jitsi iframe container */}
      <div
        ref={containerRef}
        className="flex-1"
        style={{
          opacity: status === 'ready' ? 1 : 0,
          transition: 'opacity 0.5s ease',
          minHeight: 'calc(100vh - 57px)',
        }}
      />
    </div>
  );
}
