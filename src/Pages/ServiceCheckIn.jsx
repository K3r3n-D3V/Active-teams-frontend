import React, { useState, useEffect, useRef, useContext } from "react";
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
import DownloadIcon from '@mui/icons-material/Download';
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import EventHistoryModal from "../components/EventHistoryModal";
import { AuthContext } from "../contexts/AuthContext";
import * as XLSX from 'xlsx';

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

let eventsCache = null;
let eventsCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

function ServiceCheckIn() {
  const { authFetch } = useContext(AuthContext);

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
    { field: 'isNew', sort: 'desc' },
    { field: 'name', sort: 'asc' }
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
    personName: ''
  });

  const [eventHistoryModal, setEventHistoryModal] = useState({
    open: false,
    event: null,
    type: null,
    data: []
  });

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    dob: "",
    homeAddress: "",
    invitedBy: "",
    email: "",
    number: "",
    gender: "",
    leader1: "",
    leader12: "",
    leader144: "",
  });

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


  const getSearchPriorityScore = (attendee, searchTerm) => {
    const fullName = `${attendee.name || ''} ${attendee.surname || ''}`.toLowerCase();
    const firstName = (attendee.name || '').toLowerCase();
    const lastName = (attendee.surname || '').toLowerCase();


    const isEnslin = lastName.includes('ensl');


    const isVicky = firstName.includes('vick') ||
      firstName.includes('vic') ||
      firstName.includes('vicki') ||
      firstName.includes('vicky');


    const isGavin = firstName.includes('gav') ||
      firstName.includes('gavin') ||
      firstName.includes('gaven') ||
      firstName.includes('gavyn');

    const isPriorityPerson = isEnslin && (isVicky || isGavin);


    const searchLower = searchTerm.toLowerCase();
    const isSearchingForEnslin = searchLower.includes('ensl');


    const isSearchingForVicky = searchLower.includes('vick') ||
      searchLower.includes('vic') ||
      searchLower.includes('vicki') ||
      searchLower.includes('vicky');


    const isSearchingForGavin = searchLower.includes('gav') ||
      searchLower.includes('gavin') ||
      searchLower.includes('gaven') ||
      searchLower.includes('gavyn');

    if (isSearchingForEnslin && isPriorityPerson) {
      if (isSearchingForVicky && isVicky) return 100;
      if (isSearchingForGavin && isGavin) return 100;
      return 90;
    }
    return 0;
  };

  const createLeaderSortComparator = (leaderField) => (v1, v2, row1, row2) => {
    const fullName1 = `${row1.name || ''} ${row1.surname || ''}`.toLowerCase().trim();
    const fullName2 = `${row2.name || ''} ${row2.surname || ''}`.toLowerCase().trim();
    const firstName1 = (row1.name || '').toLowerCase().trim();
    const firstName2 = (row2.name || '').toLowerCase().trim();
    const surname1 = (row1.surname || '').toLowerCase().trim();
    const surname2 = (row2.surname || '').toLowerCase().trim();

    const isPriorityPerson = (firstName, surname, fullName) => {
      const isEnslin = surname.includes('ensl');

      const isVicky = firstName.includes('vick') ||
        firstName.includes('vic') ||
        firstName.includes('vicki') ||
        firstName.includes('vicky') ||
        fullName.includes('vick') ||
        fullName.includes('vic') ||
        fullName.includes('vicki') ||
        fullName.includes('vicky');

      const isGavin = firstName.includes('gav') ||
        firstName.includes('gavin') ||
        firstName.includes('gaven') ||
        firstName.includes('gavyn') ||
        fullName.includes('gav') ||
        fullName.includes('gavin') ||
        fullName.includes('gaven') ||
        fullName.includes('gavyn');

      return isEnslin && (isVicky || isGavin);
    };

    const isPriority1 = isPriorityPerson(firstName1, surname1, fullName1);
    const isPriority2 = isPriorityPerson(firstName2, surname2, fullName2);

    if (isPriority1 && !isPriority2) return -1;
    if (!isPriority1 && isPriority2) return 1;

    if (isPriority1 && isPriority2) {
      const isVicky1 = firstName1.includes('vick') ||
        firstName1.includes('vic') ||
        firstName1.includes('vicki') ||
        firstName1.includes('vicky');
      const isVicky2 = firstName2.includes('vick') ||
        firstName2.includes('vic') ||
        firstName2.includes('vicki') ||
        firstName2.includes('vicky');
      if (isVicky1 && !isVicky2) return -1;
      if (!isVicky1 && isVicky2) return 1;
      return fullName1.localeCompare(fullName2);
    }

    const isNew1 = row1.isNew;
    const isNew2 = row2.isNew;

    if (isNew1 && !isNew2) return -1;
    if (!isNew1 && isNew2) return 1;

    const hasLeader1 = Boolean(row1[leaderField] && row1[leaderField].trim());
    const hasLeader2 = Boolean(row2[leaderField] && row2[leaderField].trim());

    if (hasLeader1 && !hasLeader2) return -1;
    if (!hasLeader1 && hasLeader2) return 1;

    const leaderValue1 = (row1[leaderField] || '').toLowerCase();
    const leaderValue2 = (row2[leaderField] || '').toLowerCase();

    return leaderValue1.localeCompare(leaderValue2);
  };

  const fetchRealTimeEventData = async (eventId) => {
    if (!eventId) return null;

    try {
      const response = await authFetch(`${BASE_URL}/service-checkin/real-time-data?event_id=${eventId}`, {
        method: "GET",
      });

      if (!response.ok) {
        console.error("Failed to fetch real-time event data, status:", response.status);
        return null;
      }

      const data = await response.json();
      if (data.success) {
        return data;
      }

      return null;
    } catch (error) {
      console.error("Error fetching real-time event data:", error);
      return null;
    }
  };

  const handleFullRefresh = async () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }

    setIsRefreshing(true);
    try {
      console.log("Performing full refresh from database for event:", currentEventId);

      await authFetch(`${BASE_URL}/cache/people/refresh`, {
        method: "POST",
      });

      const data = await fetchRealTimeEventData(currentEventId);

      if (data) {
        console.log('Real-time data received from DB:', {
          present_count: data.present_count,
          new_people_count: data.new_people_count,
          consolidation_count: data.consolidation_count
        });

        setRealTimeData(data);

        const cacheResponse = await authFetch(`${BASE_URL}/cache/people`);
        if (cacheResponse.ok) {
          const cacheData = await cacheResponse.json();
          if (cacheData.success && cacheData.cached_data) {
            const people = cacheData.cached_data.map((p) => ({
              _id: p._id,
              name: p.Name || "",
              surname: p.Surname || "",
              email: p.Email || "",
              phone: p.Number || "",
              leader1: p["Leader @1"] || "",
              leader12: p["Leader @12"] || "",
              leader144: p["Leader @144"] || "",
              gender: p.Gender || "",
              address: p.Address || "",
              birthday: p.Birthday || "",
              invitedBy: p.InvitedBy || "",
              stage: p.Stage || "",
              fullName: p.FullName || `${p.Name || ''} ${p.Surname || ''}`.trim()
            }));

            setAttendees(people);
          }
        }

        toast.success(`Refresh complete!`);
      } else {
        throw new Error('Failed to fetch real-time data from database');
      }

    } catch (error) {
      console.error("Error in real-time refresh:", error);
      toast.error("Failed to refresh data from database");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchAllPeople = async () => {
    setIsLoadingPeople(true);
    try {
      console.log('Fetching people data from cache...');

      const response = await authFetch(`${BASE_URL}/cache/people`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.cached_data) {
          const people = data.cached_data.map((p) => ({
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
            fullName: p.FullName || `${p.Name || ''} ${p.Surname || ''}`.trim()
          }));

          console.log(`Loaded ${people.length} people from cache`);
          setAttendees(people);
          setHasDataLoaded(true);
        } else {
          throw new Error('No people data available in cache');
        }
      } else {
        throw new Error('Failed to fetch people data');
      }
    } catch (err) {
      console.error('Error fetching people:', err);
      toast.error("Failed to load people data. Please refresh the page.");
    } finally {
      setIsLoadingPeople(false);
    }
  };

  const fetchEvents = async (forceRefresh = false) => {
    const now = Date.now();
    if (eventsCache && eventsCacheTimestamp && (now - eventsCacheTimestamp) < CACHE_DURATION && !forceRefresh) {
      console.log('Using cached events data');
      setEvents(eventsCache);

      if (!currentEventId && eventsCache.length > 0) {
        const filteredEvents = getFilteredEvents(eventsCache);
        if (filteredEvents.length > 0) {
          setCurrentEventId(filteredEvents[0].id);
        }
      }
      return;
    }

    setIsLoadingEvents(true);
    try {
      console.log('Fetching events from API...');

      const response = await authFetch(`${BASE_URL}/events/global`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('RAW Global events API response:', data);

      const eventsData = data.events || [];
      console.log(`Number of raw events from API: ${eventsData.length}`);

      const peopleResponse = await authFetch(`${BASE_URL}/cache/people`);
      let peopleList = [];
      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        if (peopleData.success && peopleData.cached_data) {
          peopleList = peopleData.cached_data;
          console.log(`Loaded ${peopleList.length} people for leader mapping`);
        }
      }

      const findPerson = (id, email) => {
        if (!id && !email) return null;

        if (id) {
          const byId = peopleList.find(p => p._id === id || p.id === id);
          if (byId) return byId;
        }

        if (email) {
          const emailLower = email.toLowerCase();
          const byEmail = peopleList.find(p =>
            p.Email && p.Email.toLowerCase() === emailLower ||
            p.email && p.email.toLowerCase() === emailLower
          );
          if (byEmail) return byEmail;
        }

        return null;
      };

      const transformedEvents = eventsData.map(event => {
        try {
          if (!event) {
            return {
              id: Math.random().toString(36),
              eventName: "Invalid Event",
              status: "unknown",
              date: new Date().toISOString(),
              attendance: 0,
              newPeople: 0,
              consolidated: 0,
              attendees: [],
              new_people: [],
              consolidations: [],
              attendanceData: [],
              newPeopleData: [],
              consolidatedData: []
            };
          }

          const attendeesArray = Array.isArray(event.attendees) ? event.attendees : [];
          const newPeopleArray = Array.isArray(event.new_people) ? event.new_people : [];
          const consolidationsArray = Array.isArray(event.consolidations) ? event.consolidations : [];

          const attendanceData = attendeesArray.map(att => {
            const personId = att.id || att._id || att.person_id;
            const personEmail = att.email || att.Email;
            const foundPerson = findPerson(personId, personEmail);

            return {
              ...att,
              name: att.name || att.Name || foundPerson?.Name || '',
              surname: att.surname || att.Surname || foundPerson?.Surname || '',
              email: att.email || att.Email || foundPerson?.Email || '',
              phone: att.phone || att.Number || foundPerson?.Number || '',
              leader1: foundPerson?.["Leader @1"] || att.leader1 || att["Leader @1"] || '',
              leader12: foundPerson?.["Leader @12"] || att.leader12 || att["Leader @12"] || '',
              leader144: foundPerson?.["Leader @144"] || att.leader144 || att["Leader @144"] || '',
              id: personId || Math.random().toString(36),
              _id: personId,
              original_data: att
            };
          });

          const newPeopleData = newPeopleArray.map(np => {
            const personId = np.id || np._id || np.person_id;
            const personEmail = np.email || np.Email;
            const foundPerson = findPerson(personId, personEmail);

            return {
              ...np,
              name: np.name || np.Name || foundPerson?.Name || '',
              surname: np.surname || np.Surname || foundPerson?.Surname || '',
              email: np.email || np.Email || foundPerson?.Email || '',
              phone: np.phone || np.Number || foundPerson?.Number || '',
              gender: np.gender || np.Gender || foundPerson?.Gender || '',
              invitedBy: np.invitedBy || np.InvitedBy || foundPerson?.InvitedBy || '',
              leader1: foundPerson?.["Leader @1"] || np.leader1 || np["Leader @1"] || '',
              leader12: foundPerson?.["Leader @12"] || np.leader12 || np["Leader @12"] || '',
              leader144: foundPerson?.["Leader @144"] || np.leader144 || np["Leader @144"] || '',
              id: personId || Math.random().toString(36),
              _id: personId,
              isNew: true,
              original_data: np
            };
          });

          const consolidatedData = consolidationsArray.map(cons => {
            const personId = cons.person_id || cons.id || cons._id;
            const personEmail = cons.person_email || cons.email;
            const foundPerson = findPerson(personId, personEmail);

            return {
              ...cons,
              name: cons.person_name || cons.name || foundPerson?.Name || '',
              surname: cons.person_surname || cons.surname || foundPerson?.Surname || '',
              person_name: cons.person_name || cons.name || foundPerson?.Name || '',
              person_surname: cons.person_surname || cons.surname || foundPerson?.Surname || '',
              person_email: cons.person_email || cons.email || foundPerson?.Email || '',
              person_phone: cons.person_phone || cons.phone || foundPerson?.Number || '',
              email: cons.person_email || cons.email || foundPerson?.Email || '',
              phone: cons.person_phone || cons.phone || foundPerson?.Number || '',
              assigned_to: cons.assigned_to || cons.assignedTo || '',
              decision_type: cons.decision_type || cons.consolidation_type || 'Commitment',
              status: cons.status || 'active',
              leader1: foundPerson?.["Leader @1"] || cons.leader1 || cons["Leader @1"] || '',
              leader12: foundPerson?.["Leader @12"] || cons.leader12 || cons["Leader @12"] || '',
              leader144: foundPerson?.["Leader @144"] || cons.leader144 || cons["Leader @144"] || '',
              id: personId || Math.random().toString(36),
              _id: personId,
              original_data: cons
            };
          });

          const attendeesCount = attendanceData.length;
          const newPeopleCount = newPeopleData.length;
          const consolidationsCount = consolidatedData.length;

          const totalAttendance = typeof event.total_attendance === 'number'
            ? event.total_attendance
            : attendeesCount;

          const transformedEvent = {
            id: event._id || event.id || Math.random().toString(36),
            eventName: event.eventName || event.Event_Name || "Unnamed Event",
            status: (event.status || "open").toLowerCase(),
            isGlobal: event.isGlobal !== false,
            isTicketed: event.isTicketed || false,
            date: event.date || event.createdAt,
            eventType: event.eventType || "Global Events",
            closed_by: event.closed_by,
            closed_at: event.closed_at,
            attendees: attendeesArray,
            new_people: newPeopleArray,
            consolidations: consolidationsArray,
            total_attendance: totalAttendance,
            attendance: attendeesCount,
            newPeople: newPeopleCount,
            consolidated: consolidationsCount,
            attendanceData: attendanceData,
            newPeopleData: newPeopleData,
            consolidatedData: consolidatedData,
            location: event.location || event.Location || '',
            description: event.description || '',
            UUID: event.UUID || '',
            created_at: event.created_at,
            updated_at: event.updated_at
          };

          if (attendanceData.some(a => a.leader1 || a.leader12 || a.leader144) ||
            newPeopleData.some(np => np.leader1 || np.leader12 || np.leader144) ||
            consolidatedData.some(c => c.leader1 || c.leader12 || c.leader144)) {
            console.log(`Event "${transformedEvent.eventName}" has leader data`);
          }

          return transformedEvent;

        } catch (error) {
          console.error('Error transforming event:', error, event);
          return {
            id: Math.random().toString(36),
            eventName: event?.eventName || "Error Event",
            status: "error",
            date: new Date().toISOString(),
            attendance: 0,
            newPeople: 0,
            consolidated: 0,
            attendees: [],
            new_people: [],
            consolidations: [],
            attendanceData: [],
            newPeopleData: [],
            consolidatedData: []
          };
        }
      });

      const validEvents = transformedEvents.filter(event =>
        event && event.status !== "error" && event.eventName !== "Error Event"
      );

      console.log(`Final transformed events: ${validEvents.length} valid`);

      eventsCache = validEvents;
      eventsCacheTimestamp = now;

      setEvents(validEvents);

      if (!currentEventId && validEvents.length > 0) {
        const filteredEvents = getFilteredEvents(validEvents);
        if (filteredEvents.length > 0) {
          console.log(`Setting current event to: ${filteredEvents[0].eventName}`);
          setCurrentEventId(filteredEvents[0].id);
        }
      }

    } catch (err) {
      console.error('Error fetching global events:', err);
      toast.error("Failed to fetch events. Please try again.");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const getFilteredEvents = (eventsList = events) => {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    const filteredEvents = eventsList.filter(event => {
      const isGlobal = event.isGlobal === true ||
        event.eventType === "Global Events" ||
        event.eventType === "Event" ||
        event.eventType?.toLowerCase().includes("event");

      const eventStatus = event.status?.toLowerCase() || '';
      const isNotClosed = eventStatus !== 'complete' && eventStatus !== 'closed';
      const didMeet = eventStatus !== 'cancelled' && eventStatus !== 'did_not_meet';

      let eventDateString = '';
      if (event.date) {
        const eventDate = new Date(event.date);
        eventDateString = eventDate.toISOString().split('T')[0];
      }

      const isForToday = eventDateString === todayDateString;

      return isGlobal && isNotClosed && didMeet && isForToday;
    });

    return filteredEvents;
  };

  const getFilteredClosedEvents = () => {
    try {
      const closedEvents = events.filter(event => {
        const isClosed = event.status?.toLowerCase() === 'closed' ||
          event.status?.toLowerCase() === 'complete';
        const isGlobal = event.eventType === "Global Events" ||
          event.isGlobal === true ||
          event.eventTypeName === "Global Events";
        const isNotCell = event.eventType?.toLowerCase() !== 'cell';
        const didMeet = event.status?.toLowerCase() !== 'cancelled' &&
          event.status?.toLowerCase() !== 'did_not_meet';

        return isClosed && isGlobal && isNotCell && didMeet;
      });

      console.log('Found closed events:', closedEvents.length);

      if (closedEvents.length > 0) {
        console.log('All closed events:');
        closedEvents.forEach((event, index) => {
          console.log(`${index + 1}. "${event.eventName}" - Status: ${event.status} - Attendance: ${event.attendance || 0} - New: ${event.newPeople || 0} - Consolidated: ${event.consolidated || 0}`);
        });
      }

      if (!eventSearch.trim()) {
        return closedEvents;
      }

      const searchTerm = eventSearch.toLowerCase();
      const filtered = closedEvents.filter(event =>
        event.eventName?.toLowerCase().includes(searchTerm) ||
        (event.date && new Date(event.date).toLocaleDateString().toLowerCase().includes(searchTerm)) ||
        event.status?.toLowerCase().includes(searchTerm) ||
        event.closed_by?.toLowerCase().includes(searchTerm)
      );

      console.log(`Search "${eventSearch}" found ${filtered.length} events`);
      return filtered;

    } catch (error) {
      console.error("Error in getFilteredClosedEvents:", error);
      return [];
    }
  };
  const handleToggleCheckIn = async (attendee) => {
    if (!currentEventId) {
      toast.error("Please select an event");
      return;
    }

    if (checkInLoading.has(attendee._id)) {
      console.log(`Check-in already in progress for ${attendee.name} ${attendee.surname}`);
      return;
    }

    try {
      setCheckInLoading(prev => new Set(prev).add(attendee._id));

      const isCurrentlyPresent = realTimeData?.present_attendees?.some(a =>
        a.id === attendee._id || a._id === attendee._id
      );
      const fullName = `${attendee.name} ${attendee.surname}`.trim();

      if (!isCurrentlyPresent) {
        const alreadyCheckedIn = realTimeData?.present_attendees?.some(a =>
          (a.id === attendee._id || a._id === attendee._id)
        );

        if (alreadyCheckedIn) {
          toast.warning(`${fullName} is already checked in`);
          return;
        }

        const response = await authFetch(`${BASE_URL}/service-checkin/checkin`, {
          method: "POST",
          body: JSON.stringify({
            event_id: currentEventId,
            person_data: {
              id: attendee._id,
              name: attendee.name,
              fullName: fullName,
              email: attendee.email,
              phone: attendee.phone,
              number: attendee.number,
              leader12: attendee.leader12
            },
            type: "attendee"
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            toast.success(`${fullName} checked in successfully`);
          } else if (data.message && data.message.includes("already checked in")) {
            toast.warning(`${fullName} is already checked in`);
            const freshData = await fetchRealTimeEventData(currentEventId);
            if (freshData) {
              setRealTimeData(freshData);
            }
            return;
          }
        }
      } else {
        const response = await authFetch(`${BASE_URL}/service-checkin/remove`, {
          method: "DELETE",
          body: JSON.stringify({
            event_id: currentEventId,
            person_id: attendee._id,
            type: "attendees"
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            toast.info(`${fullName} removed from check-in`);
          }
        }
      }

      const freshData = await fetchRealTimeEventData(currentEventId);
      if (freshData) {
        setRealTimeData(freshData);
      }

    } catch (err) {
      console.error("Error in toggle check-in:", err);
      toast.error(err.message || "Failed to toggle check-in");
    } finally {
      setCheckInLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(attendee._id);
        return newSet;
      });
    }
  };

  const emptyForm = {
    name: "",
    surname: "",
    email: "",
    phone: "",
    gender: "",
    invitedBy: "",
    leader1: "",
    leader12: "",
    leader144: "",
    stage: "Win"
  };

  const handlePersonSave = async (responseData) => {
    if (!currentEventId) {
      toast.error("Please select an event first before adding people");
      return;
    }

    try {
      if (editingPerson) {
        const updatedPersonData = {
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          number: formData.number,
          gender: formData.gender,
          invitedBy: formData.invitedBy,
          leader1: formData.leader1,
          leader12: formData.leader12,
          leader144: formData.leader144,
          stage: formData.stage || "Win"
        };

        const updateResponse = await authFetch(
          `${BASE_URL}/people/${editingPerson._id}`,
          {
            method: "PATCH",
            body: JSON.stringify(updatedPersonData),
          }
        );

        if (updateResponse.ok) {
          const data = await updateResponse.json();
          toast.success(`${formData.name} ${formData.surname} updated successfully`);

          const normalizedUpdate = {
            _id: editingPerson._id,
            name: data.Name || formData.name,
            surname: data.Surname || formData.surname,
            email: data.Email || formData.email,
            phone: data.Number || formData.number,
            number: data.Number || formData.number,
            address: data.Address || formData.address,
            homeAddress: data.Address || formData.address,
            birthday: data.Birthday || formData.dob,
            dob: data.Birthday ? data.Birthday.replace(/\//g, '-') : formData.dob,
            gender: data.Gender || formData.gender,
            invitedBy: data.InvitedBy || formData.invitedBy,
            leader1: data["Leader @1"] || formData.leader1,
            leader12: data["Leader @12"] || formData.leader12,
            leader144: data["Leader @144"] || formData.leader144,
            stage: data.Stage || formData.stage || "Win",
            fullName: data.FullName || `${data.Name || formData.name} ${data.Surname || formData.surname}`.trim()
          };

          setAttendees(prev =>
            prev.map(person =>
              person._id === editingPerson._id
                ? normalizedUpdate
                : person
            )
          );

          setAttendees(prev =>
            prev.map(person =>
              person._id === editingPerson._id
                ? { ...person, ...updatedPersonData }
                : person
            )
          );

          setRealTimeData(prev => {
            if (!prev) return prev;

            const updatedNewPeople = (prev.new_people || []).map(np =>
              (np.id === editingPerson._id || np._id === editingPerson._id)
                ? { ...np, ...normalizedUpdate, id: editingPerson._id }
                : np
            );

            const updatedPresentAttendees = (prev.present_attendees || []).map(att =>
              (att.id === editingPerson._id || att._id === editingPerson._id)
                ? { ...att, ...normalizedUpdate, id: editingPerson._id }
                : att
            );

            return {
              ...prev,
              new_people: updatedNewPeople,
              present_attendees: updatedPresentAttendees
            };
          });

          setOpenDialog(false);
          setEditingPerson(null);
          setFormData(emptyForm);
        }

        return;
      }

      const newPersonData = responseData.person || responseData;
      const fullName = `${formData.name} ${formData.surname}`.trim();


      const response = await authFetch(
        `${BASE_URL}/service-checkin/checkin`,
        {
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
              stage: "First Time"
            },
            type: "new_person"
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`${fullName} added as new person successfully`);
          setOpenDialog(false);
          setEditingPerson(null);
          setFormData(emptyForm);

          setRealTimeData(prev => {
            if (!prev) return prev;

            const updatedNewPeople = [...(prev.new_people || []), data.new_person];

            return {
              ...prev,
              new_people: updatedNewPeople,
              new_people_count: updatedNewPeople.length,
              ...(data.consolidation_count && {
                consolidation_count: data.consolidation_count
              })
            };
          });

          try {
            await authFetch(`${BASE_URL}/cache/people/refresh`, {
              method: "POST",
            });
            console.log("Cache refreshed after adding new person");
          } catch (cacheError) {
            console.warn("Cache refresh failed:", cacheError);
          }


          const newPersonForGrid = {
            _id: newPersonData._id,
            name: newPersonData.Name || formData.name,
            surname: newPersonData.Surname || formData.surname,
            email: newPersonData.Email || formData.email,
            number: newPersonData.Number || formData.number,
            gender: newPersonData.Gender || formData.gender,
            invitedBy: newPersonData.InvitedBy || formData.invitedBy,
            leader1: formData.leader1 || "",
            leader12: formData.leader12 || "",
            leader144: formData.leader144 || "",
            stage: "First Time",
            fullName: fullName,
            address: "",
            birthday: "",
            cellGroup: "",
            zone: "",
            homeAddress: "",
            isNew: true,
            present: false
          };

          setAttendees(prev => [newPersonForGrid, ...prev]);
          setSearch("");
          const freshData = await fetchRealTimeEventData(currentEventId);
          if (freshData) {
            setRealTimeData(freshData);
          }

          console.log("New person added to DataGrid and counts updated immediately");
        }
      }
    } catch (error) {
      console.error("Error saving person:", error);
      toast.error(error.message || "Failed to save person");
    }
  };

  const handleFinishConsolidation = async (task) => {
    if (!currentEventId) return;
    const fullName = task.recipientName || `${task.person_name || ''} ${task.person_surname || ''}`.trim() || 'Unknown Person';

    console.log("Recording consolidation in UI for:", fullName);
    console.log("Consolidation result from modal:", task);

    try {
      setConsolidationOpen(false);
      toast.success(`${fullName} consolidated successfully`);

      const freshData = await fetchRealTimeEventData(currentEventId);
      if (freshData) {
        setRealTimeData(freshData);
        console.log("Consolidation data refreshed from backend");
      }

    } catch (error) {
      console.error("Error recording consolidation in UI:", error);
      toast.error("Consolidation created but failed to update display");
    }
  };

  const handleSaveAndCloseEvent = async () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }

    const currentEvent = events.find(event => event.id === currentEventId);
    if (!currentEvent) {
      toast.error("Selected event not found");
      return;
    }

    if (!window.confirm(`Are you sure you want to close "${currentEvent.eventName}"? This action cannot be undone.`)) {
      return;
    }

    setIsClosingEvent(true);
    try {
      const response = await authFetch(`${BASE_URL}/events/${currentEventId}/close`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();


      if (result.already_closed) {
        toast.info(result.message || "Event was already closed");
      } else {
        toast.success(result.message || `Event "${currentEvent.eventName}" closed successfully!`);
      }

      setEvents(prev => prev.map(event =>
        event.id === currentEventId ? { ...event, status: "complete" } : event
      ));


      if (eventsCache) {
        eventsCache = eventsCache.map(event =>
          event.id === currentEventId ? { ...event, status: "complete" } : event
        );
      }

      if (result.closed_by && result.closed_at) {
        setEvents(prev => prev.map(event =>
          event.id === currentEventId ? {
            ...event,
            status: "complete",
            closed_by: result.closed_by,
            closed_at: result.closed_at
          } : event
        ));
      }

      setRealTimeData(null);
      setCurrentEventId("");
      setTimeout(() => {
        fetchEvents(true);
      }, 500);

    } catch (error) {
      console.error("ERROR in event closure process:", error);
      if (error.message.includes("404")) {
        toast.error("Event not found. It may have been deleted.");
      } else if (error.message.includes("400")) {
        toast.error("Invalid event ID.");
      } else {
        toast.error("Failed to close event. Please try again.");
      }
    } finally {
      setIsClosingEvent(false);
    }
  };

  const handleConsolidationClick = () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }
    setConsolidationOpen(true);
  };

  const handleEditClick = (person) => {
    console.log("Editing person data:", person);

    setEditingPerson(person);
    setFormData({
      name: person.name || "",
      surname: person.surname || "",
      dob: person.dob || person.dateOfBirth || person.birthday || "",
      address: person.homeAddress || person.address || "",
      email: person.email || "",
      number: person.phone || person.Number || person.number || "",
      gender: person.gender || "",
      invitedBy: person.invitedBy || "",
      leader1: person.leader1 || "",
      leader12: person.leader12 || "",
      leader144: person.leader144 || "",
      stage: person.stage || "Win"
    });
    setOpenDialog(true);
  };

  const handleDelete = async (personId, personName) => {
    setIsDeleting(true);
    try {
      const res = await authFetch(`${BASE_URL}/people/${personId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Delete failed: ${errorData.detail}`);
        return;
      }
      setAttendees(prev => prev.filter(person => person._id !== personId));
      setRealTimeData(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          present_attendees: (prev.present_attendees || []).filter(a =>
            a.id !== personId && a._id !== personId
          ),
          new_people: (prev.new_people || []).filter(np =>
            np.id !== personId && np._id !== personId
          ),
          present_count: (prev.present_attendees || []).filter(a =>
            a.id !== personId && a._id !== personId
          ).length,
          new_people_count: (prev.new_people || []).filter(np =>
            np.id !== personId && np._id !== personId
          ).length,
        };
      });

      try {
        await authFetch(`${BASE_URL}/cache/people/refresh`, {
          method: "POST",
        });
        console.log("Cache refreshed after deletion");
      } catch (cacheError) {
        console.warn("Cache refresh failed:", cacheError);
      }

      toast.success(`"${personName}" deleted successfully`);

    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the person");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ open: false, personId: null, personName: '' });
    }
  };

  const exportToExcel = (data, filename = "export") => {
  if (!data || data.length === 0) {
    toast.error("No data to export");
    return;
  }

  const headers = [
    "Name", "Surname", "Email", "Phone",
    "Leader @1", "Leader @12", "Leader @144",
    "CheckIn_Time", "Status"
  ];

  const worksheetData = data.map(row => {
    const ordered = {};
    headers.forEach(h => ordered[h] = row[h] ?? '');
    return ordered;
  });

  const ws = XLSX.utils.json_to_sheet(worksheetData, { header: headers });

  // Auto-size columns (optional but nice)
  ws['!cols'] = headers.map((h, i) => {
    let maxw = h.length;
    worksheetData.forEach(row => {
      const val = String(row[h] || '');
      if (val.length > maxw) maxw = val.length;
    });
    return { wch: maxw + 3 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Present Attendees");

  const today = new Date().toISOString().split('T')[0];
  const fullFilename = `${filename}_${today}.xlsx`;

  try {
    // Generate binary string
    const wbout = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'binary',
      compression: true   // ← helps reduce size + can fix some corruptions
    });

    // Convert binary string → ArrayBuffer
    const buf = s2ab(wbout);

    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${data.length} records`);
  } catch (err) {
    console.error("Excel export failed:", err);
    toast.error("Failed to create Excel file – check console");
  }
};

// Helper – make sure this is defined exactly like this
function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
}

  const handleAddPersonClick = () => {
    if (!currentEventId) {
      toast.error("Please select an event first before adding people");
      return;
    }
    setOpenDialog(true);
  };

  const getAttendeesWithPresentStatus = () => {
    const presentAttendeeIds = realTimeData?.present_attendees?.map(a => a.id || a._id) || [];
    const newPeopleIds = realTimeData?.new_people?.map(np => np.id) || [];

    return attendees.map((attendee) => ({
      ...attendee,
      present: presentAttendeeIds.includes(attendee._id),
      isNew: newPeopleIds.includes(attendee._id),
      id: attendee._id,
    }));
  };

  const menuEvents = (() => {
    try {
      const filtered = getFilteredEvents();
      const list = [...filtered];
      if (currentEventId && !list.some((ev) => ev.id === currentEventId)) {
        const currentEventFromAll = events.find((ev) => ev.id === currentEventId);
        if (currentEventFromAll) {
          list.unshift(currentEventFromAll);
        }
      }
      return list;
    } catch (e) {
      console.error('Error building menuEvents', e);
      return getFilteredEvents();
    }
  })();

  const handleViewEventDetails = (event, data) => {
    setEventHistoryModal({
      open: true,
      event: event,
      type: 'attendance',
      data: data || []
    });
  };

  const handleViewNewPeople = (event, data) => {
    setEventHistoryModal({
      open: true,
      event: event,
      type: 'newPeople',
      data: data || []
    });
  };

  const handleViewConsolidated = (event, data) => {
    setEventHistoryModal({
      open: true,
      event: event,
      type: 'consolidated',
      data: data || []
    });
  };

  const filterPeople = (people, searchTerm) => {
    if (!searchTerm.trim()) return people;

    const searchTermLower = searchTerm.toLowerCase().trim();
    const searchTerms = searchTermLower.split(/\s+/);

    return people.filter((person) => {
      const searchableText = [
        person.name || '',
        person.surname || '',
        person.email || '',
        person.phone || '',
        person.leader1 || '',
        person.leader12 || '',
        person.leader144 || '',
        person.gender || '',
        person.cellGroup || '',
        person.zone || '',
        person.invitedBy || '',
        person.address || '',
        person.homeAddress || '',
        person.stage || ''
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  };

  const filterPeopleWithPriority = (people, searchTerm) => {
    if (!searchTerm.trim()) return people;

    const searchTermLower = searchTerm.toLowerCase().trim();
    const searchTerms = searchTermLower.split(/\s+/);

    const filtered = people.filter((person) => {
      const searchableText = [
        person.name || '',
        person.surname || '',
        person.email || '',
        person.phone || '',
        person.leader1 || '',
        person.leader12 || '',
        person.leader144 || '',
        person.gender || '',
        person.cellGroup || '',
        person.zone || '',
        person.invitedBy || '',
        person.address || '',
        person.homeAddress || '',
        person.stage || ''
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });

    if (searchTermLower.includes('ensl') || searchTermLower.includes('vick') ||
      searchTermLower.includes('vic') || searchTermLower.includes('gav')) {
      return filtered.sort((a, b) => {
        const scoreA = getSearchPriorityScore(a, searchTermLower);
        const scoreB = getSearchPriorityScore(b, searchTermLower);

        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return `${a.name || ''} ${a.surname || ''}`.localeCompare(`${b.name || ''} ${b.surname || ''}`);
      });
    }

    return filtered;
  };

  const attendeesWithStatus = getAttendeesWithPresentStatus();
  const modalFilteredAttendees = (() => {
    const fullPresentAttendees = (realTimeData?.present_attendees || []).map(a => {
      const fullPerson = attendees.find(att => att._id === (a.id || a._id)) || {};
      return {
        ...a,
        ...fullPerson,
        name: fullPerson.name || a.name || '',
        surname: fullPerson.surname || a.surname || '',
        email: fullPerson.email || a.email || '',
        phone: fullPerson.phone || a.phone || '',
        number: fullPerson.number || a.number || '',
        leader1: fullPerson.leader1 || a.leader1 || '',
        leader12: fullPerson.leader12 || a.leader12 || '',
        leader144: fullPerson.leader144 || a.leader144 || '',
        id: a.id || a._id,
        _id: a.id || a._id
      };
    });

    const sortedAttendees = [...fullPresentAttendees].sort((a, b) => {
      const nameA = `${a.name || ''} ${a.surname || ''}`.toLowerCase().trim();
      const nameB = `${b.name || ''} ${b.surname || ''}`.toLowerCase().trim();
      return nameA.localeCompare(nameB);
    });

    if (!modalSearch.trim()) return sortedAttendees;

    return filterPeopleWithPriority(sortedAttendees, modalSearch);
  })();


  const newPeopleFilteredList = (() => {
    const fullNewPeople = (realTimeData?.new_people || []).map(np => {
      const fullPerson = attendees.find(att => att._id === np.id) || {};
      return {
        ...np,
        ...fullPerson,
        name: fullPerson.name || np.name || '',
        surname: fullPerson.surname || np.surname || '',
        email: fullPerson.email || np.email || '',
        phone: fullPerson.phone || np.phone || '',
        number: fullPerson.Number || np.Number || '',
        invitedBy: fullPerson.invitedBy || np.invitedBy || '',
        gender: fullPerson.gender || np.gender || '',
        leader1: fullPerson.leader1 || np.leader1 || '',
        leader12: fullPerson.leader12 || np.leader12 || '',
        leader144: fullPerson.leader144 || np.leader144 || '',
      };
    });

    const sortedNewPeople = [...fullNewPeople].sort((a, b) => {
      const nameA = `${a.name || ''} ${a.surname || ''}`.toLowerCase().trim();
      const nameB = `${b.name || ''} ${b.surname || ''}`.toLowerCase().trim();
      return nameA.localeCompare(nameB);
    });

    if (!newPeopleSearch.trim()) return sortedNewPeople;

    return filterPeople(sortedNewPeople, newPeopleSearch);
  })();

  const newPeoplePaginatedList = newPeopleFilteredList.slice(
    newPeoplePage * newPeopleRowsPerPage,
    newPeoplePage * newPeopleRowsPerPage + newPeopleRowsPerPage
  );

  const filteredConsolidatedPeople = (() => {
    const fullConsolidatedPeople = (realTimeData?.consolidations || []).map(cons => {
      const foundPerson = attendees.find(att =>
        att._id === cons.person_id ||
        (att.name === cons.person_name && att.surname === cons.person_surname)
      );

      return {
        ...cons,
        ...foundPerson,
        person_name: foundPerson?.name || cons.person_name || '',
        person_surname: foundPerson?.surname || cons.person_surname || '',
        person_email: foundPerson?.email || cons.person_email || '',
        person_phone: foundPerson?.phone || cons.person_phone || '',
        assigned_to: cons.assigned_to || cons.assignedTo || '',
        decision_type: cons.decision_type || cons.consolidation_type || '',
        notes: cons.notes || ''
      };
    });

    const sortedConsolidatedPeople = [...fullConsolidatedPeople].sort((a, b) => {
      const nameA = `${a.person_name || ''} ${a.person_surname || ''}`.toLowerCase().trim();
      const nameB = `${b.person_name || ''} ${b.person_surname || ''}`.toLowerCase().trim();
      return nameA.localeCompare(nameB);
    });

    if (!consolidatedSearch.trim()) return sortedConsolidatedPeople;

    return filterPeople(sortedConsolidatedPeople, consolidatedSearch);
  })();

  const consolidatedPaginatedList = filteredConsolidatedPeople.slice(
    consolidatedPage * consolidatedRowsPerPage,
    consolidatedPage * consolidatedRowsPerPage + consolidatedRowsPerPage
  );

  const modalPaginatedAttendees = modalFilteredAttendees.slice(
    modalPage * modalRowsPerPage,
    modalPage * modalRowsPerPage + modalRowsPerPage
  );

  const filteredAttendees = (() => {
    if (!search.trim()) return attendeesWithStatus;

    return filterPeopleWithPriority(attendeesWithStatus, search);
  })();

  const sortedFilteredAttendees = (() => {
    const result = [...filteredAttendees];

    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0];

      if (sort.field === 'leader1' || sort.field === 'leader12' || sort.field === 'leader144') {
        result.sort((a, b) => {
          const comparator = createLeaderSortComparator(sort.field);
          let comparison = comparator(a[sort.field], b[sort.field], a, b);
          return sort.sort === 'desc' ? -comparison : comparison;
        });
      } else if (sort.field && sort.field !== 'actions') {
        result.sort((a, b) => {
          const aVal = (a[sort.field] || '').toString().toLowerCase();
          const bVal = (b[sort.field] || '').toString().toLowerCase();
          const comparison = aVal.localeCompare(bVal);
          return sort.sort === 'desc' ? -comparison : comparison;
        });
      }
    } else {
      result.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return `${a.name || ''} ${a.surname || ''}`.localeCompare(`${b.name || ''} ${b.surname || ''}`);
      });
    }

    return result;
  })();

  const paginatedAttendees = filteredAttendees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );


  const presentCount = realTimeData?.present_attendees?.length || 0;
  const newPeopleCount = realTimeData?.new_people_count || 0;
  const consolidationCount = realTimeData?.consolidation_count || 0;


  const getMainColumns = () => {
    const baseColumns = [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 120,
        sortable: true,
        renderCell: (params) => {
          const isFirstTime =
            params.row.stage === "First Time" ||
            params.row.isNew === true;

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2, width: '100%' }}>
              {isFirstTime && (
                <Chip
                  label="New"
                  size="small"
                  color="success"
                  variant="filled"
                  sx={{ fontSize: '0.55rem', height: 14, flexShrink: 0, padding: '0 3px' }}
                />
              )}
              <Typography variant="body2" sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: isXsDown ? '0.7rem' : (isSmDown ? '0.75rem' : '0.9rem'),
                width: '100%'
              }}>
                {params.row.name} {params.row.surname}
              </Typography>
            </Box>
          );
        }
      },



      ...(isSmDown ? [] : [

        {
          field: 'phone',
          headerName: 'Phone',
          flex: 0.8,
          minWidth: 100,
          sortable: true,
          renderCell: (params) => (
            <Typography variant="body2" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: isXsDown ? '0.7rem' : (isSmDown ? '0.75rem' : '0.9rem'),
              width: '100%'
            }}>
              {params.row.number || '—'}
            </Typography>
          )
        },


        {
          field: 'email',
          headerName: 'Email',
          flex: 1,
          minWidth: 120,
          sortable: true,
          display: isSmDown ? 'none' : 'flex',
          renderCell: (params) => (
            <Typography variant="body2" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: isXsDown ? '0.7rem' : (isSmDown ? '0.75rem' : '0.9rem'),
              width: '100%'
            }}>
              {params.row.email || '—'}
            </Typography>
          )
        },
      ]),




      {
        field: 'leader1',
        headerName: isXsDown ? 'L1' : (isSmDown ? 'Leader @1' : 'Leader @1'),
        flex: 0.6,
        minWidth: 40,
        sortable: true,
        sortComparator: createLeaderSortComparator('leader1'),
        renderCell: (params) => (
          <Typography variant="body2" sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: isXsDown ? '0.65rem' : (isSmDown ? '0.7rem' : '0.9rem'),
            whiteSpace: 'nowrap',
            width: '100%'
          }}>
            {params.row.leader1 || '—'}
          </Typography>
        )
      },

      {
        field: 'leader12',
        headerName: isXsDown ? 'L12' : (isSmDown ? 'Leader @12' : 'Leader @12'),
        flex: 0.6,
        minWidth: 70,
        sortable: true,
        sortComparator: createLeaderSortComparator('leader12'),
        renderCell: (params) => (
          <Typography variant="body2" sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: isXsDown ? '0.65rem' : (isSmDown ? '0.7rem' : '0.9rem'),
            whiteSpace: 'nowrap',
            width: '100%'
          }}>
            {params.row.leader12 || '—'}
          </Typography>
        )
      },

      {
        field: 'leader144',
        headerName: isXsDown ? 'L144' : (isSmDown ? 'Leader @144' : 'Leader @144'),
        flex: 0.6,
        minWidth: 70,
        sortable: true,
        sortComparator: createLeaderSortComparator('leader144'),
        renderCell: (params) => (
          <Typography variant="body2" sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: isXsDown ? '0.65rem' : (isSmDown ? '0.7rem' : '0.9rem'),
            whiteSpace: 'nowrap',
            width: '100%'
          }}>
            {params.row.leader144 || '—'}
          </Typography>
        )
      },

      {
        field: 'actions',
        headerName: isSmDown ? 'Actions' : 'Actions',
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const fullName = `${params.row.name || ''} ${params.row.surname || ''}`.trim();
          const isDisabled = !currentEventId;
          const isCheckInLoading = checkInLoading.has(params.row._id);

          return (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
              <Tooltip title={isDisabled ? "Please select an event first" : "Delete"}>
                <span>
                  <IconButton
                    size="medium"
                    color={isDisabled ? "default" : "error"}
                    onClick={() => {
                      if (!isDisabled) {
                        setDeleteConfirmation({
                          open: true,
                          personId: params.row._id,
                          personName: fullName
                        });
                      }
                    }}
                    disabled={isDisabled || isCheckInLoading}
                    sx={{
                      padding: isXsDown ? '4px' : (isSmDown ? '6px' : '8px'),
                      '&:hover': !isDisabled && !isCheckInLoading ? {
                        backgroundColor: theme.palette.error.main + '20',
                        transform: 'scale(1.1)'
                      } : {},
                      transition: 'transform 0.2s',
                      opacity: (isDisabled || isCheckInLoading) ? 0.5 : 1,
                      color: isDisabled ? 'text.disabled' : ''
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: isXsDown ? '18px' : (isSmDown ? '20px' : '24px') }} />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={isDisabled ? "Please select an event first" : "Edit"}>
                <span>
                  <IconButton
                    size="medium"
                    color={isDisabled ? "default" : "primary"}
                    onClick={() => {
                      if (!isDisabled) handleEditClick(params.row);
                    }}
                    disabled={isDisabled || isCheckInLoading}
                    sx={{
                      padding: isXsDown ? '4px' : (isSmDown ? '6px' : '8px'),
                      '&:hover': !isDisabled && !isCheckInLoading ? {
                        backgroundColor: theme.palette.primary.main + '20',
                        transform: 'scale(1.1)'
                      } : {},
                      transition: 'transform 0.2s',
                      opacity: (isDisabled || isCheckInLoading) ? 0.5 : 1,
                      color: isDisabled ? 'text.disabled' : ''
                    }}
                  >
                    <EditIcon sx={{ fontSize: isXsDown ? '18px' : (isSmDown ? '20px' : '24px') }} />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title={
                isDisabled ? "Please select an event first" :
                  isCheckInLoading ? "Processing..." :
                    (params.row.present ? "Checked in" : "Check in")
              }>
                <span>
                  <IconButton
                    size="medium"
                    color={isDisabled ? "default" : "success"}
                    disabled={isDisabled || isCheckInLoading}
                    onClick={() => !isDisabled && !isCheckInLoading && handleToggleCheckIn(params.row)}
                    sx={{
                      padding: isXsDown ? '4px' : (isSmDown ? '6px' : '8px'),
                      '&:hover': !isDisabled && !isCheckInLoading ? {
                        backgroundColor: theme.palette.success.main + '20',
                        transform: 'scale(1.1)'
                      } : {},
                      transition: 'transform 0.2s',
                      opacity: (isDisabled || isCheckInLoading) ? 0.5 : 1,
                      color: isDisabled ? 'text.disabled' : ''
                    }}
                  >
                    {params.row.present ?
                      <CheckCircleIcon sx={{ fontSize: isXsDown ? '18px' : (isSmDown ? '20px' : '24px') }} /> :
                      <CheckCircleOutlineIcon sx={{ fontSize: isXsDown ? '18px' : (isSmDown ? '20px' : '24px') }} />
                    }
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        }
      }
    ];


    if (isSmDown) {
      return baseColumns.filter(col =>
        col.field === 'name' ||
        col.field === 'leader12' ||
        col.field === 'leader144' ||
        col.field === 'actions'
      );
    }

    return baseColumns;
  };

  const mainColumns = getMainColumns();


  const StatsCard = ({ title, count, icon, color = "primary", onClick, disabled = false }) => (
    <Paper
      variant="outlined"
      sx={{
        p: getResponsiveValue(1, 1.5, 2, 2.5, 2.5),
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        boxShadow: 2,
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        "&:hover": disabled ? {} : {
          boxShadow: 4,
          transform: "translateY(-2px)"
        },
        transition: "all 0.2s",
        opacity: disabled ? 0.6 : 1,
        backgroundColor: 'background.paper',
      }}
      onClick={onClick}
    >
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={0.5}>
        {React.cloneElement(icon, {
          color: disabled ? "disabled" : color,
          sx: { fontSize: getResponsiveValue(18, 20, 24, 28, 28) }
        })}
        <Typography
          variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")}
          fontWeight={600}
          color={disabled ? "text.disabled" : `${color}.main`}
          sx={{ fontSize: getResponsiveValue("0.9rem", "1rem", "1.2rem", "1.3rem", "1.3rem") }}
        >
          {count}
        </Typography>
      </Stack>
      <Typography
        variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")}
        color={disabled ? "text.disabled" : `${color}.main`}
        sx={{ fontSize: getResponsiveValue("0.7rem", "0.8rem", "0.9rem", "1rem", "1rem") }}
      >
        {title}
        {disabled && (
          <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
            Select event
          </Typography>
        )}
      </Typography>
    </Paper>
  );


  const AttendeeCard = ({ attendee, showNumber, index }) => (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        boxShadow: 2,
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        "&:last-child": { mb: 0 },
        backgroundColor: 'background.paper',
      }}
    >
      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {showNumber && `${index}. `}{attendee.name} {attendee.surname}
            </Typography>
            {attendee.email && <Typography variant="body2" color="text.secondary">{attendee.email}</Typography>}
            {attendee.phone && <Typography variant="body2" color="text.secondary">{attendee.phone}</Typography>}
          </Box>
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end" mb={1}>
          <IconButton onClick={() => handleEditClick(attendee)} color="primary" size="medium">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(attendee._id, `${attendee.name} ${attendee.surname}`)} color="error" size="medium">
            <DeleteIcon />
          </IconButton>
          <IconButton onClick={() => handleToggleCheckIn(attendee)} color="success" disabled={!currentEventId} size="medium">
            {attendee.present ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
          </IconButton>
        </Stack>

        {(attendee.leader1 || attendee.leader12 || attendee.leader144) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {attendee.leader1 && (
                <Chip label={`@1: ${attendee.leader1}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {attendee.leader12 && (
                <Chip label={`@12: ${attendee.leader12}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {attendee.leader144 && (
                <Chip label={`@144: ${attendee.leader144}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );


  const PresentAttendeeCard = ({ attendee, showNumber, index }) => {

    const fullPersonData = attendees.find(att => att._id === (attendee.id || attendee._id)) || attendee;

    const mappedAttendee = {
      ...attendee,
      name: attendee.name || fullPersonData.name || 'Unknown',
      surname: attendee.surname || fullPersonData.surname || '',
      phone: attendee.phone || fullPersonData.phone || '',
      email: attendee.email || fullPersonData.email || '',
      leader1: attendee.leader1 || fullPersonData.leader1 || '',
      leader12: attendee.leader12 || fullPersonData.leader12 || '',
      leader144: attendee.leader144 || fullPersonData.leader144 || '',
    };

    return (
      <Card
        variant="outlined"
        sx={{
          mb: 1,
          boxShadow: 2,
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          "&:last-child": { mb: 0 },
          backgroundColor: 'background.paper',
        }}
      >
        <CardContent sx={{
          p: 1.5,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            width: '100%',
            gap: 1
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Clear Name & Surname Display */}
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {showNumber && `${index}. `}{mappedAttendee.name} {mappedAttendee.surname}
                </Typography>
              </Box>

              {/* Contact Information */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
                {mappedAttendee.phone && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    📞 {mappedAttendee.phone}
                  </Typography>
                )}
                {mappedAttendee.email && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    ✉️ {mappedAttendee.email}
                  </Typography>
                )}
              </Box>

              {/* Leader information - all three fields */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {mappedAttendee.leader1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      @1:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mappedAttendee.leader1}
                    </Typography>
                  </Box>
                )}

                {mappedAttendee.leader12 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      @12:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mappedAttendee.leader12}
                    </Typography>
                  </Box>
                )}

                {mappedAttendee.leader144 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      @144:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mappedAttendee.leader144}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Remove button */}
            <Tooltip title="Remove from check-in">
              <IconButton
                color="error"
                size="medium"
                onClick={() => {
                  const originalAttendee = attendees.find(att => att._id === (attendee.id || attendee._id));
                  if (originalAttendee) handleToggleCheckIn(originalAttendee);
                }}
                sx={{ flexShrink: 0, mt: 0.5 }}
              >
                <CheckCircleOutlineIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  };


  const NewPersonCard = ({ person, showNumber, index }) => (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        boxShadow: 2,
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        "&:last-child": { mb: 0 },
        border: `2px solid ${theme.palette.success.main}`,
        backgroundColor: isDarkMode
          ? theme.palette.success.dark + "1a"
          : theme.palette.success.light + "0a",
      }}
    >
      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {showNumber && `${index}. `}{person.name} {person.surname}
            </Typography>
            {person.email && <Typography variant="body2" color="text.secondary">{person.email}</Typography>}
            {person.phone && <Typography variant="body2" color="text.secondary">{person.phone}</Typography>}
            {person.gender && (
              <Chip
                label={person.gender}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5, fontSize: "0.7rem", height: 20 }}
              />
            )}
          </Box>
        </Box>

      </CardContent>
    </Card>
  );


  const ConsolidatedPersonCard = ({ person, showNumber, index }) => {
    const decisionType = person.decision_type || person.consolidation_type || "Commitment";
    const displayDecisionType = decisionType || 'Commitment';

    return (
      <Card
        variant="outlined"
        sx={{
          mb: 1,
          boxShadow: 2,
          minHeight: '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          "&:last-child": { mb: 0 },
          backgroundColor: 'background.paper',
        }}
      >
        <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {showNumber && `${index}. `}{person.person_name} {person.person_surname}
                <Chip
                  label={displayDecisionType}
                  size="small"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                  color={displayDecisionType === 'Recommitment' ? 'primary' : 'secondary'}
                />
              </Typography>
              {person.person_email && <Typography variant="body2" color="text.secondary">{person.person_email}</Typography>}
              {person.person_phone && <Typography variant="body2" color="text.secondary">{person.person_phone}</Typography>}
            </Box>
          </Box>

          <Stack direction="row" spacing={1} justifyContent="flex-end" mb={1}>
            <Chip
              label={`Assigned to: ${person.assigned_to || 'Not assigned'}`}
              size="small"
              variant="outlined"
              color="primary"
            />
          </Stack>

          {(person.created_at || person.decision_type || person.notes) && (
            <>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                {person.created_at && (
                  <Chip
                    label={`Date: ${new Date(person.created_at).toLocaleDateString()}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem", height: 20 }}
                  />
                )}
                <Chip
                  label={`Type: ${displayDecisionType}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem", height: 20 }}
                />
                {person.status && (
                  <Chip
                    label={`Status: ${person.status}`}
                    size="small"
                    color={person.status === 'completed' ? 'success' : 'default'}
                    sx={{ fontSize: "0.7rem", height: 20 }}
                  />
                )}
                {person.notes && (
                  <Tooltip title={person.notes}>
                    <Chip
                      label="Has Notes"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem", height: 20 }}
                    />
                  </Tooltip>
                )}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const debugLeaderData = () => {
    if (events.length > 0) {
      events.forEach(event => {
        console.log(`\nEvent: ${event.eventName}`);


        if (event.attendanceData && event.attendanceData.length > 0) {
          const withLeaders = event.attendanceData.filter(a => a.leader1 || a.leader12 || a.leader144);
          console.log(`  Attendance: ${event.attendanceData.length} people, ${withLeaders.length} with leader data`);
          withLeaders.slice(0, 3).forEach(person => {
            console.log(`    - ${person.name} ${person.surname}: L1=${person.leader1}, L12=${person.leader12}, L144=${person.leader144}`);
          });
        }


        if (event.newPeopleData && event.newPeopleData.length > 0) {
          const withLeaders = event.newPeopleData.filter(np => np.leader1 || np.leader12 || np.leader144);
          console.log(`  New People: ${event.newPeopleData.length} people, ${withLeaders.length} with leader data`);
          withLeaders.slice(0, 3).forEach(person => {
            console.log(`    - ${person.name} ${person.surname}: L1=${person.leader1}, L12=${person.leader12}, L144=${person.leader144}`);
          });
        }


        if (event.consolidatedData && event.consolidatedData.length > 0) {
          const withLeaders = event.consolidatedData.filter(c => c.leader1 || c.leader12 || c.leader144);
          console.log(`  Consolidated: ${event.consolidatedData.length} people, ${withLeaders.length} with leader data`);
          withLeaders.slice(0, 3).forEach(person => {
            console.log(`    - ${person.name || person.person_name} ${person.surname || person.person_surname}: L1=${person.leader1}, L12=${person.leader12}, L144=${person.leader144}`);
          });
        }
      });
    }
  };


  useEffect(() => {
    if (events.length > 0 && activeTab === 1) {
      debugLeaderData();
    }
  }, [events, activeTab]);


  const SkeletonLoader = () => (
    <Box p={containerPadding} sx={{
      width: '100%',
      margin: "0 auto",
      mt: 4,
      minHeight: "100vh",
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <Skeleton
        variant="text"
        width="60%"
        height={getResponsiveValue(32, 40, 48, 56, 56)}
        sx={{ mx: 'auto', mb: cardSpacing, borderRadius: 1 }}
      />

      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={6} sm={6} md={3} key={item}>
            <Paper variant="outlined" sx={{ p: getResponsiveValue(1.5, 2, 2.5, 3, 3), textAlign: "center", minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
                <Skeleton variant="circular" width={getResponsiveValue(20, 24, 28, 32, 32)} height={getResponsiveValue(20, 24, 28, 32, 32)} />
                <Skeleton variant="text" width="40%" height={getResponsiveValue(24, 28, 32, 36, 40)} sx={{ borderRadius: 1 }} />
              </Stack>
              <Skeleton variant="text" width="70%" height={getResponsiveValue(16, 18, 20, 22, 24)} sx={{ mx: 'auto', borderRadius: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Controls - More compact for mobile */}
      <Grid container spacing={cardSpacing} mb={cardSpacing} alignItems="center">
        <Grid item xs={12} sm={isSmDown ? 12 : 6} md={4}>
          <Select
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
            value={currentEventId}
            onChange={(e) => setCurrentEventId(e.target.value)}
            displayEmpty
            fullWidth
            sx={{
              boxShadow: 2,
              '& .MuiSelect-select': {
                py: isSmDown ? 0.5 : 1,
                fontSize: getResponsiveValue('0.8rem', '0.9rem', '1rem', '1rem', '1rem')
              }
            }}
          ></Select>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ mb: 2, boxShadow: 3, p: 1, minHeight: '48px' }}>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: 1 }} />
        </Stack>
      </Paper>

      {isMdDown ? (
        <Box>
          <Box sx={{
            maxHeight: 500,
            overflowY: "auto",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1,
            boxShadow: 2
          }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Card key={item} variant="outlined" sx={{ mb: 1, boxShadow: 2, minHeight: '120px' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" height={24} sx={{ borderRadius: 1 }} />
                      <Skeleton variant="text" width="80%" height={16} sx={{ borderRadius: 1, mt: 0.5 }} />
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                    <Skeleton variant="rounded" width={80} height={20} sx={{ borderRadius: 10 }} />
                    <Skeleton variant="rounded" width={80} height={20} sx={{ borderRadius: 10 }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
          <Box sx={{ mt: 1 }}>
            <Skeleton variant="rounded" height={52} sx={{ borderRadius: 1, boxShadow: 2 }} />
          </Box>
        </Box>
      ) : (
        <Paper variant="outlined" sx={{ height: 600, boxShadow: 3, p: 2, width: '100%' }}>
          <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rounded" width="100%" height={400} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 2, borderRadius: 1 }} />
        </Paper>
      )}
    </Box>
  );


  useEffect(() => {
    if (currentEventId) {

      const loadRealTimeData = async () => {
        console.log("Event changed, loading fresh data from database...");
        const data = await fetchRealTimeEventData(currentEventId);
        if (data) {
          setRealTimeData(data);
          console.log("Loaded fresh data from DB:", {
            present: data.present_count,
            new: data.new_people_count,
            consolidations: data.consolidation_count
          });
        }
      };

      loadRealTimeData();
    } else {
      setRealTimeData(null);
    }
  }, [currentEventId]);


  useEffect(() => {
    if (!currentEventId) return;


    const loadData = async () => {
      const data = await fetchRealTimeEventData(currentEventId);
      if (data) {
        setRealTimeData(data);
      }
    };

    loadData();


    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, [currentEventId]);


  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      console.log('Service Check-In mounted - fetching fresh data from backend...');
      hasInitialized.current = true;


      setIsLoadingEvents(true);


      fetchEvents();
      fetchAllPeople();
    }
  }, []);


  useEffect(() => {
    if (attendees.length > 0 && search.includes('gav')) {
      const potentialGavins = attendees.filter(person => {
        const fullName = `${person.name || ''} ${person.surname || ''}`.toLowerCase();
        const firstName = (person.name || '').toLowerCase();
        const surname = (person.surname || '').toLowerCase();

        const isEnslin = surname.includes('ensl');
        const isGavin = firstName.includes('gav') || fullName.includes('gav');

        return isEnslin && isGavin;
      });

      console.log('Potential Gavin Enslin matches:', potentialGavins.map(p => ({
        name: p.name,
        surname: p.surname,
        fullName: `${p.name} ${p.surname}`,
        isEnslin: p.surname?.toLowerCase().includes('ensl'),
        isGavin: p.name?.toLowerCase().includes('gav'),
        firstName: p.name?.toLowerCase(),
        lastName: p.surname?.toLowerCase(),
      })));
    }
  }, [attendees, search]);


  if ((!hasDataLoaded && isLoadingPeople) || (attendees.length === 0 && isLoadingPeople)) {
    return <SkeletonLoader />;
  }

  return (
    <Box p={containerPadding} sx={{
      width: '100%',
      margin: "0 auto",
      mt: 6,
      minHeight: "100vh",
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <ToastContainer
        position={isSmDown ? "top-center" : "top-right"}
        autoClose={3000}
        hideProgressBar={isSmDown}
        style={{
          marginTop: isSmDown ? '0px' : '20px',
          zIndex: 9999
        }}
      />
      <DeleteConfirmationModal
        open={deleteConfirmation.open}
        onClose={() => setDeleteConfirmation({ open: false, personId: null, personName: '' })}
        onConfirm={() => handleDelete(deleteConfirmation.personId, deleteConfirmation.personName)}
        personName={deleteConfirmation.personName}
        isLoading={isDeleting}
      />

      {/* Stats Cards */}
      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        <Grid item xs={6} sm={6} md={4}>
          <StatsCard
            title="Present"
            count={presentCount}
            icon={<GroupIcon />}
            color="primary"
            onClick={() => {
              if (currentEventId) {
                setModalOpen(true);
                setModalSearch("");
                setModalPage(0);
              }
            }}
            disabled={!currentEventId}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <StatsCard
            title="New People"
            count={newPeopleCount}
            icon={<PersonAddAltIcon />}
            color="success"
            onClick={() => {
              if (currentEventId) {
                setNewPeopleModalOpen(true);
                setNewPeopleSearch("");
                setNewPeoplePage(0);
              }
            }}
            disabled={!currentEventId}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={4}>
          <StatsCard
            title="Consolidated"
            count={consolidationCount}
            icon={<MergeIcon />}
            color="secondary"
            onClick={() => {
              if (currentEventId) {
                setConsolidatedModalOpen(true);
                setConsolidatedSearch("");
                setConsolidatedPage(0);
              }
            }}
            disabled={!currentEventId}
          />
        </Grid>
      </Grid>

      {/* Controls */}
      <Grid container spacing={cardSpacing} mb={cardSpacing} alignItems="center">
        <Grid item xs={12} sm={isSmDown ? 12 : 6} md={4}>
          <Select
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
            value={currentEventId}
            onChange={(e) => setCurrentEventId(e.target.value)}
            displayEmpty
            fullWidth
            sx={{ boxShadow: 2 }}
          >
            <MenuItem value="">
              <Typography color="text.secondary">
                {isLoadingEvents ? "Loading events..." : "Select Global Event"}
              </Typography>
            </MenuItem>
            {menuEvents.map((ev) => (
              <MenuItem key={ev.id} value={ev.id}>
                <Typography variant="body2" fontWeight="medium">{ev.eventName}</Typography>
              </MenuItem>
            ))}
            {menuEvents.length === 0 && events.length > 0 && (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">No open global events</Typography>
              </MenuItem>
            )}
            {events.length === 0 && !isLoadingEvents && (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">No events available</Typography>
              </MenuItem>
            )}
          </Select>
        </Grid>

        <Grid item xs={12} sm={isSmDown ? 12 : 6} md={5}>
          {activeTab === 0 ? (
            <TextField
              size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              placeholder="Search attendees..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              fullWidth
              sx={{ boxShadow: 2, mt: isSmDown ? 1 : 0 }}
            />
          ) : (
            <TextField
              size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              placeholder="Search events..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              fullWidth
              sx={{ boxShadow: 2, mt: isSmDown ? 1 : 0 }}
            />
          )}
        </Grid>

        <Grid item xs={12} md={3}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent={isMdDown ? "center" : "flex-end"}
            sx={{ mt: isSmDown ? 2 : 0 }}
          >
            <Tooltip title={currentEventId ? "Add Person" : "Please select an event first"}>
              <span>
                <PersonAddIcon
                  onClick={handleAddPersonClick}
                  sx={{
                    cursor: currentEventId ? "pointer" : "not-allowed",
                    fontSize: 36,
                    color: currentEventId ? (isDarkMode ? "white" : "black") : "text.disabled",
                    "&:hover": { color: currentEventId ? "primary.dark" : "text.disabled" },
                    filter: currentEventId ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" : "none",
                    opacity: currentEventId ? 1 : 0.5
                  }}
                />
              </span>
            </Tooltip>
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title={currentEventId ? "Consolidation" : "Please select an event first"}>
                <span>
                  <EmojiPeopleIcon
                    onClick={handleConsolidationClick}
                    sx={{
                      cursor: currentEventId ? "pointer" : "not-allowed",
                      fontSize: 36,
                      color: currentEventId ? (isDarkMode ? "white" : "black") : "text.disabled",
                      "&:hover": { color: currentEventId ? "secondary.dark" : "text.disabled" },
                      filter: currentEventId ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" : "none",
                      opacity: currentEventId ? 1 : 0.5
                    }}
                  />
                </span>
              </Tooltip>

              <Tooltip title={currentEventId ? "Save and Close Event" : "Please select an event first"}>
                <span>
                  <Button
                    variant="contained"
                    startIcon={isClosingEvent ? <CloseIcon /> : <SaveIcon />}
                    onClick={handleSaveAndCloseEvent}
                    disabled={!currentEventId || isClosingEvent}
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      opacity: currentEventId ? 1 : 0.5,
                      cursor: currentEventId ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                      backgroundColor: theme.palette.warning.main,
                      "&:hover": currentEventId ? {
                        transform: "translateY(-2px)",
                        boxShadow: 4,
                        backgroundColor: theme.palette.warning.dark,
                      } : {},
                    }}
                  >
                    {isClosingEvent ? "Closing..." : "Save"}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={currentEventId ? "Refresh All Data" : "Please select an event first"}>
                <span>
                  <IconButton
                    onClick={handleFullRefresh}
                    color="primary"
                    disabled={!currentEventId || isRefreshing}
                    sx={{
                      opacity: currentEventId ? 1 : 0.5,
                      cursor: currentEventId ? "pointer" : "not-allowed",
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Box   sx={{
    minHeight: 400,
    width: '100%',
    maxHeight: { xs: '75vh', md: 'unset' },
    overflowY: { xs: 'auto', md: 'visible' },
  }}
   >
   <Paper
  variant="outlined"
  sx={{
    mb: 2,
    boxShadow: 3,
    minHeight: '36px',
    width: '100%',
    maxHeight: '70vh',
    overflowY: 'auto',
    px: { xs: 1, sm: 2 },
  }}
>

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: '36px',
              '& .MuiTab-root': {
                py: 0.5,
                fontSize: getResponsiveValue('0.7rem', '0.8rem', '0.9rem', '1rem', '1rem')
              }
            }}
          >
            <Tab label="All Attendees" />
            <Tab label="Event History" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Box sx={{ width: '100%', height: '100%' }}>
            <Paper
              variant="outlined"
              sx={{
                boxShadow: 3,
                overflow: 'hidden',
                width: '100%',
                height: isMdDown ? `calc(100vh - ${containerPadding * 8 + 280}px)` : 650,
                minHeight: isMdDown ? 500 : 650,
                maxHeight: isMdDown ? '650px' : 700,
              }}
            >
              <DataGrid
                rows={sortedFilteredAttendees ?? attendees}
                columns={mainColumns}
                pagination
                paginationModel={{
                  page: page,
                  pageSize: rowsPerPage,
                }}
                onPaginationModelChange={(model) => {
                  setPage(model.page);
                  setRowsPerPage(model.pageSize);
                }}
                rowCount={filteredAttendees.length}
                pageSizeOptions={[25, 50, 100]}
                slots={{
                  toolbar: GridToolbar,
                }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                }}
                disableRowSelectionOnClick
                sortModel={sortModel}
                onSortModelChange={(model) => {
                  setPage(0);
                  setSortModel(model);
                }}
                getRowId={(row) => row._id}
                sx={{
                  width: '100%',
                  height: 'calc(100% - 1px)',
                  '& .MuiDataGrid-root': {
                    border: 'none',
                    width: '100%',
                    height: '100%',
                  },
                  '& .MuiDataGrid-main': {
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    width: '100% !important',
                    minWidth: '100%',
                    flex: 1,
                    height: '100% !important',
                  },
                  '& .MuiDataGrid-row': {
                    width: '100% !important',
                  },
                  '& .MuiDataGrid-cell': {
                    display: 'flex',
                    alignItems: 'center',
                    padding: isXsDown ? '2px 4px' : (isSmDown ? '2px 3px' : '4px 6px'),
                    fontSize: isXsDown ? '0.7rem' : (isSmDown ? '0.65rem' : '0.8rem'),
                    minWidth: '40px',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    width: '100% !important',
                    backgroundColor: theme.palette.action.hover,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  '& .MuiDataGrid-columnHeader': {
                    fontWeight: 600,
                    minWidth: '40px',
                    fontSize: isXsDown ? '0.7rem' : (isSmDown ? '0.65rem' : '0.8rem'),
                    padding: isXsDown ? '4px 2px' : (isSmDown ? '4px 2px' : '6px 4px'),
                    '& .MuiDataGrid-iconButtonContainer': {
                      visibility: 'visible !important',
                    },
                    '& .MuiDataGrid-sortIcon': {
                      opacity: 1,
                    },
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  '& .MuiDataGrid-toolbarContainer': {
                    padding: isXsDown ? '4px 2px' : (isSmDown ? '8px 4px' : '12px 8px'),
                    minHeight: 'auto',
                    width: '100%',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '& .MuiOutlinedInput-root': {
                      fontSize: isXsDown ? '0.7rem' : (isSmDown ? '0.75rem' : '0.9rem'),
                    }
                  },
                  '& .MuiDataGrid-footerContainer': {
                    display: 'flex',
                    borderTop: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    minHeight: '52px',
                  },
                  '& .MuiDataGrid-virtualScrollerContent': {
                    width: '100% !important',
                    height: '100% !important',
                  },
                  '& .MuiDataGrid-scrollbar--vertical': {
                    width: '8px !important',
                  },
                  ...(isSmDown && {
                    '& .MuiDataGrid-columnHeader': {
                      padding: '4px 2px',
                      fontSize: '0.7rem',
                      minWidth: '40px',
                    },
                    '& .MuiDataGrid-cell': {
                      padding: '2px 4px',
                      fontSize: '0.7rem',
                      minWidth: '40px',
                    },
                    '& .MuiDataGrid-columnSeparator': {
                      display: 'none',
                    },
                    '& .MuiDataGrid-toolbarContainer': {
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 1
                    }
                  }),
                }}
              />
            </Paper>
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ width: '100%' }}>
            <EventHistory
              onViewDetails={handleViewEventDetails}
              onViewNewPeople={handleViewNewPeople}
              onViewConverts={handleViewConsolidated}
              events={getFilteredClosedEvents()}
              searchTerm={eventSearch}
              isLoading={isLoadingEvents}
              onRefresh={() => {
                console.log('Refreshing event history...');
                fetchEvents(true);
              }}
            />
          </Box>
        )}
      </Box>

      {/* Add / Edit Dialog */}
      <AddPersonDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handlePersonSave}
        formData={formData}
        setFormData={setFormData}
        isEdit={Boolean(editingPerson)}
        personId={editingPerson?._id || null}
        currentEventId={currentEventId}
      />

      {/* PRESENT Attendees Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            boxShadow: 6,
            maxHeight: '90vh',
            ...(isSmDown && {
              margin: 2,
              maxHeight: '85vh',
              width: 'calc(100% - 32px)',
            })
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Attendees Present: {presentCount}
        </DialogTitle>
        <DialogContent dividers sx={{
          maxHeight: isSmDown ? 600 : 700,
          overflowY: "auto",
          p: isSmDown ? 1 : 2
        }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={modalSearch}
            onChange={(e) => { setModalSearch(e.target.value); setModalPage(0); }}
            fullWidth
            sx={{ mb: 2, boxShadow: 1 }}
          />

          {!currentEventId ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              Please select an event to view present attendees
            </Typography>
          ) : modalFilteredAttendees.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              {modalSearch ? 'No matching attendees found' : 'No attendees present for this event'}
            </Typography>
          ) : (
            <>
              {isSmDown ? (
                <Box>
                  {modalPaginatedAttendees.map((a, idx) => (
                    <PresentAttendeeCard
                      key={a.id || a._id}
                      attendee={a}
                      showNumber={true}
                      index={modalPage * modalRowsPerPage + idx + 1}
                    />
                  ))}
                  {modalPaginatedAttendees.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      No matching attendees
                    </Typography>
                  )}
                </Box>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '40px' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '150px' }}>Name & Surname</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '100px' }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '150px' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '90px' }}>Leader @1</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '90px' }}>Leader @12</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '90px' }}>Leader @144</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, width: '80px' }}>Remove</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modalPaginatedAttendees.map((a, idx) => {
                      const fullPersonData = attendees.find(att => att._id === (a.id || a._id)) || a;
                      const mappedAttendee = {
                        ...a,
                        name: a.name || fullPersonData.name || 'Unknown',
                        surname: a.surname || fullPersonData.surname || '',

                        phone: a.phone || fullPersonData.phone || '',
                        email: a.email || fullPersonData.email || '',

                        leader1: a.leader1 || fullPersonData.leader1 || '',
                        leader12: a.leader12 || fullPersonData.leader12 || '',
                        leader144: a.leader144 || fullPersonData.leader144 || '',
                      };


                      const fullName = `${mappedAttendee.name} ${mappedAttendee.surname}`.trim();

                      return (
                        <TableRow key={a.id || a._id} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                          <TableCell>{modalPage * modalRowsPerPage + idx + 1}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="600" noWrap>
                                {mappedAttendee.name} {mappedAttendee.surname}
                              </Typography>
                              {fullName !== `${mappedAttendee.name} ${mappedAttendee.surname}`.trim() && (
                                <Typography variant="caption" color="text.secondary">
                                  {fullName}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={mappedAttendee.phone || ""}>
                              {mappedAttendee.phone || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={mappedAttendee.email || ""}>
                              {mappedAttendee.email || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={mappedAttendee.leader1 || ""}>
                              {mappedAttendee.leader1 || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={mappedAttendee.leader12 || ""}>
                              {mappedAttendee.leader12 || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap title={mappedAttendee.leader144 || ""}>
                              {mappedAttendee.leader144 || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Remove from check-in">
                              <IconButton
                                color="error"
                                size="medium"
                                onClick={() => {
                                  const attendee = attendees.find(att => att._id === (a.id || a._id));
                                  if (attendee) handleToggleCheckIn(attendee);
                                }}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: theme.palette.error.main + '20',
                                    transform: 'scale(1.1)'
                                  },
                                  transition: 'transform 0.2s'
                                }}
                              >
                                <CheckCircleOutlineIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {modalPaginatedAttendees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">No matching attendees</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              <Box mt={1}>
                <TablePagination
                  component="div"
                  count={modalFilteredAttendees.length}
                  page={modalPage}
                  onPageChange={(e, newPage) => setModalPage(newPage)}
                  rowsPerPage={modalRowsPerPage}
                  onRowsPerPageChange={(e) => { setModalRowsPerPage(parseInt(e.target.value, 10)); setModalPage(0); }}
                  rowsPerPageOptions={[25, 50, 100]}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const dataToDownload = modalFilteredAttendees.map(attendee => ({
                Name: attendee.name || '',
                Surname: attendee.surname || '',
                Email: attendee.email || '',
                Phone: attendee.phone || '',
                'Leader @1': attendee.leader1 || '',
                'Leader @12': attendee.leader12 || '',
                'Leader @144': attendee.leader144 || '',
                CheckIn_Time: attendee.time || '',
                Status: 'Present'
              }));
              exportToExcel(dataToDownload, `Present_Attendees_${currentEventId}`);
            }}
            size={isSmDown ? "small" : "medium"}
            disabled={modalFilteredAttendees.length === 0}
          >
            Download XSLX
          </Button>
          <Button onClick={() => setModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW PEOPLE Modal */}
      <Dialog
        open={newPeopleModalOpen}
        onClose={() => setNewPeopleModalOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            boxShadow: 6,
            ...(isSmDown && {
              margin: 2,
              maxHeight: '80vh',
              width: 'calc(100% - 32px)',
            })
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          New People: {newPeopleCount}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={newPeopleSearch}
            onChange={(e) => { setNewPeopleSearch(e.target.value); setNewPeoplePage(0); }}
            fullWidth
            sx={{ mb: 2, boxShadow: 1 }}
          />

          {!currentEventId ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              Please select an event to view new people
            </Typography>
          ) : newPeopleFilteredList.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              {newPeopleSearch ? 'No matching people found' : 'No new people added for this event'}
            </Typography>
          ) : (
            <>
              {isSmDown ? (
                <Box>
                  {newPeoplePaginatedList.map((a, idx) => (
                    <NewPersonCard
                      key={a.id || a._id}
                      person={a}
                      showNumber={true}
                      index={newPeoplePage * newPeopleRowsPerPage + idx + 1}
                    />
                  ))}
                  {newPeoplePaginatedList.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      No matching people
                    </Typography>
                  )}
                </Box>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Invited By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {newPeoplePaginatedList.map((a, idx) => {

                      const mappedPerson = {
                        ...a,
                        name: a.name || '',
                        surname: a.surname || '',
                        phone: a.phone || '',
                        email: a.email || '',
                        gender: a.gender || '',
                        invitedBy: a.invitedBy || '',
                      };

                      return (
                        <TableRow key={a.id || a._id} hover>
                          <TableCell>{newPeoplePage * newPeopleRowsPerPage + idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {mappedPerson.name} {mappedPerson.surname}
                            </Typography>
                          </TableCell>
                          <TableCell>{mappedPerson.phone || "—"}</TableCell>
                          <TableCell>{mappedPerson.email || "—"}</TableCell>
                          <TableCell>{mappedPerson.gender || "—"}</TableCell>
                          <TableCell>{mappedPerson.invitedBy || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                    {newPeoplePaginatedList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No matching people</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              <Box mt={1}>
                <TablePagination
                  component="div"
                  count={newPeopleFilteredList.length}
                  page={newPeoplePage}
                  onPageChange={(e, newPage) => setNewPeoplePage(newPage)}
                  rowsPerPage={newPeopleRowsPerPage}
                  onRowsPerPageChange={(e) => { setNewPeopleRowsPerPage(parseInt(e.target.value, 10)); setNewPeoplePage(0); }}
                  rowsPerPageOptions={[25, 50, 100]}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button onClick={() => setNewPeopleModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONSOLIDATED Modal */}
      <Dialog
        open={consolidatedModalOpen}
        onClose={() => setConsolidatedModalOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            boxShadow: 6,
            ...(isSmDown && {
              margin: 2,
              maxHeight: '80vh',
              width: 'calc(100% - 32px)',
            })
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Consolidated People: {consolidationCount}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={consolidatedSearch}
            onChange={(e) => { setConsolidatedSearch(e.target.value); setConsolidatedPage(0); }}
            fullWidth
            sx={{ mb: 2, boxShadow: 1 }}
          />

          {!currentEventId ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              Please select an event to view consolidated people
            </Typography>
          ) : filteredConsolidatedPeople.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              {consolidatedSearch ? 'No matching consolidated people found' : 'No consolidated people for this event'}
            </Typography>
          ) : (
            <>
              {isSmDown ? (
                <Box>
                  {consolidatedPaginatedList.map((person, idx) => (
                    <ConsolidatedPersonCard
                      key={person.id || person._id || idx}
                      person={person}
                      showNumber={true}
                      index={consolidatedPage * consolidatedRowsPerPage + idx + 1}
                    />
                  ))}
                  {consolidatedPaginatedList.length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      No matching consolidated people
                    </Typography>
                  )}
                </Box>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Decision Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consolidatedPaginatedList.map((person, idx) => {

                      const mappedPerson = {
                        ...person,
                        person_name: person.person_name || '',
                        person_surname: person.person_surname || '',
                        person_email: person.person_email || '',
                        person_phone: person.person_phone || '',
                        decision_type: person.decision_type || 'Commitment',
                        assigned_to: person.assigned_to || 'Not assigned',
                        created_at: person.created_at || '',
                      };

                      return (
                        <TableRow key={person.id || person._id || idx} hover>
                          <TableCell>{consolidatedPage * consolidatedRowsPerPage + idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {mappedPerson.person_name} {mappedPerson.person_surname}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {mappedPerson.person_email && (
                                <Typography variant="body2">{mappedPerson.person_email}</Typography>
                              )}
                              {mappedPerson.person_phone && (
                                <Typography variant="body2" color="text.secondary">{mappedPerson.person_phone}</Typography>
                              )}
                              {!mappedPerson.person_email && !mappedPerson.person_phone && "—"}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={mappedPerson.decision_type}
                              size="small"
                              color={mappedPerson.decision_type === 'Recommitment' ? 'primary' : 'secondary'}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>{mappedPerson.assigned_to}</TableCell>
                          <TableCell>
                            {mappedPerson.created_at ? new Date(mappedPerson.created_at).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {consolidatedPaginatedList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No matching consolidated people</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              <Box mt={1}>
                <TablePagination
                  component="div"
                  count={filteredConsolidatedPeople.length}
                  page={consolidatedPage}
                  onPageChange={(e, newPage) => setConsolidatedPage(newPage)}
                  rowsPerPage={consolidatedRowsPerPage}
                  onRowsPerPageChange={(e) => { setConsolidatedRowsPerPage(parseInt(e.target.value, 10)); setConsolidatedPage(0); }}
                  rowsPerPageOptions={[25, 50, 100]}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button
            variant="contained"
            startIcon={<EmojiPeopleIcon />}
            onClick={() => {
              setConsolidatedModalOpen(false);
              handleConsolidationClick();
            }}
            disabled={!currentEventId}
            size={isSmDown ? "small" : "medium"}
            sx={{
              opacity: currentEventId ? 1 : 0.5,
              cursor: currentEventId ? "pointer" : "not-allowed"
            }}
          >
            Add Consolidation
          </Button>
          <Button onClick={() => setConsolidatedModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <EventHistoryModal
        open={eventHistoryModal.open}
        onClose={() => setEventHistoryModal({ open: false, event: null, type: null, data: [] })}
        event={eventHistoryModal.event}
        type={eventHistoryModal.type}
        data={eventHistoryModal.data}
      />

      <ConsolidationModal
        open={consolidationOpen}
        onClose={() => setConsolidationOpen(false)}
        attendeesWithStatus={attendeesWithStatus}
        onFinish={handleFinishConsolidation}
        consolidatedPeople={filteredConsolidatedPeople}
        currentEventId={currentEventId}
      />
    </Box>
  );
}

export default ServiceCheckIn;