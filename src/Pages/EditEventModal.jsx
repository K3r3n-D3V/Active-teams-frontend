import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";

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
  const theme = useTheme();
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
  const isDark = theme.palette.mode === "dark";

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
      background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
      padding: isSmall ? "12px" : "20px",
    },
    modal: {
      background: isDark ? theme.palette.background.paper : "#fff",
      borderRadius: 12,
      width: "100%",
      maxWidth: isSmall ? "96%" : 700,
      maxHeight: "90vh",
      overflowY: "auto",
      padding: isSmall ? "14px" : "24px",
      color: theme.palette.text.primary,
      boxShadow: theme.shadows[24],
      border: isDark ? `1px solid ${theme.palette.divider}` : "1px solid rgba(0,0,0,0.08)",
    },
    title: {
      fontSize: isSmall ? 18 : 22,
      fontWeight: 600,
      marginBottom: 24,
      color: theme.palette.text.primary,
      textAlign: "center",
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      display: "block",
      fontSize: 14,
      fontWeight: 500,
      color: theme.palette.text.secondary,
      marginBottom: 6,
    },
    input: {
      width: "100%",
      padding: isSmall ? "8px 10px" : "10px 12px",
      fontSize: isSmall ? 13 : 14,
      borderRadius: 6,
      border: `1px solid ${isDark ? theme.palette.divider : "rgba(0,0,0,0.12)"}`,
      backgroundColor: isDark ? theme.palette.background.default : "#fff",
      color: theme.palette.text.primary,
      outline: "none",
      boxSizing: "border-box",
    },
    readOnlyInput: {
      width: "100%",
      padding: isSmall ? "8px 10px" : "10px 12px",
      fontSize: isSmall ? 13 : 14,
      borderRadius: 6,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: isDark ? "#2b2b2b" : "#f5f5f5",
      color: isDark ? theme.palette.text.secondary : "#666",
      outline: "none",
      boxSizing: "border-box",
      cursor: "not-allowed",
    },
    checkboxGroup: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    checkbox: {
      width: 16,
      height: 16,
      accentColor: theme.palette.primary.main,
    },
    buttonGroup: {
      display: "flex",
      gap: 12,
      marginTop: 18,
      justifyContent: "flex-end",
      flexDirection: isSmall ? "column-reverse" : "row",
    },
    cancelBtn: {
      padding: isSmall ? "10px" : "10px 20px",
      background: "transparent",
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 6,
      color: theme.palette.text.secondary,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
      transition: "all 0.2s ease",
      width: isSmall ? "100%" : "auto",
    },
    saveBtn: {
      padding: isSmall ? "10px" : "10px 20px",
      background: theme.palette.primary.main,
      border: "none",
      borderRadius: 6,
      color: theme.palette.primary.contrastText,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
      transition: "all 0.2s ease",
      width: isSmall ? "100%" : "auto",
    },
    infoBox: {
      background: isDark ? theme.palette.background.default : "#f7f7f7",
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 6,
      padding: isSmall ? "10px" : "12px",
      marginBottom: isSmall ? "12px" : "16px",
      fontSize: isSmall ? 12 : 12,
      color: theme.palette.text.secondary,
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
            onMouseEnter={(e) => { if (!isDark) e.currentTarget.style.background = "#f5f5f5"; else e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            CANCEL
          </button>
          <button
            style={styles.saveBtn}
            onClick={handleSave}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.95}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;