import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import {
  collection, query, where, getDocs, doc, Timestamp, runTransaction,
} from 'firebase/firestore';

export async function GET(request: NextRequest) {
  // ── Auth: CRON_SECRET bearer token ───────────────────────────────────────
  // Vercel passes this automatically when the cron job fires.
  // Never expose CRON_SECRET in client bundles — server-only env var.
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 60 * 1000);
  const in35 = new Date(now.getTime() + 35 * 60 * 1000);
  const in5  = new Date(now.getTime() + 5  * 60 * 1000);
  const in10 = new Date(now.getTime() + 10 * 60 * 1000);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://skillsbridge-jet.vercel.app';
  let processed = 0;

  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('bookingStatus', '==', 'confirmed'));
    const snap = await getDocs(q);

    for (const bookingDoc of snap.docs) {
      const booking = bookingDoc.data();
      const startTime = booking.startTime instanceof Timestamp
        ? booking.startTime.toDate()
        : new Date(booking.startTime);

      const notifyUrl = `${baseUrl}/sessions`;
      const bookingRef = doc(db, 'bookings', bookingDoc.id);

      // ── 30-minute reminder ─────────────────────────────────────────────────
      // Idempotency contract: at-most-once delivery.
      // We atomically check + set reminderSent30min inside a transaction.
      // The flag is committed BEFORE the notification is dispatched.
      // If the notification HTTP call fails, the flag stays true → no re-send.
      // At-most-once is the correct tradeoff: duplicate push reminders are more
      // disruptive than a single missed one.
      if (startTime >= in30 && startTime <= in35) {
        let shouldSend30 = false;

        await runTransaction(db, async (tx) => {
          const latest = await tx.get(bookingRef);
          if (!latest.exists() || latest.data().reminderSent30min === true) {
            return; // Already sent or booking disappeared — idempotent exit
          }
          // Commit flag FIRST, then send notification outside transaction
          tx.update(bookingRef, { reminderSent30min: true });
          shouldSend30 = true;
        });

        if (shouldSend30) {
          await sendReminderPair({
            studentId:  booking.studentId,
            mentorId:   booking.mentorId,
            studentMsg: `Your session with ${booking.mentorName || 'your mentor'} starts in 30 minutes. Get ready!`,
            mentorMsg:  `Your session with ${booking.studentName || 'a student'} starts in 30 minutes.`,
            title:      '⏰ Session in 30 minutes',
            type:       'session_reminder',
            url:        notifyUrl,
            baseUrl,
          });
          processed++;
        }
      }

      // ── 5-minute reminder ──────────────────────────────────────────────────
      if (startTime >= in5 && startTime <= in10) {
        let shouldSend5 = false;

        await runTransaction(db, async (tx) => {
          const latest = await tx.get(bookingRef);
          if (!latest.exists() || latest.data().reminderSent5min === true) {
            return; // Idempotent exit
          }
          tx.update(bookingRef, { reminderSent5min: true });
          shouldSend5 = true;
        });

        if (shouldSend5) {
          await sendReminderPair({
            studentId:  booking.studentId,
            mentorId:   booking.mentorId,
            studentMsg: `Your session with ${booking.mentorName || 'your mentor'} starts in 5 minutes! Join the call.`,
            mentorMsg:  `Your session with ${booking.studentName || 'a student'} starts in 5 minutes!`,
            title:      '🚀 Session starting NOW',
            type:       'session_starting',
            url:        notifyUrl,
            baseUrl,
          });
          processed++;
        }
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

interface ReminderPairOptions {
  studentId: string;
  mentorId: string;
  studentMsg: string;
  mentorMsg: string;
  title: string;
  type: string;
  url: string;
  baseUrl: string;
}

/**
 * Dispatch notifications to both the student and mentor of a booking.
 * Uses Promise.allSettled so a single failed notification (network hiccup)
 * does NOT prevent the other party from receiving theirs, and does NOT
 * throw — the cron must continue processing remaining bookings.
 */
async function sendReminderPair(opts: ReminderPairOptions): Promise<void> {
  const endpoint = `${opts.baseUrl}/api/notifications/send`;
  const headers = { 'Content-Type': 'application/json' };

  const results = await Promise.allSettled([
    fetch(endpoint, {
      method: 'POST', headers,
      body: JSON.stringify({ userId: opts.studentId, title: opts.title, body: opts.studentMsg, url: opts.url, type: opts.type }),
    }),
    fetch(endpoint, {
      method: 'POST', headers,
      body: JSON.stringify({ userId: opts.mentorId, title: opts.title, body: opts.mentorMsg, url: opts.url, type: opts.type }),
    }),
  ]);

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[Cron] Notification failed for party index ${i}:`, r.reason);
    }
  });
}
