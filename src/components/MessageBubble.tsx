import dayjs from 'dayjs';

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

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isIncoming = message.direction === 'IN';

  const formatTime = (timestamp: string) => {
    return dayjs(timestamp).format('HH:mm');
  };

  const hasBookingAction = message.metadata?.action === 'CREATE_BOOKING';

  return (
    <div
      className={`flex mb-2 ${
        isIncoming ? 'justify-start' : 'justify-end'
      }`}
    >
      <div
        className={`rounded-xl px-4 py-2 max-w-[70%] ${
          isIncoming
            ? 'bg-gray-200 text-black'
            : 'bg-blue-600 text-white'
        }`}
      >
        {/* Message Content */}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Action Tag (if booking) */}
        {hasBookingAction && (
          <div className="mt-2">
            <span className="text-xs bg-green-200 text-green-800 rounded px-2 py-1">
              Booking
            </span>
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs mt-1 ${
            isIncoming ? 'text-gray-600' : 'text-blue-100'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
