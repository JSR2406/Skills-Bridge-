'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  sendCallInvite,
  markConversationRead,
  getOrCreateConversation,
} from '@/features/messages/api';
import { Conversation, ChatMessage } from '@/features/messages/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Send,
  Video,
  Phone,
  Search,
  X,
  Loader2,
  PhoneCall,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherUid = activeConv?.participants.find((p) => p !== user?.uid);
  const otherName = otherUid ? activeConv?.participantNames[otherUid] : '';
  const otherAvatar = otherUid ? activeConv?.participantAvatars[otherUid] : '';

  // Subscribe to conversations
  useEffect(() => {
    if (!user?.uid) return;
    setIsLoadingConvs(true);
    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setIsLoadingConvs(false);
    });
    return unsub;
  }, [user?.uid]);

  // Subscribe to active conversation messages
  useEffect(() => {
    if (!activeConvId) return;
    const unsub = subscribeToMessages(activeConvId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [activeConvId]);

  // Mark as read on open
  useEffect(() => {
    if (activeConvId && user?.uid) {
      markConversationRead(activeConvId, user.uid).catch(console.error);
    }
  }, [activeConvId, user?.uid]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim() || !user || !profile || !activeConvId || !otherUid) return;
    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);
    try {
      await sendMessage(
        activeConvId,
        user.uid,
        profile.name,
        profile.avatarUrl || '',
        content,
        otherUid
      );
    } catch (e: any) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startCall = async (type: 'video' | 'voice') => {
    if (!activeConvId || !user || !profile || !otherUid) return;
    const roomId = `skillbridge_${activeConvId}_${Date.now()}`;
    try {
      await sendCallInvite(
        activeConvId,
        user.uid,
        profile.name,
        profile.avatarUrl || '',
        roomId,
        type,
        otherUid
      );
      router.push(`/call/${roomId}?type=${type}&name=${encodeURIComponent(profile.name)}`);
    } catch (e) {
      toast.error('Failed to start call');
    }
  };

  // Search users to start new conversation
  const searchUsers = async (q: string) => {
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    setIsSearchingUsers(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('name', '>=', q), where('name', '<=', q + '\uf8ff'))
      );
      setSearchResults(
        snap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter((u: any) => u.uid !== user?.uid)
      );
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const openConvWithUser = async (other: any) => {
    if (!user || !profile) return;
    const convId = await getOrCreateConversation(
      user.uid,
      profile.name,
      profile.avatarUrl || '',
      other.uid,
      other.name,
      other.avatarUrl || ''
    );
    setActiveConvId(convId);
    setShowNewChat(false);
    setUserSearchQuery('');
    setSearchResults([]);
  };

  const filteredConvs = conversations.filter((c) => {
    const otherId = c.participants.find((p) => p !== user?.uid);
    const name = otherId ? c.participantNames[otherId] : '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-full w-full flex md:rounded-xl border-0 md:border overflow-hidden md:glass-card animate-fade-in relative bg-[rgba(11,19,38,0.6)] md:bg-transparent">
      {/* ── Sidebar ── */}
      <div
        className={cn(
          "w-full md:w-80 shrink-0 flex flex-col border-r h-full",
          activeConvId ? "hidden md:flex" : "flex"
        )}
        style={{ borderColor: 'rgba(79,219,200,0.08)', background: 'rgba(11,19,38,0.6)' }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(79,219,200,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-base font-extrabold text-[#dae2fd]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Messages
            </h2>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8899b8] hover:text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.08)] transition-colors"
              title="New Conversation"
            >
              {showNewChat ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </button>
          </div>

          {showNewChat ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4fdbc8]/50" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search users..."
                className="w-full h-9 pl-9 pr-3 text-sm text-[#dae2fd] placeholder:text-[#8899b8]/60 rounded-lg outline-none"
                style={{
                  background: 'rgba(28,36,64,0.8)',
                  border: '1px solid rgba(79,219,200,0.2)',
                }}
              />
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4fdbc8]/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-9 pl-9 pr-3 text-sm text-[#dae2fd] placeholder:text-[#8899b8]/60 rounded-lg outline-none"
                style={{
                  background: 'rgba(28,36,64,0.8)',
                  border: '1px solid rgba(79,219,200,0.1)',
                }}
              />
            </div>
          )}
        </div>

        {/* User search results */}
        {showNewChat && (
          <div className="flex-1 overflow-y-auto">
            {isSearchingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[#4fdbc8] animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-2 space-y-1">
                {searchResults.map((u: any) => (
                  <button
                    key={u.uid}
                    onClick={() => openConvWithUser(u)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-[rgba(79,219,200,0.05)] transition-colors"
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback
                        style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)', color: '#00201c' }}
                        className="text-xs font-bold"
                      >
                        {u.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[#dae2fd]">{u.name}</p>
                      <p className="text-xs text-[#8899b8]">{u.college || u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : userSearchQuery.length >= 2 ? (
              <p className="text-center text-sm text-[#8899b8] py-8">No users found</p>
            ) : (
              <p className="text-center text-xs text-[#8899b8]/60 py-8">Type at least 2 characters to search</p>
            )}
          </div>
        )}

        {/* Conversation list */}
        {!showNewChat && (
          <div className="flex-1 overflow-y-auto">
            {isLoadingConvs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-[#4fdbc8] animate-spin" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-8 h-8 text-[#8899b8]/30 mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#dae2fd]">No conversations yet</p>
                <p className="text-xs text-[#8899b8] mt-1">Click the icon above to start a new chat</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConvs.map((conv) => {
                  const otherId = conv.participants.find((p) => p !== user?.uid);
                  const name = otherId ? conv.participantNames[otherId] : 'Unknown';
                  const avatar = otherId ? conv.participantAvatars[otherId] : '';
                  const unread = user?.uid ? conv.unreadCount?.[user.uid] : 0;
                  const isActive = conv.id === activeConvId;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                        isActive
                          ? 'bg-[rgba(79,219,200,0.1)] border border-[rgba(79,219,200,0.2)]'
                          : 'hover:bg-[rgba(79,219,200,0.05)]'
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={avatar} />
                          <AvatarFallback
                            style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)', color: '#00201c' }}
                            className="text-xs font-bold"
                          >
                            {name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#4fdbc8] text-[#00201c] text-[9px] font-bold rounded-full flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-[13px] font-semibold truncate',
                              unread > 0 ? 'text-[#dae2fd]' : 'text-[#c8d4f0]'
                            )}
                          >
                            {name}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-[#8899b8] shrink-0 ml-1">
                              {formatDistanceToNow(
                                conv.lastMessageAt instanceof Date
                                  ? conv.lastMessageAt
                                  : new Date(),
                                { addSuffix: true }
                              )}
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-[11px] truncate mt-0.5',
                            unread > 0 ? 'text-[#8899b8] font-medium' : 'text-[#8899b8]/70'
                          )}
                        >
                          {conv.lastMessage || 'Start a conversation'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Chat Area ── */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 h-full bg-[rgba(15,23,37,0.5)]",
          !activeConvId ? "hidden md:flex" : "flex"
        )}
      >
        {activeConvId && activeConv ? (
          <>
            {/* Chat Header */}
            <div
              className="h-14 flex items-center justify-between px-3 md:px-5 border-b shrink-0"
              style={{ borderColor: 'rgba(79,219,200,0.08)', background: 'rgba(11,19,38,0.7)' }}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setActiveConvId(null)}
                  className="md:hidden p-1.5 -ml-1.5 rounded-lg text-[#8899b8] hover:text-[#dae2fd] hover:bg-[rgba(79,219,200,0.08)] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={otherAvatar} />
                  <AvatarFallback
                    style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)', color: '#00201c' }}
                    className="text-xs font-bold"
                  >
                    {otherName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-[#dae2fd]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {otherName}
                  </p>
                  <p className="text-[10px] text-[#4fdbc8] font-medium">Active now</p>
                </div>
              </div>

              {/* Call buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startCall('voice')}
                  className="p-2 rounded-lg text-[#8899b8] hover:text-[#4fdbc8] hover:bg-[rgba(79,219,200,0.08)] transition-colors"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCall('video')}
                  className="p-2 rounded-lg text-[#8899b8] hover:text-[#ddb7ff] hover:bg-[rgba(221,183,255,0.08)] transition-colors"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: 'rgba(79,219,200,0.08)', border: '1px solid rgba(79,219,200,0.15)' }}>
                    <MessageSquare className="w-6 h-6 text-[#4fdbc8]/60" />
                  </div>
                  <p className="text-sm font-semibold text-[#dae2fd]">No messages yet</p>
                  <p className="text-xs text-[#8899b8] mt-1">Send a message to start the conversation</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                if (msg.type === 'call_invite') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-medium text-[#8899b8]"
                        style={{ background: 'rgba(28,36,64,0.8)', border: '1px solid rgba(79,219,200,0.1)' }}>
                        <PhoneCall className="w-3.5 h-3.5 text-[#4fdbc8]" />
                        {msg.content}
                        {!isMe && msg.callRoomId && (
                          <button
                            onClick={() =>
                              router.push(
                                `/call/${msg.callRoomId}?type=${msg.callType}&name=${encodeURIComponent(profile?.name || '')}`
                              )
                            }
                            className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold btn-gradient"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={cn('flex gap-2.5', isMe ? 'flex-row-reverse' : 'flex-row')}>
                    {!isMe && (
                      <Avatar className="w-7 h-7 shrink-0 mt-1">
                        <AvatarImage src={msg.senderAvatar} />
                        <AvatarFallback className="text-[10px] font-bold"
                          style={{ background: 'linear-gradient(135deg, #4fdbc8, #ddb7ff)', color: '#00201c' }}>
                          {msg.senderName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn('max-w-[70%] group', isMe ? 'items-end' : 'items-start')}>
                      <div
                        className={cn(
                          'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                          isMe
                            ? 'bg-gradient-to-br from-[#4fdbc8] to-[#2ec4b6] text-[#00201c] rounded-tr-sm font-medium'
                            : 'text-[#dae2fd] rounded-tl-sm'
                        )}
                        style={
                          !isMe
                            ? { background: 'rgba(28,36,64,0.9)', border: '1px solid rgba(79,219,200,0.08)' }
                            : {}
                        }
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-[#8899b8]/60 mt-1 block px-1">
                        {msg.createdAt instanceof Date
                          ? formatDistanceToNow(msg.createdAt, { addSuffix: true })
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-4 border-t shrink-0"
              style={{ borderColor: 'rgba(79,219,200,0.08)', background: 'rgba(11,19,38,0.7)' }}
            >
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send)"
                  rows={1}
                  className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm text-[#dae2fd] placeholder:text-[#8899b8]/60 outline-none transition-all max-h-32"
                  style={{
                    background: 'rgba(28,36,64,0.8)',
                    border: '1px solid rgba(79,219,200,0.15)',
                    lineHeight: '1.5',
                  }}
                  onInput={(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={isSending || !messageInput.trim()}
                  className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: 'rgba(79,219,200,0.06)',
                border: '1px solid rgba(79,219,200,0.12)',
                boxShadow: '0 0 40px rgba(79,219,200,0.08)',
              }}
            >
              <MessageSquare className="w-9 h-9 text-[#4fdbc8]/60" />
            </div>
            <h2
              className="text-xl font-extrabold text-[#dae2fd] mb-2"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Your Messages
            </h2>
            <p className="text-sm text-[#8899b8] max-w-xs mb-6">
              Connect with mentors, peers, and fellow students in real time. Select a conversation or start a new one.
            </p>
            <button
              onClick={() => setShowNewChat(true)}
              className="btn-gradient px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Start a Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
