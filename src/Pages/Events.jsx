import axios from "axios";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Tooltip from "@mui/material/Tooltip";
import { Box, useMediaQuery, LinearProgress, TextField, InputAdornment } from "@mui/material";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
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
import { useNavigate } from "react-router-dom";

import Eventsfilter from "./AddPersonToEvents";
import CreateEvents from "./CreateEvents";
import EventTypesModal from "./EventTypesModal";
import EditEventModal from "./EditEventModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


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
    // backgroundColor: "#007bff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "bold",
  },
};

const getEventTypeStyles = (isDarkMode, theme, isMobileView) => ({
  container: {
    backgroundColor: isDarkMode ? theme.palette.background.paper : "#f8f9fa",
    borderRadius: "16px",
    padding: isMobileView ? "1rem" : "1.5rem",
    marginBottom: isMobileView ? "0.75rem" : "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: `1px solid ${isDarkMode ? theme.palette.divider : "#e9ecef"}`,
    position: "relative",
    color: isDarkMode ? theme.palette.text.primary : "inherit",
  },
  header: {
    fontSize: isMobileView ? "0.75rem" : "0.875rem",
    fontWeight: "600",
    color: isDarkMode ? theme.palette.text.secondary : "#6c757d",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: isMobileView ? "0.5rem" : "1rem",
  },
  selectedTypeDisplay: {
    fontSize: isMobileView ? "1rem" : "1.25rem",
    fontWeight: "700",
    color: isDarkMode ? theme.palette.primary.main : "#007bff",
    marginBottom: isMobileView ? "0.5rem" : "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  checkIcon: {
    width: isMobileView ? "20px" : "24px",
    height: isMobileView ? "20px" : "24px",
    borderRadius: "50%",
    backgroundColor: "#28a745",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobileView ? "12px" : "14px",
    fontWeight: "bold",
  },
  typesGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: isMobileView ? "0.5rem" : "0.75rem",
  },
  typeCard: {
    padding: isMobileView ? "0.6rem 0.8rem" : "1rem",
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
    fontSize: isMobileView ? "0.75rem" : "0.9rem",
    fontWeight: "600",
    color: isDarkMode ? theme.palette.text.primary : "#495057",
    textAlign: "center",
    display: "block",
  },
  typeNameActive: {
    color: "#007bff",
  },
});

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

const generateDynamicColumns = (events, isOverdue, selectedEventTypeFilter) => {
  if (!events || events.length === 0) return [];

  const sampleEvent = events[0];
  const filteredFields = Object.keys(sampleEvent).filter((key) => {
    const keyLower = key.toLowerCase();

    // Fields to exclude
    const excludedFields = [
      'persistent_attendees', 'uuid', 'did_not_meet', 'status', 'is_recurring',
      'week_identifier', 'attendees', '_id', 'isoverdue', 'attendance', 'location',
      'eventtype', 'event_type', 'eventtypes', 'status', 'displaydate', 'originatedid',
      'leader12', 'leader@12', 'leader at 12', 'original_event_id', '_is_overdue',
      'haspersonsteps', 'haspersonsteps', 'has_person_steps'
    ];

    const exactMatch = excludedFields.includes(key);
    const caseInsensitiveMatch = excludedFields.some(excluded =>
      excluded.toLowerCase() === keyLower
    );

    // Also exclude fields that contain these words
    const containsOverdue = keyLower.includes('overdue');
    const containsDisplayDate = keyLower.includes('display') && keyLower.includes('date');
    const containsOriginated = keyLower.includes('originated');
    const containsLeader12 = keyLower.includes('leader') && keyLower.includes('12');
    const containsLeader1 = keyLower.includes('leader1') || keyLower.includes('leader@1') || keyLower.includes('leader at 1');
    const shouldExcludeLeader1 = containsLeader1 &&
      selectedEventTypeFilter !== 'all' &&
      selectedEventTypeFilter !== 'CELLS' &&
      selectedEventTypeFilter !== 'Cells';

    const containsPersonSteps = keyLower.includes('person') && keyLower.includes('steps');
    const shouldExclude = exactMatch || caseInsensitiveMatch || containsOverdue ||
      containsDisplayDate || containsOriginated || containsLeader12 || shouldExcludeLeader1 ||
      containsPersonSteps;

    return !shouldExclude;
  });

  const columns = [];

  columns.push({
    field: 'overdue',
    headerName: 'Status',
    flex: 0.8,
    minWidth: 100,
    renderCell: (params) => {
      const isOverdueEvent = isOverdue(params.row);
      const status = params.row.status || 'incomplete';

      // Only show OVERDUE for Cells
      if (isOverdueEvent && (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS')) {
        return (
          <Box
            sx={{
              color: '#dc3545',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              width: '100%',
            }}
          >
            OVERDUE
          </Box>
        );
      }

      return (
        <Box
          sx={{
            color: status === 'complete' ? '#28a745' : status === 'did_not_meet' ? '#dc3545' : '#6c757d',
            fontWeight: '500',
            fontSize: '0.8rem',
            textTransform: 'capitalize',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {status.replace('_', ' ')}
        </Box>
      );
    },
  });

  // Add other filtered fields
  columns.push(...filteredFields.map((key) => ({
    field: key,
    headerName: key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase()),
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      const value = params.value;
      if (key.toLowerCase().includes('date')) return formatDate(value);
      if (!value) return '-';

      return (
        <Box
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 180,
          }}
          title={String(value)}
        >
          {String(value)}
        </Box>
      );
    },
  })));

  return columns;
}

const MobileEventCard = ({
  event,
  onOpenAttendance,
  onEdit,
  onDelete,
  isOverdue,
  formatDate,
  theme,
  styles,
  isAdmin,
  isLeaderAt12,
  currentUserLeaderAt1,
  selectedEventTypeFilter
}) => {
  if (!theme) {
    return <Box sx={{ height: 100 }} />;
  }
  const isDark = theme.palette.mode === 'dark';
  const borderColor = isDark ? theme.palette.divider : '#e9ecef';

  const attendeesCount = event.attendees?.length || 0;
  const persistentAttendeesCount = event.persistent_attendees?.length || 0;

  const isCellEvent = selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS' || selectedEventTypeFilter === 'Cells';

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

      {isCellEvent && (
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Leader @1:</span>
          <span style={styles.mobileCardValue}>{event.leader1 || 'N/A'}</span>
        </div>
      )}

      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Leader @12:</span>
        <span style={styles.mobileCardValue}>{event.leader12 || 'N/A'}</span>
      </div>

      <div style={styles.mobileActions}>
        <Tooltip title={`View Attendance (${attendeesCount} people)`}>
          <IconButton onClick={() => onOpenAttendance(event)} size="small" sx={{ color: theme.palette.primary.main }}>
            <CheckBoxIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Event">
          <IconButton onClick={() => onEdit(event)} size="small" sx={{ color: '#ffc107' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isAdmin && (
          <Tooltip title="Delete Event">
            <IconButton onClick={() => onDelete(event)} size="small" sx={{ color: theme.palette.error.main }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

const Events = () => {
  const location = useLocation();
  const theme = useTheme();

  const isMobileView = useMediaQuery(theme.breakpoints.down('lg'));
  const isDarkMode = theme.palette.mode === 'dark';
  const eventTypeStyles = useMemo(() => {
    return getEventTypeStyles(isDarkMode, theme);
  }, [isDarkMode, theme]);

  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const userRole = currentUser?.role?.toLowerCase() || "";

  console.log("USER ROLE DEBUG:", {
    currentUser,
    userRole: currentUser?.role,
    userRoleLower: userRole,
    rawUserProfile: localStorage.getItem("userProfile")
  });


  const isAdmin = userRole === "admin";
  const isRegistrant = userRole === "registrant";
  const isRegularUser = userRole === "user";
  const isOtherLeader =
    userRole.includes("leader at 144") ||
    userRole.includes("leader at 1278") ||
    userRole.includes("leader at 1728");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const DEFAULT_API_START_DATE = '2025-11-01';

  // State declarations - ALL AT THE TOP
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
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserLeaderAt1, setCurrentUserLeaderAt1] = useState('');
  const [typeMenuAnchor, setTypeMenuAnchor] = useState(null);
  const [typeMenuFor, setTypeMenuFor] = useState(null);
  const [isCheckingLeaderStatus, setIsCheckingLeaderStatus] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [toDeleteType, setToDeleteType] = useState(null);
  const [eventTypesModalOpen, setEventTypesModalOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [isLeaderAt12, setIsLeaderAt12] = useState(false);
  const navigate = useNavigate();

  const initialViewFilter = useMemo(() => {
    if (isLeaderAt12) {
      return 'all';
    } else if (isRegularUser || isRegistrant) {
      return 'personal';
    } else if (isAdmin) {
      return 'all';
    }
    return 'all';
  }, [userRole, isLeaderAt12, isRegularUser, isRegistrant]);

  const [viewFilter, setViewFilter] = useState(initialViewFilter);
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
    console.log(" Cache cleared");
  }, []);

  const paginatedEvents = useMemo(() => events, [events]);
  const startIndex = useMemo(() => {
    return totalEvents > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  }, [currentPage, rowsPerPage, totalEvents]);
  const endIndex = useMemo(() => {
    return Math.min(currentPage * rowsPerPage, totalEvents);
  }, [currentPage, rowsPerPage, totalEvents]);

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
  }

  useEffect(() => {
    const checkLeaderAt12Status = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }

        // const response = await axios.get(
        //   `${BACKEND_URL}/check-leader-at-12-status`,
        //   {
        //     headers: { Authorization: `Bearer ${token}` },
        //     timeout: 10000,
        //   }
        // );

       console.log("Leader at 12 status check:", JSON.parse(localStorage.getItem("leaders")));

        //setting isLeader at 12 depending on if leader at 12 exists in leaders json stored in local storage

        setIsLeaderAt12(!JSON.parse(localStorage.getItem("leaders")).leaderAt12 || false); 
      } catch (error) {
        console.error("Error checking Leader at 12 status:", error);
        setIsLeaderAt12(false);
      }
    };

    checkLeaderAt12Status();
  }, [BACKEND_URL]);

 const fetchEvents = useCallback(async (filters = {}, forceRefresh = false, showLoader = true) => {
    console.log("fetchEvents - START", {
      filters,
      forceRefresh,
      showLoader,
      isLeaderAt12,
      isAdmin,
      isRegistrant,
      viewFilter,
      currentUserLeaderAt1
    });

    if (showLoader) {
      setLoading(true);
      setIsLoading(true);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in again");
        setTimeout(() => window.location.href = '/login', 2000);
        setEvents([]);
        setFilteredEvents([]);
        if (showLoader) {
          setLoading(false);
          setIsLoading(false);
        }
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const startDateParam = filters.start_date || DEFAULT_API_START_DATE;

      console.log("CURRENT USER", currentUser);
      
      const params = {
        page: filters.page !== undefined ? filters.page : currentPage,
        limit: filters.limit !== undefined ? filters.limit : rowsPerPage,
        start_date: startDateParam,
        ...filters,
        isLeaderAt12 
      };

      if (selectedEventTypeFilter && selectedEventTypeFilter !== 'CELLS' && selectedEventTypeFilter !== 'all' && !params.event_type) {
        params.event_type = selectedEventTypeFilter;
      }

      if (!filters.status && params.status) {
        delete params.status;
      }

      const isCellRequest = params.event_type === 'CELLS' || params.event_type === 'all' || !params.event_type;
      const isEventTypeRequest = !isCellRequest;

      console.log("Request Type:", {
        isCellRequest,
        isEventTypeRequest,
        event_type: params.event_type,
        status: params.status
      });

      if (isEventTypeRequest) {
        console.log("EVENT TYPE MODE - Removing all personal/leader filters");
        delete params.personal;
        delete params.leader_at_12_view;
        delete params.show_personal_cells;
        delete params.show_all_authorized;
        delete params.include_subordinate_cells;
        delete params.leader_at_1_identifier;

        if (!filters.status) {
          delete params.status;
        }
      } else {
        console.log("CELL MODE - Applying role-based filters");

        if (isRegistrant || isRegularUser) {
          params.personal = true;
        } else if (isLeaderAt12) {
          params.leader_at_12_view = true;
          params.include_subordinate_cells = true;

          if (currentUserLeaderAt1) {
            params.leader_at_1_identifier = currentUserLeaderAt1;
          }

          if (viewFilter === 'personal') {
            params.show_personal_cells = true;
            params.personal = true;
          } else {
            params.show_all_authorized = true;
            params.include_subordinate_cells = true;
          }
        }
      }

      let endpoint;
      if (isCellRequest) {
        endpoint = `${BACKEND_URL}/events/cells`;
        console.log("Using CELLS endpoint");
      } else {
        endpoint = `${BACKEND_URL}/events/other`;
        console.log("Using OTHER EVENTS endpoint for event type:", params.event_type);
      }

      Object.keys(params).forEach(key => (params[key] === undefined || params[key] === null) && delete params[key]);

      console.log('Final API call details:', {
        endpoint,
        params: JSON.stringify(params, null, 2),
        userRole: userRole
      });

      const cacheKey = getCacheKey({ ...params, userRole, endpoint });

      if (!forceRefresh) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          console.log("Using cached data");
          setEvents(cachedData.events);
          setFilteredEvents(cachedData.events);
          setTotalEvents(cachedData.total_events);
          setTotalPages(cachedData.total_pages);
          if (filters.page !== undefined) setCurrentPage(filters.page);
          if (showLoader) {
            setLoading(false);
            setIsLoading(false);
          }
          return;
        }
      }

      console.log("Making fresh API call");
      const response = await axios.get(endpoint, {
        headers,
        params,
        timeout: 60000
      });

      const responseData = response.data;
      const newEvents = responseData.events || responseData.results || [];

      console.log('BACKEND RESPONSE:', responseData);
      console.log('Total events:', responseData.total_events);
      console.log('Events found:', newEvents.length);

      if (newEvents.length > 0) {
        console.log('Events sample:', newEvents.slice(0, 3).map(e => ({
          name: e.eventName,
          type: e.eventType,
          typeName: e.eventTypeName,
          status: e.status,
          id: e._id
        })));
      } else {
        console.log('No events returned');

        if (isEventTypeRequest) {
          console.log('Empty results for event type:', params.event_type);
        }
      }

      const totalEventsCount = responseData.total_events || responseData.total || newEvents.length;
      const totalPagesCount = responseData.total_pages || Math.ceil(totalEventsCount / rowsPerPage) || 1;

      setCachedData(cacheKey, {
        events: newEvents,
        total_events: totalEventsCount,
        total_pages: totalPagesCount
      });

      setEvents(newEvents);
      setFilteredEvents(newEvents);
      setTotalEvents(totalEventsCount);
      setTotalPages(totalPagesCount);
      if (filters.page !== undefined) setCurrentPage(filters.page);

      console.log("fetchEvents - COMPLETE");

    } catch (err) {
      console.error("Error fetching events:", err);
      if (axios.isCancel(err) || err.code === 'ECONNABORTED') {
        toast.warning("Request timeout. Please refresh and try again.");
      } else if (err.response?.status === 401) {
        toast.error("Session expired. Logging out...");
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Please check your connection and try again.';
        toast.error(`Error loading events: ${errorMessage}`);
      }
      setEvents([]);
      setFilteredEvents([]);
      setTotalEvents(0);
      setTotalPages(1);
    } finally {
      if (showLoader) {
        setLoading(false);
        setIsLoading(false);
      }
    }
  }, [
    currentPage,
    rowsPerPage,
    selectedStatus,
    selectedEventTypeFilter, 
    searchQuery,
    viewFilter,
    userRole,
    isLeaderAt12,
    isAdmin,
    isRegistrant,
    currentUserLeaderAt1,
    getCacheKey,
    getCachedData,
    setCachedData,
    BACKEND_URL,
    DEFAULT_API_START_DATE
  ]);

  const checkEventsForType = async (eventTypeName) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BACKEND_URL}/events/other`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          event_type: eventTypeName,
          limit: 100
        }
      });

      console.log(`Events using "${eventTypeName}":`, {
        count: response.data.events?.length || 0,
        events: response.data.events?.map(e => ({
          id: e._id,
          name: e.eventName,
          type: e.eventType,
          typeName: e.eventTypeName
        }))
      });

      return response.data.events || [];
    } catch (error) {
      console.error('Error checking events for type:', error);
      return [];
    }
  };

  // Call this when you try to delete
  // const handleDeleteEventType = () => {
  //   if (selectedTypeForMenu && selectedTypeForMenu !== 'all') {
  //     console.log("Attempting to delete event type:", selectedTypeForMenu);

  //     // Debug: Check what events are using this type
  //     checkEventsForType(selectedTypeForMenu);

  //     const exactEventType = eventTypes.find(et => {
  //       const etName = et.name || et.eventType || et.eventTypeName || '';
  //       return etName.toLowerCase() === selectedTypeForMenu.toLowerCase();
  //     });

  //     const typeToDelete = exactEventType ?
  //       (exactEventType.name || exactEventType.eventType || exactEventType.eventTypeName) :
  //       selectedTypeForMenu;

  //     console.log("Final type to delete:", typeToDelete);
  //     setToDeleteType(typeToDelete);
  //     setConfirmDeleteOpen(true);
  //   }
  //   handleMenuClose();
  // };

  const handleStatusFilterChange = useCallback((newStatus) => {
    console.log(" Status filter changing to:", newStatus);

    setSelectedStatus(newStatus);
    setCurrentPage(1);

    const shouldApplyPersonalFilter =
      viewFilter === 'personal' &&
      (userRole === "admin" || userRole === "leader at 12");

    const fetchParams = {
      page: 1,
      limit: rowsPerPage,
      status: newStatus !== 'all' ? newStatus : undefined,
      start_date: DEFAULT_API_START_DATE,
      _t: Date.now(),
      ...(searchQuery.trim() && { search: searchQuery.trim() }),
      ...(selectedEventTypeFilter !== 'all' && { event_type: selectedEventTypeFilter }),
      ...(shouldApplyPersonalFilter && { personal: true }),
      // Leader at 12 params
      ...(isLeaderAt12 && {
        leader_at_12_view: true,
        include_subordinate_cells: true,
        ...(currentUserLeaderAt1 && { leader_at_1_identifier: currentUserLeaderAt1 }),
        ...(viewFilter === 'personal' ?
          { show_personal_cells: true, personal: true } :
          { show_all_authorized: true }
        )
      })
    };

    if (newStatus === 'all') {
      delete fetchParams.status;
    }

    console.log(" Fetching with status params:", fetchParams);
    fetchEvents(fetchParams, true, true);
  }, [
    viewFilter,
    userRole,
    rowsPerPage,
    searchQuery,
    selectedEventTypeFilter,
    isLeaderAt12,
    currentUserLeaderAt1,
    fetchEvents,
    DEFAULT_API_START_DATE
  ]);

  const fetchEventTypes = useCallback(async () => {
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
      console.log('RAW EVENT TYPES FROM API:', eventTypesData);

      const actualEventTypes = eventTypesData.filter(item => item.isEventType === true);
      console.log('FILTERED EVENT TYPES:', actualEventTypes);

      // Don't uppercase here - keep original names for matching
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
          const uppercasedCached = parsed.map(type => ({
            ...type,
            name: type.name ? type.name.toUpperCase() : type.name,
            displayName: type.name ? type.name.toUpperCase() : type.name
          }));
          setEventTypes(uppercasedCached);
          setCustomEventTypes(uppercasedCached);
          setUserCreatedEventTypes(uppercasedCached);
          return uppercasedCached;
        }
      } catch (cacheError) {
        console.error('Cache read failed:', cacheError);
      }
      return [];
    }
  }, [BACKEND_URL]);


  const refreshAfterEventTypeUpdate = useCallback(async (oldName, newName) => {
    try {
      console.log(" Simple refresh after event type update:", { oldName, newName });

      if (selectedEventTypeFilter === oldName) {
        setSelectedEventTypeFilter(newName);
      }

      clearCache();
      await fetchEventTypes();

      setTimeout(() => {
        const refreshParams = {
          page: 1,
          limit: rowsPerPage,
          start_date: DEFAULT_API_START_DATE,
          _t: Date.now(),
          event_type: newName
        };

        if (selectedStatus !== 'all') refreshParams.status = selectedStatus;
        if (searchQuery.trim()) refreshParams.search = searchQuery.trim();

        console.log("Auto-refreshing events with:", refreshParams);
        fetchEvents(refreshParams, true);
      }, 300);

    } catch (error) {
      console.error("Error in refreshAfterEventTypeUpdate:", error);
    }
  }, [selectedEventTypeFilter, clearCache, fetchEventTypes, rowsPerPage, selectedStatus, searchQuery, fetchEvents, DEFAULT_API_START_DATE]);

  const debugCurrentSituation = async () => {
    console.log("DEBUG: Current situation");

    try {
      const token = localStorage.getItem("token");

      const oldTypeResponse = await axios.get(`${BACKEND_URL}/events/other`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { event_type: "Conference", limit: 10 }
      });

      const newTypeResponse = await axios.get(`${BACKEND_URL}/events/other`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { event_type: "Conferencetest", limit: 10 }
      });

      // Test 3: Check all events
      const allResponse = await axios.get(`${BACKEND_URL}/events/other`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });

      console.log("DEBUG RESULTS:", {
        oldTypeEvents: oldTypeResponse.data.events?.length,
        newTypeEvents: newTypeResponse.data.events?.length,
        allEvents: allResponse.data.events?.length,
        sampleNewEvents: newTypeResponse.data.events?.map(e => ({
          name: e.eventName,
          type: e.eventType,
          typeName: e.eventTypeName
        })),
        sampleAllEvents: allResponse.data.events?.map(e => ({
          name: e.eventName,
          type: e.eventType,
          typeName: e.eventTypeName
        }))
      });

    } catch (error) {
      console.error("DEBUG Error:", error);
    }
  };


  const getCurrentUserLeaderAt1 = useCallback(async () => {
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
  }, [BACKEND_URL]);

  const clearAllFilters = useCallback(() => {
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
  }, [viewFilter, userRole, fetchEvents, rowsPerPage, DEFAULT_API_START_DATE]);


  const handleSearchSubmit = useCallback(() => {
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
  }, [searchQuery, userRole, viewFilter, fetchEvents, rowsPerPage, selectedStatus, selectedEventTypeFilter, DEFAULT_API_START_DATE]);

  const handleRowsPerPageChange = useCallback((e) => {
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
  }, [viewFilter, userRole, fetchEvents, selectedStatus, searchQuery, selectedEventTypeFilter, DEFAULT_API_START_DATE]);

  const handleNextPage = useCallback(() => {
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
  }, [currentPage, totalPages, isLoading, viewFilter, userRole, fetchEvents, rowsPerPage, selectedStatus, selectedEventTypeFilter, searchQuery, DEFAULT_API_START_DATE]);

  const handlePreviousPage = useCallback(() => {
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
  }, [currentPage, isLoading, viewFilter, userRole, fetchEvents, rowsPerPage, selectedStatus, selectedEventTypeFilter, searchQuery, DEFAULT_API_START_DATE]);

  const handleCaptureClick = useCallback((event) => {
    setSelectedEvent(event);
    setAttendanceModalOpen(true);
  }, []);


  const handleCloseCreateEventModal = useCallback((shouldRefresh = false) => {
    console.log("Closing create event modal, shouldRefresh:", shouldRefresh);

    setCreateEventModalOpen(false);

    if (shouldRefresh) {
      console.log("Modal requested refresh, forcing complete reload...");

      clearCache();
      setCurrentPage(1);

      setTimeout(() => {
        const refreshParams = {
          page: 1,
          limit: rowsPerPage,
          start_date: DEFAULT_API_START_DATE,
          _t: Date.now(),
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        };

        // CRITICAL: Determine which endpoint to use based on event type
        if (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS' || !selectedEventTypeFilter) {
          refreshParams.event_type = "CELLS";

          if (isLeaderAt12) {
            refreshParams.leader_at_12_view = true;
            if (viewFilter === 'personal') {
              refreshParams.personal_cells_only = true;
            } else {
              refreshParams.include_subordinate_cells = true;
            }
          } else if (isAdmin && viewFilter === 'personal') {
            refreshParams.personal = true;
          }
        } else {
          // For Global Events and other event types
          refreshParams.event_type = selectedEventTypeFilter;
        }

        console.log("Refreshing events after creation:", refreshParams);
        fetchEvents(refreshParams, true);
      }, 800);
    }
  }, [
    clearCache,
    rowsPerPage,
    selectedStatus,
    selectedEventTypeFilter,
    searchQuery,
    isLeaderAt12,
    isAdmin,
    viewFilter,
    fetchEvents,
    DEFAULT_API_START_DATE
  ]);

  const applyFilters = useCallback((filters) => {
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
  }, [viewFilter, userRole, rowsPerPage, selectedStatus, selectedEventTypeFilter, searchQuery, fetchEvents, DEFAULT_API_START_DATE]);


  const handleAttendanceSubmit = useCallback(async (data) => {
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

      console.log("Sending payload to backend:", JSON.stringify(payload, null, 2));

      const response = await axios.put(
        `${BACKEND_URL.replace(/\/$/, "")}/submit-attendance/${eventId}`,
        payload,
        { headers }
      );

      console.log("Attendance submitted successfully");

      clearCache();

      // Close modal immediately
      setAttendanceModalOpen(false);
      setSelectedEvent(null);

      setSnackbar({
        open: true,
        message: payload.did_not_meet
          ? `${eventName} marked as 'Did Not Meet'.`
          : `Successfully captured attendance for ${eventName}`,
        severity: "success",
      });

      // Show toast immediately
      toast.success(
        payload.did_not_meet
          ? `${eventName} marked as 'Did Not Meet'.`
          : `Successfully captured attendance for ${eventName}`
      );

      // Refresh events after a delay
      setTimeout(() => {
        (async () => {
          try {
            const shouldApplyPersonalFilter =
              viewFilter === 'personal' &&
              (userRole === "admin" || userRole === "leader at 12");

            const refreshParams = {
              page: 1,
              limit: rowsPerPage,
              start_date: DEFAULT_API_START_DATE,
              _t: Date.now(),
              ...(searchQuery.trim() && { search: searchQuery.trim() }),
              ...(selectedEventTypeFilter !== 'all' && { event_type: selectedEventTypeFilter }),
              ...(selectedStatus !== 'all' && { status: selectedStatus }),
              ...(shouldApplyPersonalFilter && { personal: true }),
              ...(isLeaderAt12 && {
                leader_at_12_view: true,
                include_subordinate_cells: true,
                ...(currentUserLeaderAt1 && { leader_at_1_identifier: currentUserLeaderAt1 }),
                ...(viewFilter === 'personal' ?
                  { show_personal_cells: true, personal: true } :
                  { show_all_authorized: true }
                )
              })
            };

            console.log("Refreshing events after attendance WITH status filter:", refreshParams);
            await fetchEvents(refreshParams, true, true);

          } catch (refreshError) {
            console.error("Error refreshing events:", refreshError);
            toast.error("Failed to refresh events list");
          }
        })();
      }, 1000);

      return { success: true, message: "Attendance submitted successfully" };

    } catch (error) {
      console.error("Error submitting attendance:", error);

      let errorMessage = "Failed to submit attendance";
      let errData;

      try {
        errData = error.response?.data;
      } catch (e) {
        console.error("Error parsing error response:", e);
      }

      if (errData) {
        if (Array.isArray(errData?.errors)) {
          errorMessage = errData.errors.map(e => `${e.field}: ${e.message}`).join('; ');
        } else {
          errorMessage = errData.detail || errData.message || JSON.stringify(errData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error("Error details:", errorMessage);

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });

      toast.error(`Error: ${errorMessage}`);

      return { success: false, message: errorMessage };
    }
  }, [
    selectedEvent,
    currentUser,
    BACKEND_URL,
    clearCache,
    fetchEvents,
    rowsPerPage,
    searchQuery,
    selectedEventTypeFilter,
    selectedStatus,
    isLeaderAt12,
    currentUserLeaderAt1,
    viewFilter,
    userRole,
    DEFAULT_API_START_DATE
  ]);

  const handleEditEvent = useCallback((event) => {
    console.log("[handleEditEvent] Opening edit modal for event:", {
      name: event.eventName,
      _id: event._id,
      UUID: event.UUID,
      id: event.id,
      uuid: event.uuid,
      allKeys: Object.keys(event)
    });
    const eventToEdit = {
      ...event,
      _id: event._id || event.id || null,
      UUID: event.UUID || event.uuid || null,
    };

    if (!eventToEdit._id && !eventToEdit.UUID) {
      console.error(" No identifier found in event:", {
        event,
        eventToEdit,
        availableKeys: Object.keys(event)
      });
      toast.error("Cannot edit event: Missing identifier. Please refresh and try again.");

      return;
    }

    console.log(" Event prepared for editing:", {
      _id: eventToEdit._id,
      UUID: eventToEdit.UUID,
      name: eventToEdit.eventName,
      hasId: !!eventToEdit._id,
      hasUUID: !!eventToEdit.UUID
    });

    setSelectedEvent(eventToEdit);
    setEditModalOpen(true);
  }, []);

  const handleDeleteEvent = useCallback(async (event) => {
  if (window.confirm(`Are you sure you want to delete "${event.eventName}"?`)) {
    try {
      console.log("DELETE DEBUG - Current event type filter:", selectedEventTypeFilter);
      console.log("DELETE DEBUG - Current status filter:", selectedStatus);
      
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${BACKEND_URL}/events/${event._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status === 200) {
        console.log("DELETE DEBUG - Refreshing with filters:", {
          event_type: selectedEventTypeFilter,
          status: selectedStatus
        });
        
        const refreshFilters = {
          event_type: selectedEventTypeFilter
        };
        
        if (selectedStatus && selectedStatus !== 'all') {
          refreshFilters.status = selectedStatus;
        }
        
        if (searchQuery) {
          refreshFilters.search = searchQuery;
        }
        
        setTimeout(() => {
          fetchEvents(
            refreshFilters,  
            true,          
            false           
          );
        }, 100);
        
        toast.success("Event deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(error.response?.data?.message || "Failed to delete event");
    }
  }
}, [BACKEND_URL, fetchEvents, selectedEventTypeFilter, selectedStatus, searchQuery]);


  const handleSaveEvent = useCallback(async (eventData) => {
    try {
      console.log("[handleSaveEvent] Received event data:", eventData);

      const eventIdentifier = eventData._id || eventData.UUID || eventData.id;

      if (!eventIdentifier) {
        throw new Error("No event identifier (_id or UUID) found");
      }

      console.log("Updating event with identifier:", {
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
      console.log("PUT request to:", endpoint);

      const cleanPayload = Object.entries(eventData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});

      console.log("Sending payload:", cleanPayload);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(cleanPayload),
      });

      console.log(" Response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        let errorMessage;

        try {
          errorData = await response.json();
          console.error(" Server error response:", errorData);

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
        } catch (Error) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const updatedEvent = await response.json();
      console.log(" Event updated successfully from backend:", updatedEvent);

      console.log(" Clearing all caches and state...");
      clearCache();

      const cacheKeys = Object.keys(localStorage).filter(key => key.includes('events_cache') || key.includes('cache'));
      cacheKeys.forEach(key => localStorage.removeItem(key));

      await new Promise(resolve => setTimeout(resolve, 300));

      console.log("Forcing complete refresh of events...");

      const refreshParams = {
        page: currentPage,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        _t: Date.now()
      };

      if (selectedStatus && selectedStatus !== 'all') {
        refreshParams.status = selectedStatus;
      }

      if (searchQuery && searchQuery.trim()) {
        refreshParams.search = searchQuery.trim();
      }

      // CRITICAL: Determine which endpoint to use
      if (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS' || !selectedEventTypeFilter) {
        refreshParams.event_type = "CELLS";

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
      } else {
        refreshParams.event_type = selectedEventTypeFilter;
      }

      Object.keys(refreshParams).forEach(key =>
        refreshParams[key] === undefined && delete refreshParams[key]
      );

      console.log("Refreshing with params:", refreshParams);

      await fetchEvents(refreshParams, true);

      setTimeout(async () => {
        console.log("Double-checking with second refresh...");
        await fetchEvents(refreshParams, true);
      }, 1000);
      toast.success("Event updated successfully!");


      return { success: true, event: updatedEvent };

    } catch (error) {
      console.error(" Error in handleSaveEvent:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        fullError: error
      });

      const errorMessage = error.message || String(error) || "Failed to update event";

      toast.error("Failed to update event");

      throw new Error(errorMessage);
    }
  }, [BACKEND_URL, clearCache, currentPage, rowsPerPage, selectedStatus, searchQuery, selectedEventTypeFilter, userRole, isAdmin, viewFilter, fetchEvents, DEFAULT_API_START_DATE]);


  const handleCloseEditModal = useCallback(async (shouldRefresh = false) => {
    console.log("Closing edit modal, shouldRefresh:", shouldRefresh);

    setEditModalOpen(false);
    setSelectedEvent(null);

    if (shouldRefresh) {
      console.log("Modal requested refresh, forcing complete reload...");

      clearCache();

      await new Promise(resolve => setTimeout(resolve, 200));

      const refreshParams = {
        page: currentPage,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        _t: Date.now()
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

      // Add Leader at 12 params if needed
      if (isLeaderAt12 && (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS')) {
        refreshParams.leader_at_12_view = true;
        refreshParams.include_subordinate_cells = true;

        if (currentUserLeaderAt1) {
          refreshParams.leader_at_1_identifier = currentUserLeaderAt1;
        }

        if (viewFilter === 'personal') {
          refreshParams.show_personal_cells = true;
          refreshParams.personal = true;
        } else {
          refreshParams.show_all_authorized = true;
        }
      }

      Object.keys(refreshParams).forEach(key =>
        refreshParams[key] === undefined && delete refreshParams[key]
      );

      await fetchEvents(refreshParams, true);
    }
  }, [
    clearCache,
    currentPage,
    rowsPerPage,
    selectedStatus,
    searchQuery,
    selectedEventTypeFilter,
    fetchEvents,
    DEFAULT_API_START_DATE,
    isLeaderAt12,
    currentUserLeaderAt1,
    viewFilter
  ]);

  const openTypeMenu = useCallback((event, type) => {
    setTypeMenuAnchor(event.currentTarget);
    setTypeMenuFor(type);
  }, []);

  const closeTypeMenu = useCallback(() => {
    setTypeMenuAnchor(null);
    setTypeMenuFor(null);
  }, []);

  const handleEditType = useCallback(async (type) => {
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

      console.log("Setting editing event type:", eventTypeToEdit);
      closeTypeMenu();

      // FIXED: Set editing event type BEFORE opening modal
      setEditingEventType(eventTypeToEdit);

      // FIXED: Small delay to ensure state is set before modal opens
      setTimeout(() => {
        setEventTypesModalOpen(true);
      }, 100);

    } catch (error) {
      console.error("Error preparing event type for editing:", error);

      toast.error("Error loading event type data");
    }
  }, [eventTypes, closeTypeMenu]);

  const handleCloseEventTypesModal = useCallback(() => {
    console.log("🔒 Closing event types modal");
    setEventTypesModalOpen(false);

    setTimeout(() => {
      setEditingEventType(null);
    }, 300);
  }, []);


  const handleDeleteType = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please log in again");
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }

      const typeName = typeof toDeleteType === 'string'
        ? toDeleteType
        : toDeleteType?.name || toDeleteType?.eventType || '';

      if (!typeName) {
        throw new Error("No event type name provided for deletion");
      }

      console.log('Deleting event type:', typeName);

      const encodedTypeName = encodeURIComponent(typeName);
      const url = `${BACKEND_URL}/event-types/${encodedTypeName}`;

      console.log('DELETE URL:', url);

      const response = await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response:', response.data);

      if (response.status !== 200) {
        throw new Error(response.data.message || "Deletion failed on backend");
      }

      await fetchEventTypes(true);

      setConfirmDeleteOpen(false);
      setToDeleteType(null);

      if (selectedEventTypeFilter === typeName || selectedEventTypeFilter?.toUpperCase() === typeName.toUpperCase()) {
        console.log(`Switching from deleted event type "${typeName}" to "ALL CELLS"`);
        setSelectedEventTypeFilter('all');
        setSelectedEventTypeObj(null);
      }

      toast.success(response.data.message || `Event type "${typeName}" deleted successfully`);

    } catch (error) {
      console.error("Error deleting event type:", error);

      // Handle 401/unauthorized errors properly
      if (error.response?.status === 401) {
        toast.error("Session expired. Logging out...");
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        setTimeout(() => window.location.href = '/login', 2000);
        return;
      }

      let errorMessage = "Failed to delete event type";

      if (error.response?.data) {
        const errorData = error.response.data;

        // Enhanced error handling for events blocking deletion
        if (error.response.status === 400 && errorData.detail) {
          if (typeof errorData.detail === 'object') {
            // New backend response with details
            errorMessage = `${errorData.detail.message}. Events using this type: ${errorData.detail.events_count}`;
            console.log('Events blocking deletion:', errorData.detail.event_samples);
          } else {
            // Old backend response
            errorMessage = errorData.detail;
          }
        } else {
          errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Error details:', error.response?.data);
      setConfirmDeleteOpen(false);
      toast.error(errorMessage);
    }
  }, [BACKEND_URL, eventTypes, selectedEventTypeFilter, toDeleteType, fetchEventTypes]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
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
  }, [viewFilter, userRole, fetchEvents, rowsPerPage, selectedStatus, selectedEventTypeFilter, searchQuery, DEFAULT_API_START_DATE]);

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

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const trimmedSearch = value.trim();
      console.log("Executing search for:", trimmedSearch);

      let shouldApplyPersonalFilter = undefined;
      if (userRole === "admin" || userRole === "leader at 12") {
        shouldApplyPersonalFilter = viewFilter === 'personal' ? true : undefined;
      }

      setCurrentPage(1);
      clearCache();

      const fetchParams = {
        page: 1,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        _t: Date.now(), // Cache buster
        // Include search parameter
        ...(trimmedSearch && { search: trimmedSearch }),
        ...(shouldApplyPersonalFilter && { personal: true }),
      };

      // Determine event_type for endpoint selection
      if (selectedEventTypeFilter && selectedEventTypeFilter !== 'all') {
        fetchParams.event_type = selectedEventTypeFilter;
      } else {
        fetchParams.event_type = "CELLS";
      }

      if (selectedStatus && selectedStatus !== 'all') {
        fetchParams.status = selectedStatus;
      }

      console.log("Search fetching with params:", fetchParams);
      fetchEvents(fetchParams, true);
    }, 800);
  },
    [userRole, viewFilter, clearCache, fetchEvents, rowsPerPage, selectedStatus, selectedEventTypeFilter, DEFAULT_API_START_DATE]);

  // Replace your checkAccess useEffect in Events.jsx with this fixed version:

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      const token = localStorage.getItem("token");
      const userProfile = localStorage.getItem("userProfile");

      console.log("ACCESS CHECK:", { token: !!token, userProfile: !!userProfile });

      if (!token || !userProfile) {
        toast.error("Please log in to access events");
        setTimeout(() => window.location.href = '/login', 2000);  // Redirect to /login, not /dashboard
        return;
      }

      try {
        const currentUser = JSON.parse(userProfile);
        const userRole = currentUser?.role?.toLowerCase() || "";
        const email = currentUser?.email || "";

        console.log("Checking user access:", { userRole, email });

        const isAdmin = userRole === "admin";
        const isLeaderAt12 =
          userRole.includes("leader at 12") ||
          userRole.includes("leader@12") ||
          userRole.includes("leader @12") ||
          userRole.includes("leader at12") ||
          userRole === "leader at 12";
        const isRegistrant = userRole === "registrant";
        const isLeader144or1728 =
          userRole.includes("leader at 144") ||
          userRole.includes("leader at 1278") ||
          userRole.includes("leader at 1728");

        // IMPROVED: Check if user role includes "leader" in any form
        const isAnyLeader =
          userRole.includes("leader") ||
          isLeaderAt12 ||
          isLeader144or1728;

        const isUser = userRole === "user";

        // Special check for regular users
        if (isUser) {
          try {
            const response = await axios.get(`${BACKEND_URL}/check-leader-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            const { hasCell, canAccessEvents } = response.data;

            console.log("User cell check:", { hasCell, canAccessEvents });

            if (!canAccessEvents || !hasCell) {
              toast.warning("You must have a cell to access the Events page");
              // FIX: Redirect to home instead of /dashboard
              setTimeout(() => window.location.href = '/', 2000);
              return;
            }

            console.log("User has cell - access granted");
          } catch (error) {
            console.error("Error checking cell status:", error);
            toast.error("Unable to verify access. Please contact support.");
            // FIX: Redirect to home instead of /dashboard
            setTimeout(() => window.location.href = '/', 2000);
            return;
          }
        }

        // BROADENED ACCESS: Allow all types of leaders
        const hasAccess =
          isAdmin ||
          isLeaderAt12 ||
          isRegistrant ||
          isLeader144or1728 ||
          isAnyLeader ||  // This catches any leader role
          isUser;

        if (!hasAccess) {
          console.log("Access denied for role:", userRole);
          toast.warning("You do not have permission to access the Events page");
          // FIX: Redirect to home instead of /dashboard
          setTimeout(() => window.location.href = '/', 2000);
        } else {
          console.log("Access granted:", {
            userRole,
            isAdmin,
            isLeaderAt12,
            isRegistrant,
            isLeader144or1728,
            isAnyLeader,
            isUser
          });
        }
      } catch (error) {
        console.error("Error in access check:", error);
        toast.error("Error verifying access");
      }
    };

    checkAccess();
  }, [currentUser?.email, currentUser?.role, BACKEND_URL]);



  useEffect(() => {
    const checkAccess = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const token = localStorage.getItem("token");
      const userProfile = localStorage.getItem("userProfile");

      if (!token || !userProfile) {
        toast.error("Please log in to access events");
        setTimeout(() => navigate('/login', { replace: true }), 2000);  // Better approach
        return;
      }

      try {
        const currentUser = JSON.parse(userProfile);
        const userRole = currentUser?.role?.toLowerCase() || "";

        console.log("Checking user access:", { userRole });

        const isAdmin = userRole === "admin";
        const isAnyLeader = userRole.includes("leader");  // Simplified
        const isRegistrant = userRole === "registrant";
        const isUser = userRole === "user";

        // Check for regular users
        if (isUser) {
          try {
            const response = await axios.get(`${BACKEND_URL}/check-leader-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.data.canAccessEvents || !response.data.hasCell) {
              toast.warning("You must have a cell to access the Events page");
              setTimeout(() => navigate('/', { replace: true }), 2000);
              return;
            }

            console.log("User has cell - access granted");
          } catch (error) {
            console.error("Error checking cell status:", error);
            toast.error("Unable to verify access");
            setTimeout(() => navigate('/', { replace: true }), 2000);
            return;
          }
        }

        // Check access
        const hasAccess = isAdmin || isAnyLeader || isRegistrant || isUser;

        if (!hasAccess) {
          console.log("Access denied for role:", userRole);
          toast.warning("You do not have permission to access this page");
          setTimeout(() => navigate('/', { replace: true }), 2000);  // Navigate to home
        } else {
          console.log("Access granted for role:", userRole);
        }
      } catch (error) {
        console.error("Error in access check:", error);
        toast.error("Error verifying access");
        setTimeout(() => navigate('/', { replace: true }), 2000);  // Navigate to home
      }
    };

    checkAccess();
  }, [currentUser?.email, currentUser?.role, BACKEND_URL, navigate]);



  useEffect(() => {
    if (eventTypes.length > 0 && !selectedEventTypeFilter) {
      console.log("Initializing event type filter to 'all'");
      setSelectedEventTypeFilter('all');
    }
  }, [eventTypes.length, selectedEventTypeFilter]);

  useEffect(() => {
    if (selectedEventTypeFilter && selectedEventTypeFilter !== 'all') {
      console.log("Event type filter changed, auto-refreshing:", selectedEventTypeFilter);

      const refreshParams = {
        page: 1,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        event_type: selectedEventTypeFilter,
        _t: Date.now()
      };

      if (selectedStatus && selectedStatus !== 'all') {
        refreshParams.status = selectedStatus;
      }

      if (searchQuery.trim()) refreshParams.search = searchQuery.trim();

      const timer = setTimeout(() => {
        fetchEvents(refreshParams, true);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [selectedEventTypeFilter]);

  useEffect(() => {
    console.log("[CURRENT STATE DEBUG]", {
      selectedEventTypeFilter,
      eventTypes: eventTypes.map(et => ({ name: et.name, _id: et._id })),
      events: events.map(ev => ({
        name: ev.eventName,
        eventType: ev.eventType,
        _id: ev._id
      })),
      eventsCount: events.length
    });
  }, [selectedEventTypeFilter, eventTypes, events]);



  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  // Add this useEffect to automatically set Leader at 12 to VIEW ALL on initial load
  useEffect(() => {
    if (isLeaderAt12 && viewFilter === 'personal') {
      console.log("Auto-switching Leader at 12 to VIEW ALL mode on initial load");
      setViewFilter('all');

      // Force refresh with VIEW ALL params
      const fetchParams = {
        page: 1,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        event_type: "CELLS"
      };

      if (isLeaderAt12) {
        fetchParams.leader_at_12_view = true;
        fetchParams.include_subordinate_cells = true;
        fetchParams.show_all_authorized = true;

        if (currentUserLeaderAt1) {
          fetchParams.leader_at_1_identifier = currentUserLeaderAt1;
        }
      }

      // Small delay to ensure state is updated
      setTimeout(() => {
        fetchEvents(fetchParams, true);
      }, 100);
    }
  }, [isLeaderAt12]); // Only depend on isLeaderAt12, not viewFilter


  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userProfile = localStorage.getItem("userProfile");

      if (!token || !userProfile) {

        toast.warning("Please log in to continue.");
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    };

    checkAuth();
  }, []);

  const isOverdue = useCallback((event) => {
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
  }, []);


  // Add this useEffect to track filter changes
  useEffect(() => {
    console.log("FILTER CHANGE DEBUG:", {
      selectedEventTypeFilter,
      eventsCount: events.length,
      eventTypes: eventTypes.map(et => et.name)
    });
  }, [selectedEventTypeFilter, events, eventTypes]);



  const handleSaveEventType = useCallback(async (eventTypeData, eventTypeId = null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const oldName = editingEventType?.name;
      console.log("Saving event type:", {
        eventTypeData,
        eventTypeId,
        oldName,
        editingEventType
      });

      let url, method;

      if (eventTypeId || editingEventType) {
        // Editing existing event type - use the OLD name for the URL
        const identifier = oldName;
        if (!identifier) {
          throw new Error("Cannot update: original event type name not found");
        }

        console.log(`Updating event type from '${identifier}' to '${eventTypeData.name}'`);

        // URL encode the OLD name for the endpoint
        const encodedName = encodeURIComponent(identifier);
        url = `${BACKEND_URL}/event-types/${encodedName}`;
        method = 'PUT';

        console.log("Update URL:", url);
      } else {
        // Creating new event type
        url = `${BACKEND_URL}/event-types`;
        method = 'POST';
        console.log("Create URL:", url);
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventTypeData)
      });

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
        }

        console.error("Server error:", errorData);
        throw new Error(errorData.detail || `Failed to save event type: ${response.status}`);
      }

      const result = await response.json();
      console.log("Event type saved successfully:", result);

      // Close modal and reset state
      setEventTypesModalOpen(false);
      setEditingEventType(null);

      // Refresh event types list
      await fetchEventTypes();

      // Update filter if name changed
      if (oldName && selectedEventTypeFilter === oldName && result.name !== oldName) {
        console.log(`Updating filter from '${oldName}' to '${result.name}'`);
        setSelectedEventTypeFilter(result.name);
      }

      toast.success(`Event type ${eventTypeId ? 'updated' : 'created'} successfully!`);
      return result;

    } catch (error) {
      console.error(`Error saving event type:`, error);
      toast.error(`Failed to save event type: ${error.message}`);
      throw error;
    }
  }, [
    BACKEND_URL,
    editingEventType,
    fetchEventTypes,
    selectedEventTypeFilter
  ]);

  const handleCreateEventType = async (eventTypeData) => {
    try {
      console.log("Creating event type:", eventTypeData);

      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/event-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventTypeData),
      });

      if (response.ok) {
        const newEventType = await response.json();
        console.log("Event type created successfully:", newEventType);

        // Refresh event types list
        await fetchEventTypes();

        // Show success message
        toast.success('Event type created successfully!');

        return newEventType;
      } else {
        const errorData = await response.json();
        console.error(" Failed to create event type:", errorData);
        toast.error(`Error: ${errorData.detail || 'Failed to create event type'}`);
        throw new Error(errorData.detail || 'Failed to create event type');
      }
    } catch (error) {
      console.error(" Error creating event type:", error);
      toast.error(`Error: ${error.message}`);
      throw error;
    }
  };

  const handleUpdateEventType = async (eventTypeData, eventTypeIdentifier) => {
    try {
      console.log("Updating event type:", { eventTypeData, eventTypeIdentifier });

      // Use the original name from the editing event type, not the new name
      const originalEventType = editingEventType || eventTypes.find(et =>
        et._id === eventTypeIdentifier || et.name === eventTypeIdentifier
      );

      if (!originalEventType) {
        throw new Error("Could not find original event type data");
      }

      const originalName = originalEventType.name;
      console.log("Original event type name:", originalName);

      const token = localStorage.getItem("token");

      // URL encode the ORIGINAL event type name for the API endpoint
      const encodedName = encodeURIComponent(originalName);
      const response = await fetch(`${BACKEND_URL}/event-types/${encodedName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventTypeData),
      });

      if (response.ok) {
        const updatedEventType = await response.json();
        console.log("Event type updated successfully:", updatedEventType);

        // Refresh event types list
        await fetchEventTypes();

        // Update the selected filter if the name changed
        if (selectedEventTypeFilter === originalName && eventTypeData.name !== originalName) {
          setSelectedEventTypeFilter(eventTypeData.name);
        }

        // Show success message
        toast.success('Event type updated successfully!');

        return updatedEventType;
      } else {
        const errorData = await response.json();
        console.error("Failed to update event type:", errorData);
        toast.error(`Error: ${errorData.detail || 'Failed to update event type'}`);
        throw new Error(errorData.detail || 'Failed to update event type');
      }
    } catch (error) {
      console.error(" Error updating event type:", error);
      toast.error(`Error: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    const fetchCurrentUserLeaderAt1 = async () => {
      const leaderAt1 = await getCurrentUserLeaderAt1();
      setCurrentUserLeaderAt1(leaderAt1);
    };

    fetchCurrentUserLeaderAt1();
  }, [getCurrentUserLeaderAt1]);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

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
    // Don't fetch if we're still initializing
    if (eventTypes.length === 0) {
      return;
    }

    const fetchParams = {
      page: currentPage,
      limit: rowsPerPage,
      start_date: DEFAULT_API_START_DATE
    };

    if (selectedStatus && selectedStatus !== 'all') {
      fetchParams.status = selectedStatus;
    }

    if (searchQuery.trim()) {
      fetchParams.search = searchQuery.trim();
    }

    let endpointType = "cells";

    if (selectedEventTypeFilter === 'all') {
      fetchParams.event_type = "CELLS";
      endpointType = "cells";
    } else if (selectedEventTypeFilter === 'CELLS') {
      fetchParams.event_type = "CELLS";
      endpointType = "cells";
    } else {
      fetchParams.event_type = selectedEventTypeFilter;
      endpointType = "other";
    }

    console.log("Fetching with status filter:", selectedStatus, fetchParams);

    if (endpointType === "cells") {
      if (isAdmin) {
        if (viewFilter === 'personal') {
          fetchParams.personal = true;
        }
      } else if (isRegistrant || isRegularUser) {
        fetchParams.personal = true;
      } else if (isLeaderAt12) {
        fetchParams.leader_at_12_view = true;

        if (currentUserLeaderAt1) {
          fetchParams.leader_at_1_identifier = currentUserLeaderAt1;
        }

        if (viewFilter === 'personal') {
          // PERSONAL: Only their own cell
          fetchParams.show_personal_cells = true;
          fetchParams.personal = true;
        } else {
          // VIEW ALL: Only disciples' cells
          fetchParams.show_all_authorized = true;
          fetchParams.include_subordinate_cells = true;
        }
      }

    } else {
      console.log("Loading event type data for:", selectedEventTypeFilter);

      delete fetchParams.personal;
      delete fetchParams.leader_at_12_view;
      delete fetchParams.show_personal_cells;
      delete fetchParams.show_all_authorized;
      delete fetchParams.include_subordinate_cells;
      delete fetchParams.leader_at_1_identifier;

      console.log("Event Type Mode - Showing ALL events for:", selectedEventTypeFilter);
    }

    Object.keys(fetchParams).forEach(key =>
      fetchParams[key] === undefined && delete fetchParams[key]
    );

    console.log("FINAL API call params:", fetchParams);
    fetchEvents(fetchParams, true);
  }, [
    selectedEventTypeFilter,
    selectedStatus,
    viewFilter,
    currentPage,
    rowsPerPage,
    searchQuery,
    eventTypes.length,
    isLeaderAt12,
    isAdmin,
    isRegularUser,
    isRegistrant,
    currentUserLeaderAt1,
    fetchEvents,
    DEFAULT_API_START_DATE
  ]);

  useEffect(() => {
    console.log("LEADER AT 12 DEBUG:", {
      isLeaderAt12,
      currentUserLeaderAt1,
      viewFilter,
      selectedEventTypeFilter,
      eventsCount: events.length,
      eventsSample: events.slice(0, 3).map(e => ({
        name: e.eventName,
        leader: e.eventLeaderName,
        leader12: e.leader12,
        isSubordinate: e.leader12 !== currentUserLeaderAt1
      }))
    });
  }, [isLeaderAt12, currentUserLeaderAt1, viewFilter, selectedEventTypeFilter, events]);


  const StatusBadges = ({ selectedStatus, setSelectedStatus, setCurrentPage }) => {
    const statuses = [
      { value: 'incomplete', label: 'INCOMPLETE', style: styles.statusBadgeIncomplete },
      { value: 'complete', label: 'COMPLETE', style: styles.statusBadgeComplete },
      { value: 'did_not_meet', label: 'DID NOT MEET', style: styles.statusBadgeDidNotMeet }
    ];

    const handleStatusClick = (statusValue) => {
      console.log("Status badge clicked:", statusValue);
      setSelectedStatus(statusValue);
      setCurrentPage(1);

      const shouldApplyPersonalFilter =
        viewFilter === 'personal' &&
        (userRole === "admin" || userRole === "leader at 12");

      const fetchParams = {
        page: 1,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        _t: Date.now(),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(selectedEventTypeFilter !== 'all' && { event_type: selectedEventTypeFilter }),
        ...(shouldApplyPersonalFilter && { personal: true }),
      };

      // CRITICAL: Always send status parameter when filtering (except for 'all')
      if (statusValue && statusValue !== 'all') {
        fetchParams.status = statusValue;
      }

      // Leader at 12 params for cells
      if (isLeaderAt12 && (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS')) {
        fetchParams.leader_at_12_view = true;
        fetchParams.include_subordinate_cells = true;

        if (currentUserLeaderAt1) {
          fetchParams.leader_at_1_identifier = currentUserLeaderAt1;
        }

        if (viewFilter === 'personal') {
          fetchParams.show_personal_cells = true;
          fetchParams.personal = true;
        } else {
          fetchParams.show_all_authorized = true;
        }
      }

      console.log("Fetching with status:", statusValue, fetchParams);
      fetchEvents(fetchParams, true, true);
    };

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
            onClick={() => handleStatusClick(status.value)}
          >
            {status.label}
          </button>
        ))}
      </div>
    );
  };


  console.log("DEBUG User Role:", {
    userRole: userRole,
    isLeaderAt12: isLeaderAt12,
    isAdmin: isAdmin,
    selectedEventTypeFilter: selectedEventTypeFilter,
    shouldShowToggle: (isAdmin || isLeaderAt12) && (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS')
  });

  const ViewFilterButtons = () => {
    console.log("should show",isAdmin)
    const shouldShowToggle = (isAdmin || (isLeaderAt12 && !isCheckingLeaderStatus))  &&
      (selectedEventTypeFilter === 'all' || selectedEventTypeFilter === 'CELLS' );
    if (isRegularUser || isRegistrant) {
      return null;
    }

    if (selectedEventTypeFilter && selectedEventTypeFilter !== 'all' && selectedEventTypeFilter !== 'CELLS') {
      return null;
    }

    if (!shouldShowToggle) {
      return null;
    }

    const handleViewFilterChange = (newViewFilter) => {
      console.log("View filter changing:", newViewFilter);

      setViewFilter(newViewFilter);
      setCurrentPage(1);

      const fetchParams = {
        page: 1,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        event_type: "CELLS",
        _t: Date.now()
      };

      if (selectedStatus !== 'all') {
        fetchParams.status = selectedStatus;
      }
      if (searchQuery.trim()) {
        fetchParams.search = searchQuery.trim();
      }

      // ADMIN
      if (isAdmin) {
        if (newViewFilter === 'personal') {
          fetchParams.personal = true;
          fetchParams.show_personal_cells = true;
        } else {
          delete fetchParams.personal;
          delete fetchParams.show_personal_cells;
        }
      }
      else if (isLeaderAt12) {
        fetchParams.leader_at_12_view = true;
        fetchParams.include_subordinate_cells = true;

        if (currentUserLeaderAt1) {
          fetchParams.leader_at_1_identifier = currentUserLeaderAt1;
        }

        if (newViewFilter === 'personal') {
          fetchParams.personal = true;
          fetchParams.show_personal_cells = true;
        } else {
          fetchParams.show_all_authorized = true;
          delete fetchParams.personal;
          delete fetchParams.show_personal_cells;
        }
      }

      console.log("Sending params:", fetchParams);
      fetchEvents(fetchParams, true);
    };

    const getAllLabel = () => {
      if (isAdmin) return " VIEW ALL";
      if (isLeaderAt12) return "VIEW ALL";
      return "ALL";
    };

    const getPersonalLabel = () => {
      if (isAdmin) return "PERSONAL";
      if (isLeaderAt12) return "PERSONAL";
      return "PERSONAL";
    };

    return (
      <div style={styles.viewFilterContainer}>
        <span style={styles.viewFilterLabel}>View:</span>
        <label style={styles.viewFilterRadio}>
          <input
            type="radio"
            name="viewFilter"
            value="all"
            checked={viewFilter === 'all'}
            onChange={(e) => handleViewFilterChange(e.target.value)}
          />
          <span style={styles.viewFilterText}>
            {getAllLabel()}
          </span>
        </label>
        <label style={styles.viewFilterRadio}>
          <input
            type="radio"
            name="viewFilter"
            value="personal"
            checked={viewFilter === 'personal'}
            onChange={(e) => handleViewFilterChange(e.target.value)}
          />
          <span style={styles.viewFilterText}>
            {getPersonalLabel()}
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
    setSelectedEventTypeObj,
    DEFAULT_API_START_DATE,
    isLeaderAt12,
    isAdmin,
    isRegistrant,
    isRegularUser,
    setEditingEventType,
    setEventTypesModalOpen,
    setToDeleteType,
    setConfirmDeleteOpen
  }) => {
    const [hoveredType, setHoveredType] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedTypeForMenu, setSelectedTypeForMenu] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down('lg'));
    const isDarkMode = theme.palette.mode === 'dark';

    const canEditEventTypes = isAdmin;

    const handleEventTypeClick = (typeValue) => {
      console.log("Event type clicked:", typeValue);

      setSelectedEventTypeFilter(typeValue);

      setCurrentPage(1);

      const fetchParams = {
        page: 1,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        event_type: typeValue === 'all' ? "CELLS" : typeValue,
        _t: Date.now() // Cache buster
      };

      if (selectedStatus !== 'all') {
        fetchParams.status = selectedStatus;
      }

      if (searchQuery.trim()) {
        fetchParams.search = searchQuery.trim();
      }

      if (typeValue === 'all' || typeValue === 'CELLS') {
        if (isAdmin) {
          if (viewFilter === 'personal') {
            fetchParams.personal = true;
          }
        } else if (isRegistrant || isRegularUser) {
          fetchParams.personal = true;
        } else if (isLeaderAt12) {
          fetchParams.leader_at_12_view = true;
          fetchParams.include_subordinate_cells = true;

          if (viewFilter === 'personal') {
            fetchParams.show_personal_cells = true;
            fetchParams.personal = true;
          } else {
            fetchParams.show_all_authorized = true;
          }
        }
      } else {
        // For other event types, remove personal filters
        delete fetchParams.personal;
        delete fetchParams.leader_at_12_view;
        delete fetchParams.show_personal_cells;
        delete fetchParams.show_all_authorized;
        delete fetchParams.include_subordinate_cells;
      }

      console.log("Fetching events with params:", fetchParams);
      fetchEvents(fetchParams, true);
    };

    // Optimized mobile styles
    const mobileEventTypeStyles = {
      container: {
        backgroundColor: isDarkMode ? theme.palette.background.paper : "#f8f9fa",
        borderRadius: "12px",
        padding: isMobileView ? "0.75rem" : "1rem",
        marginBottom: isMobileView ? "0.5rem" : "1rem",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        border: `1px solid ${isDarkMode ? theme.palette.divider : "#e9ecef"}`,
        position: "relative",
        color: isDarkMode ? theme.palette.text.primary : "inherit",
      },
      headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: isCollapsed ? "0" : "0.5rem",
        cursor: "pointer",
      },
      header: {
        fontSize: isMobileView ? "0.7rem" : "0.875rem",
        fontWeight: "600",
        color: isDarkMode ? theme.palette.text.secondary : "#6c757d",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      },
      selectedTypeDisplay: {
        fontSize: isMobileView ? "0.85rem" : "1rem",
        fontWeight: "600",
        color: isDarkMode ? theme.palette.primary.main : "#007bff",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        flex: 1,
        marginLeft: "0.5rem",
      },
      collapseButton: {
        background: "none",
        border: "none",
        color: isDarkMode ? theme.palette.text.secondary : "#6c757d",
        cursor: "pointer",
        padding: "0.25rem",
        borderRadius: "4px",
        fontSize: "0.8rem",
      },
      typesGrid: {
        display: isCollapsed ? "none" : "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: isMobileView ? "0.35rem" : "0.5rem",
        marginTop: "0.5rem",
      },
      typeCard: {
        padding: isMobileView ? "0.4rem 0.6rem" : "0.6rem 0.8rem",
        borderRadius: "8px",
        border: `1px solid ${isDarkMode ? theme.palette.divider : "transparent"}`,
        backgroundColor: isDarkMode ? theme.palette.background.default : "white",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        minWidth: isMobileView ? "80px" : "100px",
        minHeight: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: isMobileView ? "0.7rem" : "0.8rem",
        fontWeight: "500",
      },
      typeCardActive: {
        borderColor: "#007bff",
        backgroundColor: isDarkMode ? "rgba(0, 123, 255, 0.1)" : "#e7f3ff",
        transform: "scale(1.02)",
        boxShadow: "0 2px 8px rgba(0, 123, 255, 0.2)",
      },
      typeCardHover: {
        borderColor: isDarkMode ? theme.palette.primary.main : "#ddd",
        transform: "translateY(-1px)",
        boxShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.2)" : "0 2px 4px rgba(0,0,0,0.1)",
      },
    };

    const allTypes = useMemo(() => {
      const availableTypes = eventTypes.map(t => t.name || t).filter(name => name && name !== "all");

      // FIXED: Priority order - Admin > Registrant > Leader at 12 > Regular User
      if (isAdmin) {
        // Admin sees everything
        const adminTypes = ["all"];
        availableTypes.forEach(type => {
          adminTypes.push(type);
        });
        return adminTypes;
      } else if (isRegistrant) {
        const registrantTypes = ["all"];
        availableTypes.forEach(type => {
          registrantTypes.push(type);
        });
        console.log("Registrant event types:", registrantTypes);
        return registrantTypes;
      } else if (isLeaderAt12) {
        const leaderTypes = ["all"];
        availableTypes.forEach(type => {
          leaderTypes.push(type);
        });
        return leaderTypes;
      } else if (isRegularUser) {
        return ["all"];
      } else {
        return ["all"];
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

    const handleMenuOpen = (event, type) => {
      event.stopPropagation();
      setMenuAnchor(event.currentTarget);
      setSelectedTypeForMenu(type);
    };

    const handleMenuClose = () => {
      setMenuAnchor(null);
      setSelectedTypeForMenu(null);
    };

    const handleEditEventType = () => {
      if (selectedTypeForMenu && selectedTypeForMenu !== 'all') {
        const eventTypeToEdit = eventTypes.find(
          et => et.name?.toLowerCase() === selectedTypeForMenu.toLowerCase()
        ) || { name: selectedTypeForMenu };

        setEditingEventType(eventTypeToEdit);
        setEventTypesModalOpen(true);
      }
      handleMenuClose();
    };

    const handleDeleteEventType = () => {
      if (selectedTypeForMenu && selectedTypeForMenu !== 'all') {
        console.log(" Attempting to delete event type:", selectedTypeForMenu);

        const exactEventType = eventTypes.find(et => {
          const etName = et.name || et.eventType || et.eventTypeName || '';
          return etName.toLowerCase() === selectedTypeForMenu.toLowerCase();
        });

        const typeToDelete = exactEventType ?
          (exactEventType.name || exactEventType.eventType || exactEventType.eventTypeName) :
          selectedTypeForMenu;

        console.log(" Final type to delete:", typeToDelete);
        setToDeleteType(typeToDelete);
        setConfirmDeleteOpen(true);
      }
      handleMenuClose();
    };

    const shouldShowSelector = isAdmin || isRegistrant || isLeaderAt12 || isRegularUser;

    if (!shouldShowSelector) {
      return null;
    }

    useEffect(() => {
      if (isMobileView) {
        setIsCollapsed(true);
      }
    }, [isMobileView]);

    return (
      <div style={mobileEventTypeStyles.container}>
        {/* Header Row - Always visible */}
        <div
          style={mobileEventTypeStyles.headerRow}
          onClick={() => isMobileView && setIsCollapsed(!isCollapsed)}
        >
          <div style={mobileEventTypeStyles.header}>
            {isAdmin ? "Event Types" :
              isRegistrant ? "Event Types" :
                isLeaderAt12 ? "Cells & Events" :
                  "Your Cells"}
          </div>

          <div style={mobileEventTypeStyles.selectedTypeDisplay}>
            <span>•</span>
            <span>
              {selectedEventTypeFilter === 'all' && isLeaderAt12 ? "ALL CELLS" : getDisplayName(selectedEventTypeFilter)}
            </span>
          </div>

          {isMobileView && (
            <button
              style={mobileEventTypeStyles.collapseButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(!isCollapsed);
              }}
            >
              {isCollapsed ? "" : ""}
            </button>
          )}
        </div>

        <div style={mobileEventTypeStyles.typesGrid}>
          {allTypes.map((type) => {
            const displayName = getDisplayName(type);
            const typeValue = getTypeValue(type);
            const isActive = selectedEventTypeFilter === typeValue;
            const isHovered = hoveredType === typeValue;

            const showMenu = canEditEventTypes && typeValue !== 'all';

            return (
              <div
                key={typeValue}
                style={{
                  ...mobileEventTypeStyles.typeCard,
                  ...(isActive ? mobileEventTypeStyles.typeCardActive : {}),
                  ...(isHovered && !isActive ? mobileEventTypeStyles.typeCardHover : {}),
                }}
                onClick={() => handleEventTypeClick(typeValue)}
                onMouseEnter={() => setHoveredType(typeValue)}
                onMouseLeave={() => setHoveredType(null)}
              >
                <span>
                  {displayName}
                </span>

                {/* FIXED: Show edit menu for admin users */}
                {showMenu && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, typeValue)}
                    sx={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 20,
                      height: 20,
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                      },
                      color: isDarkMode ? '#fff' : '#000',
                      fontSize: '12px',
                      padding: '1px',
                      minWidth: 'auto',
                      // Make it always visible on mobile, hover-only on desktop
                      opacity: isMobileView ? 1 : (isHovered || isActive ? 1 : 0),
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    ⋮
                  </IconButton>
                )}
              </div>
            );
          })}
        </div>

        {/* Edit/Delete Menu */}
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
      padding: isMobileView ? "0.5rem" : "1rem",
      paddingTop: isMobileView ? "4rem" : "5rem",
      paddingBottom: "1rem",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
      width: "100%",
      maxWidth: "100vw",
      backgroundColor: isDarkMode ? theme.palette.background.default : '#f5f7fa',
    }}>

      <Box sx={{
        padding: isMobileView ? "1rem" : "1.5rem",
        borderRadius: "16px",
        marginBottom: isMobileView ? "0.5rem" : "1rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        flexShrink: 0,
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
          setSelectedEventTypeObj={setSelectedEventTypeObj}
          DEFAULT_API_START_DATE={DEFAULT_API_START_DATE}
          isLeaderAt12={isLeaderAt12}
          isAdmin={isAdmin}
          isRegistrant={isRegistrant}
          isRegularUser={isRegularUser}
          setEditingEventType={setEditingEventType}
          setEventTypesModalOpen={setEventTypesModalOpen}
          setToDeleteType={setToDeleteType}
          setConfirmDeleteOpen={setConfirmDeleteOpen}
          clearCache={clearCache}
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
            {loading ? '' : 'SEARCH'}
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
            {loading ? '' : 'CLEAR ALL'}
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
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
      }}>

       {isMobileView ? (
  <>
    {/* Scrollable list container */}
    <Box sx={{
      flexGrow: 1,
      overflowY: 'auto',
      padding: "0.75rem",
    }}>
      {loading ? (
        <Box sx={{ width: '100%', p: 2 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center', color: isDarkMode ? theme.palette.text.primary : '#666' }}>
            Loading events...
          </Typography>
        </Box>
      ) : paginatedEvents.length === 0 ? (
        <Box sx={{
          textAlign: "center",
          padding: "2rem",
          color: isDarkMode ? theme.palette.text.primary : '#666',
        }}>
          <Typography>No events found matching your criteria.</Typography>
        </Box>
      ) : (
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
            isAdmin={isAdmin}
            isLeaderAt12={isLeaderAt12}
            currentUserLeaderAt1={currentUserLeaderAt1}
            selectedEventTypeFilter={selectedEventTypeFilter} 
          />
        ))
      )}
    </Box>

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
              <Typography variant="body2" sx={{
                color: isDarkMode ? theme.palette.text.secondary : '#6c757d'
              }}>
                {totalEvents > 0 ? `${startIndex}-${endIndex} of ${totalEvents}` : '0-0 of 0'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  sx={{
                    minWidth: 'auto',
                    color: isDarkMode ? theme.palette.text.primary : '#007bff',
                    borderColor: isDarkMode ? theme.palette.divider : '#007bff',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,123,255,0.1)',
                      borderColor: isDarkMode ? theme.palette.primary.main : '#0056b3',
                    },
                    '&:disabled': {
                      color: isDarkMode ? theme.palette.text.disabled : '#6c757d',
                      borderColor: isDarkMode ? theme.palette.divider : '#dee2e6',
                    }
                  }}
                >
                  {loading ? '' : '◀ Prev'}
                </Button>
                <Typography variant="body2" sx={{
                  padding: '0 0.5rem',
                  color: isDarkMode ? theme.palette.text.secondary : '#6c757d'
                }}>
                  {currentPage} / {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || loading || totalPages === 0}
                  sx={{
                    minWidth: 'auto',
                    color: isDarkMode ? theme.palette.text.primary : '#007bff',
                    borderColor: isDarkMode ? theme.palette.divider : '#007bff',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,123,255,0.1)',
                      borderColor: isDarkMode ? theme.palette.primary.main : '#0056b3',
                    },
                    '&:disabled': {
                      color: isDarkMode ? theme.palette.text.disabled : '#6c757d',
                      borderColor: isDarkMode ? theme.palette.divider : '#dee2e6',
                    }
                  }}
                >
                  {loading ? '' : 'Next ▶'}
                </Button>
              </Box>
            </Box>
          </>

        ) : (
          // DESKTOP VIEW
          <>
            {/* Scrollable table container */}
            <Box sx={{
              flexGrow: 1,
              overflowY: 'auto',
              overflowX: 'auto',
              padding: '1rem'
            }}>
              {loading ? (
                <Box sx={{ p: 3, width: '100%' }}>
                  <LinearProgress />
                  <Typography sx={{ mt: 2, textAlign: 'center' }}>
                    Loading events...
                  </Typography>
                </Box>
              ) : paginatedEvents.length === 0 ? (
                <Typography sx={{ p: 3, textAlign: 'center' }}>
                  No events found matching your criteria.
                </Typography>
              ) : (
                <Box sx={{ height: 'calc(100vh - 450px)', minHeight: '500px' }}>
                  <DataGrid
                    rows={paginatedEvents.map((event, idx) => ({
                      id: event._id || idx,
                      ...event,
                    }))}

                    columns={[
                      ...generateDynamicColumns(paginatedEvents, isOverdue, selectedEventTypeFilter),
                      {
                        field: 'actions',
                        headerName: 'Actions',
                        sortable: false,
                        flex: 1,
                        minWidth: 200,
                        renderCell: (params) => (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Capture Attendance" arrow>
                              <IconButton
                                onClick={() => handleCaptureClick(params.row)}
                                size="small"
                                sx={{
                                  backgroundColor: '#007bff',
                                  color: '#fff',
                                  '&:hover': { backgroundColor: '#0056b3' },
                                }}
                              >
                                <CheckBoxIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Event" arrow>
                              <IconButton
                                onClick={() => handleEditEvent(params.row)}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip title="Delete Event" arrow>
                                <IconButton
                                  onClick={() => handleDeleteEvent(params.row)}
                                  size="small"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        ),
                      },
                    ]}
                    disableRowSelectionOnClick
                    hideFooterPagination
                    hideFooter
                    pageSizeOptions={[10, 25, 50, 100]}
                    paginationModel={{ page: currentPage - 1, pageSize: rowsPerPage }}
                    onPaginationModelChange={(model) => {
                      const newPage = model.page + 1;
                      handlePageChange(newPage);
                    }}
                    rowCount={totalEvents}
                    paginationMode="server"
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                      toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: 500 },
                      },
                    }}
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                        color: isDarkMode ? '#fff' : '#333',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        borderBottom: `2px solid ${isDarkMode ? '#333' : '#ddd'}`,
                        minHeight: '52px !important',
                      },
                      '& .MuiDataGrid-columnHeader': {
                        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                        color: isDarkMode ? '#fff' : '#333',
                        '&:focus': {
                          outline: 'none',
                        },
                      },
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 600,
                        color: isDarkMode ? '#fff' : '#333',
                        fontSize: '0.875rem',
                      },
                      '& .MuiDataGrid-cell': {
                        alignItems: 'center',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                        color: isDarkMode ? theme.palette.text.primary : '#212529',
                        fontSize: '0.875rem',
                        '&:focus': {
                          outline: 'none',
                        },
                      },
                      '& .MuiDataGrid-row': {
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        overflowY: 'auto !important',
                      },
                      '& .MuiDataGrid-toolbarContainer': {
                        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
                      },
                      '& .MuiDataGrid-menuIcon': {
                        color: isDarkMode ? '#fff' : '#666',
                      },
                      '& .MuiDataGrid-sortIcon': {
                        color: isDarkMode ? '#fff' : '#666',
                      },
                      '& .MuiDataGrid-iconButtonContainer': {
                        visibility: 'visible',
                      },
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Pagination for DESKTOP - Fixed at the bottom */}
            <Box sx={{
              ...styles.paginationContainer,
              flexShrink: 0,
              backgroundColor: isDarkMode ? theme.palette.background.paper : '#f8f9fa',
              borderTop: `1px solid ${isDarkMode ? theme.palette.divider : '#e9ecef'}`,
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <Typography variant="body2" sx={{
                  color: isDarkMode ? theme.palette.text.secondary : '#6c757d'
                }}>
                  Rows per page:
                </Typography>
                <select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid',
                    borderColor: isDarkMode ? theme.palette.divider : '#dee2e6',
                    borderRadius: '8px',
                    backgroundColor: isDarkMode ? theme.palette.background.default : '#fff',
                    color: isDarkMode ? theme.palette.text.primary : '#000',
                    fontSize: '0.875rem',
                  }}
                  disabled={loading}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </Box>

              <Typography variant="body2" sx={{
                color: isDarkMode ? theme.palette.text.secondary : '#6c757d'
              }}>
                {totalEvents > 0 ? `${startIndex}-${endIndex} of ${totalEvents}` : '0-0 of 0'}
              </Typography>

              <Box sx={styles.paginationControls}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  sx={{
                    color: isDarkMode ? theme.palette.text.primary : '#007bff',
                    borderColor: isDarkMode ? theme.palette.divider : '#007bff',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,123,255,0.1)',
                      borderColor: isDarkMode ? theme.palette.primary.main : '#0056b3',
                    },
                    '&:disabled': {
                      color: isDarkMode ? theme.palette.text.disabled : '#6c757d',
                      borderColor: isDarkMode ? theme.palette.divider : '#dee2e6',
                    }
                  }}
                >
                  {loading ? '' : '< Previous'}
                </Button>
                <Typography variant="body2" sx={{
                  padding: '0 1rem',
                  color: isDarkMode ? theme.palette.text.secondary : '#6c757d'
                }}>
                  Page {currentPage} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || loading || totalPages === 0}
                  sx={{
                    color: isDarkMode ? theme.palette.text.primary : '#007bff',
                    borderColor: isDarkMode ? theme.palette.divider : '#007bff',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,123,255,0.1)',
                      borderColor: isDarkMode ? theme.palette.primary.main : '#0056b3',
                    },
                    '&:disabled': {
                      color: isDarkMode ? theme.palette.text.disabled : '#6c757d',
                      borderColor: isDarkMode ? theme.palette.divider : '#dee2e6',
                    }
                  }}
                >
                  {loading ? '' : 'Next >'}
                </Button>
              </Box>
            </Box>
          </>
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
              width: "155px",
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
              <Box sx={fabStyles.fabMenuIcon}></Box>
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
              <Box sx={fabStyles.fabMenuIcon}></Box>
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
          setSelectedEventTypeObj={setSelectedEventTypeObj}
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
                onClick={() => handleCloseCreateEventModal(false)}
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
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
            color: isDarkMode ? theme.palette.text.primary : '#000',
          },
        }}
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete the event type "{toDeleteType}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDeleteOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteType}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
        style={{ marginTop: "80px" }} 
      />
    </Box>
  );
};

export default Events;