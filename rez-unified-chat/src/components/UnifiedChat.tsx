/**
 * UnifiedChat Component
 * Main chat interface that integrates all chat features
 * Used across: REZ NOW QR, Hotel Room QR, Web Menu QR
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatMessage,
  ChatSession,
  ChatConfig,
  QuickActionType,
  OrderItem,
  BookingFlowState,
  FlowType,
  Order,
  BookingDetails,
  ChatCallbacks,
} from '../types/chat';
import ChatService, { generateId } from '../services/chatService';
import ChatBubble from './ChatBubble';
import QuickActions from './QuickActions';
import OrderFlow from './OrderFlow';
import BookingFlow from './BookingFlow';

interface UnifiedChatProps {
  config: ChatConfig;
  callbacks?: ChatCallbacks;
}

const UnifiedChat: React.FC<UnifiedChatProps> = ({ config, callbacks }) => {
  // State
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeFlow, setActiveFlow] = useState<FlowType>(null);
  const [darkMode, setDarkMode] = useState(config.enableDarkMode ?? false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatServiceRef = useRef<ChatService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat service and session
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const service = new ChatService(config);
        chatServiceRef.current = service;

        const chatSession = await service.initSession();
        setSession(chatSession);
        setMessages(chatSession.messages);
        setIsConnected(true);

        // Trigger callback
        callbacks?.onMessageReceived?.(chatSession.messages[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize chat');
        setIsConnected(false);
        callbacks?.onError?.(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [config.restaurantId, config.context]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle theme changes
  useEffect(() => {
    if (config.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setDarkMode(config.theme === 'dark');
    }
  }, [config.theme]);

  // Send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatServiceRef.current) return;

    const content = inputValue.trim();
    setInputValue('');

    try {
      const { userMessage, botMessage } = await chatServiceRef.current.sendMessage(content);

      setMessages((prev) => [...prev, userMessage, botMessage]);
      callbacks?.onMessageSent?.(userMessage);
      callbacks?.onMessageReceived?.(botMessage);

      // Show typing indicator for bot response
      if (config.showTypingIndicator) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      callbacks?.onError?.(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Handle quick action
  const handleQuickAction = async (action: QuickActionType) => {
    if (!chatServiceRef.current) return;

    setActiveFlow(action === 'order' ? 'order' : action === 'book' ? 'booking' : 'enquiry');
    callbacks?.onFlowStarted?.(activeFlow);

    // Send quick action as message
    const userMessage = {
      id: generateId(),
      type: 'text' as const,
      content: action.charAt(0).toUpperCase() + action.slice(1),
      sender: 'user' as const,
      timestamp: new Date(),
      status: 'sent' as const,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Start the flow and get bot response
    try {
      const botMessage = await chatServiceRef.current.startFlow(action);
      setMessages((prev) => [...prev, botMessage]);
      callbacks?.onMessageReceived?.(botMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start flow');
    }
  };

  // Handle quick reply click
  const handleQuickReplyClick = (value: string) => {
    handleQuickAction(value as QuickActionType);
  };

  // Handle order placement
  const handlePlaceOrder = async (items: OrderItem[], tableNumber?: string) => {
    if (!chatServiceRef.current) return;

    try {
      const order = await chatServiceRef.current.placeOrder(items, tableNumber || config.tableNumber);
      setOrderHistory((prev) => [order, ...prev]);
      setActiveFlow(null);
      callbacks?.onOrderPlaced?.(order);

      // Refresh messages to include confirmation
      const currentSession = chatServiceRef.current.getSession();
      if (currentSession) {
        setMessages(currentSession.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
      throw err;
    }
  };

  // Handle booking
  const handleBook = async (details: BookingFlowState) => {
    if (!chatServiceRef.current) return;

    try {
      const booking = await chatServiceRef.current.makeBooking(details);
      setActiveFlow(null);
      callbacks?.onBookingMade?.(booking);

      // Refresh messages to include confirmation
      const currentSession = chatServiceRef.current.getSession();
      if (currentSession) {
        setMessages(currentSession.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make booking');
      throw err;
    }
  };

  // Handle enquiry
  const handleEnquiry = async (question: string) => {
    if (!chatServiceRef.current) return;

    const userMessage = {
      id: generateId(),
      type: 'enquiry' as const,
      content: question,
      sender: 'user' as const,
      timestamp: new Date(),
      status: 'sent' as const,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await chatServiceRef.current.submitEnquiry({
        type: 'other',
        question,
      });

      const botMessage = {
        id: generateId(),
        type: 'text' as const,
        content: response,
        sender: 'bot' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      };

      setMessages((prev) => [...prev, botMessage]);
      setActiveFlow(null);
      callbacks?.onMessageReceived?.(botMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit enquiry');
    } finally {
      setIsTyping(false);
    }
  };

  // Close flow
  const handleCloseFlow = () => {
    setActiveFlow(null);
    if (chatServiceRef.current) {
      chatServiceRef.current.endFlow();
    }
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={`unified-chat loading ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-spinner">
          <svg className="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.416" strokeDashoffset="10" />
          </svg>
          <p>Connecting to chat...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !isConnected) {
    return (
      <div className={`unified-chat error ${darkMode ? 'dark' : 'light'}`}>
        <div className="error-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Connection Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`unified-chat ${darkMode ? 'dark' : 'light'}`}>
      <style>{`
        .unified-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100vh;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          position: relative;
        }

        .unified-chat.light {
          background: #EEF2F7;
          color: #333;
        }

        .unified-chat.dark {
          background: #0D1B21;
          color: #E9F8F4;
        }

        /* Header */
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid;
        }

        .unified-chat.light .chat-header {
          background: white;
          border-color: #E0E0E0;
        }

        .unified-chat.dark .chat-header {
          background: #1C2A33;
          border-color: #3A4F5C;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4CAF50, #2196F3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }

        .chat-header-text h3 {
          margin: 0;
          font-size: 1rem;
        }

        .chat-status {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8rem;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4CAF50;
        }

        .chat-actions {
          display: flex;
          gap: 0.5rem;
        }

        .header-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background 0.2s ease;
        }

        .unified-chat.light .header-btn {
          color: #666;
        }

        .unified-chat.dark .header-btn {
          color: #8899A6;
        }

        .header-btn:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .unified-chat.dark .header-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .message-group {
          display: flex;
          flex-direction: column;
        }

        /* Typing indicator */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          margin-bottom: 0.75rem;
          width: fit-content;
        }

        .unified-chat.light .typing-indicator {
          background: white;
          border: 1px solid #E0E0E0;
        }

        .unified-chat.dark .typing-indicator {
          background: #1C2A33;
        }

        .typing-dots {
          display: flex;
          gap: 0.25rem;
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .unified-chat.light .typing-dot {
          background: #666;
        }

        .unified-chat.dark .typing-dot {
          background: #8899A6;
        }

        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Input area */
        .chat-input-area {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          padding: 1rem;
          border-top: 1px solid;
        }

        .unified-chat.light .chat-input-area {
          background: white;
          border-color: #E0E0E0;
        }

        .unified-chat.dark .chat-input-area {
          background: #1C2A33;
          border-color: #3A4F5C;
        }

        .chat-input-wrapper {
          flex: 1;
          display: flex;
          align-items: flex-end;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 1.5rem;
          padding: 0.25rem 0.5rem;
        }

        .unified-chat.dark .chat-input-wrapper {
          background: rgba(0, 0, 0, 0.2);
        }

        .chat-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 0.625rem;
          font-size: 1rem;
          resize: none;
          max-height: 120px;
          font-family: inherit;
        }

        .chat-input:focus {
          outline: none;
        }

        .unified-chat.light .chat-input {
          color: #333;
        }

        .unified-chat.dark .chat-input {
          color: #E9F8F4;
        }

        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #4CAF50;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .send-btn:hover {
          background: #43A047;
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        /* Loading state */
        .unified-chat.loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          text-align: center;
        }

        .spinner {
          width: 48px;
          height: 48px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-spinner p {
          margin-top: 1rem;
          color: #888;
        }

        /* Error state */
        .unified-chat.error {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-content {
          text-align: center;
          padding: 2rem;
        }

        .error-content h3 {
          margin: 1rem 0 0.5rem;
        }

        .error-content p {
          color: #888;
          margin-bottom: 1.5rem;
        }

        .error-content button {
          padding: 0.75rem 1.5rem;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
        }

        /* Order history panel */
        .order-history-btn {
          position: absolute;
          top: 4.5rem;
          right: 1rem;
          z-index: 10;
        }

        /* Context badge */
        .context-badge {
          position: absolute;
          top: 4.5rem;
          left: 1rem;
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .unified-chat.light .context-badge {
          background: #E3F2FD;
          color: #1976D2;
        }

        .unified-chat.dark .context-badge {
          background: #1C3A4C;
          color: #64B5F6;
        }

        @media (max-width: 480px) {
          .unified-chat {
            max-width: 100%;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }
        }
      `}</style>

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">R</div>
          <div className="chat-header-text">
            <h3>REZ Support</h3>
            <div className="chat-status">
              <span className="status-dot" />
              <span>{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="chat-actions">
          <button
            className="header-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Context badge */}
      <div className="context-badge">
        {config.context === 'qr_now' && 'REZ NOW QR'}
        {config.context === 'hotel_room' && 'Hotel Room'}
        {config.context === 'web_menu' && 'Web Menu'}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            darkMode={darkMode}
            onQuickReplyClick={handleQuickReplyClick}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 3 && !activeFlow && (
        <QuickActions
          onAction={handleQuickAction}
          darkMode={darkMode}
          disabled={isTyping}
        />
      )}

      {/* Input area */}
      {!activeFlow && (
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isTyping}
            />
          </div>
          <button
            className="send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}

      {/* Order flow modal */}
      {activeFlow === 'order' && (
        <OrderFlow
          onClose={handleCloseFlow}
          onPlaceOrder={handlePlaceOrder}
          onBack={handleCloseFlow}
          darkMode={darkMode}
          tableNumber={config.tableNumber}
          isLoading={isLoading}
        />
      )}

      {/* Booking flow modal */}
      {activeFlow === 'booking' && (
        <BookingFlow
          onClose={handleCloseFlow}
          onBook={handleBook}
          darkMode={darkMode}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default UnifiedChat;
