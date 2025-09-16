import React, { useState, useEffect } from "react";
import { useTheme, Snackbar, Alert } from "@mui/material";

const AttendanceModal = ({ isOpen, onClose, onSubmit, event }) => {
  const theme = useTheme();

  const [checked, setChecked] = useState({});
  const [people, setPeople] = useState([]);
  const [commonAttendees, setCommonAttendees] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchPeople = async (filter = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append("name", filter);
      params.append("perPage", "100");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`);
      const data = await res.json();
      const peopleArray = data.people || data.results || [];

     const formatted = peopleArray.map((p) => ({
  id: p._id,
  fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
  leader12: p["Leader @12"] || p.leader12 || "",
  leader144: p["Leader @144"] || p.leader144 || "",
}));


      setPeople(formatted);
    } catch (err) {
      console.error("Error fetching people:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommonAttendees = async (cellId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/events/cell/${cellId}/common-attendees`);
      const data = await res.json();
      const attendeesArray = data.common_attendees || [];

      const formatted = attendeesArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
      }));

      setCommonAttendees(formatted);

      // Auto-check common attendees by default
      const initialChecked = {};
      formatted.forEach((p) => {
        initialChecked[p.id] = true;
      });

      setChecked(initialChecked);
    } catch (err) {
      console.error("Failed to fetch common attendees:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPeople();
      setChecked({});
      setSearchName("");

      // Only fetch common attendees for CELL events
      if (event && event.eventType === "cell") {
        fetchCommonAttendees(event._id || event.id);
      } else {
        setCommonAttendees([]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen) fetchPeople(searchName);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchName, isOpen]);

  const handleToggle = (id) => {
    setChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

const handleSubmit = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const selected = people.filter(p => checked[p.id]);

  if (selected.length === 0) {
    setAlert({
      open: true,
      type: "error",
      message: `Please select attendees for "${event.eventName || event.service_name || "this event"}" before submitting.`,
    });
    return;
  }

  const payload = {
    eventId: event.id,
    attendees: selected,
    leaderEmail: user?.email,
    leaderName: user?.name
  };

  try {
    const response = await fetch('/api/submit-attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      setAlert({
        open: true,
        type: "success",
        message: `Attendance successfully submitted for "${event.eventName || event.service_name || "this event"}"!`,
      });
      onClose(); // close modal or do post-submit actions
    } else {
      const result = await response.json();
      setAlert({
        open: true,
        type: "error",
        message: result?.message || `Failed to submit attendance.`,
      });
    }
  } catch (error) {
    console.error(error);
    setAlert({
      open: true,
      type: "error",
      message: `Something went wrong while submitting attendance.`,
    });
  }
};


  const handleMarkDidNotMeet = async () => {
    if (onSubmit) {
      const result = await onSubmit("did-not-meet");

      if (result?.success) {
        setAlert({
          open: true,
          type: "success",
          message: result.message || `${event.eventName || event.service_name || "Event"} captured as did not meet.`,
        });
        onClose();
      } else {
        setAlert({
          open: true,
          type: "error",
          message: result?.message || `Failed to capture did not meet status for "${event.eventName || event.service_name || "this event"}".`,
        });
      }
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
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "10px",
    },
    modal: {
      position: "relative",
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      padding: "20px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "600px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxSizing: "border-box",
    },
    closeBtn: {
      position: "absolute",
      top: "10px",
      right: "10px",
      background: "transparent",
      border: "none",
      fontSize: "20px",
      fontWeight: "bold",
      color: theme.palette.text.primary,
      cursor: "pointer",
    },
    input: {
      width: "100%",
      padding: "12px",
      fontSize: "16px",
      borderRadius: "6px",
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
      outline: "none",
      marginBottom: "16px",
      boxSizing: "border-box",
    },
    peopleList: {
      maxHeight: "300px",
      overflowY: "auto",
      border: "1px solid #ccc",
      borderRadius: "6px",
      backgroundColor: "#fff",
      padding: 0,
    },
    personItem: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "6px 8px",
      fontSize: "16px",
      cursor: "pointer",
      userSelect: "none",
      borderBottom: "1px solid #eee",
    },
    checkbox: {
      width: "20px",
      height: "20px",
      accentColor: "#007bff",
      cursor: "pointer",
    },
    actions: {
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "8px",
      marginTop: "20px",
    },
    primaryBtn: {
      background: "#007bff",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      flex: 1,
    },
    secondaryBtn: {
      background: "#e84118",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      flex: 1,
    },
  };

  // Merge commonAttendees and people, without duplicates
  const combinedPeople = [
    ...commonAttendees,
    ...people.filter((p) => !commonAttendees.some((c) => c.id === p.id)),
  ];

  const filteredPeople = combinedPeople.filter(
    (person) =>
      person.fullName &&
      person.fullName.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
  <>
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        <h2>Capture Attendance - {event.eventName || event.service_name || "Event"}</h2>

       <input
  type="text"
  placeholder="Search people..."
  value={searchName}
  onChange={(e) => setSearchName(e.target.value)}
  style={styles.input}
/>

<div style={styles.peopleList}>
  {loading && <p>Loading...</p>}
  {!loading && filteredPeople.length === 0 && <p>No people found.</p>}
  {filteredPeople.map((person) => (
    <div
      key={person.id}
      style={styles.personItem}
      onClick={() => handleToggle(person.id)}
    >
      <input
        type="checkbox"
        checked={!!checked[person.id]}
        readOnly
        style={styles.checkbox}
      />
      <div>
       <span style={{ color: "#444", fontWeight: 500 }}>{person.fullName}</span>

      </div>
    </div>
  ))}
</div>


        <div style={styles.actions}>
          <button
            style={styles.secondaryBtn}
            onClick={handleMarkDidNotMeet}
          >
            Mark As Did Not Meet
          </button>
       <button onClick={handleSubmit} className="submit-btn">
  Submit Attendance
</button>

        </div>
      </div>
    </div>

    <Snackbar
      open={alert.open}
      autoHideDuration={5000}
      onClose={() => setAlert({ ...alert, open: false })}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        severity={alert.type}
        variant="filled"
        onClose={() => setAlert({ ...alert, open: false })}
      >
        {alert.message}
      </Alert>
    </Snackbar>
  </>
);
};

export default AttendanceModal;