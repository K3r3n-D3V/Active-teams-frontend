import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import { saveToEventHistory } from "./EventHistory"; 
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

const Events = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/events`) // backend returns only open events
      .then((res) => {
        const sortedEvents = res.data.events.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setEvents(sortedEvents);
      })
      .catch((err) => console.error("Failed to fetch events", err));
  }, []);

  const formatDateTime = (date) => {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Date not set";
    const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
    const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
    return `${dateObj.toLocaleDateString("en-US", options)}, ${dateObj.toLocaleTimeString("en-US", timeOptions)}`;
  };

  const filteredEvents =
    filterType === "all"
      ? events
      : events.filter((e) => e.eventType?.toLowerCase() === filterType.toLowerCase());

  const handleCaptureClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleAttendanceSubmit = async (data) => {
    if (!selectedEvent) return;

    const eventId = selectedEvent._id;
    const service_name = selectedEvent.eventName || selectedEvent.service_name || "Untitled Event";
    const eventType = selectedEvent.eventType;

    try {
      if (
        data === "did-not-meet" ||
        data === "Mark As Did Not Meet" ||
        (data && data.toString().toLowerCase().includes("did not meet"))
      ) {
        const now = new Date();
        const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        const formattedTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

        saveToEventHistory({
          eventId,
          service_name,
          eventType,
          status: "did-not-meet",
          reason: "Marked as did not meet",
          closedAt: `${formattedDate}, ${formattedTime}`,
        });

        await axios.put(`${import.meta.env.VITE_BACKEND_URL}/events/${eventId}`, { status: "closed" });

      } else if (Array.isArray(data) && data.length > 0) {
        saveToEventHistory({
          eventId,
          service_name,
          eventType,
          status: "attended",
          attendees: data,
        });

        await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/allevents/${eventId}`, {
          attendees: data,
          did_not_meet: false,
        });
      }

      setEvents((prevEvents) => prevEvents.filter((e) => e._id !== eventId));
      setIsModalOpen(false);
      setSelectedEvent(null);
      navigate("/history");
    } catch (err) {
      console.error("Failed to update event status", err);
    }
  };

  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "");

  const handleMenuOpen = (event, eventData) => {
    setAnchorEl(event.currentTarget);
    setCurrentEvent(eventData);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentEvent(null);
  };

  const handleEditEvent = () => {
    if (currentEvent) navigate(`/edit-event/${currentEvent._id}`);
    handleMenuClose();
  };

  const handleDeleteEvent = async () => {
    if (!currentEvent) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/events/${currentEvent._id}`);
      setEvents((prev) => prev.filter((e) => e._id !== currentEvent._id));
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
    handleMenuClose();
  };

  return (
    <div style={{ ...styles.container, backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}>
      {/* Header */}
      <div style={{ ...styles.header, backgroundColor: theme.palette.background.paper }}>
        <div style={styles.headerLeft}>
          <button style={{ ...styles.button, ...styles.btnNewEvent, marginLeft: "25px" }} onClick={() => navigate("/create-events")}>
            + NEW EVENT
          </button>
          <button style={{ ...styles.button, ...styles.btnFilter, marginRight: "25px" }} onClick={() => setShowFilter(true)}>
            FILTER EVENTS
          </button>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.profileIcon}></div>
        </div>
      </div>

      {/* Center Avatar Section */}
      <div style={styles.centerAvatarSection}>
        <button style={styles.avatarButton} onClick={() => navigate("/service-check-in")}>
          <span style={styles.labelText}>SERVICE</span>
          <div style={styles.avatars}>
            <span style={{ ...styles.avatarCircle, backgroundColor: "#cce6ff" }}>🧑🏻‍🎓</span>
            <span style={{ ...styles.avatarCircle, backgroundColor: "#ffedcc" }}>👵🏼</span>
            <span style={{ ...styles.avatarCircle, backgroundColor: "#ffcce0" }}>👨🏽</span>
            <span style={{ ...styles.avatarCircle, backgroundColor: "#ffe6cc" }}>🧑🏽‍🦱</span>
            <span style={{ ...styles.avatarCircle, backgroundColor: "#ccf2d1" }}>👩🏾</span>
          </div>
          <span style={styles.labelText}>CHECK-IN</span>
        </button>
      </div>

      {/* Filter Popup */}
      {showFilter && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupContent}>
            <h3>Filter Events</h3>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={styles.selectBox}>
              <option value="all">All</option>
              <option value="cell">Cell</option>
              <option value="conference">Conference</option>
              <option value="service">Service</option>
            </select>
            <div style={{ marginTop: "1rem" }}>
              <button style={{ ...styles.button, ...styles.btnNewEvent }} onClick={() => setShowFilter(false)}>Apply</button>
              <button style={{ ...styles.button, ...styles.btnFilter, marginLeft: "10px" }} onClick={() => setShowFilter(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div style={styles.eventsGrid}>
        {filteredEvents.map((event) => (
          <div key={event._id} style={styles.eventCard}>
            <div style={styles.eventHeader}>
              <h3 style={styles.eventTitle}>{event.eventName || event.service_name || "Untitled Event"}</h3>

              {/* Edit/Delete Menu */}
              <div>
                <IconButton size="small" onClick={(e) => handleMenuOpen(e, event)} style={{ float: "right" }}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && currentEvent?._id === event._id}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleEditEvent}>Edit</MenuItem>
                  <MenuItem onClick={handleDeleteEvent}>Delete</MenuItem>
                </Menu>
              </div>

              <span style={{
                ...styles.eventBadge,
                backgroundColor:
                  event.eventType?.toLowerCase() === "cell" ? "#007bff" :
                  event.eventType?.toLowerCase() === "conference" ? "#e91e63" :
                  event.eventType?.toLowerCase() === "service" ? "#28a745" : "#6c757d",
              }}>
                {capitalize(event.eventType) || "Unknown"}
              </span>
            </div>

            <p style={styles.eventDate}>{formatDateTime(event.date)}</p>
            <p style={styles.eventLocation}>{event.location || "Location not specified"}</p>

            {event.isTicketed && event.price && <p style={styles.eventPrice}>Price: R{event.price}</p>}

            {/* Show recurring days if any */}
            {event.recurringDays && event.recurringDays.length > 0 && (
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                {event.recurringDays.map((day, idx) => (
                  <span key={idx} style={{ backgroundColor: "#6c757d", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontSize: "0.8rem" }}>
                    {day}
                  </span>
                ))}
              </div>
            )}

            <div style={styles.eventActions}>
              <button style={{ ...styles.actionBtn, ...styles.captureBtn }} onClick={() => handleCaptureClick(event)}>Capture</button>

              <button
                style={{
                  ...styles.actionBtn,
                  ...styles.paymentBtn,
                  ...(event.isTicketed ? {} : styles.disabledBtn),
                }}
                disabled={!event.isTicketed}
                onClick={() => event.isTicketed && navigate(`/payment/${event._id}`)}
              >
                {event.isTicketed ? "Payment" : "No Payment"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating History Button */}
      <button style={styles.historyButton} onClick={() => navigate("/history")} title="View Event History">
        🕒 History
      </button>

      {/* Attendance Modal */}
      {selectedEvent && (
        <AttendanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent}
          onSubmit={handleAttendanceSubmit}
        />
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid #e9ecef", flexWrap: "wrap" },
  headerLeft: { display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" },
  headerRight: { display: "flex", alignItems: "center" },
  profileIcon: { width: "2.25rem", height: "2.25rem", borderRadius: "50%", background: "#ddd" },
  button: { borderRadius: "6px", fontWeight: 500, padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.875rem", border: "none" },
  btnNewEvent: { backgroundColor: "#000", color: "#fff" },
  btnFilter: { backgroundColor: "#fff", border: "1px solid #dee2e6", color: "#6c757d" },
  eventsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", padding: "1.5rem" },
  eventCard: { backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  eventHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" },
  eventTitle: { margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#212529" },
  eventBadge: { fontSize: "0.75rem", fontWeight: 600, padding: "0.25rem 0.75rem", borderRadius: "50px", color: "#fff", textTransform: "uppercase", whiteSpace: "nowrap" },
  eventDate: { margin: "0.25rem 0", fontSize: "1rem", color: "#495057" },
  eventLocation: { margin: "0.25rem 0", fontSize: "0.95rem", color: "#6c757d" },
  eventPrice: { margin: "0.25rem 0", fontSize: "0.95rem", color: "#000000", fontWeight: 600 },
  eventActions: { marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  actionBtn: { flex: 1, padding: "0.5rem 1rem", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" },
  captureBtn: { backgroundColor: "#000", color: "#fff" },
  paymentBtn: { backgroundColor: "#007bff", color: "#fff" },
  disabledBtn: { opacity: 0.6, cursor: "not-allowed", backgroundColor: "#e9ecef", color: "#6c757d" },
  popupOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 },
  popupContent: { background: "#fff", padding: "2rem", borderRadius: "12px", width: "300px", textAlign: "center" },
  selectBox: { width: "100%", padding: "0.5rem", borderRadius: "6px", marginTop: "1rem" },
  historyButton: { position: "fixed", bottom: "20px", right: "20px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "50px", padding: "0.75rem 1.25rem", cursor: "pointer", fontSize: "1rem", boxShadow: "0 4px 8px rgba(0,0,0,0.2)", zIndex: 1000 },
  centerAvatarSection: { display: "flex", justifyContent: "center", marginTop: "60px", padding: "0 20px", flexWrap: "wrap" },
  avatarButton: { display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", padding: "24px 40px", border: "none", borderRadius: "24px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", cursor: "pointer", flexWrap: "wrap", maxWidth: "100%" },
  labelText: { fontWeight: "bold", fontSize: "20px", color: "#000", margin: "0 20px" },
  avatars: { display: "flex", alignItems: "center", flexWrap: "nowrap", overflowX: "auto" },
  avatarCircle: { width: "50px", height: "50px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginLeft: "-10px", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" },
};

export default Events;
