import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { awardPoints } from '../../reputation/api';

export interface Answer {
  id: string;
  doubtId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string; // Rich HTML from Tiptap
  isAccepted: boolean;
  upvotes: number;
  createdAt: Date;
}

const ANSWERS_COLLECTION = 'answers';

export async function getAnswers(doubtId: string): Promise<Answer[]> {
  const q = query(
    collection(db, ANSWERS_COLLECTION),
    where('doubtId', '==', doubtId),
    orderBy('isAccepted', 'desc'),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    } as Answer;
  });
}

import { onSnapshot } from 'firebase/firestore';

export function subscribeToAnswers(doubtId: string, callback: (answers: Answer[]) => void) {
  const q = query(
    collection(db, ANSWERS_COLLECTION),
    where('doubtId', '==', doubtId),
    orderBy('isAccepted', 'desc'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const answers = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      } as Answer;
    });
    callback(answers);
  });
}

export async function postAnswer(
  doubtId: string,
  content: string,
  authorId: string,
  authorName: string,
  authorAvatarUrl?: string
): Promise<string> {
  const ref = await addDoc(collection(db, ANSWERS_COLLECTION), {
    doubtId,
    authorId,
    authorName,
    authorAvatarUrl: authorAvatarUrl || null,
    content,
    isAccepted: false,
    upvotes: 0,
    createdAt: serverTimestamp(),
  });

  // Increment responsesCount on the doubt
  const doubtRef = doc(db, 'doubts', doubtId);
  await updateDoc(doubtRef, {
    responsesCount: increment(1),
  });

  // Award gamification points for posting an answer
  await awardPoints(authorId, 'answer_posted', ref.id, 'answer');

  // Notify the doubt author
  const doubtSnap = await getDoc(doubtRef);
  if (doubtSnap.exists()) {
    const doubtData = doubtSnap.data();
    if (doubtData.authorId && doubtData.authorId !== authorId) {
      import('../../notifications/utils').then(({ sendNotification }) => {
        sendNotification({
          userId: doubtData.authorId,
          title: 'New Answer to Your Doubt',
          body: `${authorName} answered: "${doubtData.title}"`,
          type: 'info',
          url: `/feed/${doubtId}`,
        }).catch(console.error);
      });
    }
  }

  return ref.id;
}

export async function acceptAnswer(
  answerId: string,
  doubtId: string,
  answerAuthorId: string,
  doubtAuthorId: string
): Promise<void> {
  // Un-accept previously accepted answer for this doubt
  const q = query(
    collection(db, ANSWERS_COLLECTION),
    where('doubtId', '==', doubtId),
    where('isAccepted', '==', true)
  );
  const prev = await getDocs(q);
  const batch: Promise<void>[] = [];

  prev.docs.forEach(d => {
    if (d.id !== answerId) {
      batch.push(updateDoc(d.ref, { isAccepted: false }));
    }
  });
  await Promise.all(batch);

  // Accept this answer
  await updateDoc(doc(db, ANSWERS_COLLECTION, answerId), { isAccepted: true });

  // Mark the doubt as resolved
  await updateDoc(doc(db, 'doubts', doubtId), { isResolved: true });

  // Award gamification points to answerer (only once per answer)
  // The doubt author triggers the accept, so we award to answer author
  if (answerAuthorId !== doubtAuthorId) {
    await awardPoints(answerAuthorId, 'answer_accepted', answerId, 'answer');

    import('../../notifications/utils').then(({ sendNotification }) => {
      sendNotification({
        userId: answerAuthorId,
        title: 'Answer Accepted!',
        body: 'You have been awarded points for your helpful answer.',
        type: 'success',
        url: `/feed/${doubtId}`,
      }).catch(console.error);
    });
  }
}
