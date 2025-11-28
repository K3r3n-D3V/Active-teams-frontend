import React, { useState } from 'react';

const EventsModal = ({ isOpen, onClose, onCreateEvent, onCreateEventType, userRole }) => {
  const [hoveredButton, setHoveredButton] = useState(null);
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  React.useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  const isSmall = (width || 0) <= 420;
  
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
    floatingOptions: isSmall ? {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 1100,
      width: '92%',
      alignItems: 'center'
    } : {
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
      justifyContent: 'center', // Center content horizontally
      // Cute Styles
      backgroundColor: '#ad1111ff',
      border: '2px solid #e0cffc', // Softer pastel purple border
      borderRadius: '25px',       // Very rounded corners
      padding: '12px 24px',        // Comfortable padding, but not excessively wide
      cursor: 'pointer',
      boxShadow: '0 6px 15px rgba(180, 140, 255, 0.25)', // More pronounced but soft shadow
      fontSize: '15px',
      fontWeight: '700',
      color: '#5e35b1', // Deep purple text
      transition: 'all 0.3s ease',
      // Width Fixes
      width: isSmall ? '100%' : 'auto', // Auto width on large screens
      maxWidth: '220px', // Prevent it from getting too wide on desktop/tablet
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
            // Subtle pop on hover
            transform: hoveredButton === 'event' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
          }}
          onMouseEnter={() => setHoveredButton('event')}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={() => {
            onCreateEvent();
            onClose();
          }}
        >
          ✨ Create Event
        </button>
        
        {/* Create Event Type - ONLY for admins */}
        {isAdmin && (
          <button
            style={{
              ...modalStyles.optionButton,
              // Subtle pop on hover
              transform: hoveredButton === 'eventType' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
            }}
            onMouseEnter={() => setHoveredButton('eventType')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => {
              onCreateEventType();
              onClose();
            }}
          >
            ⭐ Create Event Type
          </button>
        )}
      </div>
    </div>
  );
};

export default EventsModal;