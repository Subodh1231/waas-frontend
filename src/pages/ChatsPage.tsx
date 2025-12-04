import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatList from '../components/ChatList';
import ChatPanel from '../components/ChatPanel';

const ChatsPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Handle chatId from query params (when navigating from customers page)
  useEffect(() => {
    const chatIdParam = searchParams.get('chatId');
    if (chatIdParam) {
      setSelectedChatId(chatIdParam);
    }
  }, [searchParams]);

  return (
    <div className="flex h-full">
      <ChatList 
        selectedChatId={selectedChatId} 
        onSelect={setSelectedChatId} 
      />
      {selectedChatId ? (
        <ChatPanel chatId={selectedChatId} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Select a chat to begin
            </h3>
            <p className="text-sm text-gray-500">
              Choose a conversation from the list to view messages
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
