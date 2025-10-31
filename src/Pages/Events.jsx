import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
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
import { Box, useMediaQuery, LinearProgress, TextField, InputAdornment, Paper, Select } from "@mui/material"; 
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
    paddingTop: "5rem",
    paddingBottom: "1rem",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
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
    WebkitOverflowScrolling: "touch",
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
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
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
    // If theme is missing, return a simple placeholder or null to prevent crash
    // returning null or an empty Box is safer than crashing
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
        {event.event_name || 'N/A'}
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
        <span style={styles.mobileCardValue}>{event.leader_name || 'N/A'}</span>
      </div>
      
      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Type:</span>
        <span style={styles.mobileCardValue}>{event.eventType || 'N/A'}</span>
      </div>

      {/* Add more key data rows here */}
      
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
  const theme = useTheme()
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

  // [ALL STATE DECLARATIONS - Keep existing state from your code]
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

  // [ALL useMemo, useCallback, useEffect, and handler functions - Keep all existing code]
  // ... (keeping all your existing functions exactly as they are)

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
      overflow: "hidden",
      position: "relative",
      width: "100%",
      maxWidth: "100vw",
      backgroundColor: isDarkMode ? theme.palette.background.default : '#f5f7fa',
    }}>
      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }} />}
      
      {/* Header Section */}
      <Box sx={{ 
        padding: isMobileView ? "1rem" : "1.5rem",
        borderRadius: "16px",
        marginBottom: isMobileView ? "0.5rem" : "1rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        flexShrink: 0,
        backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
      }}>
        <EventTypeSelector />

        {/* Search and Filter Row */}
        <Box sx={{ 
          display: "flex", 
          gap: 2, 
          alignItems: "center", 
          marginBottom: isMobileView ? "0.75rem" : "1.5rem", 
          flexWrap: "wrap",
          px: 1 
        }}>
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
          
          <Button 
            variant="contained"
            onClick={handleSearchSubmit}
            disabled={isLoading}
            sx={{
              padding: isMobileView ? '0.6rem 1rem' : '0.75rem 1.5rem',
              fontSize: isMobileView ? '14px' : '0.95rem',
              whiteSpace: 'nowrap',
            }}
          >
            {isLoading ? '⏳' : 'SEARCH'}
          </Button>

          <Button 
            variant="outlined"
            onClick={clearAllFilters}
            disabled={isLoading}
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
            {isLoading ? '⏳' : 'CLEAR ALL'}
          </Button>
        </Box>

        {/* View Filter Row */}
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

      {/* Events Container */}
      <Paper sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
      }}>
        {isMobileView ? (
          /* Mobile Card View */
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ 
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "0.75rem",
              minHeight: "250px",
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

            {/* Mobile Pagination */}
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
              <Typography variant="body2" sx={{ color: '#6c757d' }}>
                {totalEvents > 0 ? `${startIndex}-${endIndex} of ${totalEvents}` : '0-0 of 0'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                  sx={{ minWidth: 'auto' }}
                >
                  {isLoading ? '⏳' : '◀ Prev'}
                </Button>

                <Typography variant="body2" sx={{ padding: '0 0.5rem', color: '#6c757d' }}>
                  {currentPage} / {totalPages}
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || isLoading || totalPages === 0}
                  sx={{ minWidth: 'auto' }}
                >
                  {isLoading ? '⏳' : 'Next ▶'}
                </Button>
              </Box>
            </Box>
          </Box>
        ) : (
          /* Desktop Table View */
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                minWidth: '1300px' 
              }}>
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
                    paginatedEvents.map((event, index) => {
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

            {/* Desktop Pagination */}
            <Box sx={{ ...styles.paginationContainer, flexShrink: 0 }}>
              <Box sx={styles.rowsPerPage}>
                <Typography variant="body2">Rows per page:</Typography>
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
              </Box>

              <Typography variant="body2" sx={styles.paginationInfo}>
                {totalEvents > 0 ? `${startIndex}-${endIndex} of ${totalEvents}` : '0-0 of 0'}
              </Typography>
              
              <Box sx={styles.paginationControls}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  {isLoading ? '⏳' : '< Previous'}
                </Button>

                <Typography variant="body2" sx={{ padding: '0 1rem', color: '#6c757d' }}>
                  Page {currentPage} of {totalPages}
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || isLoading || totalPages === 0}
                >
                  {isLoading ? '⏳' : 'Next >'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* FAB Menu */}
      {isAdmin && (
        <Box sx={fabStyles.fabContainer}>
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

      {/* Modals */}
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