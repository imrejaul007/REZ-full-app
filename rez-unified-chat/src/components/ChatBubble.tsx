/**
 * ChatBubble Component
 * Individual message bubble for chat interface
 */

import React from 'react';
import { ChatMessage, Order, BookingDetails } from '../types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  darkMode?: boolean;
  onQuickReplyClick?: (value: string) => void;
  onOrderClick?: (order: Order) => void;
  onBookingClick?: (booking: BookingDetails) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  darkMode = false,
  onQuickReplyClick,
  onOrderClick,
  onBookingClick,
}) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = () => {
    if (!isUser) return null;

    switch (message.status) {
      case 'sending':
        return <span className="status-icon sending">○</span>;
      case 'sent':
        return <span className="status-icon sent">✓</span>;
      case 'delivered':
        return <span className="status-icon delivered">✓✓</span>;
      case 'read':
        return <span className="status-icon read">✓✓</span>;
      case 'failed':
        return <span className="status-icon failed">!</span>;
      default:
        return null;
    }
  };

  const renderContent = () => {
    // Check if message should display order/booking info
    if (message.type === 'order' && message.order) {
      return (
        <div className="order-preview">
          <div className="order-header">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span>Order Placed</span>
          </div>
          <div className="order-items">
            {message.order.items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="order-item">
                <span>
                  {item.quantity}x {item.menuItem.name}
                </span>
                <span>${(item.menuItem.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            {message.order.items.length > 3 && (
              <div className="order-more">
                +{message.order.items.length - 3} more items
              </div>
            )}
          </div>
          <div className="order-total">
            <span>Total</span>
            <span>${message.order.totalAmount.toFixed(2)}</span>
          </div>
          <button
            className="view-order-btn"
            onClick={() => onOrderClick?.(message.order!)}
          >
            View Order
          </button>
        </div>
      );
    }

    if (message.type === 'booking' && message.booking) {
      return (
        <div className="booking-preview">
          <div className="booking-header">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Booking Confirmed</span>
          </div>
          <div className="booking-details">
            <div className="booking-row">
              <span>Date</span>
              <span>
                {new Date(message.booking.date).toLocaleDateString()}
              </span>
            </div>
            <div className="booking-row">
              <span>Time</span>
              <span>{message.booking.time}</span>
            </div>
            <div className="booking-row">
              <span>Guests</span>
              <span>{message.booking.partySize}</span>
            </div>
          </div>
          <button
            className="view-booking-btn"
            onClick={() => onBookingClick?.(message.booking!)}
          >
            View Booking
          </button>
        </div>
      );
    }

    return <p className="message-text">{message.content}</p>;
  };

  return (
    <div
      className={`chat-bubble-container ${isUser ? 'user' : 'bot'} ${
        isSystem ? 'system' : ''
      } ${darkMode ? 'dark' : 'light'}`}
    >
      <style>{`
        .chat-bubble-container {
          display: flex;
          margin-bottom: 0.75rem;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chat-bubble-container.user {
          justify-content: flex-end;
        }

        .chat-bubble-container.bot {
          justify-content: flex-start;
        }

        .chat-bubble-container.system {
          justify-content: center;
        }

        .chat-bubble {
          max-width: 80%;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          position: relative;
        }

        /* User bubble - light mode */
        .chat-bubble-container.user.light .chat-bubble {
          background: #DCF8C6;
          border-bottom-right-radius: 4px;
        }

        /* User bubble - dark mode */
        .chat-bubble-container.user.dark .chat-bubble {
          background: #056162;
          color: #E9F8F4;
          border-bottom-right-radius: 4px;
        }

        /* Bot bubble - light mode */
        .chat-bubble-container.bot.light .chat-bubble {
          background: white;
          border: 1px solid #E0E0E0;
          border-bottom-left-radius: 4px;
        }

        /* Bot bubble - dark mode */
        .chat-bubble-container.bot.dark .chat-bubble {
          background: #1C2A33;
          color: #E9F8F4;
          border-bottom-left-radius: 4px;
        }

        /* System bubble */
        .chat-bubble-container.system .chat-bubble {
          background: transparent;
          color: #888;
          font-size: 0.8rem;
          text-align: center;
          padding: 0.25rem 0.5rem;
        }

        .message-text {
          margin: 0;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .message-time {
          font-size: 0.7rem;
          color: #888;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          justify-content: flex-end;
        }

        .chat-bubble-container.dark .message-time {
          color: #6B8A94;
        }

        .status-icon {
          font-size: 0.65rem;
        }

        .status-icon.read {
          color: #4FC3F7;
        }

        /* Quick replies */
        .quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .quick-reply-btn {
          padding: 0.375rem 0.75rem;
          border: 1px solid;
          border-radius: 1rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chat-bubble-container.light .quick-reply-btn {
          border-color: #4CAF50;
          background: transparent;
          color: #4CAF50;
        }

        .chat-bubble-container.light .quick-reply-btn:hover {
          background: #4CAF50;
          color: white;
        }

        .chat-bubble-container.dark .quick-reply-btn {
          border-color: #00BCD4;
          background: transparent;
          color: #00BCD4;
        }

        .chat-bubble-container.dark .quick-reply-btn:hover {
          background: #00BCD4;
          color: #0D1B21;
        }

        /* Order preview */
        .order-preview, .booking-preview {
          min-width: 200px;
        }

        .order-header, .booking-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid;
        }

        .chat-bubble-container.light .order-header,
        .chat-bubble-container.light .booking-header {
          border-color: #E0E0E0;
          color: #4CAF50;
        }

        .chat-bubble-container.dark .order-header,
        .chat-bubble-container.dark .booking-header {
          border-color: #3A4F5C;
          color: #4CAF50;
        }

        .order-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .order-more {
          font-size: 0.75rem;
          color: #888;
        }

        .order-total {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid;
        }

        .chat-bubble-container.light .order-total {
          border-color: #E0E0E0;
        }

        .chat-bubble-container.dark .order-total {
          border-color: #3A4F5C;
        }

        .view-order-btn, .view-booking-btn {
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.5rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chat-bubble-container.light .view-order-btn,
        .chat-bubble-container.light .view-booking-btn {
          background: #4CAF50;
          color: white;
        }

        .chat-bubble-container.dark .view-order-btn,
        .chat-bubble-container.dark .view-booking-btn {
          background: #2E7D32;
          color: white;
        }

        .view-order-btn:hover, .view-booking-btn:hover {
          opacity: 0.9;
        }

        /* Booking details */
        .booking-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .booking-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .booking-row span:first-child {
          color: #888;
        }

        @media (max-width: 360px) {
          .chat-bubble {
            max-width: 85%;
            padding: 0.625rem 0.875rem;
          }
        }
      `}</style>
      <div className="chat-bubble">
        {renderContent()}

        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="quick-replies">
            {message.quickReplies.map((reply, idx) => (
              <button
                key={idx}
                className="quick-reply-btn"
                onClick={() => onQuickReplyClick?.(reply.value)}
              >
                {reply.label}
              </button>
            ))}
          </div>
        )}

        {!isSystem && (
          <div className="message-time">
            {formatTime(message.timestamp)}
            {getStatusIcon()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
