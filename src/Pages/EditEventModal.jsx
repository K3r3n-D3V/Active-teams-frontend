import React, { useState, useEffect } from "react";

const EditEventModal = ({ isOpen, onClose, event, onSave }) => {
  const [formData, setFormData] = useState({
    eventName: "",
    leader: "",
    day: "",
    address: "",
    dateOfEvent: "",
    status: "",
    renocaming: false,
    eventTimestamp: "",
  });

  useEffect(() => {
    if (event) {
      setFormData({
        eventName: event.eventName || event.name || "",
        leader: event.leader || "",
        day: event.day || "",
        address: event.address || "",
        dateOfEvent: event.dateOfEvent || event.date || "",
        status: event.status || "Incomplete",
        renocaming: event.renocaming || false,
        eventTimestamp: event.eventTimestamp || "",
      });
    }
  }, [event]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
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
      background: "rgba(0,0,0,0.8)", // darker overlay
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
      padding: "20px",
    },
    modal: {
      background: "#1e1e1e", // dark modal background
      borderRadius: "12px",
      width: "100%",
      maxWidth: "700px", // wider modal
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "24px",
      color: "#f1f1f1",
      boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
    },
    title: {
      fontSize: "22px",
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
      padding: "10px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "1px solid #555",
      backgroundColor: "#2b2b2b",
      color: "#fff",
      outline: "none",
      boxSizing: "border-box",
    },
    readOnlyInput: {
      width: "100%",
      padding: "10px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "1px solid #555",
      backgroundColor: "#2b2b2b",
      color: "#ccc",
      outline: "none",
      boxSizing: "border-box",
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
      marginTop: "24px",
      justifyContent: "flex-end",
    },
    cancelBtn: {
      padding: "10px 20px",
      background: "transparent",
      border: "1px solid #555",
      borderRadius: "6px",
      color: "#ccc",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
    saveBtn: {
      padding: "10px 20px",
      background: "#2563eb",
      border: "none",
      borderRadius: "6px",
      color: "#fff",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Edit Event</h2>

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
            name="leader"
            value={formData.leader}
            style={styles.readOnlyInput}
            readOnly
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
          <label style={styles.label}>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            style={styles.input}
            placeholder="Address"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Date of Event</label>
          <input
            type="date"
            name="dateOfEvent"
            value={formData.dateOfEvent}
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
              name="renocaming"
              checked={formData.renocaming}
              onChange={handleInputChange}
              style={styles.checkbox}
            />
            <label style={styles.label}>Renocaming</label>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Event Timestamp</label>
          <input
            type="text"
            name="eventTimestamp"
            value={formData.eventTimestamp}
            style={styles.readOnlyInput}
            readOnly
          />
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.cancelBtn} onClick={onClose}>
            CANCEL
          </button>
          <button style={styles.saveBtn} onClick={handleSave}>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;
