import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import { saveToEventHistory } from "../utils/eventhistory";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Eventsfilter from "./Eventsfilter"

const Events = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [showFilter, setShowFilter] = useState(false);
  const [filterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [eventTypes, setEventTypes] = useState([
    'Sunday Service', 'Friday Service', 'Workshop', 'Encounter', 'Conference',
    'J-Activation', 'Destiny Training', 'Social Event', 'Cell', 'Meeting'
  ]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  const fetchEvents = () => {
    axios.get(`${BACKEND_URL}/events`)
      .then((res) => {
        console.log("Response data:", res.data);

        const allEvents = res.data.events || res.data || [];
        const openEvents = allEvents.filter((e) => e.status !== "closed");

        // Normalize recurringDays here
        const normalizedEvents = openEvents.map(event => ({
          ...event,
          recurringDays: event.recurringDays || event.recurring_day || [],
        }));

        const sortedEvents = normalizedEvents.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setEvents(sortedEvents);
        setFilteredEvents(sortedEvents);

        // Extract unique event types
        const fetchedEventTypes = [...new Set(sortedEvents.map(event => event.eventType).filter(Boolean))];
        setEventTypes(prev => [...new Set([...prev, ...fetchedEventTypes])]);
      })
      .catch((err) => console.error("Failed to fetch events", err));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Apply filters to events
  const applyFilters = (filters) => {
    setActiveFilters(filters);

    if (Object.keys(filters).length === 0) {
      setFilteredEvents(events.filter((e) => e.status !== "closed"));
      return;
    }

    const filtered = events.filter(event => {
      if (event.status === "closed") return false;

      let matches = true;

      // Event Type filter
      if (filters.eventType && event.eventType?.toLowerCase() !== filters.eventType.toLowerCase()) {
        matches = false;
      }

      // Location filter
      if (filters.location && event.location !== filters.location) {
        matches = false;
      }

      // Event Leader filter
      if (filters.eventLeader) {
        const eventLeader = event.eventLeader ? event.eventLeader.trim().toLowerCase() : "";
        const filterLeader = filters.eventLeader.trim().toLowerCase();
        if (eventLeader !== filterLeader) {
          matches = false;
        }
      }

      // Ticketed filter
      if (filters.isTicketed !== undefined && filters.isTicketed !== '') {
        const isTicketed = filters.isTicketed === 'true';
        if (event.isTicketed !== isTicketed) {
          matches = false;
        }
      }

      // Recurring Day filter
      if (filters.recurringDay) {
        const eventDays = Array.isArray(event.recurringDays)
          ? event.recurringDays
          : [event.recurringDays];

        if (!eventDays.includes(filters.recurringDay)) {
          matches = false;
        }
      }

      return matches;
    });

    setFilteredEvents(filtered);
  };

  const formatDateTime = (date) => {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Date not set";
    const options = { weekday: "short", year: "numeric", month: "short", day: "numeric" };
    const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
    return `${dateObj.toLocaleDateString("en-US", options)}, ${dateObj.toLocaleTimeString("en-US", timeOptions)}`;
  };

  // Legacy filter for backward compatibility
  const legacyFilteredEvents =
    filterType === "all"
      ? filteredEvents
      : filteredEvents.filter(
        (e) => e.eventType?.toLowerCase() === filterType.toLowerCase()
      );

  const getBadgeColor = (eventType) => {
    if (!eventType) return "#6c757d";

    const cleanedType = eventType.trim().toLowerCase();

    const eventTypeColors = {
      "sunday service": "#5A9BD5",
      "friday service": "#7FB77E",
      "workshop": "#F7C59F",
      "encounter": "#FFADAD",
      "conference": "#C792EA",
      "j-activation": "#F67280",
      "destiny training": "#70A1D7",
      "social event": "#FFD166",
      "meeting": "#A0CED9",
      "children's church": "#FFA07A",
      "cell": "#007bff"
    };

    return eventTypeColors[cleanedType] || "#6c757d";
  };

  const handleCaptureClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleAttendanceSubmit = async (data) => {
    if (!selectedEvent) return { success: false, message: "No event selected." };

    const eventId = selectedEvent._id;
    const eventName = selectedEvent.eventName || selectedEvent.service_name || "Untitled Event";
    const eventType = selectedEvent.eventType || "Event";

    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      const formattedTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

      // Event did not meet
      if (
        data === "did-not-meet" ||
        data === "Mark As Did Not Meet" ||
        (typeof data === "string" && data.toLowerCase().includes("did not meet"))
      ) {
        await axios.put(`${BACKEND_URL}/allevents/${eventId}`, {
          did_not_meet: true,
        });

        await saveToEventHistory({
          eventId,
          service_name: eventName,
          eventType,
          status: "did-not-meet",
          reason: "Marked as did not meet",
          closedAt: `${formattedDate}, ${formattedTime}`,
          leader12: selectedEvent?.eventLeader || "Unknown",
          leader12_email: selectedEvent?.eventLeaderEmail || "Unknown",
          userEmail: currentUser?.email || "Unknown",
        });

        setEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, status: "closed" } : e)));
        setFilteredEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, status: "closed" } : e)));

        return { success: true, message: `${eventName} marked as 'Did Not Meet'.` };
      }

      if (Array.isArray(data) && data.length > 0) {
        await axios.put(`${BACKEND_URL}/allevents/${eventId}`, {
          attendees: data.map((person) => person.id),
          did_not_meet: false,
        });

        console.log("Saving eventLeader:", selectedEvent.eventLeader);
        console.log("Saving eventLeaderEmail:", selectedEvent.eventLeaderEmail);


        await saveToEventHistory({
          eventId: selectedEvent._id,
          service_name: selectedEvent.eventName || selectedEvent.service_name || "Untitled Event",
          eventType: selectedEvent.eventType || "Event",
          status: "attended",
          attendees: data,
          leader12: selectedEvent.eventLeader || "-",       // Check this value!
          leader12_email: selectedEvent.eventLeaderEmail || "-", // And this value!
          userEmail: currentUser.email,
        });


        setEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, status: "closed" } : e)));
        setFilteredEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, status: "closed" } : e)));

        return { success: true, message: `Successfully captured attendance for ${eventName}` };
      }

      return { success: false, message: "No attendees selected." };
    } catch (error) {
      console.error("Error updating event:", error);
      return {
        success: false,
        message: "Something went wrong while capturing the event.",
      };
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
      await axios.delete(`${BACKEND_URL}/events/${currentEvent._id}`);

      setEvents((prev) => prev.filter((e) => e._id !== currentEvent._id));
      setFilteredEvents((prev) => prev.filter((e) => e._id !== currentEvent._id));
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
    handleMenuClose();
  };

  // Helper function to render leadership information
  const renderLeadershipInfo = (event) => {
    const isCell = event.eventType?.toLowerCase().includes("cell");
    const leaders = [];

    // Event Leader
    if (event.eventLeaderName || event.eventLeader) {
      leaders.push({
        title: "Event Leader",
        name: event.eventLeaderName || event.eventLeader,  // prefer fullName if returned
        style: { fontWeight: "600", color: theme.palette.text.primary }
      });
    }

    // Leader email
    if (event.eventLeaderEmail) {
      leaders.push({
        title: "Leader Email",
        name: event.eventLeaderEmail,
        style: { fontSize: "0.85rem", color: theme.palette.text.secondary }
      });
    }

    // Cell‐specific leaders
    if (isCell) {
      if (event.leader12) {
        leaders.push({
          title: "Leader @12",
          name: event.leader12,
          style: { color: theme.palette.text.secondary }
        });
      }
      if (event.leader144) {
        leaders.push({
          title: "Leader @144",
          name: event.leader144,
          style: { color: theme.palette.text.secondary }
        });
      }
    }

    // Possible legacy fields, if backend uses other names
    if (event.leaderSeat12 && !event.leader12) {
      leaders.push({
        title: "Leader @12",
        name: event.leaderSeat12,
        style: { color: theme.palette.text.secondary }
      });
    }
    if (event.leaderSeat144 && !event.leader144) {
      leaders.push({
        title: "Leader @144",
        name: event.leaderSeat144,
        style: { color: theme.palette.text.secondary }
      });
    }

    return leaders;
  };


  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div style={{ ...styles.container, backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}>
      {/* Header */}
      <div style={{ ...styles.header, backgroundColor: theme.palette.background.paper }}>
        <div style={styles.headerLeft}>
          <button style={{ ...styles.button, ...styles.btnNewEvent, marginLeft: "25px" }} onClick={() => navigate("/create-events")}>
            + NEW EVENT
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.btnFilter,
              marginRight: "25px",
              position: 'relative'
            }}
            onClick={() => setShowFilter(true)}
          >
            FILTER EVENTS
            {activeFilterCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: '#007bff',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                minWidth: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeFilterCount}
              </span>
            )}
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

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div style={{
          padding: '1rem',
          backgroundColor: theme.palette.background.paper,
          borderRadius: '8px',
          margin: '1rem 0',
          border: `1px solid ${theme.palette.divider}`
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: theme.palette.text.secondary,
            marginBottom: '0.5rem'
          }}>
            Active Filters ({activeFilterCount}):
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {Object.entries(activeFilters).map(([key, value]) => {
              const filterLabels = {
                eventType: 'Type',
                location: 'Location',
                eventLeader: 'Leader',
                isTicketed: 'Ticket',
                recurringDay: 'Day'
              };

              const displayValue = key === 'isTicketed'
                ? (value === 'true' ? 'Ticketed' : 'Free')
                : value;

              return (
                <span
                  key={key}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  {filterLabels[key]}: {displayValue}
                </span>
              );
            })}
            <button
              onClick={() => applyFilters({})}
              style={{
                backgroundColor: 'transparent',
                color: '#dc3545',
                border: '1px solid #dc3545',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div style={{
        padding: '0 1rem',
        fontSize: '0.875rem',
        color: theme.palette.text.secondary
      }}>
        Showing {legacyFilteredEvents.length} of {events.filter(e => e.status !== "closed").length} events
      </div>

      {/* Events Grid */}
      <div style={styles.eventsGrid}>
        {legacyFilteredEvents.map((event) => (
          <div
            key={event._id}
            style={{
              ...styles.eventCard,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            {/* Header with Title and Badge */}
            <div style={styles.eventHeader}>
              <div style={styles.titleAndBadgeContainer}>
                <h3 style={{ ...styles.eventTitle, color: theme.palette.text.primary }}>
                  {event.eventName || event.service_name || "Untitled Event"}
                </h3>
                <span
                  style={{
                    ...styles.eventBadge,
                    backgroundColor: getBadgeColor(event.eventType),
                  }}
                >
                  {capitalize(event.eventType) || "Unknown"}
                </span>
              </div>

              {/* Edit/Delete Menu */}
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, event)}
                style={{
                  color: theme.palette.text.primary,
                  flexShrink: 0,
                }}
              >
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

            {/* Leadership Information - Enhanced */}
            <div style={styles.leadershipSection}>
              {renderLeadershipInfo(event).map((leader, index) => (
                <div key={index} style={styles.leaderRow}>
                  <span style={styles.leaderLabel}>{leader.title}:</span>
                  <span style={{ ...styles.leaderName, ...leader.style }}>
                    {leader.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Date and Location */}
            <p style={{ ...styles.eventDate, color: theme.palette.text.secondary }}>
              {formatDateTime(event.date)}
            </p>
            <p style={{ ...styles.eventLocation, color: theme.palette.text.secondary }}>
              {event.location || "Location not specified"}
            </p>

            {/* Description */}
            {event.description && (
              <p style={{
                ...styles.eventDescription,
                color: theme.palette.text.secondary,
                fontSize: '0.9rem',
                marginTop: '0.5rem',
                lineHeight: '1.4'
              }}>
                {event.description}
              </p>
            )}

            {/* Price if Ticketed */}
            {event.isTicketed && event.price !== undefined && (
              <p style={{ ...styles.eventPrice, color: theme.palette.text.primary }}>
                Price: {event.price > 0 ? `R${event.price}` : "Free"}
              </p>
            )}


            {/* Recurring Days */}
            {((event.recurringDays && event.recurringDays.length > 0) ||
              (event.recurring_day && event.recurring_day.length > 0)) && (
                <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                  {(event.recurringDays || event.recurring_day || []).map((day, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: "#6c757d",
                        color: "#fff",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                      }}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              )}

            {/* Action Buttons */}
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
                  ...(event.isTicketed ? {} : styles.disabledBtn),
                  whiteSpace: 'nowrap',
                }}
                disabled={!event.isTicketed}
                onClick={() =>
                  event.isTicketed && navigate(`/event-payment/${event._id}`)
                }
              >
                {event.isTicketed ? "Payment" : "No Payment"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation Button */}
      <button
        style={styles.historyButton}
        onClick={() => navigate("/history")}
        title="View Event History"
      >
        🕒 History
      </button>

      {/* EventsFilter Modal */}
      <Eventsfilter
        open={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilter={applyFilters}
        events={events.filter((e) => e.status !== "closed")}
        currentFilters={activeFilters}
        eventTypes={eventTypes}
      />

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
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    padding: "1rem",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #e9ecef",
    flexWrap: "wrap",
    gap: "1rem",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
  },
  profileIcon: {
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "50%",
    background: "transparent",
  },
  button: {
    borderRadius: "6px",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    border: "none",
    whiteSpace: "nowrap",
  },
  btnNewEvent: {
    backgroundColor: "#000",
    color: "#fff",
  },
  btnFilter: {
    backgroundColor: "#fff",
    border: "1px solid #dee2e6",
    color: "#6c757d",
  },
  eventsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    padding: "1.5rem 0",
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: 0,
  },
  eventHeader: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "0.75rem",
    gap: "0.5rem",
  },
  titleAndBadgeContainer: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  eventTitle: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "#212529",
    wordBreak: "break-word",
    lineHeight: "1.3",
  },
  eventBadge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.25rem 0.75rem",
    borderRadius: "50px",
    color: "#fff",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    alignSelf: "flex-start",
    width: "fit-content",
  },
  leadershipSection: {
    marginTop: "10px",
    marginBottom: "10px",
    padding: "12px",
    backgroundColor: "rgba(0, 123, 255, 0.05)",
    borderRadius: "8px",
    border: "1px solid rgba(0, 123, 255, 0.1)",
  },
  leaderRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "6px",
    gap: "8px",
  },
  leaderLabel: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#495057",
    minWidth: "90px",
    flexShrink: 0,
  },
  leaderName: {
    fontSize: "0.9rem",
    flex: 1,
    wordBreak: "break-word",
  },
  eventDate: {
    margin: "0.25rem 0",
    fontSize: "1rem",
    color: "#495057",
  },
  eventLocation: {
    margin: "0.25rem 0",
    fontSize: "0.95rem",
    color: "#6c757d",
  },
  eventDescription: {
    margin: "0.5rem 0",
    fontSize: "0.9rem",
    color: "#6c757d",
    lineHeight: "1.4",
  },
  eventPrice: {
    margin: "0.25rem 0",
    fontSize: "0.95rem",
    color: "#000000",
    fontWeight: 600,
  },
  eventActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginTop: 'auto',
  },
  actionBtn: {
    flex: 1,
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.9rem",
    minWidth: "120px",
  },
  captureBtn: {
    backgroundColor: "#000",
    color: "#fff",
  },
  paymentBtn: {
    backgroundColor: "#007bff",
    color: "#fff",
  },
  disabledBtn: {
    opacity: 0.6,
    cursor: "not-allowed",
    backgroundColor: "#e9ecef",
    color: "#6c757d",
  },
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
    zIndex: 1000,
    whiteSpace: "nowrap",
  },
  centerAvatarSection: {
    display: "flex",
    justifyContent: "center",
    marginTop: "40px",
    padding: "0 10px",
    flexWrap: "wrap",
    gap: "1rem",
  },
  avatarButton: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    borderRadius: "12px",
    padding: "10px 20px",
    gap: "15px",
    cursor: "pointer",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    border: "none",
    backgroundColor: "#fff",
    fontWeight: "600",
    fontSize: "1rem",
    width: "100%",
    maxWidth: "420px",
    justifyContent: "center",
    textAlign: "center",
  },
  labelText: {
    fontWeight: "600",
    fontSize: "0.9rem",
    userSelect: "none",
    width: "100%",
    textAlign: "center",
  },
  avatars: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
  },
  avatarCircle: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    fontSize: "1.3rem",
    userSelect: "none",
  },
};

export default Events;