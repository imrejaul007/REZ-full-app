/**
 * BookingFlow Component
 * Restaurant booking flow with date, time, and guest details
 */

import React, { useState, useEffect } from 'react';
import { BookingFlowState, TimeSlot } from '../types/chat';
import { MOCK_TIME_SLOTS, generateId } from '../services/chatService';

interface BookingFlowProps {
  onClose: () => void;
  onBook: (details: BookingFlowState) => Promise<void>;
  darkMode?: boolean;
  isLoading?: boolean;
}

type BookingStep = 'date' | 'time' | 'details' | 'confirm';

const BookingFlow: React.FC<BookingFlowProps> = ({
  onClose,
  onBook,
  darkMode = false,
  isLoading = false,
}) => {
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');

  // Generate next 14 days for date selection
  const getAvailableDates = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFullDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Simulate fetching available slots
    const slots = MOCK_TIME_SLOTS.map((slot) => ({
      ...slot,
      available: Math.random() > 0.3,
    }));
    setAvailableSlots(slots);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('details');
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !guestName) return;

    setIsBooking(true);
    try {
      await onBook({
        step: 'confirm',
        selectedDate,
        selectedTime,
        partySize,
        guestName,
        guestPhone,
        guestEmail,
        specialRequests,
      });
      setBookingConfirmed(true);
      setConfirmationNumber(generateId().slice(0, 8).toUpperCase());
    } catch (error) {
      console.error('Failed to book:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const renderDateStep = () => (
    <div className="booking-date">
      <h3>Select a Date</h3>
      <div className="date-grid">
        {getAvailableDates().map((date) => (
          <button
            key={date.toISOString()}
            className="date-btn"
            onClick={() => handleDateSelect(date)}
          >
            <span className="date-day">{formatDate(date)}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderTimeStep = () => (
    <div className="booking-time">
      <h3>Select a Time</h3>
      <p className="selected-date">{formatFullDate(selectedDate!)}</p>
      <div className="time-grid">
        {availableSlots.map((slot) => (
          <button
            key={slot.time}
            className={`time-btn ${slot.available ? '' : 'unavailable'} ${
              selectedTime === slot.time ? 'selected' : ''
            }`}
            onClick={() => slot.available && handleTimeSelect(slot.time)}
            disabled={!slot.available}
          >
            {slot.time}
          </button>
        ))}
      </div>
      <button className="change-date" onClick={() => setStep('date')}>
        Change Date
      </button>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="booking-details-form">
      <h3>Guest Details</h3>
      <div className="form-group">
        <label>Party Size *</label>
        <div className="party-size-selector">
          <button
            onClick={() => setPartySize(Math.max(1, partySize - 1))}
            disabled={partySize <= 1}
          >
            -
          </button>
          <span>{partySize} {partySize === 1 ? 'Guest' : 'Guests'}</span>
          <button
            onClick={() => setPartySize(Math.min(20, partySize + 1))}
            disabled={partySize >= 20}
          >
            +
          </button>
        </div>
      </div>
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Your name"
        />
      </div>
      <div className="form-group">
        <label>Phone (optional)</label>
        <input
          type="tel"
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          placeholder="Your phone number"
        />
      </div>
      <div className="form-group">
        <label>Email (optional)</label>
        <input
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder="Your email"
        />
      </div>
      <div className="form-group">
        <label>Special Requests (optional)</label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Any special requests or dietary requirements?"
        />
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="booking-confirm">
      <h3>Confirm Booking</h3>
      <div className="confirm-summary">
        <div className="summary-row">
          <span className="summary-label">Date</span>
          <span className="summary-value">{formatFullDate(selectedDate!)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Time</span>
          <span className="summary-value">{selectedTime}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Party Size</span>
          <span className="summary-value">
            {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
          </span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Name</span>
          <span className="summary-value">{guestName}</span>
        </div>
        {guestPhone && (
          <div className="summary-row">
            <span className="summary-label">Phone</span>
            <span className="summary-value">{guestPhone}</span>
          </div>
        )}
        {specialRequests && (
          <div className="summary-row requests">
            <span className="summary-label">Special Requests</span>
            <span className="summary-value">{specialRequests}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderConfirmedStep = () => (
    <div className="booking-success">
      <div className="success-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h3>Booking Confirmed!</h3>
      <p className="confirmation-number">
        Confirmation #{confirmationNumber}
      </p>
      <div className="success-details">
        <p>
          <strong>{formatFullDate(selectedDate!)}</strong>
        </p>
        <p>{selectedTime}</p>
        <p>{partySize} {partySize === 1 ? 'Guest' : 'Guests'}</p>
      </div>
      <p className="success-note">
        A confirmation has been sent to {guestEmail || 'your email'}.
      </p>
    </div>
  );

  const getStepTitle = (): string => {
    if (bookingConfirmed) return 'Booking Confirmed';
    switch (step) {
      case 'date':
        return 'Select Date';
      case 'time':
        return 'Select Time';
      case 'details':
        return 'Your Details';
      case 'confirm':
        return 'Confirm';
      default:
        return '';
    }
  };

  const canProceedFromDetails = (): boolean => {
    return guestName.trim().length > 0;
  };

  return (
    <div className={`booking-flow ${darkMode ? 'dark' : 'light'}`}>
      <style>{`
        .booking-flow {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .booking-flow.light {
          background: #F5F5F5;
        }

        .booking-flow.dark {
          background: #0D1B21;
          color: #E9F8F4;
        }

        .booking-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid;
        }

        .booking-flow.light .booking-header {
          background: white;
          border-color: #E0E0E0;
        }

        .booking-flow.dark .booking-header {
          background: #1C2A33;
          border-color: #3A4F5C;
        }

        .booking-header h2 {
          margin: 0;
          font-size: 1.125rem;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }

        .booking-flow.light .close-btn {
          color: #666;
        }

        .booking-flow.dark .close-btn {
          color: #8899A6;
        }

        .booking-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .booking-flow.light .booking-content h3 {
          color: #333;
        }

        .booking-flow.dark .booking-content h3 {
          color: #E9F8F4;
        }

        /* Date step */
        .date-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .date-btn {
          padding: 1rem;
          border-radius: 0.75rem;
          border: 2px solid;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .booking-flow.light .date-btn {
          border-color: #E0E0E0;
        }

        .booking-flow.dark .date-btn {
          border-color: #3A4F5C;
        }

        .date-btn:hover {
          border-color: #2196F3;
          background: rgba(33, 150, 243, 0.1);
        }

        .date-day {
          display: block;
          font-weight: 500;
        }

        /* Time step */
        .selected-date {
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .booking-flow.light .selected-date {
          color: #666;
        }

        .booking-flow.dark .selected-date {
          color: #8899A6;
        }

        .time-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.75rem;
        }

        .time-btn {
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 2px solid;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .booking-flow.light .time-btn {
          border-color: #E0E0E0;
        }

        .booking-flow.dark .time-btn {
          border-color: #3A4F5C;
        }

        .time-btn:not(.unavailable):hover {
          border-color: #2196F3;
        }

        .time-btn.selected {
          background: #2196F3;
          border-color: #2196F3;
          color: white;
        }

        .time-btn.unavailable {
          opacity: 0.4;
          cursor: not-allowed;
          text-decoration: line-through;
        }

        .change-date {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid;
          border-radius: 0.5rem;
          cursor: pointer;
          width: 100%;
        }

        .booking-flow.light .change-date {
          border-color: #E0E0E0;
          color: #666;
        }

        .booking-flow.dark .change-date {
          border-color: #3A4F5C;
          color: #8899A6;
        }

        /* Details form */
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .booking-flow.light .form-group label {
          color: #333;
        }

        .booking-flow.dark .form-group label {
          color: #E9F8F4;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid;
          font-size: 1rem;
          font-family: inherit;
          box-sizing: border-box;
        }

        .booking-flow.light .form-group input,
        .booking-flow.light .form-group textarea {
          border-color: #E0E0E0;
          background: white;
          color: #333;
        }

        .booking-flow.dark .form-group input,
        .booking-flow.dark .form-group textarea {
          border-color: #3A4F5C;
          background: #1C2A33;
          color: #E9F8F4;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2196F3;
        }

        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .party-size-selector {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .party-size-selector button {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          border: 2px solid;
          background: transparent;
          font-size: 1.25rem;
          cursor: pointer;
        }

        .booking-flow.light .party-size-selector button {
          border-color: #E0E0E0;
          color: #333;
        }

        .booking-flow.dark .party-size-selector button {
          border-color: #3A4F5C;
          color: #E9F8F4;
        }

        .party-size-selector button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .party-size-selector span {
          font-size: 1.25rem;
          font-weight: 600;
          min-width: 100px;
          text-align: center;
        }

        /* Confirm step */
        .confirm-summary {
          background: rgba(33, 150, 243, 0.1);
          border-radius: 0.75rem;
          padding: 1rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .booking-flow.dark .summary-row {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-label {
          color: #666;
        }

        .booking-flow.dark .summary-label {
          color: #8899A6;
        }

        .summary-row.requests {
          flex-direction: column;
          gap: 0.25rem;
        }

        .summary-row.requests .summary-value {
          font-size: 0.9rem;
        }

        /* Success */
        .booking-success {
          text-align: center;
          padding: 2rem 1rem;
        }

        .success-icon {
          margin-bottom: 1rem;
        }

        .booking-success h3 {
          color: #4CAF50;
          margin-bottom: 0.5rem;
        }

        .confirmation-number {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .success-details {
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 1rem;
        }

        .booking-flow.light .success-details {
          background: white;
        }

        .booking-flow.dark .success-details {
          background: #1C2A33;
        }

        .success-details p {
          margin: 0.25rem 0;
        }

        .success-note {
          font-size: 0.85rem;
          color: #888;
        }

        /* Footer */
        .booking-footer {
          padding: 1rem;
          border-top: 1px solid;
        }

        .booking-flow.light .booking-footer {
          background: white;
          border-color: #E0E0E0;
        }

        .booking-flow.dark .booking-footer {
          background: #1C2A33;
          border-color: #3A4F5C;
        }

        .footer-actions {
          display: flex;
          gap: 0.75rem;
        }

        .footer-actions button {
          flex: 1;
          padding: 0.875rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .footer-actions .back-btn {
          background: transparent;
          border: 1px solid;
        }

        .booking-flow.light .footer-actions .back-btn {
          border-color: #E0E0E0;
          color: #666;
        }

        .booking-flow.dark .footer-actions .back-btn {
          border-color: #3A4F5C;
          color: #8899A6;
        }

        .footer-actions .next-btn,
        .footer-actions .confirm-btn {
          background: #2196F3;
          color: white;
          border: none;
        }

        .footer-actions .next-btn:disabled,
        .footer-actions .confirm-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .footer-actions .finish-btn {
          background: #4CAF50;
          color: white;
          border: none;
        }

        @media (max-width: 400px) {
          .date-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .time-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <div className="booking-header">
        <h2>{getStepTitle()}</h2>
        <button className="close-btn" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="booking-content">
        {bookingConfirmed && renderConfirmedStep()}
        {!bookingConfirmed && step === 'date' && renderDateStep()}
        {!bookingConfirmed && step === 'time' && renderTimeStep()}
        {!bookingConfirmed && step === 'details' && renderDetailsStep()}
        {!bookingConfirmed && step === 'confirm' && renderConfirmStep()}
      </div>

      {!bookingConfirmed && (
        <div className="booking-footer">
          <div className="footer-actions">
            {step !== 'date' && (
              <button
                className="back-btn"
                onClick={() => {
                  if (step === 'time') setStep('date');
                  else if (step === 'details') setStep('time');
                  else if (step === 'confirm') setStep('details');
                }}
              >
                Back
              </button>
            )}
            {step !== 'confirm' ? (
              <button
                className="next-btn"
                onClick={() => {
                  if (step === 'details') setStep('confirm');
                }}
                disabled={step === 'details' && !canProceedFromDetails()}
              >
                Continue
              </button>
            ) : (
              <button
                className="confirm-btn"
                onClick={handleBook}
                disabled={isBooking}
              >
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </button>
            )}
          </div>
        </div>
      )}

      {bookingConfirmed && (
        <div className="booking-footer">
          <div className="footer-actions">
            <button className="finish-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingFlow;
