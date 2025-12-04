import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import api from '../lib/api';
import { useInterval } from '../hooks/useInterval';

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

interface Chat {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface ChatListProps {
  selectedChatId: string | null;
  onSelect: (chatId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChatId, onSelect }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = async () => {
    try {
      const response = await api.get<Chat[]>('/api/chats?limit=50');
      setChats(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch chats:', err);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchChats();
  }, []);

  // Poll every 3 seconds
  useInterval(() => {
    fetchChats();
  }, 3000);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return dayjs(timestamp).fromNow();
  };

  const truncateMessage = (text?: string, maxLength = 50) => {
    if (!text) return 'No messages yet';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Loading chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
        <p className="text-sm text-gray-500">{chats.length} conversations</p>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No chats available
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelect(chat.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition ${
                selectedChatId === chat.id
                  ? 'bg-gray-200 font-semibold'
                  : 'hover:bg-gray-100'
              }`}
            >
              {/* Customer Name/Phone */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {chat.customerName || chat.customerPhone}
                </h3>
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>

              {/* Last Message Snippet */}
              <p className="text-sm text-gray-600 truncate mb-1">
                {truncateMessage(chat.lastMessageText)}
              </p>

              {/* Timestamp */}
              <p className="text-xs text-gray-400">
                {formatTimestamp(chat.lastMessageAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
