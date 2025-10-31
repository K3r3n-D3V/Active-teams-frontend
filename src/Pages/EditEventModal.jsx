import React, { useState, useEffect } from "react";

// small helper hook for responsiveness
function useWindowSize() {
  const isClient = typeof window === "object";
  const getSize = () => ({
    width: isClient ? window.innerWidth : undefined,
    height: isClient ? window.innerHeight : undefined,
  });
  const [windowSize, setWindowSize] = useState(getSize);
  useEffect(() => {
    if (!isClient) return;
    const handleResize = () => setWindowSize(getSize());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);
  return windowSize;
}

const EditEventModal = ({ isOpen, onClose, event, onSave }) => {
  const [formData, setFormData] = useState({
    eventName: "",
    eventLeader: "",
    day: "",
    location: "",
    date: "",
    status: "",
    recurring: false,
    eventTimestamp: "",
    UUID: "",
    _id: ""
  });

  useEffect(() => {
    if (event) {
      console.log('📝 Loading event for editing:', {
        name: event.eventName,
        UUID: event.UUID,
        _id: event._id,
        fullEvent: event
      });

      setFormData({
        UUID: event.UUID || "",
        _id: event._id || event.id || "",
        
        eventName: event.eventName || event.name || "",
        eventLeader: event.eventLeaderName || event.leader || "",
        day: event.day || "",
        location: event.location || event.address || "",
        date: event.date || event.dateOfEvent || "",
        status: event.status || event.Status || "Incomplete",
        recurring: event.renocaming || event.isVirtual || false,
        eventTimestamp: event.eventTimestamp || event.created_at || ""
      });
    }
  }, [event]);

  const { width } = useWindowSize();
  const isSmall = (width || 0) <= 420; // targets small phones

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    const updatePayload = {
      eventName: formData.eventName,
      day: formData.day,
      location: formData.location,
      date: formData.date,
      status: formData.status,
      renocaming: formData.recurring,
    };

    console.log('💾 Saving event update:', {
      UUID: formData.UUID,
      _id: formData._id,
      identifier: formData.UUID || formData._id,
      payload: updatePayload
    });

    onSave(updatePayload);
    onClose();
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
      padding: isSmall ? "12px" : "20px",
    },
    modal: {
      background: "#1e1e1e", // dark modal background
      borderRadius: "12px",
      width: "100%",
      maxWidth: isSmall ? "96%" : "700px",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: isSmall ? "14px" : "24px",
      color: "#f1f1f1",
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    },
    title: {
      fontSize: isSmall ? "18px" : "22px",
      fontWeight: "600",
      marginBottom: "24px",
      color: "#fff",
      textAlign: "center",
    },
    formGroup: {
      marginBottom: "16px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#ccc",
      marginBottom: "6px",
    },
    input: {
      width: "100%",
      padding: isSmall ? "8px 10px" : "10px 12px",
      fontSize: isSmall ? "13px" : "14px",
      borderRadius: "6px",
      border: "1px solid #555",
      backgroundColor: "#2b2b2b",
      color: "#fff",
      outline: "none",
      boxSizing: "border-box",
    },
    readOnlyInput: {
      width: "100%",
      padding: isSmall ? "8px 10px" : "10px 12px",
      fontSize: isSmall ? "13px" : "14px",
      borderRadius: "6px",
      border: "1px solid #555",
      backgroundColor: "#333",
      color: "#999",
      outline: "none",
      boxSizing: "border-box",
      cursor: "not-allowed",
    },
    checkboxGroup: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    checkbox: {
      width: "16px",
      height: "16px",
      accentColor: "#2563eb", // blue checkbox in dark mode
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      marginTop: "18px",
      justifyContent: "flex-end",
      flexDirection: isSmall ? "column-reverse" : "row",
    },
    cancelBtn: {
      padding: isSmall ? "10px" : "10px 20px",
      background: "transparent",
      border: "1px solid #555",
      borderRadius: "6px",
      color: "#ccc",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      width: isSmall ? "100%" : "auto",
    },
    saveBtn: {
      padding: isSmall ? "10px" : "10px 20px",
      background: "#2563eb",
      border: "none",
      borderRadius: "6px",
      color: "#fff",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      width: isSmall ? "100%" : "auto",
    },
    infoBox: {
      background: "#2b2b2b",
      border: "1px solid #555",
      borderRadius: "6px",
      padding: isSmall ? "10px" : "12px",
      marginBottom: isSmall ? "12px" : "16px",
      fontSize: isSmall ? "12px" : "12px",
      color: "#999",
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Edit Event</h2>

        {(formData.UUID || formData._id) && (
          <div style={styles.infoBox}>
            <strong>Event Identifier:</strong>
            <br />
            {formData.UUID && (
              <>
                UUID: {formData.UUID.substring(0, 20)}...
                <br />
              </>
            )}
            {formData._id && <>MongoDB ID: {formData._id}</>}
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Event Name</label>
          <input
            type="text"
            name="eventName"
            value={formData.eventName}
            onChange={handleInputChange}
            style={styles.input}
            placeholder="Event Name"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Leader</label>
          <input
            type="text"
            name="eventLeader"
            value={formData.eventLeader}
            onChange={handleInputChange}
            style={styles.readOnlyInput}
            readOnly
            title="Leader cannot be changed after event creation"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Day</label>
          <select
            name="day"
            value={formData.day}
            onChange={handleInputChange}
            style={styles.input}
          >
            <option value="">Select Day</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            style={styles.input}
            placeholder="Event Location"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Date of Event</label>
          <input
            type="date"
            name="date"
            value={formData.date ? formData.date.split('T')[0] : ''}
            onChange={handleInputChange}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            style={styles.input}
          >
            <option value="Incomplete">Incomplete</option>
            <option value="Complete">Complete</option>
            <option value="Did Not Meet">Did Not Meet</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <div style={styles.checkboxGroup}>
            <input
              type="checkbox"
              name="recurring"
              checked={formData.recurring}
              onChange={handleInputChange}
              style={styles.checkbox}
            />
            <label style={styles.label}>Recurring Event</label>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Created At</label>
          <input
            type="text"
            name="eventTimestamp"
            value={formData.eventTimestamp}
            style={styles.readOnlyInput}
            readOnly
            title="Event creation timestamp cannot be changed"
          />
        </div>

        <div style={styles.buttonGroup}>
          <button 
            style={styles.cancelBtn} 
            onClick={onClose}
            onMouseEnter={(e) => e.target.style.background = "#333"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            CANCEL
          </button>
          <button 
            style={styles.saveBtn} 
            onClick={handleSave}
            onMouseEnter={(e) => e.target.style.background = "#1e40af"}
            onMouseLeave={(e) => e.target.style.background = "#2563eb"}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;