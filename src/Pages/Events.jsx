import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import { saveToEventHistory } from "../utils/eventhistory";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";

import Eventsfilter from "./Eventsfilter";
import EventsModal from "./EventsModal";
import CreateEvents from "./CreateEvents";
import EventTypesModal from "./EventTypesModal";

// Utility to save events to localStorage as "incomplete" initially
const saveEventToLocalStorage = (event, currentUser) => {
  const currentHistory = JSON.parse(localStorage.getItem("eventHistory")) || [];
  
  const existingIndex = currentHistory.findIndex(
    entry => entry.eventId === event._id
  );
  
  if (existingIndex === -1) {
    const newEntry = {
      eventId: event._id,
      service_name: event.eventName,
      eventType: event.eventType,
      status: "incomplete",
      attendees: [],
      reason: "",
      leader12: event.leader12 || event.eventLeaderName || "-",
      leader12_email: event.eventLeaderEmail || "-",
      userEmail: currentUser?.email || "-",
      userName: currentUser?.name || "-",
      userLeader144: event.leader144 || "-",
      closedAt: "",
      timestamp: new Date().toISOString(),
    };
    
    currentHistory.push(newEntry);
    localStorage.setItem("eventHistory", JSON.stringify(currentHistory));
    window.dispatchEvent(new Event("eventHistoryUpdated"));
  }
};

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    padding: "1rem",
    boxSizing: "border-box",
  },
  topSection: {
    padding: "1.5rem",
    backgroundColor: "#fff",
    borderRadius: "8px",
    marginBottom: "1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  searchFilterRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: "250px",
    padding: "0.75rem 1rem",
    border: "1px solid #dee2e6",
    borderRadius: "6px",
    fontSize: "0.95rem",
  },
  filterButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  statusBadgeContainer: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    border: '2px solid',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
  },
  statusBadgeIncomplete: {
    backgroundColor: '#FFA500',
    color: '#fff',
    borderColor: '#FFA500',
  },
  statusBadgeComplete: {
    backgroundColor: '#fff',
    color: '#28a745',
    borderColor: '#28a745',
  },
  statusBadgeDidNotMeet: {
    backgroundColor: '#fff',
    color: '#dc3545',
    borderColor: '#dc3545',
  },
  statusBadgeActive: {
    transform: 'scale(1.05)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#000",
    color: "#fff",
  },
  th: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: 600,
    fontSize: "0.95rem",
    borderBottom: "2px solid #000",
  },
  tr: {
    borderBottom: "1px solid #e9ecef",
    transition: "background-color 0.2s ease",
  },
  trHover: {
    backgroundColor: "#f8f9fa",
  },
  td: {
    padding: "1rem",
    fontSize: "0.9rem",
    color: "#212529",
  },
  openEventIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#007bff',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
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
  loadingSkeleton: {
    padding: "1rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    height: "60px",
    marginBottom: "0.5rem",
    animation: "pulse 1.5s ease-in-out infinite",
  },
};

const Events = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const isAdmin = currentUser?.role === "admin";
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [showFilter, setShowFilter] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState([]);
  const [userCreatedEventTypes, setUserCreatedEventTypes] = useState([]);
  const [customEventTypes, setCustomEventTypes] = useState([]);
  const [selectedEventTypeObj, setSelectedEventTypeObj] = useState(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [createOptionsModalOpen, setCreateOptionsModalOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [createEventTypeModalOpen, setCreateEventTypeModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentSelectedEventType, setCurrentSelectedEventType] = useState(() => {
    return localStorage.getItem("selectedEventType") || '';
  });
  const [selectedStatus, setSelectedStatus] = useState('incomplete');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleAdminHistoryClick = () => {
    navigate("/events-history", { state: { isAdmin: true } });
  };

  // Get event status from localStorage
  const getEventStatus = (eventId) => {
    const eventHistory = JSON.parse(localStorage.getItem("eventHistory")) || [];
    const historyEntry = eventHistory.find(entry => entry.eventId === eventId);
    
    if (!historyEntry) return 'incomplete';
    
    if (historyEntry.status === 'did_not_meet') return 'did_not_meet';
    if (historyEntry.status === 'attended' || historyEntry.status === 'complete') return 'complete';
    
    return 'incomplete';
  };

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

  useEffect(() => {
    if (customEventTypes.length > 0) {
      localStorage.setItem("customEventTypes", JSON.stringify(customEventTypes));
    }
  }, [customEventTypes]);

  const fetchEvents = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      const userRole = currentUser?.role;
      
      let allEvents = [];
      let apiCustomTypes = [];
      
      try {
        const eventTypesResponse = await axios.get(`${BACKEND_URL}/event-types`, { headers });
        apiCustomTypes = eventTypesResponse.data || [];
        setCustomEventTypes(apiCustomTypes);
        setUserCreatedEventTypes(apiCustomTypes);
        setEventTypes(apiCustomTypes.map(type => type.name));
      } catch (typeError) {
        console.error("Failed to load event types:", typeError);
      }
      
      if (userRole === "admin") {
        try {
          const allEventsResponse = await axios.get(`${BACKEND_URL}/events`, { headers });
          allEvents = allEventsResponse.data.events || [];
        } catch (adminError) {
          console.error("Admin events fetch failed:", adminError);
        }
      } else {
        const response = await axios.get(`${BACKEND_URL}/events/cells-user`, { headers }).catch((err) => {
          console.error("Cells user endpoint failed:", err);
          return { data: { events: [], status: "error", error: err.message } };
        });
        
        const cellsData = response.data;
        
        if (cellsData.status === "success") {
          allEvents = [
            ...(cellsData.own_cells || []),
            ...(cellsData.leader12_cells || []),
            ...(cellsData.leader144_cells || [])
          ];
        }
      }
      
      const processedEvents = allEvents.map((event) => {
        let eventDate = event.date ? new Date(event.date) : null;
        
        return {
          ...event,
          _id: event._id,
          eventName: event.eventName || event["Event Name"],
          eventType: event.eventType || "Cell",
          date: event.date,
          location: event.location || event.Address || "Not specified",
          description: event.description || event.eventName || "",
          eventLeaderName: event.eventLeaderName || event.Leader,
          eventLeaderEmail: event.eventLeaderEmail || event.Email,
          leader1: event.leader1 || event["Leader at 1"] || "",
          leader12: event.leader12 || event["Leader at 12"] || "",
          leader144: event.leader144 || event["Leader at 144"] || "",
          time: event.time || event.Time,
          status: event.status || "open",
          isTicketed: event.isTicketed || false,
          price: event.price || 0,
          parsedDate: eventDate,
          relationship: event.relationship,
          registeredUsers: event.registeredUsers || []
        };
      });
      
      let finalEvents = processedEvents;
      if (userRole === "registrant") {
        finalEvents = processedEvents.filter(event => {
          const eventType = apiCustomTypes.find(
            et => et.name === (event.eventType || "").trim()
          );
          if (!eventType || !(eventType.isTicketed || eventType.isGlobal)) return false;

          if (eventType.isGlobal) return true;

          if (event.registeredUsers && currentUser && currentUser.email) {
            return event.registeredUsers.includes(currentUser.email);
          }

          return false;
        });
      }
      
      const sortedEvents = finalEvents.sort((a, b) => {
        const dateA = a.parsedDate ? a.parsedDate.getTime() : Infinity;
        const dateB = b.parsedDate ? b.parsedDate.getTime() : Infinity;
        return dateA - dateB;
      });
      
      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents);
      
      sortedEvents.forEach(event => {
        saveEventToLocalStorage(event, currentUser);
      });
      
    } catch (err) {
      console.error("Fatal error in fetchEvents:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyAllFilters = (
    filters = activeFilters,
    statusFilter = selectedStatus,
    search = searchQuery
  ) => {
    let filtered = events.filter(event => {
      // Get status from localStorage
      const eventStatus = getEventStatus(event._id);
      
      // Filter by status
      if (statusFilter !== 'all' && eventStatus !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          (event.eventName || "").toLowerCase().includes(searchLower) ||
          (event.eventLeaderName || "").toLowerCase().includes(searchLower) ||
          (event.eventLeaderEmail || "").toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      let matches = true;

      if (filters.eventType) {
        const eventType = (event.eventType || "").toLowerCase().trim();
        const filterType = filters.eventType.toLowerCase().trim();
        if (eventType !== filterType) {
          matches = false;
        }
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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    applyAllFilters(activeFilters, selectedStatus, value);
  };

  const handleCreateEventTypeSubmit = async (eventTypeData) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(`${BACKEND_URL}/event-types`, eventTypeData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newEventType = response.data;

      if (newEventType) {
        const updatedEventTypes = [...customEventTypes, newEventType];
        setCustomEventTypes(updatedEventTypes);
        setUserCreatedEventTypes(updatedEventTypes);
        setEventTypes(updatedEventTypes.map(type => type.name));

        setSelectedEventTypeObj(newEventType);
        setCurrentSelectedEventType(newEventType.name);

        setCreateEventTypeModalOpen(false);
        setCreateEventModalOpen(true);
      }
    } catch (error) {
      console.error('Error creating event type:', error);
      alert('Failed to create event type. Please try again.');
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
    fetchEvents();
  }, [location.pathname, location.state?.refresh, location.state?.timestamp]);

  const applyFilters = (filters) => {
    setActiveFilters(filters);
    applyAllFilters(filters, selectedStatus, searchQuery);
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Not set";
    return dateObj.toLocaleDateString("en-GB", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric" 
    }).replace(/\//g, ' - ');
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
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const eventId = selectedEvent._id;
      const eventName = selectedEvent.eventName;
      const eventType = selectedEvent.eventType;
      const formattedDate = new Date().toLocaleDateString();
      const formattedTime = new Date().toLocaleTimeString();

      if (data === "did-not-meet") {
        await axios.put(
          `${BACKEND_URL}/events/${eventId}`,
          {
            status: "closed",
            attendees: [],
            did_not_meet: true,
          },
          { headers }
        );

        await saveToEventHistory({
          eventId,
          service_name: eventName,
          eventType,
          status: "did_not_meet",
          attendees: [],
          closedAt: `${formattedDate}, ${formattedTime}`,
          leader12: selectedEvent.eventLeaderName || "-",
          leader12_email: selectedEvent.eventLeaderEmail || "-",
          userEmail: currentUser.email,
        });

        fetchEvents();
        setAttendanceModalOpen(false);
        setSelectedEvent(null);

        setSnackbar({
          open: true,
          message: `${eventName} marked as 'Did Not Meet'.`,
          severity: "success",
        });

        return {
          success: true,
          message: `${eventName} marked as 'Did Not Meet'.`,
        };
      }

      if (Array.isArray(data) && data.length > 0) {
        const attendeeIds = data.map((person) => person.id?.toString?.() ?? "").filter(Boolean);

        await axios.put(
          `${BACKEND_URL}/events/${eventId}`,
          {
            status: "closed",
            attendees: attendeeIds,
            did_not_meet: false,
          },
          { headers }
        );

        await saveToEventHistory({
          eventId,
          service_name: eventName,
          eventType,
          status: "attended",
          attendees: data,
          closedAt: `${formattedDate}, ${formattedTime}`,
          leader12: selectedEvent.eventLeaderName || "-",
          leader12_email: selectedEvent.eventLeaderEmail || "-",
          userEmail: currentUser.email,
        });

        fetchEvents();
        setAttendanceModalOpen(false);
        setSelectedEvent(null);

        setSnackbar({
          open: true,
          message: `Successfully captured attendance for ${eventName}`,
          severity: "success",
        });

        return {
          success: true,
          message: `Successfully captured attendance for ${eventName}`,
        };
      }

      return {
        success: false,
        message: "No attendees selected.",
      };

    } catch (error) {
      console.error("Error updating event:", error);

      let errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message;

      if (typeof errorMessage === "object") {
        try {
          errorMessage = JSON.stringify(errorMessage);
        } catch {
          errorMessage = "Unknown error occurred.";
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const handleEditEvent = (event) => {
    navigate(`/edit-event/${event._id}`);
  };

  const handleDeleteEvent = async (event) => {
    if (!window.confirm(`Are you sure you want to delete "${event.eventName}"?`)) {
      return;
    }

    setEvents((prev) => prev.filter((e) => e._id !== event._id));
    setFilteredEvents((prev) => prev.filter((e) => e._id !== event._id));

    try {
      const token = localStorage.getItem("token");
      const baseUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
      
      await axios.delete(`${baseUrl}/events/${event._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSnackbar({
        open: true,
        message: `"${event.eventName}" deleted successfully!`,
        severity: 'success'
      });
    } catch (err) {
      console.error("Delete error:", err.response?.data);
      setSnackbar({
        open: true,
        message: `Failed to delete: ${err.response?.data?.detail || err.message}`,
        severity: 'error'
      });
    }
  };

  const handleOpenEvent = (event) => {
    navigate(`/event-details/${event._id}`);
  };

  const StatusBadges = () => {
    const statusCounts = {
      incomplete: events.filter(e => getEventStatus(e._id) === 'incomplete').length,
      complete: events.filter(e => getEventStatus(e._id) === 'complete').length,
      did_not_meet: events.filter(e => getEventStatus(e._id) === 'did_not_meet').length,
    };
    
    return (
      <div style={styles.statusBadgeContainer}>
        <button
          style={{
            ...styles.statusBadge,
            ...styles.statusBadgeIncomplete,
            ...(selectedStatus === 'incomplete' ? styles.statusBadgeActive : {}),
          }}
          onClick={() => {
            setSelectedStatus('incomplete');
            applyAllFilters(activeFilters, 'incomplete', searchQuery);
          }}
        >
          INCOMPLETE ({statusCounts.incomplete})
        </button>
        
        <button
          style={{
            ...styles.statusBadge,
            ...styles.statusBadgeComplete,
            ...(selectedStatus === 'complete' ? styles.statusBadgeActive : {}),
          }}
          onClick={() => {
            setSelectedStatus('complete');
            applyAllFilters(activeFilters, 'complete', searchQuery);
          }}
        >
          COMPLETE ({statusCounts.complete})
        </button>
        
        <button
          style={{
            ...styles.statusBadge,
            ...styles.statusBadgeDidNotMeet,
            ...(selectedStatus === 'did_not_meet' ? styles.statusBadgeActive : {}),
          }}
          onClick={() => {
            setSelectedStatus('did_not_meet');
            applyAllFilters(activeFilters, 'did_not_meet', searchQuery);
          }}
        >
          DID NOT MEET ({statusCounts.did_not_meet})
        </button>
      </div>
    );
  };

  const allEventTypes = [...(eventTypes || []), ...(userCreatedEventTypes || [])];

  return (
    <div style={{ ...styles.container, backgroundColor: theme.palette.background.default }}>
      <div style={styles.topSection}>
        <div style={styles.searchFilterRow}>
          <input
            type="text"
            placeholder="Search by Event Name or Event Leader..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={styles.searchInput}
          />
          <button
            style={styles.filterButton}
            onClick={() => setShowFilter(true)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            FILTER
          </button>
          {isAdmin && (
            <Tooltip title="View Captured Events" arrow>
              <IconButton
                onClick={handleAdminHistoryClick}
                sx={{
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>

        <StatusBadges />
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>Event Name</th>
              <th style={styles.th}>Leader</th>
              <th style={styles.th}>Leader at 12</th>
              <th style={styles.th}>Day</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Date Of Event</th>
              <th style={styles.th}>Open Event</th>
              <th style={styles.th}>Edit Event</th>
              {isAdmin && <th style={styles.th}>Delete Event</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td colSpan={isAdmin ? 9 : 8} style={styles.td}>
                    <div style={styles.loadingSkeleton} />
                  </td>
                </tr>
              ))
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                  No events found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => {
                const dayOfWeek = event.parsedDate 
                  ? event.parsedDate.toLocaleDateString('en-US', { weekday: 'long' })
                  : 'Not set';
                
                return (
                  <tr
                    key={event._id}
                    style={{
                      ...styles.tr,
                      ...(hoveredRow === event._id ? styles.trHover : {}),
                    }}
                    onMouseEnter={() => setHoveredRow(event._id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={styles.td}>{event.eventName}</td>
                    <td style={styles.td}>{event.eventLeaderName || '-'}</td>
                    <td style={styles.td}>{event.leader12 || '-'}</td>
                    <td style={styles.td}>{dayOfWeek}</td>
                    <td style={styles.td}>{event.eventLeaderEmail || '-'}</td>
                    <td style={styles.td}>{formatDate(event.date)}</td>
                    <td style={styles.td}>
                      <Tooltip title="Open Event Details" arrow>
                        <button
                          style={styles.openEventIcon}
                          onClick={() => handleOpenEvent(event)}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          <CheckBoxIcon />
                        </button>
                      </Tooltip>
                    </td>
                    <td style={styles.td}>
                      <Tooltip title="Edit Event" arrow>
                        <IconButton
                          onClick={() => handleEditEvent(event)}
                          size="small"
                          sx={{ color: '#007bff' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </td>
                    {isAdmin && (
                      <td style={styles.td}>
                        <Tooltip title="Delete Event" arrow>
                          <IconButton
                            onClick={() => handleDeleteEvent(event)}
                            size="small"
                            sx={{ color: '#dc3545' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ 
        padding: '1rem', 
        textAlign: 'center', 
        color: theme.palette.text.secondary,
        fontSize: '0.875rem'
      }}>
        Showing {filteredEvents.length} of {events.length} events
      </div>

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

      <Eventsfilter
        open={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilter={applyFilters}
        events={events}
        currentFilters={activeFilters}
        eventTypes={eventTypes}
      />

      {selectedEvent && (
        <AttendanceModal
          isOpen={attendanceModalOpen}
          onClose={() => {
            setAttendanceModalOpen(false);
            setSelectedEvent(null);
          }}
          onSubmit={handleAttendanceSubmit}
          event={selectedEvent}
          onAttendanceSubmitted={() => {
            fetchEvents();
            setAttendanceModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}

      <EventsModal
        isOpen={createOptionsModalOpen}
        onClose={() => setCreateOptionsModalOpen(false)}
        onCreateEvent={handleCreateEvent}
        onCreateEventType={handleCreateEventType}
        userRole={currentUser?.role}
      />

      <EventTypesModal
        open={createEventTypeModalOpen}
        onClose={handleCloseCreateEventTypeModal}
        onSubmit={handleCreateEventTypeSubmit}
        setSelectedEventTypeObj={setSelectedEventTypeObj}
        customEventTypes={customEventTypes}
        userRole={currentUser?.role}
      />

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
              <h2 style={styles.modalTitle}>
                {selectedEventTypeObj?.name === "CELLS" ? "Create New Cell" : "Create New Event"}
              </h2>
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Events;