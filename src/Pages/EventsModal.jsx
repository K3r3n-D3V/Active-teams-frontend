import React, { useState } from 'react';

const EventsModal = ({ isOpen, onClose, onCreateEvent, onCreateEventType, userRole }) => {
  const [hoveredButton, setHoveredButton] = useState(null);
  
  if (!isOpen) return null;

  // Check if user is admin
  const isAdmin = userRole === 'admin';

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    floatingOptions: {
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      zIndex: 1100,
    },
    optionButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '25px',
      padding: '12px 20px',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      fontSize: '14px',
      fontWeight: '500',
      color: '#333',
      transition: 'all 0.2s ease',
      minWidth: '200px',
      justifyContent: 'flex-start',
    },
    optionIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
    },
    eventIcon: {
      backgroundColor: '#e3f2fd',
      color: '#1976d2',
    },
    eventTypeIcon: {
      backgroundColor: '#f3e5f5',
      color: '#7b1fa2',
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={handleOverlayClick}>
      <div style={modalStyles.floatingOptions}>
        {/* Create Event - Available to all roles */}
        <button
          style={{
            ...modalStyles.optionButton,
            transform: hoveredButton === 'event' ? 'scale(1.02)' : 'scale(1)',
          }}
          onMouseEnter={() => setHoveredButton('event')}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={() => {
            onCreateEvent();
            onClose();
          }}
        >
          <div style={{...modalStyles.optionIcon, ...modalStyles.eventIcon}}>
            📅
          </div>
          Create Event
        </button>
       
        {/* Create Event Type - ONLY for admins */}
        {isAdmin && (
          <button
            style={{
              ...modalStyles.optionButton,
              transform: hoveredButton === 'eventType' ? 'scale(1.02)' : 'scale(1)',
            }}
            onMouseEnter={() => setHoveredButton('eventType')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => {
              onCreateEventType();
              onClose();
            }}
          >
            <div style={{...modalStyles.optionIcon, ...modalStyles.eventTypeIcon}}>
              🏷️
            </div>
            Create Event Type
          </button>
        )}
      </div>
    </div>
  );
};

export default EventsModal;