import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, Paper, Grid, TextField, Button, Table, TableBody,
  TableCell, TableHead, TableRow, IconButton, useMediaQuery, TablePagination,
  MenuItem, Select, Chip, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip, Tabs, Tab,
} from "@mui/material";
import { Menu, ListItemIcon, ListItemText } from "@mui/material";
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
import { useOrgConfig } from "../contexts/OrgConfigContext";
import * as XLSX from "xlsx";
import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { useTaskUpdate } from "../contexts/TaskUpdateContext";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

function getLeadersByLevel(person) {
  const map = {};

  if (Array.isArray(person?.leaders) && person.leaders.length > 0) {
    for (const l of person.leaders) {
      if (l?.level != null && l?.name) {
        map[`leader${l.level}`] = l.name;
      }
    }
    if (Object.keys(map).length > 0) return map;
  }

  for (const key of Object.keys(person || {})) {
    if (/^leader\d+$/.test(key) && person[key]) {
      map[key] = person[key];
    }
  }
  if (Object.keys(map).length > 0) return map;

  for (const key of Object.keys(person || {})) {
    const m = key.match(/^Leader @(\d+)$/);
    if (m && person[key]) {
      map[`leader${m[1]}`] = person[key];
    }
  }

  return map;
}

function getLeadersCombined(person) {
  return Object.values(getLeadersByLevel(person)).join(" ");
}

function buildSearchableText(person) {
  return [
    person.name || "", person.surname || "", person.email || "",
    person.phone || "", person.number || "", person.gender || "",
    person.cellGroup || "", person.zone || "", person.invitedBy || "",
    person.address || "", person.homeAddress || "", person.stage || "",
    getLeadersCombined(person),
  ].join(" ").toLowerCase();
}

function matchesSearch(person, searchTerms) {
  const text = buildSearchableText(person);
  return searchTerms.every((t) => text.includes(t));
}

const PRIORITY_PEOPLE = [
  { firstNameIncludes: ["vick", "vic", "vicky"], surnameIncludes: ["ensl"] },
  { firstNameIncludes: ["gav", "gavin", "gavyn"], surnameIncludes: ["ensl"] },
];

function isPriorityPerson(firstName, surname) {
  const fn = (firstName || "").toLowerCase();
  const sn = (surname || "").toLowerCase();
  return PRIORITY_PEOPLE.some(
    (p) =>
      p.surnameIncludes.some((s) => sn.includes(s)) &&
      p.firstNameIncludes.some((f) => fn.includes(f))
  );
}

function createLeaderSortComparator(leaderField, searchTerm = "") {
  return (a, b) => {
    const aVal = (a[leaderField] || "").toLowerCase();
    const bVal = (b[leaderField] || "").toLowerCase();

    if (leaderField === "leader1") {
      const aIsPriority = isPriorityPerson(a.name, a.surname);
      const bIsPriority = isPriorityPerson(b.name, b.surname);
      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;
      const aIsEnslin = aVal.includes("enslin");
      const bIsEnslin = bVal.includes("enslin");
      if (aIsEnslin && !bIsEnslin) return -1;
      if (!aIsEnslin && bIsEnslin) return 1;
      if (aIsEnslin && bIsEnslin) return aVal.localeCompare(bVal);
    }

    const searchLower = searchTerm.toLowerCase().trim();
    if (searchLower) {
      const words = searchLower.split(/\s+/).filter(Boolean);
      const aM = words.some((w) => aVal.includes(w));
      const bM = words.some((w) => bVal.includes(w));
      if (aM && !bM) return -1;
      if (!aM && bM) return 1;
    }

    const aHas = Boolean(aVal.trim());
    const bHas = Boolean(bVal.trim());
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return aVal.localeCompare(bVal);
  };
}

function normalisePerson(p) {
  const leaders = getLeadersByLevel(p);
  return {
    _id: p._id,
    name: p.Name || p.name || "",
    surname: p.Surname || p.surname || "",
    email: p.Email || p.email || "",
    phone: p.Number || p.phone || "",
    number: p.Number || p.number || "",
    gender: p.Gender || p.gender || "",
    address: p.Address || p.address || "",
    birthday: p.Birthday || p.birthday || "",
    dob: p.Birthday || p.dob || "",
    invitedBy: p.InvitedBy || p.invitedBy || "",
    stage: p.Stage || p.stage || "",
    fullName: p.FullName || p.fullName ||
      `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
    ...leaders,
    leaders: Array.isArray(p.leaders) ? p.leaders : [],
  };
}

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
  return buf;
}

const emptyForm = {
  name: "", surname: "", email: "", phone: "", number: "",
  gender: "", invitedBy: "", stage: "Win", dob: "", address: "",
};

function ServiceCheckIn() {
  const { authFetch } = React.useContext(AuthContext);
  const { notifyTaskUpdate } = useTaskUpdate();
  const { orgConfig, configLoaded } = useOrgConfig();
  const isActiveTeams = configLoaded && orgConfig?.org_id === "active-teams";

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
  const [sortModel, setSortModel] = useState([]);
  const [realTimeData, setRealTimeData] = useState(null);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
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
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, personId: null, personName: "" });
  const [eventHistoryModal, setEventHistoryModal] = useState({ open: false, event: null, type: null, data: [] });
  const [formData, setFormData] = useState(emptyForm);
  const [contextMenu, setContextMenu] = useState({ mouseX: null, mouseY: null, data: null, type: null });

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("xs"));
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.down("md"));
  const isLg = useMediaQuery(theme.breakpoints.down("lg"));
  const isDarkMode = theme.palette.mode === "dark";

  const rv = (xs, sm, md, lg, xl) => {
    if (isXs) return xs;
    if (isSm) return sm;
    if (isMd) return md;
    if (isLg) return lg;
    return xl;
  };

  const containerPadding = rv(0.5, 1, 2, 3, 3);
  const cardSpacing = rv(0.5, 1, 1.5, 2, 2);

  const attendeeMap = useMemo(() => {
    const map = new Map();
    attendees.forEach((a) => map.set(a._id, a));
    return map;
  }, [attendees]);

  const leaderLevels = useMemo(() => {
    const levels = new Set();
    for (const a of attendees) {
      if (Array.isArray(a.leaders)) {
        a.leaders.forEach((l) => {
          if (l?.level != null && l?.name) levels.add(l.level);
        });
      }
      Object.keys(a).forEach((k) => {
        const m = k.match(/^leader(\d+)$/);
        if (m && a[k]) levels.add(parseInt(m[1], 10));
      });
    }
    return [...levels].sort((a, b) => a - b);
  }, [attendees]);

  const fetchRealTimeEventData = useCallback(
    async (eventId) => {
      if (!eventId) return null;
      try {
        const res = await authFetch(
          `${BASE_URL}/service-checkin/real-time-data?event_id=${eventId}`,
          { method: "GET" }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.success ? data : null;
      } catch { return null; }
    },
    [authFetch]
  );

  const fetchEvents = useCallback(
    async (sharedPeopleList = null) => {
      try {
        const [evResponse, peopleResponse] = sharedPeopleList
          ? [await authFetch(`${BASE_URL}/events/eventsdata?limit=100&start_date=2024-10-10`), null]
          : await Promise.all([
            authFetch(`${BASE_URL}/events/eventsdata?limit=100&start_date=2024-10-10`),
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

        const mapEntry = (entry, type) => {
          const id = entry.id || entry._id || entry.person_id;
          const fp = findPerson(id, entry.email || entry.Email || entry.person_email);
          const fpLeaders = fp ? getLeadersByLevel(fp) : {};
          return {
            ...entry,
            name: entry.name || entry.Name || fp?.Name || "",
            surname: entry.surname || entry.Surname || fp?.Surname || "",
            email: entry.email || entry.Email || fp?.Email || "",
            phone: entry.phone || entry.Number || fp?.Number || "",
            ...fpLeaders,
            id: id || Math.random().toString(36),
            _id: id,
            ...(type === "new" && { isNew: true }),
          };
        };

        const transformedEvents = eventsData.map((event) => {
          try {
            if (!event) return null;
            const attendeesArray = Array.isArray(event.attendees) ? event.attendees : [];
            const newPeopleArray = Array.isArray(event.new_people) ? event.new_people : [];
            const consolidationsArray = Array.isArray(event.consolidations) ? event.consolidations : [];
            const attendanceData = attendeesArray.map((a) => mapEntry(a, "att"));
            const newPeopleData = newPeopleArray.map((np) => mapEntry(np, "new"));
            const consolidatedData = consolidationsArray.map((c) => {
              const id = c.person_id || c.id || c._id;
              const fp = findPerson(id, c.person_email || c.email);
              const fpLeaders = fp ? getLeadersByLevel(fp) : {};
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
                ...fpLeaders,
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
              attendees: attendeesArray, new_people: newPeopleArray, consolidations: consolidationsArray,
              total_attendance: typeof event.total_attendance === "number"
                ? event.total_attendance : attendanceData.length,
              attendance: attendanceData.length,
              newPeople: newPeopleData.length,
              consolidated: consolidatedData.length,
              attendanceData, newPeopleData, consolidatedData,
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
          if (["cells", "all cells", "cell", "training"].includes(typeName)) return false;
          if (isActiveTeams && event.isGlobal !== true) return false;
          return true;
        });
        setEvents(validEvents);
      } catch (err) {
        toast.error("Failed to fetch events. Please try again.");
      } finally {
        setIsLoadingEvents(false);
        setIsLoadingHistory(false);
      }
    },
    [authFetch, isActiveTeams]
  );

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!configLoaded) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      try {
        const [evResponse, peopleResponse] = await Promise.all([
          authFetch(`${BASE_URL}/events/eventsdata?limit=100&start_date=2024-10-10`),
          authFetch(`${BASE_URL}/cache/people`),
        ]);

        let rawPeople = [];
        if (peopleResponse.ok) {
          const pd = await peopleResponse.json();
          if (pd.success && pd.cached_data) {
            rawPeople = pd.cached_data;
            const normalised = rawPeople.map(normalisePerson);
            setAttendees(normalised);
            setHasDataLoaded(true);
            setIsLoadingPeople(false);
          }
        }

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
            const fpLeaders = fp ? getLeadersByLevel(fp) : {};
            return {
              ...entry,
              name: entry.name || entry.Name || fp?.Name || "",
              surname: entry.surname || entry.Surname || fp?.Surname || "",
              email: entry.email || entry.Email || fp?.Email || "",
              phone: entry.phone || entry.Number || fp?.Number || "",
              ...fpLeaders,
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
                const fpLeaders = fp ? getLeadersByLevel(fp) : {};
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
                  ...fpLeaders,
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
                attendees: attendeesArray, new_people: newPeopleArray, consolidations: consolidationsArray,
                total_attendance: typeof event.total_attendance === "number"
                  ? event.total_attendance : attendanceData.length,
                attendance: attendanceData.length,
                newPeople: newPeopleData.length,
                consolidated: consolidatedData.length,
                attendanceData, newPeopleData, consolidatedData,
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
            if (["cells", "all cells", "cell", "training"].includes(typeName)) return false;
            if (isActiveTeams && event.isGlobal !== true) return false;
            return true;
          });

          setEvents(validEvents);
          setIsLoadingEvents(false);
          setIsLoadingHistory(false);

          const todayStr = new Date().toISOString().split("T")[0];
          const todayOpen = validEvents.filter((e) => {
            const typeName = (e.eventType || "").toLowerCase();
            if (["cells", "all cells", "cell"].includes(typeName)) return false;
            if (isActiveTeams && e.isGlobal !== true) return false;
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
        setIsLoadingHistory(false);
      }
    })();
  }, [configLoaded]);

  useEffect(() => { if (!search.trim()) setSortModel([]); }, [search]);

  useEffect(() => {
    if (!currentEventId) { setRealTimeData(null); return; }
    let isMounted = true;
    const loadRT = async () => {
      const data = await fetchRealTimeEventData(currentEventId);
      if (data && isMounted) setRealTimeData(data);
    };
    loadRT();
    const rtInterval = setInterval(loadRT, 5000);
    const evInterval = setInterval(() => fetchEvents(), 30_000);
    return () => { isMounted = false; clearInterval(rtInterval); clearInterval(evInterval); };
  }, [currentEventId, fetchRealTimeEventData, fetchEvents]);

  const getFilteredEvents = useCallback((eventsList = events) => {
    const todayStr = new Date().toISOString().split("T")[0];
    return eventsList.filter((event) => {
      const typeName = (event.eventType || "").toLowerCase();
      if (["cells", "all cells", "cell"].includes(typeName)) return false;
      if (isActiveTeams && event.isGlobal !== true) return false;
      const status = event.status?.toLowerCase() || "";
      if (["complete", "closed", "cancelled", "did_not_meet"].includes(status)) return false;
      if (!event.date) return false;
      return new Date(event.date).toISOString().split("T")[0] === todayStr;
    });
  }, [events, isActiveTeams]);

  const getFilteredClosedEvents = useCallback(() => {
    const closed = events.filter((event) => {
      if (isActiveTeams && event.isGlobal !== true) return false;
      const typeName = (event.eventType || event.eventTypeName || "").toLowerCase();
      if (["cells", "all cells", "cell"].includes(typeName)) return false;
      const status = (event.status || "").toLowerCase();
      if (status !== "closed" && status !== "complete") return false;
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
  }, [events, eventSearch, isActiveTeams]);

  const menuEvents = useMemo(() => {
    const filtered = getFilteredEvents();
    const list = [...filtered];
    if (currentEventId && !list.some((ev) => ev.id === currentEventId)) {
      const cur = events.find((ev) => ev.id === currentEventId);
      if (cur) list.unshift(cur);
    }
    return list;
  }, [events, currentEventId, getFilteredEvents]);

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

  const filteredAttendees = useMemo(() => {
    if (!search.trim()) return attendeesWithStatus;
    const terms = search.toLowerCase().trim().split(/\s+/);
    const filtered = attendeesWithStatus.filter((p) => matchesSearch(p, terms));
    return [...filtered].sort((a, b) => {
      const sa = isPriorityPerson(a.name, a.surname) ? 1 : 0;
      const sb = isPriorityPerson(b.name, b.surname) ? 1 : 0;
      if (sa !== sb) return sb - sa;
      return `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`);
    });
  }, [attendeesWithStatus, search]);

  const sortedFilteredAttendees = useMemo(() => {
    const result = [...filteredAttendees];
    if (sortModel?.length > 0) {
      const { field, sort } = sortModel[0];
      if (field.startsWith("leader")) {
        const comparator = createLeaderSortComparator(field, search);
        result.sort((a, b) => { const cmp = comparator(a, b); return sort === "desc" ? -cmp : cmp; });
      } else if (field && field !== "actions") {
        result.sort((a, b) => {
          const cmp = (a[field] || "").toString().toLowerCase()
            .localeCompare((b[field] || "").toString().toLowerCase());
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

    if (result.length > 0) {
    console.log('📊 DataGrid rows sample:', result.slice(0, 2).map(row => ({
      _id: row._id,
      name: row.name,
      surname: row.surname,
      dob: row.dob,
      birthday: row.birthday,
      invitedBy: row.invitedBy,
      leader1: row.leader1
    })));
  }

    return result;
  }, [filteredAttendees, sortModel]);

  const enrichFromMap = useCallback((entry) => {
    const fp = attendeeMap.get(entry.id || entry._id) || {};
    const fpLeaders = getLeadersByLevel(fp);
    return {
      ...entry, ...fp,
      name: fp.name || entry.name || "",
      surname: fp.surname || entry.surname || "",
      email: fp.email || entry.email || "",
      phone: fp.phone || fp.number || entry.phone || "",
      number: fp.number || fp.phone || entry.number || "",
      ...fpLeaders,
      id: entry.id || entry._id,
      _id: entry.id || entry._id,
    };
  }, [attendeeMap]);

  const modalFilteredAttendees = useMemo(() => {
    const full = (realTimeData?.present_attendees || []).map(enrichFromMap);
    const sorted = [...full].sort((a, b) =>
      `${a.name} ${a.surname}`.toLowerCase().localeCompare(`${b.name} ${b.surname}`.toLowerCase())
    );
    if (!modalSearch.trim()) return sorted;
    const terms = modalSearch.toLowerCase().trim().split(/\s+/);
    return sorted.filter((p) => matchesSearch(p, terms));
  }, [realTimeData, enrichFromMap, modalSearch]);

  const modalPaginatedAttendees = useMemo(
    () => modalFilteredAttendees.slice(
      modalPage * modalRowsPerPage,
      modalPage * modalRowsPerPage + modalRowsPerPage
    ),
    [modalFilteredAttendees, modalPage, modalRowsPerPage]
  );

  const newPeopleFilteredList = useMemo(() => {
    const full = (realTimeData?.new_people || []).map(enrichFromMap);
    const sorted = [...full].sort((a, b) =>
      `${a.name} ${a.surname}`.toLowerCase().localeCompare(`${b.name} ${b.surname}`.toLowerCase())
    );
    if (!newPeopleSearch.trim()) return sorted;
    const terms = newPeopleSearch.toLowerCase().trim().split(/\s+/);
    return sorted.filter((p) => matchesSearch(p, terms));
  }, [realTimeData, enrichFromMap, newPeopleSearch]);

  const newPeoplePaginatedList = useMemo(
    () => newPeopleFilteredList.slice(
      newPeoplePage * newPeopleRowsPerPage,
      newPeoplePage * newPeopleRowsPerPage + newPeopleRowsPerPage
    ),
    [newPeopleFilteredList, newPeoplePage, newPeopleRowsPerPage]
  );

  const filteredConsolidatedPeople = useMemo(() => {
    const full = (realTimeData?.consolidations || []).map((cons) => {
      const fp = attendeeMap.get(cons.person_id) ||
        attendees.find((a) =>
          a.name === (cons.person_name || cons.name) &&
          a.surname === (cons.person_surname || cons.surname)
        ) || {};
      return {
        ...cons, ...fp,
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
      `${a.person_name} ${a.person_surname}`.toLowerCase()
        .localeCompare(`${b.person_name} ${b.person_surname}`.toLowerCase())
    );
    if (!consolidatedSearch.trim()) return sorted;
    const terms = consolidatedSearch.toLowerCase().trim().split(/\s+/);
    return sorted.filter((p) => matchesSearch(p, terms));
  }, [realTimeData, attendeeMap, attendees, consolidatedSearch]);

  const consolidatedPaginatedList = useMemo(
    () => filteredConsolidatedPeople.slice(
      consolidatedPage * consolidatedRowsPerPage,
      consolidatedPage * consolidatedRowsPerPage + consolidatedRowsPerPage
    ),
    [filteredConsolidatedPeople, consolidatedPage, consolidatedRowsPerPage]
  );

  const presentCount = realTimeData?.present_attendees?.length ?? 0;
  const newPeopleCount = realTimeData?.new_people_count ?? 0;
  const consolidationCount = realTimeData?.consolidation_count ?? 0;

  const handleFullRefresh = useCallback(async () => {
    if (!currentEventId) { toast.error("Please select an event first"); return; }
    setIsRefreshing(true);
    setOpenDialog(false); setEditingPerson(null); setFormData(emptyForm); setSearch("");
    try {
      await authFetch(`${BASE_URL}/cache/people/refresh`, { method: "POST" });
      const [data, cacheResponse] = await Promise.all([
        fetchRealTimeEventData(currentEventId),
        authFetch(`${BASE_URL}/cache/people`),
      ]);
      if (data) setRealTimeData(data);
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        if (cacheData.success && cacheData.cached_data)
          setAttendees(cacheData.cached_data.map(normalisePerson));
      }
      toast.success("Refresh complete!");
    } catch { toast.error("Failed to refresh data from database"); }
    finally { setIsRefreshing(false); }
  }, [currentEventId, authFetch, fetchRealTimeEventData]);

  const handleRemoveConsolidation = useCallback(async (consolidation) => {
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
        } else { toast.success(result.message || "Consolidation removed successfully"); }
        const freshData = await fetchRealTimeEventData(currentEventId);
        if (freshData) setRealTimeData(freshData);
      }
    } catch { toast.error("Failed to remove. Please try again."); }
    finally { setIsDeleting(false); }
  }, [currentEventId, authFetch, fetchRealTimeEventData, notifyTaskUpdate]);

  const handleContextMenu = useCallback((event, person, type) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX - 2, mouseY: event.clientY - 4, data: person, type });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ mouseX: null, mouseY: null, data: null, type: null });
  }, []);

  const handleToggleCheckIn = useCallback(async (attendee) => {
    if (!currentEventId) { toast.error("Please select an event"); return; }
    if (checkInLoading.has(attendee._id)) return;
    setCheckInLoading((prev) => new Set(prev).add(attendee._id));
    const fullName = `${attendee.name} ${attendee.surname}`.trim();
    const isCurrentlyPresent = presentIds.has(attendee._id);
    const personId = attendee._id;
    const optimisticEntry = {
      id: personId, _id: personId,
      name: attendee.name, surname: attendee.surname,
      email: attendee.email, phone: attendee.phone || attendee.number || "",
    };

    setRealTimeData((prev) => {
      if (!prev) return prev;
      if (!isCurrentlyPresent) {
        const alreadyThere = (prev.present_attendees || []).some((a) => a.id === personId || a._id === personId);
        if (alreadyThere) return prev;
        return { ...prev, present_attendees: [...(prev.present_attendees || []), optimisticEntry], present_count: (prev.present_count || 0) + 1 };
      } else {
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
            person_data: { id: personId, name: attendee.name, fullName, email: attendee.email, phone: attendee.phone, number: attendee.number },
            type: "attendee",
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) { toast.success(`${fullName} checked in`); success = true; }
          else if (data.message?.includes("already checked in")) { toast.warning(`${fullName} is already checked in`); success = true; }
        }
      } else {
        const response = await authFetch(`${BASE_URL}/service-checkin/remove`, {
          method: "DELETE",
          body: JSON.stringify({ event_id: currentEventId, person_id: personId, type: "attendees" }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) { toast.info(`${fullName} removed from check-in`); success = true; }
        }
      }
      if (!success) {
        setRealTimeData((prev) => {
          if (!prev) return prev;
          if (!isCurrentlyPresent) {
            const filtered = (prev.present_attendees || []).filter((a) => a.id !== personId && a._id !== personId);
            return { ...prev, present_attendees: filtered, present_count: filtered.length };
          } else {
            return { ...prev, present_attendees: [...(prev.present_attendees || []), optimisticEntry], present_count: (prev.present_count || 0) + 1 };
          }
        });
        toast.error(`Failed to update check-in for ${fullName}`);
      }
      fetchRealTimeEventData(currentEventId).then((freshData) => { if (freshData) setRealTimeData(freshData); });
    } catch (err) {
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
  }, [currentEventId, checkInLoading, presentIds, authFetch, fetchRealTimeEventData]);


  const handlePersonSave = useCallback(async (responseData) => {
    if (!currentEventId) { toast.error("Please select an event first before adding people"); return; }
    try {

      if (editingPerson) {
        const { __updatedNewPerson, ...normalizedUpdate } = responseData;
        const personId = editingPerson._id;

        let updatedLeaders = {};
        let updatedLeadersArray = [];
        try {
          const freshRes = await authFetch(`${BASE_URL}/people/${personId}`);
          if (freshRes.ok) {
            const freshPerson = await freshRes.json();
            updatedLeadersArray = freshPerson.leaders || [];
            updatedLeadersArray.forEach((l) => {
              if (l?.level != null && l?.name) updatedLeaders[`leader${l.level}`] = l.name;
            });
            Object.keys(freshPerson).forEach((k) => {
              if (/^leader\d+$/.test(k) && freshPerson[k] && !updatedLeaders[k])
                updatedLeaders[k] = freshPerson[k];
            });
          }
        } catch {
          updatedLeaders = getLeadersByLevel(normalizedUpdate);
          updatedLeadersArray = normalizedUpdate.leaders || [];
        }

        toast.success(`${normalizedUpdate.name} ${normalizedUpdate.surname} updated successfully`);

        setAttendees((prev) => prev.map((p) =>
          p._id === personId
            ? { ...p, ...normalizedUpdate, ...updatedLeaders, leaders: updatedLeadersArray, _id: personId, id: personId }
            : p
        ));

        setRealTimeData((prev) => {
          if (!prev) return prev;
          const patch = (list) => (list || []).map((entry) =>
            entry.id === personId || entry._id === personId
              ? {
                ...entry, ...normalizedUpdate, ...updatedLeaders, leaders: updatedLeadersArray,
                id: personId, _id: personId,
                person_name: normalizedUpdate.name,
                person_surname: normalizedUpdate.surname,
                person_email: normalizedUpdate.email,
                person_phone: normalizedUpdate.phone || normalizedUpdate.number,
              }
              : entry
          );
          return { ...prev, new_people: patch(prev.new_people), present_attendees: patch(prev.present_attendees) };
        });

        setOpenDialog(false); setEditingPerson(null); setFormData(emptyForm);
        fetchRealTimeEventData(currentEventId).then((d) => { if (d) setRealTimeData(d); });
        authFetch(`${BASE_URL}/cache/people/refresh`, { method: "POST" }).catch(() => { });
        return;
      }

      const newPersonData = responseData.person || responseData;
      const newPersonId = newPersonData._id;
      const fullName = `${formData.name} ${formData.surname}`.trim();

      let resolvedLeadersArray = [];
      let resolvedLeaders = {};

      try {
        const fullPersonRes = await authFetch(`${BASE_URL}/people/${newPersonId}`);
        if (fullPersonRes.ok) {
          const fullPerson = await fullPersonRes.json();
          resolvedLeadersArray = fullPerson.leaders || [];
          resolvedLeadersArray.forEach((l) => {
            if (l?.level != null && l?.name) resolvedLeaders[`leader${l.level}`] = l.name;
          });
          Object.keys(fullPerson).forEach((k) => {
            if (/^leader\d+$/.test(k) && fullPerson[k] && !resolvedLeaders[k])
              resolvedLeaders[k] = fullPerson[k];
          });
        }
      } catch {
        console.warn("Could not fetch full person after creation — will build from inviter");
      }

      if (resolvedLeadersArray.length <= 1 && formData.invitedBy) {
        const inviterName = formData.invitedBy.trim().toLowerCase();

        const inviter = attendees.find((a) =>
          `${a.name} ${a.surname}`.trim().toLowerCase() === inviterName ||
          a.name.trim().toLowerCase() === inviterName
        );

        if (inviter) {
          const inviterLevelMap = {};

          if (Array.isArray(inviter.leaders)) {
            inviter.leaders.forEach((l) => {
              if (l?.level != null && l?.name) inviterLevelMap[l.level] = l.name;
            });
          }
          Object.keys(inviter).forEach((k) => {
            const m = k.match(/^leader(\d+)$/);
            if (m && inviter[k] && !inviterLevelMap[parseInt(m[1])])
              inviterLevelMap[parseInt(m[1])] = inviter[k];
          });

          const inviterFullName = `${inviter.name} ${inviter.surname}`.trim();
          const sortedLevels = Object.keys(inviterLevelMap).map(Number).sort((a, b) => a - b);

          resolvedLeaders = {};
          resolvedLeadersArray = [];

          sortedLevels.forEach((lvl) => {
            resolvedLeaders[`leader${lvl}`] = inviterLevelMap[lvl];
            resolvedLeadersArray.push({ level: lvl, name: inviterLevelMap[lvl], id: "" });
          });

          const highestLevel = sortedLevels.length > 0 ? sortedLevels[sortedLevels.length - 1] : 0;
          const nextLevel =
            highestLevel === 0 ? 12 :
              highestLevel === 1 ? 12 :
                highestLevel === 12 ? 144 :
                  highestLevel === 144 ? 1728 :
                    highestLevel * 12;

          resolvedLeaders[`leader${nextLevel}`] = inviterFullName;
          resolvedLeadersArray.push({ level: nextLevel, name: inviterFullName, id: inviter._id || "" });

          console.log("=== BUILT FROM INVITER ===", {
            inviter: inviterFullName,
            inviterLevels: inviterLevelMap,
            newPersonChain: resolvedLeaders,
          });
        }
      }

      const checkinResponse = await authFetch(`${BASE_URL}/service-checkin/checkin`, {
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

      if (!checkinResponse.ok) {
        toast.error("Failed to check in new person to event");
        return;
      }

      const checkinData = await checkinResponse.json();
      if (!checkinData.success) {
        toast.error(checkinData.message || "Check-in failed");
        return;
      }

      toast.success(`${fullName} added as new person successfully`);
      setOpenDialog(false); setEditingPerson(null); setFormData(emptyForm); setSearch("");

      const newPersonForGrid = normalisePerson({
        _id: newPersonData._id,
        Name: newPersonData.Name || formData.name,
        Surname: newPersonData.Surname || formData.surname,
        Email: newPersonData.Email || formData.email,
        Number: newPersonData.Number || formData.number,
        Gender: newPersonData.Gender || formData.gender,
        InvitedBy: newPersonData.InvitedBy || formData.invitedBy,
        Stage: "First Time",
        Birthday: "",
        Address: "",
        leaders: resolvedLeadersArray,
        ...resolvedLeaders,
      });

      newPersonForGrid.isNew = true;
      newPersonForGrid.present = false;
      newPersonForGrid.fullName = fullName;
      Object.assign(newPersonForGrid, resolvedLeaders);

      setAttendees((prev) => [newPersonForGrid, ...prev]);

      authFetch(`${BASE_URL}/cache/people/refresh`, { method: "POST" })
        .then(() => authFetch(`${BASE_URL}/cache/people`))
        .then((r) => r.json())
        .then((cacheData) => {
          if (!cacheData.success || !cacheData.cached_data) return;
          const normalised = cacheData.cached_data.map(normalisePerson);
          const freshEntry = normalised.find((p) => p._id === newPersonId);
          if (!freshEntry) return;
          const freshLeaders = getLeadersByLevel(freshEntry);
          setAttendees((prev) => prev.map((p) =>
            p._id === newPersonId
              ? { ...p, ...freshLeaders, leaders: freshEntry.leaders }
              : p
          ));
        })
        .catch(() => { });

      const freshData = await fetchRealTimeEventData(currentEventId);
      if (freshData) setRealTimeData(freshData);

    } catch (error) {
      toast.error(error.message || "Failed to save person");
    }
  }, [currentEventId, editingPerson, formData, attendees, authFetch, fetchRealTimeEventData]);

  const handleFinishConsolidation = useCallback(async (task) => {
    if (!currentEventId) return;
    const fullName = task.recipientName || `${task.person_name || ""} ${task.person_surname || ""}`.trim() || "Unknown Person";
    setConsolidationOpen(false);
    toast.success(`${fullName} consolidated successfully`);
    const freshData = await fetchRealTimeEventData(currentEventId);
    if (freshData) setRealTimeData(freshData);
    notifyTaskUpdate?.();
    window.dispatchEvent(new CustomEvent("taskUpdated", { detail: { action: "consolidationCreated", task } }));
  }, [currentEventId, fetchRealTimeEventData, notifyTaskUpdate]);

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
      setEvents((prev) => {
        const updated = prev.map((e) =>
          e.id === currentEventId ? { ...e, status: "complete", closed_by: result.closed_by, closed_at: result.closed_at } : e
        );
        const todayStr = new Date().toISOString().split("T")[0];
        const nextEvent = updated.find((e) => {
          if (e.id === currentEventId) return false;
          if (isActiveTeams && e.isGlobal !== true) return false;
          const typeName = (e.eventType || "").toLowerCase();
          if (["cells", "all cells", "cell"].includes(typeName)) return false;
          const status = (e.status || "").toLowerCase();
          if (["complete", "closed", "cancelled", "did_not_meet"].includes(status)) return false;
          if (!e.date) return false;
          return new Date(e.date).toISOString().split("T")[0] === todayStr;
        });
        setCurrentEventId(nextEvent?.id || "");
        return updated;
      });
      setRealTimeData(null);
      setTimeout(() => fetchEvents(null), 500);
    } catch (error) {
      if (error.message.includes("404")) toast.error("Event not found.");
      else if (error.message.includes("400")) toast.error("Invalid event ID.");
      else toast.error("Failed to close event. Please try again.");
    } finally { setIsClosingEvent(false); }
  }, [currentEventId, events, authFetch, fetchEvents, isActiveTeams]);

  const handleUnsaveEvent = useCallback(async (event) => {
    try {
      const response = await authFetch(`${BASE_URL}/events/${event.id || event._id}/toggle-status`, { method: "PATCH" });
      if (!response.ok) { const e = await response.json(); throw new Error(e.detail || "HTTP error"); }
      toast.success(`Event "${event.eventName}" has been reopened!`);
      setIsLoadingHistory(true); setIsLoadingEvents(true);
      await fetchEvents();
      setCurrentEventId(event.id || event._id);
    } catch (error) { toast.error(error.message || "Failed to reopen event"); }
  }, [authFetch, fetchEvents]);

  const handleConsolidationClick = useCallback(() => {
    if (!currentEventId) { toast.error("Please select an event first"); return; }
    setConsolidationOpen(true);
  }, [currentEventId]);

const handleEditClick = useCallback((person) => {
  console.log('🔍 EDITING PERSON - FULL DATA:', person);
  console.log('📅 Date fields:', {
    dob: person.dob,
    birthday: person.birthday,
    dateOfBirth: person.dateOfBirth,
    BirthDay: person.BirthDay,
    Birthday: person.Birthday
  });
  console.log('👥 Leader fields:', {
    invitedBy: person.invitedBy,
    leader1: person.leader1,
    leader12: person.leader12,
    leader144: person.leader144
  });
  
  // Extract all leader fields from the person object
  const leaderFields = {};
  Object.keys(person).forEach(key => {
    if (key.startsWith('leader')) {
      leaderFields[key] = person[key];
    }
  });
  
  // Get the date - try multiple possible field names
  let dateValue = "";
  if (person.dob) dateValue = person.dob;
  else if (person.birthday) dateValue = person.birthday;
  else if (person.dateOfBirth) dateValue = person.dateOfBirth;
  else if (person.Birthday) dateValue = person.Birthday;
  
  console.log('📅 Selected date value:', dateValue);
  
  setEditingPerson(person);
  setFormData({
    name: person.name || "",
    surname: person.surname || "",
    dob: dateValue,
    address: person.homeAddress || person.address || "",
    email: person.email || "",
    number: person.phone || person.Number || person.number || "",
    phone: person.phone || person.Number || person.number || "",
    gender: person.gender || "",
    invitedBy: person.invitedBy || "",
    stage: person.stage || "Win",
    ...leaderFields,
  });
  setOpenDialog(true);
}, []);

  const handleDelete = useCallback(async (personId, personName) => {
    setIsDeleting(true);
    try {
      const res = await authFetch(`${BASE_URL}/people/${personId}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); toast.error(`Delete failed: ${e.detail}`); return; }
      setAttendees((prev) => prev.filter((p) => p._id !== personId && p.id !== personId));
      setRealTimeData((prev) => {
        if (!prev) return prev;
        const filterFn = (a) => a.id !== personId && a._id !== personId;
        const newPresent = (prev.present_attendees || []).filter(filterFn);
        const newPeople = (prev.new_people || []).filter(filterFn);
        return { ...prev, present_attendees: newPresent, new_people: newPeople, present_count: newPresent.length, new_people_count: newPeople.length };
      });
      try { await authFetch(`${BASE_URL}/cache/people/refresh`, { method: "POST" }); } catch { }
      toast.success(`"${personName}" deleted successfully`);
    } catch { toast.error("An error occurred while deleting the person"); }
    finally { setIsDeleting(false); setDeleteConfirmation({ open: false, personId: null, personName: "" }); }
  }, [authFetch]);

  const handleRemoveNewPerson = useCallback(async (person) => {
    if (!currentEventId) { toast.error("Please select an event first"); return; }
    try {
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
  }, [currentEventId, authFetch, fetchRealTimeEventData]);

  const exportToExcel = useCallback((data, filename = "export") => {
    if (!data?.length) { toast.error("No data to export"); return; }
    const leaderHeaders = [...new Set(data.flatMap((r) => Object.keys(r).filter((k) => /^leader\d+$/.test(k))))];
    leaderHeaders.sort((a, b) => parseInt(a.replace("leader", ""), 10) - parseInt(b.replace("leader", ""), 10));
    const displayHeaders = leaderHeaders.map((k) => `Leader @${k.replace("leader", "")}`);
    const headers = ["Name", "Surname", "Email", "Phone", ...displayHeaders, "CheckIn_Time", "Status"];
    const worksheetData = data.map((row) => {
      const o = { Name: row.name || "", Surname: row.surname || "", Email: row.email || "", Phone: row.phone || "" };
      leaderHeaders.forEach((k, i) => { o[displayHeaders[i]] = row[k] || ""; });
      o["CheckIn_Time"] = row.time || "";
      o["Status"] = row.Status || "Present";
      return o;
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
      link.href = url; link.download = `${filename}_${today}.xlsx`; link.style.display = "none";
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} records`);
    } catch { toast.error("Failed to create Excel file"); }
  }, []);

  const handleAddPersonClick = useCallback(() => {
    if (!currentEventId) { toast.error("Please select an event first before adding people"); return; }
    setEditingPerson(null); setFormData(emptyForm); setOpenDialog(true);
  }, [currentEventId]);

  const handleViewEventDetails = useCallback((event, data) => { setEventHistoryModal({ open: true, event, type: "attendance", data: data || [] }); }, []);
  const handleViewNewPeople = useCallback((event, data) => { setEventHistoryModal({ open: true, event, type: "newPeople", data: data || [] }); }, []);
  const handleViewConsolidated = useCallback((event, data) => { setEventHistoryModal({ open: true, event, type: "consolidated", data: data || [] }); }, []);

  const leaderColumns = useMemo(() => leaderLevels.map((level) => ({
    field: `leader${level}`,
    headerName: isSm ? `L@${level}` : `Leader @${level}`,
    flex: 0.55,
    minWidth: isSm ? 44 : 88,
    sortable: true,
    renderCell: (params) => (
      <Typography variant="body2" noWrap sx={{ fontSize: isSm ? "0.65rem" : "0.85rem" }}>
        {params.row[`leader${level}`] || "—"}
      </Typography>
    ),
  })), [leaderLevels, isSm]);

  const mainColumns = useMemo(() => [
    {
      field: "name", headerName: "Name", flex: 1, minWidth: isSm ? 110 : 140, sortable: true,
      renderCell: (params) => {
        const isFirstTime = params.row.stage === "First Time" || params.row.isNew === true;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, width: "100%", overflow: "hidden" }}>
            {isFirstTime && (
              <Chip label="New" size="small" color="success" variant="filled"
                sx={{ fontSize: "0.5rem", height: 13, flexShrink: 0, px: "2px", "& .MuiChip-label": { px: "3px" } }} />
            )}
            <Typography variant="body2" noWrap sx={{ fontSize: isSm ? "0.72rem" : "0.88rem", lineHeight: 1.2 }}>
              {params.row.name} {params.row.surname}
            </Typography>
          </Box>
        );
      },
    },
    ...(!isSm ? [{
      field: "phone", headerName: "Phone", flex: 0.7, minWidth: 100, sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" noWrap sx={{ fontSize: "0.85rem" }}>{params.row.number || "—"}</Typography>
      ),
    }] : []),
    ...(!isMd ? [{
      field: "email", headerName: "Email", flex: 1, minWidth: 130, sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" noWrap sx={{ fontSize: "0.85rem" }}>{params.row.email || "—"}</Typography>
      ),
    }] : []),
    ...leaderColumns,
    {
      field: "actions", headerName: "", width: isSm ? 96 : 120, sortable: false, filterable: false,
      renderCell: (params) => {
        const fullName = `${params.row.name || ""} ${params.row.surname || ""}`.trim();
        const isDisabled = !currentEventId;
        const isCheckInLoading = checkInLoading.has(params.row._id);
        const btnSz = isSm ? "small" : "medium";
        const iconSz = isSm ? "16px" : "22px";
        const pad = isSm ? "3px" : "6px";
        return (
          <Stack direction="row" spacing={0} sx={{ alignItems: "center" }}>
            <Tooltip title={isDisabled ? "Select event first" : "Delete"}>
              <span>
                <IconButton size={btnSz} color={isDisabled ? "default" : "error"}
                  onClick={() => !isDisabled && setDeleteConfirmation({ open: true, personId: params.row._id, personName: fullName })}
                  disabled={isDisabled || isCheckInLoading} sx={{ p: pad, opacity: isDisabled || isCheckInLoading ? 0.4 : 1 }}>
                  <DeleteIcon sx={{ fontSize: iconSz }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isDisabled ? "Select event first" : "Edit"}>
              <span>
                <IconButton size={btnSz} color={isDisabled ? "default" : "primary"}
                  onClick={() => !isDisabled && handleEditClick(params.row)}
                  disabled={isDisabled || isCheckInLoading} sx={{ p: pad, opacity: isDisabled || isCheckInLoading ? 0.4 : 1 }}>
                  <EditIcon sx={{ fontSize: iconSz }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isDisabled ? "Select event first" : isCheckInLoading ? "Processing…" : params.row.present ? "Checked in" : "Check in"}>
              <span>
                <IconButton size={btnSz} color={isDisabled ? "default" : "success"}
                  disabled={isDisabled || isCheckInLoading}
                  onClick={() => !isDisabled && !isCheckInLoading && handleToggleCheckIn(params.row)}
                  sx={{ p: pad, opacity: isDisabled || isCheckInLoading ? 0.4 : 1 }}>
                  {params.row.present
                    ? <CheckCircleIcon sx={{ fontSize: iconSz }} />
                    : <CheckCircleOutlineIcon sx={{ fontSize: iconSz }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    },
  ], [isSm, isMd, leaderColumns, currentEventId, checkInLoading, handleEditClick, handleToggleCheckIn]);

  const StatsCard = useCallback(({ title, count, icon, color = "primary", onClick, disabled = false }) => (
    <Paper variant="outlined" onClick={onClick} sx={{
      p: rv(1, 1.2, 1.8, 2, 2), textAlign: "center", cursor: disabled ? "default" : "pointer",
      boxShadow: 2, minHeight: rv(64, 72, 80, 88, 88), display: "flex", flexDirection: "column", justifyContent: "center",
      "&:hover": disabled ? {} : { boxShadow: 4, transform: "translateY(-2px)" }, transition: "all 0.2s",
      opacity: disabled ? 0.6 : 1, backgroundColor: "background.paper",
    }}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.8} mb={0.3}>
        {React.cloneElement(icon, { color: disabled ? "disabled" : color, sx: { fontSize: rv(18, 20, 24, 26, 26) } })}
        <Typography fontWeight={700} color={disabled ? "text.disabled" : `${color}.main`}
          sx={{ fontSize: rv("1rem", "1.1rem", "1.25rem", "1.4rem", "1.4rem"), lineHeight: 1 }}>
          {count}
        </Typography>
      </Stack>
      <Typography color={disabled ? "text.disabled" : `${color}.main`}
        sx={{ fontSize: rv("0.65rem", "0.72rem", "0.82rem", "0.9rem", "0.9rem") }}>
        {title}
        {disabled && (
          <Typography component="span" display="block" sx={{ fontSize: "0.58rem", color: "text.disabled" }}>
            Select event
          </Typography>
        )}
      </Typography>
    </Paper>
  ), [rv]);

  const gridHeight = isSm ? "calc(100vh - 340px)" : isMd ? "calc(100vh - 300px)" : 620;
  const gridMinHeight = isSm ? 380 : isMd ? 450 : 550;

  return (
    <Box p={containerPadding} sx={{ width: "100%", margin: "0 auto", mt: 6, minHeight: "100vh", maxWidth: "100vw", overflowX: "hidden" }}>
      <ToastContainer position={isSm ? "top-center" : "top-right"} autoClose={3000} hideProgressBar={isSm}
        style={{ marginTop: isSm ? "0px" : "20px", zIndex: 9999 }} />

      <DeleteConfirmationModal
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, personId: null, personName: "" })}
        onConfirm={() => handleDelete(deleteConfirmation.personId, deleteConfirmation.personName)}
        personName={deleteConfirmation.personName} isLoading={isDeleting}
      />

      {/* Stats row */}
      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        <Grid item xs={4}>
          <StatsCard title="Present" count={presentCount} icon={<GroupIcon />} color="primary"
            onClick={() => { if (currentEventId) { setModalOpen(true); setModalSearch(""); setModalPage(0); } }}
            disabled={!currentEventId} />
        </Grid>
        <Grid item xs={4}>
          <StatsCard title="New People" count={newPeopleCount} icon={<PersonAddAltIcon />} color="success"
            onClick={() => { if (currentEventId) { setNewPeopleModalOpen(true); setNewPeopleSearch(""); setNewPeoplePage(0); } }}
            disabled={!currentEventId} />
        </Grid>
        <Grid item xs={4}>
          <StatsCard title="Consolidated" count={consolidationCount} icon={<MergeIcon />} color="secondary"
            onClick={() => { if (currentEventId) { setConsolidatedModalOpen(true); setConsolidatedSearch(""); setConsolidatedPage(0); } }}
            disabled={!currentEventId} />
        </Grid>
      </Grid>

      {/* Controls row */}
      <Box mb={cardSpacing}>
        <Grid container spacing={1} mb={1} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <Select size="small" value={currentEventId} onChange={(e) => setCurrentEventId(e.target.value)}
              displayEmpty fullWidth sx={{ boxShadow: 1, fontSize: isSm ? "0.8rem" : "0.9rem" }}>
              <MenuItem value="">
                <Typography color="text.secondary" sx={{ fontSize: "inherit" }}>
                  {isLoadingEvents ? "Loading events…" : "Select Global Event"}
                </Typography>
              </MenuItem>
              {menuEvents.map((ev) => (
                <MenuItem key={ev.id} value={ev.id}>
                  <Typography variant="body2" fontWeight="medium" noWrap>{ev.eventName}</Typography>
                </MenuItem>
              ))}
              {menuEvents.length === 0 && events.length > 0 && (
                <MenuItem disabled><Typography variant="body2" color="text.secondary" fontStyle="italic">No open global events</Typography></MenuItem>
              )}
              {events.length === 0 && !isLoadingEvents && (
                <MenuItem disabled><Typography variant="body2" color="text.secondary" fontStyle="italic">No events available</Typography></MenuItem>
              )}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {activeTab === 0
              ? <TextField size="small" placeholder="Search attendees…" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }} fullWidth sx={{ boxShadow: 1 }} />
              : <TextField size="small" placeholder="Search events…" value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)} fullWidth sx={{ boxShadow: 1 }} />}
          </Grid>
          {!isMd && (
            <Grid item md={3}>
              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                <ActionButtons currentEventId={currentEventId} isDarkMode={isDarkMode} isSm={isSm}
                  isClosingEvent={isClosingEvent} isRefreshing={isRefreshing}
                  handleAddPersonClick={handleAddPersonClick} handleConsolidationClick={handleConsolidationClick}
                  handleSaveAndCloseEvent={handleSaveAndCloseEvent} handleFullRefresh={handleFullRefresh} theme={theme} />
              </Stack>
            </Grid>
          )}
        </Grid>
        {isMd && (
          <Stack direction="row" spacing={isSm ? 0.5 : 1} justifyContent="flex-start" alignItems="center" flexWrap="wrap" gap={0.5}>
            <ActionButtons currentEventId={currentEventId} isDarkMode={isDarkMode} isSm={isSm}
              isClosingEvent={isClosingEvent} isRefreshing={isRefreshing}
              handleAddPersonClick={handleAddPersonClick} handleConsolidationClick={handleConsolidationClick}
              handleSaveAndCloseEvent={handleSaveAndCloseEvent} handleFullRefresh={handleFullRefresh} theme={theme} />
          </Stack>
        )}
      </Box>

      {/* Tabs + grid */}
      <Box sx={{ width: "100%" }}>
        <Paper variant="outlined" sx={{ mb: 1.5, boxShadow: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{
            borderBottom: 1, borderColor: "divider", minHeight: "38px",
            "& .MuiTab-root": { py: 0.5, minHeight: "38px", fontSize: rv("0.7rem", "0.78rem", "0.85rem", "0.9rem", "0.9rem") },
          }}>
            <Tab label="All Attendees" />
            <Tab label="Event History" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Paper variant="outlined" sx={{ boxShadow: 3, overflow: "hidden", width: "100%", height: gridHeight, minHeight: gridMinHeight }}>
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
              slotProps={{ toolbar: { showQuickFilter: !isSm, quickFilterProps: { debounceMs: 500 } } }}
              disableRowSelectionOnClick
              sortModel={sortModel}
              onSortModelChange={(model) => { setPage(0); setSortModel(model); }}
              getRowId={(row) => row._id}
              rowHeight={isSm ? 44 : 52}
              columnHeaderHeight={isSm ? 40 : 48}
              sx={{
                width: "100%", height: "100%",
                "& .MuiDataGrid-cell": { display: "flex", alignItems: "center", px: isSm ? "4px" : "8px", fontSize: isSm ? "0.72rem" : "0.85rem", py: "2px" },
                "& .MuiDataGrid-columnHeaders": { backgroundColor: theme.palette.action.hover, borderBottom: `1px solid ${theme.palette.divider}` },
                "& .MuiDataGrid-columnHeader": { fontWeight: 700, fontSize: isSm ? "0.7rem" : "0.82rem", px: isSm ? "4px" : "8px", "& .MuiDataGrid-iconButtonContainer": { visibility: "visible !important" }, "& .MuiDataGrid-sortIcon": { opacity: 1 } },
                "& .MuiDataGrid-row:hover": { backgroundColor: theme.palette.action.hover },
                "& .MuiDataGrid-toolbarContainer": { px: isSm ? "4px" : "12px", py: "6px", borderBottom: `1px solid ${theme.palette.divider}`, flexWrap: "wrap", gap: "4px" },
                "& .MuiDataGrid-footerContainer": { borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, minHeight: "48px" },
                "& .MuiTablePagination-root": { fontSize: "0.72rem", flexWrap: "wrap" },
                ...(isSm && { "& .MuiDataGrid-columnSeparator": { display: "none" }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.68rem" } }),
              }}
            />
          </Paper>
        )}

        {activeTab === 1 && (
          <Box sx={{ width: "100%" }}>
            <EventHistory
              onViewDetails={handleViewEventDetails} onViewNewPeople={handleViewNewPeople}
              onViewConverts={handleViewConsolidated} onUnsaveEvent={handleUnsaveEvent}
              events={getFilteredClosedEvents()} searchTerm={eventSearch}
              isLoading={isLoadingEvents && events.length === 0 && isLoadingHistory}
              onRefresh={() => fetchEvents()} />
          </Box>
        )}
      </Box>

      <AddPersonDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setEditingPerson(null); setFormData(emptyForm); }}
        onSave={handlePersonSave} formData={formData} setFormData={setFormData}
        isEdit={Boolean(editingPerson)} personId={editingPerson?._id || null}
        currentEventId={currentEventId} preloadedPeople={attendees} />

      {/* Present Attendees Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth={isSm ? "sm" : "lg"} fullScreen={isXs}
        PaperProps={{ sx: { boxShadow: 6, maxHeight: "90vh", ...(isSm && !isXs && { mx: 1.5 }) } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 600, fontSize: isSm ? "1rem" : "1.25rem" }}>
          Attendees Present: {presentCount}
        </DialogTitle>
        <DialogContent dividers sx={{ p: isSm ? 1 : 2, overflowY: "auto" }}>
          <TextField size="small" placeholder="Search…" value={modalSearch}
            onChange={(e) => { setModalSearch(e.target.value); setModalPage(0); }} fullWidth sx={{ mb: 1.5 }} />
          {!currentEventId ? (
            <Typography color="text.secondary" textAlign="center" py={4}>Please select an event</Typography>
          ) : modalFilteredAttendees.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              {modalSearch ? "No matching attendees" : "No attendees present"}
            </Typography>
          ) : (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" stickyHeader sx={{ minWidth: isSm ? 380 : 700 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 32, px: isSm ? 0.5 : 1 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Name</TableCell>
                      {!isXs && <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>}
                      {!isSm && <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>}
                      {leaderLevels.map((level) => (
                        <TableCell key={level} sx={{ fontWeight: 700 }}>
                          {isSm ? `L@${level}` : `Leader @${level}`}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 700, width: 56 }}>✕</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modalPaginatedAttendees.map((a, idx) => (
                      <TableRow key={a.id || a._id} hover>
                        <TableCell sx={{ px: isSm ? 0.5 : 1 }}>{modalPage * modalRowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ fontSize: isSm ? "0.75rem" : "0.875rem" }}>
                            {a.name} {a.surname}
                          </Typography>
                        </TableCell>
                        {!isXs && <TableCell><Typography variant="body2" noWrap sx={{ fontSize: "0.8rem" }}>{a.phone || a.number || "—"}</Typography></TableCell>}
                        {!isSm && <TableCell><Typography variant="body2" noWrap sx={{ fontSize: "0.8rem" }}>{a.email || "—"}</Typography></TableCell>}
                        {leaderLevels.map((level) => (
                          <TableCell key={level}>
                            <Typography variant="body2" noWrap sx={{ fontSize: "0.78rem" }}>
                              {a[`leader${level}`] || "—"}
                            </Typography>
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Tooltip title="Remove from check-in">
                            <IconButton color="error" size="small"
                              onClick={() => { const att = attendeeMap.get(a.id || a._id); if (att) handleToggleCheckIn(att); }}>
                              <CheckCircleOutlineIcon sx={{ fontSize: "18px" }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePagination component="div" count={modalFilteredAttendees.length} page={modalPage}
                onPageChange={(e, p) => setModalPage(p)} rowsPerPage={modalRowsPerPage}
                onRowsPerPageChange={(e) => { setModalRowsPerPage(parseInt(e.target.value, 10)); setModalPage(0); }}
                rowsPerPageOptions={[25, 50, 100]} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSm ? 1 : 1.5, gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
            onClick={() => exportToExcel(
              modalFilteredAttendees.map((a) => ({ ...a, Status: "Present" })),
              `Present_Attendees_${currentEventId}`
            )}
            disabled={modalFilteredAttendees.length === 0}>
            {isSm ? "Export" : "Download XLSX"}
          </Button>
          <Button onClick={() => setModalOpen(false)} variant="outlined" size="small">Close</Button>
        </DialogActions>
      </Dialog>

      {/* New People Modal */}
      <Dialog open={newPeopleModalOpen} onClose={() => setNewPeopleModalOpen(false)} fullWidth maxWidth="md" fullScreen={isXs}
        PaperProps={{ sx: { boxShadow: 6, ...(isSm && !isXs && { mx: 1.5, maxHeight: "88vh" }) } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 600, fontSize: isSm ? "1rem" : "1.25rem" }}>New People: {newPeopleCount}</DialogTitle>
        <DialogContent dividers sx={{ p: isSm ? 1 : 2, overflowY: "auto" }}>
          <TextField size="small" placeholder="Search…" value={newPeopleSearch}
            onChange={(e) => { setNewPeopleSearch(e.target.value); setNewPeoplePage(0); }} fullWidth sx={{ mb: 1.5 }} />
          {!currentEventId ? (
            <Typography color="text.secondary" textAlign="center" py={4}>Please select an event</Typography>
          ) : newPeopleFilteredList.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              {newPeopleSearch ? "No matching people" : "No new people added"}
            </Typography>
          ) : (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" stickyHeader sx={{ minWidth: isSm ? 340 : 500 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 32 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      {!isXs && <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>}
                      {!isSm && <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>}
                      <TableCell sx={{ fontWeight: 700 }}>Gender</TableCell>
                      {!isSm && <TableCell sx={{ fontWeight: 700 }}>Invited By</TableCell>}
                      <TableCell sx={{ fontWeight: 700, width: 56 }}>Del</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {newPeoplePaginatedList.map((a, idx) => (
                      <TableRow key={a.id || a._id} hover onContextMenu={(e) => handleContextMenu(e, a, "new_person")}>
                        <TableCell>{newPeoplePage * newPeopleRowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" noWrap sx={{ fontSize: isSm ? "0.75rem" : "0.875rem" }}>
                            {a.name} {a.surname}
                          </Typography>
                        </TableCell>
                        {!isXs && <TableCell sx={{ fontSize: "0.8rem" }}>{a.phone || "—"}</TableCell>}
                        {!isSm && <TableCell sx={{ fontSize: "0.8rem" }}>{a.email || "—"}</TableCell>}
                        <TableCell sx={{ fontSize: "0.8rem" }}>{a.gender || "—"}</TableCell>
                        {!isSm && <TableCell sx={{ fontSize: "0.8rem" }}>{a.invitedBy || "—"}</TableCell>}
                        <TableCell>
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => handleRemoveNewPerson(a)} sx={{ p: "3px" }}>
                              <DeleteForeverIcon sx={{ fontSize: "18px" }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePagination component="div" count={newPeopleFilteredList.length} page={newPeoplePage}
                onPageChange={(e, p) => setNewPeoplePage(p)} rowsPerPage={newPeopleRowsPerPage}
                onRowsPerPageChange={(e) => { setNewPeopleRowsPerPage(parseInt(e.target.value, 10)); setNewPeoplePage(0); }}
                rowsPerPageOptions={[25, 50, 100]} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSm ? 1 : 1.5 }}>
          <Button onClick={() => setNewPeopleModalOpen(false)} variant="outlined" size="small">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Consolidated Modal */}
      <Dialog open={consolidatedModalOpen} onClose={() => setConsolidatedModalOpen(false)} fullWidth maxWidth="md" fullScreen={isXs}
        PaperProps={{ sx: { boxShadow: 6, ...(isSm && !isXs && { mx: 1.5, maxHeight: "88vh" }) } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 600, fontSize: isSm ? "1rem" : "1.25rem" }}>Consolidated: {consolidationCount}</DialogTitle>
        <DialogContent dividers sx={{ p: isSm ? 1 : 2, overflowY: "auto" }}>
          <TextField size="small" placeholder="Search…" value={consolidatedSearch}
            onChange={(e) => { setConsolidatedSearch(e.target.value); setConsolidatedPage(0); }} fullWidth sx={{ mb: 1.5 }} />
          {!currentEventId ? (
            <Typography color="text.secondary" textAlign="center" py={4}>Please select an event</Typography>
          ) : filteredConsolidatedPeople.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              {consolidatedSearch ? "No matching people" : "No consolidated people"}
            </Typography>
          ) : (
            <>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" stickyHeader sx={{ minWidth: isSm ? 340 : 580 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 32 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      {!isSm && <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>}
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      {!isSm && <TableCell sx={{ fontWeight: 700 }}>Assigned To</TableCell>}
                      {!isSm && <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>}
                      <TableCell sx={{ fontWeight: 700, width: 56 }}>Del</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consolidatedPaginatedList.map((person, idx) => (
                      <TableRow key={person.id || person._id || idx} hover onContextMenu={(e) => handleContextMenu(e, person, "consolidation")}>
                        <TableCell>{consolidatedPage * consolidatedRowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" noWrap sx={{ fontSize: isSm ? "0.75rem" : "0.875rem" }}>
                            {person.person_name} {person.person_surname}
                          </Typography>
                        </TableCell>
                        {!isSm && (
                          <TableCell>
                            <Box>
                              {person.person_email && <Typography variant="body2" sx={{ fontSize: "0.78rem" }} noWrap>{person.person_email}</Typography>}
                              {person.person_phone && <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>{person.person_phone}</Typography>}
                              {!person.person_email && !person.person_phone && "—"}
                            </Box>
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip label={person.decision_type || "Commitment"} size="small"
                            color={person.decision_type === "Recommitment" ? "primary" : "secondary"}
                            sx={{ fontSize: isSm ? "0.62rem" : "0.72rem", height: isSm ? 18 : 22 }} />
                        </TableCell>
                        {!isSm && <TableCell sx={{ fontSize: "0.8rem" }}>{person.assigned_to || "Not assigned"}</TableCell>}
                        {!isSm && <TableCell sx={{ fontSize: "0.78rem" }}>{person.created_at ? new Date(person.created_at).toLocaleDateString() : "—"}</TableCell>}
                        <TableCell>
                          <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => handleRemoveConsolidation(person)} sx={{ p: "3px" }}>
                              <DeleteForeverIcon sx={{ fontSize: "18px" }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePagination component="div" count={filteredConsolidatedPeople.length} page={consolidatedPage}
                onPageChange={(e, p) => setConsolidatedPage(p)} rowsPerPage={consolidatedRowsPerPage}
                onRowsPerPageChange={(e) => { setConsolidatedRowsPerPage(parseInt(e.target.value, 10)); setConsolidatedPage(0); }}
                rowsPerPageOptions={[25, 50, 100]} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSm ? 1 : 1.5, gap: 1 }}>
          <Button variant="contained" size="small" startIcon={<EmojiPeopleIcon />}
            onClick={() => { setConsolidatedModalOpen(false); handleConsolidationClick(); }}
            disabled={!currentEventId}>
            {isSm ? "Add" : "Add Consolidation"}
          </Button>
          <Button onClick={() => setConsolidatedModalOpen(false)} variant="outlined" size="small">Close</Button>
        </DialogActions>
      </Dialog>

      <EventHistoryModal open={eventHistoryModal.open}
        onClose={() => setEventHistoryModal({ open: false, event: null, type: null, data: [] })}
        event={eventHistoryModal.event} type={eventHistoryModal.type} data={eventHistoryModal.data} />

      <ConsolidationModal open={consolidationOpen} onClose={() => setConsolidationOpen(false)}
        attendeesWithStatus={attendeesWithStatus} onFinish={handleFinishConsolidation}
        consolidatedPeople={filteredConsolidatedPeople} currentEventId={currentEventId} />
    </Box>
  );
}

function ActionButtons({ currentEventId, isDarkMode, isSm, isClosingEvent, isRefreshing,
  handleAddPersonClick, handleConsolidationClick, handleSaveAndCloseEvent, handleFullRefresh, theme }) {
  const iconColor = currentEventId ? (isDarkMode ? "white" : "black") : "text.disabled";
  const iconFilter = currentEventId ? "drop-shadow(0px 2px 3px rgba(0,0,0,0.25))" : "none";
  const iconSz = isSm ? 28 : 34;
  return (
    <>
      <Tooltip title={currentEventId ? "Add Person" : "Select event first"}><span>
        <PersonAddIcon onClick={handleAddPersonClick}
          sx={{
            cursor: currentEventId ? "pointer" : "not-allowed", fontSize: iconSz, color: iconColor, filter: iconFilter,
            opacity: currentEventId ? 1 : 0.4, "&:hover": { color: currentEventId ? "primary.main" : iconColor }
          }} />
      </span></Tooltip>
      <Tooltip title={currentEventId ? "Consolidation" : "Select event first"}><span>
        <EmojiPeopleIcon onClick={handleConsolidationClick}
          sx={{
            cursor: currentEventId ? "pointer" : "not-allowed", fontSize: iconSz, color: iconColor, filter: iconFilter,
            opacity: currentEventId ? 1 : 0.4, "&:hover": { color: currentEventId ? "secondary.main" : iconColor }
          }} />
      </span></Tooltip>
      <Tooltip title={currentEventId ? "Save and Close Event" : "Select event first"}><span>
        <Button variant="contained" size={isSm ? "small" : "medium"}
          startIcon={isClosingEvent ? <CloseIcon /> : <SaveIcon />}
          onClick={handleSaveAndCloseEvent} disabled={!currentEventId || isClosingEvent}
          sx={{
            minWidth: "auto", px: isSm ? 1.2 : 2, opacity: currentEventId ? 1 : 0.4,
            backgroundColor: theme.palette.warning.main,
            "&:hover": currentEventId ? { backgroundColor: theme.palette.warning.dark, transform: "translateY(-1px)" } : {}
          }}>
          {isClosingEvent ? "Closing…" : "Save"}
        </Button>
      </span></Tooltip>
      <Tooltip title={currentEventId ? "Refresh" : "Select event first"}><span>
        <IconButton onClick={handleFullRefresh} color="primary" size={isSm ? "small" : "medium"}
          disabled={!currentEventId || isRefreshing} sx={{ opacity: currentEventId ? 1 : 0.4 }}>
          <RefreshIcon />
        </IconButton>
      </span></Tooltip>
    </>
  );
}

export default ServiceCheckIn;