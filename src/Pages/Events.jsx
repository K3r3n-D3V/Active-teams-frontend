import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useTheme } from "@mui/material/styles";
import AttendanceModal from "./AttendanceModal";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Tooltip from "@mui/material/Tooltip";
import {
  Box,
  useMediaQuery,
  LinearProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
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
import GetAppIcon from "@mui/icons-material/GetApp";

import Eventsfilter from "./AddPersonToEvents";
import CreateEvents from "./CreateEvents";
import EventTypesModal from "./EventTypesModal";
import EditEventModal from "./EditEventModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../contexts/AuthContext";

const formatRecurringDays = (recurringDays) => {
  if (!recurringDays || recurringDays.length === 0) {
    return null;
  }

  if (recurringDays.length === 1) {
    return `Every ${recurringDays[0]}`;
  }

  const dayOrder = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };

  const sorted = [...recurringDays].sort((a, b) => dayOrder[a] - dayOrder[b]);

  if (sorted.length === 2) {
    return `Every ${sorted[0]} & ${sorted[1]}`;
  }

  const last = sorted.pop();
  return `Every ${sorted.join(", ")} & ${last}`;
};

const getNextOccurrence = (recurringDays, fromDate = new Date()) => {
  if (!recurringDays || recurringDays.length === 0) {
    return null;
  }

  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const targetDays = recurringDays
    .map((day) => dayMap[day])
    .filter((d) => d !== undefined)
    .sort((a, b) => a - b);

  if (targetDays.length === 0) return null;

  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDay();

  let daysToAdd = null;

  for (const targetDay of targetDays) {
    if (targetDay > currentDay) {
      daysToAdd = targetDay - currentDay;
      break;
    }
  }

  if (daysToAdd === null) {
    daysToAdd = 7 - currentDay + targetDays[0];
  }

  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return nextDate;
};

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
    height: "100vh",
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
    overflowY: "auto",
    padding: "0 1rem",
    paddingBottom: "70px",
  },
  statusBadge: {
    padding: "0.6rem 1.2rem",
    borderRadius: "12px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    border: "2px solid",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
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
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    justifyContent: "center",
  },
  truncatedText: {
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  emailText: {
    maxWidth: "180px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  viewFilterLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#495057",
  },
  viewFilterRadio: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
  },
  viewFilterText: {
    fontSize: "1.1rem",
    transition: "all 0.2s ease",
  },
  rowsSelect: {
    padding: "0.25rem 0.5rem",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontSize: "0.875rem",
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "1rem",
    borderTop: "1px solid #e9ecef",
    backgroundColor: "#f8f9fa",
    gap: "1.5rem",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
    flexWrap: "wrap",
    paddingRight: "96px",
  },
  rowsPerPage: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    color: "#6c757d",
  },
  paginationInfo: {
    fontSize: "0.875rem",
    color: "#6c757d",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
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
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
      backgroundColor: "#f8f9fa",
    },
    "&:focus": {
      outline: "2px solid #007bff",
      outlineOffset: "2px",
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
    boxShadow: isDarkMode
      ? "0 2px 4px rgba(0,0,0,0.2)"
      : "0 2px 4px rgba(0,0,0,0.05)",
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
    boxShadow: isDarkMode
      ? "0 4px 8px rgba(0,0,0,0.3)"
      : "0 4px 8px rgba(0,0,0,0.1)",
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
  return dateObj
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, " - ");
};

const generateDynamicColumns = (events, isOverdue, selectedEventTypeFilter) => {
  if (!events || events.length === 0) return [];

  const sampleEvent = events[0];
  const filteredFields = Object.keys(sampleEvent).filter((key) => {
    const keyLower = key.toLowerCase();

    const excludedFields = [
      "persistent_attendees",
      "uuid",
      "did_not_meet",
      "status",
      "week_identifier",
      "attendees",
      "_id",
      "isoverdue",
      "attendance",
      "location",
      "eventtype",
      "event_type",
      "eventtypes",
      "status",
      "displaydate",
      "originatedid",
      "leader12",
      "leader@12",
      "leader at 12",
      "original_event_id",
      "_is_overdue",
      "haspersonsteps",
      "haspersonsteps",
      "has_person_steps",
      "is_recurring",
      "isrecurring",
      "recurring",
    ];

    const exactMatch = excludedFields.includes(key);
    const caseInsensitiveMatch = excludedFields.some(
      (excluded) => excluded.toLowerCase() === keyLower
    );

    const containsOverdue = keyLower.includes("overdue");
    const containsDisplayDate =
      keyLower.includes("display") && keyLower.includes("date");
    const containsOriginated = keyLower.includes("originated");
    const containsLeader12 =
      keyLower.includes("leader") && keyLower.includes("12");
    const containsLeader1 =
      keyLower.includes("leader1") ||
      keyLower.includes("leader@1") ||
      keyLower.includes("leader at 1");
    const shouldExcludeLeader1 =
      containsLeader1 &&
      selectedEventTypeFilter !== "all" &&
      selectedEventTypeFilter !== "CELLS" &&
      selectedEventTypeFilter !== "Cells";

    const containsPersonSteps =
      keyLower.includes("person") && keyLower.includes("steps");
    const shouldExclude =
      exactMatch ||
      caseInsensitiveMatch ||
      containsOverdue ||
      containsDisplayDate ||
      containsOriginated ||
      containsLeader12 ||
      shouldExcludeLeader1 ||
      containsPersonSteps;

    return !shouldExclude;
  });
  const columns = [];

  columns.push({
    field: "overdue",
    headerName: "Status",
    flex: 0.8,
    minWidth: 100,
    renderCell: (params) => {
      const isOverdueEvent = isOverdue(params.row);
      const status = params.row.status || "incomplete";

      if (
        isOverdueEvent &&
        (selectedEventTypeFilter === "all" ||
          selectedEventTypeFilter === "CELLS")
      ) {
        return (
          <Box
            sx={{
              color: "#dc3545",
              fontSize: "0.8rem",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              textAlign: "center",
              width: "100%",
            }}
          >
            OVERDUE
          </Box>
        );
      }
      return (
        <Box
          sx={{
            color:
              status === "complete"
                ? "#28a745"
                : status === "did_not_meet"
                ? "#dc3545"
                : "#6c757d",
            fontWeight: "500",
            fontSize: "0.8rem",
            textTransform: "capitalize",
            textAlign: "center",
            width: "100%",
          }}
        >
          {status.replace("_", " ")}
        </Box>
      );
    },
  });

  
columns.push({
  field: 'recurring_info',
  headerName: 'Recurring',
  flex: 0.8,
  minWidth: 120,
  renderCell: (params) => {
    // ADD SAFETY CHECKS
    if (!params || !params.row) {
      return <Box sx={{ color: '#6c757d', fontSize: '0.95rem' }}>-</Box>;
    }

    const row = params.row;
    const isRecurring = row.is_recurring ||
                        (row.recurring_days && Array.isArray(row.recurring_days) && row.recurring_days.length > 0);

    return (
      <Box sx={{
        color: isRecurring ? '#2196f3' : '#6c757d',
        fontSize: '0.95rem',
        fontWeight: isRecurring ? 'bold' : 'normal',
        textAlign: 'center',
        width: '100%',
      }}>
        {isRecurring ? 'True' : 'False'}
      </Box>
    );
  },
});

  columns.push(
    ...filteredFields.map((key) => ({
      field: key,
      headerName: key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase()),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const value = params.value;
        if (key.toLowerCase().includes("date")) return formatDate(value);
        if (!value) return "-";

        return (
          <Box
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 180,
            }}
            title={String(value)}
          >
            {String(value)}
          </Box>
        );
      },
    }))
  );

  return columns;
};

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
  selectedEventTypeFilter,
}) => {
  if (!theme) {
    return <Box sx={{ height: 100 }} />;
  }
  const isDark = theme.palette.mode === "dark";
  const borderColor = isDark ? theme.palette.divider : "#e9ecef";

  const attendeesCount = event.attendees?.length || 0;
  const isCellEvent =
    selectedEventTypeFilter === "all" ||
    selectedEventTypeFilter === "CELLS" ||
    selectedEventTypeFilter === "Cells";

  return (
    <div
      style={{
        ...styles.mobileCard,
        borderColor: borderColor,
        backgroundColor: isDark ? theme.palette.background.default : "#fff",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          marginBottom: "0.75rem",
          color: isDark ? "#fff" : "#333",
        }}
      >
        {event.eventName || "N/A"}
      </Typography>
      {event.is_recurring &&
        event.recurring_days &&
        event.recurring_days.length > 1 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
              padding: "0.25rem 0.5rem",
              backgroundColor: isDark ? "rgba(33, 150, 243, 0.1)" : "#e3f2fd",
              borderRadius: "8px",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#2196f3",
                fontWeight: "bold",
                fontSize: "0.7rem",
              }}
            >
              RECURRING
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? "#fff" : "#666",
                fontSize: "0.7rem",
              }}
            >
              {formatRecurringDays(event.recurring_days)}
            </Typography>
          </Box>
        )}
      {isOverdue && (
        <Typography
          variant="caption"
          sx={{ color: theme.palette.error.main, fontWeight: "bold" }}
        >
          OVERDUE!
        </Typography>
      )}
      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Date:</span>
        <span style={styles.mobileCardValue}>{formatDate(event.date)}</span>
      </div>
      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Leader:</span>
        <span style={styles.mobileCardValue}>
          {event.eventLeaderName || "N/A"}
        </span>
      </div>
      {isCellEvent && (
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Leader @1:</span>
          <span style={styles.mobileCardValue}>{event.leader1 || "N/A"}</span>
        </div>
      )}
      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Leader @12:</span>
        <span style={styles.mobileCardValue}>{event.leader12 || "N/A"}</span>
      </div>
      <div style={styles.mobileActions}>
        <Tooltip title={`View Attendance (${attendeesCount} people)`}>
          <IconButton
            onClick={() => onOpenAttendance(event)}
            size="small"
            sx={{ color: theme.palette.primary.main }}
          >
            <CheckBoxIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit Event">
          <IconButton
            onClick={() => onEdit(event)}
            size="small"
            sx={{ color: "#ffc107" }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isAdmin && (
          <Tooltip title="Delete Event">
            <IconButton
              onClick={() => onDelete(event)}
              size="small"
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

const isValidObjectId = (id) => {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const Events = () => {
const { authFetch, logout } = React.useContext(AuthContext);
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down("lg"));
  const isDarkMode = theme.palette.mode === "dark";
  const token = localStorage.getItem("access_token");
  const eventTypeStyles = useMemo(() => {
    return getEventTypeStyles(isDarkMode, theme);
  }, [isDarkMode, theme]);
  console.log(eventTypeStyles)

  const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
  const userRole = currentUser?.role?.toLowerCase() || "";

  const isAdmin = userRole === "admin";
  const isRegistrant = userRole === "registrant";
  const isRegularUser = userRole === "user";

  const isLeaderAt12 =
    userRole.toLowerCase().includes("leaderat12") ||
    userRole.toLowerCase().includes("leader at 12") ||
    userRole.toLowerCase().includes("leader@12") ||
    userRole.toLowerCase().includes("leader @12") ||
    userRole.toLowerCase() === "leaderat12" ||
    userRole.toLowerCase() === "leader at 12";

  console.log("User role:", userRole, "Is Leader at 12:", isLeaderAt12);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const DEFAULT_API_START_DATE = "2025-11-30";

  const [showFilter, setShowFilter] = useState(false);
  const [events, setEvents] = useState([]);
  const [, setActiveFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [, setUserCreatedEventTypes] = useState([]);
  const [customEventTypes, setCustomEventTypes] = useState([]);
  const [selectedEventTypeObj, setSelectedEventTypeObj] = useState(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
 
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("incomplete");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserLeaderAt1, setCurrentUserLeaderAt1] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [toDeleteType, setToDeleteType] = useState(null);
  const [eventTypesModalOpen, setEventTypesModalOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState(null);
  const [eventTypes, setEventTypes] = useState([]);

  const initialViewFilter = useMemo(() => {
    if (isLeaderAt12) {
      return "all";
    } else if (isRegularUser || isRegistrant) {
      return "personal";
    } else if (isAdmin) {
      return "all";
    }
    return "all";
  }, [isLeaderAt12, isRegularUser, isRegistrant, isAdmin]);

  const [viewFilter, setViewFilter] = useState(initialViewFilter);
  const [filterOptions, setFilterOptions] = useState({
    leader: "",
    day: "all",
    eventType: "all",
  });

  const cacheRef = useRef({
    data: new Map(),
    timestamp: new Map(),
    CACHE_DURATION: 24 * 60 * 60 * 1000,
  });

  const getCacheKey = useCallback((params) => {
    return JSON.stringify({
      page: params.page,
      limit: params.limit,
      status: params.status,
      event_type: params.event_type,
      search: params.search,
      personal: params.personal,
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

const escapeHtml = (s) =>
    String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const buildXlsFromRows = (rows, fileBaseName = "export") => {
    if (!rows || rows.length === 0) {
      toast.info("No data to export");
      return;
    }

    const headers = Object.keys(rows[0]);
    const columnWidths = headers.map((header) => {
      let maxLength = header.length;
      rows.forEach((r) => {
        const v = String(r[header] || "");
        if (v.length > maxLength) maxLength = v.length;
      });
      return Math.min(Math.max(maxLength * 7 + 5, 65), 350);
    });

    const xmlCols = columnWidths
      .map(
        (w, i) =>
          `                    <x:Column ss:Index="${i + 1}" ss:AutoFitWidth="0" ss:Width="${w}"/>`,
      )
      .join("\n");

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>${escapeHtml(fileBaseName)}</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                  <x:WorksheetColumns>
${xmlCols}
                  </x:WorksheetColumns>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; }
            th { background-color: #a3aca3ff; color: white; font-weight: bold; padding: 12px 8px; text-align: center; border: 1px solid #ddd; font-size: 11pt; white-space: nowrap; }
            td { padding: 8px; border: 1px solid #ddd; font-size: 10pt; text-align: left; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <table border="1">
            <thead><tr>
    `;

    headers.forEach((h) => {
      html += `                <th>${escapeHtml(h)}</th>\n`;
    });
    html += `              </tr></thead><tbody>\n`;

    rows.forEach((row) => {
      html += `              <tr>\n`;
      headers.forEach((h) => {
        html += `                <td>${escapeHtml(row[h] || "")}</td>\n`;
      });
      html += `              </tr>\n`;
    });

    html += `            </tbody></table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const fileName = `${fileBaseName}_${new Date().toISOString().split("T")[0]}.xls`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const normalizeEventAttendance = (event) => {
    if (!event) return [];
    // attendance may live under event.attendance (object keyed by week/date) or event.attendees
    const eventDate = event.date;
    let weekAttendance = event.attendance || {};
    if (weekAttendance && typeof weekAttendance === "object" && !weekAttendance.status) {
      weekAttendance = weekAttendance[eventDate] || {};
    }
    const attendees = weekAttendance?.attendees || event.attendees || [];

    // map to rows similar to AttendanceModal
    return (attendees || []).map((att) => ({
      "Event ID": event._id || event.id || "",
      "Event Name": event.eventName || event.Event_Name || event.name || "",
      "Event Date": formatDate(event.date),
      "Attendee ID": att.id || att._id || "",
      "Name": att.fullName || att.name || "",
      "Email": att.email || "",
      "Leader @12": att.leader12 || "",
      "Leader @144": att.leader144 || "",
      "Phone": att.phone || "",
      "Checked In Time": att.time || "",
      "Decision": att.decision || "",
      "Price Tier": att.priceTier || att.price_tier || "",
      "Payment Method": att.paymentMethod || "",
      "Price": att.price !== undefined ? `R${Number(att.price).toFixed(2)}` : "",
      "Paid": att.paid !== undefined ? `R${Number(att.paid).toFixed(2)}` : "",
      "Owing": att.owing !== undefined ? `R${Number(att.owing).toFixed(2)}` : "",
    }));
  };

  const fetchEventFull = async (event) => {
    try {
      let eventId = event._id || event.id;
      if (!eventId) return event;
      if (eventId.includes("_")) eventId = eventId.split("_")[0];
      const token = localStorage.getItem("access_token");
      const res = await authFetch(`${BACKEND_URL}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res && res.ok) {
        const data = await res.json();
        return data || event;
      }
      return event;
    } catch (err) {
      console.error("Failed to fetch full event:", err);
      return event;
    }
  };

  const downloadEventAttendance = async (event) => {
    try {
      const fullEvent = await fetchEventFull(event);
      const rows = normalizeEventAttendance(fullEvent);
      if (!rows || rows.length === 0) {
        toast.info("No attendees found for this event.");
        return;
      }
      buildXlsFromRows(rows, `attendance_${(fullEvent.eventName || "event").replace(/\s/g,"_")}`);
    } catch (err) {
      console.error("Download event attendance failed:", err);
      toast.error("Failed to download event attendance");
    }
  };

  const downloadEventsByStatus = async (status) => {
    try {
      if (!status || (status !== "complete" && status !== "did_not_meet")) {
        toast.info("Download is available only for 'complete' and 'did_not_meet' statuses.");
        return;
      }

      // Gather rows for each event matching selected status from current list
      const eventsToExport = events.filter((ev) => {
        const s = (ev.status || ev.Status || "").toString().toLowerCase().replace(/\s/g, "_");
        const didNot = ev.did_not_meet || ev.status === "did_not_meet" || s === "did_not_meet";
        if (status === "did_not_meet") return didNot;
        return s === "complete";
      });

      if (!eventsToExport.length) {
        toast.info("No events with the selected status to export.");
        return;
      }

      // fetch full events in parallel (to ensure attendance present)
      const fullEvents = await Promise.all(eventsToExport.map((ev) => fetchEventFull(ev)));
      const allRows = fullEvents.flatMap((ev) => normalizeEventAttendance(ev));

      if (!allRows.length) {
        toast.info("No attendees found for selected events.");
        return;
      }

      buildXlsFromRows(allRows, `events_${status}`);
    } catch (err) {
      console.error("Download events by status failed:", err);
      toast.error("Failed to download events for selected status");
    }
  };

  const paginatedEvents = useMemo(() => events, [events]);
  const startIndex = useMemo(() => {
    return totalEvents > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
  }, [currentPage, rowsPerPage, totalEvents]);
  const endIndex = useMemo(() => {
    return Math.min(currentPage * rowsPerPage, totalEvents);
  }, [currentPage, rowsPerPage, totalEvents]);

  const allEventTypes = useMemo(() => {
    return [
      "all",
      ...eventTypes.map((t) => (typeof t === "string" ? t : t.name)),
    ];
  }, [eventTypes]);


  const fetchEvents = useCallback(
  async (filters = {}, showLoader = true) => {
    if (showLoader) {
      setLoading(true);
      setIsLoading(true);
    }

    try {
      // Check token first
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.log("No token found, redirecting to login");
        logout();
        window.location.href = '/login';
        return;
      }

      const params = {
        page: filters.page || currentPage,
        limit: filters.limit || rowsPerPage,
        start_date: filters.start_date || DEFAULT_API_START_DATE,
      };

      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.event_type) params.event_type = filters.event_type;

      let endpoint;

      if (
        filters.event_type === "CELLS" ||
        filters.event_type === "all" ||
        !filters.event_type
      ) {
        endpoint = `${BACKEND_URL}/events/cells`;

        console.log("Current user role:", userRole);
        console.log("Is Leader at 12:", isLeaderAt12);
        console.log("View filter:", viewFilter);

        if (isLeaderAt12) {
          console.log("LEADER AT 12 MODE ACTIVATED");
          params.leader_at_12_view = true;
          params.isLeaderAt12 = true;

          if (viewFilter === "personal") {
            console.log("   Personal view for Leader at 12");
            params.show_personal_cells = true;
            params.personal = true;
          } else {
            console.log("   View All Under Me for Leader at 12");
            params.show_all_authorized = true;
            params.include_subordinate_cells = true;
          }

          params.firstName = currentUser?.name || "";
          params.userSurname = currentUser?.surname || "";
          
          const userFullName = `${currentUser?.name || ''} ${currentUser?.surname || ''}`.trim();
          if (userFullName) {
            params.userFullName = userFullName;
          }

          if (currentUserLeaderAt1) {
            params.leader_at_1_identifier = currentUserLeaderAt1;
          }
        } else if (isAdmin) {
          console.log("Admin mode");
          if (viewFilter === "personal") {
            params.personal = true;
          }
        } else if (isRegistrant || isRegularUser) {
          console.log("Regular user/registrant mode");
          params.personal = true;
        } else {
          params.personal = true;
        }
      } else {
        endpoint = `${BACKEND_URL}/events/other`;

        if (isAdmin && viewFilter === "personal") {
          params.personal = true;
        } else if (isRegularUser || isRegistrant) {
          params.personal = true;
        }
      }

      Object.keys(params).forEach(
        key => (params[key] === undefined || params[key] === '') && delete params[key]
      );

      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `${endpoint}?${queryString}`;
      console.log("Fetching from:", fullUrl);
      console.log("Parameters:", params);

      const response = await authFetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        
        if (response.status === 401) {
          console.log('Authentication failed, attempting refresh...');
          try {
            // Try to refresh token
            await refreshToken();
            // Retry the request
            const newToken = localStorage.getItem("access_token");
            const retryResponse = await fetch(fullUrl, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${newToken}`,
                "Content-Type": "application/json",
              },
            });
            
            if (!retryResponse.ok) {
              throw new Error(`HTTP ${retryResponse.status}: ${await retryResponse.text()}`);
            }
            
            const data = await retryResponse.json();
            (data.events || []);
            setTotalEvents(data.total_events || 0);
            setTotalPages(data.total_pages || 1);
            return;
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            toast.error('Session expired. Please log in again.');
            setTimeout(() => {
              logout();
              window.location.href = '/login';
            }, 1500);
            return;
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      console.log("Got data:", data.events?.length, "events");
      console.log("User info:", data.user_info);

      setEvents(data.events || []);
      setTotalEvents(data.total_events || 0);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error("Error:", error);
      
      // Don't show error if it's an auth issue (already handled)
      if (!error.message.includes('401') && !error.message.includes('Session expired')) {
        const errorMessage = error.message || 'Failed to load events';
        toast.error(`Failed to load events: ${errorMessage}`);
      }
      
      setEvents([]);
    } finally {
      if (showLoader) {
        setLoading(false);
        setIsLoading(false);
      }
    }
  },
  [
    currentPage,
    rowsPerPage,
    authFetch,
    BACKEND_URL,
    DEFAULT_API_START_DATE,
    isLeaderAt12,
    isAdmin,
    isRegularUser,
    isRegistrant,
    viewFilter,
    currentUserLeaderAt1,
    currentUser,
    userRole,
    logout,
  ]
);

  const fetchEventTypes = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await authFetch(`${BACKEND_URL}/event-types`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch event types`);
      }

      const eventTypesData = await response.json();
      const actualEventTypes = eventTypesData.filter(
        (item) => item.isEventType === true
      );

      setEventTypes(actualEventTypes);
      setCustomEventTypes(actualEventTypes);
      setUserCreatedEventTypes(actualEventTypes);
      localStorage.setItem("eventTypes", JSON.stringify(actualEventTypes));

      return actualEventTypes;
    } catch (error) {
      console.error("Error fetching event types:", error);
      try {
        const cachedTypes = localStorage.getItem("eventTypes");
        if (cachedTypes) {
          const parsed = JSON.parse(cachedTypes);
          const uppercasedCached = parsed.map((type) => ({
            ...type,
            name: type.name ? type.name.toUpperCase() : type.name,
            displayName: type.name ? type.name.toUpperCase() : type.name,
          }));
          setEventTypes(uppercasedCached);
          setCustomEventTypes(uppercasedCached);
          setUserCreatedEventTypes(uppercasedCached);
          return uppercasedCached;
        }
      } catch (cacheError) {
        console.error("Cache read failed:", cacheError);
      }
      return [];
    }
  }, [BACKEND_URL]);

  useEffect(() => {
  const getUserProfile = () => {
    const userProfile = localStorage.getItem("userProfile");
    if (userProfile) {
      try {
        const user = JSON.parse(userProfile);
        console.log("👤 Current user profile:", user);
        console.log("Leader at 1 field:", user.leaderAt1 || user.leader_at_1 || user.leaderAt1Identifier);
        
        const leaderAt1 = user.leaderAt1 || user.leader_at_1 || user.leaderAt1Identifier || '';
        setCurrentUserLeaderAt1(leaderAt1);
        console.log("Set currentUserLeaderAt1 to:", leaderAt1);
      } catch (error) {
        console.error("Error parsing user profile:", error);
      }
    }
  };
  
  getUserProfile();
}, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setFilterOptions({
      leader: "",
      day: "all",
      eventType: "all",
    });
    setActiveFilters({});
    setSelectedEventTypeFilter("all");
    setSelectedStatus("incomplete");
    setCurrentPage(1);

    const shouldApplyPersonalFilter =
      viewFilter === "personal" &&
      (userRole === "admin" || userRole === "leader at 12");

    fetchEvents(
      {
        page: 1,
        limit: rowsPerPage,
        personal: shouldApplyPersonalFilter,
        start_date: DEFAULT_API_START_DATE,
      },
      true
    );
  }, [viewFilter, userRole, fetchEvents, rowsPerPage, DEFAULT_API_START_DATE]);

  const handleSearchSubmit = useCallback(() => {
    const trimmedSearch = searchQuery.trim();

    let shouldApplyPersonalFilter = undefined;
    if (userRole === "admin" || userRole === "leader at 12") {
      shouldApplyPersonalFilter = viewFilter === "personal" ? true : undefined;
    }

    setCurrentPage(1);

    fetchEvents(
      {
        page: 1,
        limit: rowsPerPage,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        event_type:
          selectedEventTypeFilter !== "all"
            ? selectedEventTypeFilter
            : undefined,
        search: trimmedSearch || undefined,
        personal: shouldApplyPersonalFilter,
        start_date: DEFAULT_API_START_DATE,
      },
      true,
      false
    );
  }, [
    searchQuery,
    userRole,
    viewFilter,
    fetchEvents,
    rowsPerPage,
    selectedStatus,
    selectedEventTypeFilter,
    DEFAULT_API_START_DATE,
  ]);

  const handleRowsPerPageChange = useCallback(
    (e) => {
      const newRowsPerPage = Number(e.target.value);
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1);
      const shouldApplyPersonalFilter =
        viewFilter === "personal" &&
        (userRole === "admin" || userRole === "leader at 12");

      fetchEvents(
        {
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
          event_type:
            selectedEventTypeFilter !== "all"
              ? selectedEventTypeFilter
              : undefined,
          page: 1,
          limit: newRowsPerPage,
          personal: shouldApplyPersonalFilter ? true : undefined,
          start_date: DEFAULT_API_START_DATE,
        },
        true
      );
    },
    [
      viewFilter,
      userRole,
      fetchEvents,
      selectedStatus,
      searchQuery,
      selectedEventTypeFilter,
      DEFAULT_API_START_DATE,
    ]
  );


  const handleNextPage = useCallback(() => {
  if (currentPage < totalPages && !isLoading) {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
  }
}, [currentPage, totalPages, isLoading]);

 
const handlePreviousPage = useCallback(() => {
  if (currentPage > 1 && !isLoading) {
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
  }
}, [currentPage, isLoading]);

  const handleCaptureClick = useCallback((event) => {
    setSelectedEvent(event);
    setAttendanceModalOpen(true);
  }, []);

  const handleCloseCreateEventModal = useCallback(
    (shouldRefresh = false) => {
      setCreateEventModalOpen(false);

      if (shouldRefresh) {
        clearCache();
        setCurrentPage(1);

        setTimeout(() => {
          const refreshParams = {
            page: 1,
            limit: rowsPerPage,
            start_date: DEFAULT_API_START_DATE,
            _t: Date.now(),
            status: selectedStatus !== "all" ? selectedStatus : undefined,
            search: searchQuery.trim() || undefined,
          };

          if (
            selectedEventTypeFilter === "all" ||
            selectedEventTypeFilter === "CELLS" ||
            !selectedEventTypeFilter
          ) {
            refreshParams.event_type = "CELLS";

            if (isLeaderAt12) {
              refreshParams.leader_at_12_view = true;
              if (viewFilter === "personal") {
                refreshParams.personal_cells_only = true;
              } else {
                refreshParams.include_subordinate_cells = true;
              }
            } else if (isAdmin && viewFilter === "personal") {
              refreshParams.personal = true;
            }
          } else {
            refreshParams.event_type = selectedEventTypeFilter;
          }

          fetchEvents(refreshParams, true);
        }, 800);
      }
    },
    [
      clearCache,
      rowsPerPage,
      selectedStatus,
      selectedEventTypeFilter,
      searchQuery,
      isLeaderAt12,
      isAdmin,
      viewFilter,
      fetchEvents,
      DEFAULT_API_START_DATE,
    ]
  );

  const applyFilters = useCallback(
    (filters) => {
      setActiveFilters(filters);
      setFilterOptions(filters);
      setCurrentPage(1);

      const shouldApplyPersonalFilter =
        viewFilter === "personal" &&
        (userRole === "admin" || userRole === "leader at 12");

      const apiFilters = {
        page: 1,
        limit: rowsPerPage,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        event_type:
          selectedEventTypeFilter !== "all"
            ? selectedEventTypeFilter
            : undefined,
        search: searchQuery.trim() || undefined,
        personal: shouldApplyPersonalFilter ? true : undefined,
        start_date: DEFAULT_API_START_DATE,
      };

      if (filters.leader && filters.leader.trim()) {
        apiFilters.search = filters.leader.trim();
      }

      if (filters.day && filters.day !== "all") {
        apiFilters.day = filters.day;
      }

      if (filters.eventType && filters.eventType !== "all") {
        apiFilters.event_type = filters.eventType;
      }

      Object.keys(apiFilters).forEach(
        (key) => apiFilters[key] === undefined && delete apiFilters[key]
      );

      fetchEvents(apiFilters, true);
    },
    [
      viewFilter,
      userRole,
      rowsPerPage,
      selectedStatus,
      selectedEventTypeFilter,
      searchQuery,
      fetchEvents,
      DEFAULT_API_START_DATE,
    ]
  );


  const handleAttendanceSubmit = useCallback(
  async (data) => {
    try {
      const token = localStorage.getItem("access_token");
      const eventId = selectedEvent._id;
      const eventName = selectedEvent.eventName || "Event";
      const eventDate = selectedEvent.date || "";

      const leaderEmail = currentUser?.email || "";
      const leaderName =
        `${(currentUser?.name || "").trim()} ${(
          currentUser?.surname || ""
        ).trim()}`.trim() ||
        currentUser?.name ||
        "";

      let payload;

      if (data === "did_not_meet") {
        payload = {
          attendees: [],
          all_attendees: [],
          leaderEmail,
          leaderName,
          did_not_meet: true,
          event_date: eventDate,
        };
      } else if (Array.isArray(data)) {
        payload = {
          attendees: data,
          all_attendees: data,
          leaderEmail,
          leaderName,
          did_not_meet: false,
          event_date: eventDate,
        };
      } else {
        payload = {
          ...data,
          leaderEmail,
          leaderName,
          event_date: eventDate,
        };
      }

      const response = await fetch(
        `${BACKEND_URL.replace(/\/$/, "")}/submit-attendance/${eventId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const result = await response.json();

      clearCache();

      setAttendanceModalOpen(false);
      setSelectedEvent(null);

      toast.success(
        payload.did_not_meet
          ? `${eventName} marked as 'Did Not Meet'.`
          : `Successfully captured attendance for ${eventName}`
      );

      setTimeout(() => {
        (async () => {
          try {
            const shouldApplyPersonalFilter =
              viewFilter === "personal" &&
              (userRole === "admin" || userRole === "leader at 12");

            const refreshParams = {
              page: 1,
              limit: rowsPerPage,
              start_date: DEFAULT_API_START_DATE,
              _t: Date.now(),
              ...(searchQuery.trim() && { search: searchQuery.trim() }),
              ...(selectedEventTypeFilter !== "all" && {
                event_type: selectedEventTypeFilter,
              }),
              ...(selectedStatus !== "all" && { status: selectedStatus }),
              ...(shouldApplyPersonalFilter && { personal: true }),
              ...(isLeaderAt12 && {
                leader_at_12_view: true,
                include_subordinate_cells: true,
                ...(currentUserLeaderAt1 && {
                  leader_at_1_identifier: currentUserLeaderAt1,
                }),
                ...(viewFilter === "personal"
                  ? { show_personal_cells: true, personal: true }
                  : { show_all_authorized: true }),
              }),
            };

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
      
      if (error.message) {
        errorMessage = error.message;
      }

      toast.error(`Error: ${errorMessage}`);

      return { success: false, message: errorMessage };
    }
  },
  [
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
    DEFAULT_API_START_DATE,
  ]
);

  const handleEditEvent = useCallback((event) => {
    let eventId = event._id;
    let eventDate = event.date;

    if (eventId && eventId.includes("_")) {
      const parts = eventId.split("_");
      if (parts.length > 0 && isValidObjectId(parts[0])) {
        eventId = parts[0];
      }
    }

    const eventToEdit = {
      ...event,
      _id: eventId,
      original_composite_id: event._id,
      date: eventDate,
      UUID: event.UUID || event.uuid || null,
    };

    if (!eventToEdit._id && !eventToEdit.UUID) {
      toast.error(
        "Cannot edit event: Missing identifier. Please refresh and try again."
      );
      return;
    }

    setSelectedEvent(eventToEdit);
    setEditModalOpen(true);
  }, []);

  const handleDeleteEvent = useCallback(
  async (event) => {
    if (
      window.confirm(`Are you sure you want to delete "${event.eventName}"?`)
    ) {
      try {
        const token = localStorage.getItem("access_token");

        let eventId = event._id;
        if (eventId && eventId.includes("_")) {
          const parts = eventId.split("_");
          if (parts.length > 0 && isValidObjectId(parts[0])) {
            eventId = parts[0];
          }
        }

        const response = await authFetch(`${BACKEND_URL}/events/${eventId}`, {
          method: "DELETE",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (response.ok || response.status === 200) {
          const refreshParams = {
            page: currentPage,
            limit: rowsPerPage,
            start_date: DEFAULT_API_START_DATE,
            _t: Date.now(),
          };

          if (selectedEventTypeFilter && selectedEventTypeFilter !== "all") {
            refreshParams.event_type = selectedEventTypeFilter;
          } else {
            refreshParams.event_type = "CELLS";
          }

          if (selectedStatus && selectedStatus !== "all") {
            refreshParams.status = selectedStatus;
          }

          if (searchQuery && searchQuery.trim()) {
            refreshParams.search = searchQuery.trim();
          }

          if (
            selectedEventTypeFilter === "all" ||
            selectedEventTypeFilter === "CELLS"
          ) {
            if (isLeaderAt12) {
              refreshParams.leader_at_12_view = true;
              refreshParams.include_subordinate_cells = true;

              if (currentUserLeaderAt1) {
                refreshParams.leader_at_1_identifier = currentUserLeaderAt1;
              }

              if (viewFilter === "personal") {
                refreshParams.show_personal_cells = true;
                refreshParams.personal = true;
              } else {
                refreshParams.show_all_authorized = true;
              }
            } else if (isAdmin && viewFilter === "personal") {
              refreshParams.personal = true;
            }
          }

          await fetchEvents(refreshParams, true);

          toast.success("Event deleted successfully!");
        }
      } catch (error) {
        console.error("Error deleting event:", error);

        let errorMessage = "Failed to delete event";
        if (error.response?.data) {
          errorMessage =
            error.response.data.detail || error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error(`Error: ${errorMessage}`);
      }
    }
  },
  [
    BACKEND_URL,
    currentPage,
    rowsPerPage,
    selectedEventTypeFilter,
    selectedStatus,
    searchQuery,
    isLeaderAt12,
    isAdmin,
    viewFilter,
    currentUserLeaderAt1,
    fetchEvents,
    DEFAULT_API_START_DATE,
    authFetch,
  ]
);

  const handleSaveEvent = useCallback(
    async (eventData) => {
      try {
        const eventIdentifier = selectedEvent?._id;

        if (!eventIdentifier) {
          throw new Error("No event identifier found");
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const cleanPayload = Object.entries(eventData).reduce(
          (acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );

        const endpoint = `${BACKEND_URL}/events/${eventIdentifier}`;

        const response = await authFetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanPayload),
        });

        if (!response.ok) {
          let errorData;
          let errorMessage;

          try {
            errorData = await response.json();

            if (typeof errorData === "string") {
              errorMessage = errorData;
            } else if (errorData.detail) {
              errorMessage =
                typeof errorData.detail === "string"
                  ? errorData.detail
                  : JSON.stringify(errorData.detail);
            } else if (errorData.message) {
              errorMessage = errorData.message;
            } else {
              errorMessage = JSON.stringify(errorData);
            }
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }
        const updatedEvent = await response.json();

        clearCache();

        toast.success("Event updated successfully!");

        setEditModalOpen(false);
        setSelectedEvent(null);

        setTimeout(() => {
          const refreshParams = {
            page: currentPage,
            limit: rowsPerPage,
            start_date: DEFAULT_API_START_DATE,
            _t: Date.now(),
          };

          if (selectedEventTypeFilter !== "all") {
            refreshParams.event_type = selectedEventTypeFilter;
          }

          if (selectedStatus !== "all") {
            refreshParams.status = selectedStatus;
          }

          if (searchQuery.trim()) {
            refreshParams.search = searchQuery.trim();
          }

          fetchEvents(refreshParams, true);
        }, 500);

        return { success: true, event: updatedEvent };
      } catch (error) {
        console.error(" Error saving event:", error);
        toast.error(`Failed to update event: ${error.message}`);
        throw error;
      }
    },
    [
      selectedEvent,
      BACKEND_URL,
      clearCache,
      currentPage,
      rowsPerPage,
      selectedStatus,
      selectedEventTypeFilter,
      searchQuery,
      fetchEvents,
      DEFAULT_API_START_DATE,
    ]
  );

 const handleCloseEditModal = useCallback(
  async (shouldRefresh = false) => {
    setEditModalOpen(false);
    setSelectedEvent(null);

    if (shouldRefresh) {
      clearCache();

      const refreshParams = {
        page: currentPage,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        _t: Date.now(),
      };

      if (selectedStatus && selectedStatus !== "all") {
        refreshParams.status = selectedStatus;
      }

      if (searchQuery && searchQuery.trim()) {
        refreshParams.search = searchQuery.trim();
      }

      if (selectedEventTypeFilter === "all") {
        refreshParams.event_type = "CELLS";
      } else if (selectedEventTypeFilter) {
        refreshParams.event_type = selectedEventTypeFilter;
      }

      if (
        isLeaderAt12 &&
        (selectedEventTypeFilter === "all" ||
          selectedEventTypeFilter === "CELLS")
      ) {
        refreshParams.leader_at_12_view = true;
        refreshParams.include_subordinate_cells = true;

        if (currentUserLeaderAt1) {
          refreshParams.leader_at_1_identifier = currentUserLeaderAt1;
        }

        if (viewFilter === "personal") {
          refreshParams.show_personal_cells = true;
          refreshParams.personal = true;
        } else {
          refreshParams.show_all_authorized = true;
        }
      }

      Object.keys(refreshParams).forEach(
        (key) => (refreshParams[key] === undefined || refreshParams[key] === '') && delete refreshParams[key]
      );

      await fetchEvents(refreshParams, true);
      
      setTimeout(() => {
        fetchEvents(refreshParams, false);
      }, 300);
    }
  },
  [
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
    viewFilter,
  ]
);

  const handleCloseEventTypesModal = useCallback(() => {
    setEventTypesModalOpen(false);

    setTimeout(() => {
      setEditingEventType(null);
    }, 300);
  }, []);

  const handleDeleteType = useCallback(async () => {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      toast.error("Please log in again");
      setTimeout(() => (window.location.href = "/login"), 2000);
      return;
    }

    const typeName =
      typeof toDeleteType === "string"
        ? toDeleteType
        : toDeleteType?.name || toDeleteType?.eventType || "";

    if (!typeName) {
      throw new Error("No event type name provided for deletion");
    }

    const encodedTypeName = encodeURIComponent(typeName);
    const url = `${BACKEND_URL}/event-types/${encodedTypeName}`;

    try {
      const response = await authFetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 400 && errorData.detail && typeof errorData.detail === "object") {
          const eventsCount = errorData.detail.events_count || 0;
          const eventsList = errorData.detail.event_samples || [];
          
          console.log("Events using this type:", eventsCount);

          const eventsListText = eventsList
            .slice(0, 5)
            .map(
              (e) =>
                `• ${e.name} (${e.date || "No date"}) - Status: ${e.status}`
            )
            .join("\n");

          const shouldForceDelete = window.confirm(
            ` Cannot delete "${typeName}"\n\n` +
              `${eventsCount} event(s) are using this event type:\n\n` +
              `${eventsListText}\n` +
              `${
                eventsCount > 5 ? `\n...and ${eventsCount - 5} more\n` : ""
              }\n` +
              `━\n\n` +
              ` FORCE DELETE OPTION:\n\n` +
              `Click OK to DELETE ALL ${eventsCount} events and the event type.\n` +
              `Click Cancel to keep everything.\n\n` +
              ` THIS ACTION CANNOT BE UNDONE!`
          );

          if (shouldForceDelete) {
            const forceUrl = `${url}?force=true`;
            const forceResponse = await authFetch(forceUrl, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            const forceResult = await forceResponse.json();

            await fetchEventTypes();
            setConfirmDeleteOpen(false);
            setToDeleteType(null);

            if (
              selectedEventTypeFilter === typeName ||
              selectedEventTypeFilter?.toUpperCase() ===
                typeName.toUpperCase()
            ) {
              setSelectedEventTypeFilter("all");
              setSelectedEventTypeObj(null);

              setTimeout(() => {
                fetchEvents(
                  {
                    page: 1,
                    limit: rowsPerPage,
                    event_type: "CELLS",
                    start_date: DEFAULT_API_START_DATE,
                  },
                  true
                );
              }, 300);
            }

            toast.success(
              ` Deleted event type "${typeName}" and ${
                forceResult.events_deleted || eventsCount
              } events`,
              { autoClose: 5000 }
            );
          } else {
            toast.info("Deletion cancelled", { autoClose: 3000 });
          }

          setConfirmDeleteOpen(false);
          setToDeleteType(null);
          return;
        }
        
        throw new Error(errorData.detail || errorData.message || "Failed to delete event type");
      }

      const result = await response.json();
      
      await fetchEventTypes();
      setConfirmDeleteOpen(false);
      setToDeleteType(null);

      if (
        selectedEventTypeFilter === typeName ||
        selectedEventTypeFilter?.toUpperCase() === typeName.toUpperCase()
      ) {
        setSelectedEventTypeFilter("all");
        setSelectedEventTypeObj(null);

        setTimeout(() => {
          fetchEvents(
            {
              page: 1,
              limit: rowsPerPage,
              event_type: "CELLS",
              start_date: DEFAULT_API_START_DATE,
            },
            true
          );
        }, 300);
      }

      toast.success(
        result.message ||
          `Event type "${typeName}" deleted successfully!`
      );
    } catch (error) {
      console.error("Delete error:", error);
      
      if (error.message?.includes("401") || error.status === 401) {
        toast.error("Session expired. Logging out...");
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        setTimeout(() => (window.location.href = "/login"), 2000);
        return;
      }

      let errorMessage = "Failed to delete event type";
      if (error.message) {
        errorMessage = error.message;
      }

      setConfirmDeleteOpen(false);
      setToDeleteType(null);
      toast.error(errorMessage, { autoClose: 7000 });
    }
  } catch (error) {
    console.error(" Unexpected error:", error);
    toast.error(`Unexpected error: ${error.message}`, { autoClose: 7000 });
    setConfirmDeleteOpen(false);
    setToDeleteType(null);
  }
}, [
  BACKEND_URL,
  selectedEventTypeFilter,
  toDeleteType,
  fetchEventTypes,
  fetchEvents,
  rowsPerPage,
  DEFAULT_API_START_DATE,
  authFetch,
  setConfirmDeleteOpen,
  setToDeleteType,
  setSelectedEventTypeFilter,
  setSelectedEventTypeObj,
]);

  const handlePageChange = useCallback(
    (newPage) => {
      setCurrentPage(newPage);
      const shouldApplyPersonalFilter =
        viewFilter === "personal" &&
        (userRole === "admin" || userRole === "leader at 12");

      fetchEvents({
        page: newPage,
        limit: rowsPerPage,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        event_type:
          selectedEventTypeFilter !== "all"
            ? selectedEventTypeFilter
            : undefined,
        search: searchQuery.trim() || undefined,
        personal: shouldApplyPersonalFilter ? true : undefined,
        start_date: DEFAULT_API_START_DATE,
      });
    },
    [
      viewFilter,
      userRole,
      fetchEvents,
      rowsPerPage,
      selectedStatus,
      selectedEventTypeFilter,
      searchQuery,
      DEFAULT_API_START_DATE,
    ]
  );

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
  }, []);

  useEffect(() => {
    const checkAccess = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const token = localStorage.getItem("access_token");
      const userProfile = localStorage.getItem("userProfile");

      if (!token || !userProfile) {
        toast.error("Please log in to access events");
        setTimeout(() => (window.location.href = "/login"), 2000);
        return;
      }

      try {
        const currentUser = JSON.parse(userProfile);
        const userRole = currentUser?.role?.toLowerCase() || "";
        const email = currentUser?.email || "";

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

        const isAnyLeader =
          userRole.includes("leader") || isLeaderAt12 || isLeader144or1728;

        const isUser = userRole === "user";

        if (isUser) {
          try {
            const response = await authFetch(
              `${BACKEND_URL}/check-leader-status`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            const { hasCell, canAccessEvents } = response.data;

            if (!canAccessEvents || !hasCell) {
              toast.warning("You must have a cell to access the Events page");
              setTimeout(() => (window.location.href = "/"), 2000);
              return;
            }
          } catch (error) {
            console.error(" Error checking cell status:", error);
            toast.error("Unable to verify access. Please contact support.");
            setTimeout(() => (window.location.href = "/"), 2000);
            return;
          }
        }
        const hasAccess =
          isAdmin ||
          isLeaderAt12 ||
          isRegistrant ||
          isLeader144or1728 ||
          isAnyLeader ||
          isUser;

        if (!hasAccess) {
          toast.warning("You do not have permission to access the Events page");
          setTimeout(() => (window.location.href = "/"), 2000);
        }
      } catch (error) {
        console.error(" Error in access check:", error);
        toast.error("Error verifying access");
      }
    };

    checkAccess();
  }, [BACKEND_URL]);

  useEffect(() => {
    if (eventTypes.length > 0 && !selectedEventTypeFilter) {
      setSelectedEventTypeFilter("all");
    }
  }, [eventTypes.length, selectedEventTypeFilter]);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("access_token");
      const userProfile = localStorage.getItem("userProfile");

      if (!token || !userProfile) {
        toast.warning("Please log in to continue.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
    };

    checkAuth();
  }, []);

  const isOverdue = useCallback((event) => {
    const did_not_meet = event.did_not_meet || false;
    const hasAttendees = event.attendees && event.attendees.length > 0;
    const status = (event.status || event.Status || "").toLowerCase().trim();
    const isMissedRecurrent =
      event.is_recurring && event.recurrent_status === "missed";

    if (
      hasAttendees ||
      status === "complete" ||
      status === "closed" ||
      status === "did_not_meet" ||
      did_not_meet ||
      isMissedRecurrent
    ) {
      return false;
    }
    if (!event?.date) return false;
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate < today;
  }, []);

  const handleSaveEventType = useCallback(
    async (eventTypeData, eventTypeId = null) => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const oldName = editingEventType?.name;
        let url, method;

        if (eventTypeId || editingEventType) {
          const identifier = oldName;
          if (!identifier) {
            throw new Error(
              "Cannot update: original event type name not found"
            );
          }

          const encodedName = encodeURIComponent(identifier);
          url = `${BACKEND_URL}/event-types/${encodedName}`;
          method = "PUT";
        } else {
          url = `${BACKEND_URL}/event-types`;
          method = "POST";
        }

        const response = await authFetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(eventTypeData),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = {
              detail: `HTTP ${response.status}: ${response.statusText}`,
            };
          }

          throw new Error(
            errorData.detail || `Failed to save event type: ${response.status}`
          );
        }

        const result = await response.json();

        setEventTypesModalOpen(false);
        setEditingEventType(null);

        await fetchEventTypes();

        if (
          oldName &&
          selectedEventTypeFilter === oldName &&
          result.name !== oldName
        ) {
          setSelectedEventTypeFilter(result.name);
        }

        toast.success(
          `Event type ${eventTypeId ? "updated" : "created"} successfully!`
        );
        return result;
      } catch (error) {
        console.error(` Error saving event type:`, error);
        toast.error(`Failed to save event type: ${error.message}`);
        throw error;
      }
    },
    [BACKEND_URL, editingEventType, fetchEventTypes, selectedEventTypeFilter]
  );

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
    if (eventTypes.length === 0) {
      return;
    }

    const fetchParams = {
      page: currentPage,
      limit: rowsPerPage,
      start_date: DEFAULT_API_START_DATE,
    };

    if (selectedStatus && selectedStatus !== "all") {
      fetchParams.status = selectedStatus;
    }

    if (searchQuery.trim()) {
      fetchParams.search = searchQuery.trim();
    }

    if (selectedEventTypeFilter === "all") {
      fetchParams.event_type = "CELLS";
    } else if (selectedEventTypeFilter === "CELLS") {
      fetchParams.event_type = "CELLS";
    } else {
      fetchParams.event_type = selectedEventTypeFilter;
    }

    if (fetchParams.event_type === "CELLS") {
      if (isAdmin) {
        if (viewFilter === "personal") {
          fetchParams.personal = true;
        }
      } else if (isRegistrant || isRegularUser) {
        fetchParams.personal = true;
      } else if (isLeaderAt12) {
        fetchParams.leader_at_12_view = true;

        if (currentUserLeaderAt1) {
          fetchParams.leader_at_1_identifier = currentUserLeaderAt1;
        }

        if (viewFilter === "personal") {
          fetchParams.show_personal_cells = true;
          fetchParams.personal = true;
        } else {
          fetchParams.show_all_authorized = true;
          fetchParams.include_subordinate_cells = true;
        }
      }
    } else {
      delete fetchParams.personal;
      delete fetchParams.leader_at_12_view;
      delete fetchParams.show_personal_cells;
      delete fetchParams.show_all_authorized;
      delete fetchParams.include_subordinate_cells;
      delete fetchParams.leader_at_1_identifier;
    }

    Object.keys(fetchParams).forEach(
      (key) => fetchParams[key] === undefined && delete fetchParams[key]
    );

    fetchEvents(fetchParams, true);
  }, [
    selectedEventTypeFilter,
    selectedStatus,
    viewFilter,
    currentPage,
    rowsPerPage,
    eventTypes.length,
    isAdmin,
    isRegistrant,
    isRegularUser,
    isLeaderAt12,
    DEFAULT_API_START_DATE,
  ]);
const StatusBadges = ({
  selectedStatus,
  setSelectedStatus,
  setCurrentPage,
}) => {
  const statuses = [
    {
      value: "incomplete",
      label: "INCOMPLETE",
      style: styles.statusBadgeIncomplete,
    },
    {
      value: "complete",
      label: "COMPLETE",
      style: styles.statusBadgeComplete,
    },
    {
      value: "did_not_meet",
      label: "DID NOT MEET",
      style: styles.statusBadgeDidNotMeet,
    },
  ];

  const handleStatusClick = (statusValue) => {
    setSelectedStatus(statusValue);
    setCurrentPage(1);
  };

  return (
    <div style={styles.statusBadgeContainer}>
      {statuses.map((status) => (
        <button
          key={status.value}
          style={{
            ...styles.statusBadge,
            ...status.style,
            ...(selectedStatus === status.value
              ? styles.statusBadgeActive
              : {}),
          }}
          onClick={() => handleStatusClick(status.value)}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};

const ViewFilterButtons = () => {
  const shouldShowToggle =
    (isAdmin || isLeaderAt12) &&
    (selectedEventTypeFilter === "all" ||
      selectedEventTypeFilter === "CELLS");

  if (isRegularUser || isRegistrant) {
    return null;
  }

  if (
    selectedEventTypeFilter &&
    selectedEventTypeFilter !== "all" &&
    selectedEventTypeFilter !== "CELLS"
  ) {
    return null;
  }

  if (!shouldShowToggle) {
    return null;
  }

  const handleViewFilterChange = (newViewFilter) => {
    setViewFilter(newViewFilter);
    setCurrentPage(1);
  };

  const getAllLabel = () => {
    if (isAdmin) return "VIEW ALL";
    if (isLeaderAt12) return "DISCIPLES";
    return "ALL";
  };

  const getPersonalLabel = () => {
    if (isAdmin) return "PERSONAL";
    if (isLeaderAt12) return "PERSONAL ";
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
          checked={viewFilter === "all"}
          onChange={(e) => handleViewFilterChange(e.target.value)}
        />
        <span style={styles.viewFilterText}>{getAllLabel()}</span>
      </label>
      <label style={styles.viewFilterRadio}>
        <input
          type="radio"
          name="viewFilter"
          value="personal"
          checked={viewFilter === "personal"}
          onChange={(e) => handleViewFilterChange(e.target.value)}
        />
        <span style={styles.viewFilterText}>{getPersonalLabel()}</span>
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
    DEFAULT_API_START_DATE,
    isLeaderAt12,
    isAdmin,
    isRegistrant,
    isRegularUser,
    setEditingEventType,
    setEventTypesModalOpen,
    setToDeleteType,
    setConfirmDeleteOpen,
  }) => {
    const [hoveredType, setHoveredType] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedTypeForMenu, setSelectedTypeForMenu] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const theme = useTheme();
    const isMobileView = useMediaQuery(theme.breakpoints.down("lg"));
    const isDarkMode = theme.palette.mode === "dark";

    const canEditEventTypes = isAdmin;

    const handleEventTypeClick = (typeValue) => {
      setSelectedEventTypeFilter(typeValue);
      setCurrentPage(1);

      const fetchParams = {
        page: 1,
        limit: rowsPerPage,
        start_date: DEFAULT_API_START_DATE,
        event_type: typeValue === "all" ? "CELLS" : typeValue,
        _t: Date.now(),
      };

      if (selectedStatus !== "all") {
        fetchParams.status = selectedStatus;
      }

      if (searchQuery.trim()) {
        fetchParams.search = searchQuery.trim();
      }

      if (typeValue === "all" || typeValue === "CELLS") {
        if (isAdmin) {
          if (viewFilter === "personal") {
            fetchParams.personal = true;
          }
        } else if (isRegistrant || isRegularUser) {
          fetchParams.personal = true;
        } else if (isLeaderAt12) {
          fetchParams.leader_at_12_view = true;
          fetchParams.include_subordinate_cells = true;

          if (viewFilter === "personal") {
            fetchParams.show_personal_cells = true;
            fetchParams.personal = true;
          } else {
            fetchParams.show_all_authorized = true;
          }
        }
      } else {
        delete fetchParams.personal;
        delete fetchParams.leader_at_12_view;
        delete fetchParams.show_personal_cells;
        delete fetchParams.show_all_authorized;
        delete fetchParams.include_subordinate_cells;
      }
      fetchEvents(fetchParams, true);
    };

    const mobileEventTypeStyles = {
      container: {
        backgroundColor: isDarkMode
          ? theme.palette.background.paper
          : "#f8f9fa",
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
        border: `1px solid ${
          isDarkMode ? theme.palette.divider : "transparent"
        }`,
        backgroundColor: isDarkMode
          ? theme.palette.background.default
          : "white",
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
        boxShadow: isDarkMode
          ? "0 2px 4px rgba(0,0,0,0.2)"
          : "0 2px 4px rgba(0,0,0,0.1)",
      },
    };

    const allTypes = useMemo(() => {
      const availableTypes = eventTypes
        .map((t) => t.name || t)
        .filter((name) => name && name !== "all");

      if (isAdmin) {
        const adminTypes = ["all"];
        availableTypes.forEach((type) => {
          adminTypes.push(type);
        });
        return adminTypes;
      } else if (isRegistrant) {
        const registrantTypes = ["all"];
        availableTypes.forEach((type) => {
          registrantTypes.push(type);
        });

        return registrantTypes;
      } else if (isLeaderAt12) {
        const leaderTypes = ["all"];
        availableTypes.forEach((type) => {
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
      if (selectedTypeForMenu && selectedTypeForMenu !== "all") {
        const eventTypeToEdit = eventTypes.find(
          (et) => et.name?.toLowerCase() === selectedTypeForMenu.toLowerCase()
        ) || { name: selectedTypeForMenu };

        setEditingEventType(eventTypeToEdit);
        setEventTypesModalOpen(true);
      }
      handleMenuClose();
    };

    const handleDeleteEventType = () => {
      if (selectedTypeForMenu && selectedTypeForMenu !== "all") {
        const exactEventType = eventTypes.find((et) => {
          const etName = et.name || et.eventType || et.eventTypeName || "";
          return etName.toLowerCase() === selectedTypeForMenu.toLowerCase();
        });

        const typeToDelete = exactEventType
          ? exactEventType.name ||
            exactEventType.eventType ||
            exactEventType.eventTypeName
          : selectedTypeForMenu;

        setToDeleteType(typeToDelete);
        setConfirmDeleteOpen(true);
      }
      handleMenuClose();
    };

    const shouldShowSelector =
      isAdmin || isRegistrant || isLeaderAt12 || isRegularUser;

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
        <div
          style={mobileEventTypeStyles.headerRow}
          onClick={() => isMobileView && setIsCollapsed(!isCollapsed)}
        >
          <div style={mobileEventTypeStyles.header}>
            {isAdmin
              ? "Event Types"
              : isRegistrant
              ? "Event Types"
              : isLeaderAt12
              ? "Cells & Events"
              : "Your Cells"}
          </div>

          <div style={mobileEventTypeStyles.selectedTypeDisplay}>
            <span>•</span>
            <span>
              {selectedEventTypeFilter === "all" && isLeaderAt12
                ? "ALL CELLS"
                : getDisplayName(selectedEventTypeFilter)}
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
              {isCollapsed ? "▼" : "▲"}
            </button>
          )}
        </div>

        <div style={mobileEventTypeStyles.typesGrid}>
          {allTypes.map((type) => {
            const displayName = getDisplayName(type);
            const typeValue = getTypeValue(type);
            const isActive = selectedEventTypeFilter === typeValue;
            const isHovered = hoveredType === typeValue;

            const showMenu = canEditEventTypes && typeValue !== "all";

            return (
              <div
                key={typeValue}
                style={{
                  ...mobileEventTypeStyles.typeCard,
                  ...(isActive ? mobileEventTypeStyles.typeCardActive : {}),
                  ...(isHovered && !isActive
                    ? mobileEventTypeStyles.typeCardHover
                    : {}),
                }}
                onClick={() => handleEventTypeClick(typeValue)}
                onMouseEnter={() => setHoveredType(typeValue)}
                onMouseLeave={() => setHoveredType(null)}
              >
                <span>{displayName}</span>

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
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.04)",
                      "&:hover": {
                        backgroundColor: isDarkMode
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(0,0,0,0.08)",
                      },
                      color: isDarkMode ? "#fff" : "#000",
                      fontSize: "12px",
                      padding: "1px",
                      minWidth: "auto",
                      opacity: isMobileView ? 1 : isHovered || isActive ? 1 : 0,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    ⋮
                  </IconButton>
                )}
              </div>
            );
          })}
        </div>

        <Popover
          open={Boolean(menuAnchor)}
          anchorEl={menuAnchor}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: isDarkMode
                ? theme.palette.background.paper
                : "#fff",
              color: isDarkMode ? theme.palette.text.primary : "#000",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              borderRadius: "8px",
              minWidth: "120px",
            },
          }}
        >
          <MenuItem onClick={handleEditEventType} sx={{ fontSize: "14px" }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={handleDeleteEventType}
            sx={{
              fontSize: "14px",
              color: theme.palette.error.main,
              "&:hover": {
                backgroundColor: theme.palette.error.light + "20",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Popover>
      </div>
    );
  };

  return (
    <Box
      sx={{
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
        backgroundColor: isDarkMode
          ? theme.palette.background.default
          : "#f5f7fa",
      }}
    >
      <Box
        sx={{
          padding: isMobileView ? "1rem" : "1.5rem",
          borderRadius: "16px",
          marginBottom: isMobileView ? "0.5rem" : "1rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          flexShrink: 0,
          backgroundColor: isDarkMode ? theme.palette.background.paper : "#fff",
        }}
      >
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
          DEFAULT_API_START_DATE={DEFAULT_API_START_DATE}
          isLeaderAt12={isLeaderAt12}
          isAdmin={isAdmin}
          isRegistrant={isRegistrant}
          isRegularUser={isRegularUser}
          setEditingEventType={setEditingEventType}
          setEventTypesModalOpen={setEventTypesModalOpen}
          setToDeleteType={setToDeleteType}
          setConfirmDeleteOpen={setConfirmDeleteOpen}
        />
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            marginBottom: isMobileView ? "0.75rem" : "1.5rem",
            flexWrap: "wrap",
            px: 1,
          }}
        >
          <TextField
            size="small"
            placeholder="Search by Event Name, Leader, or Email..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
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
              backgroundColor: "transparent !important",
              "& .MuiInputBase-root": {
                backgroundColor: "transparent !important",
              },
              "& .MuiInputBase-input": {
                fontSize: isMobileView ? "14px" : "0.95rem",
                padding: isMobileView ? "0.6rem 0.8rem" : "0.75rem 1rem",
                color: isDarkMode ? theme.palette.text.primary : "#000",
                backgroundColor: "transparent !important",
              },
              "& .MuiOutlinedInput-root": {
                backgroundColor: "transparent !important",
                "& fieldset": {
                  borderColor: isDarkMode ? theme.palette.divider : "#ccc",
                  backgroundColor: "transparent !important",
                },
                "&:hover fieldset": {
                  borderColor: isDarkMode
                    ? theme.palette.primary.main
                    : "#007bff",
                },
                "&.Mui-focused fieldset": {
                  borderColor: isDarkMode
                    ? theme.palette.primary.main
                    : "#007bff",
                },
                "&:hover": {
                  backgroundColor: "transparent !important",
                },
                "&.Mui-focused": {
                  backgroundColor: "transparent !important",
                },
              },
              "& input": {
                backgroundColor: "transparent !important",
              },
              "& input:-webkit-autofill": {
                WebkitBoxShadow: isDarkMode
                  ? "0 0 0 1000px #1a1a1a inset !important"
                  : "0 0 0 1000px white inset !important",
                WebkitTextFillColor: isDarkMode
                  ? "#fff !important"
                  : "#000 !important",
              },
            }}
          />

          <Button
            variant="contained"
            onClick={handleSearchSubmit}
            disabled={loading}
            sx={{
              padding: isMobileView ? "0.6rem 1rem" : "0.75rem 1.5rem",
              fontSize: isMobileView ? "14px" : "0.95rem",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "⏳" : "SEARCH"}
          </Button>

          <Button
            variant="outlined"
            onClick={clearAllFilters}
            disabled={loading}
            sx={{
              padding: isMobileView ? "0.6rem 1rem" : "0.75rem 1.5rem",
              fontSize: isMobileView ? "14px" : "0.95rem",
              whiteSpace: "nowrap",
              backgroundColor: "#6c757d",
              color: "white",
              "&:hover": {
                backgroundColor: "#5a6268",
              },
            }}
          >
            {loading ? "⏳" : "CLEAR ALL"}
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
            px: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <StatusBadges
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              setCurrentPage={setCurrentPage}
            />
            {/* Main bulk download: visible only for complete / did_not_meet */}
            {(selectedStatus === "complete" || selectedStatus === "did_not_meet") && (
              <Button
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={() => downloadEventsByStatus(selectedStatus)}
                disabled={isLoading || events.length === 0}
                sx={{
                  minWidth: 160,
                  whiteSpace: "nowrap",
                }}
              >
                DOWNLOAD {selectedStatus === "complete" ? "COMPLETED" : "DID NOT MEET"} ATTENDANCE
              </Button>
            )}
          </div>
          <ViewFilterButtons />
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          backgroundColor: isDarkMode ? theme.palette.background.paper : "#fff",
        }}
      >
        {isMobileView ? (
          <>
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                padding: "0.75rem",
              }}
            >
              {loading ? (
                <Box sx={{ width: "100%", p: 2 }}>
                  <LinearProgress />
                  <Typography
                    sx={{
                      mt: 2,
                      textAlign: "center",
                      color: isDarkMode ? theme.palette.text.primary : "#666",
                    }}
                  >
                    Loading events...
                  </Typography>
                </Box>
              ) : paginatedEvents.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    padding: "2rem",
                    color: isDarkMode ? theme.palette.text.primary : "#666",
                  }}
                >
                  <Typography>
                    No events found matching your criteria.
                  </Typography>
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

            <Box
              sx={{
                padding: "1rem",
                borderTop: `1px solid ${
                  isDarkMode ? theme.palette.divider : "#e9ecef"
                }`,
                backgroundColor: isDarkMode
                  ? theme.palette.background.paper
                  : "#f8f9fa",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? theme.palette.text.secondary : "#6c757d",
                }}
              >
                {totalEvents > 0
                  ? `${startIndex}-${endIndex} of ${totalEvents}`
                  : "0-0 of 0"}
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  sx={{
                    minWidth: "auto",
                    color: isDarkMode ? theme.palette.text.primary : "#007bff",
                    borderColor: isDarkMode ? theme.palette.divider : "#007bff",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,123,255,0.1)",
                      borderColor: isDarkMode
                        ? theme.palette.primary.main
                        : "#0056b3",
                    },
                    "&:disabled": {
                      color: isDarkMode
                        ? theme.palette.text.disabled
                        : "#6c757d",
                      borderColor: isDarkMode
                        ? theme.palette.divider
                        : "#dee2e6",
                    },
                  }}
                >
                  {loading ? "⏳" : "◀ Prev"}
                </Button>
                <Typography
                  variant="body2"
                  sx={{
                    padding: "0 0.5rem",
                    color: isDarkMode
                      ? theme.palette.text.secondary
                      : "#6c757d",
                  }}
                >
                  {currentPage} / {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNextPage}
                  disabled={
                    currentPage >= totalPages || loading || totalPages === 0
                  }
                  sx={{
                    minWidth: "auto",
                    color: isDarkMode ? theme.palette.text.primary : "#007bff",
                    borderColor: isDarkMode ? theme.palette.divider : "#007bff",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,123,255,0.1)",
                      borderColor: isDarkMode
                        ? theme.palette.primary.main
                        : "#0056b3",
                    },
                    "&:disabled": {
                      color: isDarkMode
                        ? theme.palette.text.disabled
                        : "#6c757d",
                      borderColor: isDarkMode
                        ? theme.palette.divider
                        : "#dee2e6",
                    },
                  }}
                >
                  {loading ? "⏳" : "Next ▶"}
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                overflowX: "auto",
                padding: "1rem",
              }}
            >
              {loading ? (
                <Box sx={{ p: 3, width: "100%" }}>
                  <LinearProgress />
                  <Typography sx={{ mt: 2, textAlign: "center" }}>
                    Loading events...
                  </Typography>
                </Box>
              ) : paginatedEvents.length === 0 ? (
                <Typography sx={{ p: 3, textAlign: "center" }}>
                  No events found matching your criteria.
                </Typography>
              ) : (
                <Box sx={{ height: "calc(100vh - 450px)", minHeight: "500px" }}>
                  <DataGrid
                    rows={paginatedEvents.map((event, idx) => {
                      const id = event._id || event.id || event.UUID || idx;

                      const isRecurring =
                        event.is_recurring ||
                        (event.recurring_days &&
                          event.recurring_days.length > 1);

                      return {
                        id: id,
                        ...event,
                        _id: id,
                        "data-recurring": isRecurring,
                      };
                    })}
                    columns={[
                      ...generateDynamicColumns(
                        paginatedEvents,
                        isOverdue,
                        selectedEventTypeFilter
                      ),
                      {
                        field: "actions",
                        headerName: "Actions",
                        sortable: false,
                        flex: 1,
                        minWidth: 200,
                        renderCell: (params) => (
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {/*  FIXED: Use params.row instead of event */}
                            <Tooltip
                              title={
                                params.row?.is_recurring
                                  ? `Capture Attendance - ${formatRecurringDays(
                                      params.row.recurring_days
                                    )}`
                                  : "Capture Attendance"
                              }
                              arrow
                            >
                              <IconButton
                                onClick={() => handleCaptureClick(params.row)}
                                size="small"
                                sx={{
                                  backgroundColor: "#007bff",
                                  color: "#fff",
                                  "&:hover": { backgroundColor: "#0056b3" },
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
                    paginationModel={{
                      page: currentPage - 1,
                      pageSize: rowsPerPage,
                    }}
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
                      height: "100%",
                      border: "1px solid",
                      borderColor: isDarkMode
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                      "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
                        color: isDarkMode ? "#fff" : "#333",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        borderBottom: `2px solid ${
                          isDarkMode ? "#333" : "#ddd"
                        }`,
                        minHeight: "52px !important",
                      },
                      "& .MuiDataGrid-columnHeader": {
                        backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
                        color: isDarkMode ? "#fff" : "#333",
                        "&:focus": {
                          outline: "none",
                        },
                      },
                      "& .MuiDataGrid-columnHeaderTitle": {
                        fontWeight: 600,
                        color: isDarkMode ? "#fff" : "#333",
                        fontSize: "0.875rem",
                      },
                      "& .MuiDataGrid-cell": {
                        alignItems: "center",
                        borderBottom: `1px solid ${
                          isDarkMode
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)"
                        }`,
                        color: isDarkMode
                          ? theme.palette.text.primary
                          : "#212529",
                        fontSize: "0.875rem",
                        "&:focus": {
                          outline: "none",
                        },
                      },
                      "& .MuiDataGrid-row": {
                        "&:hover": {
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.04)"
                            : "rgba(0, 0, 0, 0.04)",
                        },
                        '&[data-recurring="true"]': {
                          borderLeft: `3px solid #2196f3`,
                        },
                      },
                      "& .MuiDataGrid-virtualScroller": {
                        overflowY: "auto !important",
                      },
                      "& .MuiDataGrid-toolbarContainer": {
                        backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
                        padding: "12px 16px",
                        borderBottom: `1px solid ${
                          isDarkMode ? "#333" : "#ddd"
                        }`,
                      },
                      "& .MuiDataGrid-menuIcon": {
                        color: isDarkMode ? "#fff" : "#666",
                      },
                      "& .MuiDataGrid-sortIcon": {
                        color: isDarkMode ? "#fff" : "#666",
                      },
                      "& .MuiDataGrid-iconButtonContainer": {
                        visibility: "visible",
                      },
                    }}
                  />
                </Box>
              )}
            </Box>

            <Box
              sx={{
                ...styles.paginationContainer,
                flexShrink: 0,
                backgroundColor: isDarkMode
                  ? theme.palette.background.paper
                  : "#f8f9fa",
                borderTop: `1px solid ${
                  isDarkMode ? theme.palette.divider : "#e9ecef"
                }`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: isDarkMode
                      ? theme.palette.text.secondary
                      : "#6c757d",
                  }}
                >
                  Rows per page:
                </Typography>
                <select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  style={{
                    padding: "0.25rem 0.5rem",
                    border: "1px solid",
                    borderColor: isDarkMode ? theme.palette.divider : "#dee2e6",
                    borderRadius: "8px",
                    backgroundColor: isDarkMode
                      ? theme.palette.background.default
                      : "#fff",
                    color: isDarkMode ? theme.palette.text.primary : "#000",
                    fontSize: "0.875rem",
                  }}
                  disabled={loading}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: isDarkMode ? theme.palette.text.secondary : "#6c757d",
                }}
              >
                {totalEvents > 0
                  ? `${startIndex}-${endIndex} of ${totalEvents}`
                  : "0-0 of 0"}
              </Typography>

              <Box sx={styles.paginationControls}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                  sx={{
                    color: isDarkMode ? theme.palette.text.primary : "#007bff",
                    borderColor: isDarkMode ? theme.palette.divider : "#007bff",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,123,255,0.1)",
                      borderColor: isDarkMode
                        ? theme.palette.primary.main
                        : "#0056b3",
                    },
                    "&:disabled": {
                      color: isDarkMode
                        ? theme.palette.text.disabled
                        : "#6c757d",
                      borderColor: isDarkMode
                        ? theme.palette.divider
                        : "#dee2e6",
                    },
                  }}
                >
                  {loading ? "⏳" : "< Previous"}
                </Button>
                <Typography
                  variant="body2"
                  sx={{
                    padding: "0 1rem",
                    color: isDarkMode
                      ? theme.palette.text.secondary
                      : "#6c757d",
                  }}
                >
                  Page {currentPage} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleNextPage}
                  disabled={
                    currentPage >= totalPages || loading || totalPages === 0
                  }
                  sx={{
                    color: isDarkMode ? theme.palette.text.primary : "#007bff",
                    borderColor: isDarkMode ? theme.palette.divider : "#007bff",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,123,255,0.1)",
                      borderColor: isDarkMode
                        ? theme.palette.primary.main
                        : "#0056b3",
                    },
                    "&:disabled": {
                      color: isDarkMode
                        ? theme.palette.text.disabled
                        : "#6c757d",
                      borderColor: isDarkMode
                        ? theme.palette.divider
                        : "#dee2e6",
                    },
                  }}
                >
                  {loading ? "⏳" : "Next >"}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {isAdmin && (
        <Box
          sx={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1300,
          }}
        >
          {fabMenuOpen && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1299,
                backgroundColor: "transparent",
              }}
              onClick={() => setFabMenuOpen(false)}
            />
          )}

          <Box
            sx={{
              ...fabStyles.fabMenu,
              opacity: fabMenuOpen ? 1 : 0,
              visibility: fabMenuOpen ? "visible" : "hidden",
              transform: fabMenuOpen ? "translateY(0)" : "translateY(10px)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              pointerEvents: fabMenuOpen ? "auto" : "none",
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
              <Typography sx={fabStyles.fabMenuLabel}>
                Create Event Type
              </Typography>
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

          <IconButton
            sx={{
              backgroundColor: "#007bff",
              color: "white",
              width: 56,
              height: 56,
              "&:hover": {
                backgroundColor: "#0056b3",
                transform: "scale(1.05)",
              },
              transform: fabMenuOpen
                ? "rotate(45deg) scale(1.05)"
                : "rotate(0deg) scale(1)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              position: "relative",
              zIndex: 1301,
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
          <Box
            sx={{
              ...styles.modalContent,
              backgroundColor: isDarkMode
                ? theme.palette.background.paper
                : "white",
            }}
          >
            <Box
              sx={{
                ...styles.modalHeader,
                backgroundColor: isDarkMode
                  ? theme.palette.background.default
                  : "#333",
              }}
            >
              <Typography sx={styles.modalTitle}>
                {selectedEventTypeObj?.name === "CELLS"
                  ? "Create New Cell"
                  : "Create New Event"}
              </Typography>
              <IconButton
                sx={styles.modalCloseButton}
                onClick={() => handleCloseCreateEventModal(false)}
              >
                ×
              </IconButton>
            </Box>
            <Box
              sx={{
                ...styles.modalBody,
                backgroundColor: isDarkMode
                  ? theme.palette.background.paper
                  : "white",
              }}
            >
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
  onClose={(shouldRefresh = false) => {
    handleCloseEditModal(shouldRefresh);
  }}
  event={selectedEvent}
  token={token}
/>
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: isDarkMode
              ? theme.palette.background.paper
              : "#fff",
            color: isDarkMode ? theme.palette.text.primary : "#000",
          },
        }}
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete the event type "{toDeleteType}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">
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