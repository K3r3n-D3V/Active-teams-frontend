
import React, { useState, useEffect } from "react";
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
  TableContainer,
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
import axios from "axios";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonIcon from "@mui/icons-material/Person";
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

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

function ServiceCheckIn() {
  const [attendees, setAttendees] = useState(() => {
    const stored = localStorage.getItem("attendees");
    return stored ? JSON.parse(stored) : [];
  });

  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem("events");
    return stored ? JSON.parse(stored) : [];
  });

  const [currentEventId, setCurrentEventId] = useState(
    localStorage.getItem("currentEventId") || ""
  );

  const [eventCheckIns, setEventCheckIns] = useState(() => {
    const stored = localStorage.getItem("eventCheckIns");
    return stored ? JSON.parse(stored) : {};
  });

  const [eventNewPeople, setEventNewPeople] = useState(() => {
    const stored = localStorage.getItem("eventNewPeople");
    return stored ? JSON.parse(stored) : {};
  });

  const [eventConsolidations, setEventConsolidations] = useState(() => {
    const stored = localStorage.getItem("eventConsolidations");
    return stored ? JSON.parse(stored) : {};
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [openDialog, setOpenDialog] = useState(false);
  const [firstTimeAddedIds, setFirstTimeAddedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPeopleModalOpen, setNewPeopleModalOpen] = useState(false);
  const [consolidatedModalOpen, setConsolidatedModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [consolidationOpen, setConsolidationOpen] = useState(false);

  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingConsolidated, setIsLoadingConsolidated] = useState(false);
  const [isClosingEvent, setIsClosingEvent] = useState(false);

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

  // State for event history details modals
  const [eventHistoryDetails, setEventHistoryDetails] = useState({
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
    phone: "",
    gender: "",
    leader1: "",
    leader12: "",
    leader144: "",
  });

  const [consolidatedPeople, setConsolidatedPeople] = useState([]);

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

  const containerPadding = getResponsiveValue(1, 2, 3, 4, 4);
  const titleVariant = getResponsiveValue("subtitle1", "h6", "h5", "h4", "h4");
  const cardSpacing = getResponsiveValue(1, 2, 2, 3, 3);

const getFilteredEvents = () => {
  console.log('📋 All available events:', events);
  
  const filteredEvents = events.filter(event => {
    // More flexible filtering for global events
    const isGlobal = event.isGlobal === true || 
                    event.eventType === "Global Events" || 
                    event.eventType === "global" ||
                    event.eventType?.toLowerCase().includes("global");
    
    const isOpen = event.status?.toLowerCase() === 'open' || event.status?.toLowerCase() === "incomplete";

    console.log(`🔍 Event: ${event.eventName}`, {
      id: event.id,
      isGlobal,
      isOpen,
      eventType: event.eventType,
      status: event.status,
      isGlobalFlag: event.isGlobal
    });

    return isGlobal && isOpen;
  });

  console.log('✅ Filtered Global Events:', filteredEvents.map(e => ({
    id: e.id,
    name: e.eventName,
    type: e.eventType,
    status: e.status
  })));
  return filteredEvents;
};

const getClosedEvents = () => {
  return events.filter(event => {
    const isClosed = event.status?.toLowerCase() === 'closed';
    const isGlobal = event.eventType === "Global Events";
    const isNotCell = event.eventType?.toLowerCase() !== 'cell';

    return isClosed && isGlobal && isNotCell;
  });
};

  useEffect(() => {
    if (events.length > 0 && !currentEventId) {
      const filteredEvents = getFilteredEvents();
      if (filteredEvents.length > 0) {
        const firstEventId = filteredEvents[0].id;
        setCurrentEventId(firstEventId);
        console.log('✅ Auto-selected first event:', firstEventId);
      }
    }
  }, [events]);

  const loadEventCheckIns = async () => {
    if (!currentEventId) return;

    try {
      console.log('🔄 Loading check-ins for event:', currentEventId);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/events/${currentEventId}/checkins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const checkedInPeople = toArray(response.data);
      console.log('✅ Raw checked-in people from API:', checkedInPeople);

      const attendeeMap = new Map();

      attendees.forEach(attendee => {
        if (attendee._id) {
          attendeeMap.set(attendee._id, attendee._id);
        }

        if (attendee.name) {
          const nameKey = `${attendee.name.toLowerCase()} ${attendee.surname?.toLowerCase() || ''}`.trim();
          attendeeMap.set(nameKey, attendee._id);
        }

        if (attendee.email) {
          attendeeMap.set(attendee.email.toLowerCase(), attendee._id);
        }
      });

      console.log('📋 Attendee map:', attendeeMap);

      const checkedInIds = checkedInPeople
        .map((person) => {
          let matchedId = null;

          if (person._id && attendeeMap.has(person._id)) {
            matchedId = attendeeMap.get(person._id);
          }
          else if (person.name || person.Name) {
            const name = person.name || person.Name;
            const surname = person.surname || person.Surname || '';
            const nameKey = `${name.toLowerCase()} ${surname.toLowerCase()}`.trim();
            if (attendeeMap.has(nameKey)) {
              matchedId = attendeeMap.get(nameKey);
            }
          }
          else if (person.email || person.Email) {
            const email = (person.email || person.Email).toLowerCase();
            if (attendeeMap.has(email)) {
              matchedId = attendeeMap.get(email);
            }
          }

          console.log(`🔍 Matching:`, person, '->', matchedId);
          return matchedId;
        })
        .filter(Boolean);

      console.log('✅ Final checked-in IDs:', checkedInIds);

      if (checkedInIds.length > 0) {
        setEventCheckIns((prev) => ({
          ...prev,
          [currentEventId]: [...new Set([...(prev[currentEventId] || []), ...checkedInIds])]
        }));
        toast.success(`Loaded ${checkedInIds.length} previously checked-in attendees`);
      } else {
        console.log('ℹ️ No previously checked-in attendees found');
      }
    } catch (error) {
      console.error('❌ Error loading event check-ins:', error);
      const storedCheckIns = eventCheckIns[currentEventId] || [];
      if (storedCheckIns.length > 0) {
        console.log('🔄 Using stored check-ins from localStorage');
      }
    }
  };

  useEffect(() => {
    if (currentEventId && attendees.length > 0) {
      console.log('🎯 Event changed or attendees loaded, loading check-ins...');
      loadEventCheckIns();
    }
  }, [currentEventId, attendees]);

  const handleSaveAndCloseEvent = async () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }

    if (!window.confirm("Are you sure you want to close this event? This action cannot be undone.")) {
      return;
    }

    setIsClosingEvent(true);
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `${BASE_URL}/events/${currentEventId}`,
        { status: "closed" },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      setEvents(prev => prev.map(event =>
        event.id === currentEventId
          ? { ...event, status: "closed" }
          : event
      ));

      toast.success("Event closed successfully!");

      setCurrentEventId("");
      localStorage.removeItem("currentEventId");

    } catch (error) {
      console.error("Error closing event:", error);
      toast.error("Failed to close event");
    } finally {
      setIsClosingEvent(false);
    }
  };

  const handleViewEventDetails = async (eventId) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/events/${eventId}/checkins`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const attendanceData = toArray(response.data);

      setEventHistoryDetails({
        open: true,
        event: event,
        type: 'attendance',
        data: attendanceData
      });

    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to load event details");
    }
  };

  const handleViewNewPeople = async (eventId) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const newPeopleIds = eventNewPeople[eventId] || [];
      const newPeopleData = attendees.filter(attendee =>
        newPeopleIds.includes(attendee._id)
      );

      setEventHistoryDetails({
        open: true,
        event: event,
        type: 'newPeople',
        data: newPeopleData
      });

    } catch (error) {
      console.error("Error fetching new people:", error);
      toast.error("Failed to load new people data");
    }
  };

  const handleViewConsolidated = async (eventId) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const token = localStorage.getItem("token");
      let consolidatedData = [];

      try {
        const response = await axios.get(`${BASE_URL}/consolidations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            event_id: eventId
          }
        });

        if (response.data && response.data.consolidations) {
          consolidatedData = response.data.consolidations;
        }
      } catch (error) {
        console.log("Consolidations endpoint failed:", error.message);
      }

      setEventHistoryDetails({
        open: true,
        event: event,
        type: 'consolidated',
        data: consolidatedData
      });

    } catch (error) {
      console.error("Error fetching consolidated people:", error);
      toast.error("Failed to load consolidated data");
    }
  };

  useEffect(() => {
    console.log("🔄 Consolidated people updated:", consolidatedPeople.length, consolidatedPeople);
  }, [consolidatedPeople]);

  useEffect(() => {
    if (!consolidationOpen && currentEventId) {
      console.log("🔍 Consolidation modal closed, refreshing data...");
      fetchConsolidatedPeople();
    }
  }, [consolidationOpen]);

  useEffect(() => {
    const dataLoaded = localStorage.getItem("serviceCheckInDataLoaded") === "true";
    const hasCachedData = localStorage.getItem("attendees") && localStorage.getItem("events");

    if (dataLoaded && hasCachedData) {
      setHasDataLoaded(true);
      setIsLoadingPeople(false);
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("attendees", JSON.stringify(attendees));
  }, [attendees]);

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("currentEventId", currentEventId);
  }, [currentEventId]);

  useEffect(() => {
    localStorage.setItem("eventCheckIns", JSON.stringify(eventCheckIns));
  }, [eventCheckIns]);

  useEffect(() => {
    localStorage.setItem("eventNewPeople", JSON.stringify(eventNewPeople));
  }, [eventNewPeople]);

  useEffect(() => {
    localStorage.setItem("eventConsolidations", JSON.stringify(eventConsolidations));
  }, [eventConsolidations]);

  const toArray = (resData) =>
    Array.isArray(resData)
      ? resData
      : Array.isArray(resData?.results)
        ? resData.results
        : Array.isArray(resData?.events)
          ? resData.events
          : [];

  const getAttendeesWithPresentStatus = () => {
    const currentEventCheckIns = eventCheckIns[currentEventId] || [];
    console.log('📊 Current event check-ins:', currentEventCheckIns);

    return attendees.map((attendee) => ({
      ...attendee,
      present: currentEventCheckIns.includes(attendee._id),
      id: attendee._id,
    }));
  };

  // const fetchConsolidatedPeople = async () => {
  //   if (!currentEventId) {
  //     setConsolidatedPeople([]);
  //     return;
  //   }

  //   setIsLoadingConsolidated(true);
  //   try {
  //     const token = localStorage.getItem("token");
  //     let consolidatedData = [];

  //     console.log("🔄 Fetching consolidated people for event:", currentEventId);

  //     try {
  //       console.log("📊 Calling consolidations endpoint...");
  //       const response = await axios.get(`${BASE_URL}/consolidations`, {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //         },
  //         params: {
  //           event_id: currentEventId
  //         }
  //       });

  //       console.log("📊 Consolidations API response:", response.data);

  //       if (response.data && response.data.consolidations) {
  //         consolidatedData = response.data.consolidations;
  //         console.log(`✅ Found ${consolidatedData.length} consolidations from /consolidations endpoint`);
  //       } else {
  //         console.log("❌ No consolidations data in response");
  //       }
  //     } catch (error) {
  //       console.log("❌ Consolidations endpoint failed:", error.message);
  //     }

  //     if (consolidatedData.length === 0) {
  //       try {
  //         console.log("📊 Trying event-specific consolidations endpoint...");
  //         const eventConsolidationsResponse = await axios.get(`${BASE_URL}/events/${currentEventId}/consolidations`, {
  //           headers: {
  //             'Authorization': `Bearer ${token}`,
  //           }
  //         });

  //         console.log("📊 Event consolidations response:", eventConsolidationsResponse.data);

  //         if (eventConsolidationsResponse.data && eventConsolidationsResponse.data.consolidations) {
  //           consolidatedData = eventConsolidationsResponse.data.consolidations;
  //           console.log(`✅ Found ${consolidatedData.length} consolidations from event endpoint`);
  //         }
  //       } catch (error) {
  //         console.log("❌ Event consolidations endpoint failed:", error.message);
  //       }
  //     }

  //     if (consolidatedData.length === 0) {
  //       try {
  //         console.log("📊 Checking for consolidation tasks...");
  //         const tasksResponse = await axios.get(`${BASE_URL}/tasks`, {
  //           headers: {
  //             'Authorization': `Bearer ${token}`,
  //           },
  //           params: {
  //             taskType: "consolidation",
  //             event_id: currentEventId
  //           }
  //         });

  //         console.log("📋 Tasks API response:", tasksResponse.data);

  //         if (tasksResponse.data && Array.isArray(tasksResponse.data.tasks)) {
  //           consolidatedData = tasksResponse.data.tasks.map(task => ({
  //             _id: task._id,
  //             name: task.contacted_person?.name || task.person_name,
  //             surname: "",
  //             email: task.contacted_person?.email || task.person_email,
  //             phone: task.contacted_person?.phone || task.person_phone,
  //             assigned_to: task.assignedfor || task.assignedTo,
  //             decision_type: task.decision_type || task.consolidation_type,
  //             decision_date: task.followup_date,
  //             status: task.status,
  //             task_id: task._id,
  //             is_from_task: true
  //           }));
  //           console.log(`✅ Found ${consolidatedData.length} consolidation tasks`);
  //         }
  //       } catch (error) {
  //         console.log("❌ Tasks endpoint failed:", error.message);
  //       }
  //     }

  //     if (consolidatedData.length === 0) {
  //       try {
  //         console.log("📊 Checking event attendees for consolidation flags...");
  //         const eventResponse = await axios.get(`${BASE_URL}/events/${currentEventId}`);
  //         const event = eventResponse.data;

  //         const consolidatedAttendees = event.attendees?.filter(attendee =>
  //           attendee.is_consolidation ||
  //           attendee.consolidation_id ||
  //           attendee.decision ||
  //           attendee.decision_type
  //         ) || [];

  //         if (consolidatedAttendees.length > 0) {
  //           consolidatedData = consolidatedAttendees.map(attendee => ({
  //             _id: attendee.consolidation_id || attendee.id,
  //             name: attendee.name || attendee.person_name,
  //             surname: attendee.surname || attendee.person_surname || "",
  //             email: attendee.email || attendee.person_email,
  //             phone: attendee.phone || attendee.person_phone,
  //             assigned_to: attendee.assigned_to || "Not assigned",
  //             decision_type: attendee.decision || attendee.decision_type,
  //             decision_date: attendee.time || new Date().toISOString(),
  //             status: "active",
  //             is_from_attendee: true
  //           }));
  //           console.log(`✅ Found ${consolidatedData.length} consolidated attendees`);
  //         }
  //       } catch (error) {
  //         console.log("❌ Events endpoint failed:", error.message);
  //       }
  //     }

  //     console.log("✅ Final consolidated data:", consolidatedData);
  //     setConsolidatedPeople(consolidatedData);

  //   } catch (error) {
  //     console.error("💥 Error fetching consolidated people:", error);
  //     setConsolidatedPeople([]);
  //   } finally {
  //     setIsLoadingConsolidated(false);
  //   }
  // };
// Replace your current fetchConsolidatedPeople function with this:
const fetchConsolidatedPeople = async () => {
  if (!currentEventId) {
    setConsolidatedPeople([]);
    return;
  }

  setIsLoadingConsolidated(true);
  try {
    const token = localStorage.getItem("token");
    let consolidatedData = [];

    console.log("🔄 Fetching consolidated people for event:", currentEventId);

    // Try multiple endpoints to get consolidation data
    try {
      const response = await axios.get(`${BASE_URL}/consolidations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          event_id: currentEventId
        }
      });

      if (response.data && response.data.consolidations) {
        consolidatedData = response.data.consolidations;
        console.log(`✅ Found ${consolidatedData.length} consolidations from /consolidations endpoint`);
      }
    } catch (error) {
      console.log("❌ Consolidations endpoint failed:", error.message);
    }

    // If no data from consolidations endpoint, try tasks
    if (consolidatedData.length === 0) {
      try {
        const tasksResponse = await axios.get(`${BASE_URL}/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            taskType: "consolidation",
            event_id: currentEventId
          }
        });

        if (tasksResponse.data && Array.isArray(tasksResponse.data.tasks)) {
          consolidatedData = tasksResponse.data.tasks.map(task => ({
            _id: task._id,
            name: task.contacted_person?.name || task.person_name || task.recipient_name,
            surname: "",
            email: task.contacted_person?.email || task.person_email || task.recipient_email,
            phone: task.contacted_person?.phone || task.person_phone || task.recipient_phone,
            assigned_to: task.assignedfor || task.assignedTo,
            decision_type: task.decision_type || task.consolidation_type || "Commitment", // Default to Commitment
            decision_date: task.followup_date || task.decision_date,
            status: task.status,
            task_id: task._id,
            is_from_task: true
          }));
          console.log(`✅ Found ${consolidatedData.length} consolidation tasks`);
        }
      } catch (error) {
        console.log("❌ Tasks endpoint failed:", error.message);
      }
    }

    // Update event consolidations count
    setEventConsolidations((prev) => ({
      ...prev,
      [currentEventId]: consolidatedData.length
    }));

    console.log("✅ Final consolidated data:", consolidatedData);
    setConsolidatedPeople(consolidatedData);

  } catch (error) {
    console.error("💥 Error fetching consolidated people:", error);
    setConsolidatedPeople([]);
    setEventConsolidations((prev) => ({
      ...prev,
      [currentEventId]: 0
    }));
  } finally {
    setIsLoadingConsolidated(false);
  }
};
  
  useEffect(() => {
    if (currentEventId) {
      fetchConsolidatedPeople();
    } else {
      setConsolidatedPeople([]);
    }
  }, [currentEventId]);

useEffect(() => {
  if (hasDataLoaded) return;

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/events/global`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('📋 Global events data:', data);

      // Handle different response structures
      const eventsData = data.events || data.results || [];
      
      console.log('✅ Global events found:', eventsData.map(e => ({
        id: e._id || e.id,
        name: e.eventName,
        status: e.status,
        isGlobal: e.isGlobal
      })));

      const transformedEvents = eventsData.map(event => ({
        id: event._id || event.id,
        eventName: event.eventName || event.name || "Unnamed Event",
        status: event.status || "open",
        isGlobal: event.isGlobal || true, // Since we're fetching from /events/global
        isTicketed: event.isTicketed || false,
        date: event.date || event.createdAt || event.created_at,
        eventType: event.eventType || "Global Events"
      }));

      console.log('🎯 Transformed global events for dropdown:', transformedEvents);
      setEvents(transformedEvents);

    } catch (err) {
      console.error('❌ Error fetching global events:', err);
      toast.error(err.response?.data?.detail || "Failed to fetch global events");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  fetchEvents();
}, [hasDataLoaded]);

  const fetchRemainingPeople = async (startPage, perPage, total, currentPeople) => {
    try {
      let allPeople = [...currentPeople];
      let page = startPage;

      while (allPeople.length < total) {
        const res = await axios.get(
          `${BASE_URL}/people?page=${page}&perPage=${perPage}`
        );
        const results = toArray(res.data);
        const peoplePage = results.map((p) => ({
          _id: p._id || p.id || `${p.Email || p.Name || ""}-${page}`,
          name: p.Name || p.name || "",
          surname: p.Surname || p.surname || "",
          email: p.Email || p.email || "",
          phone: p.Number || p.Phone || p.phone || "",
          leader1: p["Leader @1"] || p.leader1 || "",
          leader12: p["Leader @12"] || p.leader12 || "",
          leader144: p["Leader @144"] || p.leader144 || "",
        }));

        allPeople = allPeople.concat(peoplePage);

        setAttendees([...allPeople]);

        if (results.length === 0) break;
        page += 1;
      }

      console.log(`✅ Loaded all ${allPeople.length} people in background`);
    } catch (err) {
      console.error("Background fetch error:", err);
    }
  };

  const handleConsolidationClick = () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }
    setConsolidationOpen(true);
  };

const handleFinishConsolidation = async (task) => {
  console.log("🎯 Consolidation task completed:", task);

  if (currentEventId) {
    try {
      setConsolidationOpen(false);

      toast.success(`Consolidation task created for ${task.recipientName}`);

      // Immediately update the consolidated people list
      const newConsolidatedPerson = {
        _id: task.task_id || `temp-${Date.now()}`,
        name: task.recipientName?.split(' ')[0] || 'Unknown',
        surname: task.recipientName?.split(' ').slice(1).join(' ') || '',
        email: task.recipient_email || '',
        phone: task.recipient_phone || '',
        assigned_to: task.assignedTo,
        decision_type: task.decisionType || task.taskStage || "Commitment",
        decision_date: new Date().toISOString(),
        status: "Open",
        is_new: true
      };

      // Add to consolidated people immediately
      setConsolidatedPeople(prev => [...prev, newConsolidatedPerson]);

      // Update the count in eventConsolidations
      setEventConsolidations((prev) => ({
        ...prev,
        [currentEventId]: (prev[currentEventId] || 0) + 1,
      }));

      // Refresh from server after a short delay
      setTimeout(async () => {
        await fetchConsolidatedPeople();
      }, 1000);

    } catch (error) {
      console.error("❌ Error in consolidation completion:", error);
      toast.error("Task created but failed to refresh list");
    }
  }
};

  const handleEditClick = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || "",
      surname: person.surname || "",
      dob: person.dob || "",
      homeAddress: person.homeAddress || "",
      email: person.email || "",
      phone: person.phone || "",
      gender: person.gender || "",
      invitedBy: person.invitedBy || "",
      leader1: person.leader1 || "",
      leader12: person.leader12 || "",
      leader144: person.leader144 || "",
    });
    setOpenDialog(true);
  };

  const handlePersonSave = (responseData) => {
    if (!currentEventId) {
      toast.error("Please select an event first before adding people");
      return;
    }

    const newPersonData = responseData.person || responseData;
    const newPersonId = responseData.id || responseData._id || newPersonData._id;

    const newPerson = {
      _id: newPersonId,
      name: newPersonData.Name || formData.name,
      surname: newPersonData.Surname || formData.surname,
      email: newPersonData.Email || formData.email,
      phone: newPersonData.Phone || newPersonData.Number || formData.phone,
      leader1: newPersonData["Leader @1"] || formData.leader1 || "",
      leader12: newPersonData["Leader @12"] || formData.leader12 || "",
      leader144: newPersonData["Leader @144"] || formData.leader144 || "",
    };

    let isNew = false;

    setAttendees((prevAttendees) => {
      const exists = prevAttendees.some((att) => att._id === newPersonId);
      if (exists) return prevAttendees.map((att) => (att._id === newPersonId ? newPerson : att));
      isNew = true;
      newPerson.isNew = true;
      return [newPerson, ...prevAttendees];
    });

    if (isNew) {
      setFirstTimeAddedIds((prev) => [...prev, newPersonId]);

      if (currentEventId) {
        setEventNewPeople((prev) => ({
          ...prev,
          [currentEventId]: [...(prev[currentEventId] || []), newPersonId],
        }));
      }

      setPage(0);
      toast.success(`${newPerson.name} ${newPerson.surname} added successfully!`);

      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const timeUntilMidnight = endOfDay.getTime() - now.getTime();

      setTimeout(() => {
        setFirstTimeAddedIds((prev) => prev.filter((id) => id !== newPersonId));
      }, timeUntilMidnight);
    } else {
      toast.success(`${newPerson.name} ${newPerson.surname} updated successfully!`);
    }
  };

  const handleDelete = async (personId) => {
    try {
      const res = await fetch(`${BASE_URL}/people/${personId}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Delete failed: ${errorData.detail}`);
        return;
      }
      setAttendees((prev) => prev.filter((p) => p._id !== personId));
      toast.success("Person deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the person");
    }
  };

  const handleToggleCheckIn = async (attendee) => {
    if (!currentEventId) {
      toast.error("Please select an event");
      return;
    }

    try {
      const isCurrentlyPresent = attendee.present;
      if (!isCurrentlyPresent) {
        const res = await axios.post(`${BASE_URL}/checkin`, {
          event_id: currentEventId,
          name: attendee.name,
        });
        toast.success(res.data?.message || "Checked in");
        setEventCheckIns((prev) => ({
          ...prev,
          [currentEventId]: [...(prev[currentEventId] || []), attendee._id],
        }));
      } else {
        const res = await axios.post(`${BASE_URL}/uncapture`, {
          event_id: currentEventId,
          name: attendee.name,
        });
        toast.info(res.data?.message || "Uncaptured");
        setEventCheckIns((prev) => ({
          ...prev,
          [currentEventId]: (prev[currentEventId] || []).filter((id) => id !== attendee._id),
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.message);
    }
  };

  const attendeesWithStatus = getAttendeesWithPresentStatus();

  const newPeopleForEvent = currentEventId && eventNewPeople[currentEventId]
    ? attendeesWithStatus.filter(a => eventNewPeople[currentEventId].includes(a._id))
    : [];

  const consolidationsForEvent = currentEventId && eventConsolidations[currentEventId]
    ? eventConsolidations[currentEventId]
    : 0;

  const filteredAttendees = attendeesWithStatus.filter((a) => {
    const lc = search.toLowerCase();
    const bag = [
      a.name,
      a.surname,
      a.email,
      a.phone,
      a.leader1,
      a.leader12,
      a.leader144,
      firstTimeAddedIds.includes(a._id) ? "first time" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return bag.includes(lc);
  });

  const paginatedAttendees = filteredAttendees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const presentCount = attendeesWithStatus.filter((a) => a.present).length;

  const modalBaseList = attendeesWithStatus.filter((a) => a.present);
  const modalFilteredAttendees = modalBaseList.filter((a) => {
    const lc = modalSearch.toLowerCase();
    const bag = [a.name, a.surname, a.email, a.phone, a.leader1, a.leader12, a.leader144]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return bag.includes(lc);
  });
  const modalPaginatedAttendees = modalFilteredAttendees.slice(
    modalPage * modalRowsPerPage,
    modalPage * modalRowsPerPage + modalRowsPerPage
  );

  const newPeopleFilteredList = newPeopleForEvent.filter((a) => {
    const lc = newPeopleSearch.toLowerCase();
    const bag = [a.name, a.surname, a.email, a.phone, a.leader1, a.leader12, a.leader144]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return bag.includes(lc);
  });
  const newPeoplePaginatedList = newPeopleFilteredList.slice(
    newPeoplePage * newPeopleRowsPerPage,
    newPeoplePage * newPeopleRowsPerPage + newPeopleRowsPerPage
  );

  const filteredConsolidatedPeople = consolidatedPeople.filter((person) => {
    const lc = consolidatedSearch.toLowerCase();
    const searchString = `${person.name || ''} ${person.surname || ''} ${person.email || ''} ${person.phone || ''} ${person.assigned_to || ''} ${person.decision_type || ''}`.toLowerCase();
    return searchString.includes(lc);
  });

  const consolidatedPaginatedList = filteredConsolidatedPeople.slice(
    consolidatedPage * consolidatedRowsPerPage,
    consolidatedPage * consolidatedRowsPerPage + consolidatedRowsPerPage
  );

  useEffect(() => {
    console.log("🔍 DEBUG: Current Event ID:", currentEventId);
    console.log("🔍 DEBUG: Consolidated People Count:", consolidatedPeople.length);
    console.log("🔍 DEBUG: Consolidated People Data:", consolidatedPeople);
  }, [currentEventId, consolidatedPeople]);

  const handleAddPersonClick = () => {
    if (!currentEventId) {
      toast.error("Please select an event first before adding people");
      return;
    }
    setOpenDialog(true);
  };

  const AttendeeCard = ({ attendee, showNumber, index }) => (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        boxShadow: 2,
        "&:last-child": { mb: 0 },
        ...(firstTimeAddedIds.includes(attendee._id) && {
          border: `2px solid ${theme.palette.success.main}`,
          backgroundColor: theme.palette.success.light + "0a",
        }),
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {showNumber && `${index}. `}{attendee.name} {attendee.surname}
              {firstTimeAddedIds.includes(attendee._id) && (
                <Chip label="First Time" size="small" sx={{ ml: 1, fontSize: "0.7rem", height: 20 }} color="success" />
              )}
            </Typography>
            {attendee.email && <Typography variant="body2" color="text.secondary">{attendee.email}</Typography>}
            {attendee.phone && <Typography variant="body2" color="text.secondary">{attendee.phone}</Typography>}
          </Box>
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end" mb={1}>
          <IconButton onClick={() => handleEditClick(attendee)} color="primary" size="small">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => handleDelete(attendee._id)} color="error" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => handleToggleCheckIn(attendee)} color="success" disabled={!currentEventId} size="small">
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

const ConsolidatedPersonCard = ({ person, showNumber, index }) => {
  // Normalize decision type
  const getDecisionType = (type) => {
    if (!type) return 'Commitment'; // Default to Commitment
    
    const lowerType = type.toLowerCase();
    if (lowerType.includes('commitment') || lowerType.includes('first_time')) {
      return 'Commitment';
    } else if (lowerType.includes('recommitment')) {
      return 'Recommitment';
    }
    return 'Commitment'; // Default fallback
  };

  const decisionType = getDecisionType(person.decision_type);

  useEffect(() => {
  if (currentEventId) {
    fetchConsolidatedPeople();
  }
}, [currentEventId, events]);
  
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        boxShadow: 2,
        "&:last-child": { mb: 0 },
        border: `2px solid ${theme.palette.secondary.main}`,
        backgroundColor: theme.palette.secondary.light + "0a",
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {showNumber && `${index}. `}{person.name || person.person_name} {person.surname || person.person_surname}
              <Chip
                label={decisionType}
                size="small"
                sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                color={decisionType === 'Commitment' ? 'secondary' : 'primary'}
              />
            </Typography>
            {person.email && <Typography variant="body2" color="text.secondary">{person.email}</Typography>}
            {person.phone && <Typography variant="body2" color="text.secondary">{person.phone}</Typography>}
          </Box>
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end" mb={1}>
          <Chip
            label={`Assigned to: ${person.assigned_to || person.assignedTo || 'Not assigned'}`}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Stack>

        {(person.decision_date || person.decision_type) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {person.decision_date && (
                <Chip 
                  label={`Date: ${new Date(person.decision_date).toLocaleDateString()}`} 
                  size="small" 
                  variant="outlined" 
                  sx={{ fontSize: "0.7rem", height: 20 }} 
                />
              )}
              <Chip
                label={`Type: ${decisionType}`}
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
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
};
  const mainColumns = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            {params.row.name} {params.row.surname}
          </Typography>
          {firstTimeAddedIds.includes(params.row._id) && (
            <Chip label="First Time" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem' }} />
          )}
        </Box>
      )
    },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120 },
    { field: 'leader1', headerName: 'Leader @1', flex: 0.8, minWidth: 100 },
    { field: 'leader12', headerName: 'Leader @12', flex: 0.8, minWidth: 100 },
    { field: 'leader144', headerName: 'Leader @144', flex: 0.8, minWidth: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row._id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="primary" onClick={() => handleEditClick(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="success"
            disabled={!currentEventId}
            onClick={() => handleToggleCheckIn(params.row)}
          >
            {params.row.present ? <CheckCircleIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
          </IconButton>
        </Stack>
      )
    }
  ];

  const EventHistoryDetailsModal = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const filteredData = eventHistoryDetails.data.filter(item => {
      const searchString = `${item.name || ''} ${item.surname || ''} ${item.email || ''} ${item.phone || ''}`.toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });

    const paginatedData = filteredData.slice(
      currentPage * rowsPerPage,
      currentPage * rowsPerPage + rowsPerPage
    );

    const getModalTitle = () => {
      const eventName = eventHistoryDetails.event?.eventName || "Event";
      switch (eventHistoryDetails.type) {
        case 'attendance':
          return `Attendance for ${eventName}`;
        case 'newPeople':
          return `New People for ${eventName}`;
        case 'consolidated':
          return `Consolidated People for ${eventName}`;
        default:
          return `Event Details for ${eventName}`;
      }
    };

    const getColumnHeaders = () => {
      switch (eventHistoryDetails.type) {
        case 'attendance':
          return ['Name', 'Email', 'Phone', 'Leader @1', 'Leader @12', 'Leader @144'];
        case 'newPeople':
          return ['Name', 'Email', 'Phone', 'Leader @1', 'Leader @12', 'Leader @144'];
        case 'consolidated':
          return ['Name', 'Email', 'Phone', 'Decision Type', 'Assigned To', 'Status'];
        default:
          return ['Name', 'Email', 'Phone'];
      }
    };

useEffect(() => {
  console.log('📊 Current events state:', events);
  console.log('🎯 Filtered events:', getFilteredEvents().map(e => ({
    id: e.id,
    name: e.eventName,
    type: e.eventType,
    status: e.status,
    isGlobal: e.isGlobal
  })));
  console.log('🔒 Current event ID:', currentEventId);
}, [events, currentEventId]);

    return (
      <Dialog
        open={eventHistoryDetails.open}
        onClose={() => setEventHistoryDetails(prev => ({ ...prev, open: false }))}
        fullWidth
        maxWidth="lg"
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
          {getModalTitle()}
          <Typography variant="body2" color="text.secondary">
            Total: {eventHistoryDetails.data.length}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
            fullWidth
            sx={{ mb: 2, boxShadow: 1 }}
          />

          {isSmDown ? (
            <Box>
              {paginatedData.map((item, idx) => (
                <Card key={item._id || item.id || idx} variant="outlined" sx={{ mb: 1, boxShadow: 2 }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item.name} {item.surname}
                    </Typography>
                    {item.email && <Typography variant="body2" color="text.secondary">{item.email}</Typography>}
                    {item.phone && <Typography variant="body2" color="text.secondary">{item.phone}</Typography>}
                    {eventHistoryDetails.type === 'consolidated' && (
                      <>
                        <Chip
                          label={item.decision_type === 'first_time' ? 'First Time' : 'Recommitment'}
                          size="small"
                          sx={{ mt: 0.5 }}
                          color="secondary"
                        />
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Assigned to: {item.assigned_to || 'Not assigned'}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              {paginatedData.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No matching data
                </Typography>
              )}
            </Box>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  {getColumnHeaders().map(header => (
                    <TableCell key={header} sx={{ fontWeight: 600 }}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((item, idx) => (
                  <TableRow key={item._id || item.id || idx} hover>
                    <TableCell>{currentPage * rowsPerPage + idx + 1}</TableCell>
                    <TableCell>{item.name} {item.surname}</TableCell>
                    <TableCell>{item.email || "—"}</TableCell>
                    <TableCell>{item.phone || "—"}</TableCell>
                    {eventHistoryDetails.type !== 'consolidated' ? (
                      <>
                        <TableCell>{item.leader1 || "—"}</TableCell>
                        <TableCell>{item.leader12 || "—"}</TableCell>
                        <TableCell>{item.leader144 || "—"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <Chip
                            label={item.decision_type === 'first_time' ? 'First Time' : 'Recommitment'}
                            size="small"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell>{item.assigned_to || "Not assigned"}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.status || 'Active'}
                            size="small"
                            color={item.status === 'completed' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={getColumnHeaders().length + 1} align="center">
                      No matching data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <Box mt={1}>
            <TablePagination
              component="div"
              count={filteredData.length}
              page={currentPage}
              onPageChange={(e, newPage) => setCurrentPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setCurrentPage(0); }}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button
            onClick={() => setEventHistoryDetails(prev => ({ ...prev, open: false }))}
            variant="outlined"
            size={isSmDown ? "small" : "medium"}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const SkeletonLoader = () => (
    <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: getResponsiveValue(2, 3, 4, 5, 5), minHeight: "100vh" }}>
      <ToastContainer position={isSmDown ? "bottom-center" : "top-right"} autoClose={3000} hideProgressBar={isSmDown} />

      <Skeleton
        variant="text"
        width="60%"
        height={getResponsiveValue(32, 40, 48, 56, 56)}
        sx={{ mx: 'auto', mb: cardSpacing, borderRadius: 1 }}
      />

      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={6} sm={6} md={3} key={item}>
            <Paper variant="outlined" sx={{ p: getResponsiveValue(1.5, 2, 2.5, 3, 3), textAlign: "center" }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
                <Skeleton variant="circular" width={getResponsiveValue(20, 24, 28, 32, 32)} height={getResponsiveValue(20, 24, 28, 32, 32)} />
                <Skeleton variant="text" width="40%" height={getResponsiveValue(24, 28, 32, 36, 40)} sx={{ borderRadius: 1 }} />
              </Stack>
              <Skeleton variant="text" width="70%" height={getResponsiveValue(16, 18, 20, 22, 24)} sx={{ mx: 'auto', borderRadius: 1 }} />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={cardSpacing} mb={cardSpacing} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <Skeleton variant="rounded" height={getResponsiveValue(36, 40, 44, 48, 52)} sx={{ borderRadius: 1, boxShadow: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6} md={5}>
          <Skeleton variant="rounded" height={getResponsiveValue(36, 40, 44, 48, 52)} sx={{ borderRadius: 1, boxShadow: 2 }} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={2} justifyContent={isMdDown ? "center" : "flex-end"}>
            <Skeleton variant="circular" width={36} height={36} />
            <Skeleton variant="circular" width={36} height={36} />
          </Stack>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ mb: 2, boxShadow: 3, p: 1 }}>
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
              <Card key={item} variant="outlined" sx={{ mb: 1, boxShadow: 2 }}>
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
        <Paper variant="outlined" sx={{ height: 600, boxShadow: 3, p: 2 }}>
          <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rounded" width="100%" height={400} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 2, borderRadius: 1 }} />
        </Paper>
      )}
    </Box>
  );

  if (!hasDataLoaded && (isLoadingPeople || isLoadingEvents)) {
    return <SkeletonLoader />;
  }

  return (
    <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: getResponsiveValue(2, 3, 4, 5, 5), minHeight: "100vh" }}>
      <ToastContainer position={isSmDown ? "bottom-center" : "top-right"} autoClose={3000} hideProgressBar={isSmDown} />

      {/* Stats Cards */}
      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
              textAlign: "center",
              cursor: "pointer",
              boxShadow: 3,
              "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
              transition: "all 0.2s"
            }}
            onClick={() => { setModalOpen(true); setModalSearch(""); setModalPage(0); }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <GroupIcon color="primary" sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color="primary">{presentCount}</Typography>
            </Stack>
            <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
              Present
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
              textAlign: "center",
              cursor: "pointer",
              boxShadow: 3,
              "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
              transition: "all 0.2s"
            }}
            onClick={() => { setNewPeopleModalOpen(true); setNewPeopleSearch(""); setNewPeoplePage(0); }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <PersonAddAltIcon color="success" sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color="success.main">
                {newPeopleForEvent.length}
              </Typography>
            </Stack>
            <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
              New People
            </Typography>
          </Paper>
        </Grid>
<Grid item xs={6} sm={6} md={3}>
  <Paper
    variant="outlined"
    sx={{
      p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
      textAlign: "center",
      cursor: "pointer",
      boxShadow: 3,
      "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
      transition: "all 0.2s"
    }}
    onClick={() => { setConsolidatedModalOpen(true); setConsolidatedSearch(""); setConsolidatedPage(0); }}
  >
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
      <MergeIcon color="secondary" sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
      <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color="secondary.main">
        {consolidatedPeople.length} {/* This should now update properly */}
      </Typography>
    </Stack>
    <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
      Consolidated
    </Typography>
  </Paper>
</Grid>
      </Grid>

      {/* Controls */}
      <Grid container spacing={cardSpacing} mb={cardSpacing} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
<Select
  size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
  value={currentEventId}
  onChange={(e) => {
    console.log('🎯 Selected event ID:', e.target.value);
    setCurrentEventId(e.target.value);
  }}
  displayEmpty
  fullWidth
  sx={{ boxShadow: 2 }}
>
  <MenuItem value="">
    <Typography color="text.secondary">
      Select Global Event
    </Typography>
  </MenuItem>
  
  {/* Debug info */}
  {console.log('🔄 Rendering dropdown with events:', getFilteredEvents())}
  
  {getFilteredEvents().map((ev) => (
    <MenuItem key={ev.id} value={ev.id}>
      <Typography variant="body2" fontWeight="medium">
        {ev.eventName}
      </Typography>
    </MenuItem>
  ))}
  {getFilteredEvents().length === 0 && events.length > 0 && (
    <MenuItem disabled>
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        No open global events
      </Typography>
    </MenuItem>
  )}
  {events.length === 0 && (
    <MenuItem disabled>
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        No events loaded
      </Typography>
    </MenuItem>
  )}
</Select>
        </Grid>
        <Grid item xs={12} sm={6} md={5}>
          <TextField
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
            placeholder="Search attendees..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            fullWidth
            sx={{ boxShadow: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Stack direction="row" spacing={2} justifyContent={isMdDown ? "center" : "flex-end"}>
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
              {/* Consolidation Icon */}
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

              {/* Save Button */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="center"
                sx={{
                  cursor: currentEventId ? "pointer" : "not-allowed",
                  opacity: currentEventId ? 1 : 0.5,
                  "&:hover": currentEventId ? { transform: "translateY(-2px)" } : {},
                  transition: "all 0.2s"
                }}
                onClick={currentEventId ? handleSaveAndCloseEvent : undefined}
              >
                {isClosingEvent ? (
                  <Skeleton
                    variant="circular"
                    width={36}
                    height={36}
                  />
                ) : (
                  <SaveIcon
                    sx={{
                      fontSize: 36,
                      color: currentEventId ? (isDarkMode ? "white" : "black") : "text.disabled",
                      "&:hover": currentEventId ? { color: "secondary.dark" } : {},
                      filter: currentEventId ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" : "none",
                    }}
                  />
                )}
              </Stack>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      {/* Main Attendees List */}
      <Box sx={{ minHeight: 400 }}>
        <Paper variant="outlined" sx={{ mb: 2, boxShadow: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All Attendees" />
            <Tab label="Event History" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          isMdDown ? (
            <Box>
              <Box
                sx={{
                  maxHeight: 500,
                  overflowY: "auto",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  p: 1,
                  boxShadow: 2
                }}
              >
                {paginatedAttendees.map((att, idx) => (
                  <AttendeeCard key={att._id} attendee={att} showNumber={true} index={page * rowsPerPage + idx + 1} />
                ))}
              </Box>

              <TablePagination
                component="div"
                count={filteredAttendees.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[25, 50, 100]}
                sx={{ boxShadow: 2, borderRadius: 1, mt: 1 }}
              />
            </Box>
          ) : (
            <Box>
              <Paper variant="outlined" sx={{ height: 600, boxShadow: 3 }}>
                <DataGrid
                  rows={filteredAttendees}
                  columns={mainColumns}
                  pageSizeOptions={[25, 50, 100]}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                      quickFilterProps: { debounceMs: 500 },
                    },
                  }}
                  disableRowSelectionOnClick
                  initialState={{
                    pagination: { paginationModel: { pageSize: 100 } },
                  }}
                  sx={{
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                />
              </Paper>
            </Box>
          )
        )}

        {activeTab === 1 && (
          <Box>
            <EventHistory
              onViewDetails={handleViewEventDetails}
              onViewNewPeople={handleViewNewPeople}
              onViewConverts={handleViewConsolidated}
              events={getClosedEvents()}
            />
          </Box>
        )}
      </Box>

      {/* Add / Edit Dialog */}
      <AddPersonDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setEditingPerson(null); }}
        onSave={handlePersonSave}
        formData={formData}
        setFormData={setFormData}
        isEdit={Boolean(editingPerson)}
        personId={editingPerson?._id || null}
      />

      {/* Event History Details Modal */}
      <EventHistoryDetailsModal />

      {/* PRESENT Attendees Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
          Attendees Present: {presentCount}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField
            size="small"
            placeholder="Search present attendees..."
            value={modalSearch}
            onChange={(e) => { setModalSearch(e.target.value); setModalPage(0); }}
            fullWidth
            sx={{ mb: 2, boxShadow: 1 }}
          />

          {isSmDown ? (
            <Box>
              {modalPaginatedAttendees.map((a, idx) => (
                <Card key={a._id} variant="outlined" sx={{ mb: 1, boxShadow: 2, "&:last-child": { mb: 0 } }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                          {modalPage * modalRowsPerPage + idx + 1}. {a.name} {a.surname}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mt={0.5}>
                          {a.leader1 && (
                            <Chip label={`@1: ${a.leader1}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                          {a.leader12 && (
                            <Chip label={`@12: ${a.leader12}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                          {a.leader144 && (
                            <Chip label={`@144: ${a.leader144}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                        </Stack>
                      </Box>
                      <IconButton color="error" size="small" onClick={() => handleToggleCheckIn(a)}>
                        <CheckCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
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
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Leader@1</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Leader@12</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Leader@144</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modalPaginatedAttendees.map((a, idx) => (
                  <TableRow key={a._id} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                    <TableCell>{modalPage * modalRowsPerPage + idx + 1}</TableCell>
                    <TableCell>{a.name} {a.surname}</TableCell>
                    <TableCell>{a.leader1 || "—"}</TableCell>
                    <TableCell>{a.leader12 || "—"}</TableCell>
                    <TableCell>{a.leader144 || "—"}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => handleToggleCheckIn(a)}>
                        <CheckCircleOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {modalPaginatedAttendees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No matching attendees</TableCell>
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
              sx={{
                ...(isSmDown && {
                  '& .MuiTablePagination-toolbar': {
                    minHeight: 40,
                    paddingLeft: 1,
                    paddingRight: 1,
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.8rem',
                  }
                })
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
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
          New People: {newPeopleForEvent.length}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField
            size="small"
            placeholder="Search new people..."
            value={newPeopleSearch}
            onChange={(e) => { setNewPeopleSearch(e.target.value); setNewPeoplePage(0); }}
            fullWidth
            sx={{ mb: 2, boxShadow: 1 }}
          />

          {!currentEventId ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              Please select an event to view new people
            </Typography>
          ) : newPeopleForEvent.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No new people added for this event
            </Typography>
          ) : (
            <>
              {isSmDown ? (
                <Box>
                  {newPeoplePaginatedList.map((a, idx) => (
                    <Card key={a._id} variant="outlined" sx={{ mb: 1, boxShadow: 2, "&:last-child": { mb: 0 } }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                          {newPeoplePage * newPeopleRowsPerPage + idx + 1}. {a.name} {a.surname}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {a.phone || "No phone"}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mt={0.5}>
                          {a.leader1 && (
                            <Chip label={`@1: ${a.leader1}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                          {a.leader12 && (
                            <Chip label={`@12: ${a.leader12}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                          {a.leader144 && (
                            <Chip label={`@144: ${a.leader144}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
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
                      <TableCell sx={{ fontWeight: 600 }}>Leader @1</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Leader @12</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Leader @144</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {newPeoplePaginatedList.map((a, idx) => (
                      <TableRow key={a._id} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                        <TableCell>{newPeoplePage * newPeopleRowsPerPage + idx + 1}</TableCell>
                        <TableCell>{a.name} {a.surname}</TableCell>
                        <TableCell>{a.phone || "—"}</TableCell>
                        <TableCell>{a.email || "—"}</TableCell>
                        <TableCell>{a.leader1 || "—"}</TableCell>
                        <TableCell>{a.leader12 || "—"}</TableCell>
                        <TableCell>{a.leader144 || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {newPeoplePaginatedList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No matching people</TableCell>
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
          Consolidated People: {consolidatedPeople.length}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          <TextField
            size="small"
            placeholder="Search consolidated people..."
            value={consolidatedSearch}
            onChange={(e) => { setConsolidatedSearch(e.target.value); setConsolidatedPage(0); }}
            fullWidth
            sx={{ mb: 2, boxShadow: 1 }}
          />

          {!currentEventId ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              Please select an event to view consolidated people
            </Typography>
          ) : isLoadingConsolidated ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Loading consolidated people...
              </Typography>
            </Box>
          ) : consolidatedPeople.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No consolidated people for this event
            </Typography>
          ) : (
            <>
              {isSmDown ? (
                <Box>
                  {consolidatedPaginatedList.map((person, idx) => (
                    <ConsolidatedPersonCard
                      key={person._id || person.id || idx}
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
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consolidatedPaginatedList.map((person, idx) => (
                      <TableRow key={person._id || person.id || idx} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                        <TableCell>{consolidatedPage * consolidatedRowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {person.name || person.person_name} {person.surname || person.person_surname}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {person.email && <Typography variant="body2">{person.email}</Typography>}
                            {person.phone && <Typography variant="body2" color="text.secondary">{person.phone}</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={person.decision_type === 'first_time' ? 'First Time' : 'Recommitment'}
                            size="small"
                            color="secondary"
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.assigned_to || person.assignedTo || 'Not assigned'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.decision_date || 'No date'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={person.status || 'Active'}
                            size="small"
                            color={person.status === 'completed' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {consolidatedPaginatedList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No matching consolidated people</TableCell>
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

      <ConsolidationModal
        open={consolidationOpen}
        onClose={() => setConsolidationOpen(false)}
        attendeesWithStatus={attendeesWithStatus}
        onFinish={handleFinishConsolidation}
        consolidatedPeople={consolidatedPeople}
        currentEventId={currentEventId}
      />
    </Box>
  );
}

export default ServiceCheckIn;