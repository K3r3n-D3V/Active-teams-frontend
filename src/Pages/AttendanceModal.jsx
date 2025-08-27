import React, { useState } from "react";
import { useTheme } from "@mui/material/styles"; // ⬅️ Import the MUI theme

const AttendanceModal = ({ isOpen, onClose, onSubmit }) => {
  const theme = useTheme(); // ⬅️ Access theme from context
const [searchName, setSearchName] = useState("");
const [filteredPeople, setFilteredPeople] = useState([]);

  const [attendeeName, setAttendeeName] = useState("");
  const [attendees, setAttendees] = useState([
    "Tegra", "David", "Cyre", "Dino"
  ]);
  const [checked, setChecked] = useState({});

  const handleAddAttendee = () => {
    if (attendeeName.trim()) {
      setAttendees([...attendees, attendeeName.trim()]);
      setAttendeeName("");
    }
  };

  const fetchFilteredPeople = async (name) => {
  try {
    const res = await fetch(`http://localhost:8000/people?name=${name}`);
    const data = await res.json();
    if (data.people) {
      setFilteredPeople(data.people);
    }
  } catch (err) {
    console.error("Error fetching people:", err);
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
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
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
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      outline: "none"
    },
    addBtn: {
      background: theme.palette.mode === "dark" ? "#eee" : "#111",
      color: theme.palette.mode === "dark" ? "#111" : "#fff",
      border: "none",
      padding: "8px 12px",
      borderRadius: "6px",
      cursor: "pointer"
    },
    list: {
      maxHeight: "200px",
      overflowY: "auto",
      marginBottom: "16px",
      color: theme.palette.text.primary,
    },
    listItem: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "6px",
      color: theme.palette.text.primary,
      cursor: "pointer"
    },
    actions: {
      display: "flex",
      justifyContent: "space-between"
    },
    primaryBtn: {
      background: theme.palette.mode === "dark" ? "#eee" : "#111",
      color: theme.palette.mode === "dark" ? "#111" : "#fff",
      border: "none",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer"
    },
    secondaryBtn: {
      background: theme.palette.mode === "dark" ? "#444" : "#f3f4f6",
      color: theme.palette.mode === "dark" ? "#eee" : "#111",
      border: "none",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer"
    }
  };

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
            style={styles.secondaryBtn}
            onClick={() => {
              if (onSubmit) onSubmit("did-not-meet");
              onClose();
            }}
          >
            Mark As Did Not Meet
          </button>
          <button onClick={handleSubmit} style={styles.primaryBtn}>Submit Attendance</button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
