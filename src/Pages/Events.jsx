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
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    '@media (max-width: 768px)': {
      padding: "0.5rem",
      paddingTop: "4rem",
    },
    '@media (max-width: 480px)': {
      padding: "0.25rem",
      paddingTop: "3.5rem",
    },
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
  mobileCardsContainer: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    padding: "1rem",
    minHeight: 0,
    height: "100%",
    maxHeight: "calc(100vh - 400px)",
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

// Responsive breakpoint utilities
const getResponsiveStyles = (isMobile, isTablet, isSmallMobile) => {
  return {
    container: {
      ...styles.container,
      padding: isSmallMobile ? "0.25rem" : isMobile ? "0.5rem" : "1rem",
      paddingTop: isSmallMobile ? "3.5rem" : isMobile ? "4rem" : "5rem",
    },
    topSection: {
      ...styles.topSection,
      padding: isSmallMobile ? "0.75rem" : isMobile ? "1rem" : "1.5rem",
      marginBottom: isMobile ? "0.75rem" : "1rem",
      borderRadius: isMobile ? "12px" : "16px",
    },
    searchFilterRow: {
      ...styles.searchFilterRow,
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "0.5rem" : "1rem",
      marginBottom: isMobile ? "1rem" : "1.5rem",
    },
    searchInput: {
      ...styles.searchInput,
      width: isMobile ? "100%" : "auto",
      minWidth: isMobile ? "100%" : "200px",
      padding: isSmallMobile ? "0.6rem 0.8rem" : "0.75rem 1rem",
      fontSize: isSmallMobile ? "0.85rem" : "0.95rem",
    },
    filterButton: {
      ...styles.filterButton,
      width: isMobile ? "100%" : "auto",
      padding: isSmallMobile ? "0.6rem 1rem" : "0.75rem 1.5rem",
      fontSize: isSmallMobile ? "0.85rem" : "0.95rem",
    },
    statusBadgeContainer: {
      ...styles.statusBadgeContainer,
      gap: isSmallMobile ? "0.5rem" : "0.75rem",
      justifyContent: isMobile ? "center" : "flex-start",
    },
    statusBadge: {
      ...styles.statusBadge,
      padding: isSmallMobile ? "0.5rem 0.8rem" : "0.6rem 1.2rem",
      fontSize: isSmallMobile ? "0.75rem" : "0.9rem",
    },
    viewFilterRow: {
      ...styles.viewFilterRow,
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "0.75rem" : "1rem",
      alignItems: isMobile ? "stretch" : "center",
    },
    viewFilterContainer: {
      ...styles.viewFilterContainer,
      justifyContent: isMobile ? "center" : "flex-start",
      gap: isSmallMobile ? "0.5rem" : "1rem",
    },
    mobileCard: {
      ...styles.mobileCard,
      padding: isSmallMobile ? "1rem" : "1.25rem",
      marginBottom: isSmallMobile ? "0.75rem" : "1rem",
      borderRadius: isSmallMobile ? "12px" : "16px",
    },
    mobileCardRow: {
      ...styles.mobileCardRow,
      fontSize: isSmallMobile ? "0.8rem" : "0.9rem",
      marginBottom: isSmallMobile ? "0.4rem" : "0.5rem",
      flexDirection: isSmallMobile ? "column" : "row",
      gap: isSmallMobile ? "0.25rem" : "0.5rem",
    },
    mobileCardLabel: {
      ...styles.mobileCardLabel,
      minWidth: isSmallMobile ? "auto" : "100px",
    },
    mobileCardValue: {
      ...styles.mobileCardValue,
      textAlign: isSmallMobile ? "left" : "right",
    },
    eventTypeContainer: {
      ...eventTypeStyles.container,
      padding: isSmallMobile ? "1rem" : isMobile ? "1.25rem" : "1.5rem",
      marginBottom: isMobile ? "1rem" : "1.5rem",
    },
    eventTypeHeader: {
      ...eventTypeStyles.header,
      fontSize: isSmallMobile ? "0.75rem" : "0.875rem",
    },
    selectedTypeDisplay: {
      ...eventTypeStyles.selectedTypeDisplay,
      fontSize: isSmallMobile ? "1rem" : "1.25rem",
      flexWrap: "wrap",
    },
    typesGrid: {
      ...eventTypeStyles.typesGrid,
      gridTemplateColumns: isSmallMobile 
        ? "repeat(auto-fill, minmax(120px, 1fr))" 
        : isMobile 
        ? "repeat(auto-fill, minmax(140px, 1fr))"
        : "repeat(auto-fill, minmax(150px, 1fr))",
      gap: isSmallMobile ? "0.5rem" : "0.75rem",
    },
    typeCard: {
      ...eventTypeStyles.typeCard,
      padding: isSmallMobile ? "0.75rem" : "1rem",
      minHeight: isSmallMobile ? "60px" : "70px",
    },
    fabContainer: {
      ...fabStyles.fabContainer,
      bottom: isSmallMobile ? "15px" : "20px",
      right: isSmallMobile ? "15px" : "20px",
    },
    mainFab: {
      ...fabStyles.mainFab,
      width: isSmallMobile ? "50px" : "56px",
      height: isSmallMobile ? "50px" : "56px",
      fontSize: isSmallMobile ? "1.3rem" : "1.5rem",
    },
    fabMenuItem: {
      ...fabStyles.fabMenuItem,
      padding: isSmallMobile ? "10px 14px" : "12px 16px",
      fontSize: isSmallMobile ? "0.8rem" : "0.9rem",
    },
    paginationContainer: {
      ...styles.paginationContainer,
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "0.75rem" : "1.5rem",
      padding: isSmallMobile ? "0.75rem" : "1rem",
    },
  };
};

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

const Events = () => {
  const location = useLocation();
  const theme = useTheme();
  
  // Enhanced responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isSmallMobile = useMediaQuery("(max-width:430px)"); // iPhone 14 Pro Max and smaller
  const isExtraSmallMobile = useMediaQuery("(max-width:390px)"); // iPhone 14 and smaller

  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const userRole = currentUser?.role?.toLowerCase() || "";
  const isLeaderAt12 = userRole === "leader at 12";
  const isAdmin = userRole === "admin";

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Get responsive styles
  const responsiveStyles = getResponsiveStyles(isMobile, isTablet, isSmallMobile || isExtraSmallMobile);


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
  const [viewFilter, setViewFilter] = useState(() => getDefaultViewFilter());
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
      start_date: '2025-10-20' // ✅ ALWAYS INCLUDE
    };

    Object.keys(fetchParams).forEach(key =>
      fetchParams[key] === undefined && delete fetchParams[key]
    );

    fetchEvents(fetchParams, true);
  }, [
    selectedStatus, selectedEventTypeFilter, viewFilter, currentPage, rowsPerPage, userRole
  ]);

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
    start_date: '2025-10-20'
  }, true);
};

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

 const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce the search to avoid too many API calls
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      const trimmedSearch = value.trim();

      // Determine if personal filter should be applied
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
        start_date: '2025-10-20'
      }, true);
    }, 500); // Wait 500ms after user stops typing
  };

  const handleSearchSubmit = () => {
    const trimmedSearch = searchQuery.trim();

    // Determine if personal filter should be applied
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
      start_date: '2025-10-20'
    }, true);
  };

  const handleEventTypeClick = (typeValue) => {
    if (selectedEventTypeFilter === typeValue) {
      return;
    }

    setSelectedEventTypeFilter(typeValue);
    setCurrentPage(1);

    // Determine if personal filter should be applied
    let shouldApplyPersonalFilter = undefined;
    if (userRole === "admin" || userRole === "leader at 12") {
      shouldApplyPersonalFilter = viewFilter === 'personal' ? true : undefined;
    }

    fetchEvents({
      page: 1,
      limit: rowsPerPage,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      event_type: typeValue !== 'all' ? typeValue : undefined,
      search: searchQuery.trim() || undefined,
      personal: shouldApplyPersonalFilter,
      start_date: '2025-10-20' // ✅ ADD THIS
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
        start_date: '2025-10-20' // ✅ ADD THIS
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
  setActiveFilters(filters);
  setFilterOptions(filters);
  setCurrentPage(1);

  const shouldApplyPersonalFilter =
    viewFilter === 'personal' &&
    (userRole === "admin" || userRole === "leader at 12");

  // Build filter parameters for API call
  const apiFilters = {
    page: 1,
    limit: rowsPerPage,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
    search: searchQuery.trim() || undefined,
    personal: shouldApplyPersonalFilter ? true : undefined,
    start_date: '2025-10-20'
  };

  // Add additional filters if provided
  if (filters.leader && filters.leader.trim()) {
    apiFilters.search = filters.leader.trim();
  }
  
  if (filters.day && filters.day !== 'all') {
    apiFilters.day = filters.day;
  }

  if (filters.eventType && filters.eventType !== 'all') {
    apiFilters.event_type = filters.eventType;
  }

  // Clean undefined values
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

      const actualEventTypes = eventTypesData.filter(item =>
        item.isEventType === true || item.hasOwnProperty('isEventType')
      );

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
      ...responsiveStyles.container,
      backgroundColor: isDarkMode ? theme.palette.background.default : '#f5f7fa',
    },
    topSection: {
      ...responsiveStyles.topSection,
      backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
      color: isDarkMode ? theme.palette.text.primary : '#212529',
    },
    searchInput: {
      ...responsiveStyles.searchInput,
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
      ...responsiveStyles.mobileCard,
      backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
      borderColor: isDarkMode ? theme.palette.divider : '#f0f0f0',
    },
    mobileCardLabel: {
      ...responsiveStyles.mobileCardLabel,
      color: isDarkMode ? theme.palette.text.secondary : '#666',
    },
    mobileCardValue: {
      ...responsiveStyles.mobileCardValue,
      color: isDarkMode ? theme.palette.text.primary : '#212529',
    },
  };


  const EventTypeSelector = () => {
    const [hoveredType, setHoveredType] = useState(null);

    const allTypes = ["All Events", ...eventTypes];

    const getDisplayName = (type) => {
      if (type === "All Events") return type;
      if (typeof type === "string") return type;
      return type.name || type;
    };

    const getTypeValue = (type) => {
      if (type === "All Events") return "all";
      if (typeof type === "string") {
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
      <div style={responsiveStyles.eventTypeContainer}>
        <div style={responsiveStyles.eventTypeHeader}>Filter by Event Type</div>

        <div style={responsiveStyles.selectedTypeDisplay}>
          <div style={eventTypeStyles.checkIcon}>✓</div>
          <span>{finalDisplayName}</span>
        </div>

        {isAdmin && (
          <div
            style={{
              ...responsiveStyles.typeCard,
                    ...(isActive ? eventTypeStyles.typeCardActive : {}),
                    ...(isHovered && !isActive ? eventTypeStyles.typeCardHover : {}),
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
                    ...responsiveStyles.typeCard,
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
                      fontSize: isSmallMobile ? "0.8rem" : "0.9rem",
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
                         padding: isSmallMobile ? '4px' : '8px',
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
    const handleStatusClick = (status) => {
      setSelectedStatus(status);

      // Determine if personal filter should be applied
      const shouldApplyPersonalFilter =
        viewFilter === 'personal' &&
        (userRole === "admin" || userRole === "leader at 12");

      setCurrentPage(1);

      fetchEvents({
        status: status !== 'all' ? status : undefined,
        event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
        search: searchQuery || undefined,
        page: 1,
        personal: shouldApplyPersonalFilter ? true : undefined,
        start_date: '2025-10-20'
      });
    };

    return (
      <div style={responsiveStyles.statusBadgeContainer}>
        <button
          style={{
            ...responsiveStyles.statusBadge,
            ...styles.statusBadgeIncomplete,
            ...(selectedStatus === 'incomplete' ? styles.statusBadgeActive : {}),
            transform: selectedStatus === 'incomplete' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: selectedStatus === 'incomplete' ? '0 6px 16px rgba(255, 165, 0, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={() => handleStatusClick('incomplete')}
        >
          INCOMPLETE
        </button>

        <button
          style={{
            ...responsiveStyles.statusBadge,
            ...styles.statusBadgeComplete,
            ...(selectedStatus === 'complete' ? styles.statusBadgeActive : {}),
            transform: selectedStatus === 'complete' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: selectedStatus === 'complete' ? '0 6px 16px rgba(40, 167, 69, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={() => handleStatusClick('complete')}
        >
          COMPLETE
        </button>

        <button
          style={{
            ...responsiveStyles.statusBadge,
            ...styles.statusBadgeDidNotMeet,
            ...(selectedStatus === 'did_not_meet' ? styles.statusBadgeActive : {}),
            transform: selectedStatus === 'did_not_meet' ? 'scale(1.05)' : 'scale(1)',
            boxShadow: selectedStatus === 'did_not_meet' ? '0 6px 16px rgba(220, 53, 69, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={() => handleStatusClick('did_not_meet')}
        >
          DID NOT MEET
        </button>
      </div>
    );
  };


  const ViewFilterButtons = () => {
    const [isLeaderAt12, setIsLeaderAt12] = useState(false);
    const [leaderCheckLoading, setLeaderCheckLoading] = useState(true);

    // Check if current user is a Leader at 12 by calling backend
    useEffect(() => {
      const checkIfLeaderAt12 = async () => {
        try {
          const token = localStorage.getItem("token");
          const currentUserEmail = currentUser?.email;

          if (!currentUserEmail) {
            setLeaderCheckLoading(false);
            return;
          }

          const response = await axios.get(`${BACKEND_URL}/check-leader-at-12/${currentUserEmail}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const { is_leader_at_12, leader_name, found_events_count } = response.data;

          setIsLeaderAt12(is_leader_at_12);
          console.log(`👤 User ${leader_name} is Leader at 12: ${is_leader_at_12} (found ${found_events_count} events)`);

        } catch (error) {
          console.error("Error checking Leader at 12 status:", error);
          const isLeader = events.some(event =>
            event.leader12 && currentUser.name &&
            event.leader12.toLowerCase().includes(currentUser.name.toLowerCase())
          );
          setIsLeaderAt12(isLeader);
        } finally {
          setLeaderCheckLoading(false);
        }
      };

      checkIfLeaderAt12();
    }, [currentUser, events])

    const shouldShowViewFilter = () => {
      const role = userRole.toLowerCase();
      if (role === "user" || role === "leader at 1" || role === "registrant") {
        return false;
      }
      return isAdmin || isLeaderAt12;
    };

    useEffect(() => {
      const role = userRole.toLowerCase();
      if ((role === "user" || role === "leader at 1" || role === "registrant") && viewFilter !== 'personal') {
        setViewFilter('personal');
      }
    }, [userRole, viewFilter]);

    if (leaderCheckLoading || !shouldShowViewFilter()) {
      return (
        <div style={responsiveStyles.viewFilterContainer}>
          <span style={styles.viewFilterLabel}>View:</span>
          <span style={{
            ...styles.viewFilterText,
            color: '#007bff',
            fontWeight: '600',
          }}>
            Personal
          </span>
        </div>
      );
    }

    return (
      <div style={responsiveStyles.viewFilterContainer}>
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

              // Determine if personal filter should be applied
              const shouldApplyPersonalFilter = newViewFilter === 'personal';

              fetchEvents({
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
                search: searchQuery || undefined,
                page: 1,
                personal: shouldApplyPersonalFilter,
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
            {isLeaderAt12 ? "View All" : "View All"}
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

              // Determine if personal filter should be applied
              const shouldApplyPersonalFilter = newViewFilter === 'personal';

              fetchEvents({
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                event_type: selectedEventTypeFilter !== 'all' ? selectedEventTypeFilter : undefined,
                search: searchQuery || undefined,
                page: 1,
                personal: shouldApplyPersonalFilter,
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

    return (
     <div style={themedStyles.mobileCard}>
      <div style={responsiveStyles.mobileCardRow}>
        <span style={themedStyles.mobileCardLabel}>Event Name:</span>
        <span style={themedStyles.mobileCardValue}>{event.eventName}</span>
      </div>
      <div style={responsiveStyles.mobileCardRow}>
        <span style={themedStyles.mobileCardLabel}>Leader:</span>
        <span style={themedStyles.mobileCardValue}>{event.eventLeaderName || '-'}</span>
      </div>
      {event.leader1 && (
        <div style={responsiveStyles.mobileCardRow}>
          <span style={themedStyles.mobileCardLabel}>Leader at 1:</span>
          <span style={themedStyles.mobileCardValue}>{event.leader1}</span>
        </div>
      )}
      {event.leader12 && (
        <div style={responsiveStyles.mobileCardRow}>
          <span style={themedStyles.mobileCardLabel}>Leader at 12:</span>
          <span style={themedStyles.mobileCardValue}>{event.leader12}</span>
        </div>
      )}
      <div style={responsiveStyles.mobileCardRow}>
        <span style={themedStyles.mobileCardLabel}>Day:</span>
        <span style={themedStyles.mobileCardValue}>
          {event.day || 'Not set'}
          {isOverdue(event) && (
            <span style={{ ...styles.overdueLabel, display: 'block', marginTop: '0.25rem' }}>
              Overdue
            </span>
          )}
        </span>
      </div>
      <div style={responsiveStyles.mobileCardRow}>
        <span style={themedStyles.mobileCardLabel}>Email:</span>
        <span style={themedStyles.mobileCardValue}>{event.eventLeaderEmail || '-'}</span>
      </div>
      <div style={responsiveStyles.mobileCardRow}>
        <span style={themedStyles.mobileCardLabel}>Date:</span>
        <span style={themedStyles.mobileCardValue}>{formatDate(event.date)}</span>
      </div>
      <div style={styles.mobileActions}>
        <Tooltip title="Capture Attendance" arrow>
          <IconButton
            onClick={() => handleCaptureClick(event)}
            sx={{ 
              backgroundColor: '#007bff', 
              color: 'white',
              '&:hover': { backgroundColor: '#0056b3' },
              padding: isSmallMobile ? '8px' : '10px',
            }}
          >
            <CheckBoxIcon fontSize={isSmallMobile ? "small" : "medium"} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Event" arrow>
          <IconButton
            onClick={() => handleEditEvent(event)}
            sx={{ padding: isSmallMobile ? '8px' : '10px' }}
          >
            <EditIcon fontSize={isSmallMobile ? "small" : "medium"} />
          </IconButton>
        </Tooltip>
        {isAdmin && (
          <Tooltip title="Delete Event" arrow>
            <IconButton
              onClick={() => handleDeleteEvent(event)}
              color="error"
              sx={{ padding: isSmallMobile ? '8px' : '10px' }}
            >
              <DeleteIcon fontSize={isSmallMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
    );
  };

  const startIndex = totalEvents > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0;
  const endIndex = Math.min(currentPage * rowsPerPage, totalEvents);
  const paginatedEvents = events;
  const allEventTypes = [...(eventTypes || []), ...(userCreatedEventTypes || [])];

  return (
    <div style={themedStyles.container}>
      <div style={themedStyles.topSection}>
        <EventTypeSelector />

        <div style={responsiveStyles.searchFilterRow}>
  <input
    type="text"
    placeholder={isSmallMobile ? "Search events..." : "Search by Event Name, Leader, or Email..."}
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
    style={responsiveStyles.filterButton}
    onClick={handleSearchSubmit}
    disabled={isLoading}
  >
    {isLoading ? '⏳' : 'SEARCH'}
  </button>

  <button
    style={{ ...styles.filterButton, backgroundColor: '#6c757d' }}
    onClick={clearAllFilters}
    disabled={isLoading}
  >
    {isLoading ? '⏳' : 'CLEAR ALL'}
  </button>
</div>

        <div style={responsiveStyles.viewFilterRow}>
          <StatusBadges />
          <ViewFilterButtons />
        </div>
      </div>

      {isMobile ? (
        <Box
          className="mobile-events-container"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
            border: `1px solid ${isDarkMode ? theme.palette.divider : '#e9ecef'}`,
            maxHeight: 'calc(100vh - 420px)',
            width: '100%',
          }}>
          <div style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            padding: "1rem",
            minHeight: "300px",
            width: "100%",
          }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} style={styles.loadingSkeleton} />
              ))
            ) : paginatedEvents.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: isDarkMode ? theme.palette.text.primary : '#666',
                }}
              >
                No events found matching your criteria.
              </div>
            ) : (
              <>
                {paginatedEvents.map((event) => (
                  <MobileEventCard key={event._id} event={event} />
                ))}
              </>
            )}
          </div>

          <div style={{
            padding: '1rem',
            borderTop: `1px solid ${isDarkMode ? theme.palette.divider : '#e9ecef'}`,
            backgroundColor: isDarkMode ? theme.palette.background.paper : '#f8f9fa',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: '#6c757d',
            }}>
              {totalEvents > 0 ?
                `${startIndex}-${endIndex} of ${totalEvents}` :
                '0-0 of 0'
              }
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #dee2e6',
                  backgroundColor: currentPage === 1 || isLoading ? '#f8f9fa' : '#fff',
                  color: currentPage === 1 || isLoading ? '#6c757d' : '#212529',
                  cursor: currentPage === 1 || isLoading ? 'not-allowed' : 'pointer',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                }}
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
              >
                {isLoading ? '⏳' : '◀ Prev'}
              </button>

              <span style={{ padding: '0 0.5rem', color: '#6c757d', fontSize: '0.875rem' }}>
                {currentPage} / {totalPages}
              </span>

              <button
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #dee2e6',
                  backgroundColor: currentPage >= totalPages || isLoading ? '#f8f9fa' : '#fff',
                  color: currentPage >= totalPages || isLoading ? '#6c757d' : '#212529',
                  cursor: currentPage >= totalPages || isLoading ? 'not-allowed' : 'pointer',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                }}
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || isLoading || totalPages === 0}
              >
                {isLoading ? '⏳' : 'Next ▶'}
              </button>
            </div>
          </div>
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

      <div style={fabStyles.fabContainer}>
        {fabMenuOpen && (
          <div style={fabStyles.fabMenu}>
            {isAdmin && (
              <div
                style={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                   handleFixLeaders();
                }}
              >
                <span style={fabStyles.fabMenuLabel}>Fix All Leaders @1</span>
                <div style={fabStyles.fabMenuIcon}>🔧</div>
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

      <style>{`
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

        @media (max-width: 768px) {
          .mobile-events-container {
            height: auto !important;
            min-height: 300px !important;
            max-height: calc(100vh - 450px) !important;
          }
        }

        @media (max-width: 480px) {
          .mobile-events-container {
            max-height: calc(100vh - 500px) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Events;