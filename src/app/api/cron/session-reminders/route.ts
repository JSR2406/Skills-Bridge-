import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import {
  collection, query, where, getDocs, updateDoc, doc, Timestamp,
} from 'firebase/firestore';

export async function GET(request: NextRequest) {
  // Protect with CRON_SECRET
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
    // Query confirmed bookings
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('bookingStatus', '==', 'confirmed'));
    const snap = await getDocs(q);

    for (const bookingDoc of snap.docs) {
      const booking = bookingDoc.data();
      const startTime = booking.startTime instanceof Timestamp
        ? booking.startTime.toDate()
        : new Date(booking.startTime);

      const notifyUrl = `${baseUrl}/sessions`;

      // 30-min reminder
      if (startTime >= in30 && startTime <= in35 && !booking.reminderSent30min) {
        await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: booking.studentId,
            title: `⏰ Session in 30 minutes`,
            body: `Your session with ${booking.mentorName || 'your mentor'} starts soon. Get ready!`,
            url: notifyUrl,
            type: 'session_reminder',
          }),
        });
        await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: booking.mentorId,
            title: `⏰ Session in 30 minutes`,
            body: `Your session with ${booking.studentName || 'a student'} starts soon.`,
            url: notifyUrl,
            type: 'session_reminder',
          }),
        });
        await updateDoc(doc(db, 'bookings', bookingDoc.id), { reminderSent30min: true });
        processed++;
      }

      // 5-min reminder
      if (startTime >= in5 && startTime <= in10 && !booking.reminderSent5min) {
        await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: booking.studentId,
            title: `🚀 Session starting NOW`,
            body: `Your session with ${booking.mentorName || 'your mentor'} starts in 5 minutes! Join the call.`,
            url: notifyUrl,
            type: 'session_starting',
          }),
        });
        await fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: booking.mentorId,
            title: `🚀 Session starting NOW`,
            body: `Your session with ${booking.studentName || 'a student'} starts in 5 minutes!`,
            url: notifyUrl,
            type: 'session_starting',
          }),
        });
        await updateDoc(doc(db, 'bookings', bookingDoc.id), { reminderSent5min: true });
        processed++;
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
