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
    zIndex: 1300,
  },
  fabMenu: {
    position: "absolute",
    bottom: "70px",
    right: "0",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "all 0.3s ease",
    zIndex: 1300,
  },
  fabMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fff",
    padding: "12px 16px",
    borderRadius: "50px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s ease",
    border: "1px solid #e0e0e0",
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
      backgroundColor: '#f8f9fa',
    },
    '&:focus': {
      outline: '2px solid #007bff',
      outlineOffset: '2px',
    },
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
    fontSize: "12px",
    fontWeight: "bold",
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
  if (!userRole) return 'all';

  const normalizedRole = userRole.toLowerCase().trim();

  // ✅ FIXED: Better role detection for leader at 12
  const isLeaderAt12 =
    normalizedRole.includes("leader at 12") ||
    normalizedRole.includes("leader@12") ||
    normalizedRole.includes("leader @12") ||
    normalizedRole.includes("leader at12");

  const isAdmin = normalizedRole === "admin";
  const isUser = normalizedRole === "user" || normalizedRole.includes("leader at 144") || normalizedRole.includes("leader at 1278");
  const isRegistrant = normalizedRole === "registrant";

  if (isAdmin || isLeaderAt12) {
    return 'all';
  }
  if (isUser || isRegistrant) {
    return 'personal';
  }
  return 'all';
};

const MobileEventCard = ({ event, onOpenAttendance, onEdit, onDelete, isOverdue, formatDate, theme, styles }) => {
  if (!theme) {
    return <Box sx={{ height: 100 }} />;
  }
  const isDark = theme.palette.mode === 'dark';
const borderColor = isDark ? theme.palette.divider : '#e9ecef';
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

  // ✅ FIXED: Better role detection for leader at 12
  const isLeaderAt12 =
    userRole.includes("leader at 12") ||
    userRole.includes("leader@12") ||
    userRole.includes("leader @12") ||
    userRole.includes("leader at12") ||
    userRole.includes("leaderat12");

  const isAdmin = userRole === "admin";
  const isRegistrant = userRole === "registrant";
  const isRegularUser = userRole === "user" ||
    userRole.includes("leader at 144") ||
    userRole.includes("leader at 1278") ||
    userRole.includes("leader at 1728");

  console.log("🔍 Current User Role Analysis:", {
    userRole,
    isLeaderAt12,
    isAdmin,
    isRegistrant,
    isRegularUser
  });


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
  console.log("🔍 [fetchEvents] Called with:", { filters, forceRefresh });
  
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
      search: filters.search !== undefined ? filters.search : (searchQuery.trim() || undefined),
      personal: filters.personal !== undefined ? filters.personal : (viewFilter === 'personal' && ["admin", "leader at 12", "leader at 144"].includes(userRole) ? true : undefined),
      start_date: startDateParam,
      ...filters
    };
    
    if (filters.event_type !== undefined) {
      params.event_type = filters.event_type;
    } else if (selectedEventTypeFilter !== 'all') {
      params.event_type = selectedEventTypeFilter;
    } else {
      params.event_type = "CELLS";
    }
    
    const isLeaderAt12 =
      userRole.includes("leader at 12") ||
      userRole.includes("leader@12") ||
      userRole.includes("leader @12") ||
      userRole.includes("leader at12");

    if (isLeaderAt12) {
      params.leader_at_12_view = true;
      if (viewFilter === 'personal') {
        params.personal_cells_only = true;
      } else {
        params.include_subordinate_cells = true;
        params.include_global_events = true;
      }
    }
    
    Object.keys(params).forEach(key => (params[key] === undefined || params[key] === null) && delete params[key]);
    
    const endpoint = `${BACKEND_URL}/events`;
    console.log('🌐 Fetching events from:', endpoint, 'with params:', params);

    const cacheKey = getCacheKey({ ...params, userRole });
    
    if (!forceRefresh) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log("📦 Using cached data");
        setEvents(cachedData.events);
        setFilteredEvents(cachedData.events);
        setTotalEvents(cachedData.total_events);
        setTotalPages(cachedData.total_pages);
        if (filters.page !== undefined) setCurrentPage(filters.page);
        setLoading(false);
        setIsLoading(false);
        return;
      }
    } else {
      console.log("🔄 Force refresh - bypassing cache");
    }

    const response = await axios.get(endpoint, {
      headers,
      params,
      timeout: 60000
    });

    const responseData = response.data;
    const newEvents = responseData.events || responseData.results || [];

    console.log('✅ Backend returned events:', newEvents.length);

    const eventIds = newEvents.map(e => e._id);
    const uniqueIds = new Set(eventIds);
    if (eventIds.length !== uniqueIds.size) {
      console.warn('⚠️ Backend still returning duplicates:', {
        totalEvents: eventIds.length,
        uniqueEvents: uniqueIds.size,
        duplicates: eventIds.length - uniqueIds.size
      });
    }

    const totalEventsCount = responseData.total_events || responseData.total || newEvents.length;
    const totalPagesCount = responseData.total_pages || Math.ceil(totalEventsCount / rowsPerPage) || 1;

    setCachedData(cacheKey, {
      events: newEvents,
      total_events: totalEventsCount,
      total_pages: totalPagesCount
    });

    console.log("🔄 Updating state with new events...");
    setEvents(newEvents);
    setFilteredEvents(newEvents);
    setTotalEvents(totalEventsCount);
    setTotalPages(totalPagesCount);
    if (filters.page !== undefined) setCurrentPage(filters.page);
    
    console.log("✅ State updated with", newEvents.length, "events");

  } catch (err) {
    console.error("❌ Error fetching events:", err);
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
  userRole,
  getCacheKey,
  getCachedData,
  setCachedData,
  BACKEND_URL,
  DEFAULT_API_START_DATE,
  setSnackbar
]);;

useEffect(() => {
  const checkAccess = async () => {
    const userRole = currentUser?.role?.toLowerCase() || "";
    const email = currentUser?.email || "";

    console.log("🔐 Checking user access:", { userRole, email });

    // Define roles that have access
    const isAdmin = userRole === "admin";
    const isLeaderAt12 =
      userRole.includes("leader at 12") ||
      userRole.includes("leader@12") ||
      userRole.includes("leader @12") ||
      userRole.includes("leader at12");
    const isRegistrant = userRole === "registrant";
    const isLeader144or1728 =
      userRole.includes("leader at 144") ||
      userRole.includes("leader at 1278") ||
      userRole.includes("leader at 1728");
    const isUser = userRole === "user";

    // ✅ NEW: For regular users, check if they have a cell
    if (isUser) {
      try {
        const response = await axios.get(`${BACKEND_URL}/check-leader-status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        const { hasCell, canAccessEvents } = response.data;
        
        if (!canAccessEvents || !hasCell) {
          alert("You must have a cell to access the Events page");
          window.location.href = "/dashboard";
          return;
        }
        
        console.log("✅ User has cell - access granted");
      } catch (error) {
        console.error("Error checking cell status:", error);
        alert("Unable to verify access. Please contact support.");
        window.location.href = "/dashboard";
        return;
      }
    }

    // ✅ Existing leader checks
    const hasAccess = isAdmin || isLeaderAt12 || isRegistrant || isLeader144or1728 || isUser;

    if (!hasAccess) {
      alert("You must be a leader to access the Events page");
      window.location.href = "/dashboard";
    } else {
      console.log("✅ Access granted:", {
        isAdmin,
        isLeaderAt12,
        isRegistrant,
        isLeader144or1728,
        isUser
      });
    }
  };

  checkAccess();
}, [currentUser?.email, currentUser?.role]);
  
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

      // Try to load from cache if available
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

  const validateEventStatus = (event) => {
    const status = (event.status || '').toLowerCase();
    const hasAttendees = event.attendees && event.attendees.length > 0;
    const didNotMeet = event.did_not_meet || false;

    // If event is marked as complete but has no attendees and didn't meet, it's invalid
    if (status === 'complete' && !hasAttendees && !didNotMeet) {
      return 'incomplete';
    }

    return status;
  };

  const handleFetchError = (err) => {
    if (err.response?.status === 401) {
      setSnackbar({ open: true, message: "Session expired. Logging out...", severity: "error" });
      localStorage.removeItem("token");
      localStorage.removeItem("userProfile");
      setTimeout(() => window.location.href = '/login', 2000);
    } else {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Error loading events. Please try again.",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);



  useEffect(() => {
    console.log('Available event types:', eventTypes);
    console.log('Selected event type filter:', selectedEventTypeFilter);
  }, [eventTypes, selectedEventTypeFilter]);

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
      clearCache(); // Clear cache on search

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
          all_attendees: [],
          leaderEmail,
          leaderName,
          did_not_meet: true,
        };
      } else if (Array.isArray(data)) {
        payload = {
          attendees: data,
          all_attendees: data,
          leaderEmail,
          leaderName,
          did_not_meet: false,
        };
      } else {
        payload = {
          ...data,
          leaderEmail,
          leaderName,
        };
      }

      // 🔍 ADD DEBUG LOGGING
      console.log("🔄 Sending payload to backend:", JSON.stringify(payload, null, 2));
      console.log("🔍 First attendee structure:", payload.attendees[0]);

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
  console.log("📝 [handleEditEvent] Opening edit modal for event:", {
    name: event.eventName,
    _id: event._id,
    UUID: event.UUID,
    id: event.id,
    uuid: event.uuid,
    allKeys: Object.keys(event)
  });

  // ✅ CRITICAL FIX: Ensure we pass the complete event object with identifiers
  const eventToEdit = {
    ...event,
    // Explicitly preserve identifiers
    _id: event._id || event.id || null,
    UUID: event.UUID || event.uuid || null,
  };

  // ✅ Verify we have at least one identifier
  if (!eventToEdit._id && !eventToEdit.UUID) {
    console.error("❌ No identifier found in event:", {
      event,
      eventToEdit,
      availableKeys: Object.keys(event)
    });
    setSnackbar({
      open: true,
      message: "Cannot edit event: Missing identifier. Please refresh and try again.",
      severity: "error",
    });
    return;
  }

  console.log("✅ Event prepared for editing:", {
    _id: eventToEdit._id,
    UUID: eventToEdit.UUID,
    name: eventToEdit.eventName,
    hasId: !!eventToEdit._id,
    hasUUID: !!eventToEdit.UUID
  });

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

 
const handleSaveEvent = async (eventData) => {
  try {
    console.log("💾 [handleSaveEvent] Received event data:", eventData);
    
    const eventIdentifier = eventData._id || eventData.UUID || eventData.id;
    
    if (!eventIdentifier) {
      console.error("❌ No event identifier found:", eventData);
      throw new Error("No event identifier (_id or UUID) found");
    }
    
    console.log("🔧 Updating event with identifier:", {
      identifier: eventIdentifier,
      type: eventData._id ? '_id' : 'UUID',
      newName: eventData.eventName
    });
    
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }
    
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    
    const endpoint = `${BACKEND_URL}/events/${eventIdentifier}`;
    console.log("🌐 PUT request to:", endpoint);
    
    const cleanPayload = Object.entries(eventData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    console.log("📤 Sending payload:", cleanPayload);
    
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(cleanPayload),
    });
    
    console.log("📥 Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      let errorData;
      let errorMessage;
      
      try {
        errorData = await response.json();
        console.error("❌ Server error response:", errorData);
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } catch (parseError) {
        console.error("❌ Could not parse error response:", parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    const updatedEvent = await response.json();
    console.log("✅ Event updated successfully from backend:", updatedEvent);
    
    // ✅ NUCLEAR OPTION: Clear everything and force complete refresh
    console.log("🗑️ Clearing all caches and state...");
    
    // Clear the cache completely
    clearCache();
    
    // Clear localStorage cache if any
    const cacheKeys = Object.keys(localStorage).filter(key => key.includes('events_cache') || key.includes('cache'));
    cacheKeys.forEach(key => localStorage.removeItem(key));
    
    // ✅ FORCE A COMPLETE RE-FETCH - Wait a bit for DB to propagate
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("🔄 Forcing complete refresh of events...");
    
    // Build exact params for current view
    const refreshParams = {
      page: currentPage,
      limit: rowsPerPage,
      start_date: DEFAULT_API_START_DATE,
      // Add timestamp to bust any server-side cache
      _t: Date.now()
    };

    // Add status filter
    if (selectedStatus && selectedStatus !== 'all') {
      refreshParams.status = selectedStatus;
    }

    // Add search filter
    if (searchQuery && searchQuery.trim()) {
      refreshParams.search = searchQuery.trim();
    }

    // Add event type filter
    if (selectedEventTypeFilter === 'all') {
      refreshParams.event_type = "CELLS";
    } else if (selectedEventTypeFilter) {
      refreshParams.event_type = selectedEventTypeFilter;
    }

    // Add personal/view filters
    if (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS') {
      const isLeaderAt12 = userRole?.includes("leader at 12") || 
                          userRole?.includes("leader@12") || 
                          userRole?.includes("leader at12");
      
      if (isLeaderAt12) {
        refreshParams.leader_at_12_view = true;
        if (viewFilter === 'personal') {
          refreshParams.personal_cells_only = true;
          refreshParams.show_personal_cells = true;
          refreshParams.show_all_authorized = false;
        } else {
          refreshParams.include_subordinate_cells = true;
          refreshParams.include_global_events = true;
          refreshParams.show_personal_cells = false;
          refreshParams.show_all_authorized = true;
        }
      } else if (isAdmin && viewFilter === 'personal') {
        refreshParams.personal = true;
      }
    }

    // Remove undefined values
    Object.keys(refreshParams).forEach(key => 
      refreshParams[key] === undefined && delete refreshParams[key]
    );

    console.log("🔍 Refreshing with params:", refreshParams);
    
    // Call fetchEvents with force refresh
    await fetchEvents(refreshParams, true);
    
    // ✅ Double-check: Wait and fetch again if needed
    setTimeout(async () => {
      console.log("🔄 Double-checking with second refresh...");
      await fetchEvents(refreshParams, true);
    }, 1000);
    
    setSnackbar({
      open: true,
      message: "Event updated successfully!",
      severity: "success",
    });
    
    return { success: true, event: updatedEvent };
    
  } catch (error) {
    console.error("❌ Error in handleSaveEvent:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      fullError: error
    });
    
    const errorMessage = error.message || String(error) || "Failed to update event";
    
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: "error",
    });
    
    throw new Error(errorMessage);
  }
};

const handleCloseEditModal = async (shouldRefresh = false) => {
  console.log("🚪 Closing edit modal, shouldRefresh:", shouldRefresh);
  
  setEditModalOpen(false);
  setSelectedEvent(null);
  
  if (shouldRefresh) {
    console.log("🔄 Modal requested refresh, forcing complete reload...");
    
    // Clear all caches
    clearCache();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Force refresh with current filters
    const refreshParams = {
      page: currentPage,
      limit: rowsPerPage,
      start_date: DEFAULT_API_START_DATE,
      _t: Date.now() // Cache buster
    };

    if (selectedStatus && selectedStatus !== 'all') {
      refreshParams.status = selectedStatus;
    }

    if (searchQuery && searchQuery.trim()) {
      refreshParams.search = searchQuery.trim();
    }

    if (selectedEventTypeFilter === 'all') {
      refreshParams.event_type = "CELLS";
    } else if (selectedEventTypeFilter) {
      refreshParams.event_type = selectedEventTypeFilter;
    }

    Object.keys(refreshParams).forEach(key => 
      refreshParams[key] === undefined && delete refreshParams[key]
    );

    await fetchEvents(refreshParams, true);
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

    console.log("🔄 Setting editing event type:", eventTypeToEdit); // Debug log
    
    // Close any open menu first
    closeTypeMenu();
    
    // Set the editing state BEFORE opening the modal
    setEditingEventType(eventTypeToEdit);
    
    // Small delay to ensure state is set before modal opens
    setTimeout(() => {
      setEventTypesModalOpen(true);
    }, 100);

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
  // Add a small delay before resetting editing state
  setTimeout(() => {
    setEditingEventType(null);
  }, 300);
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
  } else if (userRole === "admin" || isLeaderAt12) {
    initialViewFilter = viewFilter;
  }

  if (viewFilter !== initialViewFilter) {
    setViewFilter(initialViewFilter);
  }

  const fetchParams = {
    page: currentPage,
    limit: rowsPerPage,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    search: searchQuery.trim() || undefined,
    start_date: DEFAULT_API_START_DATE
  };

  // ✅ CRITICAL: Handle event type filtering
  if (selectedEventTypeFilter === 'all') {
    // "All Events" means ONLY CELLS events
    fetchParams.event_type = "CELLS";
  } else {
    // Specific event type selected
    fetchParams.event_type = selectedEventTypeFilter;
  }

  // ✅ FIXED: Only apply personal filtering for CELLS events
  if (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS') {
    if (isLeaderAt12) {
      if (viewFilter === 'personal') {
        fetchParams.show_personal_cells = true;
        fetchParams.show_all_authorized = false;
      } else {
        fetchParams.show_personal_cells = false;
        fetchParams.show_all_authorized = true;
      }
    } else if (isAdmin && viewFilter === 'personal') {
      fetchParams.personal = true;
    }
  }

  Object.keys(fetchParams).forEach(key =>
    fetchParams[key] === undefined && delete fetchParams[key]
  );

  console.log("🔍 useEffect - Fetching with params:", fetchParams);
  fetchEvents(fetchParams, true);
}, [
  selectedStatus, selectedEventTypeFilter, viewFilter, currentPage, rowsPerPage, userRole, isLeaderAt12, isAdmin
]);

  const StatusBadges = ({ selectedStatus, setSelectedStatus, setCurrentPage }) => {
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
  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const userRole = currentUser?.role?.toLowerCase() || "";

  const isLeaderAt12 =
    userRole.includes("leader at 12") ||
    userRole.includes("leader@12") ||
    userRole.includes("leader @12") ||
    userRole.includes("leader at12");

  const isAdmin = userRole === "admin";

  // ✅ FIXED: Show toggle for both Admins AND Leaders at 12 when viewing CELLS events
  const shouldShowToggle = (isAdmin || isLeaderAt12) && 
    (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS');

  if (!shouldShowToggle) {
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

            const fetchParams = {
              page: 1,
              limit: rowsPerPage,
              start_date: DEFAULT_API_START_DATE,
              // ✅ CRITICAL: Always send CELLS as event_type when toggle is visible
              event_type: "CELLS"
            };

            if (isLeaderAt12) {
              // ✅ FIXED: Leader at 12 - "ALL CELLS" = show their cells + disciples' cells
              fetchParams.show_personal_cells = false;
              fetchParams.show_all_authorized = true;
              fetchParams.include_subordinate_cells = true;
            } else if (isAdmin) {
              // Admin - "ALL CELLS" = show all cells
              fetchParams.personal = false;
            }
            
            console.log("🔍 ALL CELLS selected - fetching:", fetchParams);
            fetchEvents(fetchParams, true);
          }}
        />
        <span style={styles.viewFilterText}>
          {isLeaderAt12 ? "VIEW ALL(My Disciples)" : "VIEW ALL"}
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
            setCurrentPage(1);
            const fetchParams = {
              page: 1,
              limit: rowsPerPage,
              start_date: DEFAULT_API_START_DATE,
              // ✅ CRITICAL: Always send CELLS as event_type when toggle is visible
              event_type: "CELLS"
            };

            if (isLeaderAt12) {
              // ✅ FIXED: Leader at 12 - "MY CELLS ONLY" = show only their personal cells
              fetchParams.show_personal_cells = true;
              fetchParams.show_all_authorized = false;
              fetchParams.include_subordinate_cells = false;
            } else if (isAdmin) {
              // Admin - "MY CELLS ONLY" = show only their personal events
              fetchParams.personal = true;
            }

            console.log("🔍 MY CELLS ONLY selected - fetching:", fetchParams);
            fetchEvents(fetchParams, true);
          }}
        />
        <span style={styles.viewFilterText}>
          {isLeaderAt12 ? "PERSONAL" : "PERSONAL"}
        </span>
      </label>
    </div>
  );
};

const EventTypeSelector = ({
  eventTypes,
  selectedEventTypeFilter,
  setSelectedEventTypeFilter,
  fetchEvents,
  setCurrentPage,
  rowsPerPage,
  selectedStatus,
  searchQuery,
  viewFilter,
  userRole,
  customEventTypes,
  setSelectedEventTypeObj,
  DEFAULT_API_START_DATE,
  isLeaderAt12,
  isAdmin,
  isRegistrant,
  isRegularUser
}) => {
  const [hoveredType, setHoveredType] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTypeForMenu, setSelectedTypeForMenu] = useState(null);
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('lg'));
  const isDarkMode = theme.palette.mode === 'dark';
  const eventTypeStyles = getEventTypeStyles(isDarkMode, theme);

  console.log("🎯 EventTypeSelector - Role Check:", {
    isLeaderAt12,
    isAdmin,
    isRegistrant,
    isRegularUser,
    userRole
  });

  // ✅ FIXED: "All Events" now means "All CELLS Events" only
  const allTypes = useMemo(() => {
    // Get all available event types from your database/API
    const availableTypes = eventTypes.map(t => t.name || t).filter(name => name && name !== "all");

    if (isAdmin || isRegistrant) {
      console.log("👑 Admin/Registrant - Showing ALL event types including:", availableTypes);
      // For admins and registrants, show "All Events" (which means All CELLS) plus other event types
      const adminTypes = ["all"]; // "all" now means "All CELLS Events"
      
      // Add all other event types
      availableTypes.forEach(type => {
        if (type !== "CELLS") { // CELLS is already covered by "all"
          adminTypes.push(type);
        }
      });
      
      return adminTypes;
    }
    else if (isLeaderAt12) {
      console.log("👥 Leader at 12 - Showing: ALL CELLS and Global Events");
      const leaderTypes = ["all"]; // "all" means "All CELLS Events"
      
      // Add Global Events and other types except CELLS (already covered by "all")
      availableTypes.forEach(type => {
        if (type !== "CELLS") {
          leaderTypes.push(type);
        }
      });

      console.log("📋 Leader at 12 event types:", leaderTypes);
      return leaderTypes;
    }
    else {
      console.log("👤 Regular User/Other - Showing only CELLS");
      // Regular users and other leaders ONLY see CELLS
      return ["all"]; // "all" means "All CELLS Events" for regular users
    }
  }, [eventTypes, isAdmin, isLeaderAt12, isRegistrant, isRegularUser]);

  const getDisplayName = (type) => {
    if (!type) return "";
    if (type === "all") {
      return "ALL CELLS";
    }
    return typeof type === "string" ? type : type.name || String(type);
  };

  const getTypeValue = (type) => {
    if (type === "all") return "all";
    return typeof type === "string" ? type : type.name || String(type);
  };

  const handleEventTypeClick = (typeValue) => {
    if (selectedEventTypeFilter === typeValue) {
      fetchEvents({}, true);
      return;
    }

    setSelectedEventTypeFilter(typeValue);
    setCurrentPage(1);

    // ✅ FIXED: Reset view filter to "all" when switching to non-CELLS event types
    if (typeValue !== 'all' && typeValue !== 'CELLS') {
      setViewFilter('all');
    }

    const selectedTypeObj = customEventTypes.find(
      (et) => et.name?.toLowerCase() === typeValue.toLowerCase()
    );

    if (selectedTypeObj) {
      setSelectedEventTypeObj(selectedTypeObj);
    } else {
      setSelectedEventTypeObj(null);
    }

    // ✅ FIXED: Handle personal filtering correctly for each role
    const fetchParams = {
      page: 1,
      limit: rowsPerPage,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: searchQuery.trim() || undefined,
      start_date: DEFAULT_API_START_DATE
    };

    // CRITICAL: Handle event type filtering
    if (typeValue === "all") {
      // "All Events" means ONLY CELLS events
      fetchParams.event_type = "CELLS";
    } else {
      // Specific event type selected
      fetchParams.event_type = typeValue;
    }

    // ✅ Only apply personal filtering for CELLS events
    if ((typeValue === 'all' || typeValue === 'CELLS')) {
      if (isAdmin && viewFilter === 'personal') {
        fetchParams.personal = true;
      } else if (isLeaderAt12) {
        // Handle Leader at 12 parameters
        if (viewFilter === 'personal') {
          fetchParams.show_personal_cells = true;
          fetchParams.show_all_authorized = false;
        } else {
          fetchParams.show_personal_cells = false;
          fetchParams.show_all_authorized = true;
        }
      }
    }

    console.log("🔍 Fetching events with params:", fetchParams);
    fetchEvents(fetchParams, true);
  };

  // ✅ NEW: Handle menu open
  const handleMenuOpen = (event, type) => {
    event.stopPropagation(); // Prevent event type selection
    setMenuAnchor(event.currentTarget);
    setSelectedTypeForMenu(type);
  };

  // ✅ NEW: Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedTypeForMenu(null);
  };

  // ✅ NEW: Handle edit event type
  const handleEditEventType = () => {
    if (selectedTypeForMenu && selectedTypeForMenu !== 'all') {
      // Find the full event type object
      const eventTypeToEdit = eventTypes.find(
        et => et.name?.toLowerCase() === selectedTypeForMenu.toLowerCase()
      ) || { name: selectedTypeForMenu };
      
      setEditingEventType(eventTypeToEdit);
      setEventTypesModalOpen(true);
    }
    handleMenuClose();
  };

  // ✅ NEW: Handle delete event type
  const handleDeleteEventType = () => {
    if (selectedTypeForMenu && selectedTypeForMenu !== 'all') {
      setToDeleteType(selectedTypeForMenu);
      setConfirmDeleteOpen(true);
    }
    handleMenuClose();
  };

  const shouldShowSelector = isAdmin || isRegistrant || isLeaderAt12 || isRegularUser;
  
  if (!shouldShowSelector) {
    return null;
  }

  return (
    <div style={eventTypeStyles.container}>
      <div style={eventTypeStyles.header}>
        {isAdmin ? "Event Types" :
          isRegistrant ? "Event Types (Your Cells Only)" :
            isLeaderAt12 ? "Cells & Global Events" :
              "Your Cells"}
      </div>

      <div style={eventTypeStyles.selectedTypeDisplay}>
        <div style={eventTypeStyles.checkIcon}>✓</div>
        <span>
          {selectedEventTypeFilter === 'all' && isLeaderAt12 ? "ALL CELLS (My Disciples)" : getDisplayName(selectedEventTypeFilter)}
        </span>
      </div>

      <div style={eventTypeStyles.typesGrid}>
        {allTypes.map((type) => {
          const displayName = getDisplayName(type);
          const typeValue = getTypeValue(type);
          const isActive = selectedEventTypeFilter === typeValue;
          const isHovered = hoveredType === typeValue;
          const showMenu = isAdmin && typeValue !== 'all'; // Only show menu for admins and non-"all" types

          return (
            <div
              key={typeValue}
              style={{
                ...eventTypeStyles.typeCard,
                ...(isActive ? eventTypeStyles.typeCardActive : {}),
                ...(isHovered && !isActive ? eventTypeStyles.typeCardHover : {}),
                position: "relative",
                minWidth: isMobileView ? "120px" : "150px",
                minHeight: "60px",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "visible",
              }}
              onClick={() => handleEventTypeClick(typeValue)}
              onMouseEnter={() => setHoveredType(typeValue)}
              onMouseLeave={() => setHoveredType(null)}
            >
              <span
                style={{
                  ...eventTypeStyles.typeName,
                  ...(isActive ? eventTypeStyles.typeNameActive : {}),
                  zIndex: 1,
                  textAlign: "center",
                }}
              >
                {displayName}
              </span>

              {/* ✅ NEW: Three dots menu button */}
              {showMenu && (
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, typeValue)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                    },
                    color: isDarkMode ? '#fff' : '#000',
                    fontSize: '16px',
                    padding: '2px',
                    minWidth: 'auto',
                  }}
                >
                  ⋮
                </IconButton>
              )}
            </div>
          );
        })}
      </div>

      {/* ✅ NEW: Menu Popover */}
      <Popover
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
            color: isDarkMode ? theme.palette.text.primary : '#000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            minWidth: '120px',
          },
        }}
      >
        <MenuItem onClick={handleEditEventType} sx={{ fontSize: '14px' }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteEventType} 
          sx={{ 
            fontSize: '14px',
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: theme.palette.error.light + '20',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Popover>
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
        <EventTypeSelector
          eventTypes={eventTypes}
          selectedEventTypeFilter={selectedEventTypeFilter}
          setSelectedEventTypeFilter={setSelectedEventTypeFilter}
          fetchEvents={fetchEvents}
          setCurrentPage={setCurrentPage}
          rowsPerPage={rowsPerPage}
          selectedStatus={selectedStatus}
          searchQuery={searchQuery}
          viewFilter={viewFilter}
          userRole={userRole}
          customEventTypes={customEventTypes}
          setSelectedEventTypeObj={setSelectedEventTypeObj}
          DEFAULT_API_START_DATE={DEFAULT_API_START_DATE}
          isLeaderAt12={isLeaderAt12}
          isAdmin={isAdmin}
          isRegistrant={isRegistrant}
          isRegularUser={isRegularUser}
        />

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
          <StatusBadges
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            setCurrentPage={setCurrentPage}
          />
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
const dayOfWeek = (() => {
  if (event.day && event.day.trim()) {
    return event.day;
  }
  if (event.recurring_day && Array.isArray(event.recurring_day) && event.recurring_day.length > 0) {
    return event.recurring_day[0];
  }
  if (event.recurring_day && typeof event.recurring_day === 'string') {
    return event.recurring_day;
  }
  if (event.renocaming === false || event.recurring === false) {
    return 'One-time';
  }
  return 'Not set';
})();
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

      {isAdmin && (
        <Box sx={{
          position: 'fixed', 
          bottom: '24px',
          right: '24px',
          zIndex: 1300, 
        }}>
          {fabMenuOpen && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1299,
                backgroundColor: 'transparent',
              }}
              onClick={() => setFabMenuOpen(false)}
            />
          )}

          {/* FAB Menu Items */}
          <Box
            sx={{
              ...fabStyles.fabMenu,
              opacity: fabMenuOpen ? 1 : 0,
              visibility: fabMenuOpen ? 'visible' : 'hidden',
              transform: fabMenuOpen ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: fabMenuOpen ? 'auto' : 'none',
            }}
          >
            <Box
              sx={fabStyles.fabMenuItem}
              onClick={() => {
                setFabMenuOpen(false);
                setEventTypesModalOpen(true);
                setEditingEventType(null);
              }}
              role="button"
              tabIndex={fabMenuOpen ? 0 : -1}
              aria-label="Create Event Type"
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
              role="button"
              tabIndex={fabMenuOpen ? 0 : -1}
              aria-label="Create Event"
            >
              <Typography sx={fabStyles.fabMenuLabel}>Create Event</Typography>
              <Box sx={fabStyles.fabMenuIcon}>📅</Box>
            </Box>
          </Box>

          {/* Main FAB Button */}
          <IconButton
            sx={{
              backgroundColor: "#007bff",
              color: "white",
              width: 56,
              height: 56,
              '&:hover': {
                backgroundColor: "#0056b3",
                transform: 'scale(1.05)',
              },
              transform: fabMenuOpen ? 'rotate(45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              position: 'relative',
              zIndex: 1301, // Higher than menu items
            }}
            onClick={() => setFabMenuOpen(!fabMenuOpen)}
            aria-label={fabMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={fabMenuOpen}
            aria-haspopup="true"
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
    key={editingEventType?._id || "create"} 
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
  onClose={handleCloseEditModal}  
  event={selectedEvent}
  onSave={handleSaveEvent}
/>

    <Snackbar
  open={snackbar.open}
  autoHideDuration={6000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{
    vertical: 'top',
    horizontal: 'center',
  }}
  sx={{
    '& .MuiSnackbar-root': {
      top: '80px', // Adjust this value to position below your header
    },
    '& .MuiAlert-root': {
      fontSize: '1rem',
      fontWeight: '500',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }
  }}
>
  <Alert 
    severity={snackbar.severity} 
    onClose={() => setSnackbar({ ...snackbar, open: false })}
    sx={{
      width: '100%',
      fontSize: '1rem',
      fontWeight: '500',
    }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
    </Box>
  );
};

export default Events;