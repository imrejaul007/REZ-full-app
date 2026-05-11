/**
 * QuickActions Component
 * Order/Book/Enquire action buttons for chat interface
 */

import React from 'react';
import { QuickActionType } from '../types/chat';

interface QuickActionsProps {
  onAction: (action: QuickActionType) => void;
  disabled?: boolean;
  darkMode?: boolean;
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onAction,
  disabled = false,
  darkMode = false,
  className = '',
}) => {
  const actions: { type: QuickActionType; label: string; icon: string }[] = [
    { type: 'order', label: 'Order', icon: 'cart' },
    { type: 'book', label: 'Book', icon: 'calendar' },
    { type: 'enquire', label: 'Enquire', icon: 'help' },
  ];

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'cart':
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        );
      case 'calendar':
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'help':
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`quick-actions ${className}`}>
      <style>{`
        .quick-actions {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          justify-content: center;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border: none;
          border-radius: 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
          max-width: 120px;
          justify-content: center;
        }

        .quick-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quick-action-btn:not(:disabled):hover {
          transform: scale(1.02);
        }

        .quick-action-btn:not(:disabled):active {
          transform: scale(0.98);
        }

        /* Light mode */
        .quick-actions.light .quick-action-btn.order {
          background: #4CAF50;
          color: white;
        }

        .quick-actions.light .quick-action-btn.book {
          background: #2196F3;
          color: white;
        }

        .quick-actions.light .quick-action-btn.enquire {
          background: #FF9800;
          color: white;
        }

        /* Dark mode */
        .quick-actions.dark .quick-action-btn.order {
          background: #2E7D32;
          color: white;
        }

        .quick-actions.dark .quick-action-btn.book {
          background: #1565C0;
          color: white;
        }

        .quick-actions.dark .quick-action-btn.enquire {
          background: #E65100;
          color: white;
        }

        @media (max-width: 360px) {
          .quick-action-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.8rem;
          }

          .quick-action-btn svg {
            width: 16px;
            height: 16px;
          }
        }
      `}</style>
      {actions.map((action) => (
        <button
          key={action.type}
          className={`quick-action-btn ${action.type} ${darkMode ? 'dark' : 'light'}`}
          onClick={() => onAction(action.type)}
          disabled={disabled}
          aria-label={`${action.label}`}
        >
          {getIcon(action.icon)}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
