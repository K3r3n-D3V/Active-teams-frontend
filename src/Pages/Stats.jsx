import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import PersonIcon from "@mui/icons-material/Person";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  useTheme,
  useMediaQuery,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Paper,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  Container,
  CircularProgress,
  Autocomplete,          
  InputAdornment,    
  Popper,    
} from "@mui/material";
import Collapse from "@mui/material/Collapse";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  People,
  Task,
  Warning,
  Refresh,
  Add,
  Close,
  Visibility,
  ChevronLeft,
  ChevronRight,
  Save,
  Event,
  Download,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { AuthContext } from "../contexts/AuthContext";
import { useTaskUpdate } from '../contexts/TaskUpdateContext';
// import CreateEvents from "./CreateEvents";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const StatsDashboard = () => {

  const { updateCount } = useTaskUpdate();
  console.log(">>> StatsDashboard function body executed — component is alive");
  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));

  const getResponsiveValue = (values) => {
    if (isXsDown) return values.xs;
    if (isSmDown) return values.sm;
    if (isMdDown) return values.md;
    if (isLgDown) return values.lg;
    return values.xl;
  };

  const [stats, setStats] = useState({
    overview: null,
    events: [],
    overdueCells: [],
    allTasks: [],
    allUsers: [],
    groupedTasks: [],
    loading: false,
    error: null,
    dateRange: { start: "", end: "" },
  });

  const [period, setPeriod] = useState("today");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedUsers, setExpandedUsers] = useState([]);
  const [newEventData, setNewEventData] = useState({
    eventName: "",
    eventTypeName: "",
    date: "",
    eventLeaderName: "",
    eventLeaderEmail: "",
    location: "",
    time: "19:00",
    description: "",
    isRecurring: false,
    recurringDays: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);
  const [eventTypeFlags, setEventTypeFlags] = useState({
    isGlobal: false,
    isTicketed: false,
    hasPersonSteps: false,
  });

  const { isGlobal: isGlobalEvent, isTicketed: isTicketedEvent, hasPersonSteps } = eventTypeFlags;

  // Dedicated overdue cells state
  const [cells, setCells] = useState([]);
  const [cellsLoading, setCellsLoading] = useState(false);
  const [cellsError, setCellsError] = useState(null);

  const { authFetch } = useContext(AuthContext);

  /** CHANGE:
   * We use two locks instead of one.
   * One lock is for stats, one is for cells.
   * This stops them from blocking each other.
   */
  const statsLockRef = useRef(false);
  const cellsLockRef = useRef(false);

  /** CHANGE:
   * This helper makes the lock logic easy.
   * If it is already fetching, we skip.
   * Otherwise, we allow the fetch and lock it.
   */

  const canStartFetch = (lockRef, forceRefresh) => {
    if (lockRef.current && !forceRefresh) return false;
    lockRef.current = true;
    return true;
  };

  const releaseFetchLock = (lockRef) => {
    lockRef.current = false;
  };

  const periodOptions = [
    { value: "today", label: "Today" },
    { value: "thisWeek", label: "This Week" },
    { value: "thisMonth", label: "This Month" },
    { value: "previousWeek", label: "Previous Week" },
    { value: "previousMonth", label: "Previous Month" },
  ];

  useEffect(() => {
    if (cells.length > 0) {
      console.group("📅 Overdue Cells — " + cells.length + " found");
      console.table(
        cells.map((cell) => ({
          name: cell.eventName || "—",
          date: cell.date ? new Date(cell.date).toLocaleDateString() : "—",
          leader: cell.eventLeaderName || "—",
          status: cell.status || cell.Status || "incomplete",
          location: cell.location || "—",
          id: cell._id?.slice(-6) + "...",
        }))
      );
      console.groupEnd();
    } else if (!cellsLoading) {
      console.log("No overdue cells right now");
    }
  }, [cells, cellsLoading]);

  const fetchOverdueCells = useCallback(
    async (forceRefresh = false) => {
      /** CHANGE:
       * Use the CELLS lock only.
       * This prevents duplicate CELLS calls, but does NOT affect STATS.
       */
      if (!canStartFetch(cellsLockRef, forceRefresh)) {
        console.log("   Already fetching CELLS — skipping duplicate call");
        return;
      }

      console.log(">>> ENTERED fetchOverdueCells", { forceRefresh, period });

      setCellsLoading(true);
      setCellsError(null);

       setEventTypeFlags({
      isGlobal,
      isTicketed,
      hasPersonSteps,
    });

      console.log("→ Starting fetchOverdueCells", {
        forceRefresh,
        period,
        startDate: "2026-01-22",
      });

      try {
        const startDate = "2026-01-22"; // adjust as needed

        let allEvents = [];
        let page = 1;
        const limit = 90;

        while (true) {
          console.log(
            `   Fetching cells page ${page} (limit=${limit}, start=${startDate})`
          );

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 100000);

          try {
            const url = `${BACKEND_URL}/events/cells?page=${page}&limit=${limit}&start_date=${startDate}&status=incomplete`;
            console.log(" → URL:", url);

            const res = await authFetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            console.log(` ← Response status: ${res.status}`);

            if (!res.ok) {
              const errText = await res.text().catch(() => "No error details");
              console.warn(`Failed page ${page}: ${res.status} – ${errText}`);
              throw new Error(
                `Cells page ${page} failed: ${res.status} – ${errText}`
              );
            }

            const json = await res.json();
            const pageEvents =
              json.cells || json.data || json.events || json.results || [];

            console.log(` ← Got ${pageEvents.length} cells on page ${page}`);

            if (pageEvents.length === 0) break;

            allEvents.push(...pageEvents);

            if (pageEvents.length < limit) break;
            page++;
          } catch (err) {
            if (err?.name === "AbortError") {
              console.warn(`Cell fetch timeout on page ${page}`);
            } else {
              console.error(`Cell fetch error on page ${page}:`, err);
            }
            break;
          }
        }

        console.log(`← Total cells fetched: ${allEvents.length}`);
        if (allEvents.length > 0) console.table(allEvents.slice(0, 5));

    // ────────────────────────────────────────────────
    // Filter only incomplete / overdue / missed cells
    // ────────────────────────────────────────────────
      const overdueCells = allEvents.filter(cell => {
        if ('is_overdue' in cell) {
          return !!cell.is_overdue;                    // true → show, false/null/undefined → hide
        }

        const raw = (cell.status || cell.Status || '').trim();
        const status = raw.toLowerCase();

        const isIncomplete = 
          status === 'incomplete' ||
          status.includes('incomplete') ||
          status === 'incomp' ||
          status === 'not completed';

        const cellDate = cell.date ? new Date(cell.date) : null;
        const isValidDate = cellDate && !isNaN(cellDate.getTime());

        const today = new Date();
        today.setHours(0, 0, 0, 0);           

        const isPast = isValidDate && cellDate < today; 

        return isIncomplete && isPast;
      });
      console.log(`Filtered down to ${overdueCells.length} overdue/incomplete cells (from ${allEvents.length} total)`);

      if (overdueCells.length > 0) {
        console.table(overdueCells.slice(0, 5), ['eventName', 'date', 'status', 'eventLeaderName']);
      }

  setCells(overdueCells);   
  console.log(`Set cells state with ${overdueCells.length} overdue cells`);

  } catch (err) {
    console.error("Overdue cells fetch failed:", err);
    setCellsError(err.message || "Failed to load overdue cells");
    toast.error("Could not load overdue cells");
  } finally {
    setCellsLoading(false);
    cellsLockRef.current = false;
    console.log("fetchOverdueCells finished / released lock");
  }
}, [authFetch]);

// Helper function used when rendering overdue cells (highlighting, chips, etc.)
const isOverdue = useCallback((cell) => {
  if (!cell) return false;

  // Prefer backend-provided flag if it exists
  if ('is_overdue' in cell) {
    return !!cell.is_overdue;
  }

  // Client-side calculation (matches the filter logic above)
  const status = (cell.status || cell.Status || '').trim().toLowerCase();
  const isIncomplete =
    status === 'incomplete' ||
    status.includes('incomplete') ||
    status === 'incomp' ||
    status === 'not completed';

  const cellDate = cell.date ? new Date(cell.date) : null;
  const isValidDate = cellDate && !isNaN(cellDate.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPast = isValidDate && cellDate < today;

  return isIncomplete && isPast;
}, []);

  const fetchStats = useCallback(
    async (forceRefresh = false) => {
      /** CHANGE:
       * Use the STATS lock only.
       * This prevents duplicate STATS calls, but does NOT affect CELLS.
       */
      if (!canStartFetch(statsLockRef, forceRefresh)) {
        console.log("   Already fetching STATS — skipping duplicate call");
        return;
      }

      setStats((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await authFetch(
          `${BACKEND_URL}/stats/dashboard-comprehensive?period=${period}`,
          { retryOnAuthFailure: true, maxRetries: 1 }
        );

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 401) throw new Error("Authentication required");
          throw new Error(
            `HTTP ${response.status}: ${errorText || response.statusText}`
          );
        }

        const data = await response.json();

        setStats({
          overview: data.overview,
          events: data.events || [],
          /** CHANGE:
           * The old code had data.fetchOverdueCells which was incorrect.
           * This keeps it safer by checking common backend field names.
           */
          overdueCells: data.overdueCells || data.overdue_cells || [],
          allTasks: data.allTasks || [],
          allUsers: data.allUsers || [],
          groupedTasks: data.groupedTasks || [],
          dateRange: data.date_range || { start: "", end: "" },
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error("Fetch stats error:", err);
        setStats((prev) => ({ ...prev, loading: false, error: err.message }));
      } finally {
        /** CHANGE:
         * Always release only the stats lock here.
         */
        releaseFetchLock(statsLockRef);
      }
    },
    [period, authFetch]
  );

  const handlePeriodChange = (e) => {
    /** CHANGE:
     * Before, period changes were blocked during fetch.
     * Now, period changes are safe.
     */

    setPeriod(e.target.value);
  };

  /**
   * CHANGE:
   * When the period changes, fetch stats and cells.
   * They won’t block each other because they use different locks.
   */
  useEffect(() => {
    console.log("[OVERDUE + STATS FETCH TRIGGER]", {
      period,
      timestamp: new Date().toISOString(),
    });

    fetchOverdueCells(false);
    fetchStats(false);
  }, [period, fetchOverdueCells, fetchStats]);

  const filteredOverdueCells = useMemo(() => {
    return [...cells].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
      return dateB - dateA;
    });
  }, [cells]);

  const filteredTasks = useMemo(() => stats.allTasks, [stats.allTasks]);
  const filteredEvents = useMemo(() => stats.events, [stats.events]);

  const getPeriodDisplayText = (periodType) => {
    switch (periodType) {
      case "today":
        return "Today";
      case "thisWeek":
        return "This Week";
      case "thisMonth":
        return "This Month";
      case "previousWeek":
        return "Previous Week";
      case "previousMonth":
        return "Previous Month";
      default:
        return periodType;
    }
  };

  // Excel helpers
  const formatDateForExcel = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
      console.warn("Date formatting error:", e, "for date:", dateStr);
      return dateStr;
    }
  };

  // Excel Download Function
  const downloadFilteredStats = () => {
    try {
      const currentPeriod = getPeriodDisplayText(period);
      const today = new Date().toISOString().split("T")[0];

      let dataToExport = [];
      let sheetName = "";
      let fileName = "";

      if (activeTab === 0) {
        if (!filteredOverdueCells || filteredOverdueCells.length === 0) {
          toast.info("No overdue cells data to download for the selected period.");
          return;
        }

        dataToExport = filteredOverdueCells.map((cell) => ({
          "Event ID": cell._id || "",
          "Event Name": cell.eventName || "Unnamed",
          "Event Type": cell.eventTypeName || "",
          Date: cell.date ? formatDateForExcel(cell.date) : "",
          Time: cell.time || "",
          Location: cell.location || "",
          "Event Leader": cell.eventLeaderName || "",
          "Leader Email": cell.eventLeaderEmail || "",
          Status: cell.status || cell.Status || "incomplete",
          Description: cell.description || "",
          "Attendees Count": cell.attendees ? cell.attendees.length : 0,
          "Is Recurring": cell.isRecurring ? "Yes" : "No",
          "Created At": cell.created_at ? formatDateForExcel(cell.created_at) : "",
          "Updated At": cell.updated_at ? formatDateForExcel(cell.updated_at) : "",
        }));

        sheetName = "Overdue_Cells";
        fileName = `overdue_cells_${currentPeriod
          .toLowerCase()
          .replace(/\s+/g, "_")}_${today}.xlsx`;
      } else if (activeTab === 1) {
        if (!filteredTasks || filteredTasks.length === 0) {
          toast.info("No tasks data to download for the selected period.");
          return;
        }

        dataToExport = filteredTasks.map((task) => ({
          "Task ID": task._id || "",
          "Task Name": task.name || task.taskType || "Untitled Task",
          "Task Type": task.type || "",
          "Contact Person": task.contacted_person?.name || "",
          "Contact Phone":
            task.contacted_person?.phone || task.contacted_person?.Number || "",
          "Contact Email": task.contacted_person?.email || "",
          "Assigned To": task.assignedfor || task.name || "",
          "Assigned For": task.assignedfor || "",
          "Due Date": task.followup_date
            ? formatDateForExcel(task.followup_date)
            : "",
          Status: task.status || "pending",
          "Task Stage": task.taskStage || "",
          "Created At": task.created_at ? formatDateForExcel(task.created_at) : "",
          "Updated At": task.updated_at ? formatDateForExcel(task.updated_at) : "",
          "Member ID": task.memberID || "",
          "Task Description": task.description || "",
        }));

        sheetName = "Tasks";
        fileName = `tasks_${currentPeriod
          .toLowerCase()
          .replace(/\s+/g, "_")}_${today}.xlsx`;
      } else if (activeTab === 2) {
        if (!filteredEvents || filteredEvents.length === 0) {
          toast.info("No events data to download for the selected period.");
          return;
        }

        dataToExport = filteredEvents.map((event) => ({
          "Event ID": event._id || "",
          "Event Name": event.eventName || "",
          "Event Type": event.eventTypeName || "",
          Date: event.date ? formatDateForExcel(event.date) : "",
          Time: event.time || "",
          Location: event.location || "",
          "Event Leader": event.eventLeaderName || "",
          "Leader Email": event.eventLeaderEmail || "",
          Description: event.description || "",
          Status: event.status || event.Status || "incomplete",
          "Is Recurring": event.isRecurring ? "Yes" : "No",
          "Created At": event.created_at ? formatDateForExcel(event.created_at) : "",
          "Updated At": event.updated_at ? formatDateForExcel(event.updated_at) : "",
        }));

        sheetName = "Events";
        fileName = `events_${currentPeriod
          .toLowerCase()
          .replace(/\s+/g, "_")}_${today}.xlsx`;
      }

      if (dataToExport.length === 0) {
        toast.info("No data to download for the selected period.");
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const wbout = XLSX.write(wb, {
        bookType: "xlsx",
        type: "binary",
        bookSST: false,
      });

      const buffer = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < wbout.length; ++i) {
        view[i] = wbout.charCodeAt(i) & 0xff;
      }

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast.success(`Downloaded ${dataToExport.length} records (${sheetName})`);
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      toast.error("Error creating Excel file: " + error.message);
    }
  };

// ── Location (Geoapify) ──
const [locationOptions, setLocationOptions] = useState([]);
const [locationLoading, setLocationLoading] = useState(false);

useEffect(() => {
  const query = (newEventData.location || "").trim();
  if (query.length < 2) {
    setLocationOptions([]);
    return;
  }

  const timer = setTimeout(async () => {
    setLocationLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
      if (!apiKey) throw new Error("Missing Geoapify API key in .env");

      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=8&filter=countrycode:za&lang=en&apiKey=${apiKey}`;
      console.log("→ Fetching Geoapify:", url);

      const res = await fetch(url);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Geoapify HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("← Geoapify full response:", data);

      const features = data.features || data.results || []; // Geoapify uses "features"
      if (features.length === 0) {
        console.warn("No features returned from Geoapify");
      }

      const options = features.map((feature) => {
        const props = feature.properties || {};
        return {
          label: props.formatted || "No address found",
          formatted: props.formatted || "",
          suburb: props.suburb || props.neighbourhood || props.district || "",
          city: props.city || props.town || props.village || props.county || "",
          // Bonus: store coordinates if you want to show map pin later
          lat: feature.geometry?.coordinates?.[1],
          lon: feature.geometry?.coordinates?.[0],
        };
      });

      console.log("Mapped options:", options);
      setLocationOptions(options);
    } catch (err) {
      console.error("Geoapify fetch failed:", err);
      setLocationOptions([]);
      toast.error("Couldn't load location suggestions. Check your internet or API key.");
    } finally {
      setLocationLoading(false);
    }
  }, 400);

  return () => clearTimeout(timer);
}, [newEventData.location]);

// ── Event Leader (people search) ──
const [peopleData, setPeopleData] = useState([]);
const [allPeopleCache, setAllPeopleCache] = useState([]);

useEffect(() => {
  const fetchAll = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/people?perPage=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("People fetch failed");
      
      const json = await res.json();
      const formatted = (json?.results || json?.data || []).map(p => ({
        id:        p._id,
        fullName:  `${p.Name || ""} ${p.Surname || ""}`.trim(),
        email:     p.Email || "",
        leader1:   p["Leader @1"]  || p.leader1  || "",
        leader12:  p["Leader @12"] || p.leader12 || "",
      }));
      
      setAllPeopleCache(formatted);
      console.log(`Cached ${formatted.length} people`);
    } catch (err) {
      console.error("People cache failed:", err);
    }
  };
  fetchAll();
}, []);

const fetchPeople = (query) => {
  if (!query?.trim()) {
    setPeopleData([]);
    return;
  }

  const q = query.toLowerCase().trim();

  const matches = allPeopleCache.filter(p =>
    p.fullName.toLowerCase().includes(q) ||
    p.email?.toLowerCase().includes(q)
  );

  // You can sort by match quality if you want
  matches.sort((a, b) => {
    const aStarts = a.fullName.toLowerCase().startsWith(q) ? -1 : 1;
    const bStarts = b.fullName.toLowerCase().startsWith(q) ? -1 : 1;
    return aStarts - bStarts;
  });

  setPeopleData(matches.slice(0, 12)); // a bit more generous limit
};
  
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const res = await authFetch(`${BACKEND_URL}/event-types`);
        if (!res.ok) throw new Error("Failed to load event types");

        const data = await res.json();
        const types = data.eventTypes || data.data || data || [];
        setEventTypes(types);
      } catch (err) {
        console.error("Failed to load event types:", err);
        setEventTypes([
          { name: "CELLS" },
          { name: "GLOBAL" },
          { name: "SERVICE" },
          { name: "MEETING" },
          { name: "TRAINING" },
          { name: "OUTREACH" },
        ]);
      } finally {
        setEventTypesLoading(false);
      }
    };

    fetchEventTypes();
  }, [authFetch]);
 
useEffect(() => {
  const handleTaskUpdate = () => {
    console.log('Task update detected, refreshing stats...');
    fetchStats(true);
    fetchOverdueCells(true);
  };


  window.addEventListener('taskUpdated', handleTaskUpdate);
  
  return () => {
    window.removeEventListener('taskUpdated', handleTaskUpdate);
  };
}, [fetchStats, fetchOverdueCells]);



  const toggleExpand = useCallback((key) => {
    setExpandedUsers((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  }, []);

  const formatDate = useCallback(
    (d) =>
      !d
        ? "Not set"
        : new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    []
  );

  const formatDisplayDate = useCallback(
    (d) =>
      !d
        ? "Not set"
        : new Date(d).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
    []
  );

  const getEventsForDate = useCallback(
    (date) =>
      filteredEvents.filter(
        (e) => e.date && new Date(e.date).toISOString().split("T")[0] === date
      ),
    [filteredEvents]
  );

 
  const handleCreateEvent = useCallback(() => {
    setNewEventData((prev) => ({ ...prev, date: selectedDate }));
    setCreateEventModalOpen(true);
  }, [selectedDate]);

  const handleSaveEvent = async () => {
    if (!newEventData.eventName.trim()) {
      setSnackbar({
        open: true,
        message: "Event Name is required!",
        severity: "error",
      });
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("userProfile") || "{}");

      const payload = {
        eventName: newEventData.eventName.trim(),
        eventTypeName: newEventData.eventTypeName,
        date: newEventData.date || selectedDate,
        time: newEventData.time,
        location: newEventData.location || null,
        description: newEventData.description || null,
        eventLeaderName:
          newEventData.eventLeaderName ||
          `${user.name || ""} ${user.surname || ""}`.trim() ||
          "Unknown Leader",
        eventLeaderEmail: newEventData.eventLeaderEmail || user.email || null,
        isRecurring: newEventData.isRecurring,
        recurringDays: newEventData.recurringDays || [],
        status: "incomplete",
        created_at: new Date().toISOString(),
      };

      const res = await authFetch(`${BACKEND_URL}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail?.[0]?.msg || `HTTP ${res.status}`);
      }

      setCreateEventModalOpen(false);
      setNewEventData({
        eventName: "",
        eventTypeName: "",
        date: "",
        eventLeaderName: "",
        eventLeaderEmail: "",
        location: "",
        time: "19:00",
        description: "",
        isRecurring: false,
      });

      setSnackbar({
        open: true,
        message: "Event created successfully!",
        severity: "success",
      });

      /** CHANGE:
       * After creating an event, refresh stats and cells.
       */

      fetchStats(true);
      fetchOverdueCells(true);
    } catch (err) {
      console.error("Create event failed:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to create event",
        severity: "error",
      });
    }
  };

  const EnhancedCalendar = useMemo(() => {
    const eventCounts = {};
    filteredEvents.forEach((e) => {
      if (e.date) {
        const d = e.date.split("T")[0];
        eventCounts[d] = (eventCounts[d] || 0) + 1;
      }
    });

    const todayStr = new Date().toISOString().split("T")[0];

    const goToPreviousMonth = () =>
      setCurrentMonth((prev) => {
        const m = new Date(prev);
        m.setMonth(m.getMonth() - 1);
        return m;
      });

    const goToNextMonth = () =>
      setCurrentMonth((prev) => {
        const m = new Date(prev);
        m.setMonth(m.getMonth() + 1);
        return m;
      });

    const goToToday = () => {
      const now = new Date();
      setCurrentMonth(now);
      setSelectedDate(now.toISOString().split("T")[0]);
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split("T")[0];

      days.push({
        day,
        date: dateStr,
        dateObj,
        eventCount: eventCounts[dateStr] || 0,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    while (days.length % 7 !== 0) days.push(null);

    return (
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="medium">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton size="small" onClick={goToPreviousMonth}>
              <ChevronLeft fontSize="small" />
            </IconButton>

            <Button
              variant="outlined"
              size="small"
              onClick={goToToday}
              sx={{ minWidth: 80 }}
            >
              Today
            </Button>

            <IconButton size="small" onClick={goToNextMonth}>
              <ChevronRight fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.5,
            mb: 1,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <Box
              key={day}
              sx={{
                py: 1,
                textAlign: "center",
                fontSize: "0.8rem",
                fontWeight: "medium",
                color: i === 0 || i === 6 ? "text.secondary" : "text.primary",
                bgcolor: i === 0 || i === 6 ? "action.hover" : "transparent",
                borderRadius: 1,
              }}
            >
              {isSmDown ? day[0] : day}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0.5,
          }}
        >
          {days.map((d, i) =>
            !d ? (
              <Box key={`empty-${i}`} sx={{ height: 54, minHeight: 54 }} />
            ) : (
              <Box
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                sx={{
                  height: 54,
                  minHeight: 54,
                  borderRadius: 2,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  bgcolor: d.isSelected
                    ? "primary.main"
                    : d.isToday
                      ? "primary.50"
                      : "background.paper",
                  color: d.isSelected ? "white" : "text.primary",
                  border: d.isToday && !d.isSelected ? "2px solid" : "1px solid",
                  borderColor:
                    d.isToday && !d.isSelected ? "primary.main" : "divider",
                  transition: "all 0.18s ease",
                  "&:hover": {
                    bgcolor: d.isSelected ? "primary.dark" : "action.hover",
                    transform: "scale(1.04)",
                    boxShadow: 2,
                    zIndex: 1,
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={d.isToday || d.isSelected ? "bold" : "medium"}
                >
                  {d.day}
                </Typography>

                {d.eventCount > 0 && (
                  <Box
                    sx={{
                      mt: 0.5,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      bgcolor: d.isSelected ? "white" : "primary.main",
                    }}
                  />
                )}
              </Box>
            )
          )}
        </Box>
      </Box>
    );
  }, [filteredEvents, currentMonth, selectedDate, isSmDown]);

  const StatCard = React.memo(
    ({ title, value, subtitle, icon, color = "primary" }) => (
      <Paper
        variant="outlined"
        sx={{
          p: getResponsiveValue({ xs: 1, sm: 1.5, md: 1.5, lg: 2, xl: 2 }),
          textAlign: "center",
          boxShadow: 1,
          height: "100%",
          borderTop: `3px solid ${theme.palette[color].main}`,
          transition: "all 0.2s",
          "&:hover": { boxShadow: 3, transform: "translateY(-1px)" },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          mb={0.5}
        >
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: getResponsiveValue({
                xs: 28,
                sm: 32,
                md: 32,
                lg: 36,
                xl: 36,
              }),
              height: getResponsiveValue({
                xs: 28,
                sm: 32,
                md: 32,
                lg: 36,
                xl: 36,
              }),
            }}
          >
            {icon}
          </Avatar>
          <Typography
            variant={getResponsiveValue({
              xs: "h6",
              sm: "h6",
              md: "h5",
              lg: "h5",
              xl: "h5",
            })}
            fontWeight={600}
            color={`${color}.main`}
          >
            {value}
          </Typography>
        </Stack>
        <Typography
          variant={getResponsiveValue({
            xs: "caption",
            sm: "body2",
            md: "body2",
            lg: "body2",
            xl: "body2",
          })}
          color="text.secondary"
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Paper>
    )
  );

  const SkeletonLoader = () => (
    <Container
      maxWidth="xl"
      sx={{
        p: getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 }),
        mt: 8,
      }}
    >
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Skeleton variant="circular" width={32} height={32} />
      </Box>

      <Grid
        container
        spacing={getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 })}
        mb={3}
      >
        {[...Array(3)].map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: "100%",
                borderTop: "3px solid",
                borderColor: "divider",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                mb={1}
              >
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton width={40} height={40} />
              </Box>
              <Skeleton width="80%" height={20} sx={{ mx: "auto" }} />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ mb: 1.5, p: 0.5 }}>
        <Box display="flex">
          {["Overdue Cells", "Tasks", "Calendar"].map((tab, i) => (
            <Box key={i} sx={{ flex: 1, p: 1, textAlign: "center" }}>
              <Skeleton width="100%" height={24} />
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 2,
          height: getResponsiveValue({
            xs: "auto",
            sm: "calc(100vh - 320px)",
            md: "calc(100vh - 320px)",
            lg: "calc(100vh - 320px)",
            xl: "calc(100vh - 320px)",
          }),
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Skeleton height={24} width={200} sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={64} sx={{ borderRadius: "12px" }} />
          ))}
        </Stack>
      </Paper>
    </Container>
  );

  if (stats.loading && !stats.overview) {
    return <SkeletonLoader />;
  }

  if (stats.error && !stats.overview) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Alert
          severity="error"
          action={<Button onClick={() => fetchStats(true)}>Retry</Button>}
        >
          {stats.error}
        </Alert>
      </Box>
    );
  }

  const eventsOnSelectedDate = getEventsForDate(selectedDate);

// Helper to make Autocomplete dropdown match the input width exactly
// Improved Popper: force bottom placement, no flip, high z-index
const SameWidthPopper = (props) => {
  const { anchorEl } = props;
  const width = anchorEl?.getBoundingClientRect?.()?.width || 'auto';

  return (
    <Popper
      {...props}
      placement="bottom-start"           // force it to open downward
      modifiers={[
        {
          name: 'flip',
          enabled: false,                 // prevent flipping to top
        },
        {
          name: 'preventOverflow',
          enabled: true,
          options: {
            boundary: 'viewport',         // respect viewport edges
          },
        },
      ]}
      style={{
        zIndex: 9999,                     // very high to show over everything
        width,
      }}
    />
  );
};

  return (
    <Container
      maxWidth="xl"
      sx={{
        p: getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2.5, xl: 3 }),
        mt: { xs: 4, md: 6 },
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={isXsDown ? "flex-start" : "center"}
        mb={3}
        flexDirection={isXsDown ? "column" : "row"}
        gap={2}
      >
        <Box>
          <Typography variant="h5" fontWeight="medium">
            Dashboard
          </Typography>
          {stats.dateRange.start && stats.dateRange.end && (
            <Typography variant="body2" color="text.secondary">
              {formatDate(stats.dateRange.start)} – {formatDate(stats.dateRange.end)}
            </Typography>
          )}
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={handlePeriodChange}
              disabled={stats.loading}
            >
              {periodOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* CHANGE: Refresh should refresh BOTH stats & cells */}
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => {
                //CHANGE: forceRefresh=true so both fetches run even if a previous call is mid-flight.
                fetchStats(true);
                fetchOverdueCells(true);
              }}
              disabled={stats.loading || cellsLoading}
            >
              <Refresh />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={downloadFilteredStats}
          >
            Download
          </Button>
        </Box>
      </Box>

      {(stats.loading || cellsLoading) && <LinearProgress sx={{ mb: 3 }} />}

      {/* Stat Cards */}
      <Grid container spacing={3} mb={4}>
        {/* <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Attendance"
            value={stats.overview?.total_attendance || 0}
            icon={<People />}
            color="primary"
          />
        </Grid> */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Overdue Cells"
            value={filteredOverdueCells.length}
            subtitle={getPeriodDisplayText(period)}
            icon={<Warning />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Tasks Due"
            value={stats.overview?.tasks_due_in_period || 0}
            subtitle={getPeriodDisplayText(period)}
            icon={<Task />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          centered
          variant={isSmDown ? "scrollable" : "standard"}
        >
          <Tab label={`Overdue Cells (${filteredOverdueCells.length})`} />
          <Tab label={`Tasks (${filteredTasks.length})`} />
          <Tab label={`Calendar (${filteredEvents.length} events)`} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ minHeight: "0px" }}>
        {activeTab === 0 && (
          <Paper
            sx={{
              p: 3,
              height: "calc(100vh - 380px)",
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2.5}
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Typography variant="h6" component="div" fontWeight={600}>
                  Overdue Cells
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getPeriodDisplayText(period)} • {filteredOverdueCells.length} found
                </Typography>
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  (raw cells count: {cells.length})
                </Typography>
              </Box>

              <Box display="flex" gap={1.5} alignItems="center">
                <Chip
                  label={getPeriodDisplayText(period)}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  startIcon={<Visibility fontSize="small" />}
                  onClick={() => setOverdueModalOpen(true)}
                  disabled={filteredOverdueCells.length === 0}
                >
                  View All
                </Button>
              </Box>
            </Box>

          {/* Content area */}
          {cellsLoading ? (
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CircularProgress color="warning" size={60} thickness={4} />
            </Box>
          ) : cellsError ? (
            <Alert 
              severity="error" 
              sx={{ my: 3 }}
              action={
                <Button 
                  color="error" 
                  size="small" 
                  onClick={fetchOverdueCells}
                  startIcon={<Refresh />}
                >
                  Retry
                </Button>
              }
            >
              {cellsError}
            </Alert>
          ) : filteredOverdueCells.length === 0 ? (
            <Box sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'text.secondary',
              textAlign: 'center',
              px: 3
            }}>
              <Warning sx={{ fontSize: 90, opacity: 0.25, mb: 3, color: 'warning.main' }} />
              <Typography variant="h6" gutterBottom>
                No overdue cells
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 480 }}>
                All cells are up to date for the selected period.
                <br />
                Great work keeping everything on track!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ 
              flexGrow: 1, 
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
              '&::-webkit-scrollbar-thumb': { background: '#aaa', borderRadius: '3px' },
              '&::-webkit-scrollbar-thumb:hover': { background: '#888' },
            }}>
              <Stack spacing={2}>
                {filteredOverdueCells.map((cell) => (
                 <Card
                    key={cell._id}
                    variant="outlined"
                    sx={{
                      transition: 'all 0.18s ease',
                      borderLeft: isOverdue(cell) ? '4px solid #dc3545' : '1px solid',
                      borderLeftColor: isOverdue(cell) ? '#dc3545' : 'divider',
                      bgcolor: isOverdue(cell) ? 'error.50' : 'background.paper',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ py: 2, px: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {cell.eventName || 'Unnamed Cell'}
                          </Typography>

                          <Stack direction="row" spacing={2} mt={0.5} alignItems="center" flexWrap="wrap">
                            {cell.date && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  <Event fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                  {formatDate(cell.date)}
                                </Typography>
                                
                                {isOverdue(cell) && (
                                  <Chip
                                    label="OVERDUE"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.68rem',
                                      fontWeight: 'bold',
                                      borderWidth: 1.5,
                                    }}
                                  />
                                )}
                              </Box>
                            )}
                            {cell.eventLeaderName && (
                              <Typography variant="body2" color="text.secondary">
                                <People fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                Leader: {cell.eventLeaderName}
                              </Typography>
                            )}
                          </Stack>

                            {cell.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1.5, lineHeight: 1.5 }}
                              >
                                {cell.description}
                              </Typography>
                            )}
                          </Box>

                        <Box textAlign="right">
                          {isOverdue(cell) ? (
                            <Box
                              sx={{
                                bgcolor: '#dc35451a',           // light red background
                                color: '#dc3545',
                                border: '1px solid #dc3545',
                                borderRadius: 1,
                                px: 2,
                                py: 0.75,
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                              }}
                            >
                              OVERDUE
                            </Box>
                          ) : (
                            <Chip
                              label={(cell.Status || 'incomplete').replace('_', ' ').toUpperCase()}
                              size="small"
                              color={
                                cell.Status?.toLowerCase() === 'complete'     ? 'success' :
                                cell.Status?.toLowerCase() === 'did_not_meet' ? 'error'   :
                                                                                'default'
                              }
                              sx={{
                                minWidth: 110,
                                fontWeight: 600,
                                textTransform: 'capitalize',
                              }}
                            />
                          )}

                          {cell.attendees?.length > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                              {cell.attendees.length} attendee{cell.attendees.length !== 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      )}
        </Box>
        {activeTab === 1 && (
          <Paper sx={{ 
            p: getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 }), 
            height: getResponsiveValue({ xs: 'auto', sm: 'calc(100vh - 320px)', md: 3, lg: 'calc(100vh - 320px)', xl: 'calc(100vh - 320px)' }),
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: isXsDown ? "flex-start" : "center", 
              mb: { xs: 2.5, md: 3 },
              flexShrink: 0,
              flexDirection: isXsDown ? "column" : "row",
              gap: isXsDown ? 1 : 0,
            }}
          >
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                All Tasks by Person ({stats.groupedTasks.length} people •{" "}
                {filteredTasks.length} total)
              </Typography>
            </Box>
            <Chip
              label={`Period: ${getPeriodDisplayText(period)}`}
              color="secondary"
              size="small"
              variant="outlined"
            />
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              overflow: "auto",
              pr: 1,
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": { background: "#888", borderRadius: "3px" },
              "&::-webkit-scrollbar-thumb:hover": { background: "#555" },
            }}
          >
            {stats.groupedTasks.length === 0 && !stats.loading ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  color: "text.secondary",
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 1.5,
                }}
              >
                <Task sx={{ fontSize: 48, opacity: 0.3, mb: 1.5 }} />
                <Typography variant="body1">No tasks found</Typography>
                <Typography variant="caption" sx={{ fontSize: "0.75rem" }}>
                  No tasks found for {getPeriodDisplayText(period)}.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {stats.groupedTasks.map(
                  ({ user, tasks, totalCount, completedCount, incompleteCount }) => {
                    const key = user.email || user.fullName;
                    const isExpanded = expandedUsers.includes(key);

                    return (
                      <Box
                        key={key}
                        sx={{
                          backgroundColor: "background.paper",
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: 1,
                          overflow: "hidden",
                          transition: "all 0.2s",
                          "&:hover": { boxShadow: 2 },
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.5,
                            cursor: "pointer",
                            backgroundColor:
                              incompleteCount > 0 ? "error.50" : "transparent",
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                          onClick={() => toggleExpand(key)}
                        >
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar
                                sx={{
                                  bgcolor: "primary.main",
                                  width: 40,
                                  height: 40,
                                  fontSize: "1rem",
                                  fontWeight: "bold",
                                }}
                              >
                                {user.fullName?.charAt(0)?.toUpperCase?.() || "?"}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {user.fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {totalCount} task{totalCount !== 1 ? "s" : ""} •{" "}
                                  {completedCount} completed
                                  {incompleteCount === 0 &&
                                    totalCount > 0 &&
                                    " — ALL DONE!"}
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton size="small" sx={{ p: 0.5 }}>
                              <ExpandMore
                                sx={{
                                  transition: "transform 0.2s ease",
                                  transform: isExpanded
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                }}
                              />
                            </IconButton>
                          </Box>
                        </Box>

                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 1.5, pb: 1.5, pt: 1, backgroundColor: "grey.50" }}>
                            <Divider sx={{ mb: 1.5 }} />
                            {tasks.length === 0 ? (
                              <Typography
                                color="text.secondary"
                                fontStyle="italic"
                                variant="caption"
                              >
                                No tasks assigned
                              </Typography>
                            ) : (
                              <Stack spacing={1}>
                                {tasks.map((task) => (
                                  <Box
                                    key={task._id}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: 1.5,
                                      backgroundColor: "background.paper",
                                      border: "1px solid",
                                      borderColor: "divider",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Box>
                                      <Typography variant="caption" fontWeight="medium">
                                        {task.name || task.taskType || "Untitled Task"}
                                      </Typography>
                                      {task.contacted_person?.name && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ display: "block", fontSize: "0.7rem" }}
                                        >
                                          Contact: {task.contacted_person.name}
                                        </Typography>
                                      )}
                                      {task.followup_date && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{
                                            display: "block",
                                            mt: 0.25,
                                            fontSize: "0.7rem",
                                          }}
                                        >
                                          Due: {formatDate(task.followup_date)}
                                        </Typography>
                                      )}
                                    </Box>

                                    <Chip
                                      label={task.status || "Pending"}
                                      size="small"
                                      color={
                                        ["completed", "done"].includes(
                                          task.status?.toLowerCase?.()
                                        )
                                          ? "success"
                                          : task.status?.toLowerCase?.() === "overdue"
                                            ? "error"
                                            : "warning"
                                      }
                                      sx={{ fontSize: "0.7rem", height: 22 }}
                                    />
                                  </Box>
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  }
                )}
              </Stack>
            )}
          </Box>
        </Paper>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 2 && (
        <Paper
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 2,
            boxShadow: 1,
            minHeight: { xs: "auto", md: "500px" },
          }}
        >
          <Box
            sx={{
              p: { xs: 2, md: 2.5 },
              borderBottom: "1px solid",
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                Event Calendar ({filteredEvents.length} events)
              </Typography>

              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={handleCreateEvent}
              >
                Create Event
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 0,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                flex: { xs: "1 1 auto", md: "0 0 420px" },
                overflowY: "auto",
                p: { xs: 2, md: 2.5 },
                borderRight: { md: "1px solid" },
                borderColor: "divider",
              }}
            >
              {EnhancedCalendar}
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: { xs: 2, md: 2.5 },
                bgcolor: "background.default",
              }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                Events on {formatDisplayDate(selectedDate)}
              </Typography>

              {eventsOnSelectedDate.length > 0 ? (
                <Stack spacing={1.5}>
                  {eventsOnSelectedDate.map((e) => (
                    <Card
                      key={e._id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        transition: "all 0.2s",
                        "&:hover": { boxShadow: 3, transform: "translateY(-2px)" },
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="medium">
                        {e.eventName}
                      </Typography>
                      <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                        <Chip
                          label={e.eventTypeName || "Event"}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {e.time || "No time"} • {e.location || "No location"}
                        </Typography>
                      </Box>
                      {e.eventLeaderName && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Leader: {e.eventLeaderName}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    minHeight: "200px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                    textAlign: "center",
                    py: 6,
                  }}
                >
                  <Event sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No events scheduled
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    for {formatDisplayDate(selectedDate)}
                  </Typography>
                  <Button variant="outlined" startIcon={<Add />} onClick={handleCreateEvent}>
                    Create Event
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      )}

{/* CREATE EVENT MODAL - Using CreateEvents component */}
<Dialog
  open={createEventModalOpen}
  onClose={() => setCreateEventModalOpen(false)}
  maxWidth="sm"
  fullWidth
  fullScreen={isXsDown}
  PaperProps={{
    sx: {
      borderRadius: { xs: 0, sm: 2 },
      boxShadow: 24,
      bgcolor: '#0f0f0f',
      color: '#e0e0e0',
      overflow: 'auto',
      overflowY: 'auto',         
      maxHeight: '90vh',
    }
  }}
>
  {/* Title */}
  <DialogTitle
    sx={{
      bgcolor: '#000000',
      color: '#ffffff',
      p: 2.5,
      fontSize: '1.1rem',
      fontWeight: 600,
      borderBottom: '1px solid #222',
      position: 'relative',
    }}
  >
    Create New Event
    <IconButton
      onClick={() => setCreateEventModalOpen(false)}
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        color: '#aaa',
        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
      }}
    >
      <Close fontSize="small" />
    </IconButton>
  </DialogTitle>

  <DialogContent sx={{ p: 3, bgcolor: '#0f0f0f' }}>
    <Stack spacing={3}>
      {/* ── Event Type ── */}
      <Box>
        <Typography variant="caption" sx={{ color: '#888', mb: 0.5, display: 'block' }}>
          Event Type *
        </Typography>
        <FormControl fullWidth>
          <Select
            value={newEventData.eventTypeName || ""}
            onChange={(e) => setNewEventData(p => ({ ...p, eventTypeName: e.target.value }))}
            displayEmpty
            sx={{
              bgcolor: '#1a1a1a',
              color: '#fff',
              borderRadius: 1,
              fontSize: '0.95rem',
              '& .MuiSelect-select': { py: 1.1, px: 1.6 },
              '& fieldset': { borderColor: '#444' },
              '&:hover fieldset': { borderColor: '#666' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 1.5 },
            }}
          >
            {eventTypesLoading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              eventTypes
                .filter(type => {
                  const n = (type.name || '').toLowerCase();
                  return !n.includes('ticket') && !n.includes('ticketed');
                })
                .map(type => (
                  <MenuItem key={type._id || type.name} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))
            )}
          </Select>
        </FormControl>
      </Box>

      {/* ── Event Name ── */}
      <Box>
        <Typography variant="caption" sx={{ color: '#888', mb: 0.5, display: 'block' }}>
          Event Name *
        </Typography>
        <TextField
          value={newEventData.eventName}
          onChange={e => setNewEventData(p => ({ ...p, eventName: e.target.value }))}
          fullWidth
          variant="outlined"
          autoFocus
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1a1a1a',
              color: '#fff',
              borderRadius: 1,
              fontSize: '0.95rem',
              '& fieldset': { borderColor: '#444' },
              '&:hover fieldset': { borderColor: '#666' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 1.5 },
            },
            '& .MuiInputBase-input': { py: 1.1, px: 1.6 },
          }}
        />
      </Box>

      {/* ── Date & Time ── */}
      <Grid container spacing={2}>
        <Grid item xs={7}>
          <Box>
            <Typography variant="caption" sx={{ color: '#888', mb: 0.5, display: 'block' }}>
              Date *
            </Typography>
            <TextField
              type="date"
              value={newEventData.date || selectedDate}
              onChange={e => setNewEventData(p => ({ ...p, date: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  borderRadius: 1,
                  fontSize: '0.95rem',
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
              }}
            />
          </Box>
        </Grid>
        <Grid item xs={5}>
          <Box>
            <Typography variant="caption" sx={{ color: '#888', mb: 0.5, display: 'block' }}>
              Time *
            </Typography>
            <TextField
              type="time"
              value={newEventData.time || "19:00"}
              onChange={e => setNewEventData(p => ({ ...p, time: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1a1a1a',
                  color: '#fff',
                  borderRadius: 1,
                  fontSize: '0.95rem',
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
              }}
            />
          </Box>
        </Grid>
      </Grid>

      {/* ── Recurring ── */}
      {/* ── Recurring ── */}
      <Box>
        <Typography variant="caption" sx={{ color: '#888', mb: 0.8, display: 'block', fontWeight: 500 }}>
          Is Recurring?
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={newEventData.isRecurring}
              onChange={(e) => setNewEventData(prev => ({ ...prev, isRecurring: e.target.checked }))}
              size="small"
              sx={{
                color: '#888',
                '&.Mui-checked': { color: '#3b82f6' },
                padding: '4px',
              }}
            />
          }
          label={<Typography sx={{ color: '#ddd', fontSize: '0.92rem' }}>Yes</Typography>}
          sx={{ ml: -0.5, mb: 1.5 }}
        />

        {newEventData.isRecurring && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#888', mb: 1.2, display: 'block', fontWeight: 500 }}>
              Recurring Days
            </Typography>
            <Grid container spacing={1} columns={{ xs: 4, sm: 7 }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <Grid item xs={2} sm={1} key={day}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={newEventData.recurringDays?.includes(day) || false}
                        onChange={() => {
                          setNewEventData((prev) => {
                            const currentDays = prev.recurringDays || [];
                            const updatedDays = currentDays.includes(day)
                              ? currentDays.filter((d) => d !== day)
                              : [...currentDays, day];
                            return { ...prev, recurringDays: updatedDays };
                          });
                        }}
                        sx={{
                          color: '#888',
                          '&.Mui-checked': { color: '#3b82f6' },
                          padding: '4px 6px',
                        }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '0.81rem', color: '#ccc' }}>{day}</Typography>}
                    sx={{ m: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>

      {/* ── LOCATION AUTOCOMPLETE (Geoapify) ── */}
     <Box>
  <Typography variant="caption" sx={{ color: '#888', mb: 0.5, display: 'block' }}>
    Location *
  </Typography>
  <Autocomplete
    freeSolo
    fullWidth
    options={locationOptions}
    getOptionLabel={(option) =>
      typeof option === 'string' ? option : option.label || option.formatted || ""
    }
    value={newEventData.location}
    inputValue={newEventData.location}
    onInputChange={(e, newValue) => {
      setNewEventData(p => ({ ...p, location: newValue }));
    }}
    onChange={(e, newValue) => {
      const val = typeof newValue === 'string' ? newValue : newValue?.formatted || newValue?.label || '';
      setNewEventData(p => ({ ...p, location: val }));
    }}
    loading={locationLoading}
    renderInput={(params) => (
      <TextField
        {...params}
        placeholder="Start typing a South African location..."
        fullWidth
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: '#1a1a1a',
            color: '#fff',
            borderRadius: 1,
            fontSize: '0.95rem',
            '& fieldset': { borderColor: '#444' },
            '&:hover fieldset': { borderColor: '#666' },
            '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 1.5 },
          },
          '& .MuiInputBase-input': { py: 1.1, px: 1.6 },
        }}
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <InputAdornment position="start">
              <Box component="span" sx={{ color: '#888', fontSize: '1.2rem' }}>📍</Box>
            </InputAdornment>
          ),
          endAdornment: (
            <>
              {locationLoading ? <CircularProgress color="inherit" size={18} /> : null}
              {params.InputProps.endAdornment}
            </>
          ),
        }}
      />
    )}
    renderOption={(props, option) => (
      <li {...props}>
        <Box>
          <Typography variant="body2">{option.formatted || option.label || "No label"}</Typography>
          {(option.suburb || option.city) && (
            <Typography variant="caption" sx={{ color: '#888' }}>
              {option.suburb ? `${option.suburb}, ` : ''}{option.city || ''}
            </Typography>
          )}
        </Box>
      </li>
    )}
    PopperComponent={SameWidthPopper}
  />
</Box>

      {/* ── EVENT LEADER AUTOCOMPLETE (people search) ── */}
      <Box>
  <Autocomplete
    freeSolo
    fullWidth
    disableClearable
    options={peopleData}
    getOptionLabel={(option) =>
      typeof option === 'string' ? option : option.fullName || ''
    }
    value={newEventData.eventLeader || ''}
    inputValue={newEventData.eventLeader || ''}
    onInputChange={(event, newInputValue) => {
      setNewEventData((prev) => ({ ...prev, eventLeader: newInputValue }));

      if (newInputValue.trim().length >= 2) {
        fetchPeople(newInputValue);
      } else {
        setPeopleData([]);
      }
    }}
    onChange={(event, selectedOption) => {
  if (typeof selectedOption === 'string') {
    // User typed free text (not selected from list)
    setNewEventData(prev => ({
      ...prev,
      eventLeader: selectedOption,
      eventLeaderName: selectedOption,
      eventLeaderEmail: '',
      // Do NOT set leader1/leader12 for free-typed values
      leader1: '',
      leader12: '',
    }));
  } else if (selectedOption) {
    // User selected a real person → auto-fill based on flags
    const isLevel1 = !!selectedOption.leader1 && 
      ["Yes", "yes", "true", "1", "Y", true].includes(selectedOption.leader1);

    const isLevel12 = !!selectedOption.leader12 && 
      ["Yes", "yes", "true", "1", "Y", true].includes(selectedOption.leader12);
      console.log("Leader @1 flag:", selectedOption.leader1);
    console.log("Leader @12 flag:", selectedOption.leader12);
    console.log("Auto-setting leader1:", isLevel1 ? selectedOption.fullName : 'empty');
    console.log("Auto-setting leader12:", isLevel12 ? selectedOption.fullName : 'empty');

    setNewEventData(prev => ({
      ...prev,
      eventLeader: selectedOption.fullName,
      eventLeaderName: selectedOption.fullName,
      eventLeaderEmail: selectedOption.email || '',
      leader1: isLevel1 ? selectedOption.fullName : '',
      leader12: isLevel12 ? selectedOption.fullName : '',
    }));
  }
}}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Event Leader *"
        placeholder="Type name and surname to search..."
        fullWidth
        size="small"
        autoComplete="off"
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: '#1a1a1a',
            color: '#fff',
            borderRadius: 1,
            fontSize: '0.95rem',
            '& fieldset': { borderColor: '#444' },
            '&:hover fieldset': { borderColor: '#666' },
            '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: 1.5 },
          },
          '& .MuiInputBase-input': { py: 1.1, px: 1.6 },
        }}
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon />
            </InputAdornment>
          ),
        }}
      />
    )}
    renderOption={(props, option) => (
      <li {...props}>
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {option.fullName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#888' }}>
            {option.email}
          </Typography>
        </Box>
      </li>
    )}
    PopperComponent={SameWidthPopper}
  />
</Box>

      {/* Description */}
      <Box>
        <Typography variant="caption" sx={{ color: '#888', mb: 0.5, display: 'block' }}>
          Description
        </Typography>
        <TextField
          value={newEventData.description || ''}
          onChange={e => setNewEventData(p => ({ ...p, description: e.target.value }))}
          fullWidth
          multiline
          rows={3}
          placeholder="Enter event description..."
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1a1a1a',
              color: '#fff',
              borderRadius: 1,
              fontSize: '0.95rem',
              '& fieldset': { borderColor: '#444' },
              '&:hover fieldset': { borderColor: '#666' },
              '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
            },
          }}
        />
      </Box>
    </Stack>
  </DialogContent>

  <DialogActions sx={{ px: 3, py: 2, bgcolor: '#000', borderTop: '1px solid #222' }}>
    <Button
      onClick={() => setCreateEventModalOpen(false)}
      sx={{ color: '#aaa', textTransform: 'none', fontSize: '0.9rem' }}
    >
      CANCEL
    </Button>
    <Button
      variant="contained"
      disableElevation
      sx={{
        bgcolor: '#3b82f6',
        color: 'white',
        textTransform: 'none',
        px: 4,
        fontSize: '0.9rem',
        '&:hover': { bgcolor: '#2563eb' },
      }}
      onClick={handleSaveEvent}
      disabled={!newEventData.eventName.trim() || !newEventData.eventTypeName}
    >
      CREATE EVENT
    </Button>
  </DialogActions>
</Dialog>
      {/* OVERDUE CELLS MODAL */}
      <Dialog
        open={overdueModalOpen}
        onClose={() => setOverdueModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isXsDown}
      >
        <DialogTitle sx={{ background: "warning", color: "white", p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Warning sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Overdue / Incomplete Cells ({filteredOverdueCells.length})
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Cells that need attention
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setOverdueModalOpen(false)} sx={{ color: "white" }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {filteredOverdueCells.length === 0 ? (
            <Typography color="text.secondary" align="center" py={4}>
              No overdue cells — great job!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {filteredOverdueCells.map((cell) => (
                <Card
                  key={cell._id}
                  variant="outlined"
                  sx={{ p: 2, backgroundColor: "error.50" }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: "warning.main" }}>
                      <Warning />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {cell.eventName || "Unnamed Cell"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Leader: {cell.eventLeaderName || "Not assigned"}
                      </Typography>
                      <Typography variant="caption" color="error" fontWeight="medium">
                        {formatDate(cell.date)} —{" "}
                        {(cell.status || cell.Status || "INCOMPLETE").toUpperCase()}
                      </Typography>
                    </Box>
                    <Chip label={cell.attendees?.length || 0} size="small" />
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOverdueModalOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default StatsDashboard;