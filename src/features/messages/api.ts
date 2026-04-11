import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  where,
  getDocs,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Conversation, ChatMessage } from './types';

// Deterministic conversation ID from two uids
export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

// Get or create a conversation between two users
export async function getOrCreateConversation(
  currentUid: string,
  currentName: string,
  currentAvatar: string,
  otherUid: string,
  otherName: string,
  otherAvatar: string
): Promise<string> {
  const convId = getConversationId(currentUid, otherUid);
  const ref = doc(db, 'conversations', convId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [currentUid, otherUid],
      participantNames: { [currentUid]: currentName, [otherUid]: otherName },
      participantAvatars: { [currentUid]: currentAvatar, [otherUid]: otherAvatar },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastSenderId: '',
      unreadCount: { [currentUid]: 0, [otherUid]: 0 },
      createdAt: serverTimestamp(),
    });
  }
  return convId;
}

// Subscribe to all conversations for a user
export function subscribeToConversations(
  uid: string,
  callback: (convs: Conversation[]) => void
) {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const convs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        lastMessageAt: (data.lastMessageAt as Timestamp)?.toDate() || new Date(),
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      } as Conversation;
    });
    callback(convs);
  });
}

// Subscribe to messages in a conversation
export function subscribeToMessages(
  conversationId: string,
  callback: (msgs: ChatMessage[]) => void
) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      } as ChatMessage;
    });
    callback(msgs);
  });
}

// Send a text message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  content: string,
  otherUid: string
): Promise<void> {
  const msgRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(msgRef, {
    senderId,
    senderName,
    senderAvatar,
    content,
    type: 'text',
    createdAt: serverTimestamp(),
  });

  // Update conversation metadata
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessage: content.length > 60 ? content.slice(0, 60) + '…' : content,
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    [`unreadCount.${otherUid}`]: (await getDoc(convRef)).data()?.unreadCount?.[otherUid] + 1 || 1,
  });
}

// Send a call invite message
export async function sendCallInvite(
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  callRoomId: string,
  callType: 'video' | 'voice',
  otherUid: string
): Promise<void> {
  const content = callType === 'video' ? '📹 Started a video call' : '🎙️ Started a voice call';
  const msgRef = collection(db, 'conversations', conversationId, 'messages');
  await addDoc(msgRef, {
    senderId,
    senderName,
    senderAvatar,
    content,
    type: 'call_invite',
    callRoomId,
    callType,
    createdAt: serverTimestamp(),
  });

  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    lastMessage: content,
    lastMessageAt: serverTimestamp(),
    lastSenderId: senderId,
    [`unreadCount.${otherUid}`]: (await getDoc(convRef)).data()?.unreadCount?.[otherUid] + 1 || 1,
  });
}

// Mark all messages as read for a user
export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    [`unreadCount.${uid}`]: 0,
  });
}
