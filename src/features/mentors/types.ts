import { Timestamp } from 'firebase/firestore';

export interface MentorProfile {
  userId: string;
  name: string;
  avatarUrl: string;
  college: string;
  headline: string;
  bio: string;
  subjects: string[];
  expertise: string[];
  fee: number; // in INR
  averageRating: number;
  totalRatings: number;
  sessionCount: number;
  mentorApproved: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface MentorSlot {
  id: string;
  mentorId: string;
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  isBooked: boolean;
  meetingType: 'jitsi' | 'google-meet';
  meetingLink: string;
  fee: number;
  createdAt: Timestamp | Date;
}

export interface SessionBooking {
  id: string;
  slotId: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  bookingStatus: 'confirmed' | 'cancelled' | 'completed';
  meetingLink: string;
  startTime: Timestamp | Date;
  endTime: Timestamp | Date;
  createdAt: Timestamp | Date;
}
