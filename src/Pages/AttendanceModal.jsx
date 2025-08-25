// AttendanceModal.js
import React, { useState } from "react";

const AttendanceModal = ({ isOpen, onClose, onSubmit }) => {
  const [attendeeName, setAttendeeName] = useState("");
  const [attendees, setAttendees] = useState([
    "Tegra",
    "David",
    "Cyre",
    "Dino"
  ]);
  const [checked, setChecked] = useState({});

  const handleAddAttendee = () => {
    if (attendeeName.trim()) {
      setAttendees([...attendees, attendeeName.trim()]);
      setAttendeeName("");
    }
  };

  const handleToggle = (name) => {
    setChecked({ ...checked, [name]: !checked[name] });
  };

  const handleSubmit = () => {
    if (onSubmit) onSubmit(checked);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Capture Attendance</h2>
        <div style={styles.addContainer}>
          <input
            type="text"
            placeholder="Add attendee name"
            value={attendeeName}
            onChange={(e) => setAttendeeName(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleAddAttendee} style={styles.addBtn}>Add</button>
        </div>
        <div style={styles.list}>
          {attendees.map((name, index) => (
            <label key={index} style={styles.listItem}>
              <input
                type="checkbox"
                checked={!!checked[name]}
                onChange={() => handleToggle(name)}
              />
              {name}
            </label>
          ))}
        </div>
        <div style={styles.actions}>
<button
  onClick={() => {
    if (onSubmit) onSubmit(checked);
    onClose();
  }}
  // Rename to indicate: "Mark As Did Not Meet"
>
  Mark As Did Not Meet
</button>
          <button onClick={handleSubmit} style={styles.primaryBtn}>Submit Attendance</button>
        </div>
      </div>
    </div>
    
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  modal: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    width: "400px",
    maxWidth: "90%",
    boxSizing: "border-box"
  },
  addContainer: {
    display: "flex",
    marginBottom: "16px",
    gap: "8px"
  },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },
  addBtn: {
    background: "#111",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  list: {
    maxHeight: "200px",
    overflowY: "auto",
    marginBottom: "16px"
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px"
  },
  actions: {
    display: "flex",
    justifyContent: "space-between"
  },
  primaryBtn: {
    background: "#111",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  secondaryBtn: {
    background: "#f3f4f6",
    color: "#111",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer"
  }
};

export default AttendanceModal;
