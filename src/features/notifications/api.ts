import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  writeBatch,
  getDocs
} from 'firebase/firestore';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  linkTo?: string;
  createdAt: Date;
}

export function subscribeToNotifications(userId: string, callback: (notifs: AppNotification[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const notifs = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as AppNotification;
    });
    callback(notifs);
  });
}

export async function markAsRead(notificationIds: string[]) {
  if (!notificationIds.length) return;
  const batch = writeBatch(db);
  
  notificationIds.forEach(id => {
    const ref = doc(db, 'notifications', id);
    batch.update(ref, { read: true });
  });

  await batch.commit();
}

export async function markAllAsRead(userId: string) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return;
  
  const batch = writeBatch(db);
  snap.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
}
