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

// Cache for events data
let eventsCache = null;
let eventsCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const [sortModel, setSortModel] = useState([
    { field: 'isNew', sort: 'desc' }, // 🆕 New people first
    { field: 'name', sort: 'asc' }
  ]);
  const [newPersonAdded,setNewPersonAdded] = useState(false)

  // Real-time data state
  const [realTimeData, setRealTimeData] = useState(null);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
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

  const containerPadding = getResponsiveValue(0.5, 1, 2, 3, 3);
  const titleVariant = getResponsiveValue("subtitle1", "h6", "h5", "h4", "h4");
  const cardSpacing = getResponsiveValue(0.5, 1, 1.5, 2, 2);

  // Enhanced search priority function
  const getSearchPriorityScore = (attendee, searchTerm) => {
    const fullName = `${attendee.name || ''} ${attendee.surname || ''}`.toLowerCase();
    const firstName = (attendee.name || '').toLowerCase();
    const lastName = (attendee.surname || '').toLowerCase();
    
    // Check for Vicky or Gavin Enslin
    const isEnslin = lastName.includes('ensl');
    
    // More flexible checks for Vicky
    const isVicky = firstName.includes('vick') || 
                    firstName.includes('vic') || 
                    firstName.includes('vicki') || 
                    firstName.includes('vicky');
    
    // More flexible checks for Gavin  
    const isGavin = firstName.includes('gav') || 
                    firstName.includes('gavin') ||
                    firstName.includes('gaven') ||
                    firstName.includes('gavyn');
    
    const isPriorityPerson = isEnslin && (isVicky || isGavin);
    
    // If search term contains enslin or vicky/gavin, prioritize these people
    const searchLower = searchTerm.toLowerCase();
    const isSearchingForEnslin = searchLower.includes('ensl');
    
    // More flexible search for Vicky
    const isSearchingForVicky = searchLower.includes('vick') || 
                                searchLower.includes('vic') ||
                                searchLower.includes('vicki') || 
                                searchLower.includes('vicky');
    
    // More flexible search for Gavin
    const isSearchingForGavin = searchLower.includes('gav') || 
                                searchLower.includes('gavin') ||
                                searchLower.includes('gaven') ||
                                searchLower.includes('gavyn');
    
    if (isSearchingForEnslin && isPriorityPerson) {
      // Highest priority: Searching for enslin and person is Vicky/Gavin Enslin
      if (isSearchingForVicky && isVicky) return 100;
      if (isSearchingForGavin && isGavin) return 100;
      return 90;
    }
    
    // Lower priority for other matches
    return 0;
  };

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
      // More flexible: check for vick, vic, vicki, vicky
      const isVicky = firstName.includes('vick') || 
                      firstName.includes('vic') || 
                      firstName.includes('vicki') || 
                      firstName.includes('vicky') ||
                      fullName.includes('vick') || 
                      fullName.includes('vic') ||
                      fullName.includes('vicki') || 
                      fullName.includes('vicky');
      
      // Check for Gavin (in first name or full name)
      // More flexible: check for gav, gavin, gaven, gavyn, etc.
      const isGavin = firstName.includes('gav') || 
                      firstName.includes('gavin') ||
                      firstName.includes('gaven') ||
                      firstName.includes('gavyn') ||
                      fullName.includes('gav') ||
                      fullName.includes('gavin') ||
                      fullName.includes('gaven') ||
                      fullName.includes('gavyn');
      
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
    
    // Both have leader values or both don't - sort alphabetically by the leader value
    const leaderValue1 = (row1[leaderField] || '').toLowerCase();
    const leaderValue2 = (row2[leaderField] || '').toLowerCase();
    
    return leaderValue1.localeCompare(leaderValue2);
  };

  // Enhanced real-time data fetching
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

  // Enhanced refresh function for real-time sync across devices
  const handleFullRefresh = async () => {
    if (!currentEventId) {
      toast.error("Please select an event first");
      return;
    }

    setIsRefreshing(true);
    try {
      console.log("🔄 Performing full refresh from database for event:", currentEventId);
      
      // Refresh people cache
      await axios.post(`${BASE_URL}/cache/people/refresh`);
      
      // Get the REAL data from the database
      const data = await fetchRealTimeEventData(currentEventId);
      
      if (data) {
        console.log('✅ Real-time data received from DB:', {
          present_count: data.present_count,
          new_people_count: data.new_people_count, 
          consolidation_count: data.consolidation_count
        });
        
        // 🔥 COMPLETELY REPLACE all state with fresh database data
        setRealTimeData(data);
        
        // Also refresh the attendees list from cache
        const cacheResponse = await axios.get(`${BASE_URL}/cache/people`);
        if (cacheResponse.data.success && cacheResponse.data.cached_data) {
          const people = cacheResponse.data.cached_data.map((p) => ({
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
        
        toast.success(`Refresh complete! Present: ${data.present_count}, New: ${data.new_people_count}, Consolidated: ${data.consolidation_count}`);
      } else {
        throw new Error('Failed to fetch real-time data from database');
      }

    } catch (error) {
      console.error("❌ Error in real-time refresh:", error);
      toast.error("Failed to refresh data from database");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch all people for the main database
  const fetchAllPeople = async () => {
    setIsLoadingPeople(true);
    try {
      console.log('🔄 Fetching people data from cache...');
      
      const response = await axios.get(`${BASE_URL}/cache/people`);
      
      if (response.data.success && response.data.cached_data) {
        const people = response.data.cached_data.map((p) => ({
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
        
        console.log(`✅ Loaded ${people.length} people from cache`);
        setAttendees(people);
        setHasDataLoaded(true);
      } else {
        throw new Error('No people data available in cache');
      }
    } catch (err) {
      console.error('❌ Error fetching people:', err);
      toast.error("Failed to load people data. Please refresh the page.");
    } finally {
      setIsLoadingPeople(false);
    }
  };

  // Fetch events - with caching to prevent unnecessary reloads
  const fetchEvents = async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now();
    if (eventsCache && eventsCacheTimestamp && (now - eventsCacheTimestamp) < CACHE_DURATION && !forceRefresh) {
      console.log('📋 Using cached events data');
      setEvents(eventsCache);
      
      // Set current event if not already set
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
      
      // Update cache
      eventsCache = transformedEvents;
      eventsCacheTimestamp = now;
      
      setEvents(transformedEvents);

      // Set current event if not already set
      if (!currentEventId && transformedEvents.length > 0) {
        const filteredEvents = getFilteredEvents(transformedEvents);
        if (filteredEvents.length > 0) {
          setCurrentEventId(filteredEvents[0].id);
        }
      }

    } catch (err) {
      console.error('❌ Error fetching global events:', err);
      toast.error("Failed to fetch events. Please try again.");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Event filtering functions - exclude events that didn't meet
const getFilteredEvents = (eventsList = events) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0]; // "2024-01-19"
  
  const filteredEvents = eventsList.filter(event => {
    const isGlobal = event.isGlobal === true || 
                    event.eventType === "Global Events" || 
                    event.eventType === "Event" ||
                    event.eventType?.toLowerCase().includes("event");
    
    const eventStatus = event.status?.toLowerCase() || '';
    const isNotClosed = eventStatus !== 'complete' && eventStatus !== 'closed';
    const didMeet = eventStatus !== 'cancelled' && eventStatus !== 'did_not_meet';
    
    // Check if event date matches today
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
    const closedEvents = events.filter(event => {
      const isClosed = event.status?.toLowerCase() === 'closed' || event.status?.toLowerCase() === 'complete';
      const isGlobal = event.eventType === "Global Events" || event.isGlobal === true;
      const isNotCell = event.eventType?.toLowerCase() !== 'cell';
      const didMeet = event.status?.toLowerCase() !== 'cancelled' && event.status?.toLowerCase() !== 'did_not_meet';
      
      return isClosed && isGlobal && isNotCell && didMeet;
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
      const fullName = `${attendee.name} ${attendee.surname}`.trim();
      
      if (!isCurrentlyPresent) {
        // Check in as attendee
        const response = await axios.post(`${BASE_URL}/service-checkin/checkin`, {
          event_id: currentEventId,
          person_data: {
            id: attendee._id,
            name: attendee.name,
            fullName: fullName,
            email: attendee.email,
            phone: attendee.phone,
            leader12: attendee.leader12
          },
          type: "attendee"
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          toast.success(`${fullName} checked in successfully`);
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
          toast.info(`${fullName} removed from check-in`);
        }
      }

      // 🔥 CRITICAL: ALWAYS refresh from backend after any change
      const freshData = await fetchRealTimeEventData(currentEventId);
      if (freshData) {
        setRealTimeData(freshData);
      }

    } catch (err) {
      console.error("Error in toggle check-in:", err);
      toast.error(err.response?.data?.detail || err.message);
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
      const token = localStorage.getItem("token");
      
      if (editingPerson) {
        const updatedPersonData = {
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          invitedBy: formData.invitedBy,
          leader1: formData.leader1,
          leader12: formData.leader12,
          leader144: formData.leader144,
          stage: formData.stage || "Win"
        };

        const updateResponse = await axios.patch(
          `${BASE_URL}/people/${editingPerson._id}`,
          updatedPersonData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (updateResponse.data) {
          toast.success(`${formData.name} ${formData.surname} updated successfully`);

          // Update DataGrid immediately
          setAttendees(prev =>
            prev.map(person =>
              person._id === editingPerson._id
                ? { ...person, ...updatedPersonData }
                : person
            )
          );

          setOpenDialog(false);
          setEditingPerson(null);
          setFormData(emptyForm);
        }

        return;
      }

      const newPersonData = responseData.person || responseData;
      const fullName = `${formData.name} ${formData.surname}`.trim();

      // Step 1: Add this new person as a FIRST TIME attendee
      const response = await axios.post(
        `${BASE_URL}/service-checkin/checkin`,
        {
          event_id: currentEventId,
          person_data: {
            id: newPersonData._id,
            name: newPersonData.Name || formData.name,
            surname: newPersonData.Surname || formData.surname,
            email: newPersonData.Email || formData.email,
            phone: newPersonData.Number || formData.phone,
            gender: newPersonData.Gender || formData.gender,
            invitedBy: newPersonData.InvitedBy || formData.invitedBy,
            stage: "First Time"
          },
          type: "new_person"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`${fullName} added as new person successfully`);

        // Close dialog + reset form
        setOpenDialog(false);
        setEditingPerson(null);
        setFormData(emptyForm);

        // 🔥 CRITICAL FIX: Immediately update the real-time data state
        setRealTimeData(prev => {
          if (!prev) return prev;
          
          const updatedNewPeople = [...(prev.new_people || []), response.data.new_person];
          
          return {
            ...prev,
            new_people: updatedNewPeople,
            new_people_count: updatedNewPeople.length,
            // Also update the consolidation count if this was a consolidation
            ...(response.data.consolidation_count && {
              consolidation_count: response.data.consolidation_count
            })
          };
        });

        // Refresh cache
        try {
          await axios.post(`${BASE_URL}/cache/people/refresh`);
          console.log("✅ Cache refreshed after adding new person");
        } catch (cacheError) {
          console.warn("⚠️ Cache refresh failed:", cacheError);
        }

        // Create the new person object for DataGrid
        const newPersonForGrid = {
          _id: newPersonData._id,
          name: newPersonData.Name || formData.name,
          surname: newPersonData.Surname || formData.surname,
          email: newPersonData.Email || formData.email,
          phone: newPersonData.Number || formData.phone,
          gender: newPersonData.Gender || formData.gender,
          invitedBy: newPersonData.InvitedBy || formData.invitedBy,
          leader1: formData.leader1 || "",
          leader12: formData.leader12 || "",
          leader144: formData.leader144 || "",
          stage: "First Time",
          fullName: fullName,
          address: "",
          birthday: "",
          occupation: "",
          cellGroup: "",
          zone: "",
          homeAddress: "",
          isNew: true,
          present: false
        };

        // Add directly to DataGrid attendees
        setAttendees(prev => [newPersonForGrid, ...prev]);

        // Clear search so the new person is visible immediately
        setSearch("");


        const freshData = await fetchRealTimeEventData(currentEventId);
        if (freshData) {
          setRealTimeData(freshData);
        }
        setNewPersonAdded(true)
        console.log("✅ New person added to DataGrid and counts updated immediately");
      }
    } catch (error) {
      console.error("❌ Error saving person:", error);
      toast.error(error.response?.data?.detail || "Failed to save person");
    }
  };

  const handleFinishConsolidation = async (task) => {
    if (!currentEventId) return;
    const fullName = task.recipientName || `${task.person_name || ''} ${task.person_surname || ''}`.trim() || 'Unknown Person';

    console.log("🎯 Recording consolidation in UI for:", fullName);
    console.log("📋 Consolidation result from modal:", task);

    try {
      setConsolidationOpen(false);
      toast.success(`${fullName} consolidated successfully`);
      
      // 🔥 CRITICAL: ALWAYS refresh from backend after consolidation
      const freshData = await fetchRealTimeEventData(currentEventId);
      if (freshData) {
        setRealTimeData(freshData);
        console.log("✅ Consolidation data refreshed from backend");
      }
      
    } catch (error) {
      console.error("❌ Error recording consolidation in UI:", error);
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

      // Update cache
      if (eventsCache) {
        eventsCache = eventsCache.map(event =>
          event.id === currentEventId ? { ...event, status: "complete" } : event
        );
      }

      toast.success(result.message || `Event "${currentEvent.eventName}" closed successfully!`);
      setRealTimeData(null);
      setCurrentEventId("");
      
      setTimeout(() => {
        fetchEvents(true); // Force refresh events
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
      dob: person.dob || person.dateOfBirth || "",
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

      // 🔥 CRITICAL: Remove from local state immediately for instant UI update
      setAttendees(prev => prev.filter(person => person._id !== personId));
      
      // 🔥 Also remove from any real-time data if present
      setRealTimeData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          // Remove from present attendees
          present_attendees: (prev.present_attendees || []).filter(a => 
            a.id !== personId && a._id !== personId
          ),
          // Remove from new people
          new_people: (prev.new_people || []).filter(np => 
            np.id !== personId && np._id !== personId
          ),
          // Update counts
          present_count: (prev.present_attendees || []).filter(a => 
            a.id !== personId && a._id !== personId
          ).length,
          new_people_count: (prev.new_people || []).filter(np => 
            np.id !== personId && np._id !== personId
          ).length,
        };
      });

      // Refresh cache to ensure consistency
      try {
        await axios.post(`${BASE_URL}/cache/people/refresh`);
        console.log("✅ Cache refreshed after deletion");
      } catch (cacheError) {
        console.warn("⚠️ Cache refresh failed:", cacheError);
      }

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

  const getAttendeesWithPresentStatus = () => {
    const presentAttendeeIds = realTimeData?.present_attendees?.map(a => a.id || a._id) || [];
    const newPeopleIds = realTimeData?.new_people?.map(np => np.id) || [];
    
    return attendees.map((attendee) => ({
      ...attendee,
      present: presentAttendeeIds.includes(attendee._id),
      isNew: newPeopleIds.includes(attendee._id), // 🆕 Mark as new person
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

  // ========== NEW: SEARCH FILTERING FUNCTIONS ==========
  
  // Main filtering function - used by DataGrid
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
        person.occupation || '',
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

  // Enhanced filtering with priority scoring (same as DataGrid)
  const filterPeopleWithPriority = (people, searchTerm) => {
    if (!searchTerm.trim()) return people;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    const searchTerms = searchTermLower.split(/\s+/);
    
    // First, filter
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
        person.occupation || '',
        person.cellGroup || '',
        person.zone || '',
        person.invitedBy || '',
        person.address || '',
        person.homeAddress || '',
        person.stage || ''
      ].join(' ').toLowerCase();
      
      return searchTerms.every(term => searchableText.includes(term));
    });
    
    // Apply search priority if searching for Vicky/Gavin Enslin
    if (searchTermLower.includes('ensl') || searchTermLower.includes('vick') || 
        searchTermLower.includes('vic') || searchTermLower.includes('gav')) {
      return filtered.sort((a, b) => {
        const scoreA = getSearchPriorityScore(a, searchTermLower);
        const scoreB = getSearchPriorityScore(b, searchTermLower);
        
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher score first
        }
        
        // Fall back to default sorting
        return `${a.name || ''} ${a.surname || ''}`.localeCompare(`${b.name || ''} ${b.surname || ''}`);
      });
    }
    
    return filtered;
  };

  // Helper function to get full person data for present attendees
  const getFullPersonData = (attendeeId) => {
    return attendees.find(att => att._id === attendeeId) || {};
  };

  // Data for display
  const attendeesWithStatus = getAttendeesWithPresentStatus();

  // PRESENT Attendees Modal filtering
  const modalFilteredAttendees = (() => {
    // Get full person data for each present attendee
    const fullPresentAttendees = (realTimeData?.present_attendees || []).map(a => {
      const fullPerson = attendees.find(att => att._id === (a.id || a._id)) || {};
      return {
        ...fullPerson,
        ...a,
        name: a.name || fullPerson.name || '',
        surname: a.surname || fullPerson.surname || '',
        email: a.email || fullPerson.email || '',
        phone: a.phone || fullPerson.phone || '',
        leader1: a.leader1 || fullPerson.leader1 || '',
        leader12: a.leader12 || fullPerson.leader12 || '',
        leader144: a.leader144 || fullPerson.leader144 || '',
        id: a.id || a._id,
        _id: a.id || a._id
      };
    });
    
    if (!modalSearch.trim()) return fullPresentAttendees;
    
    return filterPeopleWithPriority(fullPresentAttendees, modalSearch);
  })();

  const modalPaginatedAttendees = modalFilteredAttendees.slice(
    modalPage * modalRowsPerPage,
    modalPage * modalRowsPerPage + modalRowsPerPage
  );

  // NEW PEOPLE Modal filtering
  const newPeopleFilteredList = (() => {
    if (!newPeopleSearch.trim()) return realTimeData?.new_people || [];
    
    // Create full person objects for new people
    const fullNewPeople = (realTimeData?.new_people || []).map(np => {
      const fullPerson = attendees.find(att => att._id === np.id) || {};
      return {
        ...fullPerson,
        ...np,
        name: np.name || fullPerson.name || '',
        surname: np.surname || fullPerson.surname || '',
        email: np.email || fullPerson.email || '',
        phone: np.phone || fullPerson.phone || '',
        invitedBy: np.invitedBy || fullPerson.invitedBy || '',
        gender: np.gender || fullPerson.gender || '',
        occupation: np.occupation || fullPerson.occupation || ''
      };
    });
    
    return filterPeople(fullNewPeople, newPeopleSearch);
  })();

  const newPeoplePaginatedList = newPeopleFilteredList.slice(
    newPeoplePage * newPeopleRowsPerPage,
    newPeoplePage * newPeopleRowsPerPage + newPeopleRowsPerPage
  );

  // CONSOLIDATED Modal filtering
  const filteredConsolidatedPeople = (() => {
    if (!consolidatedSearch.trim()) return realTimeData?.consolidations || [];
    
    // Create full person objects for consolidated people
    const fullConsolidatedPeople = (realTimeData?.consolidations || []).map(cons => {
      // Try to find the person in attendees list
      const foundPerson = attendees.find(att => 
        att._id === cons.person_id || 
        (att.name === cons.person_name && att.surname === cons.person_surname)
      );
      
      return {
        ...foundPerson,
        ...cons,
        person_name: cons.person_name || foundPerson?.name || '',
        person_surname: cons.person_surname || foundPerson?.surname || '',
        person_email: cons.person_email || foundPerson?.email || '',
        person_phone: cons.person_phone || foundPerson?.phone || '',
        assigned_to: cons.assigned_to || cons.assignedTo || '',
        decision_type: cons.decision_type || cons.consolidation_type || '',
        notes: cons.notes || ''
      };
    });
    
    return filterPeople(fullConsolidatedPeople, consolidatedSearch);
  })();

  const consolidatedPaginatedList = filteredConsolidatedPeople.slice(
    consolidatedPage * consolidatedRowsPerPage,
    consolidatedPage * consolidatedRowsPerPage + consolidatedRowsPerPage
  );

  // Enhanced search with priority for Vicky/Gavin Enslin
  const filteredAttendees = (() => {
    if (!search.trim()) return attendeesWithStatus;
    
    return filterPeopleWithPriority(attendeesWithStatus, search);
  })();
  

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
    } else {
      // Default sorting: new people first, then alphabetically
      result.sort((a, b) => {
        // New people first
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        
        // Then by name alphabetically
        return `${a.name || ''} ${a.surname || ''}`.localeCompare(`${b.name || ''} ${b.surname || ''}`);
      });
    }
    
    return result;
  })();

  const paginatedAttendees = filteredAttendees.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  // Data for display
  const presentCount = realTimeData?.present_attendees?.length || 0;
  const newPeopleCount = realTimeData?.new_people_count || 0;
  const consolidationCount = realTimeData?.consolidation_count || 0;

  // Responsive columns with LARGER ACTION BUTTONS
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

      // Mobile-optimized columns
      // On mobile: Show only Name, Leader columns, and Actions
      ...(isSmDown ? [] : [
        // Phone - show on medium+ screens
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
              {params.row.phone || '—'}
            </Typography>
          )
        },

        // Email - hide on small and extra small screens
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

      // Show leader fields on ALL screens with compact sizing
      // Mobile: Only show L1, L12, L144 (shortened headers)
      // Desktop: Show full headers
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
        flex: 0.8, // Increased flex for larger buttons
        minWidth: 120, // Increased from 80 to 120 for larger buttons
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
            <Tooltip title="Delete">
              <IconButton 
                size="medium" // Changed from small to medium
                color="error" 
                onClick={() => handleDelete(params.row._id)} 
                sx={{ 
                  padding: isXsDown ? '4px' : (isSmDown ? '6px' : '8px'),
                  '&:hover': {
                    backgroundColor: theme.palette.error.main + '20',
                    transform: 'scale(1.1)'
                  },
                  transition: 'transform 0.2s'
                }}
              >
                <DeleteIcon sx={{ fontSize: isXsDown ? '18px' : (isSmDown ? '20px' : '24px') }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton 
                size="medium" // Changed from small to medium
                color="primary" 
                onClick={() => handleEditClick(params.row)} 
                sx={{ 
                  padding: isXsDown ? '4px' : (isSmDown ? '6px' : '8px'),
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '20',
                    transform: 'scale(1.1)'
                  },
                  transition: 'transform 0.2s'
                }}
              >
                <EditIcon sx={{ fontSize: isXsDown ? '18px' : (isSmDown ? '20px' : '24px') }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={params.row.present ? "Checked in" : "Check in"}>
              <IconButton
                size="medium" // Changed from small to medium
                color="success"
                disabled={!currentEventId}
                onClick={() => handleToggleCheckIn(params.row)}
                sx={{ 
                  padding: isXsDown ? '4px' : (isSmDown ? '6px' : '8px'),
                  '&:hover': {
                    backgroundColor: theme.palette.success.main + '20',
                    transform: 'scale(1.1)'
                  },
                  transition: 'transform 0.2s',
                  opacity: currentEventId ? 1 : 0.5
                }}
              >
                {params.row.present ? 
                  <CheckCircleIcon sx={{ fontSize: isXsDown ? '18px' : (isSmDown ? '20px' : '24px') }} /> : 
                  <CheckCircleOutlineIcon sx={{ fontSize: isXsDown ? '18px' : (isSmDown ? '20px' : '24px') }} />
                }
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ];

    // On mobile (xs/sm), filter to show only: Name, leader columns, and actions
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

  // Update StatsCard to be more compact
  const StatsCard = ({ title, count, icon, color = "primary", onClick, disabled = false }) => (
    <Paper
      variant="outlined"
      sx={{
        p: getResponsiveValue(1, 1.5, 2, 2.5, 2.5), // Reduced padding
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        boxShadow: 2, // Reduced from 3
        minHeight: '80px', // Reduced from 100px
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        "&:hover": disabled ? {} : { boxShadow: 4, transform: "translateY(-2px)" }, // Reduced from 6
        transition: "all 0.2s",
        opacity: disabled ? 0.6 : 1,
        backgroundColor: 'background.paper',
      }}
      onClick={onClick}
    >
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={0.5}>
        {React.cloneElement(icon, { 
          color: disabled ? "disabled" : color,
          sx: { fontSize: getResponsiveValue(18, 20, 24, 28, 28) } // Reduced icon size
        })}
        <Typography 
          variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} 
          fontWeight={600} 
          color={disabled ? "text.disabled" : `${color}.main`}
          sx={{ fontSize: getResponsiveValue("0.9rem", "1rem", "1.2rem", "1.3rem", "1.3rem") }} // Reduced font size
        >
          {count}
        </Typography>
      </Stack>
      <Typography 
        variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} 
        color={disabled ? "text.disabled" : `${color}.main`}
        sx={{ fontSize: getResponsiveValue("0.7rem", "0.8rem", "0.9rem", "1rem", "1rem") }} // Reduced font size
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
          <IconButton onClick={() => handleDelete(attendee._id)} color="error" size="medium">
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

  // Updated PresentAttendeeCard - Clear name and surname display
  const PresentAttendeeCard = ({ attendee, showNumber, index }) => {
    // Get full person data to access all fields
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
          border: `2px solid ${theme.palette.primary.main}`,
          backgroundColor: isDarkMode 
            ? theme.palette.primary.dark + "1a" 
            : theme.palette.primary.light + "0a",
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

        {(person.invitedBy || person.occupation) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {person.invitedBy && (
                <Chip label={`Invited by: ${person.invitedBy}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {person.occupation && (
                <Chip label={`Work: ${person.occupation}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
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
          minHeight: '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          "&:last-child": { mb: 0 },
          border: `2px solid ${theme.palette.secondary.main}`,
          backgroundColor: isDarkMode 
            ? theme.palette.secondary.dark + "1a" 
            : theme.palette.secondary.light + "0a",
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

  const EventHistoryDetailsModal = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const filteredData = eventHistoryDetails.data.filter(item => {
      if (!searchTerm.trim()) return true;
      
      const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/);
      
      const searchableFields = [
        item.name || '',
        item.surname || '',
        item.email || '',
        item.phone || '',
        item.leader1 || '',
        item.leader12 || '',
        item.leader144 || '',
        item.occupation || '',
        item.assigned_to || '',
        item.decision_type || ''
      ].map(field => field.toLowerCase());
      
      return searchTerms.every(term => 
        searchableFields.some(field => field.includes(term))
      );
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
                <Card key={item._id || item.id || idx} variant="outlined" sx={{ mb: 1, boxShadow: 2, minHeight: '120px' }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item.name} {item.surname}
                    </Typography>
                    {item.email && <Typography variant="body2" color="text.secondary">{item.email}</Typography>}
                    {item.phone && <Typography variant="body2" color="text.secondary">{item.phone}</Typography>}
                    {eventHistoryDetails.type === 'consolidated' ? (
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
                    ) : (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mt={0.5}>
                        {item.leader1 && (
                          <Chip label={`@1: ${item.leader1}`} size="small" sx={{ fontSize: "0.6rem", height: 18 }} />
                        )}
                        {item.leader12 && (
                          <Chip label={`@12: ${item.leader12}`} size="small" sx={{ fontSize: "0.6rem", height: 18 }} />
                        )}
                        {item.leader144 && (
                          <Chip label={`@144: ${item.leader144}`} size="small" sx={{ fontSize: "0.6rem", height: 18 }} />
                        )}
                      </Stack>
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
                      <TableCell sx={{ fontWeight: 600 }}>Occupation</TableCell>
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
                        <TableCell>{item.occupation || "—"}</TableCell>
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
                    <TableCell colSpan={eventHistoryDetails.type === 'consolidated' ? 7 : 8} align="center">
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
                py: isSmDown ? 0.5 : 1, // Reduced padding
                fontSize: getResponsiveValue('0.8rem', '0.9rem', '1rem', '1rem', '1rem') // Smaller font
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

  // Effects - optimized to prevent unnecessary reloads
  useEffect(() => {
    if (currentEventId) {
      // Fetch real-time data when event changes - ALWAYS FROM DATABASE
      const loadRealTimeData = async () => {
        console.log("🔄 Event changed, loading fresh data from database...");
        const data = await fetchRealTimeEventData(currentEventId);
        if (data) {
          setRealTimeData(data);
          console.log("✅ Loaded fresh data from DB:", {
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

  // Add this to your useEffect section
  useEffect(() => {
    if (!currentEventId) return;

    // Refresh data immediately when event changes
    const loadData = async () => {
      const data = await fetchRealTimeEventData(currentEventId);
      if (data) {
        setRealTimeData(data);
      }
    };
    
    loadData();

    // Set up interval to refresh every 3 seconds
    const interval = setInterval(loadData, 3000);
    
    return () => clearInterval(interval);
  }, [currentEventId]);

  // Initial load - only once with proper loading states
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log('🚀 Service Check-In mounted - fetching fresh data from backend...');
      hasInitialized.current = true;
      
      // Show loading state for events
      setIsLoadingEvents(true);
      
      // Fetch both in parallel but show proper loading states
      fetchEvents();
      fetchAllPeople();
    }
  }, []);

  // Debug useEffect to check Gavin Enslin detection
  useEffect(() => {
    if (attendees.length > 0 && search.includes('gav')) {
      console.log('🔍 Searching for Gavin Enslin...');
      
      const potentialGavins = attendees.filter(person => {
        const fullName = `${person.name || ''} ${person.surname || ''}`.toLowerCase();
        const firstName = (person.name || '').toLowerCase();
        const surname = (person.surname || '').toLowerCase();
        
        const isEnslin = surname.includes('ensl');
        const isGavin = firstName.includes('gav') || fullName.includes('gav');
        
        return isEnslin && isGavin;
      });
      
      console.log('👤 Potential Gavin Enslin matches:', potentialGavins.map(p => ({
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

  // Render
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
      <ToastContainer position={isSmDown ? "bottom-center" : "top-right"} autoClose={3000} hideProgressBar={isSmDown} />

      {/* Stats Cards */}
      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        <Grid item xs={6} sm={6} md={4}>
          <StatsCard
            title="Present"
            count={presentCount}
            icon={<GroupIcon />}
            color="primary" // Blue
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
            color="success" // Green
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
            color="secondary" // Purple
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

      {/* Controls - Updated for mobile full width */}
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
      <Box sx={{ minHeight: 400, width: '100%' }}>
        <Paper variant="outlined" sx={{ mb: 2, boxShadow: 3, minHeight: '36px', width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ 
      borderBottom: 1, 
      borderColor: 'divider',
      minHeight: '36px', // Reduced height
      '& .MuiTab-root': {
        py: 0.5, // Reduced padding
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
        height: isMdDown ? `calc(100vh - ${containerPadding * 8 + 280}px)` : 650, // Increased from 500 to 650
        minHeight: isMdDown ? 500 : 650, // Increased from 400/500 to 500/650
        maxHeight: isMdDown ? '650px' : 700, // Increased from 550/500 to 650/700
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
          height: 'calc(100% - 1px)', // Slightly smaller to fit within Paper
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
          // Ensure the footer is visible
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
          // Mobile-specific optimizations
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

      {/* Event History Details Modal */}
      <EventHistoryDetailsModal />

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
                      // For present attendees, we need to get the full person data to access all fields
                      const fullPersonData = attendees.find(att => att._id === (a.id || a._id)) || a;
                      
                      // Create a properly mapped attendee with all fields
                      const mappedAttendee = {
                        ...a,
                        // Name fields - ensure we have both name and surname
                        name: a.name || fullPersonData.name || 'Unknown',
                        surname: a.surname || fullPersonData.surname || '',
                        // Contact fields
                        phone: a.phone || fullPersonData.phone || '',
                        email: a.email || fullPersonData.email || '',
                        // Leader fields
                        leader1: a.leader1 || fullPersonData.leader1 || '',
                        leader12: a.leader12 || fullPersonData.leader12 || '',
                        leader144: a.leader144 || fullPersonData.leader144 || '',
                      };

                      // Create full name display
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
                      // Map the data to ensure consistent field names
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
                      // Map the data to ensure consistent field names
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