import React, { useState } from "react";
import { useTheme, Snackbar, Alert } from "@mui/material";

const AttendanceModal = ({ isOpen, onClose, onSubmit, event }) => {
  const theme = useTheme();
  const [attendeeName, setAttendeeName] = useState("");
  const [attendees, setAttendees] = useState(["Tegra", "David", "Cyre", "Dino"]);
  const [checked, setChecked] = useState({});
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

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
    const selected = Object.keys(checked).filter(name => checked[name]);

    if (selected.length === 0) {
      setAlert({
        open: true,
        type: "error",
        message: `Please select attendees for "${event.eventName || event.service_name || "this event"}" before submitting.`
      });
      return;
    }

    if (onSubmit) onSubmit(selected);

    setAlert({
      open: true,
      type: "success",
      message: `Attendance successfully submitted for "${event.eventName || event.service_name || "this event"}"!`
    });

    onClose();
  };

  if (!isOpen) return null;

  const styles = {
    overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 },
    modal: { background: theme.palette.background.paper, color: theme.palette.text.primary, padding: "20px", borderRadius: "12px", width: "90%", maxWidth: "400px", boxSizing: "border-box" },
    addContainer: { display: "flex", marginBottom: "16px", gap: "8px", flexWrap: "wrap" },
    input: { flex: 1, padding: "8px", borderRadius: "6px", border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, color: theme.palette.text.primary, outline: "none" },
    addBtn: { background: theme.palette.mode === "dark" ? "#eee" : "#111", color: theme.palette.mode === "dark" ? "#111" : "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" },
    list: { maxHeight: "200px", overflowY: "auto", marginBottom: "16px", color: theme.palette.text.primary },
    listItem: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", color: theme.palette.text.primary, cursor: "pointer" },
    actions: { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" },
    primaryBtn: { background: theme.palette.mode === "dark" ? "#eee" : "#111", color: theme.palette.mode === "dark" ? "#111" : "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", flex: 1 },
    secondaryBtn: { background: theme.palette.mode === "dark" ? "#444" : "#f3f4f6", color: theme.palette.mode === "dark" ? "#eee" : "#111", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", flex: 1 }
  };

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h2>Capture Attendance - {event.eventName || event.service_name || "Event"}</h2>
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

      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={alert.type} variant="filled" onClose={() => setAlert({ ...alert, open: false })}>
          {alert.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AttendanceModal;
