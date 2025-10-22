import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
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

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
    padding: "1rem",
    paddingTop: "5rem",
    boxSizing: "border-box",
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
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  statusBadge: {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: "600",
    cursor: "pointer",
    border: "2px solid",
    transition: "all 0.2s ease",
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
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    overflow: "auto",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    maxWidth: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
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
  },
  openEventIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: "#007bff",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
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
    borderRadius: "12px",
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
    borderTopLeftRadius: "12px",
    borderTopRightRadius: "12px",
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
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    height: "60px",
    marginBottom: "0.5rem",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  eventsCounter: {
    padding: "1rem",
    textAlign: "center",
    fontSize: "0.875rem",
  },
  overdueLabel: {
    color: "red",
    fontSize: "0.8rem",
    marginTop: "0.2rem",
    fontWeight: "bold",
  },
  // NEW: Mobile card styles
  mobileCard: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  mobileCardRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
  },
  mobileCardLabel: {
    fontWeight: 600,
    color: "#666",
  },
  mobileCardValue: {
    color: "#212529",
    textAlign: "right",
  },
  mobileActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
    justifyContent: "flex-end",
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
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
    borderRadius: "8px",
    border: "2px solid transparent",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",
  },
  typeCardActive: {
    borderColor: "#007bff",
    backgroundColor: "#e7f3ff",
    transform: "translateX(8px) scale(1.02)",
    boxShadow: "0 4px 12px rgba(0, 123, 255, 0.2)",
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
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [createEventTypeModalOpen, setCreateEventTypeModalOpen] =
    useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState("all");
  const [currentSelectedEventType, setCurrentSelectedEventType] = useState(
    () => {
      return localStorage.getItem("selectedEventType") || "";
    }
  );
  const [selectedStatus, setSelectedStatus] = useState("incomplete");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

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

      try {
        const eventTypesResponse = await axios.get(
          `${BACKEND_URL}/event-types`,
          {
          headers: { Authorization: `Bearer ${token}` },
        }
        );
        const apiCustomTypes = eventTypesResponse.data || [];
        setCustomEventTypes(apiCustomTypes);
        setUserCreatedEventTypes(apiCustomTypes);
        setEventTypes(apiCustomTypes.map((type) => type.name));
      } catch (typeError) {
        console.error("Failed to load event types:", typeError);
      }

      if (userRole === "admin") {
        try {
          const token = localStorage.getItem("token")
          const response = await axios.get(
            `${BACKEND_URL}/admin/events/cells`,
           {
          headers: { Authorization: `Bearer ${token}` },
        }
          );
          allEvents = response.data.events || [];
        } catch (adminError) {
          console.error("Admin events fetch failed:", adminError);
        }
      } else {
        try {
          const response = await axios.get(`${BACKEND_URL}/events/cells-user`, {
            headers,
          });
          if (response.data.status === "success") {
            allEvents = response.data.events || [];
          }
        } catch (userError) {
          console.error("User events fetch failed:", userError);
        }
      }

      const dayOrder = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const sortedEvents = allEvents.sort((a, b) => {
        const dayA = (a.day || "").toLowerCase();
        const dayB = (b.day || "").toLowerCase();
        const indexA = dayOrder.indexOf(dayA);
        const indexB = dayOrder.indexOf(dayB);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents);
    } catch (err) {
      console.error("Fatal error in fetchEvents:", err);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (event) => {
    if (!event?.date) return false;

    const status = (event.status || event.Status || "").toLowerCase().trim();
    const didNotMeet = event.did_not_meet || false;
    const hasBeenCaptured =
      status === "complete" ||
      status === "closed" ||
      status === "did_not_meet" ||
      didNotMeet;

    if (hasBeenCaptured) return false;

    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate < today;
  };

  const applyAllFilters = (
    filters = activeFilters,
    statusFilter = selectedStatus,
    search = searchQuery
  ) => {
    let filtered = events.filter((event) => {
      // ✅ FIXED: Event Type Filtering - Only show events that match the selected type
      if (selectedEventTypeFilter !== "all") {
        const eventEventType = (event.eventType || "").toLowerCase().trim();
        const selectedType = selectedEventTypeFilter.toLowerCase().trim();

        if (eventEventType !== selectedType) {
          return false;
        }
      }

      // ✅ FIXED: Consistent status mapping
      let mappedStatus = "incomplete";

      // Check did_not_meet FIRST (highest priority)
      if (event.did_not_meet === true) {
        mappedStatus = "did_not_meet";
      }
      // Then check if it's complete (has attendees or status is complete/closed)
      else if (
        (event.attendees && event.attendees.length > 0) ||
        ["complete", "closed"].includes(
          (event.status || event.Status || "").toLowerCase().trim()
        )
      ) {
        mappedStatus = "complete";
      }
      // Otherwise it's incomplete
      else {
        mappedStatus = "incomplete";
      }

      // ✅ FIXED: Filter by selected status tab
      if (statusFilter !== "all" && mappedStatus !== statusFilter) {
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

      // Apply additional filters from the filter modal
      if (filters.eventType && filters.eventType !== selectedEventTypeFilter) {
        const eventType = (event.eventType || "").toLowerCase().trim();
        const filterType = filters.eventType.toLowerCase().trim();
        if (eventType !== filterType) {
          return false;
        }
      }

      if (filters.location && event.location !== filters.location) {
        return false;
      }

      if (filters.eventLeader) {
        const eventLeaderName = event.eventLeaderName
          ? event.eventLeaderName.trim().toLowerCase()
          : "";
        const filterLeader = filters.eventLeader.trim().toLowerCase();
        if (eventLeaderName !== filterLeader) {
          return false;
        }
      }

      if (filters.recurringDay) {
        const eventDay = (event.day || "").toLowerCase().trim();
        const filterDay = filters.recurringDay.toLowerCase().trim();
        if (eventDay !== filterDay) {
          return false;
        }
      }

      return true;
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

      const response = await axios.post(
        `${BACKEND_URL}/event-types`,
        eventTypeData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newEventType = response.data;
      if (newEventType) {
        const updatedEventTypes = [...customEventTypes, newEventType];
        setCustomEventTypes(updatedEventTypes);
        setUserCreatedEventTypes(updatedEventTypes);
        setEventTypes(updatedEventTypes.map((type) => type.name));

        setSelectedEventTypeObj(newEventType);
        setCurrentSelectedEventType(newEventType.name);

        localStorage.setItem(
          "selectedEventTypeObj",
          JSON.stringify(newEventType)
        );

        setCreateEventTypeModalOpen(false);
        setCreateEventModalOpen(true);
      }
    } catch (error) {
      console.log("Submitting Event Type:", formData);
      console.error("Error creating event type:", error);
      alert("Failed to create event type. Please try again.");
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
    return dateObj
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, " - ");
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
      const eventId = selectedEvent._id;
      const eventName = selectedEvent.eventName || "Event";

      const leaderEmail = currentUser?.email || "";
      const leaderName =
        `${(currentUser?.name || "").trim()} ${(
          currentUser?.surname || ""
        ).trim()}`.trim() ||
        currentUser?.name ||
        "";

      console.log("🎯 handleAttendanceSubmit called with:", data);

      let payload;

      // ✅ Handle different data formats
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Backend response:", response.data);

      // Refresh events list
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
          errorMessage = errData.errors
            .map((e) => `${e.field}: ${e.message}`)
            .join("; ");
        } else {
          errorMessage =
            errData.detail || errData.message || JSON.stringify(errData);
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
    navigate(`/edit-event/${event._id}`);
  };

  const handleDeleteEvent = async (event) => {
    if (
      !window.confirm(`Are you sure you want to delete "${event.eventName}"?`)
    ) {
      return;
    }

    setEvents((prev) => prev.filter((e) => e._id !== event._id));
    setFilteredEvents((prev) => prev.filter((e) => e._id !== event._id));

    try {
      const token = localStorage.getItem("token");
      const baseUrl = BACKEND_URL.endsWith("/")
        ? BACKEND_URL.slice(0, -1)
        : BACKEND_URL;

      await axios.delete(`${baseUrl}/events/${event._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSnackbar({
        open: true,
        message: `"${event.eventName}" deleted successfully!`,
        severity: "success",
      });
    } catch (err) {
      console.error("Delete error:", err.response?.data);
      setSnackbar({
        open: true,
        message: `Failed to delete: ${
          err.response?.data?.detail || err.message
        }`,
        severity: "error",
      });
    }
  };

  const EventTypeSelector = () => {
    const [hoveredType, setHoveredType] = useState(null);
    const allTypes = ["CELLS", ...eventTypes];
    const isAdmin = currentUser?.role === "admin"; // ✅ your admin check

    const getDisplayName = (type) => {
      if (type === "CELLS") return type;
      if (typeof type === "string") return type;
      return type.name || type;
    };

    const getTypeValue = (type) => {
      if (type === "CELLS") return "all";
      if (typeof type === "string") return type.toLowerCase();
      return (type.name || type).toLowerCase();
    };

    const selectedDisplayName =
      selectedEventTypeFilter === "all"
        ? "CELLS"
        : eventTypes.find((t) => {
            const tValue = typeof t === "string" ? t : t.name;
            return tValue?.toLowerCase() === selectedEventTypeFilter;
          }) || selectedEventTypeFilter;

    const finalDisplayName =
      typeof selectedDisplayName === "string"
        ? selectedDisplayName
        : selectedDisplayName?.name || "CELLS";

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
                    ...(isHovered && !isActive
                      ? eventTypeStyles.typeCardHover
                      : {}),
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

                    // 🧠 Track which event type you're currently on
                    console.log(
                      "🟢 Switched to Event Type:",
                      selectedTypeObj?.name || typeValue
                    );
                    console.log("🧩 Config:", {
                      isTicketed: selectedTypeObj?.isTicketed,
                      isGlobal: selectedTypeObj?.isGlobal,
                      hasPersonSteps: selectedTypeObj?.hasPersonSteps,
                    });

                    // Store locally so CreateEvents can read it instantly
                    if (selectedTypeObj) {
                      localStorage.setItem(
                        "selectedEventTypeObj",
                        JSON.stringify(selectedTypeObj)
                      );
                    } else {
                      localStorage.removeItem("selectedEventTypeObj");
                    }

                    // Apply filter
                    applyAllFilters(
                      typeValue === "all"
                        ? { ...activeFilters, eventType: undefined }
                        : { ...activeFilters, eventType: typeValue },
                      selectedStatus,
                      searchQuery
                    );
                  }}
                  onMouseEnter={() => setHoveredType(typeValue)}
                  onMouseLeave={() => setHoveredType(null)}
                >
                  {isActive && (
                    <div style={eventTypeStyles.activeIndicator}>✓</div>
                  )}
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

  const StatusBadges = () => {
    // Filter events by selected event type first
    const eventsForCurrentType =
      selectedEventTypeFilter === "all"
        ? events
        : events.filter((event) => {
            const eventEventType = (event.eventType || "").toLowerCase().trim();
            const selectedType = selectedEventTypeFilter.toLowerCase().trim();
            return eventEventType === selectedType;
          });

    const statusCounts = {
      incomplete: eventsForCurrentType.filter((e) => {
        if (e.did_not_meet === true) return false;
        if (
          (e.attendees && e.attendees.length > 0) ||
          ["complete", "closed"].includes(
            (e.status || e.Status || "").toLowerCase().trim()
          )
        ) {
          return false;
        }
        return true;
      }).length,

      complete: eventsForCurrentType.filter((e) => {
        if (e.did_not_meet === true) return false;
        return (
          (e.attendees && e.attendees.length > 0) ||
          ["complete", "closed"].includes(
            (e.status || e.Status || "").toLowerCase().trim()
          )
        );
      }).length,

      did_not_meet: eventsForCurrentType.filter((e) => {
        return e.did_not_meet === true;
      }).length,
    };

    return (
      <div style={styles.statusBadgeContainer}>
        <button
          style={{
            ...styles.statusBadge,
            ...styles.statusBadgeIncomplete,
            ...(selectedStatus === "incomplete"
              ? styles.statusBadgeActive
              : {}),
          }}
          onClick={() => {
            setSelectedStatus("incomplete");
            applyAllFilters(activeFilters, "incomplete", searchQuery);
          }}
        >
          INCOMPLETE ({statusCounts.incomplete})
        </button>

        <button
          style={{
            ...styles.statusBadge,
            ...styles.statusBadgeComplete,
            ...(selectedStatus === "complete" ? styles.statusBadgeActive : {}),
          }}
          onClick={() => {
            setSelectedStatus("complete");
            applyAllFilters(activeFilters, "complete", searchQuery);
          }}
        >
          COMPLETE ({statusCounts.complete})
        </button>

        <button
          style={{
            ...styles.statusBadge,
            ...styles.statusBadgeDidNotMeet,
            ...(selectedStatus === "did_not_meet"
              ? styles.statusBadgeActive
              : {}),
          }}
          onClick={() => {
            setSelectedStatus("did_not_meet");
            applyAllFilters(activeFilters, "did_not_meet", searchQuery);
          }}
        >
          DID NOT MEET ({statusCounts.did_not_meet})
        </button>
      </div>
    );
  };

  // NEW: Mobile card view component
  const MobileEventCard = ({ event }) => {
    const dayOfWeek = event.day || "Not set";

    return (
      <div style={styles.mobileCard}>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Event Name:</span>
          <span style={styles.mobileCardValue}>{event.eventName}</span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Leader:</span>
          <span style={styles.mobileCardValue}>
            {event.eventLeaderName || "-"}
          </span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Leader at 12:</span>
          <span style={styles.mobileCardValue}>{event.leader12 || "-"}</span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Day:</span>
          <span style={styles.mobileCardValue}>
            <div>{dayOfWeek}</div>
            {isOverdue(event) && <div style={styles.overdueLabel}>Overdue</div>}
          </span>
        </div>
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Email:</span>
          <span style={styles.mobileCardValue}>
            {event.eventLeaderEmail || "-"}
          </span>
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

  const allEventTypes = [
    ...(eventTypes || []),
    ...(userCreatedEventTypes || []),
  ];

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: theme.palette.background.default,
      }}
    >
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
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#0056b3")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#007bff")}
          >
            FILTER
          </button>
        </div>

        <StatusBadges />
      </div>

      {/* MOBILE VIEW: Card Layout */}
      {isMobile ? (
        <Box>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} style={styles.loadingSkeleton} />
            ))
          ) : filteredEvents.length === 0 ? (
            <div
              style={{
                ...styles.mobileCard,
                textAlign: "center",
                padding: "2rem",
              }}
            >
              No events found matching your criteria.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <MobileEventCard key={event._id} event={event} />
            ))
          )}
        </Box>
      ) : (
        /* DESKTOP VIEW: Table Layout */
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
                <th style={styles.th}>Capture Attendance</th>
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
                  <td
                    colSpan={isAdmin ? 9 : 8}
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      padding: "2rem",
                    }}
                  >
                    No events found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const dayOfWeek = event.day || "Not set";

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
                      <td style={styles.td}>{event.eventLeaderName || "-"}</td>
                      <td style={styles.td}>{event.leader12 || "-"}</td>
                      <td style={styles.td}>
                        <div>{dayOfWeek}</div>
                        {isOverdue(event) && (
                          <div style={styles.overdueLabel}>Overdue</div>
                        )}
                      </td>
                      <td style={styles.td}>{event.eventLeaderEmail || "-"}</td>
                      <td style={styles.td}>{formatDate(event.date)}</td>
                      <td style={styles.td}>
                        <Tooltip title="Capture Attendance" arrow>
                          <button
                            style={styles.openEventIcon}
                            onClick={() => handleCaptureClick(event)}
                            onMouseEnter={(e) => {
                              e.target.style.transform = "scale(1.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = "scale(1)";
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
                            sx={{ color: "#007bff" }}
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
                              sx={{ color: "#dc3545" }}
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
      )}

      <div
        style={{
          ...styles.eventsCounter,
          color: theme.palette.text.secondary,
        }}
      >
        Showing {filteredEvents.length} of {events.length} events
      </div>

      {isAdmin && (
        <div style={fabStyles.fabContainer}>
          {/* Menu Items */}
          {fabMenuOpen && (
            <div style={fabStyles.fabMenu}>
              <div
                style={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                  handleCreateEventType();
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <span style={fabStyles.fabMenuLabel}>Create Event Type</span>
                <div style={fabStyles.fabMenuIcon}>📋</div>
              </div>

              <div
                style={fabStyles.fabMenuItem}
                onClick={() => {
                  setFabMenuOpen(false);
                  handleCreateEvent();
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <span style={fabStyles.fabMenuLabel}>Create Event</span>
                <div style={fabStyles.fabMenuIcon}>📅</div>
              </div>
            </div>
          )}

          {/* Main FAB Button */}
          <button
            style={{
              ...fabStyles.mainFab,
              transform: fabMenuOpen ? "rotate(45deg)" : "rotate(0deg)",
            }}
            onClick={() => setFabMenuOpen(!fabMenuOpen)}
            title="Menu"
            onMouseEnter={(e) =>
              (e.target.style.transform = fabMenuOpen
                ? "rotate(45deg) scale(1.1)"
                : "scale(1.1)")
            }
            onMouseLeave={(e) =>
              (e.target.style.transform = fabMenuOpen
                ? "rotate(45deg)"
                : "scale(1)")
            }
          >
            +
          </button>
        </div>
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
                selectedEventTypeObj={selectedEventTypeObj} // <-- Pass the selected event type object
                // selectedEventType={currentSelectedEventType}
                selectedEventType={selectedEventTypeFilter} // <-- Pass the selected event type name
                eventTypes={allEventTypes}
              />
            </div>
          </div>
        </div>
      )}

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
          0%,
          100% {
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
