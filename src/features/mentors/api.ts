import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { MentorProfile, MentorRating, MentorSlot, PendingMentorApplication, SessionBooking } from './types';

// Mentors
export async function getApprovedMentors(): Promise<MentorProfile[]> {
  const q = query(
    collection(db, 'mentors'),
    where('mentorApproved', '==', true)
  );
  
  const snap = await getDocs(q);
  return snap.docs
    .map(d => {
      const data = d.data();
      return {
        userId: d.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as MentorProfile;
    })
    .sort((a, b) => (b.createdAt as any).getTime() - (a.createdAt as any).getTime());
}

export async function getMentorProfile(userId: string): Promise<MentorProfile | null> {
  const ref = doc(db, 'mentors', userId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) return null;
  const data = snap.data();
  
  return {
    userId: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as MentorProfile;
}

export async function applyForMentor(
  userId: string, 
  data: Partial<Omit<MentorProfile, 'userId' | 'mentorApproved' | 'createdAt' | 'updatedAt'>>
) {
  const ref = doc(db, 'mentors', userId);
  const snap = await getDoc(ref);
  
  const payload = {
    ...data,
    mentorApproved: true, // Auto-approved for hackathon prototype
    updatedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(ref, {
      ...payload,
      averageRating: 0,
      totalRatings: 0,
      sessionCount: 0,
      createdAt: serverTimestamp(),
    });
  } else {
    // Overwrite existing app but keep stats if they exist
    await updateDoc(ref, payload);
  }

  // Also update global user profile role
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    role: 'mentor'
  });
}

// Slots
export async function getMentorSlots(mentorId: string): Promise<MentorSlot[]> {
  const q = query(
    collection(db, 'mentorSlots'),
    where('mentorId', '==', mentorId),
    where('isBooked', '==', false)
  );
  
  const snap = await getDocs(q);
  const now = new Date();
  
  return snap.docs
    .map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as MentorSlot;
    })
    .filter(slot => slot.startTime > now)
    .sort((a, b) => (a.startTime as any).getTime() - (b.startTime as any).getTime());
}

import { onSnapshot } from 'firebase/firestore';

export function subscribeToMentorSlots(mentorId: string, callback: (slots: MentorSlot[]) => void) {
  const q = query(
    collection(db, 'mentorSlots'),
    where('mentorId', '==', mentorId),
    where('isBooked', '==', false)
  );
  
  return onSnapshot(q, (snap) => {
    const now = new Date();
    const slots = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as MentorSlot;
      })
      .filter(slot => slot.startTime > now)
      .sort((a, b) => (a.startTime as any).getTime() - (b.startTime as any).getTime());
    callback(slots);
  });
}

// Bookings

/**
 * Atomically books a mentor slot using a Firestore transaction.
 *
 * Race Condition Handling
 * ───────────────────────
 * The previous implementation (addDoc + updateDoc) had a TOCTOU race:
 * two students could both read isBooked=false simultaneously and both
 * produce bookings for the same slot.
 *
 * This function wraps the entire operation in runTransaction(), which uses
 * Firestore's optimistic concurrency model:
 *   1. We read the slot document INSIDE the transaction.
 *   2. If isBooked is already true → throw SLOT_ALREADY_BOOKED immediately.
 *   3. Otherwise, we queue a set() on the new booking doc and an update()
 *      on the slot doc — both committed atomically.
 *   4. If another writer modified the slot between our get() and commit(),
 *      Firestore retries the transaction up to 5 times before throwing.
 *
 * The booking document ID is pre-allocated via doc(collection) so we can
 * return it from inside the transaction without a second read.
 *
 * Note: serverTimestamp() cannot be used inside transactions — Timestamp.now()
 * is used instead (close enough for a booking record, and avoids the SDK error).
 *
 * @throws 'SLOT_ALREADY_BOOKED' — catch this in the UI and prompt slot selection
 * @throws 'SLOT_NOT_FOUND'       — slot document deleted before booking completed
 */
export async function bookSlotTransaction(
  slot: MentorSlot,
  mentor: MentorProfile,
  studentId: string,
  studentName: string,
  razorpayOrderId: string,
): Promise<string> {
  const slotRef = doc(db, 'mentorSlots', slot.id);
  // Pre-allocate the booking document ID so we can return it from inside the transaction
  const newBookingRef = doc(collection(db, 'bookings'));

  await runTransaction(db, async (transaction) => {
    // ── Step 1: Read slot state inside the transaction ──────────────────────
    const slotSnap = await transaction.get(slotRef);

    if (!slotSnap.exists()) {
      throw new Error('SLOT_NOT_FOUND');
    }
    if (slotSnap.data().isBooked === true) {
      // Another student claimed this slot — fail fast and let UI handle it
      throw new Error('SLOT_ALREADY_BOOKED');
    }

    // ── Step 2: Build booking payload ──────────────────────────────────────
    const bookingData: Omit<SessionBooking, 'id'> = {
      slotId:        slot.id,
      mentorId:      mentor.userId,
      mentorName:    mentor.name,
      mentorAvatar:  mentor.avatarUrl,
      studentId,
      studentName,
      amount:        slot.fee,
      paymentStatus: 'pending',
      razorpayOrderId,
      bookingStatus: 'confirmed',
      meetingLink:   `/call/${slot.id}`,
      startTime:     slot.startTime,
      endTime:       slot.endTime,
      // serverTimestamp() not allowed inside transactions — use Timestamp.now()
      createdAt:     Timestamp.now(),
    };

    // ── Step 3: Atomic writes — both land or both roll back ─────────────────
    transaction.set(newBookingRef, bookingData);
    transaction.update(slotRef, { isBooked: true });
  });

  return newBookingRef.id;
}

export async function confirmBookingPayment(
  bookingId: string, 
  razorpayPaymentId: string
) {
  const bookingRef = doc(db, 'bookings', bookingId);
  await updateDoc(bookingRef, {
    paymentStatus: 'paid',
    razorpayPaymentId,
  });

  const snap = await getDoc(bookingRef);
  if (snap.exists()) {
    const data = snap.data();
    import('../notifications/utils').then(({ sendNotification }) => {
      // Notify Mentor
      sendNotification({
        userId: data.mentorId,
        title: 'New Session Booking',
        body: `${data.studentName} booked a session with you.`,
        type: 'info',
        url: `/sessions`,
      }).catch(console.error);

      // Notify Student
      sendNotification({
        userId: data.studentId,
        title: 'Session Confirmed',
        body: `Your session with ${data.mentorName} is confirmed.`,
        type: 'success',
        url: `/sessions`,
      }).catch(console.error);
    });
  }
}

export async function getUserSessions(userId: string): Promise<SessionBooking[]> {
  const studentQ = query(collection(db, 'bookings'), where('studentId', '==', userId));
  const mentorQ = query(collection(db, 'bookings'), where('mentorId', '==', userId));
  
  const [studentSnap, mentorSnap] = await Promise.all([getDocs(studentQ), getDocs(mentorQ)]);
  
  const sessionsMap = new Map<string, SessionBooking>();
  
  const processDoc = (d: any) => {
    const data = d.data();
    sessionsMap.set(d.id, {
      id: d.id,
      ...data,
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as SessionBooking);
  };
  
  studentSnap.docs.forEach(processDoc);
  mentorSnap.docs.forEach(processDoc);
  
  return Array.from(sessionsMap.values())
    .sort((a, b) => (b.startTime as any).getTime() - (a.startTime as any).getTime());
}

export function subscribeToUserSessions(userId: string, callback: (sessions: SessionBooking[]) => void) {
  const studentQ = query(collection(db, 'bookings'), where('studentId', '==', userId));
  const mentorQ = query(collection(db, 'bookings'), where('mentorId', '==', userId));
  
  const sessionsMap = new Map<string, SessionBooking>();
  let studentLoaded = false;
  let mentorLoaded = false;
  
  const emit = () => {
    if (studentLoaded && mentorLoaded) {
      const arr = Array.from(sessionsMap.values());
      arr.sort((a, b) => (b.startTime as any).getTime() - (a.startTime as any).getTime());
      callback(arr);
    }
  };

  const processChange = (change: any) => {
    if (change.type === 'removed') {
      sessionsMap.delete(change.doc.id);
    } else {
      const data = change.doc.data();
      sessionsMap.set(change.doc.id, {
        id: change.doc.id, ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as SessionBooking);
    }
  };

  const unsub1 = onSnapshot(studentQ, (snap) => {
    snap.docChanges().forEach(processChange);
    studentLoaded = true;
    emit();
  });

  const unsub2 = onSnapshot(mentorQ, (snap) => {
    snap.docChanges().forEach(processChange);
    mentorLoaded = true;
    emit();
  });

  return () => {
    unsub1();
    unsub2();
  };
}

// ── Slot Management (Mentor CRUD) ─────────────────────────────────────────────

/**
 * Create a new availability slot for a mentor.
 * meetingLink is auto-generated as a Jitsi room based on the doc ID.
 */
export async function addMentorSlot(
  mentorId: string,
  startTime: Date,
  endTime: Date,
  fee: number,
): Promise<string> {
  const ref = await addDoc(collection(db, 'mentorSlots'), {
    mentorId,
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
    isBooked: false,
    meetingType: 'jitsi',
    meetingLink: '', // patched below once we have the doc ID
    fee,
    createdAt: serverTimestamp(),
  });
  // Patch meeting link with the real document ID
  await updateDoc(ref, { meetingLink: `/call/${ref.id}` });
  return ref.id;
}

/** Delete an unbooked slot owned by the calling mentor. */
export async function deleteMentorSlot(slotId: string): Promise<void> {
  const ref = doc(db, 'mentorSlots', slotId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('SLOT_NOT_FOUND');
  if (snap.data().isBooked) throw new Error('SLOT_ALREADY_BOOKED');
  await deleteDoc(ref);
}

/** Fetch ALL slots for a mentor (booked + unbooked) — used in the slot manager. */
export async function getAllMentorSlots(mentorId: string): Promise<MentorSlot[]> {
  const q = query(
    collection(db, 'mentorSlots'),
    where('mentorId', '==', mentorId),
    orderBy('startTime', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as MentorSlot;
  });
}

// ── Session Rating ─────────────────────────────────────────────────────────────

/**
 * Submit a post-session rating.
 * Atomically updates the mentor's rolling averageRating + totalRatings
 * and marks the booking as ratingSubmitted = true.
 */
export async function submitMentorRating(
  sessionId: string,
  mentorId: string,
  studentId: string,
  rating: number,
  comment: string,
): Promise<void> {
  const mentorRef = doc(db, 'mentors', mentorId);
  const bookingRef = doc(db, 'bookings', sessionId);

  await runTransaction(db, async (t) => {
    const mentorSnap = await t.get(mentorRef);
    const bookingSnap = await t.get(bookingRef);

    if (!mentorSnap.exists()) throw new Error('MENTOR_NOT_FOUND');
    if (!bookingSnap.exists()) throw new Error('SESSION_NOT_FOUND');
    if (bookingSnap.data().ratingSubmitted) throw new Error('RATING_ALREADY_SUBMITTED');

    const { averageRating = 0, totalRatings = 0 } = mentorSnap.data();
    const newTotal = totalRatings + 1;
    const newAvg = parseFloat(
      ((averageRating * totalRatings + rating) / newTotal).toFixed(2)
    );

    t.update(mentorRef, { averageRating: newAvg, totalRatings: newTotal, updatedAt: serverTimestamp() });
    t.update(bookingRef, { ratingSubmitted: true });
  });

  // Write rating doc (outside transaction — non-critical)
  await addDoc(collection(db, 'mentorRatings'), {
    sessionId,
    mentorId,
    studentId,
    rating,
    comment: comment.trim(),
    createdAt: serverTimestamp(),
  } satisfies Omit<MentorRating, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> });
}

// ── Admin — Mentor Approval ────────────────────────────────────────────────────

/** Fetch all mentor applications pending approval (mentorApproved = false). */
export async function getPendingMentorApplications(): Promise<PendingMentorApplication[]> {
  const q = query(
    collection(db, 'mentors'),
    where('mentorApproved', '==', false),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      userId: d.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as PendingMentorApplication;
  });
}

/** Admin: approve a pending mentor application. */
export async function approveMentorApplication(userId: string): Promise<void> {
  const mentorRef = doc(db, 'mentors', userId);
  const userRef = doc(db, 'users', userId);
  await Promise.all([
    updateDoc(mentorRef, { mentorApproved: true, updatedAt: serverTimestamp() }),
    updateDoc(userRef, { role: 'mentor', updatedAt: serverTimestamp() }),
  ]);
}

/** Admin: reject (delete) a pending mentor application. */
export async function rejectMentorApplication(userId: string): Promise<void> {
  const mentorRef = doc(db, 'mentors', userId);
  const userRef = doc(db, 'users', userId);
  await Promise.all([
    deleteDoc(mentorRef),
    updateDoc(userRef, { role: 'student', updatedAt: serverTimestamp() }),
  ]);
}

