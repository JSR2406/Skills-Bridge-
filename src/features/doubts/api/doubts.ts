import { collection, doc, query, orderBy, limit, addDoc, updateDoc, serverTimestamp, getDocs, getDoc, runTransaction, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Doubt, CreateDoubtInput } from '../types';

const DOUBTS_COLLECTION = 'doubts';
const VOTES_COLLECTION = 'votes';

export async function fetchDoubts(maxResults = 20): Promise<Doubt[]> {
  const q = query(
    collection(db, DOUBTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
  })) as Doubt[];
}

import { onSnapshot } from 'firebase/firestore';

export function subscribeToDoubts(callback: (doubts: Doubt[]) => void, maxResults = 50) {
  const q = query(
    collection(db, DOUBTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );
  return onSnapshot(q, (snapshot) => {
    const doubts = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as Doubt[];
    callback(doubts);
  });
}


import { awardPoints } from '@/features/reputation/api';

export async function createDoubt(data: CreateDoubtInput, authorName: string, authorAvatarUrl?: string): Promise<string> {
  const newDoubt = {
    ...data,
    authorName,
    authorAvatarUrl: authorAvatarUrl || null,
    upvotes: 0,
    downvotes: 0,
    voteScore: 0,
    responsesCount: 0,
    isResolved: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, DOUBTS_COLLECTION), newDoubt);
  
  // Award reputation points for asking a doubt
  awardPoints(data.authorId, 'doubt_asked', docRef.id, 'doubt').catch(console.error);
  
  return docRef.id;
}

export async function getDoubt(doubtId: string): Promise<Doubt | null> {
  const snap = await getDoc(doc(db, DOUBTS_COLLECTION, doubtId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
  } as Doubt;
}

export function subscribeToDoubt(doubtId: string, callback: (doubt: Doubt | null) => void) {
  const ref = doc(db, DOUBTS_COLLECTION, doubtId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data();
    callback({
      ...data,
      id: snap.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as Doubt);
  });
}


export async function voteDoubt(doubtId: string, userId: string, voteValue: 1 | -1 | 0): Promise<void> {
  const doubtRef = doc(db, DOUBTS_COLLECTION, doubtId);
  // Using a combined doc ID for vote to ensure one vote per user per doubt
  const voteRef = doc(db, VOTES_COLLECTION, `${userId}_${doubtId}`);

  let shouldAwardPoints = false;
  let doubtAuthorId = '';
  let doubtTitle = '';

  await runTransaction(db, async (transaction) => {
    const doubtDoc = await transaction.get(doubtRef);
    if (!doubtDoc.exists()) throw new Error('Doubt does not exist');
    
    doubtAuthorId = doubtDoc.data().authorId;
    doubtTitle = doubtDoc.data().title || 'Your doubt';

    const voteDoc = await transaction.get(voteRef);
    let currentVoteValue = 0;

    if (voteDoc.exists()) {
      currentVoteValue = voteDoc.data().value;
    }

    if (currentVoteValue !== 1 && voteValue === 1) {
      shouldAwardPoints = true;
    }

    if (currentVoteValue === voteValue) {
      // Un-vote
      const newScore = doubtDoc.data().voteScore - currentVoteValue;
      const upAdjust = currentVoteValue === 1 ? -1 : 0;
      const downAdjust = currentVoteValue === -1 ? -1 : 0;

      transaction.update(doubtRef, {
        voteScore: newScore,
        upvotes: doubtDoc.data().upvotes + upAdjust,
        downvotes: doubtDoc.data().downvotes + downAdjust,
      });
      transaction.delete(voteRef);
    } else {
      // Change or Add vote
      let upAdjust = 0;
      let downAdjust = 0;

      if (currentVoteValue === 1) upAdjust = -1;
      if (currentVoteValue === -1) downAdjust = -1;

      if (voteValue === 1) upAdjust += 1;
      if (voteValue === -1) downAdjust += 1;

      const newScore = doubtDoc.data().voteScore - currentVoteValue + voteValue;

      transaction.update(doubtRef, {
        voteScore: newScore,
        upvotes: doubtDoc.data().upvotes + upAdjust,
        downvotes: doubtDoc.data().downvotes + downAdjust,
      });

      transaction.set(voteRef, {
        userId,
        doubtId,
        value: voteValue,
        createdAt: serverTimestamp()
      });
    }
  });

  if (shouldAwardPoints && doubtAuthorId && doubtAuthorId !== userId) {
    import('../../reputation/api').then(({ awardPoints }) => {
      awardPoints(doubtAuthorId, 'doubt_upvoted', `${doubtId}_${userId}`, 'doubt_vote').catch(console.error);
    });
    
    import('../../notifications/utils').then(({ sendNotification }) => {
      sendNotification({
        userId: doubtAuthorId,
        title: 'Someone Upvoted Your Doubt!',
        message: `Your doubt "${doubtTitle}" received an upvote! +5 pts`,
        type: 'info',
        link: `/feed/${doubtId}`,
      }).catch(console.error);
    });
  }
}
