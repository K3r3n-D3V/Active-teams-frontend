import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
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
    status: "open",
    recurring: false,
    eventTimestamp: "",
    UUID: "",
    _id: ""
  });
  const [loading, setLoading] = useState(false);
  // const [alert, setAlert] = useState({ open: false, type: "success", message: "" });


  useEffect(() => {
    if (event && isOpen) {
      console.log('📝 Loading event for editing:', {
        name: event.eventName,
        UUID: event.UUID,
        _id: event._id,
        fullEvent: event
      });

      // ✅ CRITICAL FIX: Extract identifiers with better fallbacks
      const eventUUID = event.UUID || event.uuid || "";
      const eventId = event._id || event.id || "";
      
      console.log('🔍 Extracted identifiers:', {
        UUID: eventUUID,
        _id: eventId,
        hasUUID: !!eventUUID,
        hasId: !!eventId
      });

      // ✅ CRITICAL: Ensure at least ONE identifier exists
      if (!eventUUID && !eventId) {
        console.error('❌ CRITICAL: No identifier found in event object!', event);
        // setAlert({
        //   open: true,
        //   type: "error",
        //   message: "Cannot edit event: No identifier found. Please refresh and try again.",
        // });
        toast.error("Cannot edit event: No identifier found. Please refresh and try again.");
        return;
      }

      // ✅ Set form data with identifiers preserved
      setFormData({
        // Identifiers - MUST preserve both
        UUID: eventUUID,
        _id: eventId,
        
        // Form fields with safe fallbacks
        eventName: event.eventName || event.name || "",
        eventLeader: event.eventLeader || event.eventLeaderName || event.leader || "",
        day: event.day || event.recurring_day?.[0] || "",
        location: event.location || event.address || "",
        date: event.date || event.dateOfEvent || "",
        status: event.status || event.Status || "open",
        recurring: event.renocaming || event.recurring || event.isVirtual || false,
        eventTimestamp: event.eventTimestamp || event.created_at || event.updated_at || ""
      });

      // ✅ Verify state was set correctly
      setTimeout(() => {
        console.log('✅ FormData after setting:', {
          UUID: eventUUID,
          _id: eventId,
          eventName: event.eventName || event.name || ""
        });
      }, 100);
    }
  }, [event, isOpen]);

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

  const handleSave = async () => {
    console.log('💾 Save initiated - Current formData:', formData);
    
    // ✅ CRITICAL FIX: Prefer _id over UUID for updates
    const primaryIdentifier = formData._id || formData.UUID;
    
    if (!primaryIdentifier) {
      console.error('❌ No event identifier found. FormData:', formData);
      console.error('❌ Original event:', event);
      
      // setAlert({
      //   open: true,
      //   type: "error",
      //   message: "Cannot save: Missing event identifier. Please close and try again.",
      // });
      // setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 4000);
      toast.error("Cannot save: Missing event identifier. Please close and try again.");
      return;
    }

    // ✅ Validate required fields
    if (!formData.eventName?.trim() || !formData.date) {
      // setAlert({
      //   open: true,
      //   type: "error",
      //   message: "Please fill in event name and date",
      // });
      // setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      toast.error("Please fill in event name and date");
      return;
    }

    setLoading(true);

    try {
      // ✅ CRITICAL FIX: Build payload with correct identifier
      const updatePayload = {
        // Use the primary identifier (_id preferred)
        ...(formData._id && { _id: formData._id }),
        ...(formData.UUID && { UUID: formData.UUID }),
        
        // ⚠️ CRITICAL: Event name must be sent to backend
        eventName: formData.eventName.trim(),
        
        // Updated fields
        day: formData.day,
        location: formData.location,
        date: formData.date,
        status: formData.status,
        renocaming: formData.recurring,
        
        // Preserve original data
        eventLeader: formData.eventLeader,
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

      // ✅ Call the save function with the payload
      const result = await onSave(updatePayload);
      
      console.log('✅ Save result:', result);
      
      if (result && (result.success || result.event)) {
        // setAlert({
        //   open: true,
        //   type: "success",
        //   message: "Event updated successfully! Refreshing...",
        // });
        // toast.success("Event updated successfully! Refreshing...");
        
        // ✅ CRITICAL: Close modal after short delay and force refresh
        // setTimeout(() => {
        //   // setAlert({ open: false, type: "success", message: "" });
        //   // setLoading(false);
        // toast.success("Event updated successfully! Refreshing...");

        //   // Call onClose with explicit true parameter
        //   if (typeof onClose === 'function') {
        //     onClose(true);
        //   }
        // }, 800);
      } else {
        throw new Error(result?.message || "Update failed - no confirmation received");
      }
      
    } catch (error) {
      console.error('❌ Error saving event:', error);
      
      // ✅ Extract proper error message
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
      
      // setAlert({
      //   open: true,
      //   type: "error",
      //   message: errorMessage,
      // });
      // setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 4000);
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
    saveBtnDisabled: {
      padding: "10px 20px",
      background: "#666",
      border: "none",
      borderRadius: "6px",
      color: "#ccc",
      cursor: "not-allowed",
      fontSize: "14px",
      fontWeight: "500",
      opacity: 0.6,
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
    // alert: {
    //   position: "fixed",
    //   top: "20px",
    //   left: "50%",
    //   transform: "translateX(-50%)",
    //   padding: "12px 20px",
    //   borderRadius: "6px",
    //   color: "#fff",
    //   fontSize: "14px",
    //   fontWeight: "500",
    //   zIndex: 10001,
    // },
  //   alertSuccess: {
  //     background: "#10b981",
  //   },
  //   alertError: {
  //     background: "#ef4444",
  //   },
   };

  const hasIdentifier = !!(formData._id || formData.UUID);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Edit Event</h2>

        {/* ✅ Event Identifier Status */}
        <div style={{
          ...styles.infoBox,
          border: hasIdentifier ? "1px solid #555" : "2px solid #ef4444",
          background: hasIdentifier ? "#2b2b2b" : "#442222"
        }}>
          <strong>Event Identification:</strong>
          <br />
          {formData._id && (
            <div style={{color: "#10b981", marginTop: "4px"}}>
              ✅ ID: {formData._id}
            </div>
          )}
          {formData.UUID && (
            <div style={{color: "#10b981", marginTop: "4px"}}>
              ✅ UUID: {formData.UUID}
            </div>
          )}
          {!hasIdentifier && (
            <div style={{color: "#ef4444", marginTop: "4px"}}>
              ❌ No identifier found - cannot save
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
            name="eventLeader"
            value={formData.eventLeader}
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
            <option value="open">Open</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Complete">Complete</option>
            <option value="Did Not Meet">Did Not Meet</option>
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
          >
            CANCEL
          </button>
          <button
            style={styles.saveBtn}
            onClick={handleSave}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 0.95}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
          >
            {loading ? "SAVING..." : hasIdentifier ? "SAVE" : "MISSING ID"}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
     
    </div>
  );
};

export default EditEventModal;