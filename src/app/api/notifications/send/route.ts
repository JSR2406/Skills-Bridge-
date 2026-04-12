import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';

async function sendPush(subscription: any, payload: string) {
  const webpush = await import('web-push');
  webpush.default.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return webpush.default.sendNotification(subscription, payload);
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url, type } = await request.json();

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title required' }, { status: 400 });
    }

    // 1) Always write Firestore in-app notification
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message: body || '',
      type: type || 'system',
      linkTo: url || '/notifications',
      read: false,
      createdAt: serverTimestamp(),
    });

    // 2) Try to send browser push (graceful degradation)
    try {
      const subRef = doc(db, 'users', userId, 'pushSubscriptions', 'main');
      const subDoc = await getDoc(subRef);
      if (subDoc.exists()) {
        const sub = subDoc.data()?.subscription;
        if (sub) {
          await sendPush(sub, JSON.stringify({ title, body, url }));
        }
      }
    } catch (pushErr: any) {
      console.warn('Push notification failed (non-fatal):', pushErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Notification send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
