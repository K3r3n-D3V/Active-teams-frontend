import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";

const Events = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]); // ✅ Now from backend

  // ✅ Fetch events from backend
  useEffect(() => {
    axios.get("http://localhost:8000/events")
      .then((res) => setEvents(res.data.events))
      .catch((err) => console.error("Failed to fetch events", err));
  }, []);

  const formatDateTime = (date) => {
    const dateObj = new Date(date);
    const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
    const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
    return `${dateObj.toLocaleDateString("en-US", options)}, ${dateObj.toLocaleTimeString("en-US", timeOptions)}`;
  };

  const filteredEvents = filterType === "all" ? events : events.filter((e) => e.eventType === filterType);

  const handleCaptureClick = (event) => {
    setSelectedEvent(event); // store clicked event
    setIsModalOpen(true); // open modal
  };

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      {/* Header */}
      <div style={{ ...styles.header, backgroundColor: theme.palette.background.paper }}>
        <div style={styles.headerLeft}>
          <button style={{ ...styles.button, ...styles.btnNewEvent, marginLeft: "25px" }} onClick={() => navigate("/create-events")}>
            + NEW EVENT
          </button>
          <button
            style={{ ...styles.button, ...styles.btnFilter, marginRight: "25px" }}
            onClick={() => setShowFilter(true)}
          >
            ⚙️ FILTER EVENTS
          </button>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.profileIcon}></div>
        </div>
      </div>

      {/* Filter Popup */}
      {showFilter && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupContent}>
            <h3>Filter Events</h3>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={styles.selectBox}
            >
              <option value="all">All</option>
              <option value="cell">Cell</option>
              <option value="conference">Conference</option>
              <option value="service">Service</option>
            </select>
            <div style={{ marginTop: "1rem" }}>
              <button style={{ ...styles.button, ...styles.btnNewEvent }} onClick={() => setShowFilter(false)}>
                Apply
              </button>
              <button
                style={{ ...styles.button, ...styles.btnFilter, marginLeft: "10px" }}
                onClick={() => setShowFilter(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Events */}
      <div style={styles.eventsGrid}>
        {filteredEvents.map((event) => (
          <div key={event._id} style={styles.eventCard}>
            <div style={styles.eventHeader}>
              <h3 style={styles.eventTitle}>{event.service_name}</h3>
              <span
  style={{
    ...styles.eventBadge,
    backgroundColor:
      event.eventType?.toLowerCase() === "cell"
        ? "#007bff"
        : event.eventType?.toLowerCase() === "conference"
        ? "#e91e63"
        : "#6c757d",
  }}
>
  {event.eventType?.toUpperCase() || "UNKNOWN"}
</span>

            </div>
            <p style={styles.eventDate}>{formatDateTime(event.date)}</p>
            <p style={styles.eventLocation}>{event.address}</p>
            <div style={styles.eventActions}>
              <button
                style={{ ...styles.actionBtn, ...styles.captureBtn }}
                onClick={() => handleCaptureClick(event)}
              >
                Capture
              </button>
              <button
                style={{
                  ...styles.actionBtn,
                  ...styles.paymentBtn,
                  ...(event.eventType === "cell" || event.eventType === "service"
                    ? styles.disabledBtn
                    : {}),
                }}
                disabled={event.eventType === "cell" || event.eventType === "service"}
              >
                {event.eventType === "cell" || event.eventType === "service" ? "No Payment" : "Payment"}
              </button>
            </div>
          </div>
        ))}
      </div>
   {/* Floating History Button */}
<button
  style={styles.historyButton}
  onClick={() => navigate("/history")}
  title="View Event History"
>
  🕒 History
</button>
      {/* Attendance Modal */}
      {selectedEvent && (
        <AttendanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent} // pass the clicked event to modal
          onSubmit={(data) => console.log("Attendance data:", data)}
        />
      )}
    </div>
  );
};

          

const styles = {
  container: { minHeight: "100vh", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid #e9ecef" },
  headerLeft: { display: "flex", alignItems: "center", gap: "0.75rem" },
  headerRight: { display: "flex", alignItems: "center" },
  profileIcon: { width: "2.25rem", height: "2.25rem", borderRadius: "50%", background: "#ddd" },
  button: { borderRadius: "6px", fontWeight: 500, padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.875rem", border: "none" },
  btnNewEvent: { backgroundColor: "#000", color: "#fff" },
  btnFilter: { backgroundColor: "#fff", border: "1px solid #dee2e6", color: "#6c757d" },
  eventsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", padding: "1.5rem" },
  eventCard: { backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  eventHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" },
  eventTitle: { margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#212529" },
  eventBadge: { fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "50px", color: "#fff", textTransform: "uppercase" },
  eventDate: { margin: "0.25rem 0", fontSize: "1rem", color: "#495057" },
  eventLocation: { margin: "0.25rem 0", fontSize: "0.95rem", color: "#6c757d" },
  eventActions: { marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  actionBtn: { flex: 1, padding: "0.5rem 1rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" },
  captureBtn: { backgroundColor: "#000", color: "#fff" },
  paymentBtn: { backgroundColor: "#e9ecef", color: "#6c757d" },
  disabledBtn: { opacity: 0.6, cursor: "not-allowed" },
  popupOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" },
  popupContent: { background: "#fff", padding: "2rem", borderRadius: "12px", width: "300px", textAlign: "center" },
  selectBox: { width: "100%", padding: "0.5rem", borderRadius: "6px", marginTop: "1rem" },
  historyButton: {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "50px",
  padding: "0.75rem 1.25rem",
  cursor: "pointer",
  fontSize: "1rem",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  zIndex: 1000
}

};

export default Events;
