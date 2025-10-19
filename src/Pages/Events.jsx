import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import { Box, useMediaQuery } from "@mui/material";

import Eventsfilter from "./AddPersonToEvents";
import CreateEvents from "./CreateEvents";
import EventTypesModal from "./EventTypesModal";
import EditEventModal from "./EditEventModal";

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    padding: "1rem",
    paddingTop: "5rem",
    boxSizing: "border-box",
    overflow: "hidden", // Prevent main container from scrolling
  },
  topSection: {
    padding: "1.5rem",
    backgroundColor: "#fff",
    borderRadius: "8px",
    marginBottom: "1rem",
    marginTop: "1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  searchFilterRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: "200px",
    padding: "0.75rem 1rem",
    border: "1px solid #dee2e6",
    borderRadius: "6px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
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
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    border: '2px solid',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
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
    overflow: "hidden", // Changed from "auto" to "hidden"
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 300px)", // Limit height to prevent full screen overflow
    display: "flex",
    flexDirection: "column",
  },
  tableWrapper: {
    overflow: "auto",
    flex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1200px",
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
    whiteSpace: "nowrap",
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
    verticalAlign: "top",
  },
  actionIcons: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openEventIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    backgroundColor: '#007bff',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    fontSize: '18px',
  },
  editIcon: {
    color: '#007bff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  deleteIcon: {
    color: '#dc3545',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  truncatedText: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emailText: {
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  eventsCounter: {
    padding: '1rem',
    textAlign: 'center',
    fontSize: '0.875rem',
  },
  overdueLabel: {
    color: 'red',
    fontSize: '0.8rem',
    marginTop: '0.2rem',
    fontWeight: 'bold',
  },
  // Mobile card styles
  mobileCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  mobileCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  },
  mobileCardLabel: {
    fontWeight: 600,
    color: '#666',
  },
  mobileCardValue: {
    color: '#212529',
    textAlign: 'right',
  },
  mobileActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    justifyContent: 'flex-end',
  },
  viewFilterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  viewFilterContainer: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  viewFilterLabel: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#495057',
  },
  viewFilterRadio: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  viewFilterText: {
    fontSize: '1.1rem',
    transition: 'all 0.2s ease',
  },
  paginationButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #dee2e6',
    backgroundColor: '#fff',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    cursor: 'not-allowed',
  },

  rowsSelect: {
    padding: '0.25rem 0.5rem',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    backgroundColor: '#fff',
    fontSize: '0.875rem',
  },
};

const fabStyles = {
  fabContainer: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1000,
  },
  fabMenu: {
    position: "absolute",
    bottom: "70px",
    right: "0",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "all 0.3s ease",
  },
  fabMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fff",
    padding: "12px 16px",
    borderRadius: "50px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
  },
  fabMenuLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  },
  fabMenuIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#007bff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "16px",
  },
  mainFab: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "56px",
    height: "56px",
    fontSize: "1.5rem",
    cursor: "pointer",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
  },
};

const eventTypeStyles = {
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  header: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '1rem',
  },
  selectedTypeDisplay: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#007bff',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#28a745',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  typesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '0.75rem',
  },
  typeCard: {
    padding: '1rem',
    borderRadius: '8px',
    border: '2px solid transparent',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
  },
  typeCardActive: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
    transform: 'translateX(8px) scale(1.02)',
    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.2)',
  },
  typeCardHover: {
    borderColor: '#ddd',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  typeName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
    display: 'block',
  },
  typeNameActive: {
    color: '#007bff',
  },
  activeIndicator: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    animation: 'slideIn 0.3s ease-out',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'flex-end', // This pushes EVERYTHING to the right
    alignItems: 'center',
    padding: '1rem',
    borderTop: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    gap: '1.5rem', // Space between all elements
  },
  rowsPerPage: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#6c757d',
  },
  paginationInfo: {
    fontSize: '0.875rem',
    color: '#6c757d',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
};


const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Events = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const isAdmin = currentUser?.role === "admin";
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [showFilter, setShowFilter] = useState(false);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState([]);
  const [userCreatedEventTypes, setUserCreatedEventTypes] = useState([]);
  const [customEventTypes, setCustomEventTypes] = useState([]);
  const [selectedEventTypeObj, setSelectedEventTypeObj] = useState(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [createEventTypeModalOpen, setCreateEventTypeModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentSelectedEventType, setCurrentSelectedEventType] = useState(() => {
    return localStorage.getItem("selectedEventType") || '';
  });
  const [selectedStatus, setSelectedStatus] = useState('incomplete');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);
  const [viewFilter, setViewFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);


    const debouncedSearchQuery = useDebounce(searchQuery, 500); 

  useEffect(() => {
    if (debouncedSearchQuery !== undefined) {
      setCurrentPage(1); // ADD THIS LINE
      fetchEvents({
        search: debouncedSearchQuery.trim() || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined
      });
    }
  }, [debouncedSearchQuery]);

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

  const fetchEvents = async (filters = {}) => {
    setLoading(true);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Build query parameters - TRY BOTH 'limit' AND 'per_page'
      const params = new URLSearchParams();

      // Try 'per_page' first (more common), fallback to 'limit'
      params.append('page', currentPage.toString());
      params.append('per_page', rowsPerPage.toString()); // Try 'per_page'
      // params.append('limit', rowsPerPage.toString()); // Alternative

      // Add filters
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.event_type && filters.event_type !== 'all') {
        params.append('event_type', filters.event_type);
      }
      if (filters.search && filters.search.trim() !== '') {
        params.append('search', filters.search.trim());
      }

      let endpoint = '';
      const userRole = currentUser?.role?.toLowerCase();

      if (userRole === "admin") {
        endpoint = `${BACKEND_URL}/admin/events/cells?${params}`;
      } else if (userRole === "registrant") {
        endpoint = `${BACKEND_URL}/registrant/events?${params}`;
      } else {
        endpoint = `${BACKEND_URL}/events/cells-user?${params}`;
      }

      console.log(`📡 Fetching from: ${endpoint}`);

      const response = await axios.get(endpoint, { headers });
      console.log("✅ RAW API RESPONSE:", response.data);

      // Handle different response formats
      const responseData = response.data;
      const events = responseData.events || responseData.results || [];
      const total_events = responseData.total_events || responseData.total || 0;
      const page = responseData.page || currentPage;
      const total_pages = responseData.total_pages || responseData.pages || 1;

      setEvents(events);
      setFilteredEvents(events);
      setTotalEvents(total_events);
      setTotalPages(total_pages);
      setCurrentPage(page);

      return responseData;

    } catch (err) {
      console.error("❌ Error fetching events:", err);
      if (err.response) {
        console.error("Response error:", err.response.status, err.response.data);
      }
      // Reset on error
      setEvents([]);
      setFilteredEvents([]);
      setTotalEvents(0);
      setTotalPages(1);
      throw err;
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };


  const isOverdue = (event) => {
    if (event?._is_overdue !== undefined) {
      return event._is_overdue;
    }

    if (!event?.date) return false;

    const status = (event.status || event.Status || '').toLowerCase().trim();
    const didNotMeet = event.did_not_meet || false;
    const hasBeenCaptured = status === 'complete' || status === 'closed' || status === 'did_not_meet' || didNotMeet;

    if (hasBeenCaptured) return false;

    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate < today;
  };


  // Calculate pagination display variables
  const startIndex = totalEvents > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * rowsPerPage, totalEvents);
  const paginatedEvents = filteredEvents; // Backend handles pagination
  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };


  // Search handler

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const applyFilters = (filters) => {
    setActiveFilters(filters);
    // Convert the filter format if needed and call fetchEvents
    fetchEvents({
      ...filters,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      search: searchQuery || undefined
    });
  };
  // Status filter handler
  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1); // ADD THIS LINE
    fetchEvents({
      status: status !== 'all' ? status : undefined,
      search: searchQuery.trim() || undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined
    });
  };
  // Event type filter handler (in your EventTypeSelector)
  const handleEventTypeClick = (typeValue) => {
    setSelectedEventTypeFilter(typeValue);
    setCurrentPage(1); // ADD THIS LINE
    fetchEvents({
      event_type: typeValue !== 'all' ? typeValue : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: searchQuery || undefined
    });
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

        localStorage.setItem('selectedEventTypeObj', JSON.stringify(newEventType));

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
    // Fetch with proper initial filters
    const initialFilters = {};

    if (selectedStatus !== 'all') {
      initialFilters.status = selectedStatus;
    }
    if (selectedEventTypeFilter !== 'all') {
      initialFilters.event_type = selectedEventTypeFilter;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      initialFilters.search = searchQuery.trim();
    }

    fetchEvents(initialFilters);
  }, [location.pathname, location.state?.refresh, location.state?.timestamp, currentPage, rowsPerPage, selectedStatus, selectedEventTypeFilter // Use debounced search instead of searchQuery
  ]);



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
    setCreateEventModalOpen(true);
  };

  const handleCreateEventType = () => {
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
      const eventName = selectedEvent.eventName || 'Event';

      const leaderEmail = currentUser?.email || '';
      const leaderName = `${(currentUser?.name || '').trim()} ${(currentUser?.surname || '').trim()}`.trim() || currentUser?.name || '';

      console.log("🎯 handleAttendanceSubmit called with:", data);

      let payload;

      if (data === "did_not_meet") {
        console.log("🔴 Marking as DID NOT MEET");
        payload = {
          attendees: [],
          leaderEmail,
          leaderName,
          did_not_meet: true,
        };
      } else if (Array.isArray(data)) {
        console.log("✅ Capturing attendance with", data.length, "attendees");
        payload = {
          attendees: data,
          leaderEmail,
          leaderName,
          did_not_meet: false,
        };
      } else {
        console.log("📦 Using provided payload:", data);
        payload = data;
      }

      console.log("🚀 Final payload:", payload);

      const response = await axios.put(
        `${BACKEND_URL.replace(/\/$/, "")}/submit-attendance/${eventId}`,
        payload,
        { headers }
      );

      console.log("✅ Backend response:", response.data);

      await fetchEvents();

      setAttendanceModalOpen(false);
      setSelectedEvent(null);

      setSnackbar({
        open: true,
        message: payload.did_not_meet
          ? `${eventName} marked as 'Did Not Meet'.`
          : `Successfully captured attendance for ${eventName}`,
        severity: "success",
      });

      return { success: true, message: "Attendance submitted successfully" };

    } catch (error) {
      console.error("❌ Error in handleAttendanceSubmit:", error);
      const errData = error.response?.data;
      let errorMessage = error.message;

      if (errData) {
        if (Array.isArray(errData?.errors)) {
          errorMessage = errData.errors.map(e => `${e.field}: ${e.message}`).join('; ');
        } else {
          errorMessage = errData.detail || errData.message || JSON.stringify(errData);
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });

      return { success: false, message: errorMessage };
    }
  };

  // Handle previous page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Handle next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEditModalOpen(true);
  };

  const handleDeleteEvent = async (event) => {
    if (window.confirm(`Are you sure you want to delete "${event.eventName}"?`)) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(`${BACKEND_URL}/events/${event._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          fetchEvents(); // Refresh the list
          setSnackbar({
            open: true,
            message: "Event deleted successfully",
            severity: "success",
          });
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        setSnackbar({
          open: true,
          message: "Failed to delete event",
          severity: "error",
        });
      }
    }
  };


  useEffect(() => {
    // Initial fetch when component mounts
    fetchEvents({
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      search: searchQuery || undefined
    });
  }, []); // Empty dependency array for initial mount only

  const handleSaveEvent = async (updatedData) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const eventId = selectedEvent._id || selectedEvent.id;

      const response = await fetch(`${BACKEND_URL}/events/${eventId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        // Show success message
        setAlert({
          open: true,
          type: "success",
          message: "Event updated successfully!",
        });

        // Refresh your events data
        fetchEvents(); // Your function to fetch events

        setTimeout(() => setAlert({ open: false, type: "success", message: "" }), 3000);
      } else {
        throw new Error("Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      setAlert({
        open: true,
        type: "error",
        message: "Failed to update event",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
    }
  };

  // EventTypeSelector Component
  const EventTypeSelector = () => {
    const allTypes = ['CELLS', ...eventTypes];
    const isAdmin = currentUser?.role === "admin";

    const getDisplayName = (type) => {
      if (type === 'CELLS') return type;
      if (typeof type === 'string') return type.toUpperCase();
      return (type.name || type).toUpperCase();
    };

    const getTypeValue = (type) => {
      if (type === 'CELLS') return 'all';
      if (typeof type === 'string') return type.toLowerCase();
      return (type.name || type).toLowerCase();
    };

    const selectedDisplayName =
      selectedEventTypeFilter === 'all'
        ? 'CELLS'
        : eventTypes.find((t) => {
          const tValue = typeof t === 'string' ? t : t.name;
          return tValue?.toLowerCase() === selectedEventTypeFilter;
        }) || selectedEventTypeFilter;

    const finalDisplayName =
      typeof selectedDisplayName === 'string'
        ? selectedDisplayName
        : selectedDisplayName?.name || 'CELLS';


    return (
      <div style={eventTypeStyles.container}>
        <div style={eventTypeStyles.header}>Filter by Event Type</div>

        <div style={eventTypeStyles.selectedTypeDisplay}>
          <div style={eventTypeStyles.checkIcon}>✓</div>
          <span>{finalDisplayName}</span>
        </div>

        {isAdmin && (
          <div style={eventTypeStyles.typesGrid}>
            {allTypes.map((type) => {
              const displayName = getDisplayName(type);
              const typeValue = getTypeValue(type);
              const isActive = selectedEventTypeFilter === typeValue;
              const isHovered = hoveredType === typeValue;

              return (
                <div
                  key={typeValue}
                  style={{
                    ...eventTypeStyles.typeCard,
                    ...(isActive ? eventTypeStyles.typeCardActive : {}),
                    ...(isHovered && !isActive ? eventTypeStyles.typeCardHover : {}),
                  }}
                  onClick={() => {
                    setSelectedEventTypeFilter(typeValue);
                    fetchEvents({
                      event_type: typeValue !== 'all' ? typeValue : undefined,
                      status: selectedStatus !== 'all' ? selectedStatus : undefined,
                      search: searchQuery || undefined
                    });
                  }}
                  onMouseEnter={() => setHoveredType(typeValue)}
                  onMouseLeave={() => setHoveredType(null)}
                >
                  {isActive && <div style={eventTypeStyles.activeIndicator}>✓</div>}
                  <span
                    style={{
                      ...eventTypeStyles.typeName,
                      ...(isActive ? eventTypeStyles.typeNameActive : {}),
                    }}
                  >
                    {displayName}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // StatusBadges Component
  // StatusBadges Component - FIXED VERSION
const StatusBadges = () => {
  const [statusCounts, setStatusCounts] = useState({
    incomplete: 0,
    complete: 0,
    did_not_meet: 0
  });

  // Fetch counts whenever filters change
  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        
        const params = new URLSearchParams();
        
        // Apply the same filters as main events fetch
        if (selectedEventTypeFilter !== 'all') {
          params.append('event_type', selectedEventTypeFilter);
        }
        if (searchQuery && searchQuery.trim() !== '') {
          params.append('search', searchQuery.trim());
        }

        let endpoint = '';
        const userRole = currentUser?.role?.toLowerCase();

        if (userRole === "admin") {
          endpoint = `${BACKEND_URL}/admin/events/status-counts?${params}`;
        } else if (userRole === "registrant") {
          endpoint = `${BACKEND_URL}/registrant/events/status-counts?${params}`;
        } else {
          endpoint = `${BACKEND_URL}/events/status-counts?${params}`;
        }

        console.log(`📊 Fetching status counts from: ${endpoint}`);
        const response = await axios.get(endpoint, { headers });
        console.log(`📊 Status counts received:`, response.data);
        
        setStatusCounts(response.data);

      } catch (error) {
        console.error("Error fetching status counts:", error);
        // Fallback to client-side calculation if endpoint doesn't exist
        calculateClientSideCounts();
      }
    };

    fetchStatusCounts();
  }, [selectedEventTypeFilter, searchQuery, selectedStatus]); // Re-run when these change

  // Fallback: client-side calculation (less accurate)
  const calculateClientSideCounts = () => {
    console.log("🔄 Using client-side status count calculation");
    
    const counts = {
      incomplete: events.filter(e => {
        if (e.did_not_meet === true) return false;
        if ((e.attendees && e.attendees.length > 0) ||
          ['complete', 'closed'].includes((e.status || e.Status || '').toLowerCase().trim())) {
          return false;
        }
        return true;
      }).length,

      complete: events.filter(e => {
        if (e.did_not_meet === true) return false;
        return (e.attendees && e.attendees.length > 0) ||
          ['complete', 'closed'].includes((e.status || e.Status || '').toLowerCase().trim());
      }).length,

      did_not_meet: events.filter(e => e.did_not_meet === true).length,
    };

    console.log("📊 Client-side counts:", counts);
    setStatusCounts(counts);
  };

  return (
    <div style={styles.statusBadgeContainer}>
      <button
        style={{
          ...styles.statusBadge,
          ...styles.statusBadgeIncomplete,
          ...(selectedStatus === 'incomplete' ? styles.statusBadgeActive : {}),
        }}
        onClick={() => handleStatusClick('incomplete')}
      >
        INCOMPLETE ({statusCounts.incomplete})
      </button>

      <button
        style={{
          ...styles.statusBadge,
          ...styles.statusBadgeComplete,
          ...(selectedStatus === 'complete' ? styles.statusBadgeActive : {}),
        }}
        onClick={() => handleStatusClick('complete')}
      >
        COMPLETE ({statusCounts.complete})
      </button>

      <button
        style={{
          ...styles.statusBadge,
          ...styles.statusBadgeDidNotMeet,
          ...(selectedStatus === 'did_not_meet' ? styles.statusBadgeActive : {}),
        }}
        onClick={() => handleStatusClick('did_not_meet')}
      >
        DID NOT MEET ({statusCounts.did_not_meet})
      </button>
    </div>
  );
};
  // ViewFilterButtons Component
  const ViewFilterButtons = () => {
    return (
      <div style={styles.viewFilterContainer}>
        <span style={styles.viewFilterLabel}>View:</span>

        <label style={styles.viewFilterRadio}>
          <input
            type="radio"
            name="viewFilter"
            value="all"
            checked={viewFilter === 'all'}
            onChange={(e) => {
              setViewFilter(e.target.value);
              fetchEvents({
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
                search: searchQuery || undefined
              });
            }}
            style={{ cursor: 'pointer' }}
          />
          <span style={{
            ...styles.viewFilterText,
            color: viewFilter === 'all' ? '#007bff' : '#6c757d',
            fontWeight: viewFilter === 'all' ? '600' : '400',
          }}>
            View All
          </span>
        </label>

        <label style={styles.viewFilterRadio}>
          <input
            type="radio"
            name="viewFilter"
            value="personal"
            checked={viewFilter === 'personal'}
            onChange={(e) => {
              setViewFilter(e.target.value);
              fetchEvents({
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
                search: searchQuery || undefined
              });
            }}
            style={{ cursor: 'pointer' }}
          />
          <span style={{
            ...styles.viewFilterText,
            color: viewFilter === 'personal' ? '#007bff' : '#6c757d',
            fontWeight: viewFilter === 'personal' ? '600' : '400',
          }}>
            Personal
          </span>
        </label>
      </div>
    );
  };

  // MobileEventCard Component
  const MobileEventCard = ({ event }) => {
    const dayOfWeek = event.day || 'Not set';

    return (
      <div style={styles.mobileCard}>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Event Name:</span>
          <span style={styles.mobileCardValue}>{event.eventName}</span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Leader:</span>
          <span style={styles.mobileCardValue}>{event.eventLeaderName || '-'}</span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Leader at 12:</span>
          <span style={styles.mobileCardValue}>{event.leader12 || '-'}</span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Day:</span>
          <span style={styles.mobileCardValue}>
            <div>{dayOfWeek}</div>
            {isOverdue(event) && (
              <div style={styles.overdueLabel}>Overdue</div>
            )}
          </span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Email:</span>
          <span style={styles.mobileCardValue}>{event.eventLeaderEmail || '-'}</span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Date:</span>
          <span style={styles.mobileCardValue}>{formatDate(event.date)}</span>
        </div>

        <div style={styles.mobileActions}>
          <Tooltip title="Capture Attendance" arrow>
            <button
              style={styles.openEventIcon}
              onClick={() => handleCaptureClick(event)}
            >
              <CheckBoxIcon />
            </button>
          </Tooltip>

          <Tooltip title="Edit Event" arrow>
            <IconButton
              onClick={() => handleEditEvent(event)}
              size="small"
              sx={{ color: '#007bff', border: '1px solid #007bff' }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          {isAdmin && (
            <Tooltip title="Delete Event" arrow>
              <IconButton
                onClick={() => handleDeleteEvent(event)}
                size="small"
                sx={{ color: '#dc3545', border: '1px solid #dc3545' }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}

        </div>

      </div>
    );
  };

  const allEventTypes = [...(eventTypes || []), ...(userCreatedEventTypes || [])];

  return (
    <div style={{ ...styles.container, backgroundColor: theme.palette.background.default }}>
      <div style={styles.topSection}>
        <EventTypeSelector />
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
          >
            FILTER
          </button>
        </div>

        <div style={styles.viewFilterRow}>
          <StatusBadges />
          <ViewFilterButtons />
        </div>
      </div>

      {/* MOBILE VIEW: Card Layout */}
      {isMobile ? (
        <Box>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} style={styles.loadingSkeleton} />
            ))
          ) : filteredEvents.length === 0 ? (
            <div style={{ ...styles.mobileCard, textAlign: 'center', padding: '2rem' }}>
              No events found matching your criteria.
            </div>
          ) : (
            <>
              {paginatedEvents.map((event) => (
                <MobileEventCard key={event._id} event={event} />
              ))}

              {/* Mobile Pagination */}
              {/* Mobile Pagination */}
              <div style={{
                ...styles.paginationContainer,
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <div style={styles.paginationInfo}>
                  {totalEvents > 0 ?
                    `${startIndex}-${endIndex} of ${totalEvents}` :
                    '0-0 of 0'
                  }
                </div>

                <div style={styles.paginationControls}>
                  <button
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage === 1 || isLoading ? styles.paginationButtonDisabled : {}),
                    }}
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoading}
                  >
                    {isLoading ? '...' : '<'}
                  </button>

                  <button
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage === totalPages || totalPages === 0 || isLoading ? styles.paginationButtonDisabled : {}),
                    }}
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                  >
                    {isLoading ? '...' : '>'}
                  </button>
                </div>
              </div>
            </>
          )}
        </Box>
      ) : (
        /* DESKTOP VIEW: Table with Pagination */
        <div style={{ ...styles.tableContainer, position: 'relative' }}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.th}>Event Name</th>
                  <th style={styles.th}>Leader</th>
                  <th style={styles.th}>Leader at 12</th>
                  <th style={styles.th}>Day</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Date Of Event</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td colSpan={7} style={styles.td}>
                        <div style={styles.loadingSkeleton} />
                      </td>
                    </tr>
                  ))
                ) : paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '2rem' }}>
                      No events found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((event) => {
                    const dayOfWeek = event.day || 'Not set';

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
                        <td style={styles.td}>
                          <div style={styles.truncatedText} title={event.eventName}>
                            {event.eventName}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.truncatedText} title={event.eventLeaderName}>
                            {event.eventLeaderName || '-'}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.truncatedText} title={event.leader12}>
                            {event.leader12 || '-'}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div>{dayOfWeek}</div>
                          {isOverdue(event) && (
                            <div style={styles.overdueLabel}>
                              Overdue
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>
                          <div style={styles.emailText} title={event.eventLeaderEmail}>
                            {event.eventLeaderEmail || '-'}
                          </div>
                        </td>
                        <td style={styles.td}>{formatDate(event.date)}</td>
                        <td style={styles.td}>
                          <div style={styles.actionIcons}>
                            <Tooltip title="Capture Attendance" arrow>
                              <button
                                style={styles.openEventIcon}
                                onClick={() => handleCaptureClick(event)}
                              >
                                <CheckBoxIcon />
                              </button>
                            </Tooltip>

                            <Tooltip title="Edit Event" arrow>
                              <IconButton
                                onClick={() => handleEditEvent(event)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>

                            {isAdmin && (
                              <Tooltip title="Delete Event" arrow>
                                <IconButton
                                  onClick={() => handleDeleteEvent(event)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.paginationContainer}>
            <div style={styles.rowsPerPage}>
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                style={styles.rowsSelect}
                disabled={isLoading}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={styles.paginationInfo}>
              {totalEvents > 0 ?
                `${startIndex}-${endIndex} of ${totalEvents}` :
                '0-0 of 0'
              }
            </div>
            <div style={styles.paginationControls}>
              <button
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === 1 || isLoading ? styles.paginationButtonDisabled : {}),
                }}
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
              >
                {isLoading ? '...' : '< Previous'}
              </button>

              <button
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === totalPages || totalPages === 0 || isLoading ? styles.paginationButtonDisabled : {}),
                }}
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0 || isLoading}
              >
                {isLoading ? '...' : 'Next >'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button - Visible to ALL users */}
      <div style={fabStyles.fabContainer}>
        {fabMenuOpen && (
          <div style={fabStyles.fabMenu}>
            {/* Only show "Create Event Type" for admins */}
            {isAdmin && (
              <div
                style={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                  handleCreateEventType();
                }}
              >
                <span style={fabStyles.fabMenuLabel}>Create Event Type</span>
                <div style={fabStyles.fabMenuIcon}>📋</div>
              </div>
            )}

            {/* Show "Create Event" for admins and registrants */}
            {(isAdmin || currentUser?.role?.toLowerCase() === "registrant") && (
              <div
                style={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                  handleCreateEvent();
                }}
              >
                <span style={fabStyles.fabMenuLabel}>Create Event</span>
                <div style={fabStyles.fabMenuIcon}>📅</div>
              </div>
            )}

            {/* Regular users can only create cells */}
            {currentUser?.role?.toLowerCase() === "user" && (
              <div
                style={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                  handleCreateEvent();
                }}
              >
                <span style={fabStyles.fabMenuLabel}>Create Cell</span>
                <div style={fabStyles.fabMenuIcon}>🏠</div>
              </div>
            )}
          </div>
        )}

        <button
          style={{
            ...fabStyles.mainFab,
            transform: fabMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
          onClick={() => setFabMenuOpen(!fabMenuOpen)}
          title="Menu"
        >
          +
        </button>
      </div>


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
          currentUser={currentUser}
          onAttendanceSubmitted={() => {
            fetchEvents();
            setAttendanceModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {isAdmin && (
        <EventTypesModal
          open={createEventTypeModalOpen}
          onClose={handleCloseCreateEventTypeModal}
          onSubmit={handleCreateEventTypeSubmit}
          setSelectedEventTypeObj={setSelectedEventTypeObj}
          customEventTypes={customEventTypes}
          userRole={currentUser?.role}
        />
      )}

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
                selectedEventTypeObj={selectedEventTypeObj}
                selectedEventType={currentSelectedEventType}
                eventTypes={allEventTypes}
              />
            </div>
          </div>
        </div>
      )}

      <EditEventModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={selectedEvent}
        onSave={handleSaveEvent}
      />

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

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes slideIn {
          from {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Events;