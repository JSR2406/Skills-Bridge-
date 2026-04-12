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
    bookingStatus: 'confirmed', // Technically pending payment completion, but simplifying logic for sandbox
    meetingLink: slot.meetingLink || `https://meet.jit.si/skillbridge_${slot.id}`,
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
  await updateDoc(doc(db, 'bookings', bookingId), {
    paymentStatus: 'paid',
    razorpayPaymentId,
  });
}

export async function getUserSessions(userId: string): Promise<SessionBooking[]> {
  const q = query(
    collection(db, 'bookings'),
    where('studentId', '==', userId)
  );
  
  const snap = await getDocs(q);
  return snap.docs
    .map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as SessionBooking;
    })
    .sort((a, b) => (b.startTime as any).getTime() - (a.startTime as any).getTime());
}

export function subscribeToUserSessions(userId: string, callback: (sessions: SessionBooking[]) => void) {
  const q = query(
    collection(db, 'bookings'),
    where('studentId', '==', userId),
    orderBy('startTime', 'desc')
  );
  
  return onSnapshot(q, (snap) => {
    const sessions = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as SessionBooking;
    });
    callback(sessions);
  });
}
