import React, { useState } from 'react';

const CapturePersonEvents = ({ isOpen, onClose, eventName, eventType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [attendees, setAttendees] = useState([
    { id: 1, name: 'Tegra', present: false },
    { id: 2, name: 'David', present: false },
    { id: 3, name: 'Cyre', present: false },
    { id: 4, name: 'Dino', present: false },
  ]);

  if (!isOpen) return null;

  const filteredAttendees = attendees.filter(attendee =>
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAttendanceChange = (id) => {
    setAttendees(attendees.map(attendee =>
      attendee.id === id ? { ...attendee, present: !attendee.present } : attendee
    ));
  };

  const handleAddAttendee = () => {
    if (newAttendeeName.trim()) {
      const newAttendee = { id: Date.now(), name: newAttendeeName.trim(), present: false };
      setAttendees([...attendees, newAttendee]);
      setNewAttendeeName('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddAttendee();
  };

  const handleDidNotMeet = () => console.log('Mark as did not meet');

  const handleSubmitAttendance = () => {
    const presentAttendees = attendees.filter(attendee => attendee.present);
    console.log('Submitting attendance:', presentAttendees);
    onClose();
  };

  // Styles as objects
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0, left: 0,
      width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(2px)',
    },
    modal: {
      background: '#fff',
      borderRadius: '16px',
      padding: 0,
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      margin: '1rem',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '90vh',
      animation: '0.3s ease-out modalSlideIn',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem 1.5rem 1rem 1.5rem',
      borderBottom: '1px solid #f1f3f4',
      backgroundColor: '#fafbfc',
    },
    headerTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a' },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      color: '#9ca3af',
      cursor: 'pointer',
      padding: 0,
      width: '2rem',
      height: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'all 0.2s ease',
    },
    content: { padding: '1.5rem', flex: 1, overflowY: 'auto' },
    addSection: { marginBottom: '1.5rem' },
    addInputGroup: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
    addInput: {
      flex: 1,
      padding: '0.75rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      backgroundColor: '#fff',
    },
    addBtn: {
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      fontWeight: 600,
      fontSize: '0.875rem',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s ease',
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.95rem',
      transition: 'all 0.2s ease',
      backgroundColor: '#f9fafb',
      marginBottom: '1.5rem',
    },
    attendeesList: {
      maxHeight: '300px',
      overflowY: 'auto',
      border: '1px solid #f1f3f4',
      borderRadius: '8px',
      backgroundColor: '#fafbfc',
    },
    attendeeItem: { padding: '0.75rem 1rem', borderBottom: '1px solid #f1f3f4', display: 'flex', alignItems: 'center' },
    checkboxCustom: {
      width: '1.25rem',
      height: '1.25rem',
      border: '2px solid #d1d5db',
      borderRadius: '4px',
      marginRight: '0.75rem',
      position: 'relative',
      backgroundColor: '#fff',
      flexShrink: 0,
    },
    actions: { padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #f1f3f4', backgroundColor: '#fafbfc', display: 'flex', gap: '0.75rem', justifyContent: 'space-between' },
    btnDidNotMeet: {
      backgroundColor: '#fff',
      color: '#6b7280',
      border: '1px solid #d1d5db',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      fontWeight: 500,
      fontSize: '0.875rem',
      cursor: 'pointer',
      flex: 1,
    },
    btnSubmitAttendance: {
      backgroundColor: '#000',
      color: '#fff',
      border: 'none',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      fontWeight: 600,
      fontSize: '0.875rem',
      cursor: 'pointer',
      flex: 1,
    },
    noResults: { padding: '2rem', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Capture Attendance</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.content}>
          <div style={styles.addSection}>
            <div style={styles.addInputGroup}>
              <input
                type="text"
                placeholder="Add attendee name"
                value={newAttendeeName}
                onChange={(e) => setNewAttendeeName(e.target.value)}
                onKeyPress={handleKeyPress}
                style={styles.addInput}
              />
              <button
                onClick={handleAddAttendee}
                style={styles.addBtn}
                disabled={!newAttendeeName.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          <div style={styles.attendeesList}>
            {filteredAttendees.length > 0 ? filteredAttendees.map((attendee) => (
              <div key={attendee.id} style={styles.attendeeItem}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                  <input type="checkbox" checked={attendee.present} onChange={() => handleAttendanceChange(attendee.id)} style={{ display: 'none' }} />
                  <span style={{...styles.checkboxCustom, backgroundColor: attendee.present ? '#000' : '#fff', borderColor: attendee.present ? '#000' : '#d1d5db'}}></span>
                  <span style={{ fontSize: '1rem', color: attendee.present ? '#000' : '#374151', fontWeight: attendee.present ? 500 : 400 }}>{attendee.name}</span>
                </label>
              </div>
            )) : <div style={styles.noResults}>{searchTerm ? 'No attendees found' : 'No attendees added yet'}</div>}
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.btnDidNotMeet} onClick={handleDidNotMeet}>Mark As Did Not Meet</button>
          <button style={styles.btnSubmitAttendance} onClick={handleSubmitAttendance}>Submit Attendance</button>
        </div>
      </div>
    </div>
  );
};

export default CapturePersonEvents;
