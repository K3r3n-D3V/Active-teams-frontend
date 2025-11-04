import axios from "axios";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import { Box, useMediaQuery, LinearProgress, TextField, InputAdornment, Paper } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
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
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    padding: "1rem",
    paddingTop: "1rem",
    paddingBottom: "1rem",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: '100vh',
    position: "relative",
    width: "100%",
    maxWidth: "100vw",
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
  statusBadgeContainer: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  eventsContent: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '0 1rem',
    paddingBottom: '70px',
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
  th: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: 600,
    fontSize: "0.95rem",
    borderBottom: "2px solid #000",
    whiteSpace: "nowrap",
  },
  actionIcons: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: "100%",
    boxSizing: "border-box",
    display: "block",
  },
  mobileCardRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
    gap: "0.5rem",
  },
  mobileCardLabel: {
    fontWeight: 600,
    minWidth: "100px",
  },
  mobileCardValue: {
    textAlign: "right",
    flex: 1,
    wordBreak: "break-word",
  },
  mobileActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
    justifyContent: "flex-end",
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
    flexWrap: 'wrap',
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
};

const getEventTypeStyles = (isDarkMode, theme) => ({
  container: {
    backgroundColor: isDarkMode ? theme.palette.background.paper : "#f8f9fa",
    borderRadius: "16px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: `1px solid ${isDarkMode ? theme.palette.divider : "#e9ecef"}`,
    position: "relative",
    color: isDarkMode ? theme.palette.text.primary : "inherit",
  },
  header: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: isDarkMode ? theme.palette.text.secondary : "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "1rem",
  },
  selectedTypeDisplay: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: isDarkMode ? theme.palette.primary.main : "#007bff",
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
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  typeCard: {
    padding: "1rem",
    borderRadius: "12px",
    border: `2px solid ${isDarkMode ? theme.palette.divider : "transparent"}`,
    backgroundColor: isDarkMode ? theme.palette.background.default : "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
    boxShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.2)" : "0 2px 4px rgba(0,0,0,0.05)",
    color: isDarkMode ? theme.palette.text.primary : "inherit",
  },
  typeCardActive: {
    borderColor: "#007bff",
    backgroundColor: isDarkMode ? "rgba(0, 123, 255, 0.1)" : "#e7f3ff",
    transform: "translateX(8px) scale(1.02)",
    boxShadow: "0 6px 16px rgba(0, 123, 255, 0.25)",
  },
  typeCardHover: {
    borderColor: isDarkMode ? theme.palette.primary.main : "#ddd",
    transform: "translateY(-2px)",
    boxShadow: isDarkMode ? "0 4px 8px rgba(0,0,0,0.3)" : "0 4px 8px rgba(0,0,0,0.1)",
  },
  typeName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: isDarkMode ? theme.palette.text.primary : "#495057",
    textAlign: "center",
    display: "block",
  },
  typeNameActive: {
    color: "#007bff",
  },
});

const getDefaultViewFilter = (userRole) => {
  const role = userRole?.toLowerCase() || '';
  if (role === "user" || role === "leader at 1" || role === "registrant") {
    return 'personal';
  }
  if (role === "admin" || role === "leader at 12") {
    return 'all';
  }
  return 'all';
};

const MobileEventCard = ({ event, onOpenAttendance, onEdit, onDelete, isOverdue, formatDate, theme, styles }) => {
  if (!theme) {
    return <Box sx={{ height: 100 }} />;
  }
  const isDark = theme.palette.mode === 'dark';
  const borderColor = isOverdue ? theme.palette.error.main : (isDark ? theme.palette.divider : '#e9ecef');

  return (
    <div
      style={{
        ...styles.mobileCard,
        borderColor: borderColor,
        backgroundColor: isDark ? theme.palette.background.default : '#fff'
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '0.75rem', color: isDark ? '#fff' : '#333' }}>
        {event.eventName || 'N/A'}
      </Typography>

      {isOverdue && (
        <Typography variant="caption" sx={{ color: theme.palette.error.main, fontWeight: 'bold' }}>
          OVERDUE!
        </Typography>
      )}

      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Date:</span>
        <span style={styles.mobileCardValue}>{formatDate(event.date)}</span>
      </div>

      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Leader:</span>
        <span style={styles.mobileCardValue}>{event.eventLeaderName || 'N/A'}</span>
      </div>

      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Type:</span>
        <span style={styles.mobileCardValue}>{event.eventType || 'N/A'}</span>
      </div>

      <div style={styles.mobileCardRow}>
 <span style={styles.mobileCardLabel}>Leader @1:</span>
 <span style={styles.mobileCardValue}>{event.leader1 || 'N/A'}</span>
 </div>

      <div style={styles.mobileActions}>
        <Tooltip title="View Attendance">
          <IconButton onClick={() => onOpenAttendance(event)} size="small" sx={{ color: theme.palette.primary.main }}>
            <CheckBoxIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Event">
          <IconButton onClick={() => onEdit(event)} size="small" sx={{ color: '#ffc107' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete Event">
          <IconButton onClick={() => onDelete(event)} size="small" sx={{ color: theme.palette.error.main }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
};

const Events = () => {
  const location = useLocation();
  const theme = useTheme();

  if (!theme) {
    return <LinearProgress />;
  }

  const isMobileView = useMediaQuery(theme.breakpoints.down('lg'));
  const isDarkMode = theme.palette.mode === 'dark';
  const eventTypeStyles = useMemo(() => {
    return getEventTypeStyles(isDarkMode, theme);
  }, [isDarkMode, theme]);

  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const userRole = currentUser?.role?.toLowerCase() || "";
  const isLeaderAt12 = userRole === "leader at 12";
  const isAdmin = userRole === "admin";

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const DEFAULT_API_START_DATE = '2025-10-27'
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
  const [currentSelectedEventType] = useState(() => {
    return localStorage.getItem("selectedEventType") || '';
  });
  const [selectedStatus, setSelectedStatus] = useState("incomplete");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserLeaderAt1, setCurrentUserLeaderAt1] = useState('');
  const [typeMenuAnchor, setTypeMenuAnchor] = useState(null);
  const [typeMenuFor, setTypeMenuFor] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [toDeleteType, setToDeleteType] = useState(null);
  const [eventTypesModalOpen, setEventTypesModalOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [viewFilter, setViewFilter] = useState(() => getDefaultViewFilter(userRole));
  const [filterOptions, setFilterOptions] = useState({
    leader: '',
    day: 'all',
    eventType: 'all'
  });

  const cacheRef = useRef({
    data: new Map(),
    timestamp: new Map(),
    CACHE_DURATION: 5 * 60 * 1000
  });
  const searchTimeoutRef = useRef(null);

  // Helper Functions
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

  // Calculate pagination values
  const paginatedEvents = useMemo(() => events, [events]);
  const startIndex = useMemo(() => {
    return totalEvents > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  }, [currentPage, rowsPerPage, totalEvents]);
  const endIndex = useMemo(() => {
    return Math.min(currentPage * rowsPerPage, totalEvents);
  }, [currentPage, rowsPerPage, totalEvents]);

  // All event types including "all"
  const allEventTypes = useMemo(() => {
    return ['all', ...eventTypes.map(t => typeof t === 'string' ? t : t.name)];
  }, [eventTypes]);

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
    tr: {
      borderBottom: "1px solid",
      borderColor: isDarkMode ? theme.palette.divider : '#e9ecef',
      transition: "background-color 0.2s ease",
    },
    trHover: {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8f9fa',
    },
    td: {
      padding: "1rem",
      fontSize: "0.9rem",
      verticalAlign: "top",
      color: isDarkMode ? theme.palette.text.primary : '#212529',
    },
  };

 const fetchEvents = useCallback(async (filters = {}, forceRefresh = false) => {
  setLoading(true);
  setIsLoading(true);
  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const userRole = userProfile?.role || "";

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

    const startDateParam = filters.start_date || DEFAULT_API_START_DATE;
    const params = {
      page: filters.page !== undefined ? filters.page : currentPage,
      limit: filters.limit !== undefined ? filters.limit : rowsPerPage,
      status: filters.status !== undefined ? filters.status : (selectedStatus !== 'all' ? selectedStatus : undefined),
      event_type: filters.event_type !== undefined ? filters.event_type : (selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined),
      search: filters.search !== undefined ? filters.search : (searchQuery.trim() || undefined),
      personal: filters.personal !== undefined ? filters.personal : (viewFilter === 'personal' && ["admin","leader at 12","leader at 144"].includes(userRole) ? true : undefined),
      start_date: startDateParam,
      ...filters
    };

    // Remove undefined/null params
    Object.keys(params).forEach(key => (params[key] === undefined || params[key] === null) && delete params[key]);

    // Determine endpoint: normal users vs leaders
    const endpoint = ["leader at 12","leader at 144"].includes(userRole.toLowerCase())
      ? `${BACKEND_URL}/leaders/cells-for/${userProfile.email}`
      : `${BACKEND_URL}/events`;

    // Caching
    const cacheKey = getCacheKey({ ...params, leader: ["leader at 12","leader at 144"].includes(userRole.toLowerCase()) });
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

    // Fetch data
    const response = await axios.get(endpoint, { headers, params, timeout: 60000 });
    const responseData = response.data;

    // Map data: leaders endpoint returns 'cells', normal events endpoint may use 'events' or 'results'
    const newEvents = responseData.cells || responseData.events || responseData.results || [];
    const totalEventsCount = responseData.total_events || responseData.total || newEvents.length;
    const totalPagesCount = responseData.total_pages || Math.ceil(totalEventsCount / rowsPerPage) || 1;

    // Cache it
    setCachedData(cacheKey, {
      events: newEvents,
      total_events: totalEventsCount,
      total_pages: totalPagesCount
    });

    // Update state
    setEvents(newEvents);
    setFilteredEvents(newEvents);
    setTotalEvents(totalEventsCount);
    setTotalPages(totalPagesCount);
    if (filters.page !== undefined) setCurrentPage(filters.page);

  } catch (err) {
    console.error("Error fetching events:", err);
    if (axios.isCancel(err) || err.code === 'ECONNABORTED') {
      setSnackbar({ open: true, severity: "warning", message: "Request timeout. Please refresh and try again." });
    } else if (err.response?.status === 401) {
      setSnackbar({ open: true, message: "Session expired. Logging out...", severity: "error" });
      localStorage.removeItem("token");
      localStorage.removeItem("userProfile");
      setTimeout(() => window.location.href = '/login', 2000);
    } else {
      setSnackbar({ open: true, message: `Error loading events: ${err.message || 'Please check your connection and try again.'}`, severity: "error" });
    }
    setEvents([]);
    setFilteredEvents([]);
    setTotalEvents(0);
    setTotalPages(1);
  } finally {
    setLoading(false);
    setIsLoading(false);
  }
}, [
  currentPage,
  rowsPerPage,
  selectedStatus,
  selectedEventTypeFilter,
  searchQuery,
  viewFilter,
  userRole, // Use userRole instead of userProfile
  getCacheKey,
  getCachedData,
  setCachedData,
  BACKEND_URL,
  setEvents,
  setFilteredEvents,
  setTotalEvents,
  setTotalPages,
  setCurrentPage,
  setSnackbar
]);

  const fetchEventTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/event-types`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch event types`);
      }

      const eventTypesData = await response.json();
      const actualEventTypes = eventTypesData.filter(item => item.isEventType === true);

      setEventTypes(actualEventTypes);
      setCustomEventTypes(actualEventTypes);
      setUserCreatedEventTypes(actualEventTypes);
      localStorage.setItem('eventTypes', JSON.stringify(actualEventTypes));

      return actualEventTypes;

    } catch (error) {
      console.error('Error fetching event types:', error);

      try {
        const cachedTypes = localStorage.getItem('eventTypes');
        if (cachedTypes) {
          const parsed = JSON.parse(cachedTypes);
          setEventTypes(parsed);
          setCustomEventTypes(parsed);
          setUserCreatedEventTypes(parsed);
          return parsed;
        }
      } catch (cacheError) {
        console.error('Cache read failed:', cacheError);
      }

      return [];
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

  // Utility Functions
  const isOverdue = (event) => {
    const did_not_meet = event.did_not_meet || false;
    const hasAttendees = event.attendees && event.attendees.length > 0;
    const status = (event.status || event.Status || '').toLowerCase().trim();
    const isMissedRecurrent = event.is_recurring && event.recurrent_status === 'missed';

    if (hasAttendees || status === 'complete' || status === 'closed' || status === 'did_not_meet' || did_not_meet || isMissedRecurrent) {
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

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterOptions({
      leader: '',
      day: 'all',
      eventType: 'all'
    });
    setActiveFilters({});
    setSelectedEventTypeFilter('all');
    setSelectedStatus('incomplete');
    setCurrentPage(1);

    const shouldApplyPersonalFilter =
      viewFilter === 'personal' &&
      (userRole === "admin" || userRole === "leader at 12");

    fetchEvents({
      page: 1,
      limit: rowsPerPage,
      personal: shouldApplyPersonalFilter,
      start_date: DEFAULT_API_START_DATE
    }, true);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const trimmedSearch = value.trim();

      let shouldApplyPersonalFilter = undefined;
      if (userRole === "admin" || userRole === "leader at 12") {
        shouldApplyPersonalFilter = viewFilter === 'personal' ? true : undefined;
      }

      setCurrentPage(1);

      fetchEvents({
        page: 1,
        limit: rowsPerPage,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
        search: trimmedSearch || undefined,
        personal: shouldApplyPersonalFilter,
        start_date: DEFAULT_API_START_DATE
      }, true);
    }, 500);
  };

  const handleSearchSubmit = () => {
    const trimmedSearch = searchQuery.trim();

    let shouldApplyPersonalFilter = undefined;
    if (userRole === "admin" || userRole === "leader at 12") {
      shouldApplyPersonalFilter = viewFilter === 'personal' ? true : undefined;
    }

    setCurrentPage(1);

    fetchEvents({
      page: 1,
      limit: rowsPerPage,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      search: trimmedSearch || undefined,
      personal: shouldApplyPersonalFilter,
      start_date: DEFAULT_API_START_DATE
    }, true);
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
      start_date: DEFAULT_API_START_DATE
    }, true);
  };

  const handleEventTypeClick = (typeValue) => {
    if (selectedEventTypeFilter === typeValue) {
      fetchEvents({}, true);
      return;
    }

    setSelectedEventTypeFilter(typeValue);
    setCurrentPage(1);

    const selectedTypeObj = customEventTypes.find(
      (et) => et.name?.toLowerCase() === typeValue.toLowerCase()
    );

    if (selectedTypeObj) {
      setSelectedEventTypeObj(selectedTypeObj);
    } else {
      setSelectedEventTypeObj(null);
    }

    const shouldApplyPersonalFilter =
      viewFilter === 'personal' &&
      (userRole === "admin" || userRole === "leader at 12");

    fetchEvents({
      page: 1,
      limit: rowsPerPage,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: typeValue,
      search: searchQuery.trim() || undefined,
      personal: shouldApplyPersonalFilter ? true : undefined,
      start_date: DEFAULT_API_START_DATE
    }, true);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && !isLoading) {
      const newPage = currentPage + 1;

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
        start_date: DEFAULT_API_START_DATE
      });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && !isLoading) {
      const newPage = currentPage - 1;

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
        start_date: DEFAULT_API_START_DATE
      });
    }
  };

  const handleCaptureClick = (event) => {
    setSelectedEvent(event);
    setAttendanceModalOpen(true);
  };

  const handleCloseCreateEventModal = () => {
    setCreateEventModalOpen(false);
    fetchEvents();
  };

  const applyFilters = (filters) => {
    setActiveFilters(filters);
    setFilterOptions(filters);
    setCurrentPage(1);

    const shouldApplyPersonalFilter =
      viewFilter === 'personal' &&
      (userRole === "admin" || userRole === "leader at 12");

    const apiFilters = {
      page: 1,
      limit: rowsPerPage,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      search: searchQuery.trim() || undefined,
      personal: shouldApplyPersonalFilter ? true : undefined,
      start_date: DEFAULT_API_START_DATE
    };

    if (filters.leader && filters.leader.trim()) {
      apiFilters.search = filters.leader.trim();
    }

    if (filters.day && filters.day !== 'all') {
      apiFilters.day = filters.day;
    }

    if (filters.eventType && filters.eventType !== 'all') {
      apiFilters.event_type = filters.eventType;
    }

    Object.keys(apiFilters).forEach(key =>
      apiFilters[key] === undefined && delete apiFilters[key]
    );

    fetchEvents(apiFilters, true);
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
      console.error("Error in handleAttendanceSubmit:", error);
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
    const eventToEdit = {
      ...event,
      UUID: event.UUID || event._id,
      id: event._id || event.id
    };

    setSelectedEvent(eventToEdit);
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
      console.error(`Error ${eventTypeId ? 'updating' : 'creating'} event type:`, error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || error.message || `Failed to ${eventTypeId ? 'update' : 'create'} event type`,
        severity: "error",
      });
      throw error;
    }
  };

  const handleSaveEvent = async (updatedData) => {
    try {
      const token = localStorage.getItem("token");
      const eventIdentifier = selectedEvent.UUID || selectedEvent._id || selectedEvent.id;
      if (!eventIdentifier) {
        throw new Error("No event identifier found");
      }

      const response = await axios.put(
        `${BACKEND_URL}/events/${eventIdentifier}`,
        updatedData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          message: "Event updated successfully!",
          severity: "success",
        });
        fetchEvents({}, true);
        setEditModalOpen(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error("Error updating event:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Failed to update event",
        severity: "error",
      });
    }
  };

  const openTypeMenu = (event, type) => {
    setTypeMenuAnchor(event.currentTarget);
    setTypeMenuFor(type);
  };

  const closeTypeMenu = () => {
    setTypeMenuAnchor(null);
    setTypeMenuFor(null);
  };

  const handleEditType = async (type) => {
    try {
      let eventTypeToEdit;

      if (typeof type === 'string') {
        const fullEventType = eventTypes.find(et =>
          et.name === type || et.name?.toLowerCase() === type.toLowerCase()
        );

        if (fullEventType) {
          eventTypeToEdit = fullEventType;
        } else {
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

      if (selectedEventTypeFilter === typeName) {
        setSelectedEventTypeFilter('all');
        setSelectedEventTypeObj(null);
        localStorage.removeItem("selectedEventTypeObj");
      }

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

  // useEffects
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    const shouldApplyPersonalByDefault =
      (userRole === "user" || userRole === "leader at 1" || userRole === "registrant");

    let initialViewFilter = 'all';
    if (userRole === "user" || userRole === "leader at 1" || userRole === "registrant") {
      initialViewFilter = 'personal';
    } else if (userRole === "admin" || userRole === "leader at 12") {
      initialViewFilter = viewFilter;
    }

    if (viewFilter !== initialViewFilter) {
      setViewFilter(initialViewFilter);
    }

    const fetchParams = {
      page: currentPage,
      limit: rowsPerPage,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
      search: searchQuery.trim() || undefined,
      personal: shouldApplyPersonalByDefault ? undefined : (viewFilter === 'personal' ? true : undefined),
      start_date: DEFAULT_API_START_DATE
    };

    Object.keys(fetchParams).forEach(key =>
      fetchParams[key] === undefined && delete fetchParams[key]
    );

    fetchEvents(fetchParams, true);
  }, [
    selectedStatus, selectedEventTypeFilter, viewFilter, currentPage, rowsPerPage, userRole
  ]);

  const StatusBadges = () => {
    const statuses = [
      { value: 'incomplete', label: 'Incomplete', style: styles.statusBadgeIncomplete },
      { value: 'complete', label: 'Complete', style: styles.statusBadgeComplete },
      { value: 'did_not_meet', label: 'Did Not Meet', style: styles.statusBadgeDidNotMeet }
    ];

    return (
      <div style={styles.statusBadgeContainer}>
        {statuses.map(status => (
          <button
            key={status.value}
            style={{
              ...styles.statusBadge,
              ...status.style,
              ...(selectedStatus === status.value ? styles.statusBadgeActive : {})
            }}
            onClick={() => {
              setSelectedStatus(status.value);
              setCurrentPage(1);
            }}
          >
            {status.label}
          </button>
        ))}
      </div>
    );
  };

  const ViewFilterButtons = () => {
    if (userRole !== "admin" && userRole !== "leader at 12") {
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
              setViewFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
          <span style={styles.viewFilterText}>CELLS</span>
        </label>
        <label style={styles.viewFilterRadio}>
          <input
            type="radio"
            name="viewFilter"
            value="personal"
            checked={viewFilter === 'personal'}
            onChange={(e) => {
              setViewFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
          <span style={styles.viewFilterText}>Personal</span>
        </label>
      </div>
    );
  };

  const EventTypeSelector = () => {
    const [hoveredType, setHoveredType] = useState(null);

    const allTypes = useMemo(() => {
      const baseTypes = ["all"];
      const eventTypeNames = eventTypes.map(t => t.name || t).filter(name => name && name !== "all");
      return [...baseTypes, ...eventTypeNames];
    }, [eventTypes]);

    const getDisplayName = (type) => {
      if (!type) return "";
      if (type === "all") return "CELLS";
      return typeof type === "string" ? type : type.name || String(type);
    };

    const getTypeValue = (type) => {
      if (type === "all") return "all";
      return typeof type === "string" ? type : type.name || String(type);
    };

    return (
      <div style={eventTypeStyles.container}>
        <div style={eventTypeStyles.header}>Filter by Event Type</div>

        <div style={eventTypeStyles.selectedTypeDisplay}>
          <div style={eventTypeStyles.checkIcon}>✓</div>
          <span>{getDisplayName(selectedEventTypeFilter)}</span>
        </div>

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
                  position: "relative", // This is crucial
                  minWidth: isMobileView ? "120px" : "150px",
                  minHeight: "60px",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  overflow: "visible", // Ensure popover isn't clipped
                }}
                onClick={() => {
                  handleEventTypeClick(typeValue);
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

                {isAdmin && typeValue !== 'all' && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      openTypeMenu(e, type);
                    }}
                    aria-label="type actions"
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      zIndex: 2,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                      },
                      width: 24,
                      height: 24,
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
            );
          })}
        </div>
        <Popover
          open={Boolean(typeMenuAnchor)}
          anchorEl={typeMenuAnchor}
          onClose={closeTypeMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          sx={{
            '& .MuiPopover-paper': {
              borderRadius: 1,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              minWidth: 120,
              marginTop: '4px',
            }
          }}
          disableScrollLock={true}
        >
          <MenuItem
            onClick={() => {
              if (typeMenuFor) handleEditType(typeMenuFor);
              closeTypeMenu();
            }}
            sx={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: 'rgba(0, 123, 255, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Edit"
              primaryTypographyProps={{ fontSize: '0.875rem' }}
            />
          </MenuItem>

          <MenuItem
            onClick={() => {
              setToDeleteType(typeMenuFor);
              setConfirmDeleteOpen(true);
              closeTypeMenu();
            }}
            sx={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              color: "error.main",
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText
              primary="Delete"
              primaryTypographyProps={{ fontSize: '0.875rem' }}
            />
          </MenuItem>
        </Popover>
        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Event Type</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete{" "}
              <strong>{toDeleteType?.name || toDeleteType || "this event type"}</strong>? This
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button color="error" onClick={handleDeleteType}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  };

  return (
    <Box sx={{
      height: "100vh",
      fontFamily: "system-ui, sans-serif",
      padding: "1rem",
      paddingTop: "5rem",
      paddingBottom: "1rem",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden", // CRUCIAL: Prevents the body/main Box from scrolling
      position: "relative",
      width: "100%",
      maxWidth: "100vw",
      backgroundColor: isDarkMode ? theme.palette.background.default : '#f5f7fa',
    }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }} />}

      {/* ** 2. FILTER/SEARCH SECTION (Fixed Height)** */}
      <Box sx={{
        padding: isMobileView ? "1rem" : "1.5rem",
        borderRadius: "16px",
        marginBottom: isMobileView ? "0.5rem" : "1rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        flexShrink: 0, // CRUCIAL: Keeps this section's height fixed
        backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
      }}>
        <EventTypeSelector />

        <Box sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          marginBottom: isMobileView ? "0.75rem" : "1.5rem",
          flexWrap: "wrap",
          px: 1
        }}>
          {/* ... TextField (Search) ... */}
          <TextField
            size="small"
            placeholder="Search by Event Name, Leader, or Email..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 200,
              '& .MuiInputBase-input': {
                fontSize: isMobileView ? '14px' : '0.95rem',
                padding: isMobileView ? '0.6rem 0.8rem' : '0.75rem 1rem',
              }
            }}
          />

          {/* ... Button (Search) ... */}
          <Button
            variant="contained"
            onClick={handleSearchSubmit}
            disabled={loading}
            sx={{
              padding: isMobileView ? '0.6rem 1rem' : '0.75rem 1.5rem',
              fontSize: isMobileView ? '14px' : '0.95rem',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '⏳' : 'SEARCH'}
          </Button>

          {/* ... Button (Clear All) ... */}
          <Button
            variant="outlined"
            onClick={clearAllFilters}
            disabled={loading}
            sx={{
              padding: isMobileView ? '0.6rem 1rem' : '0.75rem 1.5rem',
              fontSize: isMobileView ? '14px' : '0.95rem',
              whiteSpace: 'nowrap',
              backgroundColor: '#6c757d',
              color: 'white',
              '&:hover': {
                backgroundColor: '#5a6268',
              }
            }}
          >
            {loading ? '⏳' : 'CLEAR ALL'}
          </Button>
        </Box>

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
          px: 1
        }}>
          <StatusBadges />
          <ViewFilterButtons />
        </Box>
      </Box>

      {/* ** 3. SCROLLABLE CONTENT AREA (Flex Grow)** */}
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto', // Allows content to scroll vertically
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
        // The paddingBottom accounts for the FAB on mobile, otherwise it's just general padding
        paddingBottom: isMobileView ? '70px' : '1rem',
      }}>

        {isMobileView ? (
          // ** MOBILE VIEW FIX: Removed minHeight: '100vh' from inner box **
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Scrollable list container */}
            <Box sx={{
              flexGrow: 1,
              padding: "0.75rem",
            }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton
                    key={`mobile-skeleton-${idx}`}
                    variant="rectangular"
                    height={120}
                    sx={{ mb: 2, borderRadius: 2 }}
                  />
                ))
              ) : paginatedEvents.length === 0 ? (
                <Box sx={{
                  textAlign: "center",
                  padding: "2rem",
                  color: isDarkMode ? theme.palette.text.primary : '#666',
                }}>
                  <Typography>No events found matching your criteria.</Typography>
                </Box>
              ) : (
                // ** THIS IS THE LIST OF MOBILE EVENT CARDS **
                paginatedEvents.map((event) => (
                  <MobileEventCard
                    key={event._id}
                    event={event}
                    onOpenAttendance={() => handleCaptureClick(event)}
                    onEdit={() => handleEditEvent(event)}
                    onDelete={() => handleDeleteEvent(event)}
                    isOverdue={isOverdue(event)}
                    formatDate={formatDate}
                    theme={theme}
                    styles={styles}
                  />
                ))
              )}
            </Box>

            {/* Pagination for MOBILE - Fixed at the bottom of the scrollable Box */}
            <Box sx={{
              padding: '1rem',
              borderTop: `1px solid ${isDarkMode ? theme.palette.divider : '#e9ecef'}`,
              backgroundColor: isDarkMode ? theme.palette.background.paper : '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              {/* ... Mobile Pagination content ... */}
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                {totalEvents > 0 ? `${startIndex}-${endIndex} of ${totalEvents}` : '0-0 of 0'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  sx={{ minWidth: 'auto' }}
                >
                  {loading ? '⏳' : '◀ Prev'}
                </Button>
                <Typography variant="body2" sx={{ padding: '0 0.5rem', color: '#6c757d' }}>
                  {currentPage} / {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || loading || totalPages === 0}
                  sx={{ minWidth: 'auto' }}
                >
                  {loading ? '⏳' : 'Next ▶'}
                </Button>
              </Box>
            </Box>
          </Box>

        ) : (
          // DESKTOP VIEW
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* The table container still needs to handle horizontal scroll for the table itself */}
            <Box sx={{ flex: 1, overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '1300px'
              }}>
                {/* ... The rest of your desktop table structure (thead, tbody, tr, td) ... */}
                <thead style={{
                  backgroundColor: "#000",
                  color: "#fff",
                }}>
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
                  {/* ... Table rows (loading, no results, paginated events) ... */}
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`desktop-skeleton-${idx}`}>
                        <td colSpan={8} style={{ ...themedStyles.td, padding: '1rem' }}>
                          <Skeleton variant="rectangular" height={60} />
                        </td>
                      </tr>
                    ))
                  ) : paginatedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{
                        ...themedStyles.td,
                        textAlign: 'center',
                        padding: '2rem'
                      }}>
                        <Typography>No events found matching your criteria.</Typography>
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
                            <Box sx={styles.truncatedText} title={event.eventName}>
                              {event.eventName}
                            </Box>
                          </td>
                          <td style={themedStyles.td}>
                            <Box sx={styles.truncatedText} title={event.eventLeaderName}>
                              {event.eventLeaderName || '-'}
                            </Box>
                          </td>
                          <td style={themedStyles.td}>
                            <Box sx={styles.truncatedText}>
                              {shouldShowLeaderAt1 ? (event.leader1 || '-') : '-'}
                            </Box>
                          </td>
                          <td style={themedStyles.td}>
                            <Box sx={styles.truncatedText}>
                              {shouldShowLeaderAt12 ? (event.leader12 || '-') : '-'}
                            </Box>
                          </td>
                          <td style={themedStyles.td}>
                            <Box>{dayOfWeek}</Box>
                            {isOverdue(event) && (
                              <Box sx={styles.overdueLabel}>
                                Overdue
                              </Box>
                            )}
                          </td>
                          <td style={themedStyles.td}>
                            <Box sx={styles.emailText} title={event.eventLeaderEmail}>
                              {event.eventLeaderEmail || '-'}
                            </Box>
                          </td>
                          <td style={themedStyles.td}>{formatDate(event.date)}</td>
                          <td style={themedStyles.td}>
                            <Box sx={styles.actionIcons}>
                              <Tooltip title="Capture Attendance" arrow>
                                <IconButton
                                  onClick={() => handleCaptureClick(event)}
                                  size="small"
                                  sx={{
                                    backgroundColor: '#007bff',
                                    color: '#fff',
                                    '&:hover': { backgroundColor: '#0056b3' }
                                  }}
                                >
                                  <CheckBoxIcon />
                                </IconButton>
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
                            </Box>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </Box>

            {/* Pagination for DESKTOP - This remains fixed at the bottom of the content area */}
            <Box sx={{ ...styles.paginationContainer, flexShrink: 0 }}>
              <Box sx={styles.rowsPerPage}>
                <Typography variant="body2">Rows per page:</Typography>
                <select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  style={styles.rowsSelect}
                  disabled={loading}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </Box>

              <Typography variant="body2" sx={styles.paginationInfo}>
                {totalEvents > 0 ? `${startIndex}-${endIndex} of ${totalEvents}` : '0-0 of 0'}
              </Typography>

              <Box sx={styles.paginationControls}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                >
                  {loading ? '⏳' : '< Previous'}
                </Button>
                <Typography variant="body2" sx={{ padding: '0 1rem', color: '#6c757d' }}>
                  Page {currentPage} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || loading || totalPages === 0}
                >
                  {loading ? '⏳' : 'Next >'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* ** 4. FAB (FIXED relative to the main container)** */}
      {isAdmin && (
        <Box sx={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
        }}>
          {fabMenuOpen && (
            <Box sx={fabStyles.fabMenu}>
              <Box
                sx={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                  setEventTypesModalOpen(true);
                  setEditingEventType(null);
                }}
              >
                <Typography sx={fabStyles.fabMenuLabel}>Create Event Type</Typography>
                <Box sx={fabStyles.fabMenuIcon}>📋</Box>
              </Box>

              <Box
                sx={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                  setCreateEventModalOpen(true);
                }}
              >
                <Typography sx={fabStyles.fabMenuLabel}>Create Event</Typography>
                <Box sx={fabStyles.fabMenuIcon}>📅</Box>
              </Box>
            </Box>
          )}

          <IconButton
            sx={{
              backgroundColor: "#007bff",
              color: "white",
              width: 56,
              height: 56,
              '&:hover': { backgroundColor: "#0056b3" },
              transform: fabMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'all 0.3s ease',
            }}
            onClick={() => setFabMenuOpen(!fabMenuOpen)}
          >
            +
          </IconButton>
        </Box>
      )}

      {/* ... The rest of your Modals (Eventsfilter, AttendanceModal, EventTypesModal, createEventModalOpen, EditEventModal, Snackbar) ... */}
      <Eventsfilter
        open={showFilter}
        onClose={() => setShowFilter(false)}
        onApplyFilter={applyFilters}
        events={events}
        currentFilters={filterOptions}
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
        <Box
          sx={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseCreateEventModal();
            }
          }}
        >
          <Box sx={{
            ...styles.modalContent,
            backgroundColor: isDarkMode ? theme.palette.background.paper : "white",
          }}>
            <Box sx={{
              ...styles.modalHeader,
              backgroundColor: isDarkMode ? theme.palette.background.default : "#333",
            }}>
              <Typography sx={styles.modalTitle}>
                {selectedEventTypeObj?.name === "CELLS" ? "Create New Cell" : "Create New Event"}
              </Typography>
              <IconButton
                sx={styles.modalCloseButton}
                onClick={handleCloseCreateEventModal}
              >
                ×
              </IconButton>
            </Box>
            <Box sx={{
              ...styles.modalBody,
              backgroundColor: isDarkMode ? theme.palette.background.paper : "white",
            }}>
              <CreateEvents
                user={currentUser}
                isModal={true}
                onClose={handleCloseCreateEventModal}
                selectedEventTypeObj={selectedEventTypeObj}
                selectedEventType={selectedEventTypeFilter}
                eventTypes={allEventTypes}
              />
            </Box>
          </Box>
        </Box>
      )}

      <EditEventModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        event={selectedEvent}
        onSave={handleSaveEvent}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Events;