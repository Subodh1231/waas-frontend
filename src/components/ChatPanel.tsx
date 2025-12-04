import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import api from '../lib/api';
import { useInterval } from '../hooks/useInterval';

interface Message {
  id: string;
  content: string;
  direction: 'IN' | 'OUT';
  createdAt: string;
  metadata?: {
    action?: string;
    [key: string]: any;
  };
}

interface Chat {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone: string;
}

interface ChatPanelProps {
  chatId: string | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ chatId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch chat details and messages
  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      
      // Fetch chat details to get customer phone
      const chatResponse = await api.get<Chat>(`/api/chats/${chatId}`);
      setChat(chatResponse.data);

      // Fetch messages
      const messagesResponse = await api.get<Message[]>(`/api/chats/${chatId}/messages`);
      setMessages(messagesResponse.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages when chatId changes
  useEffect(() => {
    if (chatId) {
      fetchMessages();
    } else {
      setMessages([]);
      setChat(null);
    }
  }, [chatId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages every 2 seconds
  useInterval(() => {
    if (chatId) {
      fetchMessages();
    }
  }, 2000);

  // Send message
  const handleSend = async () => {
    if (!messageText.trim() || !chat || sending) return;

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageText,
      direction: 'OUT',
      createdAt: new Date().toISOString(),
      metadata: {}
    };

    try {
      setSending(true);

      // Optimistically add message
      setMessages(prev => [...prev, optimisticMessage]);
      setMessageText('');

      // Send message to backend
      const response = await api.post('/api/whatsapp/send', {
        to: chat.customerPhone,
        text: messageText
      });

      console.log('Send message response:', response.data);

      // Refresh messages to get the actual message from server
      await fetchMessages();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to send message. Please try again.';
      alert(errorMsg);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key to send
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // No chat selected
  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {chat?.customerName || chat?.customerPhone || 'Loading...'}
          </h2>
          {chat?.customerPhone && (
            <p className="text-sm text-gray-500">{chat.customerPhone}</p>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            rows={2}
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition h-[72px]"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
