/**
 * Demo App for UnifiedChat Component
 * Use this to test and preview the chat interface
 */

import React, { useState } from 'react';
import UnifiedChat from './components/UnifiedChat';
import { ChatConfig, ChatCallbacks } from './types/chat';

type DemoContext = 'qr_now' | 'hotel_room' | 'web_menu';

const App: React.FC = () => {
  const [context, setContext] = useState<DemoContext>('qr_now');
  const [darkMode, setDarkMode] = useState(false);

  // Demo callbacks
  const callbacks: ChatCallbacks = {
    onMessageSent: (message) => {
      console.log('Message sent:', message);
    },
    onMessageReceived: (message) => {
      console.log('Message received:', message);
    },
    onOrderPlaced: (order) => {
      console.log('Order placed:', order);
    },
    onBookingMade: (booking) => {
      console.log('Booking made:', booking);
    },
    onFlowStarted: (flow) => {
      console.log('Flow started:', flow);
    },
    onFlowEnded: (flow) => {
      console.log('Flow ended:', flow);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  };

  // Chat configuration
  const chatConfig: ChatConfig = {
    restaurantId: 'demo-restaurant-001',
    context: context,
    tableNumber: 'T12',
    userId: 'demo-user-001',
    enableDarkMode: darkMode,
    enableAnimations: true,
    showTypingIndicator: true,
    typingDelay: 1500,
    theme: darkMode ? 'dark' : 'light',
    // Uncomment and set to connect to real API
    // apiBaseUrl: 'https://api.rez-support-copilot.com',
  };

  return (
    <div className="demo-app">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        .demo-app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .demo-header {
          background: #1C2A33;
          color: white;
          padding: 1rem;
          text-align: center;
        }

        .demo-header h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .demo-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .control-group label {
          font-size: 0.9rem;
          color: #8899A6;
        }

        .context-selector {
          display: flex;
          gap: 0.5rem;
        }

        .context-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #3A4F5C;
          background: transparent;
          color: #8899A6;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .context-btn:hover {
          border-color: #4CAF50;
          color: #4CAF50;
        }

        .context-btn.active {
          background: #4CAF50;
          border-color: #4CAF50;
          color: white;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toggle-switch {
          position: relative;
          width: 48px;
          height: 24px;
          background: #3A4F5C;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .toggle-switch.active {
          background: #4CAF50;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .toggle-switch.active::after {
          transform: translateX(24px);
        }

        .demo-content {
          flex: 1;
          display: flex;
          justify-content: center;
          background: #0D1B21;
          padding: 1rem;
        }

        .chat-container {
          width: 100%;
          max-width: 480px;
          height: calc(100vh - 120px);
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .demo-info {
          background: #1C2A33;
          padding: 1rem;
          text-align: center;
          font-size: 0.85rem;
          color: #8899A6;
        }

        .demo-info a {
          color: #4CAF50;
          text-decoration: none;
        }

        .demo-info a:hover {
          text-decoration: underline;
        }

        /* Mobile responsive */
        @media (max-width: 520px) {
          .chat-container {
            max-width: 100%;
            height: calc(100vh - 100px);
            border-radius: 0;
          }

          .demo-header {
            padding: 0.75rem;
          }

          .demo-header h1 {
            font-size: 1.25rem;
          }

          .context-btn {
            padding: 0.4rem 0.75rem;
            font-size: 0.8rem;
          }
        }
      `}</style>

      <header className="demo-header">
        <h1>REZ Unified Chat Demo</h1>
        <div className="demo-controls">
          <div className="control-group">
            <label>Context:</label>
            <div className="context-selector">
              <button
                className={`context-btn ${context === 'qr_now' ? 'active' : ''}`}
                onClick={() => setContext('qr_now')}
              >
                REZ NOW QR
              </button>
              <button
                className={`context-btn ${context === 'hotel_room' ? 'active' : ''}`}
                onClick={() => setContext('hotel_room')}
              >
                Hotel Room
              </button>
              <button
                className={`context-btn ${context === 'web_menu' ? 'active' : ''}`}
                onClick={() => setContext('web_menu')}
              >
                Web Menu
              </button>
            </div>
          </div>

          <div className="control-group">
            <div className="theme-toggle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <div
                className={`toggle-switch ${darkMode ? 'active' : ''}`}
                onClick={() => setDarkMode(!darkMode)}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main className="demo-content">
        <div className="chat-container">
          <UnifiedChat config={chatConfig} callbacks={callbacks} />
        </div>
      </main>

      <footer className="demo-info">
        <p>
          Unified Chat Component for REZ applications
          <br />
          <a href="https://github.com/rez-team/rez-unified-chat" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default App;
