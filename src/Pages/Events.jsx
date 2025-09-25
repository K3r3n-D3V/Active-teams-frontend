import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import { saveToEventHistory } from "../utils/eventhistory";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
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

  // Event type navigation styles
  eventTypeNavigation: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#fff',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': {
      display: 'none'
    }
  },
  eventTypeButtons: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    minWidth: 'fit-content'
  },
  eventTypeButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    border: '1px solid #dee2e6',
    borderRadius: '50px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  eventTypeButtonActive: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: '1px solid #000'
  },
  eventTypeButtonHover: {
    backgroundColor: '#e9ecef',
    borderColor: '#adb5bd'
  },
  deleteIcon: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    color: '#dc3545',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: '50%',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    marginLeft: '8px'
  },
  pageTitle: {
    padding: '1rem 1.5rem 0.5rem',
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#212529',
    textTransform: 'capitalize'
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
  dateFilterInput: {
    padding: "0.5rem 1rem",
    border: "1px solid #dee2e6",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#6c757d",
    backgroundColor: "#fff",
    cursor: "pointer",
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
    height: "03px",
    cursor: "pointer",
    fontSize: "0.9rem",
    minWidth: "120px",
  },
  captureBtn: {
    backgroundColor: "#000",
    color: "#fff",

  },
  paymentBtn: {
    // backgroundColor: "#007bff",
    color: "#fff",
  },
  disabledBtn: {
    opacity: 0.6,
    cursor: "not-allowed",
    backgroundColor: "#e9ecef",
    color: "#6c757d",
  },
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
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  // State management - Fixed modal states
  const [showFilter, setShowFilter] = useState(false);
  const [filterType] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState([]);
  const [userCreatedEventTypes, setUserCreatedEventTypes] = useState([]);
  const [customEventTypes, setCustomEventTypes] = useState([]);
  
  // Modal states - Fixed and simplified
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [createOptionsModalOpen, setCreateOptionsModalOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [createEventTypeModalOpen, setCreateEventTypeModalOpen] = useState(false);
  
  // Date filter state
  const [selectedDate, setSelectedDate] = useState("");

  const [currentSelectedEventType, setCurrentSelectedEventType] = useState(() => {
    return localStorage.getItem("selectedEventType") || '';
  });

  // Add delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventTypeToDelete, setEventTypeToDelete] = useState(null);

  // Add these new state variables for event type navigation
  const [selectedEventType, setSelectedEventType] = useState("all");

  // Load persisted event types from localStorage
  useEffect(() => {
    const savedEventTypes = localStorage.getItem("customEventTypes");
    if (savedEventTypes) {
      try {
        const parsed = JSON.parse(savedEventTypes);
        setCustomEventTypes(parsed);
        setUserCreatedEventTypes(parsed);
        setEventTypes(parsed.map(type => type.name));
      } catch (error) {
        console.error("Error parsing saved event types:", error);
      }
    }
  }, []);

  // Save event types to localStorage whenever they change
  useEffect(() => {
    if (customEventTypes.length > 0) {
      localStorage.setItem("customEventTypes", JSON.stringify(customEventTypes));
    }
  }, [customEventTypes]);

  // Add delete function for event types
  const handleDeleteEventType = async (id, name) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/event-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedEventTypes = customEventTypes.filter(type => type._id !== id);
      setCustomEventTypes(updatedEventTypes);
      setUserCreatedEventTypes(updatedEventTypes);
      setEventTypes(updatedEventTypes.map(type => type.name));

      // Reset selection if deleted type is currently selected
      if (selectedEventType === name) {
        handleEventTypeSelect("all");
      }
    } catch (error) {
      console.error("Error deleting event type:", error);
      // Still remove from local state even if API call fails
      const updatedEventTypes = customEventTypes.filter(type => type._id !== id);
      setCustomEventTypes(updatedEventTypes);
      setUserCreatedEventTypes(updatedEventTypes);
      setEventTypes(updatedEventTypes.map(type => type.name));
    }
  };

  // Add confirmation dialog handlers
  const openDeleteConfirm = (eventType) => {
    setEventTypeToDelete(eventType);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (eventTypeToDelete) {
      handleDeleteEventType(eventTypeToDelete._id, eventTypeToDelete.name);
    }
    setDeleteConfirmOpen(false);
    setEventTypeToDelete(null);
  };

  // Update the fetchEvents function to also fetch custom event types
  const fetchEvents = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch regular events, cell events, and custom event types concurrently
      const [eventsResponse, cellsResponse, eventTypesResponse] = await Promise.all([
        axios.get(`${BACKEND_URL}/events`, { headers }),
        axios.get(`${BACKEND_URL}/events/cells-user`, { headers }),
        axios.get(`${BACKEND_URL}/event-types`, { headers }).catch(() => ({ data: [] }))
      ]);

      const regularEvents = eventsResponse.data.events || eventsResponse.data || [];
      const nonCellEvents = regularEvents.filter(
        (event) =>
          event.eventType?.toLowerCase() !== "cell" && event.eventType?.toLowerCase() !== "cells"
      );

      const userCellEvents = cellsResponse.data.events || [];

      // Get custom event types from API and merge with local storage
      // Use API as single source of truth - no localStorage merging
const apiCustomTypes = eventTypesResponse.data || [];

setCustomEventTypes(apiCustomTypes);
setUserCreatedEventTypes(apiCustomTypes);
setEventTypes(apiCustomTypes.map(type => type.name));

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

    } catch (err) {
      console.error("Failed to fetch events", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };



  const EventTypeNavigation = () => {
    return (
      <div style={{
        ...styles.eventTypeNavigation,
        backgroundColor: theme.palette.background.paper,
        borderBottomColor: theme.palette.divider
      }}>
        <div style={styles.eventTypeButtons}>
          {/* All Events Button */}
          <button
            key="all"
            style={{
              ...styles.eventTypeButton,
              ...(selectedEventType === "all" ? styles.eventTypeButtonActive : {}),
              backgroundColor: selectedEventType === "all"
                ? theme.palette.primary.main
                : theme.palette.background.default,
              color: selectedEventType === "all"
                ? theme.palette.primary.contrastText
                : theme.palette.text.primary,
              borderColor: selectedEventType === "all"
                ? theme.palette.primary.main
                : theme.palette.divider
            }}
            onClick={() => handleEventTypeSelect("all")}
            onMouseEnter={(e) => {
              if (selectedEventType !== "all") {
                e.target.style.backgroundColor = theme.palette.action.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedEventType !== "all") {
                e.target.style.backgroundColor = theme.palette.background.default;
              }
            }}
          >
            ALL EVENTS
          </button>

          {/* Custom Event Type Buttons */}
          {customEventTypes.map((type) => {
            const isSelected = selectedEventType === type.name;
            return (
              <div key={type._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  style={{
                    ...styles.eventTypeButton,
                    ...(isSelected ? styles.eventTypeButtonActive : {}),
                    backgroundColor: isSelected
                      ? theme.palette.primary.main
                      : theme.palette.background.default,
                    color: isSelected
                      ? theme.palette.primary.contrastText
                      : theme.palette.text.primary,
                    borderColor: isSelected
                      ? theme.palette.primary.main
                      : theme.palette.divider
                  }}
                  onClick={() => handleEventTypeSelect(type.name)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = theme.palette.action.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = theme.palette.background.default;
                    }
                  }}
                >
                  {type.name.toUpperCase()}
                </button>

                {/* Delete button for custom event types - only show for admins */}
                {isAdmin && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteConfirm(type);
                    }}
                    size="small"
                    sx={{
                      color: 'error.main',
                      '&:hover': { bgcolor: 'error.light', color: 'white' },
                      width: '24px',
                      height: '24px'
                    }}
                    title={`Delete ${type.name} event type`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Handle event type selection
  const handleEventTypeSelect = (eventType) => {
    setSelectedEventType(eventType);
    applyAllFilters(activeFilters, selectedDate, eventType);
  };

  // Updated filter function to include date filtering
  const applyAllFilters = (filters = activeFilters, dateFilter = selectedDate, eventTypeFilter = selectedEventType) => {
    let filtered = events.filter(event => {
      if (event.status === "closed") return false;

      let matches = true;

      // Event Type filter
      if (eventTypeFilter !== "all" && event.eventType?.toLowerCase() !== eventTypeFilter.toLowerCase()) {
        matches = false;
      }

      // Date filter
      if (dateFilter) {
        const eventDate = new Date(event.date);
        const filterDate = new Date(dateFilter);
        if (eventDate.toDateString() !== filterDate.toDateString()) {
          matches = false;
        }
      }

      // Other filters
      if (filters.eventType && event.eventType?.toLowerCase() !== filters.eventType.toLowerCase()) {
        matches = false;
      }

      if (filters.location && event.location !== filters.location) {
        matches = false;
      }

      if (filters.eventLeader) {
        const eventLeaderName = event.eventLeaderName ? event.eventLeaderName.trim().toLowerCase() : "";
        const filterLeader = filters.eventLeader.trim().toLowerCase();
        if (eventLeaderName !== filterLeader) {
          matches = false;
        }
      }

      if (filters.isTicketed !== undefined && filters.isTicketed !== '') {
        const isTicketed = filters.isTicketed === 'true';
        if (event.isTicketed !== isTicketed) {
          matches = false;
        }
      }

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

  // Handle date filter change
  const handleDateFilter = (event) => {
    const date = event.target.value;
    setSelectedDate(date);
    applyAllFilters(activeFilters, date, selectedEventType);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate("");
    applyAllFilters(activeFilters, "", selectedEventType);
  };

  // Check if an event type is custom (created by user)
  // const isCustomEventType = (eventTypeName) => {
  //   return customEventTypes.some(type => type.name === eventTypeName);
  // };
  // console.log("Custom Event Types:", customEventTypes);

  // Get page title based on selected event type
  const getPageTitle = () => {
    if (selectedEventType === "all") {
      return "All Events";
    }
    return selectedEventType;
  };

  const handleCreateEventTypeSubmit = async (eventTypeData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${BACKEND_URL}/event-types`, eventTypeData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data && response.data.name) {
      const newEventType = response.data;
      
      // Single state update - avoid duplication
      const updatedEventTypes = [...customEventTypes, newEventType];
      setCustomEventTypes(updatedEventTypes);
      setUserCreatedEventTypes(updatedEventTypes);
      setEventTypes(updatedEventTypes.map(type => type.name));
      
      // Set selection and open modal
      setCurrentSelectedEventType(newEventType.name);
      setCreateEventTypeModalOpen(false);
      setCreateEventModalOpen(true);
      
      alert('Event type has been created successfully!');
      console.log('Event type created successfully:', response.data);
    }
  } catch (error) {
    console.error('Error creating event type:', error);
    throw error;
  }
};

  useEffect(() => {
    if (currentSelectedEventType) {
      localStorage.setItem("selectedEventType", currentSelectedEventType);
    } else {
      localStorage.removeItem("selectedEventType");
    }
  }, [currentSelectedEventType]);

  useEffect(() => {
    console.log("useEffect triggered with:", {
      pathname: location.pathname,
      refresh: location.state?.refresh,
      timestamp: location.state?.timestamp,
    });
    fetchEvents();
  }, [location.pathname, location.state?.refresh, location.state?.timestamp]);

  // Fetch event types from backend
  // const fetchEventTypes = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const headers = { Authorization: `Bearer ${token}` };
  //     const { data } = await axios.get(`${BACKEND_URL}/event-types`, { headers });
      
  //     // Merge with local storage
  //     const savedEventTypes = JSON.parse(localStorage.getItem("customEventTypes") || "[]");
  //     const mergedEventTypes = [...(data || [])];
  //     savedEventTypes.forEach(savedType => {
  //       if (!mergedEventTypes.find(apiType => apiType._id === savedType._id)) {
  //         mergedEventTypes.push(savedType);
  //       }
  //     });
      
  //     setCustomEventTypes(mergedEventTypes);
  //     setUserCreatedEventTypes(mergedEventTypes);
  //     setEventTypes(mergedEventTypes.map(type => type.name));
  //   } catch (error) {
  //     console.error("Error fetching event types:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchEventTypes();
  // }, []);

  // Apply filters to events
  const applyFilters = (filters) => {
    setActiveFilters(filters);
    applyAllFilters(filters, selectedDate, selectedEventType);
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
    setAttendanceModalOpen(true);
  };

  const handleCreateEvent = () => {
    setCreateOptionsModalOpen(false);
    setCreateEventModalOpen(true);
  };

  const handleCreateEventType = () => {
    setCreateOptionsModalOpen(false);
    setCreateEventTypeModalOpen(true);
  };

  const handleCloseCreateEventModal = () => {
    setCreateEventModalOpen(false);
    fetchEvents();
  };

  const handleCloseCreateEventTypeModal = () => {
    setCreateEventTypeModalOpen(false);
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
    const eventTypeNormalized = event.eventType?.toLowerCase() || "";
    const isCell = eventTypeNormalized === "cell";
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

    if (isCell) {
      // Use nullish coalescing to default to empty string
      const leader1 = event.leader1 ?? "";
      const leader12 = event.leader12 ?? "";

      if (leader1.trim()) {
        leaders.push({
          title: "Leader @1",
          name: leader1,
          style: { color: theme.palette.text.secondary }
        });
      }
      if (leader12.trim()) {
        leaders.push({
          title: "Leader @12",
          name: leader12,
          style: { color: theme.palette.text.secondary }
        });
      }
    }

    return { leaders, isCell };
  };

  const activeFilterCount = Object.keys(activeFilters).length + (selectedDate ? 1 : 0);
  const allEventTypes = [...(eventTypes || []), ...(userCreatedEventTypes || [])];

  const selectedEventTypeObj = allEventTypes.find(
    eventType => eventType.name?.toLowerCase() === currentSelectedEventType?.toLowerCase()
  );

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
          
          {/* Date Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateFilter}
              style={styles.dateFilterInput}
              title="Filter by date"
            />
            {selectedDate && (
              <button
                onClick={clearDateFilter}
                style={{
                  ...styles.button,
                  backgroundColor: '#dc3545',
                  color: 'white',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                }}
                title="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.profileIcon}></div>
        </div>
      </div>
      
      {isAdmin && <EventTypeNavigation />}
      
      <h2 style={{
        ...styles.pageTitle,
        color: theme.palette.text.primary
      }}>
        {getPageTitle()}
      </h2>

      {/* Results count */}
      <div style={{
        padding: '0 1rem',
        fontSize: '0.875rem',
        color: theme.palette.text.secondary
      }}>
        Showing {legacyFilteredEvents.length} of {events.filter(e => e.status !== "closed").length} events
        {selectedDate && (
          <span style={{ marginLeft: '1rem', fontStyle: 'italic' }}>
            (filtered by date: {new Date(selectedDate).toLocaleDateString()})
          </span>
        )}
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

              <button
    style={{ ...styles.actionBtn, ...styles.captureBtn }}
    onClick={() => {
      if (event.status === "closed" && !isAdmin) {
        alert("Attendance has already been captured for this event.");
        return;
      }
      handleCaptureClick(event);
    }}
    disabled={event.status === "closed" && !isAdmin}
    title={event.status === "closed" && !isAdmin ? "Attendance captured — action disabled" : "Capture attendance"}
  >
    Capture
  </button>



                  <div style={styles.eventActions}>

  {/* Add Captured badge for admins on closed events */}
  {isAdmin && event.status === "closed" && (
    <span style={{
      color: 'green',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      marginRight: '1rem',
      userSelect: 'none',
      alignSelf: 'center',
    }}>
      ✓ Captured
    </span>
  )}

 

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
                    {/* {event.isTicketed ? "Payment" : "No Payment"} */}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
      
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
          onClick={() => setCreateOptionsModalOpen(true)}
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
          isOpen={attendanceModalOpen}
          onClose={() => {
            setAttendanceModalOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onSubmit={handleAttendanceSubmit}
        />
      )}

      {/* Create Options Modal */}
      <EventsModal
        isOpen={createOptionsModalOpen}
        onClose={() => setCreateOptionsModalOpen(false)}
        onCreateEvent={handleCreateEvent}
        onCreateEventType={handleCreateEventType}
      />

      {/* Create Event Type Modal */}
      <EventTypesModal
        open={createEventTypeModalOpen}
        onClose={handleCloseCreateEventTypeModal}
        onSubmit={handleCreateEventTypeSubmit}
      />

      {/* Create Event Modal */}
      {createEventModalOpen && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseCreateEventModal();
            }
          }}
        >
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create New Event</h2>
              <button
                style={styles.modalCloseButton}
                onClick={handleCloseCreateEventModal}
                title="Close"
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <CreateEvents
                user={currentUser}
                isModal={true}
                onClose={handleCloseCreateEventModal}
                selectedEventType={currentSelectedEventType}
                eventTypes={allEventTypes}
                isGlobalEvent={selectedEventTypeObj?.isGlobal || false}
                isTicketedEvent={selectedEventTypeObj?.isTicketed || false}
                hasPersonSteps={selectedEventTypeObj?.hasPersonSteps || false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Event Type</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{eventTypeToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Events;