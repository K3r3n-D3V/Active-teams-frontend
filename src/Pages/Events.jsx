import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import { saveToEventHistory } from "../utils/eventhistory";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Eventsfilter from "./Eventsfilter";
import EventsModal from "./EventsModal";
import CreateEvents from "./CreateEvents";
import EventTypesModal from "./EventTypesModal";

// Define styles object outside the component
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
  floatingAddButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "50px",
    padding: "0.75rem 1.25rem",
    fontSize: "1.5rem",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    zIndex: 1000,
  },
  floatingHistoryButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "50px",
    padding: "0.75rem 1.25rem",
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    zIndex: 1000,
    whiteSpace: "nowrap",
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
  btnFilter: {
    backgroundColor: "#fff",
    border: "1px solid #dee2e6",
    color: "#6c757d",
  },
  eventsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1.5rem",
    padding: "1.5rem 0",
  },
  eventCard: {
    minHeight: "160px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    justifyContent: "flex-start",
    padding: "12px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
    alignItems: "flex-start",
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
    paddingTop: '1rem',
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
  // Fixed Modal overlay styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  modalContent: {
    position: 'relative',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '95vh',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    backgroundColor: '#333',
    color: 'white',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
  },
  modalCloseButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '20px',
    color: 'white',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  },
  modalBody: {
    flex: 1,
    overflow: 'auto',
    padding: '0',
  },
};

const EventSkeleton = () => {
  return (
    <div style={styles.eventCard}>
      <div
        style={{ height: 18, width: "60%", borderRadius: 6, backgroundColor: "#e9ecef" }}
      />
      <div
        style={{ height: 12, width: "45%", borderRadius: 6, backgroundColor: "#e9ecef" }}
      />
      <div
        style={{ height: 12, width: "90%", borderRadius: 6, backgroundColor: "#e9ecef" }}
      />
      <div
        style={{ height: 12, width: "85%", borderRadius: 6, backgroundColor: "#e9ecef" }}
      />
      <div
        style={{
          height: 12,
          width: "70%",
          borderRadius: 6,
          backgroundColor: "#e9ecef",
          marginTop: "auto",
        }}
      />
    </div>
  );
};

const Events = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const isAdmin = currentUser?.role === "admin";

  const [showFilter, setShowFilter] = useState(false);
  const [filterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateOptionsModal, setShowCreateOptionsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateEventTypeModal, setShowCreateEventTypeModal] = useState(false);

  const [eventTypes, setEventTypes] = useState([
    "Service",
    "Workshop",
    "Encounter",
    "Conference",
    "J-Activation",
    "Destiny Training",
    "Social Event",
    "Cell",
    "Meeting",
  ]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch regular and cell events concurrently
      const [eventsResponse, cellsResponse] = await Promise.all([
        axios.get(`${BACKEND_URL}/events`, { headers }),
        axios.get(`${BACKEND_URL}/events/cells-user`, { headers }),
      ]);

      const regularEvents = eventsResponse.data.events || eventsResponse.data || [];
      const nonCellEvents = regularEvents.filter(
        (event) =>
          event.eventType?.toLowerCase() !== "cell" && event.eventType?.toLowerCase() !== "cells"
      );

      const userCellEvents = cellsResponse.data.events || [];

      console.log("Fetched non-cell events:", nonCellEvents.length);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureNonCellEvents = nonCellEvents.filter((event) => {
        if (event.status === "closed") {
          console.log(`Filtered out closed event: ${event.eventName}`);
          return false;
        }
        const eventDate = new Date(event.date);
        const isFuture = eventDate >= today;
        console.log(
          `Event: ${event.eventName}, Date: ${eventDate}, Status: ${event.status}, Is Future: ${isFuture}`
        );
        return isFuture;
      });

      console.log("Future events after filtering:", futureNonCellEvents.length);

      const combinedEvents = [...futureNonCellEvents, ...userCellEvents];
      const sortedEvents = combinedEvents.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents);

      const fetchedEventTypes = [
        ...new Set(sortedEvents.map((event) => event.eventType).filter(Boolean)),
      ];
      setEventTypes((prev) => [...new Set([...prev, ...fetchedEventTypes])]);
    } catch (err) {
      console.error("Failed to fetch events", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered with:", {
      pathname: location.pathname,
      refresh: location.state?.refresh,
      timestamp: location.state?.timestamp,
    });
    fetchEvents();
  }, [location.pathname, location.state?.refresh, location.state?.timestamp]);

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
        const eventLeaderName = event.eventLeaderName ? event.eventLeaderName.trim().toLowerCase() : "";
        const filterLeader = filters.eventLeader.trim().toLowerCase();
        if (eventLeaderName !== filterLeader) {
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
    if (!date) return "Date not set";
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
      workshop: "#F7C59F",
      encounter: "#FFADAD",
      conference: "#C792EA",
      "j-activation": "#F67280",
      "destiny training": "#70A1D7",
      "social event": "#FFD166",
      meeting: "#A0CED9",
      "children's church": "#FFA07A",
      cell: "#007bff",
    };

    return eventTypeColors[cleanedType] || "#6c757d";
  };

  const handleCaptureClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCreateEvent = () => {
    setShowCreateOptionsModal(false); // Close options modal first
    setShowCreateEventModal(true);
  };

  const handleCreateEventType = () => {
    setShowCreateOptionsModal(false); // Close options modal first
    setShowCreateEventTypeModal(true); // Open event type modal
  };

  const handleCloseCreateEventModal = () => {
    setShowCreateEventModal(false);
    // Refresh events after closing the modal
    fetchEvents();
  };

  const handleCreateEventTypeSubmit = async (eventTypeData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${BACKEND_URL}/event-types`, eventTypeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add the new event type to the existing types
      if (response.data && response.data.name) {
        setEventTypes(prev => [...prev, response.data.name]);
      }
      
      console.log('Event type created successfully:', response.data);
    } catch (error) {
      console.error('Error creating event type:', error);
      throw error; // Re-throw to handle in the modal
    }
  };

  const handleCloseCreateEventTypeModal = () => {
    setShowCreateEventTypeModal(false);
  };

  const handleAttendanceSubmit = async (data) => {
    if (!selectedEvent)
      return { success: false, message: "No event selected." };

    const eventId = selectedEvent._id;
    const eventName =
      selectedEvent.eventName || selectedEvent.service_name || "Untitled Event";
    const eventType = selectedEvent.eventType || "Event";

    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const formattedTime = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      // Event did not meet
      if (
        data === "did-not-meet" ||
        data === "Mark As Did Not Meet" ||
        (typeof data === "string" &&
          data.toLowerCase().includes("did not meet"))
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
          leader12: selectedEvent?.eventLeaderName || "Unknown",
          leader12_email: selectedEvent?.eventLeaderEmail || "Unknown",
          userEmail: currentUser?.email || "Unknown",
        });

        // Mark event as closed locally
        setEvents((prev) =>
          prev.map((e) => (e._id === eventId ? { ...e, status: "closed" } : e))
        );
        setFilteredEvents((prev) =>
          prev.map((e) => (e._id === eventId ? { ...e, status: "closed" } : e))
        );

        navigate("/events-history");

        return {
          success: true,
          message: `${eventName} marked as 'Did Not Meet'.`,
        };
      }

      // Event attended
      if (Array.isArray(data) && data.length > 0) {
        await axios.put(`${BACKEND_URL}/allevents/${eventId}`, {
          attendees: data.map((person) => person.id),
          did_not_meet: false,
        });

        await saveToEventHistory({
          eventId,
          service_name: eventName,
          eventType,
          status: "attended",
          attendees: data,
          leader12: selectedEvent.eventLeaderName || "-",
          leader12_email: selectedEvent.eventLeaderEmail || "-",
          userEmail: currentUser.email,
        });

        // Mark event as closed locally
        setEvents((prev) =>
          prev.map((e) => (e._id === eventId ? { ...e, status: "closed" } : e))
        );
        setFilteredEvents((prev) =>
          prev.map((e) => (e._id === eventId ? { ...e, status: "closed" } : e))
        );

        navigate("/events-history");
        return {
          success: true,
          message: `Successfully captured attendance for ${eventName}`,
        };
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

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

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
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/events/${currentEvent._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEvents((prev) => prev.filter((e) => e._id !== currentEvent._id));
      setFilteredEvents((prev) => prev.filter((e) => e._id !== currentEvent._id));
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
    handleMenuClose();
  };

  const renderLeadershipInfo = (event) => {
    const isCell = event.eventType?.toLowerCase().includes("cell");
    const leaders = [];
    if (event.eventLeaderName && event.eventLeaderName !== 'Not specified') {
      leaders.push({
        title: "Event Leader",
        name: event.eventLeaderName,
        style: { fontWeight: "600", color: theme.palette.text.primary }
      });
    }
    if (event.eventLeaderEmail && event.eventLeaderEmail !== 'Not specified') {
      leaders.push({
        title: "Leader Email",
        name: event.eventLeaderEmail,
        style: { fontSize: "0.85rem", color: theme.palette.text.secondary }
      });
    }

    // Cell-specific leadership
    if (isCell) {
      if (event.leader1 && event.leader1.trim()) {
        leaders.push({
          title: "Leader @1",
          name: event.leader1,
          style: { color: theme.palette.text.secondary }
        });
      }
      if (event.leader12 && event.leader12.trim()) {
        leaders.push({
          title: "Leader @12",
          name: event.leader12,
          style: { color: theme.palette.text.secondary }
        });
      }
    }

    return { leaders, isCell };
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div style={{ ...styles.container, backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}>
      {/* Header */}
      <div style={{ ...styles.header, backgroundColor: theme.palette.background.paper }}>
        <div style={styles.headerLeft}>
          <button
            style={{
              ...styles.button,
              ...styles.btnFilter,
              marginLeft: "25px",
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
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => <EventSkeleton key={idx} />)
          : legacyFilteredEvents.map((event) => {
            const { leaders } = renderLeadershipInfo(event);
            return (
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
                      {event.eventName}
                    </h3>
                    <span
                      style={{
                        ...styles.eventBadge,
                        backgroundColor: getBadgeColor(event.eventType),
                      }}
                    >
                      {capitalize(event.eventType)}
                    </span>
                  </div>

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

                {/* Leadership Information */}
                {leaders.length > 0 && (
                  <div style={styles.leadershipSection}>
                    {leaders.map((leader, index) => (
                      <div key={index} style={styles.leaderRow}>
                        <span style={styles.leaderLabel}>{leader.title}:</span>
                        <span style={{ ...styles.leaderName, ...leader.style }}>
                          {leader.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Date, Location, Description */}
                <p style={{ ...styles.eventDate, color: theme.palette.text.secondary }}>
                  {formatDateTime(event.date)}
                </p>
                <p style={{ ...styles.eventLocation, color: theme.palette.text.secondary }}>
                  {event.location}
                </p>
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

                {/* Ticketed */}
                {event.isTicketed && (
                  <p style={{ ...styles.eventPrice, color: theme.palette.text.primary }}>
                    Price: {event.price > 0 ? `R${event.price}` : "Free"}
                  </p>
                )}

                {/* Recurring Days */}
                {event.recurringDays?.length > 0 && (
                  <div style={{
                    display: "flex",
                    gap: "6px",
                    marginTop: "8px",
                    flexWrap: "wrap"
                  }}>
                    <span style={{
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: theme.palette.text.secondary,
                      marginRight: "8px"
                    }}>
                      Recurring:
                    </span>
                    {event.recurringDays.map((day, idx) => (
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
            );
          })}
      </div>

      {/* No Events Message */}
      {legacyFilteredEvents.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: theme.palette.text.secondary
        }}>
          <p>No events found matching your criteria.</p>
        </div>
      )}

      {/* Floating Buttons */}
      {isAdmin ? (
        <button
          style={styles.floatingAddButton}
          onClick={() => setShowCreateOptionsModal(true)}
          title="Add New Event"
        >
          +
        </button>
      ) : (
        <button
          style={styles.floatingHistoryButton}
          onClick={() => navigate("/events-history")}
          title="View Event History"
        >
          History
        </button>
      )}

      {/* Filter Modal */}
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
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onSubmit={handleAttendanceSubmit}
        />
      )}

      {/* Additional Attendance Modal for Admin */}
      {showAttendanceModal && (
        <AttendanceModal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          event={selectedEvent}
          onSubmit={handleAttendanceSubmit}
        />
      )}

      {/* Create Options Modal */}
      <EventsModal
        isOpen={showCreateOptionsModal}
        onClose={() => setShowCreateOptionsModal(false)}
        onCreateEvent={handleCreateEvent}
        onCreateEventType={handleCreateEventType}
      />

{/* Create Event Type Modal */}
<EventTypesModal
  open={showCreateEventTypeModal}
  onClose={handleCloseCreateEventTypeModal}
  onSubmit={handleCreateEventTypeSubmit}
/>


      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div 
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseCreateEventModal();
            }
          }}
        >
          <div style={styles.modalContent}>
            <button
              style={{
                ...styles.modalCloseButton,
                ':hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  color: '#333'
                }
              }}
              onClick={handleCloseCreateEventModal}
              title="Close"
            >
              ×
            </button>
            <CreateEvents 
              user={currentUser} 
              isModal={true} 
              onClose={handleCloseCreateEventModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;