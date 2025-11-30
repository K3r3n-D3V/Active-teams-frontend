import React, { useState, useEffect } from "react";
import { toast } from "react-toastify"; 
import { useTheme } from "@mui/material/styles";

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
    eventLeaderName: "", 
    eventLeaderEmail: "", 
    day: "",
    location: "",
    date: "",
    status: "incomplete", 
    recurring: false,
    eventTimestamp: "",
    UUID: "",
    _id: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      console.log('📝 Loading event for editing:', {
        name: event.eventName,
        UUID: event.UUID,
        _id: event._id,
        fullEvent: event
      });

      const eventUUID = event.UUID || event.uuid || "";
      const eventId = event._id || event.id || "";

      console.log('🔍 Extracted identifiers:', {
        UUID: eventUUID,
        _id: eventId,
        hasUUID: !!eventUUID,
        hasId: !!eventId
      });

      if (!eventUUID && !eventId) {
        console.error(' CRITICAL: No identifier found in event object!', event);
        toast.error("Cannot edit event: No identifier found. Please refresh and try again.");
        return;
      }

      const normalizeStatus = (status) => {
        if (!status) return "incomplete";
        const statusLower = status.toLowerCase().trim();
        if (statusLower === "did not meet" || statusLower === "didnotmeet") return "did_not_meet";
        if (statusLower === "complete") return "complete";
        if (statusLower === "incomplete") return "incomplete";
        if (statusLower === "cancelled") return "cancelled";
        return "incomplete";
      };

      setFormData({
        UUID: eventUUID,
        _id: eventId,
        eventName: event.eventName || event.name || "",
        eventLeaderName: event.eventLeaderName || event.Leader || event.leader || "", 
        eventLeaderEmail: event.eventLeaderEmail || event.Email || event.email || "", 
        day: event.day || event.recurring_day?.[0] || "",
        location: event.location || event.address || "",
        date: event.date || event.dateOfEvent || "",
        status: normalizeStatus(event.status || event.Status), 
        recurring: event.recurring || event.is_recurring || event.isVirtual || false,
        eventTimestamp: event.eventTimestamp || event.created_at || event.updated_at || ""
      });

      setTimeout(() => {
        console.log('✅ FormData after setting:', {
          UUID: eventUUID,
          _id: eventId,
          eventName: event.eventName || event.name || "",
          status: normalizeStatus(event.status || event.Status)
        });
      }, 100);
    }
  }, [event, isOpen]);

  const { width } = useWindowSize();
  const isSmall = (width || 0) <= 420;
  const isDark = theme.palette.mode === "dark";

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    console.log(' Save initiated - Current formData:', formData);

    const primaryIdentifier = formData._id || formData.UUID;

    if (!primaryIdentifier) {
      console.error(' No event identifier found. FormData:', formData);
      console.error(' Original event:', event);
      toast.error("Cannot save: Missing event identifier. Please close and try again.");
      return;
    }

    if (!formData.eventName?.trim() || !formData.date) {
      toast.error("Please fill in event name and date");
      return;
    }

    setLoading(true);

    try {
      let formattedDate = formData.date;
      if (formattedDate && formattedDate.includes('T')) {
        formattedDate = formattedDate.split('T')[0];
      }

      const updatePayload = {
        ...(formData._id && { _id: formData._id }),
        ...(formData.UUID && { UUID: formData.UUID }),
        eventName: formData.eventName.trim(),
        eventLeaderName: formData.eventLeaderName, 
        eventLeaderEmail: formData.eventLeaderEmail, 
        day: formData.day,
        location: formData.location,
        date: formattedDate, 
        status: formData.status, 
        recurring: formData.recurring,
        eventType: event?.eventType,
        isTicketed: event?.isTicketed,
        isGlobal: event?.isGlobal
      };

      console.log('💾 Saving event with payload:', {
        identifier: primaryIdentifier,
        identifierType: formData._id ? '_id' : 'UUID',
        payload: updatePayload,
        eventNameChanged: formData.eventName.trim() !== event?.eventName
      });

      const result = await onSave(updatePayload);

      console.log('✅ Save result:', result);

      if (result && (result.success || result.event)) {
        toast.success("Event updated successfully!");
        
        console.log('🚪 Closing modal after successful save...');
        
        if (typeof onClose === 'function') {
          console.log('🔄 Calling onClose(true) to trigger refresh');
          onClose(true);
        }
        
      } else {
        throw new Error(result?.message || "Update failed - no confirmation received");
      }

    } catch (error) {
      console.error('❌ Error saving event:', error);

      let errorMessage = "Failed to update event";

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
      
    } finally {
      setLoading(false);
    }
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
      transition: "background-color 5000s ease-in-out 0s",
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

  const hasIdentifier = !!(formData._id || formData.UUID);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Edit Event</h2>

        {/* Event Identifier Status */}
        <div style={{
          ...styles.infoBox,
          border: hasIdentifier ? `1px solid ${theme.palette.divider}` : "2px solid #ef4444",
          background: hasIdentifier 
            ? (isDark ? theme.palette.background.default : "#f7f7f7")
            : "#442222"
        }}>
          <strong>Event Identification:</strong>
          <br />
          {formData._id && (
            <div style={{ color: "#10b981", marginTop: "4px" }}>
              ID: {formData._id}
            </div>
          )}
          {formData.UUID && (
            <div style={{ color: "#10b981", marginTop: "4px" }}>
              UUID: {formData.UUID}
            </div>
          )}
          {!hasIdentifier && (
            <div style={{ color: "#ef4444", marginTop: "4px" }}>
              ⚠️ No identifier found - cannot save
            </div>
          )}
        </div>

        {/* Event Type Info */}
        {event?.eventType && (
          <div style={styles.infoBox}>
            <strong>Event Type:</strong> {event.eventType}
            {event?.isGlobal && <span> • 🌍 Global</span>}
            {event?.isTicketed && <span> • 🎫 Ticketed</span>}
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Event Name *</label>
          <input
            type="text"
            name="eventName"
            value={formData.eventName}
            onChange={handleInputChange}
            style={styles.input}
            placeholder="Event Name"
            disabled={loading || !hasIdentifier}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Leader</label>
          <input
            type="text"
            name="eventLeaderName"
            value={formData.eventLeaderName}
            style={styles.readOnlyInput}
            readOnly
            title="Leader cannot be changed"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Day</label>
          <select
            name="day"
            value={formData.day}
            onChange={handleInputChange}
            style={styles.input}
            disabled={loading || !hasIdentifier}
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
            disabled={loading || !hasIdentifier}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Date of Event *</label>
          <input
            type="date"
            name="date"
            value={formData.date ? formData.date.split('T')[0] : ''}
            onChange={handleInputChange}
            style={styles.input}
            disabled={loading || !hasIdentifier}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            style={styles.input}
            disabled={loading || !hasIdentifier}
          >
            <option value="incomplete">Incomplete</option>
            <option value="complete">Complete</option>
            <option value="did_not_meet">Did Not Meet</option>
            <option value="cancelled">Cancelled</option>
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
              disabled={loading || !hasIdentifier}
            />
            <label style={styles.label}>Recurring Event</label>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Created At</label>
          <input
            type="text"
            value={formData.eventTimestamp ? new Date(formData.eventTimestamp).toLocaleString() : 'Unknown'}
            style={styles.readOnlyInput}
            readOnly
          />
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={styles.cancelBtn}
            onClick={() => onClose(false)}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.borderColor = theme.palette.primary.main;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.palette.divider;
            }}
          >
            CANCEL
          </button>
          <button
            style={{
              ...styles.saveBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading || !hasIdentifier ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSave}
            disabled={loading || !hasIdentifier}
            onMouseEnter={(e) => {
              if (!loading && hasIdentifier) e.currentTarget.style.opacity = 0.9;
            }}
            onMouseLeave={(e) => {
              if (!loading && hasIdentifier) e.currentTarget.style.opacity = 1;
            }}
          >
            {loading ? "SAVING..." : hasIdentifier ? "SAVE CHANGES" : "MISSING ID"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;