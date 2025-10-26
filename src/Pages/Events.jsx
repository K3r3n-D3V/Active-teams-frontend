import React, { useState, useEffect, useRef, useCallback } from "react";
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

// Material-UI imports for the event type menu
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Popover from "@mui/material/Popover";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import Eventsfilter from "./AddPersonToEvents";
import CreateEvents from "./CreateEvents";
import EventTypesModal from "./EventTypesModal";
import EditEventModal from "./EditEventModal";

const styles = {
  container: {
    height: "100vh",
    fontFamily: "system-ui, sans-serif",
    padding: "1rem",
    paddingTop: "5rem",
    boxSizing: "border-box",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  topSection: {
    padding: "1.5rem",
    borderRadius: "16px",
    marginBottom: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    flexShrink: 0,
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
    border: "2px solid",
    borderRadius: "12px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
  },
  filterButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(0, 123, 255, 0.3)",
  },
  statusBadgeContainer: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  statusBadge: {
    padding: '0.6rem 1.2rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    border: '2px solid',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  statusBadgeIncomplete: {
    backgroundColor: "#FFA500",
    color: "#fff",
    borderColor: "#FFA500",
  },
  statusBadgeComplete: {
    backgroundColor: "#fff",
    color: "#28a745",
    borderColor: "#28a745",
  },
  statusBadgeDidNotMeet: {
    backgroundColor: "#fff",
    color: "#dc3545",
    borderColor: "#dc3545",
  },
  statusBadgeActive: {
    transform: "scale(1.05)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  },
  tableContainer: {
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
  tableWrapper: {
    overflow: "auto",
    flex: 1,
    minHeight: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1300px",
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
    borderBottom: "1px solid",
    transition: "background-color 0.2s ease",
  },
  trHover: {},
  td: {
    padding: "1rem",
    fontSize: "0.9rem",
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
    borderRadius: '8px',
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
  truncatedText: {
    maxWidth: '150px',
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
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: "20px",
  },
  modalContent: {
    position: "relative",
    width: "90%",
    maxWidth: "700px",
    maxHeight: "95vh",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    backgroundColor: "#333",
    color: "white",
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    margin: 0,
  },
  modalCloseButton: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "20px",
    color: "white",
    fontWeight: "bold",
    transition: "all 0.2s ease",
  },
  modalBody: {
    flex: 1,
    overflow: "auto",
    padding: "0",
  },
  loadingSkeleton: {
    padding: "1rem",
    backgroundColor: "#d3d3d3",
    borderRadius: "8px",
    height: "60px",
    marginBottom: "0.5rem",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  overdueLabel: {
    color: "red",
    fontSize: "0.8rem",
    marginTop: "0.2rem",
    fontWeight: "bold",
  },
  mobileCard: {
    borderRadius: "16px",
    padding: "1.25rem",
    marginBottom: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "1px solid",
  },
  mobileCardRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
  },
  mobileCardLabel: {
    fontWeight: 600,
  },
  mobileCardValue: {
    textAlign: "right",
  },
  mobileActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
    justifyContent: "flex-end",
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
    borderRadius: '10px',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    cursor: 'not-allowed',
  },
  rowsSelect: {
    padding: '0.25rem 0.5rem',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    backgroundColor: '#fff',
    fontSize: '0.875rem',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '1rem',
    borderTop: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    gap: '1.5rem',
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
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
    backgroundColor: "#f8f9fa",
    borderRadius: "16px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e9ecef",
    position: "relative",
  },
  header: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "1rem",
  },
  selectedTypeDisplay: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#007bff",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  checkIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#28a745",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold",
  },
  typesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "0.75rem",
  },
  typeCard: {
    padding: "1rem",
    borderRadius: "12px",
    border: "2px solid transparent",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  typeCardActive: {
    borderColor: "#007bff",
    backgroundColor: "#e7f3ff",
    transform: "translateX(8px) scale(1.02)",
    boxShadow: "0 6px 16px rgba(0, 123, 255, 0.25)",
  },
  typeCardHover: {
    borderColor: "#ddd",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  typeName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#495057",
    textAlign: "center",
    display: "block",
  },
  typeNameActive: {
    color: "#007bff",
  },
  activeIndicator: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "#007bff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "12px",
    fontWeight: "bold",
    animation: "slideIn 0.3s ease-out",
  },
};

const Events = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const userRole = currentUser?.role?.toLowerCase() || "";

  const canUsePersonalFilter = userRole === "admin" || userRole === "leader at 12";
  const isAdmin = userRole === "admin";

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // State declarations
  const [showFilter, setShowFilter] = useState(false);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [loading, setLoading] = useState(true);
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
  const [selectedStatus, setSelectedStatus] = useState("incomplete");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [viewFilter, setViewFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserLeaderAt1, setCurrentUserLeaderAt1] = useState('');
  const [typeMenuAnchor, setTypeMenuAnchor] = useState(null);
  const [typeMenuFor, setTypeMenuFor] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [toDeleteType, setToDeleteType] = useState(null);

  // In your main Events component
  const [eventTypesModalOpen, setEventTypesModalOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);


  const cacheRef = useRef({
    data: new Map(),
    timestamp: new Map(),
    CACHE_DURATION: 5 * 60 * 1000
  });

  const getCacheKey = useCallback((params) => {
    return JSON.stringify({
      page: params.page,
      limit: params.limit,
      status: params.status,
      event_type: params.event_type,
      search: params.search,
      personal: params.personal
    });
  }, []);

  const getCachedData = useCallback((key) => {
    const cached = cacheRef.current.data.get(key);
    const timestamp = cacheRef.current.timestamp.get(key);

    if (cached && timestamp) {
      const age = Date.now() - timestamp;
      if (age < cacheRef.current.CACHE_DURATION) {
        return cached;
      }
    }
    return null;
  }, []);

  const setCachedData = useCallback((key, data) => {
    cacheRef.current.data.set(key, data);
    cacheRef.current.timestamp.set(key, Date.now());

    if (cacheRef.current.data.size > 50) {
      const firstKey = cacheRef.current.data.keys().next().value;
      cacheRef.current.data.delete(firstKey);
      cacheRef.current.timestamp.delete(firstKey);
    }
  }, []);

  const clearCache = useCallback(() => {
    cacheRef.current.data.clear();
    cacheRef.current.timestamp.clear();
  }, []);

  const fetchEvents = async (filters = {}, forceRefresh = false) => {
    setLoading(true);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setSnackbar({ open: true, message: "Please log in again", severity: "error" });
        setTimeout(() => window.location.href = '/login', 2000);
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
        setIsLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const shouldApplyPersonalFilter =
        viewFilter === 'personal' &&
        (userRole === "admin" || userRole === "leader at 12");

      const params = {
        page: filters.page !== undefined ? filters.page : currentPage,
        limit: filters.limit !== undefined ? filters.limit : rowsPerPage,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
        search: searchQuery.trim() || undefined,
        personal: shouldApplyPersonalFilter ? true : undefined,
        start_date: '2025-10-20',
        ...filters
      };

      // 🔥 FIX: Clean undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const cacheKey = getCacheKey(params);

      if (!forceRefresh) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setEvents(cachedData.events);
          setFilteredEvents(cachedData.events);
          setTotalEvents(cachedData.total_events);
          setTotalPages(cachedData.total_pages);
          if (filters.page !== undefined) setCurrentPage(filters.page);
          setLoading(false);
          setIsLoading(false);
          return;
        }
      }

      const endpoint = `${BACKEND_URL}/events`;

      console.log(`🚀 Fetching from: ${endpoint}`, params);

      const response = await axios.get(endpoint, {
        headers,
        params,
        timeout: 60000
      });

      const responseData = response.data;
      const newEvents = responseData.events || responseData.results || [];

      setCachedData(cacheKey, {
        events: newEvents,
        total_events: responseData.total_events || responseData.total || 0,
        total_pages: responseData.total_pages || Math.ceil((responseData.total_events || 0) / rowsPerPage) || 1
      });

      setEvents(newEvents);
      setFilteredEvents(newEvents);
      setTotalEvents(responseData.total_events || responseData.total || 0);
      setTotalPages(responseData.total_pages || Math.ceil((responseData.total_events || 0) / rowsPerPage) || 1);

      if (filters.page !== undefined) setCurrentPage(filters.page);

    } catch (err) {
      console.error("❌ Error:", err);

      if (err.code === 'ECONNABORTED') {
        setSnackbar({
          open: true,
          message: "Request timeout. Please refresh and try again.",
          severity: "warning",
        });
      } else if (err.response?.status === 401) {
        setSnackbar({ open: true, message: "Session expired. Logging out...", severity: "error" });
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setSnackbar({
          open: true,
          message: `Error loading events. Please try again.`,
          severity: "error",
        });
      }

      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userProfile = localStorage.getItem("userProfile");

      if (!token || !userProfile) {
        setSnackbar({
          open: true,
          message: "Please log in to continue",
          severity: "warning",
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchCurrentUserLeaderAt1 = async () => {
      const leaderAt1 = await getCurrentUserLeaderAt1();
      setCurrentUserLeaderAt1(leaderAt1);
    };

    fetchCurrentUserLeaderAt1();
  }, []);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  useEffect(() => {
    const savedEventTypes = localStorage.getItem("customEventTypes");
    if (savedEventTypes) {
      try {
        const parsed = JSON.parse(savedEventTypes);
        setCustomEventTypes(parsed);
        setUserCreatedEventTypes(parsed);
        setEventTypes(parsed.map((type) => type.name));
      } catch (error) {
        console.error("Error parsing saved event types:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (customEventTypes.length > 0) {
      localStorage.setItem(
        "customEventTypes",
        JSON.stringify(customEventTypes)
      );
    }
  }, [customEventTypes]);

  useEffect(() => {
    if (currentSelectedEventType) {
      localStorage.setItem("selectedEventType", currentSelectedEventType);
    } else {
      localStorage.removeItem("selectedEventType");
    }
  }, [currentSelectedEventType]);

  useEffect(() => {
    clearCache();
  }, [selectedEventTypeFilter, selectedStatus, viewFilter, searchQuery, clearCache]);

// ✅ CONSOLIDATED useEffect for all filters
useEffect(() => {
  const shouldApplyPersonalFilter =
    viewFilter === 'personal' &&
    (userRole === "admin" || userRole === "leader at 12");

  const fetchParams = {
    page: currentPage,
    limit: rowsPerPage,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
    search: searchQuery.trim() || undefined,
    personal: shouldApplyPersonalFilter ? true : undefined,
    start_date: '2025-10-20'
  };

  // Clean undefined values
  Object.keys(fetchParams).forEach(key => 
    fetchParams[key] === undefined && delete fetchParams[key]
  );

  console.log('🔄 Fetching with params:', fetchParams);

  fetchEvents(fetchParams, true); 
}, [
  selectedStatus, 
  selectedEventTypeFilter, 
  viewFilter, 
  currentPage, 
  rowsPerPage
]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() !== '') {
        handleSearchSubmit();
      } else if (searchQuery.trim() === '' && events.length > 0) {
        handleSearchSubmit();
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, events.length]);

  const isOverdue = (event) => {
    const did_not_meet = event.did_not_meet || false;
    const hasAttendees = event.attendees && event.attendees.length > 0;
    const status = (event.status || event.Status || '').toLowerCase().trim();

    if (hasAttendees || status === 'complete' || status === 'closed' || status === 'did_not_meet' || did_not_meet) {
      return false;
    }

    if (!event?.date) return false;

    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate < today;
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

  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = Number(e.target.value);

    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);

    const shouldApplyPersonalFilter =
      viewFilter === 'personal' &&
      (userRole === "admin" || userRole === "leader at 12");

    fetchEvents({
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: searchQuery.trim() || undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      page: 1,
      limit: newRowsPerPage,
      personal: shouldApplyPersonalFilter ? true : undefined,
      start_date: '2025-10-20'
    }, true);
  };

  // Add these functions with your other handler functions
  const openTypeMenu = (event, type) => {
    setTypeMenuAnchor(event.currentTarget);
    setTypeMenuFor(type);
  };

  const closeTypeMenu = () => {
    setTypeMenuAnchor(null);
    setTypeMenuFor(null);
  };

  const handleEditType = async (type) => {
    console.log("Edit type:", type);

    try {
      // If type is just a string (name), fetch the full event type data
      let eventTypeToEdit;

      if (typeof type === 'string') {
        // Find the full event type object from your eventTypes array
        const fullEventType = eventTypes.find(et =>
          et.name === type || et.name?.toLowerCase() === type.toLowerCase()
        );

        if (fullEventType) {
          eventTypeToEdit = fullEventType;
        } else {
          // If not found, create a basic object
          eventTypeToEdit = { name: type };
        }
      } else {
        eventTypeToEdit = type;
      }

      setEditingEventType(eventTypeToEdit);
      setEventTypesModalOpen(true);
      closeTypeMenu();

    } catch (error) {
      console.error("Error preparing event type for editing:", error);
      setSnackbar({
        open: true,
        message: "Error loading event type data",
        severity: "error",
      });
    }
  };

  const handleCloseEventTypesModal = () => {
    setEventTypesModalOpen(false);
    setEditingEventType(null);
  };

  const handleDeleteType = async () => {
    try {
      const token = localStorage.getItem("token");
      const typeName = typeof toDeleteType === 'string' ? toDeleteType : toDeleteType.name;

      const response = await axios.delete(`${BACKEND_URL}/event-types/${encodeURIComponent(typeName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Delete successful:', response.data);

      // Update local state
      const updatedEventTypes = customEventTypes.filter(
        type => type.name !== typeName
      );
      setCustomEventTypes(updatedEventTypes);
      setEventTypes(updatedEventTypes.map(type => type.name));

      const updatedUserEventTypes = userCreatedEventTypes.filter(
        type => type.name !== typeName
      );
      setUserCreatedEventTypes(updatedUserEventTypes);

      setConfirmDeleteOpen(false);
      setToDeleteType(null);

      setSnackbar({
        open: true,
        message: response.data.message || `Event type "${typeName}" deleted successfully`,
        severity: "success",
      });

      // Reset selection if needed
      if (selectedEventTypeFilter === typeName) {
        setSelectedEventTypeFilter('all');
        setSelectedEventTypeObj(null);
        localStorage.removeItem("selectedEventTypeObj");
      }

      // Refresh events
      fetchEvents({}, true);

    } catch (error) {
      console.error("Error deleting event type:", error);
      setConfirmDeleteOpen(false);

      setSnackbar({
        open: true,
        message: error.response?.data?.detail || error.message || "Failed to delete event type",
        severity: "error",
      });
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearchSubmit = () => {
    const trimmedSearch = searchQuery.trim();
    console.log('🔍 Search submitted:', trimmedSearch);

    const shouldApplyPersonalFilter =
      viewFilter === 'personal' &&
      (userRole === "admin" || userRole === "leader at 12");

    setCurrentPage(1);

    fetchEvents({
      page: 1,
      limit: rowsPerPage,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      search: trimmedSearch || undefined,
      personal: shouldApplyPersonalFilter ? true : undefined,
      start_date: '2025-10-20'
    }, true);
  };

 const handleStatusClick = (status) => {
    setSelectedStatus(status);

    const shouldApplyPersonalFilter =
      viewFilter === 'personal' &&
      (userRole === "admin" || userRole === "leader at 12");

    setCurrentPage(1);

    // 🔥 FIX: Include event_type in status filter
    fetchEvents({
      status: status !== 'all' ? status : undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      search: searchQuery || undefined,
      page: 1,
      personal: shouldApplyPersonalFilter ? true : undefined,
      start_date: '2025-10-20'
    });
  };

 const handleEventTypeClick = (typeValue) => {
  console.log('🎯 Event Type Click:', {
    typeValue,
    currentFilter: selectedEventTypeFilter,
    eventTypes: eventTypes
  });

  if (selectedEventTypeFilter === typeValue) {
    console.log('⏸️ Already selected, skipping');
    return;
  }

  setSelectedEventTypeFilter(typeValue);
  setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !isLoading) {
      const newPage = currentPage - 1;
      console.log('⬅️ Going to previous page:', newPage);

      const shouldApplyPersonalFilter =
        viewFilter === 'personal' &&
        (userRole === "admin" || userRole === "leader at 12");

      fetchEvents({
        page: newPage,
        limit: rowsPerPage,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
        search: searchQuery.trim() || undefined,
        personal: shouldApplyPersonalFilter ? true : undefined,
        start_date: '2025-10-20'
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !isLoading) {
      const newPage = currentPage + 1;
      console.log('➡️ Going to next page:', newPage);

      const shouldApplyPersonalFilter =
        viewFilter === 'personal' &&
        (userRole === "admin" || userRole === "leader at 12");

      fetchEvents({
        page: newPage,
        limit: rowsPerPage,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
        search: searchQuery.trim() || undefined,
        personal: shouldApplyPersonalFilter ? true : undefined,
        start_date: '2025-10-20'
      });
    }
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

  const applyFilters = (filters) => {
    console.log("🔍 APPLYING FILTERS:", filters);

    setActiveFilters(filters);
    setCurrentPage(1);

    let searchQuery = '';
    if (filters.leader) {
      searchQuery = filters.leader;
    }

    fetchEvents({
      page: 1,
      limit: rowsPerPage,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      search: searchQuery || undefined,
      day: filters.day !== 'all' ? filters.day : undefined,
      start_date: '2025-10-20'
    }, true);
  };

  const handleAttendanceSubmit = async (data) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const eventId = selectedEvent._id;
      const eventName = selectedEvent.eventName || 'Event';

      const leaderEmail = currentUser?.email || '';
      const leaderName = `${(currentUser?.name || '').trim()} ${(currentUser?.surname || '').trim()}`.trim() || currentUser?.name || '';

      let payload;

      if (data === "did_not_meet") {
        payload = {
          attendees: [],
          leaderEmail,
          leaderName,
          did_not_meet: true,
        };
      } else if (Array.isArray(data)) {
        payload = {
          attendees: data,
          leaderEmail,
          leaderName,
          did_not_meet: false,
        };
      } else {
        payload = data;
      }

      const response = await axios.put(
        `${BACKEND_URL.replace(/\/$/, "")}/submit-attendance/${eventId}`,
        payload,
        { headers }
      );

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
          fetchEvents();
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
  const handleSaveEventType = async (eventTypeData, eventTypeId = null) => {
  try {
    const token = localStorage.getItem("token");
    let response;

    if (eventTypeId) {
      const originalName = editingEventType?.name;
      if (!originalName) {
        throw new Error("Cannot update: original event type name not found");
      }

      // Use axios for consistency with your other API calls
      response = await axios.put(
        `${BACKEND_URL}/event-types/${encodeURIComponent(originalName)}`,
        eventTypeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      response = await axios.post(
        `${BACKEND_URL}/event-types`,
        eventTypeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    const result = response.data;
    console.log(`✅ Event type ${eventTypeId ? 'updated' : 'created'}:`, result);

    await fetchEventTypes();
    
    setEventTypesModalOpen(false);
    setEditingEventType(null);

    setSnackbar({
      open: true,
      message: `Event type ${eventTypeId ? 'updated' : 'created'} successfully!`,
      severity: "success",
    });

    return result;
  } catch (error) {
    console.error(`❌ Error ${eventTypeId ? 'updating' : 'creating'} event type:`, error);
    setSnackbar({
      open: true,
      message: error.response?.data?.detail || error.message || `Failed to ${eventTypeId ? 'update' : 'create'} event type`,
      severity: "error",
    });
    throw error;
  }
};
const fetchEventTypes = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BACKEND_URL}/event-types`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch event types');

    const eventTypesData = await response.json();
    
    // ✅ FIX: Filter to only actual event type objects (not events)
    const actualEventTypes = eventTypesData.filter(item => 
      item.isEventType === true || item.hasOwnProperty('isEventType')
    );
    
    console.log('✅ Fetched event types:', actualEventTypes);
    
    setEventTypes(actualEventTypes);
    setCustomEventTypes(actualEventTypes);
    setUserCreatedEventTypes(actualEventTypes);

    return actualEventTypes;
  } catch (error) {
    console.error('Error fetching event types:', error);
    return [];
  }
};

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
        setAlert({
          open: true,
          type: "success",
          message: "Event updated successfully!",
        });

        fetchEvents();

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
    }
  };

  const getCurrentUserLeaderAt1 = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/current-user/leader-at-1`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return response.data.leader_at_1 || '';
    } catch (error) {
      console.error('Error getting current user leader at 1:', error);
      return '';
    }
  };

  const handleFixLeaders = async () => {
    if (!window.confirm("This will fix missing Leader at 1 assignments for all events. Continue?")) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${BACKEND_URL}/admin/events/fix-missing-leader-at-1`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnackbar({
        open: true,
        message: response.data.message,
        severity: "success",
      });

      console.log("✅ Fix leaders result:", response.data);

      fetchEvents({}, true);
    } catch (error) {
      console.error("Error fixing leaders:", error);
      setSnackbar({
        open: true,
        message: "Failed to fix leaders. Please try again.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

 
  const isDarkMode = theme.palette.mode === 'dark';

  const themedStyles = {
    container: {
      ...styles.container,
      backgroundColor: isDarkMode ? theme.palette.background.default : '#f5f7fa',
    },
    topSection: {
      ...styles.topSection,
      backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
      color: isDarkMode ? theme.palette.text.primary : '#212529',
    },
    searchInput: {
      ...styles.searchInput,
      backgroundColor: isDarkMode ? theme.palette.background.default : '#fff',
      borderColor: isDarkMode ? theme.palette.divider : '#e9ecef',
      color: isDarkMode ? theme.palette.text.primary : '#212529',
    },
    tableContainer: {
      ...styles.tableContainer,
      backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
    },
    tr: {
      ...styles.tr,
      borderColor: isDarkMode ? theme.palette.divider : '#e9ecef',
    },
    trHover: {
      ...styles.trHover,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8f9fa',
    },
    td: {
      ...styles.td,
      color: isDarkMode ? theme.palette.text.primary : '#212529',
    },
    mobileCard: {
      ...styles.mobileCard,
      backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
      borderColor: isDarkMode ? theme.palette.divider : '#f0f0f0',
    },
    mobileCardLabel: {
      ...styles.mobileCardLabel,
      color: isDarkMode ? theme.palette.text.secondary : '#666',
    },
    mobileCardValue: {
      ...styles.mobileCardValue,
      color: isDarkMode ? theme.palette.text.primary : '#212529',
    },
  };

  const EventTypeSelector = () => {
  const [hoveredType, setHoveredType] = useState(null);
  
  // ✅ Add "All Events" option
  const allTypes = ["All Events", ...eventTypes];

  const getDisplayName = (type) => {
    if (type === "All Events") return type;
    if (typeof type === "string") return type;
    return type.name || type;
  };

  const getTypeValue = (type) => {
    if (type === "All Events") return "all";
    if (typeof type === "string") {
      // ✅ Keep original casing for exact match
      return type;
    }
    return type.name || type;
  };
  
    const selectedDisplayName =
      selectedEventTypeFilter === "all"
        ? "All Events"
        : eventTypes.find((t) => {
          const tValue = typeof t === "string" ? t : t.name;
          return tValue?.toLowerCase() === selectedEventTypeFilter;
        }) || selectedEventTypeFilter;

    const finalDisplayName =
      typeof selectedDisplayName === "string"
        ? selectedDisplayName
        : selectedDisplayName?.name || "All Events";

    return (
      <div style={eventTypeStyles.container}>
        <div style={eventTypeStyles.header}>Filter by Event Type</div>

        <div style={eventTypeStyles.selectedTypeDisplay}>
          <div style={eventTypeStyles.checkIcon}>✓</div>
          <span>{finalDisplayName}</span>
        </div>

        {isAdmin && (
          <div
            style={{
              ...eventTypeStyles.typesGrid,
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "flex-start",
            }}
          >
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
                    ...(isHovered && !isActive
                      ? eventTypeStyles.typeCardHover
                      : {}),
                    position: "relative",
                    width: 200,
                    minHeight: 70,
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => {
                    console.log("🟢 Event Type Clicked:", {
                      displayName,
                      typeValue,
                      currentFilter: selectedEventTypeFilter,
                    });

                    const selectedTypeObj =
                      typeValue === "all"
                        ? null
                        : customEventTypes.find(
                          (t) => t.name.toLowerCase() === typeValue
                        ) || null;

                    setSelectedEventTypeFilter(typeValue);
                    setSelectedEventTypeObj(selectedTypeObj);

                    if (selectedTypeObj) {
                      localStorage.setItem(
                        "selectedEventTypeObj",
                        JSON.stringify(selectedTypeObj)
                      );
                    } else {
                      localStorage.removeItem("selectedEventTypeObj");
                    }

                    const shouldApplyPersonalFilter =
                      viewFilter === "personal" &&
                      (currentUser?.role?.toLowerCase() === "admin" ||
                        currentUser?.role?.toLowerCase() === "leader at 12");

                    setCurrentPage(1);

                    // 🔥 FIX: Send correct event type to backend
                    fetchEvents(
                      {
                        page: 1,
                        limit: rowsPerPage,
                        status:
                          selectedStatus !== "all" ? selectedStatus : undefined,
                        event_type: typeValue !== "all" ? typeValue : undefined,
                        search: searchQuery.trim() || undefined,
                        personal: shouldApplyPersonalFilter ? true : undefined,
                      },
                      true
                    );
                  }}
                  onMouseEnter={() => setHoveredType(typeValue)}
                  onMouseLeave={() => setHoveredType(null)}
                >
                  <span
                    style={{
                      ...eventTypeStyles.typeName,
                      ...(isActive ? eventTypeStyles.typeNameActive : {}),
                      zIndex: 1,
                    }}
                  >
                    {displayName}
                  </span>

                  {isAdmin && type !== "All Events" && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTypeMenu(e, type);
                      }}
                      aria-label="type actions"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        color: "grey",
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* POPOVER - Menu for edit/delete */}
        <Popover
          open={Boolean(typeMenuAnchor)}
          anchorEl={typeMenuAnchor}
          onClose={closeTypeMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{
            "& .MuiPopover-paper": {
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              minWidth: "120px",
            }
          }}
        >
          <MenuItem
            onClick={() => {
              handleEditType(typeMenuFor);
              closeTypeMenu();
            }}
            sx={{ py: 1 }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>

          <MenuItem
            onClick={() => {
              setToDeleteType(typeMenuFor);
              setConfirmDeleteOpen(true);
              closeTypeMenu();
            }}
            sx={{
              color: "error.main",
              py: 1
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Popover>

        {/* DIALOG - Delete confirmation */}
        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Event Type</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this event type? This cannot
              be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button color="error" onClick={handleDeleteType}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  };
  const StatusBadges = () => {
    const [statusCounts, setStatusCounts] = useState({
      incomplete: 0,
      complete: 0,
      did_not_meet: 0
    });

    useEffect(() => {
      const fetchStatusCounts = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          };

          const shouldApplyPersonalFilter =
            viewFilter === 'personal' &&
            (userRole === "admin" || userRole === "leader at 12");

          const startDate = '2025-10-20';

          const params = {
            event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
            search: searchQuery.trim() || undefined,
            personal: shouldApplyPersonalFilter ? true : undefined,
            start_date: startDate
          };

          Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

          const endpoint = `${BACKEND_URL}/events/status-counts`;
          console.log('📊 Fetching status counts:', endpoint, params);

          const response = await axios.get(endpoint, { headers, params });
          setStatusCounts(response.data);

        } catch (error) {
          console.error("❌ Error fetching status counts:", error);
        }
      };

      fetchStatusCounts();
    }, [selectedEventTypeFilter, searchQuery, viewFilter, userRole]);

  useEffect(() => {
  console.log("🔍 Debug - Event Types State:", {
    eventTypes,
    editingEventType,
    eventTypesModalOpen,
    typeMenuFor
  });
}, [eventTypes, editingEventType, eventTypesModalOpen, typeMenuFor]);



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

  const ViewFilterButtons = () => {
    if (!canUsePersonalFilter) {
      return null;
    }

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
              const newViewFilter = e.target.value;
              setViewFilter(newViewFilter);
              setCurrentPage(1);
              fetchEvents({
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
                search: searchQuery || undefined,
                page: 1,
                personal: false,
                start_date: '2025-10-20'
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
              const newViewFilter = e.target.value;
              setViewFilter(newViewFilter);
              setCurrentPage(1);
              fetchEvents({
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
                search: searchQuery || undefined,
                page: 1,
                personal: true,
                start_date: '2025-10-20'
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

  const MobileEventCard = ({ event }) => {
    const dayOfWeek = event.day || 'Not set';
    const shouldShowLeaders = event.leader12 && event.leader12.trim() !== '';
    console.log('📱 Mobile Event Leader Data:', {
      event: event.eventName,
      leader12: event.leader12,
      leader1: event.leader1,
      showLeaders: shouldShowLeaders
    });
    return (
      <div style={themedStyles.mobileCard}>
        <div style={styles.mobileCardRow}>
          <span style={themedStyles.mobileCardLabel}>Event Name:</span>
          <span style={themedStyles.mobileCardValue}>{event.eventName}</span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={themedStyles.mobileCardLabel}>Leader:</span>
          <span style={themedStyles.mobileCardValue}>
            {event.eventLeaderName || "-"}
          </span>
        </div>

        {shouldShowLeaders && (
          <>
            <div style={styles.mobileCardRow}>
              <span style={themedStyles.mobileCardLabel}>Leader at 1:</span>
              <span style={themedStyles.mobileCardValue}>
                {event.leader1 || '-'}
              </span>
            </div>
            <div style={styles.mobileCardRow}>
              <span style={themedStyles.mobileCardLabel}>Leader at 12:</span>
              <span style={themedStyles.mobileCardValue}>
                {event.leader12 || '-'}
              </span>
            </div>
          </>
        )}

        <div style={styles.mobileCardRow}>
          <span style={themedStyles.mobileCardLabel}>Day:</span>
          <span style={themedStyles.mobileCardValue}>
            <div>{dayOfWeek}</div>
            {isOverdue(event) && <div style={styles.overdueLabel}>Overdue</div>}
          </span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={themedStyles.mobileCardLabel}>Email:</span>
          <span style={themedStyles.mobileCardValue}>
            {event.eventLeaderEmail || "-"}
          </span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={themedStyles.mobileCardLabel}>Date:</span>
          <span style={themedStyles.mobileCardValue}>{formatDate(event.date)}</span>
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
              sx={{ color: "#007bff", border: "1px solid #007bff" }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          {isAdmin && (
            <Tooltip title="Delete Event" arrow>
              <IconButton
                onClick={() => handleDeleteEvent(event)}
                size="small"
                sx={{ color: "#dc3545", border: "1px solid #dc3545" }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  // ✅ ONLY ONE DECLARATION HERE - RIGHT BEFORE return
  const startIndex = totalEvents > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0;
  const endIndex = Math.min(currentPage * rowsPerPage, totalEvents);
  const paginatedEvents = events;
  const allEventTypes = [...(eventTypes || []), ...(userCreatedEventTypes || [])];

  return (
    <div style={themedStyles.container}>
      <div style={themedStyles.topSection}>
        <EventTypeSelector />

        <div style={styles.searchFilterRow}>
          <input
            type="text"
            placeholder="Search by Event Name, Leader, or Email..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            style={themedStyles.searchInput}
          />
          <button
            style={styles.filterButton}
            onClick={handleSearchSubmit}
            disabled={isLoading}
          >
            {isLoading ? '⏳' : 'SEARCH'}
          </button>

          <button
            style={{ ...styles.filterButton, backgroundColor: '#dc3545' }}
            onClick={() => {
              console.log('🧹 Clearing search');
              setSearchQuery('');
              setCurrentPage(1);
              fetchEvents({
                page: 1,
                limit: rowsPerPage,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
                search: undefined,
                start_date: '2025-10-20'
              }, true);
            }}
            disabled={isLoading}
          >
            {isLoading ? '⏳' : 'CLEAR'}
          </button>
        </div>

        <div style={styles.viewFilterRow}>
          <StatusBadges />
          <ViewFilterButtons />
        </div>
      </div>

      {isMobile ? (
        <Box>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} style={styles.loadingSkeleton} />
            ))
          ) : filteredEvents.length === 0 ? (
            <div
              style={{
                ...themedStyles.mobileCard,
                textAlign: "center",
                padding: "2rem",
              }}
            >
              No events found matching your criteria.
            </div>
          ) : (
            <>
              {paginatedEvents.map((event) => (
                <MobileEventCard key={event._id} event={event} />
              ))}

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
                    {isLoading ? '⏳' : '< Previous'}
                  </button>

                  <span style={{ padding: '0 1rem', color: '#6c757d' }}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage >= totalPages || isLoading ? styles.paginationButtonDisabled : {}),
                    }}
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages || isLoading || totalPages === 0}
                  >
                    {isLoading ? '⏳' : 'Next >'}
                  </button>
                </div>
              </div>
            </>
          )}
        </Box>
      ) : (
        <div style={themedStyles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.th}>Event Name</th>
                  <th style={styles.th}>Leader</th>
                  <th style={styles.th}>Leader at 1</th>
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
                      <td colSpan={8} style={themedStyles.td}>
                        <div style={styles.loadingSkeleton} />
                      </td>
                    </tr>
                  ))
                ) : paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ ...themedStyles.td, textAlign: 'center', padding: '2rem' }}>
                      No events found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((event) => {
                    const dayOfWeek = event.day || 'Not set';
                    const shouldShowLeaderAt1 = event.leader1 && event.leader1.trim() !== '';
                    const shouldShowLeaderAt12 = event.leader12 && event.leader12.trim() !== '';

                    return (
                      <tr
                        key={event._id}
                        style={{
                          ...themedStyles.tr,
                          ...(hoveredRow === event._id ? themedStyles.trHover : {}),
                        }}
                        onMouseEnter={() => setHoveredRow(event._id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td style={themedStyles.td}>
                          <div style={styles.truncatedText} title={event.eventName}>
                            {event.eventName}
                          </div>
                        </td>
                        <td style={themedStyles.td}>
                          <div style={styles.truncatedText} title={event.eventLeaderName}>
                            {event.eventLeaderName || '-'}
                          </div>
                        </td>
                        <td style={themedStyles.td}>
                          <div style={styles.truncatedText}>
                            {shouldShowLeaderAt1 ? (event.leader1 || '-') : '-'}
                          </div>
                        </td>
                        <td style={themedStyles.td}>
                          <div style={styles.truncatedText}>
                            {shouldShowLeaderAt12 ? (event.leader12 || '-') : '-'}
                          </div>
                        </td>
                        <td style={themedStyles.td}>
                          <div>{dayOfWeek}</div>
                          {isOverdue(event) && (
                            <div style={styles.overdueLabel}>
                              Overdue
                            </div>
                          )}
                        </td>
                        <td style={themedStyles.td}>
                          <div style={styles.emailText} title={event.eventLeaderEmail}>
                            {event.eventLeaderEmail || '-'}
                          </div>
                        </td>
                        <td style={themedStyles.td}>{formatDate(event.date)}</td>
                        <td style={themedStyles.td}>
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
                {isLoading ? '⏳' : '< Previous'}
              </button>

              <span style={{ padding: '0 1rem', color: '#6c757d' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                style={{
                  ...styles.paginationButton,
                  ...(currentPage >= totalPages || isLoading ? styles.paginationButtonDisabled : {}),
                }}
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || isLoading || totalPages === 0}
              >
                {isLoading ? '⏳' : 'Next >'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <div style={fabStyles.fabContainer}>
        {fabMenuOpen && (
          <div style={fabStyles.fabMenu}>
            {isAdmin && (
              <div
                style={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                  setEditingEventType(null);
                  setEventTypesModalOpen(true);
                }}

              >
                <span style={fabStyles.fabMenuLabel}>Create Event Type</span>
                <div style={fabStyles.fabMenuIcon}>📋</div>
              </div>
            )}

            {(isAdmin || userRole === "registrant") && (
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

            {userRole === "user" && (
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

      {/* Modals */}
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
          open={eventTypesModalOpen}
          onClose={handleCloseEventTypesModal}
          onSubmit={handleSaveEventType}
          selectedEventType={editingEventType}
          setSelectedEventTypeObj={setEditingEventType}
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
                {selectedEventTypeObj?.name === "CELLS"
                  ? "Create New Cell"
                  : "Create New Event"}
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
                selectedEventType={selectedEventTypeFilter}
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
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
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
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Events;