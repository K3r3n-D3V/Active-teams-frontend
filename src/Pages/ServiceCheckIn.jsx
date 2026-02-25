import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import {
  Checkbox,
  FormControlLabel,
  Menu,
  DialogContentText,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
  useMediaQuery,
  TablePagination,
  MenuItem,
  Select,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Skeleton,
  Tabs,
  Tab,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AddPersonDialog from "../components/AddPersonDialog";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GroupIcon from "@mui/icons-material/Group";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ConsolidationModal from "../components/ConsolidationModal";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import MergeIcon from "@mui/icons-material/Merge";
import EventHistory from "../components/EventHistory";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import EventHistoryModal from "../components/EventHistoryModal";
import { AuthContext } from "../contexts/AuthContext";
import * as XLSX from "xlsx";
import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { useTaskUpdate } from "../contexts/TaskUpdateContext";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

// ─────────────────────────────────────────────
// FIX #7 + #2: Memoised filter/search helpers (outside component so they're stable)
// ─────────────────────────────────────────────
function buildSearchableText(person) {
  return [
    person.name || "",
    person.surname || "",
    person.email || "",
    person.phone || "",
    person.number || "",
    person.leader1 || "",
    person.leader12 || "",
    person.leader144 || "",
    person.gender || "",
    person.cellGroup || "",
    person.zone || "",
    person.invitedBy || "",
    person.address || "",
    person.homeAddress || "",
    person.stage || "",
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSearch(person, searchTerms) {
  const text = buildSearchableText(person);
  return searchTerms.every((t) => text.includes(t));
}

function isPriorityEnslin(firstName, surname) {
  const isEnslin = surname.includes("ensl");
  const isVicky =
    firstName.includes("vick") ||
    firstName.includes("vic") ||
    firstName.includes("vicky");
  const isGavin =
    firstName.includes("gav") ||
    firstName.includes("gavin") ||
    firstName.includes("gavyn");
  return isEnslin && (isVicky || isGavin);
}

function getSearchPriorityScore(attendee, searchTermLower) {
  const firstName = (attendee.name || "").toLowerCase();
  const lastName = (attendee.surname || "").toLowerCase();
  if (!isPriorityEnslin(firstName, lastName)) return 0;
  const isEnslinSearch = searchTermLower.includes("ensl");
  if (!isEnslinSearch) return 0;
  return 90;
}

// ─────────────────────────────────────────────
// FIX #5: Unified sort comparator (stable reference)
// ─────────────────────────────────────────────
function createLeaderSortComparator(leaderField) {
  return (v1, v2, row1, row2) => {
    const fn1 = (row1.name || "").toLowerCase().trim();
    const fn2 = (row2.name || "").toLowerCase().trim();
    const sn1 = (row1.surname || "").toLowerCase().trim();
    const sn2 = (row2.surname || "").toLowerCase().trim();

    const p1 = isPriorityEnslin(fn1, sn1);
    const p2 = isPriorityEnslin(fn2, sn2);
    if (p1 && !p2) return -1;
    if (!p1 && p2) return 1;

    if (row1.isNew && !row2.isNew) return -1;
    if (!row1.isNew && row2.isNew) return 1;

    const hl1 = Boolean(row1[leaderField]?.trim());
    const hl2 = Boolean(row2[leaderField]?.trim());
    if (hl1 && !hl2) return -1;
    if (!hl1 && hl2) return 1;

    return (row1[leaderField] || "").toLowerCase().localeCompare((row2[leaderField] || "").toLowerCase());
  };
}

const leaderComparators = {
  leader1: createLeaderSortComparator("leader1"),
  leader12: createLeaderSortComparator("leader12"),
  leader144: createLeaderSortComparator("leader144"),
};

function normalisePerson(p) {
  return {
    _id: p._id,
    name: p.Name || "",
    surname: p.Surname || "",
    email: p.Email || "",
    phone: p.Number || "",
    number: p.Number || "",
    leader1: p["Leader @1"] || "",
    leader12: p["Leader @12"] || "",
    leader144: p["Leader @144"] || "",
    gender: p.Gender || "",
    address: p.Address || "",
    birthday: p.Birthday || "",
    dob: p.Birthday || "",
    invitedBy: p.InvitedBy || "",
    stage: p.Stage || "",
    fullName: p.FullName || `${p.Name || ""} ${p.Surname || ""}`.trim(),
  };
}

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
}

const emptyForm = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  number: "",
  gender: "",
  invitedBy: "",
  leader1: "",
  leader12: "",
  leader144: "",
  stage: "Win",
  dob: "",
  address: "",
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
function ServiceCheckIn() {
  const { authFetch } = useContext(AuthContext);
  const { notifyTaskUpdate } = useTaskUpdate();

  // ── Core state ──
  const [attendees, setAttendees] = useState([]);
  const [currentEventId, setCurrentEventId] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [openDialog, setOpenDialog] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPeopleModalOpen, setNewPeopleModalOpen] = useState(false);
  const [consolidatedModalOpen, setConsolidatedModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [consolidationOpen, setConsolidationOpen] = useState(false);
  const [sortModel, setSortModel] = useState([
    { field: "isNew", sort: "desc" },
    { field: "name", sort: "asc" },
  ]);
  const [realTimeData, setRealTimeData] = useState(null);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isClosingEvent, setIsClosingEvent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalPage, setModalPage] = useState(0);
  const [modalRowsPerPage, setModalRowsPerPage] = useState(100);
  const [newPeopleSearch, setNewPeopleSearch] = useState("");
  const [newPeoplePage, setNewPeoplePage] = useState(0);
  const [newPeopleRowsPerPage, setNewPeopleRowsPerPage] = useState(100);
  const [consolidatedSearch, setConsolidatedSearch] = useState("");
  const [consolidatedPage, setConsolidatedPage] = useState(0);
  const [consolidatedRowsPerPage, setConsolidatedRowsPerPage] = useState(100);
  const [activeTab, setActiveTab] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    personId: null,
    personName: "",
  });
  const [eventHistoryModal, setEventHistoryModal] = useState({
    open: false,
    event: null,
    type: null,
    data: [],
  });
  const [formData, setFormData] = useState(emptyForm);
  const [contextMenu, setContextMenu] = useState({
    mouseX: null,
    mouseY: null,
    data: null,
    type: null,
  });

  // ── Responsive helpers ──
  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));
  const isDarkMode = theme.palette.mode === "dark";

  const getResponsiveValue = (xs, sm, md, lg, xl) => {
    if (isXsDown) return xs;
    if (isSmDown) return sm;
    if (isMdDown) return md;
    if (isLgDown) return lg;
    return xl;
  };

  const containerPadding = getResponsiveValue(0.5, 1, 2, 3, 3);
  const titleVariant = getResponsiveValue("subtitle1", "h6", "h5", "h4", "h4");
  const cardSpacing = getResponsiveValue(0.5, 1, 1.5, 2, 2);

  // ─────────────────────────────────────────────
  // FIX #3: Build a stable person-lookup map to avoid O(n²) find() in renders
  // ─────────────────────────────────────────────
  const attendeeMap = useMemo(() => {
    const map = new Map();
    attendees.forEach((a) => map.set(a._id, a));
    return map;
  }, [attendees]);

  // ─────────────────────────────────────────────
  // Data fetching (useCallback so deps don't rebuild every render)
  // ─────────────────────────────────────────────
  const fetchRealTimeEventData = useCallback(
    async (eventId) => {
      if (!eventId) return null;
      try {
        const response = await authFetch(
          `${BASE_URL}/service-checkin/real-time-data?event_id=${eventId}`,
          { method: "GET" }
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data.success ? data : null;
      } catch {
        return null;
      }
    },
    [authFetch]
  );

  // Shared people-fetch so both people list and events only download /cache/people ONCE
  const fetchAllPeople = useCallback(async () => {
    setIsLoadingPeople(true);
    try {
      const response = await authFetch(`${BASE_URL}/cache/people`);
      if (!response.ok) throw new Error("Failed to fetch people");
      const data = await response.json();
      if (data.success && data.cached_data) {
        setAttendees(data.cached_data.map(normalisePerson));
        setHasDataLoaded(true);
        return data.cached_data; // return raw list so fetchEvents can reuse it
      }
    } catch (err) {
      toast.error("Failed to load people data. Please refresh the page.");
    } finally {
      setIsLoadingPeople(false);
    }
    return [];
  }, [authFetch]);

  // fetchEvents accepts an optional pre-loaded peopleList to avoid double-fetching
  const fetchEvents = useCallback(
    async (forceRefresh = false, sharedPeopleList = null) => {
      if (!forceRefresh && events.length > 0) return;
      setIsLoadingEvents(true);
      try {
        // Only fetch people if we weren't given a shared list
        const [evResponse, peopleResponse] = sharedPeopleList
          ? [await authFetch(`${BASE_URL}/events/eventsdata`), null]
          : await Promise.all([
              authFetch(`${BASE_URL}/events/eventsdata`),
              authFetch(`${BASE_URL}/cache/people`),
            ]);

        if (!evResponse.ok) throw new Error(`HTTP error! status: ${evResponse.status}`);
        const data = await evResponse.json();
        const eventsData = data.events || [];

        let peopleList = sharedPeopleList || [];
        if (!sharedPeopleList && peopleResponse?.ok) {
          const pd = await peopleResponse.json();
          if (pd.success && pd.cached_data) peopleList = pd.cached_data;
        }

        // FIX #3: Build lookup map once
        const peopleById = new Map();
        const peopleByEmail = new Map();
        peopleList.forEach((p) => {
          if (p._id) peopleById.set(p._id, p);
          if (p.id) peopleById.set(p.id, p);
          if (p.Email) peopleByEmail.set(p.Email.toLowerCase(), p);
          if (p.email) peopleByEmail.set(p.email.toLowerCase(), p);
        });

        const findPerson = (id, email) => {
          if (id && peopleById.has(id)) return peopleById.get(id);
          if (email) return peopleByEmail.get(email.toLowerCase()) || null;
          return null;
        };

        const transformedEvents = eventsData
          .map((event) => {
            try {
              if (!event) return null;
              const attendeesArray = Array.isArray(event.attendees) ? event.attendees : [];
              const newPeopleArray = Array.isArray(event.new_people) ? event.new_people : [];
              const consolidationsArray = Array.isArray(event.consolidations) ? event.consolidations : [];

              const mapEntry = (entry, type) => {
                const id = entry.id || entry._id || entry.person_id;
                const fp = findPerson(id, entry.email || entry.Email || entry.person_email);
                return {
                  ...entry,
                  name: entry.name || entry.Name || fp?.Name || "",
                  surname: entry.surname || entry.Surname || fp?.Surname || "",
                  email: entry.email || entry.Email || fp?.Email || "",
                  phone: entry.phone || entry.Number || fp?.Number || "",
                  leader1: fp?.["Leader @1"] || entry.leader1 || "",
                  leader12: fp?.["Leader @12"] || entry.leader12 || "",
                  leader144: fp?.["Leader @144"] || entry.leader144 || "",
                  id: id || Math.random().toString(36),
                  _id: id,
                  ...(type === "new" && { isNew: true }),
                };
              };

              const attendanceData = attendeesArray.map((a) => mapEntry(a, "att"));
              const newPeopleData = newPeopleArray.map((np) => mapEntry(np, "new"));
              const consolidatedData = consolidationsArray.map((c) => {
                const id = c.person_id || c.id || c._id;
                const fp = findPerson(id, c.person_email || c.email);
                return {
                  ...c,
                  name: c.person_name || c.name || fp?.Name || "",
                  surname: c.person_surname || c.surname || fp?.Surname || "",
                  person_name: c.person_name || c.name || fp?.Name || "",
                  person_surname: c.person_surname || c.surname || fp?.Surname || "",
                  person_email: c.person_email || c.email || fp?.Email || "",
                  person_phone: c.person_phone || c.phone || fp?.Number || "",
                  email: c.person_email || c.email || fp?.Email || "",
                  phone: c.person_phone || c.phone || fp?.Number || "",
                  assigned_to: c.assigned_to || c.assignedTo || "",
                  decision_type: c.decision_type || c.consolidation_type || "Commitment",
                  status: c.status || "active",
                  leader1: fp?.["Leader @1"] || c.leader1 || "",
                  leader12: fp?.["Leader @12"] || c.leader12 || "",
                  leader144: fp?.["Leader @144"] || c.leader144 || "",
                  id: id || Math.random().toString(36),
                  _id: id,
                };
              });

              return {
                id: event._id || event.id || Math.random().toString(36),
                eventName: event.eventName || event.Event_Name || "Unnamed Event",
                status: (event.status || "open").toLowerCase(),
                isGlobal: event.isGlobal === true,
                isTicketed: event.isTicketed === true,
                date: event.date || event.createdAt,
                eventType: event.eventType || "Global Events",
                closed_by: event.closed_by,
                closed_at: event.closed_at,
                attendees: attendeesArray,
                new_people: newPeopleArray,
                consolidations: consolidationsArray,
                total_attendance:
                  typeof event.total_attendance === "number"
                    ? event.total_attendance
                    : attendanceData.length,
                attendance: attendanceData.length,
                newPeople: newPeopleData.length,
                consolidated: consolidatedData.length,
                attendanceData,
                newPeopleData,
                consolidatedData,
                location: event.location || event.Location || "",
                description: event.description || "",
                UUID: event.UUID || "",
                created_at: event.created_at,
                updated_at: event.updated_at,
              };
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        const validEvents = transformedEvents.filter((event) => {
          if (!event || event.status === "error") return false;
          const typeName = (event.eventType || "").toLowerCase();
          if (typeName === "cells" || typeName === "all cells" || typeName === "cell") return false;
          if (event.isGlobal !== true) return false;
          return true;
        });

        setEvents(validEvents);

        if (!currentEventId && validEvents.length > 0) {
          const filtered = getFilteredEvents(validEvents);
          if (filtered.length > 0) setCurrentEventId(filtered[0].id);
        }
      } catch {
        toast.error("Failed to fetch events. Please try again.");
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [authFetch, currentEventId, events.length]
  );

  // ─────────────────────────────────────────────
  // FIX #1: Polling - single interval, longer cadence for events
  // ─────────────────────────────────────────────
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Bootstrap: single parallel fetch — /cache/people downloaded ONCE, shared with events
    (async () => {
      try {
        const [evResponse, peopleResponse] = await Promise.all([
          authFetch(`${BASE_URL}/events/eventsdata`),
          authFetch(`${BASE_URL}/cache/people`),
        ]);

        // Resolve people first — grid becomes interactive immediately
        let rawPeople = [];
        if (peopleResponse.ok) {
          const pd = await peopleResponse.json();
          if (pd.success && pd.cached_data) {
            rawPeople = pd.cached_data;
            setAttendees(rawPeople.map(normalisePerson));
            setHasDataLoaded(true);
            setIsLoadingPeople(false);
          }
        }

        // Then process events reusing the already-downloaded people list
        if (evResponse.ok) {
          const evData = await evResponse.json();
          const eventsData = evData.events || [];

          const peopleById = new Map();
          const peopleByEmail = new Map();
          rawPeople.forEach((p) => {
            if (p._id) peopleById.set(p._id, p);
            if (p.id) peopleById.set(p.id, p);
            if (p.Email) peopleByEmail.set(p.Email.toLowerCase(), p);
            if (p.email) peopleByEmail.set(p.email.toLowerCase(), p);
          });
          const findPerson = (id, email) => {
            if (id && peopleById.has(id)) return peopleById.get(id);
            if (email) return peopleByEmail.get(email.toLowerCase()) || null;
            return null;
          };

          const mapEntry = (entry, isNew = false) => {
            const id = entry.id || entry._id || entry.person_id;
            const fp = findPerson(id, entry.email || entry.Email || entry.person_email);
            return {
              ...entry,
              name: entry.name || entry.Name || fp?.Name || "",
              surname: entry.surname || entry.Surname || fp?.Surname || "",
              email: entry.email || entry.Email || fp?.Email || "",
              phone: entry.phone || entry.Number || fp?.Number || "",
              leader1: fp?.["Leader @1"] || entry.leader1 || "",
              leader12: fp?.["Leader @12"] || entry.leader12 || "",
              leader144: fp?.["Leader @144"] || entry.leader144 || "",
              id: id || Math.random().toString(36),
              _id: id,
              ...(isNew && { isNew: true }),
            };
          };

          const transformedEvents = eventsData.map((event) => {
            try {
              if (!event) return null;
              const attendeesArray = Array.isArray(event.attendees) ? event.attendees : [];
              const newPeopleArray = Array.isArray(event.new_people) ? event.new_people : [];
              const consolidationsArray = Array.isArray(event.consolidations) ? event.consolidations : [];
              const attendanceData = attendeesArray.map((a) => mapEntry(a));
              const newPeopleData = newPeopleArray.map((np) => mapEntry(np, true));
              const consolidatedData = consolidationsArray.map((c) => {
                const id = c.person_id || c.id || c._id;
                const fp = findPerson(id, c.person_email || c.email);
                return {
                  ...c,
                  name: c.person_name || c.name || fp?.Name || "",
                  surname: c.person_surname || c.surname || fp?.Surname || "",
                  person_name: c.person_name || c.name || fp?.Name || "",
                  person_surname: c.person_surname || c.surname || fp?.Surname || "",
                  person_email: c.person_email || c.email || fp?.Email || "",
                  person_phone: c.person_phone || c.phone || fp?.Number || "",
                  email: c.person_email || c.email || fp?.Email || "",
                  phone: c.person_phone || c.phone || fp?.Number || "",
                  assigned_to: c.assigned_to || c.assignedTo || "",
                  decision_type: c.decision_type || c.consolidation_type || "Commitment",
                  status: c.status || "active",
                  leader1: fp?.["Leader @1"] || c.leader1 || "",
                  leader12: fp?.["Leader @12"] || c.leader12 || "",
                  leader144: fp?.["Leader @144"] || c.leader144 || "",
                  id: id || Math.random().toString(36),
                  _id: id,
                };
              });
              return {
                id: event._id || event.id || Math.random().toString(36),
                eventName: event.eventName || event.Event_Name || "Unnamed Event",
                status: (event.status || "open").toLowerCase(),
                isGlobal: event.isGlobal === true,
                isTicketed: event.isTicketed === true,
                date: event.date || event.createdAt,
                eventType: event.eventType || "Global Events",
                closed_by: event.closed_by,
                closed_at: event.closed_at,
                attendees: attendeesArray,
                new_people: newPeopleArray,
                consolidations: consolidationsArray,
                total_attendance: typeof event.total_attendance === "number" ? event.total_attendance : attendanceData.length,
                attendance: attendanceData.length,
                newPeople: newPeopleData.length,
                consolidated: consolidatedData.length,
                attendanceData,
                newPeopleData,
                consolidatedData,
                location: event.location || event.Location || "",
                description: event.description || "",
                UUID: event.UUID || "",
                created_at: event.created_at,
                updated_at: event.updated_at,
              };
            } catch { return null; }
          }).filter(Boolean);

          const validEvents = transformedEvents.filter((event) => {
            if (!event || event.status === "error") return false;
            const typeName = (event.eventType || "").toLowerCase();
            if (["cells", "all cells", "cell"].includes(typeName)) return false;
            if (event.isGlobal !== true) return false;
            return true;
          });

          setEvents(validEvents);
          setIsLoadingEvents(false);

          // Auto-select today's open event
          const todayStr = new Date().toISOString().split("T")[0];
          const todayOpen = validEvents.filter((e) => {
            const typeName = (e.eventType || "").toLowerCase();
            if (["cells", "all cells", "cell"].includes(typeName)) return false;
            if (e.isGlobal !== true) return false;
            const status = e.status?.toLowerCase() || "";
            if (["complete", "closed", "cancelled", "did_not_meet"].includes(status)) return false;
            if (!e.date) return false;
            return new Date(e.date).toISOString().split("T")[0] === todayStr;
          });
          if (todayOpen.length > 0) setCurrentEventId(todayOpen[0].id);
        }
      } catch {
        toast.error("Failed to load initial data.");
      } finally {
        setIsLoadingPeople(false);
        setIsLoadingEvents(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentEventId) {
      setRealTimeData(null);
      return;
    }
    let isMounted = true;

    const loadRT = async () => {
      const data = await fetchRealTimeEventData(currentEventId);
      if (data && isMounted) setRealTimeData(data);
    };

    loadRT();

    // FIX #1: Poll real-time data every 5s (was 3s) — events every 30s (was 10s)
    const rtInterval = setInterval(loadRT, 5000);
    const evInterval = setInterval(() => fetchEvents(), 30_000);

    return () => {
      isMounted = false;
      clearInterval(rtInterval);
      clearInterval(evInterval);
    };
  }, [currentEventId, fetchRealTimeEventData, fetchEvents]);

  // ─────────────────────────────────────────────
  // Event filter helpers (memoised)
  // ─────────────────────────────────────────────
  const getFilteredEvents = useCallback((eventsList = events) => {
    const todayStr = new Date().toISOString().split("T")[0];
    return eventsList.filter((event) => {
      const typeName = (event.eventType || "").toLowerCase();
      if (typeName === "cells" || typeName === "all cells" || typeName === "cell") return false;
      if (event.isGlobal !== true) return false;
      const status = event.status?.toLowerCase() || "";
      if (["complete", "closed", "cancelled", "did_not_meet"].includes(status)) return false;
      if (!event.date) return false;
      return new Date(event.date).toISOString().split("T")[0] === todayStr;
    });
  }, [events]);

  const getFilteredClosedEvents = useCallback(() => {
    const closed = events.filter((event) => {
      const status = event.status?.toLowerCase() || "";
      const typeName = (event.eventType || "").toLowerCase();
      if (typeName === "cells" || typeName === "all cells" || typeName === "cell") return false;
      if (event.isGlobal !== true) return false;
      if (!["closed", "complete"].includes(status)) return false;
      if (["cancelled", "did_not_meet"].includes(status)) return false;
      return true;
    });

    if (!eventSearch.trim()) return closed;
    const q = eventSearch.toLowerCase();
    return closed.filter(
      (e) =>
        e.eventName?.toLowerCase().includes(q) ||
        (e.date && new Date(e.date).toLocaleDateString().toLowerCase().includes(q)) ||
        e.status?.toLowerCase().includes(q) ||
        e.closed_by?.toLowerCase().includes(q)
    );
  }, [events, eventSearch]);

  const menuEvents = useMemo(() => {
    const filtered = getFilteredEvents();
    const list = [...filtered];
    if (currentEventId && !list.some((ev) => ev.id === currentEventId)) {
      const cur = events.find((ev) => ev.id === currentEventId);
      if (cur) list.unshift(cur);
    }
    return list;
  }, [events, currentEventId, getFilteredEvents]);

  // ─────────────────────────────────────────────
  // FIX #3 + #7: Memoised derived attendee lists
  // ─────────────────────────────────────────────
  const presentIds = useMemo(() => {
    const ids = new Set();
    (realTimeData?.present_attendees || []).forEach((a) => ids.add(a.id || a._id));
    return ids;
  }, [realTimeData]);

  const newPeopleIds = useMemo(() => {
    const ids = new Set();
    (realTimeData?.new_people || []).forEach((np) => ids.add(np.id || np._id));
    return ids;
  }, [realTimeData]);

  const attendeesWithStatus = useMemo(() =>
    attendees.map((a) => ({
      ...a,
      present: presentIds.has(a._id),
      isNew: newPeopleIds.has(a._id),
      id: a._id,
    })),
    [attendees, presentIds, newPeopleIds]
  );

  // FIX #7: Memoised search — only recompute when deps change
  const filteredAttendees = useMemo(() => {
    if (!search.trim()) return attendeesWithStatus;
    const terms = search.toLowerCase().trim().split(/\s+/);
    const filtered = attendeesWithStatus.filter((p) => matchesSearch(p, terms));

    const q = search.toLowerCase();
    if (q.includes("ensl") || q.includes("vick") || q.includes("vic") || q.includes("gav")) {
      return [...filtered].sort((a, b) => {
        const sa = getSearchPriorityScore(a, q);
        const sb = getSearchPriorityScore(b, q);
        if (sa !== sb) return sb - sa;
        return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`);
      });
    }
    return filtered;
  }, [attendeesWithStatus, search]);

  // FIX #5: Sort and paginate from the SAME array
  const sortedFilteredAttendees = useMemo(() => {
    const result = [...filteredAttendees];
    if (sortModel?.length > 0) {
      const { field, sort } = sortModel[0];
      if (field === "leader1" || field === "leader12" || field === "leader144") {
        result.sort((a, b) => {
          const cmp = leaderComparators[field](a[field], b[field], a, b);
          return sort === "desc" ? -cmp : cmp;
        });
      } else if (field && field !== "actions") {
        result.sort((a, b) => {
          const cmp = (a[field] || "").toString().toLowerCase().localeCompare((b[field] || "").toString().toLowerCase());
          return sort === "desc" ? -cmp : cmp;
        });
      }
    } else {
      result.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`);
      });
    }
    return result;
  }, [filteredAttendees, sortModel]);

  // FIX #5: Paginate sortedFilteredAttendees (was paginating unsorted filteredAttendees)
  const paginatedAttendees = useMemo(
    () => sortedFilteredAttendees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedFilteredAttendees, page, rowsPerPage]
  );

  // Modal present-attendees list (memoised + map-based lookup)
  const modalFilteredAttendees = useMemo(() => {
    const full = (realTimeData?.present_attendees || []).map((a) => {
      const fp = attendeeMap.get(a.id || a._id) || {};
      return {
        ...a,
        ...fp,
        name: fp.name || a.name || "",
        surname: fp.surname || a.surname || "",
        email: fp.email || a.email || "",
        phone: fp.phone || fp.number || a.phone || "",
        number: fp.number || fp.phone || a.number || "",
        leader1: fp.leader1 || a.leader1 || "",
        leader12: fp.leader12 || a.leader12 || "",
        leader144: fp.leader144 || a.leader144 || "",
        id: a.id || a._id,
        _id: a.id || a._id,
      };
    });
    const sorted = [...full].sort((a, b) =>
      `${a.name} ${a.surname}`.toLowerCase().localeCompare(`${b.name} ${b.surname}`.toLowerCase())
    );
    if (!modalSearch.trim()) return sorted;
    const terms = modalSearch.toLowerCase().trim().split(/\s+/);
    return sorted.filter((p) => matchesSearch(p, terms));
  }, [realTimeData, attendeeMap, modalSearch]);

  const modalPaginatedAttendees = useMemo(
    () => modalFilteredAttendees.slice(modalPage * modalRowsPerPage, modalPage * modalRowsPerPage + modalRowsPerPage),
    [modalFilteredAttendees, modalPage, modalRowsPerPage]
  );

  // New-people list (memoised)
  const newPeopleFilteredList = useMemo(() => {
    const full = (realTimeData?.new_people || []).map((np) => {
      const fp = attendeeMap.get(np.id || np._id) || {};
      return {
        ...np,
        ...fp,
        name: fp.name || np.name || "",
        surname: fp.surname || np.surname || "",
        email: fp.email || np.email || "",
        phone: fp.phone || np.phone || "",
        number: fp.number || np.number || "",
        invitedBy: fp.invitedBy || np.invitedBy || "",
        gender: fp.gender || np.gender || "",
        leader1: fp.leader1 || np.leader1 || "",
        leader12: fp.leader12 || np.leader12 || "",
        leader144: fp.leader144 || np.leader144 || "",
      };
    });
    const sorted = [...full].sort((a, b) =>
      `${a.name} ${a.surname}`.toLowerCase().localeCompare(`${b.name} ${b.surname}`.toLowerCase())
    );
    if (!newPeopleSearch.trim()) return sorted;
    const terms = newPeopleSearch.toLowerCase().trim().split(/\s+/);
    return sorted.filter((p) => matchesSearch(p, terms));
  }, [realTimeData, attendeeMap, newPeopleSearch]);

  const newPeoplePaginatedList = useMemo(
    () => newPeopleFilteredList.slice(newPeoplePage * newPeopleRowsPerPage, newPeoplePage * newPeopleRowsPerPage + newPeopleRowsPerPage),
    [newPeopleFilteredList, newPeoplePage, newPeopleRowsPerPage]
  );

  // Consolidated list (memoised)
  const filteredConsolidatedPeople = useMemo(() => {
    const full = (realTimeData?.consolidations || []).map((cons) => {
      const fp =
        attendeeMap.get(cons.person_id) ||
        attendees.find(
          (a) => a.name === (cons.person_name || cons.name) && a.surname === (cons.person_surname || cons.surname)
        ) ||
        {};
      return {
        ...cons,
        ...fp,
        person_name: fp.name || cons.person_name || "",
        person_surname: fp.surname || cons.person_surname || "",
        person_email: fp.email || cons.person_email || "",
        person_phone: fp.phone || cons.person_phone || "",
        assigned_to: cons.assigned_to || cons.assignedTo || "",
        decision_type: cons.decision_type || cons.consolidation_type || "",
        notes: cons.notes || "",
      };
    });
    const sorted = [...full].sort((a, b) =>
      `${a.person_name} ${a.person_surname}`.toLowerCase().localeCompare(`${b.person_name} ${b.person_surname}`.toLowerCase())
    );
    if (!consolidatedSearch.trim()) return sorted;
    const terms = consolidatedSearch.toLowerCase().trim().split(/\s+/);
    return sorted.filter((p) => matchesSearch(p, terms));
  }, [realTimeData, attendeeMap, attendees, consolidatedSearch]);

  const consolidatedPaginatedList = useMemo(
    () => filteredConsolidatedPeople.slice(consolidatedPage * consolidatedRowsPerPage, consolidatedPage * consolidatedRowsPerPage + consolidatedRowsPerPage),
    [filteredConsolidatedPeople, consolidatedPage, consolidatedRowsPerPage]
  );

  const presentCount = realTimeData?.present_attendees?.length ?? 0;
  const newPeopleCount = realTimeData?.new_people_count ?? 0;
  const consolidationCount = realTimeData?.consolidation_count ?? 0;

  // ─────────────────────────────────────────────
  // Handlers (useCallback for stable refs)
  // ─────────────────────────────────────────────

  // FIX #2: handleFullRefresh properly resets dialog state
  const handleFullRefresh = useCallback(async () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }
    setIsRefreshing(true);

    // FIX #2: Clear any open dialog / editing state on refresh
    setOpenDialog(false);
    setEditingPerson(null);
    setFormData(emptyForm);
    setSearch(""); // FIX #3: Clear search bar

    try {
      await authFetch(`${BASE_URL}/cache/people/refresh`, { method: "POST" });
      const [data, cacheResponse] = await Promise.all([
        fetchRealTimeEventData(currentEventId),
        authFetch(`${BASE_URL}/cache/people`),
      ]);

      if (data) setRealTimeData(data);

      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        if (cacheData.success && cacheData.cached_data) {
          setAttendees(cacheData.cached_data.map(normalisePerson));
        }
      }
      toast.success("Refresh complete!");
    } catch {
      toast.error("Failed to refresh data from database");
    } finally {
      setIsRefreshing(false);
    }
  }, [currentEventId, authFetch, fetchRealTimeEventData]);

  const handleRemoveConsolidation = useCallback(
    async (consolidation) => {
      if (!currentEventId) { toast.error("Please select an event first"); return; }
      try {
        setIsDeleting(true);
        const response = await authFetch(
          `${BASE_URL}/service-checkin/remove-consolidation?event_id=${currentEventId}&consolidation_id=${consolidation.id}&keep_person_in_attendees=true`,
          { method: "DELETE" }
        );
        if (response.ok) {
          const result = await response.json();
          if (result.task_deletion?.deleted && result.task_deletion.count > 0) {
            toast.success(`Consolidation removed and ${result.task_deletion.count} task(s) deleted`);
            notifyTaskUpdate?.();
            window.dispatchEvent(new CustomEvent("taskUpdated", { detail: { action: "tasksDeleted", count: result.task_deletion.count } }));
          } else {
            toast.success(result.message || "Consolidation removed successfully");
          }
          const freshData = await fetchRealTimeEventData(currentEventId);
          if (freshData) setRealTimeData(freshData);
        }
      } catch { toast.error("Failed to remove. Please try again."); }
      finally { setIsDeleting(false); }
    },
    [currentEventId, authFetch, fetchRealTimeEventData, notifyTaskUpdate]
  );

  const handleContextMenu = useCallback((event, person, type) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4, data: person, type });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ mouseX: null, mouseY: null, data: null, type: null });
  }, []);

  const handleToggleCheckIn = useCallback(
    async (attendee) => {
      if (!currentEventId) { toast.error("Please select an event"); return; }
      if (checkInLoading.has(attendee._id)) return;

      setCheckInLoading((prev) => new Set(prev).add(attendee._id));
      const fullName = `${attendee.name} ${attendee.surname}`.trim();
      const isCurrentlyPresent = presentIds.has(attendee._id);

      // ── Optimistic update: flip the UI immediately, revert on failure ──
      const personId = attendee._id;
      const optimisticEntry = {
        id: personId,
        _id: personId,
        name: attendee.name,
        surname: attendee.surname,
        email: attendee.email,
        phone: attendee.phone || attendee.number || "",
        leader1: attendee.leader1 || "",
        leader12: attendee.leader12 || "",
        leader144: attendee.leader144 || "",
      };

      setRealTimeData((prev) => {
        if (!prev) return prev;
        if (!isCurrentlyPresent) {
          // Add to present_attendees immediately
          const alreadyThere = (prev.present_attendees || []).some((a) => a.id === personId || a._id === personId);
          if (alreadyThere) return prev;
          return {
            ...prev,
            present_attendees: [...(prev.present_attendees || []), optimisticEntry],
            present_count: (prev.present_count || 0) + 1,
          };
        } else {
          // Remove from present_attendees immediately
          const filtered = (prev.present_attendees || []).filter((a) => a.id !== personId && a._id !== personId);
          return { ...prev, present_attendees: filtered, present_count: filtered.length };
        }
      });

      try {
        let success = false;
        if (!isCurrentlyPresent) {
          const response = await authFetch(`${BASE_URL}/service-checkin/checkin`, {
            method: "POST",
            body: JSON.stringify({
              event_id: currentEventId,
              person_data: { id: personId, name: attendee.name, fullName, email: attendee.email, phone: attendee.phone, number: attendee.number, leader12: attendee.leader12 },
              type: "attendee",
            }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              toast.success(`${fullName} checked in`);
              success = true;
            } else if (data.message?.includes("already checked in")) {
              toast.warning(`${fullName} is already checked in`);
              success = true; // Already there — optimistic state is correct
            }
          }
        } else {
          const response = await authFetch(`${BASE_URL}/service-checkin/remove`, {
            method: "DELETE",
            body: JSON.stringify({ event_id: currentEventId, person_id: personId, type: "attendees" }),
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              toast.info(`${fullName} removed from check-in`);
              success = true;
            }
          }
        }

        if (!success) {
          // Revert optimistic update on failure
          setRealTimeData((prev) => {
            if (!prev) return prev;
            if (!isCurrentlyPresent) {
              // We added them — remove again
              const filtered = (prev.present_attendees || []).filter((a) => a.id !== personId && a._id !== personId);
              return { ...prev, present_attendees: filtered, present_count: filtered.length };
            } else {
              // We removed them — add back
              return { ...prev, present_attendees: [...(prev.present_attendees || []), optimisticEntry], present_count: (prev.present_count || 0) + 1 };
            }
          });
          toast.error(`Failed to update check-in for ${fullName}`);
        }

        // Background sync — don't await, let polling handle it
        fetchRealTimeEventData(currentEventId).then((freshData) => {
          if (freshData) setRealTimeData(freshData);
        });

      } catch (err) {
        // Revert on error
        setRealTimeData((prev) => {
          if (!prev) return prev;
          if (!isCurrentlyPresent) {
            const filtered = (prev.present_attendees || []).filter((a) => a.id !== personId && a._id !== personId);
            return { ...prev, present_attendees: filtered, present_count: filtered.length };
          } else {
            return { ...prev, present_attendees: [...(prev.present_attendees || []), optimisticEntry], present_count: (prev.present_count || 0) + 1 };
          }
        });
        toast.error(err.message || "Failed to toggle check-in");
      } finally {
        setCheckInLoading((prev) => { const s = new Set(prev); s.delete(personId); return s; });
      }
    },
    [currentEventId, checkInLoading, presentIds, authFetch, fetchRealTimeEventData]
  );

  const handlePersonSave = useCallback(
    async (responseData) => {
      if (!currentEventId) { toast.error("Please select an event first before adding people"); return; }
      try {
        if (editingPerson) {
          // AddPersonDialog already did the PATCH and returns normalised data via responseData.
          // Strip the internal flag before using.
          const { __updatedNewPerson, ...normalizedUpdate } = responseData;

          const personId = editingPerson._id;
          toast.success(`${normalizedUpdate.name} ${normalizedUpdate.surname} updated successfully`);

          // 1. Update the main attendees list
          setAttendees((prev) =>
            prev.map((p) => (p._id === personId ? { ...p, ...normalizedUpdate } : p))
          );

          // 2. Update present_attendees AND new_people inside realTimeData
          setRealTimeData((prev) => {
            if (!prev) return prev;
            const patch = (list) =>
              (list || []).map((entry) =>
                entry.id === personId || entry._id === personId
                  ? {
                      ...entry,
                      ...normalizedUpdate,
                      // keep the id field consistent with how realTimeData stores it
                      id: personId,
                      _id: personId,
                      // new_people specific fields
                      person_name: normalizedUpdate.name,
                      person_surname: normalizedUpdate.surname,
                      person_email: normalizedUpdate.email,
                      person_phone: normalizedUpdate.phone || normalizedUpdate.number,
                    }
                  : entry
              );
            return {
              ...prev,
              new_people: patch(prev.new_people),
              present_attendees: patch(prev.present_attendees),
            };
          });

          setOpenDialog(false);
          setEditingPerson(null);
          setFormData(emptyForm);
          return;
        }

        // New person
        const newPersonData = responseData.person || responseData;
        const fullName = `${formData.name} ${formData.surname}`.trim();
        const response = await authFetch(`${BASE_URL}/service-checkin/checkin`, {
          method: "POST",
          body: JSON.stringify({
            event_id: currentEventId,
            person_data: {
              id: newPersonData._id,
              name: newPersonData.Name || formData.name,
              surname: newPersonData.Surname || formData.surname,
              email: newPersonData.Email || formData.email,
              number: newPersonData.Number || formData.number,
              gender: newPersonData.Gender || formData.gender,
              invitedBy: newPersonData.InvitedBy || formData.invitedBy,
              stage: "First Time",
            },
            type: "new_person",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            toast.success(`${fullName} added as new person successfully`);
            setOpenDialog(false);
            setEditingPerson(null);
            setFormData(emptyForm);
            setSearch(""); // FIX #3

            const newPersonForGrid = {
              _id: newPersonData._id,
              name: newPersonData.Name || formData.name,
              surname: newPersonData.Surname || formData.surname,
              email: newPersonData.Email || formData.email,
              number: newPersonData.Number || formData.number,
              phone: newPersonData.Number || formData.number,
              gender: newPersonData.Gender || formData.gender,
              invitedBy: newPersonData.InvitedBy || formData.invitedBy,
              leader1: formData.leader1 || "",
              leader12: formData.leader12 || "",
              leader144: formData.leader144 || "",
              stage: "First Time",
              fullName,
              address: "",
              birthday: "",
              dob: "",
              isNew: true,
              present: false,
            };
            setAttendees((prev) => [newPersonForGrid, ...prev]);

            try {
              await authFetch(`${BASE_URL}/cache/people/refresh`, { method: "POST" });
            } catch {}

            const freshData = await fetchRealTimeEventData(currentEventId);
            if (freshData) setRealTimeData(freshData);
          }
        }
      } catch (error) {
        toast.error(error.message || "Failed to save person");
      }
    },
    [currentEventId, editingPerson, formData, authFetch, fetchRealTimeEventData]
  );

  const handleFinishConsolidation = useCallback(
    async (task) => {
      if (!currentEventId) return;
      const fullName = task.recipientName || `${task.person_name || ""} ${task.person_surname || ""}`.trim() || "Unknown Person";
      setConsolidationOpen(false);
      toast.success(`${fullName} consolidated successfully`);
      const freshData = await fetchRealTimeEventData(currentEventId);
      if (freshData) setRealTimeData(freshData);
      notifyTaskUpdate?.();
      window.dispatchEvent(new CustomEvent("taskUpdated", { detail: { action: "consolidationCreated", task } }));
    },
    [currentEventId, fetchRealTimeEventData, notifyTaskUpdate]
  );

  const handleSaveAndCloseEvent = useCallback(async () => {
    if (!currentEventId) { toast.error("Please select an event first"); return; }
    const currentEvent = events.find((e) => e.id === currentEventId);
    if (!currentEvent) { toast.error("Selected event not found"); return; }
    if (!window.confirm(`Are you sure you want to close "${currentEvent.eventName}"? This action cannot be undone.`)) return;

    setIsClosingEvent(true);
    try {
      const response = await authFetch(`${BASE_URL}/events/${currentEventId}/toggle-status`, { method: "PATCH" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.already_closed) toast.info(result.message || "Event was already closed");
      else toast.success(result.message || `Event "${currentEvent.eventName}" closed successfully!`);

      setEvents((prev) =>
        prev.map((e) =>
          e.id === currentEventId
            ? { ...e, status: "complete", closed_by: result.closed_by, closed_at: result.closed_at }
            : e
        )
      );
      setRealTimeData(null);
      setCurrentEventId("");
      setTimeout(() => fetchEvents(true), 500);
    } catch (error) {
      if (error.message.includes("404")) toast.error("Event not found. It may have been deleted.");
      else if (error.message.includes("400")) toast.error("Invalid event ID.");
      else toast.error("Failed to close event. Please try again.");
    } finally {
      setIsClosingEvent(false);
    }
  }, [currentEventId, events, authFetch, fetchEvents]);

  const handleUnsaveEvent = useCallback(
    async (event) => {
      try {
        const response = await authFetch(`${BASE_URL}/events/${event.id || event._id}/toggle-status`, { method: "PATCH" });
        if (!response.ok) { const e = await response.json(); throw new Error(e.detail || `HTTP error`); }
        const result = await response.json();
        if (result.success) {
          toast.success(`Event "${event.eventName}" has been reopened!`);
          setEvents((prev) => prev.map((ev) => (ev.id === event.id || ev._id === event._id) ? { ...ev, status: "incomplete" } : ev));
          setTimeout(() => fetchEvents(true), 500);
        }
      } catch (error) { toast.error(error.message || "Failed to reopen event"); }
    },
    [authFetch, fetchEvents]
  );

  const handleConsolidationClick = useCallback(() => {
    if (!currentEventId) { toast.error("Please select an event first"); return; }
    setConsolidationOpen(true);
  }, [currentEventId]);

  const handleEditClick = useCallback((person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || "",
      surname: person.surname || "",
      dob: person.dob || person.dateOfBirth || person.birthday || "",
      address: person.homeAddress || person.address || "",
      email: person.email || "",
      number: person.phone || person.Number || person.number || "",
      phone: person.phone || person.Number || person.number || "",
      gender: person.gender || "",
      invitedBy: person.invitedBy || "",
      leader1: person.leader1 || "",
      leader12: person.leader12 || "",
      leader144: person.leader144 || "",
      stage: person.stage || "Win",
    });
    setOpenDialog(true);
  }, []);

  // FIX #4: Handle both _id and id when deleting
  const handleDelete = useCallback(
    async (personId, personName) => {
      setIsDeleting(true);
      try {
        const res = await authFetch(`${BASE_URL}/people/${personId}`, { method: "DELETE" });
        if (!res.ok) { const e = await res.json(); toast.error(`Delete failed: ${e.detail}`); return; }

        // FIX #4: Remove by both _id and id
        setAttendees((prev) => prev.filter((p) => p._id !== personId && p.id !== personId));
        setRealTimeData((prev) => {
          if (!prev) return prev;
          const filterFn = (a) => a.id !== personId && a._id !== personId;
          const newPresent = (prev.present_attendees || []).filter(filterFn);
          const newPeople = (prev.new_people || []).filter(filterFn);
          return {
            ...prev,
            present_attendees: newPresent,
            new_people: newPeople,
            present_count: newPresent.length,
            new_people_count: newPeople.length,
          };
        });

        try { await authFetch(`${BASE_URL}/cache/people/refresh`, { method: "POST" }); } catch {}
        toast.success(`"${personName}" deleted successfully`);
      } catch {
        toast.error("An error occurred while deleting the person");
      } finally {
        setIsDeleting(false);
        setDeleteConfirmation({ open: false, personId: null, personName: "" });
      }
    },
    [authFetch]
  );

  const handleRemoveNewPerson = useCallback(
    async (person) => {
      if (!currentEventId) { toast.error("Please select an event first"); return; }
      try {
        // FIX #4: Use both id and _id
        const personId = person.id || person._id;
        const response = await authFetch(`${BASE_URL}/service-checkin/remove`, {
          method: "DELETE",
          body: JSON.stringify({ event_id: currentEventId, person_id: personId, type: "new_people" }),
        });
        if (response.ok) {
          toast.success("Person removed from new people");
          const freshData = await fetchRealTimeEventData(currentEventId);
          if (freshData) setRealTimeData(freshData);
        }
      } catch { toast.error("Failed to remove person"); }
    },
    [currentEventId, authFetch, fetchRealTimeEventData]
  );

  const exportToExcel = useCallback((data, filename = "export") => {
    if (!data?.length) { toast.error("No data to export"); return; }
    const headers = ["Name", "Surname", "Email", "Phone", "Leader @1", "Leader @12", "Leader @144", "CheckIn_Time", "Status"];
    const worksheetData = data.map((row) => {
      const ordered = {};
      headers.forEach((h) => (ordered[h] = row[h] ?? ""));
      return ordered;
    });
    const ws = XLSX.utils.json_to_sheet(worksheetData, { header: headers });
    ws["!cols"] = headers.map((h) => {
      let maxw = h.length;
      worksheetData.forEach((row) => { const v = String(row[h] || ""); if (v.length > maxw) maxw = v.length; });
      return { wch: maxw + 3 };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Present Attendees");
    const today = new Date().toISOString().split("T")[0];
    try {
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary", compression: true });
      const blob = new Blob([s2ab(wbout)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${today}.xlsx`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} records`);
    } catch { toast.error("Failed to create Excel file"); }
  }, []);

  const handleAddPersonClick = useCallback(() => {
    if (!currentEventId) { toast.error("Please select an event first before adding people"); return; }
    setEditingPerson(null); // FIX #2: always reset
    setFormData(emptyForm); // FIX #2: always reset
    setOpenDialog(true);
  }, [currentEventId]);

  const handleViewEventDetails = useCallback((event, data) => {
    setEventHistoryModal({ open: true, event, type: "attendance", data: data || [] });
  }, []);
  const handleViewNewPeople = useCallback((event, data) => {
    setEventHistoryModal({ open: true, event, type: "newPeople", data: data || [] });
  }, []);
  const handleViewConsolidated = useCallback((event, data) => {
    setEventHistoryModal({ open: true, event, type: "consolidated", data: data || [] });
  }, []);

  // ─────────────────────────────────────────────
  // Column definitions (memoised — only rebuild on responsive breakpoints)
  // ─────────────────────────────────────────────
  const mainColumns = useMemo(() => {
    const base = [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 120,
        sortable: true,
        renderCell: (params) => {
          const isFirstTime = params.row.stage === "First Time" || params.row.isNew === true;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2, width: "100%" }}>
              {isFirstTime && (
                <Chip label="New" size="small" color="success" variant="filled" sx={{ fontSize: "0.55rem", height: 14, flexShrink: 0, padding: "0 3px" }} />
              )}
              <Typography variant="body2" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: isXsDown ? "0.7rem" : isSmDown ? "0.75rem" : "0.9rem", width: "100%" }}>
                {params.row.name} {params.row.surname}
              </Typography>
            </Box>
          );
        },
      },
      ...(!isSmDown
        ? [
            {
              field: "phone",
              headerName: "Phone",
              flex: 0.8,
              minWidth: 100,
              sortable: true,
              renderCell: (params) => (
                <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.9rem", width: "100%" }}>
                  {params.row.number || "—"}
                </Typography>
              ),
            },
            {
              field: "email",
              headerName: "Email",
              flex: 1,
              minWidth: 120,
              sortable: true,
              renderCell: (params) => (
                <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.9rem", width: "100%" }}>
                  {params.row.email || "—"}
                </Typography>
              ),
            },
          ]
        : []),
      {
        field: "leader1",
        headerName: isXsDown ? "L1" : "Leader @1",
        flex: 0.6,
        minWidth: 40,
        sortable: true,
        sortComparator: leaderComparators.leader1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: isXsDown ? "0.65rem" : "0.9rem", whiteSpace: "nowrap", width: "100%" }}>
            {params.row.leader1 || "—"}
          </Typography>
        ),
      },
      {
        field: "leader12",
        headerName: isXsDown ? "L12" : "Leader @12",
        flex: 0.6,
        minWidth: 70,
        sortable: true,
        sortComparator: leaderComparators.leader12,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: isXsDown ? "0.65rem" : "0.9rem", whiteSpace: "nowrap", width: "100%" }}>
            {params.row.leader12 || "—"}
          </Typography>
        ),
      },
      {
        field: "leader144",
        headerName: isXsDown ? "L144" : "Leader @144",
        flex: 0.6,
        minWidth: 70,
        sortable: true,
        sortComparator: leaderComparators.leader144,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: isXsDown ? "0.65rem" : "0.9rem", whiteSpace: "nowrap", width: "100%" }}>
            {params.row.leader144 || "—"}
          </Typography>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const fullName = `${params.row.name || ""} ${params.row.surname || ""}`.trim();
          const isDisabled = !currentEventId;
          const isCheckInLoading = checkInLoading.has(params.row._id);

          return (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
              <Tooltip title={isDisabled ? "Please select an event first" : "Delete"}>
                <span>
                  <IconButton
                    size="medium"
                    color={isDisabled ? "default" : "error"}
                    onClick={() => !isDisabled && setDeleteConfirmation({ open: true, personId: params.row._id, personName: fullName })}
                    disabled={isDisabled || isCheckInLoading}
                    sx={{ padding: isXsDown ? "4px" : "8px", opacity: isDisabled || isCheckInLoading ? 0.5 : 1 }}
                  >
                    <DeleteIcon sx={{ fontSize: isXsDown ? "18px" : "24px" }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={isDisabled ? "Please select an event first" : "Edit"}>
                <span>
                  <IconButton
                    size="medium"
                    color={isDisabled ? "default" : "primary"}
                    onClick={() => !isDisabled && handleEditClick(params.row)}
                    disabled={isDisabled || isCheckInLoading}
                    sx={{ padding: isXsDown ? "4px" : "8px", opacity: isDisabled || isCheckInLoading ? 0.5 : 1 }}
                  >
                    <EditIcon sx={{ fontSize: isXsDown ? "18px" : "24px" }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={isDisabled ? "Please select an event first" : isCheckInLoading ? "Processing..." : params.row.present ? "Checked in" : "Check in"}>
                <span>
                  <IconButton
                    size="medium"
                    color={isDisabled ? "default" : "success"}
                    disabled={isDisabled || isCheckInLoading}
                    onClick={() => !isDisabled && !isCheckInLoading && handleToggleCheckIn(params.row)}
                    sx={{ padding: isXsDown ? "4px" : "8px", opacity: isDisabled || isCheckInLoading ? 0.5 : 1 }}
                  >
                    {params.row.present
                      ? <CheckCircleIcon sx={{ fontSize: isXsDown ? "18px" : "24px" }} />
                      : <CheckCircleOutlineIcon sx={{ fontSize: isXsDown ? "18px" : "24px" }} />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        },
      },
    ];

    if (isSmDown) return base.filter((c) => ["name", "leader12", "leader144", "actions"].includes(c.field));
    return base;
  }, [isXsDown, isSmDown, currentEventId, checkInLoading, handleEditClick, handleToggleCheckIn]);

  // ─────────────────────────────────────────────
  // Sub-components (memoised)
  // ─────────────────────────────────────────────
  const StatsCard = useCallback(
    ({ title, count, icon, color = "primary", onClick, disabled = false }) => (
      <Paper
        variant="outlined"
        sx={{ p: getResponsiveValue(1, 1.5, 2, 2.5, 2.5), textAlign: "center", cursor: disabled ? "default" : "pointer", boxShadow: 2, minHeight: "80px", display: "flex", flexDirection: "column", justifyContent: "center", "&:hover": disabled ? {} : { boxShadow: 4, transform: "translateY(-2px)" }, transition: "all 0.2s", opacity: disabled ? 0.6 : 1, backgroundColor: "background.paper" }}
        onClick={onClick}
      >
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={0.5}>
          {React.cloneElement(icon, { color: disabled ? "disabled" : color, sx: { fontSize: getResponsiveValue(18, 20, 24, 28, 28) } })}
          <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color={disabled ? "text.disabled" : `${color}.main`} sx={{ fontSize: getResponsiveValue("0.9rem", "1rem", "1.2rem", "1.3rem", "1.3rem") }}>
            {count}
          </Typography>
        </Stack>
        <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color={disabled ? "text.disabled" : `${color}.main`} sx={{ fontSize: getResponsiveValue("0.7rem", "0.8rem", "0.9rem", "1rem", "1rem") }}>
          {title}
          {disabled && (<Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: "0.6rem" }}>Select event</Typography>)}
        </Typography>
      </Paper>
    ),
    [getResponsiveValue]
  );

  // No full-page skeleton gate — render the shell immediately, stream data in

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <Box p={containerPadding} sx={{ width: "100%", margin: "0 auto", mt: 6, minHeight: "100vh", maxWidth: "100vw", overflowX: "hidden" }}>
      <ToastContainer position={isSmDown ? "top-center" : "top-right"} autoClose={3000} hideProgressBar={isSmDown} style={{ marginTop: isSmDown ? "0px" : "20px", zIndex: 9999 }} />

      <DeleteConfirmationModal
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, personId: null, personName: "" })}
        onConfirm={() => handleDelete(deleteConfirmation.personId, deleteConfirmation.personName)}
        personName={deleteConfirmation.personName}
        isLoading={isDeleting}
      />

      {/* Stats Cards */}
      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        <Grid item xs={6} sm={6} md={4}>
          <StatsCard title="Present" count={presentCount} icon={<GroupIcon />} color="primary" onClick={() => { if (currentEventId) { setModalOpen(true); setModalSearch(""); setModalPage(0); } }} disabled={!currentEventId} />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <StatsCard title="New People" count={newPeopleCount} icon={<PersonAddAltIcon />} color="success" onClick={() => { if (currentEventId) { setNewPeopleModalOpen(true); setNewPeopleSearch(""); setNewPeoplePage(0); } }} disabled={!currentEventId} />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <StatsCard title="Consolidated" count={consolidationCount} icon={<MergeIcon />} color="secondary" onClick={() => { if (currentEventId) { setConsolidatedModalOpen(true); setConsolidatedSearch(""); setConsolidatedPage(0); } }} disabled={!currentEventId} />
        </Grid>
      </Grid>

      {/* Controls Row */}
      <Grid container spacing={cardSpacing} mb={cardSpacing} alignItems="center">
        <Grid item xs={12} sm={isSmDown ? 12 : 6} md={4}>
          <Select size={getResponsiveValue("small", "small", "medium", "medium", "medium")} value={currentEventId} onChange={(e) => setCurrentEventId(e.target.value)} displayEmpty fullWidth sx={{ boxShadow: 2 }}>
            <MenuItem value=""><Typography color="text.secondary">{isLoadingEvents ? "Loading events..." : "Select Global Event"}</Typography></MenuItem>
            {menuEvents.map((ev) => (<MenuItem key={ev.id} value={ev.id}><Typography variant="body2" fontWeight="medium">{ev.eventName}</Typography></MenuItem>))}
            {menuEvents.length === 0 && events.length > 0 && (<MenuItem disabled><Typography variant="body2" color="text.secondary" fontStyle="italic">No open global events</Typography></MenuItem>)}
            {events.length === 0 && !isLoadingEvents && (<MenuItem disabled><Typography variant="body2" color="text.secondary" fontStyle="italic">No events available</Typography></MenuItem>)}
          </Select>
        </Grid>
        <Grid item xs={12} sm={isSmDown ? 12 : 6} md={5}>
          {activeTab === 0 ? (
            <TextField size={getResponsiveValue("small", "small", "medium", "medium", "medium")} placeholder="Search attendees..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} fullWidth sx={{ boxShadow: 2, mt: isSmDown ? 1 : 0 }} />
          ) : (
            <TextField size={getResponsiveValue("small", "small", "medium", "medium", "medium")} placeholder="Search events..." value={eventSearch} onChange={(e) => setEventSearch(e.target.value)} fullWidth sx={{ boxShadow: 2, mt: isSmDown ? 1 : 0 }} />
          )}
        </Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={2} justifyContent={isMdDown ? "center" : "flex-end"} sx={{ mt: isSmDown ? 2 : 0 }}>
            <Tooltip title={currentEventId ? "Add Person" : "Please select an event first"}>
              <span>
                <PersonAddIcon onClick={handleAddPersonClick} sx={{ cursor: currentEventId ? "pointer" : "not-allowed", fontSize: 36, color: currentEventId ? (isDarkMode ? "white" : "black") : "text.disabled", "&:hover": { color: currentEventId ? "primary.dark" : "text.disabled" }, filter: currentEventId ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" : "none", opacity: currentEventId ? 1 : 0.5 }} />
              </span>
            </Tooltip>
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title={currentEventId ? "Consolidation" : "Please select an event first"}>
                <span>
                  <EmojiPeopleIcon onClick={handleConsolidationClick} sx={{ cursor: currentEventId ? "pointer" : "not-allowed", fontSize: 36, color: currentEventId ? (isDarkMode ? "white" : "black") : "text.disabled", "&:hover": { color: currentEventId ? "secondary.dark" : "text.disabled" }, filter: currentEventId ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" : "none", opacity: currentEventId ? 1 : 0.5 }} />
                </span>
              </Tooltip>
              <Tooltip title={currentEventId ? "Save and Close Event" : "Please select an event first"}>
                <span>
                  <Button variant="contained" startIcon={isClosingEvent ? <CloseIcon /> : <SaveIcon />} onClick={handleSaveAndCloseEvent} disabled={!currentEventId || isClosingEvent} sx={{ minWidth: "auto", px: 2, opacity: currentEventId ? 1 : 0.5, cursor: currentEventId ? "pointer" : "not-allowed", transition: "all 0.2s", backgroundColor: theme.palette.warning.main, "&:hover": currentEventId ? { transform: "translateY(-2px)", boxShadow: 4, backgroundColor: theme.palette.warning.dark } : {} }}>
                    {isClosingEvent ? "Closing..." : "Save"}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={currentEventId ? "Refresh All Data" : "Please select an event first"}>
                <span>
                  <IconButton onClick={handleFullRefresh} color="primary" disabled={!currentEventId || isRefreshing} sx={{ opacity: currentEventId ? 1 : 0.5 }}>
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ minHeight: 400, width: "100%" }}>
        <Paper variant="outlined" sx={{ mb: 2, boxShadow: 3, minHeight: "36px", width: "100%" }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: "divider", minHeight: "36px", "& .MuiTab-root": { py: 0.5, fontSize: getResponsiveValue("0.7rem", "0.8rem", "0.9rem", "1rem", "1rem") } }}>
            <Tab label="All Attendees" />
            <Tab label="Event History" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Paper variant="outlined" sx={{ boxShadow: 3, overflow: "hidden", width: "100%", height: isMdDown ? `calc(100vh - ${containerPadding * 8 + 280}px)` : 650, minHeight: isMdDown ? 500 : 650, maxHeight: isMdDown ? "650px" : 700 }}>
            <DataGrid
              rows={sortedFilteredAttendees}
              columns={mainColumns}
              loading={isLoadingPeople}
              pagination
              paginationModel={{ page, pageSize: rowsPerPage }}
              onPaginationModelChange={(model) => { setPage(model.page); setRowsPerPage(model.pageSize); }}
              rowCount={filteredAttendees.length}
              pageSizeOptions={[25, 50, 100]}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 500 } } }}
              disableRowSelectionOnClick
              sortModel={sortModel}
              onSortModelChange={(model) => { setPage(0); setSortModel(model); }}
              getRowId={(row) => row._id}
              sx={{
                width: "100%",
                height: "calc(100% - 1px)",
                "& .MuiDataGrid-cell": { display: "flex", alignItems: "center", padding: isXsDown ? "2px 4px" : "4px 6px", fontSize: isXsDown ? "0.7rem" : "0.8rem", minWidth: "40px" },
                "& .MuiDataGrid-columnHeaders": { width: "100% !important", backgroundColor: theme.palette.action.hover, borderBottom: `1px solid ${theme.palette.divider}` },
                "& .MuiDataGrid-columnHeader": { fontWeight: 600, minWidth: "40px", fontSize: isXsDown ? "0.7rem" : "0.8rem", padding: isXsDown ? "4px 2px" : "6px 4px", "& .MuiDataGrid-iconButtonContainer": { visibility: "visible !important" }, "& .MuiDataGrid-sortIcon": { opacity: 1 } },
                "& .MuiDataGrid-row:hover": { backgroundColor: theme.palette.action.hover },
                "& .MuiDataGrid-toolbarContainer": { padding: isXsDown ? "4px 2px" : "12px 8px", borderBottom: `1px solid ${theme.palette.divider}` },
                "& .MuiDataGrid-footerContainer": { display: "flex", borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, minHeight: "52px" },
                "& .MuiTablePagination-root": { flexWrap: "wrap", justifyContent: "center", padding: "8px 4px", fontSize: "0.75rem" },
                ...(isSmDown && { "& .MuiDataGrid-columnSeparator": { display: "none" }, "& .MuiDataGrid-toolbarContainer": { flexDirection: "column", alignItems: "flex-start", gap: 1 } }),
              }}
            />
          </Paper>
        )}

        {activeTab === 1 && (
          <Box sx={{ width: "100%" }}>
            <EventHistory
              onViewDetails={handleViewEventDetails}
              onViewNewPeople={handleViewNewPeople}
              onViewConverts={handleViewConsolidated}
              onUnsaveEvent={handleUnsaveEvent}
              events={getFilteredClosedEvents()}
              searchTerm={eventSearch}
              isLoading={isLoadingEvents && events.length === 0}
              onRefresh={() => fetchEvents(true)}
            />
          </Box>
        )}
      </Box>

      {/* Add/Edit Person Dialog */}
      <AddPersonDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setEditingPerson(null); setFormData(emptyForm); }} // FIX #2
        onSave={handlePersonSave}
        formData={formData}
        setFormData={setFormData}
        isEdit={Boolean(editingPerson)}
        personId={editingPerson?._id || null}
        currentEventId={currentEventId}
      />

      {/* Present Attendees Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { boxShadow: 6, maxHeight: "90vh", ...(isSmDown && { margin: 2, maxHeight: "85vh", width: "calc(100% - 32px)" }) } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Attendees Present: {presentCount}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 600 : 700, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField size="small" placeholder="Search..." value={modalSearch} onChange={(e) => { setModalSearch(e.target.value); setModalPage(0); }} fullWidth sx={{ mb: 2, boxShadow: 1 }} />
          {!currentEventId ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>Please select an event to view present attendees</Typography>
          ) : modalFilteredAttendees.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>{modalSearch ? "No matching attendees found" : "No attendees present for this event"}</Typography>
          ) : (
            <>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: "40px" }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: "150px" }}>Name & Surname</TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: "100px" }}>Phone</TableCell>
                    {!isSmDown && <TableCell sx={{ fontWeight: 600, minWidth: "150px" }}>Email</TableCell>}
                    <TableCell sx={{ fontWeight: 600, minWidth: "90px" }}>Leader @1</TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: "90px" }}>Leader @12</TableCell>
                    <TableCell sx={{ fontWeight: 600, minWidth: "90px" }}>Leader @144</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, width: "80px" }}>Remove</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modalPaginatedAttendees.map((a, idx) => (
                    <TableRow key={a.id || a._id} hover>
                      <TableCell>{modalPage * modalRowsPerPage + idx + 1}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight="600" noWrap>{a.name} {a.surname}</Typography></TableCell>
                      <TableCell><Typography variant="body2" noWrap>{a.phone || a.number || "—"}</Typography></TableCell>
                      {!isSmDown && <TableCell><Typography variant="body2" noWrap>{a.email || "—"}</Typography></TableCell>}
                      <TableCell><Typography variant="body2" noWrap>{a.leader1 || "—"}</Typography></TableCell>
                      <TableCell><Typography variant="body2" noWrap>{a.leader12 || "—"}</Typography></TableCell>
                      <TableCell><Typography variant="body2" noWrap>{a.leader144 || "—"}</Typography></TableCell>
                      <TableCell align="center">
                        <Tooltip title="Remove from check-in">
                          <IconButton color="error" size="medium" onClick={() => { const att = attendeeMap.get(a.id || a._id); if (att) handleToggleCheckIn(att); }}>
                            <CheckCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {modalPaginatedAttendees.length === 0 && (<TableRow><TableCell colSpan={8} align="center">No matching attendees</TableCell></TableRow>)}
                </TableBody>
              </Table>
              <Box mt={1}>
                <TablePagination component="div" count={modalFilteredAttendees.length} page={modalPage} onPageChange={(e, p) => setModalPage(p)} rowsPerPage={modalRowsPerPage} onRowsPerPageChange={(e) => { setModalRowsPerPage(parseInt(e.target.value, 10)); setModalPage(0); }} rowsPerPageOptions={[25, 50, 100]} />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => { const d = modalFilteredAttendees.map((a) => ({ Name: a.name, Surname: a.surname, Email: a.email, Phone: a.phone, "Leader @1": a.leader1, "Leader @12": a.leader12, "Leader @144": a.leader144, CheckIn_Time: a.time || "", Status: "Present" })); exportToExcel(d, `Present_Attendees_${currentEventId}`); }} size={isSmDown ? "small" : "medium"} disabled={modalFilteredAttendees.length === 0}>
            Download XLSX
          </Button>
          <Button onClick={() => setModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New People Modal */}
      <Dialog open={newPeopleModalOpen} onClose={() => setNewPeopleModalOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { boxShadow: 6, ...(isSmDown && { margin: 2, maxHeight: "80vh", width: "calc(100% - 32px)" }) } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>New People: {newPeopleCount}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField size="small" placeholder="Search..." value={newPeopleSearch} onChange={(e) => { setNewPeopleSearch(e.target.value); setNewPeoplePage(0); }} fullWidth sx={{ mb: 2, boxShadow: 1 }} />
          {!currentEventId ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>Please select an event to view new people</Typography>
          ) : newPeopleFilteredList.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>{newPeopleSearch ? "No matching people found" : "No new people added for this event"}</Typography>
          ) : (
            <>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    {!isSmDown && <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>}
                    <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Invited By</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: "80px" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newPeoplePaginatedList.map((a, idx) => (
                    <TableRow key={a.id || a._id} hover onContextMenu={(e) => handleContextMenu(e, a, "new_person")}>
                      <TableCell>{newPeoplePage * newPeopleRowsPerPage + idx + 1}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight="medium">{a.name} {a.surname}</Typography></TableCell>
                      <TableCell>{a.phone || "—"}</TableCell>
                      {!isSmDown && <TableCell>{a.email || "—"}</TableCell>}
                      <TableCell>{a.gender || "—"}</TableCell>
                      <TableCell>{a.invitedBy || "—"}</TableCell>
                      <TableCell>
                        <Tooltip title="Remove from new people">
                          <IconButton size="small" color="error" onClick={() => handleRemoveNewPerson(a)} sx={{ padding: "4px" }}>
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box mt={1}>
                <TablePagination component="div" count={newPeopleFilteredList.length} page={newPeoplePage} onPageChange={(e, p) => setNewPeoplePage(p)} rowsPerPage={newPeopleRowsPerPage} onRowsPerPageChange={(e) => { setNewPeopleRowsPerPage(parseInt(e.target.value, 10)); setNewPeoplePage(0); }} rowsPerPageOptions={[25, 50, 100]} />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button onClick={() => setNewPeopleModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Consolidated Modal */}
      <Dialog open={consolidatedModalOpen} onClose={() => setConsolidatedModalOpen(false)} fullWidth maxWidth="md" PaperProps={{ sx: { boxShadow: 6, ...(isSmDown && { margin: 2, maxHeight: "80vh", width: "calc(100% - 32px)" }) } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>Consolidated People: {consolidationCount}</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField size="small" placeholder="Search..." value={consolidatedSearch} onChange={(e) => { setConsolidatedSearch(e.target.value); setConsolidatedPage(0); }} fullWidth sx={{ mb: 2, boxShadow: 1 }} />
          {!currentEventId ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>Please select an event to view consolidated people</Typography>
          ) : filteredConsolidatedPeople.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>{consolidatedSearch ? "No matching consolidated people found" : "No consolidated people for this event"}</Typography>
          ) : (
            <>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Decision Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: "80px" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consolidatedPaginatedList.map((person, idx) => (
                    <TableRow key={person.id || person._id || idx} hover onContextMenu={(e) => handleContextMenu(e, person, "consolidation")}>
                      <TableCell>{consolidatedPage * consolidatedRowsPerPage + idx + 1}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight="medium">{person.person_name} {person.person_surname}</Typography></TableCell>
                      <TableCell>
                        <Box>
                          {person.person_email && <Typography variant="body2">{person.person_email}</Typography>}
                          {person.person_phone && <Typography variant="body2" color="text.secondary">{person.person_phone}</Typography>}
                          {!person.person_email && !person.person_phone && "—"}
                        </Box>
                      </TableCell>
                      <TableCell><Chip label={person.decision_type || "Commitment"} size="small" color={person.decision_type === "Recommitment" ? "primary" : "secondary"} variant="filled" /></TableCell>
                      <TableCell>{person.assigned_to || "Not assigned"}</TableCell>
                      <TableCell>{person.created_at ? new Date(person.created_at).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Tooltip title="Remove consolidation">
                          <IconButton size="small" color="error" onClick={() => handleRemoveConsolidation(person)} sx={{ padding: "4px" }}>
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box mt={1}>
                <TablePagination component="div" count={filteredConsolidatedPeople.length} page={consolidatedPage} onPageChange={(e, p) => setConsolidatedPage(p)} rowsPerPage={consolidatedRowsPerPage} onRowsPerPageChange={(e) => { setConsolidatedRowsPerPage(parseInt(e.target.value, 10)); setConsolidatedPage(0); }} rowsPerPageOptions={[25, 50, 100]} />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button variant="contained" startIcon={<EmojiPeopleIcon />} onClick={() => { setConsolidatedModalOpen(false); handleConsolidationClick(); }} disabled={!currentEventId} size={isSmDown ? "small" : "medium"}>
            Add Consolidation
          </Button>
          <Button onClick={() => setConsolidatedModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>Close</Button>
        </DialogActions>
      </Dialog>

      <EventHistoryModal open={eventHistoryModal.open} onClose={() => setEventHistoryModal({ open: false, event: null, type: null, data: [] })} event={eventHistoryModal.event} type={eventHistoryModal.type} data={eventHistoryModal.data} />

      <ConsolidationModal open={consolidationOpen} onClose={() => setConsolidationOpen(false)} attendeesWithStatus={attendeesWithStatus} onFinish={handleFinishConsolidation} consolidatedPeople={filteredConsolidatedPeople} currentEventId={currentEventId} />
    </Box>
  );
}

export default ServiceCheckIn;