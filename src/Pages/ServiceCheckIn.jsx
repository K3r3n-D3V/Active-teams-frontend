import React, { useState, useEffect, useRef } from "react";
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
import RefreshIcon from "@mui/icons-material/Refresh";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

function ServiceCheckIn() {
  // State management
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

  // Real-time data state
  const [realTimeData, setRealTimeData] = useState(null);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingConsolidated, setIsLoadingConsolidated] = useState(false);
  const [isClosingEvent, setIsClosingEvent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
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

// Enhanced leader column sort comparator - Vicky/Gavin Enslin ALWAYS at top
const createLeaderSortComparator = (leaderField) => (v1, v2, row1, row2) => {
  // Get full names and individual names for priority checking
  const fullName1 = `${row1.name || ''} ${row1.surname || ''}`.toLowerCase().trim();
  const fullName2 = `${row2.name || ''} ${row2.surname || ''}`.toLowerCase().trim();
  const firstName1 = (row1.name || '').toLowerCase().trim();
  const firstName2 = (row2.name || '').toLowerCase().trim();
  const surname1 = (row1.surname || '').toLowerCase().trim();
  const surname2 = (row2.surname || '').toLowerCase().trim();
  
  // Helper function to check if someone is Vicky or Gavin Enslin
  const isPriorityPerson = (firstName, surname, fullName) => {
    // Check if last name contains "ensl" (Enslin/Ensline)
    const isEnslin = surname.includes('ensl');
    
    // Check for Vicky (in first name or full name)
    const isVicky = firstName.includes('vick') || firstName.includes('vic') || 
                    fullName.includes('vick') || fullName.includes('vic');
    
    // Check for Gavin (in first name or full name)
    const isGavin = firstName.includes('gav') || fullName.includes('gav');
    
    // Priority: Either is Vicky Enslin OR Gavin Enslin
    // Make it more flexible - check if they have Enslin AND (Vicky or Gavin)
    return isEnslin && (isVicky || isGavin);
  };
  
  // Check if each person is priority (Vicky Enslin or Gavin Enslin)
  const isPriority1 = isPriorityPerson(firstName1, surname1, fullName1);
  const isPriority2 = isPriorityPerson(firstName2, surname2, fullName2);
  
  // ALWAYS put Vicky/Gavin Enslin at the very top - no matter what
  if (isPriority1 && !isPriority2) return -1;
  if (!isPriority1 && isPriority2) return 1;
  
  // Both are priority (both are Enslin with Vicky/Gavin) - Vicky comes before Gavin
  if (isPriority1 && isPriority2) {
    const isVicky1 = firstName1.includes('vick') || firstName1.includes('vic');
    const isVicky2 = firstName2.includes('vick') || firstName2.includes('vic');
    if (isVicky1 && !isVicky2) return -1;
    if (!isVicky1 && isVicky2) return 1;
    return fullName1.localeCompare(fullName2);
  }
  
  // New people should appear after priority but before others
  const isNew1 = row1.isNew;
  const isNew2 = row2.isNew;
  
  if (isNew1 && !isNew2) return -1;
  if (!isNew1 && isNew2) return 1;
  
  // Neither are priority - sort by leader field presence and then alphabetically
  const hasLeader1 = Boolean(row1[leaderField] && row1[leaderField].trim());
  const hasLeader2 = Boolean(row2[leaderField] && row2[leaderField].trim());
  
  // People with leader values come before people without
  if (hasLeader1 && !hasLeader2) return -1;
  if (!hasLeader1 && hasLeader2) return 1;
  
  // Both have leader values or both don't - sort alphabetically
  return (v1 || '').localeCompare(v2 || '');
};

  // Real-time data fetching
  const fetchRealTimeEventData = async (eventId) => {
    if (!eventId) return null;
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/service-checkin/real-time-data`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { event_id: eventId }
      });
      
      if (response.data.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching real-time event data:', error);
      return null;
    }
  };

  // Refresh function using real-time data
  const handleFullRefresh = async () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }

    setIsRefreshing(true);
    try {
      console.log("🔄 Performing full refresh with real-time data for event:", currentEventId);
      
      const data = await fetchRealTimeEventData(currentEventId);
      
      if (data) {
        console.log('✅ Real-time data received:', data);
        setRealTimeData(data);
        toast.success(`Refresh complete! ${data.present_count} present, ${data.new_people_count} new people, ${data.consolidation_count} consolidations`);
      } else {
        throw new Error('Failed to fetch real-time data');
      }

    } catch (error) {
      console.error("❌ Error in real-time refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch all people for the main database
  const fetchAllPeople = async () => {
    setIsLoadingPeople(true);
    try {
      console.log('🔄 Fetching fresh people data from backend...');
      
      // Try ultra-fast endpoint first
      const ultraResponse = await axios.get(`${BASE_URL}/people/ultra-fast`);
      if (ultraResponse.data.success && ultraResponse.data.results) {
        const people = ultraResponse.data.results.map((p) => ({
          _id: p._id || p.key || `temp-${Math.random()}`,
          name: p.Name || "",
          surname: p.Surname || "",
          email: p.Email || "",
          phone: p.Number || "",
          leader1: p["Leader @1"] || "",
          leader12: p["Leader @12"] || "",
          leader144: p["Leader @144"] || "",
          fullName: `${p.Name || ''} ${p.Surname || ''}`.trim()
        }));
        
        console.log(`✅ Loaded ${people.length} people from ultra-fast endpoint`);
        setAttendees(people);
        setHasDataLoaded(true);
      } else {
        throw new Error('Ultra-fast endpoint returned no data');
      }
    } catch (err) {
      console.error('❌ Error fetching from ultra-fast endpoint:', err);
      
      // Fallback to cache endpoint
      try {
        console.log('🔄 Trying cache endpoint as fallback...');
        const response = await axios.get(`${BASE_URL}/cache/people`);
        
        if (response.data.success && response.data.cached_data) {
          const cachedPeople = response.data.cached_data;
          const formattedPeople = cachedPeople.map((person) => ({
            _id: person._id || person.id || `temp-${Math.random()}`,
            name: person.Name || person.name || "",
            surname: person.Surname || person.surname || "",
            email: person.Email || person.email || "",
            phone: person.Number || person.Phone || person.phone || "",
            leader1: person["Leader @1"] || person.leader1 || "",
            leader12: person["Leader @12"] || person.leader12 || "",
            leader144: person["Leader @144"] || person.leader144 || "",
            fullName: person.FullName || `${person.Name || ''} ${person.Surname || ''}`.trim()
          }));

          console.log(`✅ Loaded ${formattedPeople.length} people from cache endpoint`);
          setAttendees(formattedPeople);
          setHasDataLoaded(true);
        } else {
          throw new Error('Cache endpoint returned no data');
        }
      } catch (fallbackError) {
        console.error('❌ All data loading methods failed:', fallbackError);
        toast.error("Failed to load people data. Please refresh the page.");
      }
    } finally {
      setIsLoadingPeople(false);
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Fetching events...');
      
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
      console.log('📋 RAW Global events response:', data);
      
      const eventsData = data.events || [];
      console.log('✅ Processed events:', eventsData);

      const transformedEvents = eventsData.map(event => ({
        id: event._id || event.id,
        eventName: event.eventName || "Unnamed Event",
        status: (event.status || "open").toLowerCase(),
        isGlobal: event.isGlobal !== false,
        isTicketed: event.isTicketed || false,
        date: event.date || event.createdAt,
        eventType: event.eventType || "Global Events"
      }));

      console.log('🎯 Final transformed events:', transformedEvents);
      setEvents(transformedEvents);

    } catch (err) {
      console.error('❌ Error fetching global events:', err);
      toast.error("Failed to fetch events. Please try again.");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Event filtering functions
  const getFilteredEvents = () => {
    const filteredEvents = events.filter(event => {
      const isGlobal = event.isGlobal === true || 
                      event.eventType === "Global Events" || 
                      event.eventType === "Event" ||
                      event.eventType?.toLowerCase().includes("event");
      const eventStatus = event.status?.toLowerCase() || '';
      const isNotClosed = eventStatus !== 'complete' && eventStatus !== 'closed';
      return isGlobal && isNotClosed;
    });
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

  const getFilteredClosedEvents = () => {
    const closedEvents = events.filter(event => {
      const isClosed = event.status?.toLowerCase() === 'closed' || event.status?.toLowerCase() === 'complete';
      const isGlobal = event.eventType === "Global Events" || event.isGlobal === true;
      const isNotCell = event.eventType?.toLowerCase() !== 'cell';
      
      return isClosed && isGlobal && isNotCell;
    });
    
    // Apply search filter
    if (!eventSearch.trim()) {
      return closedEvents;
    }
    
    const searchTerm = eventSearch.toLowerCase();
    return closedEvents.filter(event => 
      event.eventName?.toLowerCase().includes(searchTerm) ||
      event.date?.toLowerCase().includes(searchTerm) ||
      event.status?.toLowerCase().includes(searchTerm)
    );
  };

  // Check-in functions using new endpoints
  const handleToggleCheckIn = async (attendee) => {
    if (!currentEventId) {
      toast.error("Please select an event");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const isCurrentlyPresent = realTimeData?.present_attendees?.some(a => 
        a.id === attendee._id || a._id === attendee._id
      );
      
      if (!isCurrentlyPresent) {
        // Check in as attendee
        const response = await axios.post(`${BASE_URL}/service-checkin/checkin`, {
          event_id: currentEventId,
          person_data: {
            id: attendee._id,
            name: attendee.name,
            fullName: `${attendee.name} ${attendee.surname}`,
            email: attendee.email,
            phone: attendee.phone,
            leader12: attendee.leader12
          },
          type: "attendee"
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          toast.success(response.data.message || "Checked in successfully");
          // Refresh real-time data
          await handleFullRefresh();
        }
      } else {
        // Remove from check-in
        const response = await axios.delete(`${BASE_URL}/service-checkin/remove`, {
          headers: { 'Authorization': `Bearer ${token}` },
          data: {
            event_id: currentEventId,
            person_id: attendee._id,
            type: "attendees"
          }
        });

        if (response.data.success) {
          toast.info(response.data.message || "Removed from check-in");
          // Refresh real-time data
          await handleFullRefresh();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.message);
    }
  };

  // Add new person function
  const handlePersonSave = async (responseData) => {
    if (!currentEventId) {
      toast.error("Please select an event first before adding people");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const newPersonData = responseData.person || responseData;
      
      // Add as new person to the event
      const response = await axios.post(`${BASE_URL}/service-checkin/checkin`, {
        event_id: currentEventId,
        person_data: {
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          invitedBy: formData.invitedBy
        },
        type: "new_person"
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message || "New person added successfully");
        setOpenDialog(false);
        setEditingPerson(null);
        setFormData({
          name: "", surname: "", dob: "", homeAddress: "", invitedBy: "",
          email: "", phone: "", gender: "", leader1: "", leader12: "", leader144: ""
        });
        
        // Refresh real-time data to show the new person
        await handleFullRefresh();
      }
    } catch (error) {
      console.error('❌ Error adding new person:', error);
      toast.error(error.response?.data?.detail || "Failed to add person");
    }
  };

  // Consolidation function
  const handleFinishConsolidation = async (task) => {
    if (!currentEventId) return;

    try {
      const token = localStorage.getItem("token");
      
      // Add consolidation using the new endpoint
      const response = await axios.post(`${BASE_URL}/service-checkin/checkin`, {
        event_id: currentEventId,
        person_data: {
          person_name: task.recipientName?.split(' ')[0] || 'Unknown',
          person_surname: task.recipientName?.split(' ').slice(1).join(' ') || '',
          person_email: task.recipient_email || '',
          person_phone: task.recipient_phone || '',
          decision_type: task.decisionType || task.taskStage || "first_time",
          decision_display_name: task.decisionType === 'recommitment' ? 'Recommitment' : 'First Time Decision',
          assigned_to: task.assignedTo,
          assigned_to_email: task.assignedToEmail,
          notes: task.notes || ''
        },
        type: "consolidation"
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setConsolidationOpen(false);
        toast.success(response.data.message || "Consolidation recorded successfully");
        
        // Refresh real-time data
        await handleFullRefresh();
      }
    } catch (error) {
      console.error("❌ Error recording consolidation:", error);
      toast.error(error.response?.data?.detail || "Failed to record consolidation");
    }
  };

  // Event management
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
    const token = localStorage.getItem("token");
    
    // Try PATCH first
    const response = await fetch(`${BASE_URL}/events/${currentEventId}`, {
      method: "PATCH",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: "complete"
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    setEvents(prev => prev.map(event =>
      event.id === currentEventId ? { ...event, status: "complete" } : event
    ));

    toast.success(result.message || `Event "${currentEvent.eventName}" closed successfully!`);
    setRealTimeData(null);
    setCurrentEventId("");
    
    setTimeout(() => {
      fetchEvents();
    }, 500);
    
  } catch (error) {
    console.error("❌ ERROR in event closure process:", error);
    toast.error("Event may still be open in the database. Please check.");
  } finally {
    setIsClosingEvent(false);
  }
};

  // UI Handlers
  const handleConsolidationClick = () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }
    setConsolidationOpen(true);
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

  const handleAddPersonClick = () => {
    if (!currentEventId) {
      toast.error("Please select an event first before adding people");
      return;
    }
    setOpenDialog(true);
  };

  // Data processing
  const getAttendeesWithPresentStatus = () => {
    const presentAttendeeIds = realTimeData?.present_attendees?.map(a => a.id || a._id) || [];
    return attendees.map((attendee) => ({
      ...attendee,
      present: presentAttendeeIds.includes(attendee._id),
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

  // Event history handlers
  const handleViewEventDetails = (event, data) => {
    setEventHistoryDetails({
      open: true,
      event: event,
      type: 'attendance',
      data: data || []
    });
  };

  const handleViewNewPeople = (event, data) => {
    setEventHistoryDetails({
      open: true,
      event: event,
      type: 'newPeople',
      data: data || []
    });
  };

  const handleViewConsolidated = (event, data) => {
    setEventHistoryDetails({
      open: true,
      event: event,
      type: 'consolidated',
      data: data || []
    });
  };

  // Data for display
  const attendeesWithStatus = getAttendeesWithPresentStatus();
  const presentCount = realTimeData?.present_count || 0;
  const newPeopleCount = realTimeData?.new_people_count || 0;
  const consolidationCount = realTimeData?.consolidation_count || 0;

  const filteredAttendees = attendeesWithStatus.filter((a) => {
    if (!search) return true;
    const lc = search.toLowerCase();
    const searchString = `
      ${a.name || ''} 
      ${a.surname || ''} 
      ${a.email || ''} 
      ${a.phone || ''} 
      ${a.leader1 || ''} 
      ${a.leader12 || ''} 
      ${a.leader144 || ''}
    `.toLowerCase();
    return searchString.includes(lc);
  });

// Apply sorting to filtered attendees based on sortModel
const sortedFilteredAttendees = (() => {
  const result = [...filteredAttendees];
  
  if (sortModel && sortModel.length > 0) {
    const sort = sortModel[0]; // Get the first sort
    
    // Apply custom comparator for leader fields
    if (sort.field === 'leader1' || sort.field === 'leader12' || sort.field === 'leader144') {
      result.sort((a, b) => {
        const comparator = createLeaderSortComparator(sort.field);
        let comparison = comparator(a[sort.field], b[sort.field], a, b);
        return sort.sort === 'desc' ? -comparison : comparison;
      });
    } else if (sort.field && sort.field !== 'actions') {
      // Standard string/field sorting
      result.sort((a, b) => {
        const aVal = (a[sort.field] || '').toString().toLowerCase();
        const bVal = (b[sort.field] || '').toString().toLowerCase();
        const comparison = aVal.localeCompare(bVal);
        return sort.sort === 'desc' ? -comparison : comparison;
      });
    }
  }
  
  return result;
})();

  const paginatedAttendees = sortedFilteredAttendees.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  // Modal data from real-time endpoints
  const presentAttendees = realTimeData?.present_attendees || [];
  const newPeopleList = realTimeData?.new_people || [];
  const consolidationsList = realTimeData?.consolidations || [];

  const modalFilteredAttendees = presentAttendees.filter((a) => {
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

  const newPeopleFilteredList = newPeopleList.filter((a) => {
    const lc = newPeopleSearch.toLowerCase();
    const bag = [a.name, a.surname, a.email, a.phone, a.invitedBy]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return bag.includes(lc);
  });
  const newPeoplePaginatedList = newPeopleFilteredList.slice(
    newPeoplePage * newPeopleRowsPerPage,
    newPeoplePage * newPeopleRowsPerPage + newPeopleRowsPerPage
  );

  const filteredConsolidatedPeople = consolidationsList.filter((person) => {
    const lc = consolidatedSearch.toLowerCase();
    const searchString = `${person.person_name || ''} ${person.person_surname || ''} ${person.person_email || ''} ${person.person_phone || ''} ${person.assigned_to || ''} ${person.decision_type || ''}`.toLowerCase();
    return searchString.includes(lc);
  });

  const consolidatedPaginatedList = filteredConsolidatedPeople.slice(
    consolidatedPage * consolidatedRowsPerPage,
    consolidatedPage * consolidatedRowsPerPage + consolidatedRowsPerPage
  );

  // Columns for DataGrid
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

  // Component definitions
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
    const decisionType = person.decision_type || person.consolidation_type || "Commitment";
    const displayDecisionType = decisionType || 'Commitment';
    
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
          border: `2px solid ${theme.palette.secondary.main}`,
          backgroundColor: theme.palette.secondary.light + "0a",
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

          {(person.created_at || person.decision_type) && (
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
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

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
                <Card key={item._id || item.id || idx} variant="outlined" sx={{ mb: 1, boxShadow: 2, minHeight: '100px' }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item.name} {item.surname}
                    </Typography>
                    {item.email && <Typography variant="body2" color="text.secondary">{item.email}</Typography>}
                    {item.phone && <Typography variant="body2" color="text.secondary">{item.phone}</Typography>}
                    {eventHistoryDetails.type === 'consolidated' && (
                      <>
                        <Chip
                          label={item.decision_type || item.consolidation_type || 'Commitment'}
                          size="small"
                          sx={{ mt: 0.5 }}
                          color={(item.decision_type || item.consolidation_type) === 'Recommitment' ? 'primary' : 'secondary'}
                        />
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Assigned to: {item.assigned_to || item.assignedTo || 'Not assigned'}
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
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  {eventHistoryDetails.type !== 'consolidated' ? (
                    <>
                      <TableCell sx={{ fontWeight: 600 }}>Leader @1</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Leader @12</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Leader @144</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={{ fontWeight: 600 }}>Decision Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </>
                  )}
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
                            label={item.decision_type || item.consolidation_type || 'Commitment'}
                            size="small"
                            color={(item.decision_type || item.consolidation_type) === 'Recommitment' ? 'primary' : 'secondary'}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>{item.assigned_to || item.assignedTo || "Not assigned"}</TableCell>
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
                    <TableCell colSpan={eventHistoryDetails.type === 'consolidated' ? 7 : 7} align="center">
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
    <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: 4, minHeight: "100vh" }}>
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
        <Paper variant="outlined" sx={{ height: 600, boxShadow: 3, p: 2 }}>
          <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 2, borderRadius: 1 }} />
          <Skeleton variant="rounded" width="100%" height={400} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 2, borderRadius: 1 }} />
        </Paper>
      )}
    </Box>
  );

  // Effects
  useEffect(() => {
    if (currentEventId) {
      // Fetch real-time data when event changes
      const loadRealTimeData = async () => {
        const data = await fetchRealTimeEventData(currentEventId);
        if (data) {
          setRealTimeData(data);
        }
      };
      
      loadRealTimeData();
    } else {
      setRealTimeData(null);
    }
  }, [currentEventId]);

  useEffect(() => {
    if (events.length > 0 && !currentEventId) {
      const filteredEvents = getFilteredEvents();
      if (filteredEvents.length > 0) {
        setCurrentEventId(filteredEvents[0].id);
      }
    }
  }, [events]);

  useEffect(() => {
    console.log('🚀 Service Check-In mounted - fetching fresh data from backend...');
    fetchEvents();
    fetchAllPeople();
  }, []);

  // Render
  if ((!hasDataLoaded && isLoadingPeople) || (attendees.length === 0 && isLoadingPeople)) {
    return <SkeletonLoader />;
  }

  return (
    <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: 8, minHeight: "100vh" }}>
      <ToastContainer position={isSmDown ? "bottom-center" : "top-right"} autoClose={3000} hideProgressBar={isSmDown} />

      {/* Stats Cards */}
      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
              textAlign: "center",
              cursor: currentEventId ? "pointer" : "default",
              boxShadow: 3,
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              "&:hover": currentEventId ? { boxShadow: 6, transform: "translateY(-2px)" } : {},
              transition: "all 0.2s",
              opacity: currentEventId ? 1 : 0.6
            }}
            onClick={() => { 
              if (currentEventId) {
                setModalOpen(true); 
                setModalSearch(""); 
                setModalPage(0); 
              }
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <GroupIcon color={currentEventId ? "primary" : "disabled"} sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color={currentEventId ? "primary" : "text.disabled"}>
                {presentCount}
              </Typography>
            </Stack>
            <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
              Present
              {!currentEventId && (
                <Typography variant="caption" display="block" color="text.disabled">
                  Select event
                </Typography>
              )}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
              textAlign: "center",
              cursor: currentEventId ? "pointer" : "default",
              boxShadow: 3,
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              "&:hover": currentEventId ? { boxShadow: 6, transform: "translateY(-2px)" } : {},
              transition: "all 0.2s",
              opacity: currentEventId ? 1 : 0.6
            }}
            onClick={() => { 
              if (currentEventId) {
                setNewPeopleModalOpen(true); 
                setNewPeopleSearch(""); 
                setNewPeoplePage(0); 
              }
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <PersonAddAltIcon color={currentEventId ? "success" : "disabled"} sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color={currentEventId ? "success.main" : "text.disabled"}>
                {newPeopleCount}
              </Typography>
            </Stack>
            <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
              New People
              {!currentEventId && (
                <Typography variant="caption" display="block" color="text.disabled">
                  Select event
                </Typography>
              )}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <Paper
            variant="outlined"
            sx={{
              p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
              textAlign: "center",
              cursor: currentEventId ? "pointer" : "default",
              boxShadow: 3,
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              "&:hover": currentEventId ? { boxShadow: 6, transform: "translateY(-2px)" } : {},
              transition: "all 0.2s",
              opacity: currentEventId ? 1 : 0.6
            }}
            onClick={() => { 
              if (currentEventId) {
                setConsolidatedModalOpen(true); 
                setConsolidatedSearch(""); 
                setConsolidatedPage(0); 
              }
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <MergeIcon color={currentEventId ? "secondary" : "disabled"} sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color={currentEventId ? "secondary.main" : "text.disabled"}>
                {consolidationCount}
              </Typography>
            </Stack>
            <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
              Consolidated
              {!currentEventId && (
                <Typography variant="caption" display="block" color="text.disabled">
                  Select event
                </Typography>
              )}
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
            onChange={(e) => setCurrentEventId(e.target.value)}
            displayEmpty
            fullWidth
            sx={{ boxShadow: 2 }}
          >
            <MenuItem value="">
              <Typography color="text.secondary">Select Global Event</Typography>
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
            {events.length === 0 && (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  {isLoadingEvents ? "Loading events..." : "No events available"}
                </Typography>
              </MenuItem>
            )}
          </Select>
        </Grid>
        
        <Grid item xs={12} sm={6} md={5}>
          {activeTab === 0 ? (
            <TextField
              size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              placeholder="Search attendees..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              fullWidth
              sx={{ boxShadow: 2 }}
            />
          ) : (
            <TextField
              size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              placeholder="Search events..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              fullWidth
              sx={{ boxShadow: 2 }}
            />
          )}
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
      <Box sx={{ minHeight: 400 }}>
        <Paper variant="outlined" sx={{ mb: 2, boxShadow: 3, minHeight: '48px' }}>
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
                  rows={sortedFilteredAttendees ?? attendees}
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
                  getRowId={(row) => row._id}
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
              events={getFilteredClosedEvents()}
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
        </DialogContent>
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
                <Card key={a.id || a._id} variant="outlined" sx={{ mb: 1, boxShadow: 2, "&:last-child": { mb: 0 }, minHeight: '100px' }}>
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
                      <IconButton color="error" size="small" onClick={() => {
                        const attendee = attendees.find(att => att._id === (a.id || a._id));
                        if (attendee) handleToggleCheckIn(attendee);
                      }}>
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
                  <TableRow key={a.id || a._id} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                    <TableCell>{modalPage * modalRowsPerPage + idx + 1}</TableCell>
                    <TableCell>{a.name} {a.surname}</TableCell>
                    <TableCell>{a.leader1 || "—"}</TableCell>
                    <TableCell>{a.leader12 || "—"}</TableCell>
                    <TableCell>{a.leader144 || "—"}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => {
                        const attendee = attendees.find(att => att._id === (a.id || a._id));
                        if (attendee) handleToggleCheckIn(attendee);
                      }}>
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
          New People: {newPeopleCount}
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
          ) : newPeopleList.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No new people added for this event
            </Typography>
          ) : (
            <>
              {isSmDown ? (
                <Box>
                  {newPeoplePaginatedList.map((a, idx) => (
                    <Card key={a.id || a._id} variant="outlined" sx={{ mb: 1, boxShadow: 2, "&:last-child": { mb: 0 }, minHeight: '100px' }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                          {newPeoplePage * newPeopleRowsPerPage + idx + 1}. {a.name} {a.surname}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {a.phone || "No phone"}
                        </Typography>
                        {a.invitedBy && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            Invited by: {a.invitedBy}
                          </Typography>
                        )}
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
                      <TableCell sx={{ fontWeight: 600 }}>Invited By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {newPeoplePaginatedList.map((a, idx) => (
                      <TableRow key={a.id || a._id} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                        <TableCell>{newPeoplePage * newPeopleRowsPerPage + idx + 1}</TableCell>
                        <TableCell>{a.name} {a.surname}</TableCell>
                        <TableCell>{a.phone || "—"}</TableCell>
                        <TableCell>{a.email || "—"}</TableCell>
                        <TableCell>{a.invitedBy || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {newPeoplePaginatedList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No matching people</TableCell>
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
          ) : consolidationsList.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No consolidated people for this event
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
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consolidatedPaginatedList.map((person, idx) => (
                      <TableRow key={person.id || person._id || idx} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                        <TableCell>{consolidatedPage * consolidatedRowsPerPage + idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {person.person_name} {person.person_surname}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {person.person_email && <Typography variant="body2">{person.person_email}</Typography>}
                            {person.person_phone && <Typography variant="body2" color="text.secondary">{person.person_phone}</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={person.decision_type || 'Commitment'}
                            size="small"
                            color={person.decision_type === 'Recommitment' ? 'primary' : 'secondary'}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.assigned_to || 'Not assigned'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.created_at ? new Date(person.created_at).toLocaleDateString() : 'No date'}
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
        consolidatedPeople={consolidationsList}
        currentEventId={currentEventId}
      />
    </Box>
  );
}

export default ServiceCheckIn;