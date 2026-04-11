import { Timestamp } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: Date | Timestamp;
  type: 'text' | 'call_invite';
  callRoomId?: string;
  callType?: 'video' | 'voice';
}

export interface Conversation {
  id: string; // always sorted: uid1_uid2
  participants: string[]; // [uid1, uid2]
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage: string;
  lastMessageAt: Date | Timestamp;
  lastSenderId: string;
  unreadCount: Record<string, number>; // per-user unread count
  createdAt: Date | Timestamp;
}
