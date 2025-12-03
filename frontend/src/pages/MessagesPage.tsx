import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Send,
  MessageCircle,
  User,
  Shield,
  Wrench,
  ChevronLeft,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { BottomNav } from '../components/layout/BottomNav';
import { useAuthStore } from '../stores/authStore';
import { messageAPI } from '../services/api';
import { cn, formatDateSmart } from '../utils/helpers';

interface Conversation {
  _id: string;
  participants: {
    _id: string;
    name: string;
    role: string;
    avatar?: string;
  }[];
  lastMessage?: {
    text: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  type: 'support' | 'order' | 'direct';
  orderId?: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.data.messages || []);
      // Mark as read
      await messageAPI.markAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      const response = await messageAPI.sendMessage(selectedConversation._id, newMessage.trim());
      setMessages([...messages, response.data.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const startSupportChat = async () => {
    try {
      const response = await messageAPI.getSupport();
      const conversation = response.data.conversation;
      setConversations([conversation, ...conversations.filter(c => c._id !== conversation._id)]);
      setSelectedConversation(conversation);
    } catch (error) {
      console.error('Error starting support chat:', error);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    const userId = user?.id || user?._id;
    return conv.participants.find(p => (typeof p === 'string' ? p : (p as any)._id) !== userId) || conv.participants[0];
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'technician':
        return <Wrench className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  // Conversation List View
  if (!selectedConversation) {
    return (
      <div className="min-h-screen bg-dark-950 pb-24">
        <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
          <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
            <Link to="/dashboard" className="p-2 -mr-2 text-dark-400 hover:text-white">
              <ArrowRight className="w-6 h-6" />
            </Link>
            <h1 className="flex-1 text-center font-semibold text-white">پیام‌ها</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-6">
          {/* Start Support Chat Button */}
          <button
            onClick={startSupportChat}
            className="w-full mb-4 p-4 bg-gradient-gold rounded-xl flex items-center justify-center gap-2 text-dark-950 font-medium"
          >
            <Shield className="w-5 h-5" />
            گفتگو با پشتیبانی
          </button>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="spinner" />
            </div>
          ) : conversations.length === 0 ? (
            <GlassCard padding="lg" className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-dark-600" />
              <p className="text-dark-400">پیامی ندارید</p>
              <p className="text-sm text-dark-500 mt-2">
                برای شروع گفتگو با پشتیبانی، دکمه بالا را بزنید
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                return (
                  <GlassCard
                    key={conv._id}
                    hoverable
                    padding="md"
                    onClick={() => setSelectedConversation(conv)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center">
                        {getRoleIcon(other.role)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{other.name}</span>
                          {conv.unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-gold-600 text-dark-950 text-xs rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-dark-400 truncate">
                          {conv.lastMessage?.text || 'بدون پیام'}
                        </p>
                      </div>
                      <div className="text-xs text-dark-500">
                        {conv.lastMessage && formatDateSmart(conv.lastMessage.createdAt)}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    );
  }

  // Chat View
  const other = getOtherParticipant(selectedConversation);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Chat Header */}
      <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => setSelectedConversation(null)}
            className="p-2 -mr-2 text-dark-400 hover:text-white"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center">
            {getRoleIcon(other.role)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">{other.name}</p>
            <p className="text-xs text-dark-400">
              {other.role === 'admin' ? 'پشتیبانی' : other.role === 'technician' ? 'تکنسین' : 'کاربر'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const userId = user?.id || user?._id;
          const senderId = typeof msg.senderId === 'string' ? msg.senderId : (msg.senderId as any)?._id;
          const isMe = senderId === userId;
          return (
            <div
              key={msg._id}
              className={cn('flex', isMe ? 'justify-start' : 'justify-end')}
            >
              <div
                className={cn(
                  'max-w-[80%] px-4 py-2 rounded-2xl',
                  isMe
                    ? 'bg-gold-600 text-dark-950 rounded-br-md'
                    : 'bg-dark-800 text-white rounded-bl-md'
                )}
              >
                <p>{msg.text}</p>
                <p className={cn('text-xs mt-1', isMe ? 'text-dark-700' : 'text-dark-500')}>
                  {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-dark-900 border-t border-dark-700/50 p-4">
        <div className="max-w-lg mx-auto flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-gold-600 text-dark-950 rounded-xl disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
