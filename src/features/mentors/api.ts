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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { MentorProfile, MentorSlot, SessionBooking } from './types';

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
export async function createSessionBooking(
  slot: MentorSlot,
  mentor: MentorProfile,
  studentId: string,
  studentName: string,
  razorpayOrderId: string
): Promise<string> {
  const bookingData: Omit<SessionBooking, 'id'> = {
    slotId: slot.id,
    mentorId: mentor.userId,
    mentorName: mentor.name,
    mentorAvatar: mentor.avatarUrl,
    studentId,
    studentName,
    amount: slot.fee,
    paymentStatus: 'pending',
    razorpayOrderId,
    bookingStatus: 'confirmed',
    meetingLink: `/call?session=${slot.id}`,   // in-app call page
    startTime: slot.startTime,
    endTime: slot.endTime,
    createdAt: serverTimestamp() as any,
  };

  // Create booking
  const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
  
  // Mark slot as booked
  await updateDoc(doc(db, 'mentorSlots', slot.id), {
    isBooked: true
  });
  
  return bookingRef.id;
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
