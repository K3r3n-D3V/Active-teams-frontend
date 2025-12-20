import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, LinearProgress, Chip, IconButton, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, Avatar, useTheme, useMediaQuery,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
  Paper, Checkbox, FormControlLabel, Stack, Divider, Tooltip, Tabs, Tab, Container
} from '@mui/material';
import Collapse from '@mui/material/Collapse';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  People, Task, Warning, Refresh, Add, CalendarToday, Close,
  Visibility, ChevronLeft, ChevronRight, Save, Event, Download
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { AuthContext } from "../contexts/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const StatsDashboard = () => {
  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));

  // Responsive helper function
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
    dateRange: { start: '', end: '' }
  });

  const [period, setPeriod] = useState('today');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedUsers, setExpandedUsers] = useState([]);
  const [newEventData, setNewEventData] = useState({
    eventName: '', eventTypeName: '', date: '', eventLeaderName: '', eventLeaderEmail: '',
    location: '', time: '19:00', description: '', isRecurring: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);

  const { authFetch } = useContext(AuthContext);
  const isFetchingRef = useRef(false);

  // Simplified period options - REMOVED "previous7"
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'previousWeek', label: 'Previous Week' },
    { value: 'previousMonth', label: 'Previous Month' }
  ];

  // FIXED: Fetch data when period changes
  useEffect(() => {
    if (!isFetchingRef.current) {
      fetchStats();
    }
  }, [period]);

  // FIXED: fetchStats function - fetch fresh data from backend
  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (isFetchingRef.current && !forceRefresh) {
      console.log('Stats fetch already in progress');
      return;
    }

    isFetchingRef.current = true;
    setStats(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log(`Fetching stats for period: ${period}`);

      // Use the backend endpoint with the period parameter
      const response = await authFetch(
        `${BACKEND_URL}/stats/dashboard-comprehensive?period=${period}`,
        {
          retryOnAuthFailure: true,
          maxRetries: 1
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 401) {
          console.log('Token expired, refresh should be triggered by authFetch');
          throw new Error('Authentication required');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      
      // Update stats with fresh data from backend
      const newStats = {
        overview: data.overview,
        events: data.events || [],
        overdueCells: data.overdueCells || [],
        allTasks: data.allTasks || [],
        allUsers: data.allUsers || [],
        groupedTasks: data.groupedTasks || [],
        dateRange: data.date_range || { start: '', end: '' },
        loading: false,
        error: null
      };

      setStats(newStats);
      
    } catch (err) {
      console.error("Fetch stats error:", err);

      if (err.message === 'Authentication required' || err.message.includes('401')) {
        setStats(prev => ({ 
          ...prev, 
          loading: false,
          error: null
        }));
        return;
      }

      // Try quick stats as fallback
      try {
        const quickResponse = await authFetch(`${BACKEND_URL}/stats/dashboard-quick?period=${period}`);
        if (!quickResponse.ok) throw err;

        const quickData = await quickResponse.json();
        
        const fallbackStats = {
          overview: {
            total_attendance: 0,
            outstanding_cells: quickData.overdueCells || 0,
            outstanding_tasks: quickData.tasksDueInPeriod || 0,
            people_behind: 0,
            total_users: 0,
            total_tasks: quickData.taskCount || 0,
            tasks_completed_in_period: quickData.tasksCompletedInPeriod || 0,
            tasks_due_in_period: quickData.tasksDueInPeriod || 0
          },
          events: [],
          overdueCells: [],
          allTasks: [],
          allUsers: [],
          groupedTasks: [],
          dateRange: quickData.date_range || { start: '', end: '' },
          loading: false,
          error: null
        };

        setStats(fallbackStats);
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr);
        setStats(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load data. Please try refreshing.', 
          loading: false 
        }));
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [period, authFetch]);

  // Handle period change - this triggers useEffect which fetches new data
  const handlePeriodChange = (e) => {
    if (isFetchingRef.current) return;
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
  };

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, []);

  // FIXED: Don't filter data on frontend - use backend data directly
  // The backend already returns data filtered by the period
  const filteredOverdueCells = useMemo(() => stats.overdueCells, [stats.overdueCells]);
  const filteredTasks = useMemo(() => stats.allTasks, [stats.allTasks]);
  const filteredEvents = useMemo(() => stats.events, [stats.events]);

  // Excel Download Function
  const downloadFilteredStats = () => {
    try {
      const currentPeriod = getPeriodDisplayText(period);
      const today = new Date().toISOString().split('T')[0];
      
      let dataToExport = [];
      let sheetName = '';
      let fileName = '';
      
      if (activeTab === 0) {
        if (!filteredOverdueCells || filteredOverdueCells.length === 0) {
          toast.info("No overdue cells data to download for the selected period.");
          return;
        }
        
        dataToExport = filteredOverdueCells.map(cell => ({
          "Event ID": cell._id || "",
          "Event Name": cell.eventName || "Unnamed",
          "Event Type": cell.eventTypeName || "",
          "Date": cell.date ? formatDateForExcel(cell.date) : "",
          "Time": cell.time || "",
          "Location": cell.location || "",
          "Event Leader": cell.eventLeaderName || "",
          "Leader Email": cell.eventLeaderEmail || "",
          "Status": cell.status || "incomplete",
          "Description": cell.description || "",
          "Attendees Count": cell.attendees ? cell.attendees.length : 0,
          "Is Recurring": cell.isRecurring ? "Yes" : "No",
          "Created At": cell.created_at ? formatDateForExcel(cell.created_at) : "",
          "Updated At": cell.updated_at ? formatDateForExcel(cell.updated_at) : ""
        }));
        
        sheetName = "Overdue_Cells";
        fileName = `overdue_cells_${currentPeriod.toLowerCase().replace(/\s+/g, '_')}_${today}.xlsx`;
        
      } else if (activeTab === 1) {
        if (!filteredTasks || filteredTasks.length === 0) {
          toast.info("No tasks data to download for the selected period.");
          return;
        }
        
        dataToExport = filteredTasks.map(task => ({
          "Task ID": task._id || "",
          "Task Name": task.name || task.taskType || "Untitled Task",
          "Task Type": task.type || "",
          "Contact Person": task.contacted_person?.name || "",
          "Contact Phone": task.contacted_person?.phone || task.contacted_person?.Number || "",
          "Contact Email": task.contacted_person?.email || "",
          "Assigned To": task.assignedfor || task.name || "",
          "Assigned For": task.assignedfor || "",
          "Due Date": task.followup_date ? formatDateForExcel(task.followup_date) : "",
          "Status": task.status || "pending",
          "Task Stage": task.taskStage || "",
          "Created At": task.created_at ? formatDateForExcel(task.created_at) : "",
          "Updated At": task.updated_at ? formatDateForExcel(task.updated_at) : "",
          "Member ID": task.memberID || "",
          "Task Description": task.description || ""
        }));
        
        sheetName = "Tasks";
        fileName = `tasks_${currentPeriod.toLowerCase().replace(/\s+/g, '_')}_${today}.xlsx`;
        
      } else if (activeTab === 2) {
        if (!filteredEvents || filteredEvents.length === 0) {
          toast.info("No events data to download for the selected period.");
          return;
        }
        
        dataToExport = filteredEvents.map(event => ({
          "Event ID": event._id || "",
          "Event Name": event.eventName || "",
          "Event Type": event.eventTypeName || "",
          "Date": event.date ? formatDateForExcel(event.date) : "",
          "Time": event.time || "",
          "Location": event.location || "",
          "Event Leader": event.eventLeaderName || "",
          "Leader Email": event.eventLeaderEmail || "",
          "Description": event.description || "",
          "Status": event.status || "incomplete",
          "Is Recurring": event.isRecurring ? "Yes" : "No",
          "Created At": event.created_at ? formatDateForExcel(event.created_at) : "",
          "Updated At": event.updated_at ? formatDateForExcel(event.updated_at) : ""
        }));
        
        sheetName = "Events";
        fileName = `events_${currentPeriod.toLowerCase().replace(/\s+/g, '_')}_${today}.xlsx`;
      }
      
      if (dataToExport.length === 0) {
        toast.info("No data to download for the selected period.");
        return;
      }
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'binary',
        bookSST: false 
      });
      
      const buffer = new ArrayBuffer(wbout.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < wbout.length; ++i) {
        view[i] = wbout.charCodeAt(i) & 0xFF;
      }
      
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
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
  
  const formatDateForExcel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
      console.warn("Date formatting error:", e, "for date:", dateStr);
      return dateStr;
    }
  };

  // Event types fetch
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
          { name: "OUTREACH" }
        ]);
      } finally {
        setEventTypesLoading(false);
      }
    };

    fetchEventTypes();
  }, [authFetch]);

  const toggleExpand = useCallback((key) => {
    setExpandedUsers(prev => 
      prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]
    );
  }, []);

  const formatDate = useCallback((d) => !d ? 'Not set' : new Date(d).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }), []);

  const formatDisplayDate = useCallback((d) => !d ? 'Not set' : new Date(d).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  }), []);

  const getEventsForDate = useCallback((date) => 
    filteredEvents.filter(e => e.date && new Date(e.date).toISOString().split('T')[0] === date),
    [filteredEvents]
  );

  const handleCreateEvent = useCallback(() => {
    setNewEventData(prev => ({ ...prev, date: selectedDate }));
    setCreateEventModalOpen(true);
  }, [selectedDate]);

  const handleSaveEvent = async () => {
    if (!newEventData.eventName.trim()) {
      setSnackbar({ open: true, message: 'Event Name is required!', severity: 'error' });
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
        eventLeaderName: newEventData.eventLeaderName || `${user.name || ''} ${user.surname || ''}`.trim() || 'Unknown Leader',
        eventLeaderEmail: newEventData.eventLeaderEmail || user.email || null,
        isRecurring: newEventData.isRecurring,
        status: 'incomplete',
        created_at: new Date().toISOString(),
      };

      const res = await authFetch(`${BACKEND_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail?.[0]?.msg || `HTTP ${res.status}`);
      }

      setCreateEventModalOpen(false);
      setNewEventData({
        eventName: '', eventTypeName: '', date: '', eventLeaderName: '', eventLeaderEmail: '',
        location: '', time: '19:00', description: '', isRecurring: false,
      });

      setSnackbar({ open: true, message: 'Event created successfully!', severity: 'success' });
      fetchStats();
      
    } catch (err) {
      console.error("Create event failed:", err);
      setSnackbar({ open: true, message: err.message || 'Failed to create event', severity: 'error' });
    }
  };

  const EnhancedCalendar = useMemo(() => {
    const eventCounts = {};
    filteredEvents.forEach(e => {
      if (e.date) {
        const d = e.date.split('T')[0];
        eventCounts[d] = (eventCounts[d] || 0) + 1;
      }
    });

    const today = new Date().toISOString().split('T')[0];
    const goToPreviousMonth = () => setCurrentMonth(prev => { 
      const m = new Date(prev); 
      m.setMonth(m.getMonth() - 1); 
      return m; 
    });
    
    const goToNextMonth = () => setCurrentMonth(prev => { 
      const m = new Date(prev); 
      m.setMonth(m.getMonth() + 1); 
      return m; 
    });
    
    const goToToday = () => { 
      setCurrentMonth(new Date()); 
      setSelectedDate(today); 
    };

    const getDaysInMonth = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = [];
      
      for (let i = 0; i < firstDay; i++) days.push(null);
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        days.push({
          day, 
          date: dateStr,
          eventCount: eventCounts[dateStr] || 0,
          isToday: dateStr === today,
          isSelected: dateStr === selectedDate
        });
      }
      return days;
    };
    
    const days = getDaysInMonth();

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="h6" fontWeight="medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
          <Box display="flex" gap={0.5}>
            <IconButton size="small" onClick={goToPreviousMonth} sx={{ p: 0.5 }}><ChevronLeft fontSize="small" /></IconButton>
            <Button size="small" variant="outlined" onClick={goToToday} sx={{ px: 1, py: 0.25, fontSize: '0.75rem' }}>Today</Button>
            <IconButton size="small" onClick={goToNextMonth} sx={{ p: 0.5 }}><ChevronRight fontSize="small" /></IconButton>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: 0.25, 
          mb: 1, 
          backgroundColor: 'background.paper', 
          borderRadius: 1.5, 
          overflow: 'hidden', 
          boxShadow: 0 
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <Box key={i} sx={{ 
              py: 1, 
              textAlign: 'center', 
              fontWeight: 'medium', 
              fontSize: '0.7rem', 
              color: 'text.primary', 
              backgroundColor: i === 0 || i === 6 ? 'action.hover' : 'transparent', 
              borderRight: i < 6 ? '1px solid' : 'none', 
              borderColor: 'divider' 
            }}>
              {isSmDown ? day[0] : day}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
          {days.map((d, i) => !d ? <Box key={`empty-${i}`} sx={{ height: 42 }} /> : (
            <Box
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              sx={{
                height: 42, 
                borderRadius: 1.5, 
                cursor: 'pointer',
                backgroundColor: d.isSelected ? 'primary.main' : d.isToday ? 'primary.50' : 'background.default',
                color: d.isSelected ? 'white' : d.isToday ? 'primary.main' : 'text.primary',
                border: d.isToday && !d.isSelected ? '1px solid' : 'none',
                borderColor: d.isToday && !d.isSelected ? 'primary.main' : 'divider',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative', 
                transition: 'all 0.2s ease',
                '&:hover': { 
                  backgroundColor: d.isSelected ? 'primary.dark' : 'action.hover', 
                  transform: 'translateY(-1px)', 
                  boxShadow: 2 
                }
              }}
            >
              <Typography variant="caption" fontWeight={d.isToday || d.isSelected ? 'bold' : 'medium'} sx={{ fontSize: '0.75rem' }}>
                {d.day}
              </Typography>
              {d.eventCount > 0 && (
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: 4, 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  bgcolor: d.isSelected ? 'white' : 'primary.main', 
                  boxShadow: 0 
                }} />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }, [filteredEvents, currentMonth, selectedDate, isSmDown]);

  const StatCard = React.memo(({ title, value, subtitle, icon, color = 'primary' }) => (
    <Paper variant="outlined" sx={{
      p: getResponsiveValue({ xs: 1, sm: 1.5, md: 1.5, lg: 2, xl: 2 }),
      textAlign: "center",
      boxShadow: 1,
      height: '100%',
      borderTop: `3px solid ${theme.palette[color].main}`,
      transition: 'all 0.2s',
      '&:hover': { boxShadow: 3, transform: 'translateY(-1px)' }
    }}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={0.5}>
        <Avatar sx={{ 
          bgcolor: `${color}.main`, 
          width: getResponsiveValue({ xs: 28, sm: 32, md: 32, lg: 36, xl: 36 }), 
          height: getResponsiveValue({ xs: 28, sm: 32, md: 32, lg: 36, xl: 36 })
        }}>
          {icon}
        </Avatar>
        <Typography variant={getResponsiveValue({ xs: 'h6', sm: 'h6', md: 'h5', lg: 'h5', xl: 'h5' })} fontWeight={600} color={`${color}.main`}>
          {value}
        </Typography>
      </Stack>
      <Typography variant={getResponsiveValue({ xs: 'caption', sm: 'body2', md: 'body2', lg: 'body2', xl: 'body2' })} color="text.secondary">{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  ));

  const getPeriodDisplayText = (periodType) => {
    switch(periodType) {
      case 'today': return 'Today';
      case 'thisWeek': return 'This Week';
      case 'thisMonth': return 'This Month';
      case 'previousWeek': return 'Previous Week';
      case 'previousMonth': return 'Previous Month';
      default: return periodType;
    }
  };

  const SkeletonLoader = () => (
    <Container maxWidth="xl" sx={{ p: getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 }), mt: 8 }}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Skeleton variant="circular" width={32} height={32} />
      </Box>

      <Grid container spacing={getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 })} mb={3}>
        {[...Array(3)].map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', borderTop: '3px solid', borderColor: 'divider' }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton width={40} height={40} />
              </Box>
              <Skeleton width="80%" height={20} sx={{ mx: 'auto' }} />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper variant="outlined" sx={{ mb: 1.5, p: 0.5 }}>
        <Box display="flex">
          {['Overdue Cells', 'Tasks', 'Calendar'].map((tab, i) => (
            <Box key={i} sx={{ flex: 1, p: 1, textAlign: 'center' }}>
              <Skeleton width="100%" height={24} />
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ 
        p: 2, 
        height: getResponsiveValue({ xs: 'auto', sm: 'calc(100vh - 320px)', md: 'calc(100vh - 320px)', lg: 'calc(100vh - 320px)', xl: 'calc(100vh - 320px)' }),
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {activeTab === 0 && (
          <>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Skeleton width={150} height={24} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
            {[...Array(3)].map((_, i) => (
              <Box key={i} sx={{ mb: 1.5 }}>
                <Box display="flex" alignItems="center">
                  <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1.5 }} />
                  <Box flex={1}>
                    <Skeleton width="60%" height={20} />
                    <Skeleton width="40%" height={16} sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
              </Box>
            ))}
          </>
        )}

        {activeTab === 1 && (
          <>
            <Box sx={{ mb: 2 }}>
              <Skeleton width={200} height={24} sx={{ mb: 1 }} />
            </Box>
            
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Stack spacing={1.5}>
                {[...Array(4)].map((_, i) => (
                  <Box key={i} sx={{ 
                    p: 1.5, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1
                  }}>
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box flex={1}>
                        <Skeleton width="40%" height={20} />
                        <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
                      </Box>
                      <Skeleton variant="circular" width={24} height={24} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </>
        )}

        {activeTab === 2 && (
          <>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Skeleton width={150} height={24} />
              <Skeleton width={100} height={36} sx={{ borderRadius: '18px' }} />
            </Box>
            
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: isSmDown ? 'column' : 'row', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box display="flex" justifyContent="space-between" mb={1.5}>
                  <Skeleton width={120} height={24} />
                  <Box display="flex" gap={0.5}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton width={60} height={24} sx={{ borderRadius: '12px' }} />
                    <Skeleton variant="circular" width={24} height={24} />
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: 0.25, 
                  mb: 1 
                }}>
                  {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} height={32} sx={{ borderRadius: '4px' }} />
                  ))}
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: 0.25 
                }}>
                  {[...Array(42)].map((_, i) => (
                    <Skeleton key={i} height={42} sx={{ borderRadius: '8px' }} />
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Skeleton width={200} height={24} sx={{ mb: 2 }} />
                <Stack spacing={1}>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} height={80} sx={{ borderRadius: '8px' }} />
                  ))}
                </Stack>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );

  if (stats.loading && !stats.overview) {
    return <SkeletonLoader />;
  }

  if (stats.error && !stats.overview) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Alert severity="error" action={<Button onClick={() => fetchStats()}>Retry</Button>}>
          {stats.error}
        </Alert>
      </Box>
    );
  }

  const eventsOnSelectedDate = getEventsForDate(selectedDate);
  
  return (
    <Container maxWidth="xl" sx={{ 
      p: getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2.5, xl: 2.5 }), 
      mt: getResponsiveValue({ xs: 6, sm: 7, md: 8, lg: 8, xl: 8 }) 
    }}>
      <Box display="flex" justifyContent="space-between" alignItems={isXsDown ? "flex-start" : "center"} mb={2} gap={1} flexDirection={isXsDown ? "column" : "row"}>
        <Box>
          <Typography variant={getResponsiveValue({ xs: 'h6', sm: 'h6', md: 'h5', lg: 'h5', xl: 'h5' })} fontWeight="medium">
            Dashboard
          </Typography>
          {stats.dateRange.start && stats.dateRange.end && (
            <Typography variant="caption" color="text.secondary">
              {formatDate(stats.dateRange.start)} - {formatDate(stats.dateRange.end)}
            </Typography>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" justifyContent={isXsDown ? "flex-start" : "flex-end"}>
          <FormControl size="small" sx={{ minWidth: isXsDown ? '100%' : 120, mb: isXsDown ? 1 : 0 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={handlePeriodChange}
              disabled={stats.loading}
              fullWidth={isXsDown}
            >
              {periodOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" gap={0.5}>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={() => fetchStats(true)} 
                disabled={stats.loading} 
                size="small"
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Download ${activeTab === 0 ? 'Overdue Cells' : activeTab === 1 ? 'Tasks' : 'Events'} for ${getPeriodDisplayText(period)}`}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download fontSize="small" />}
                onClick={downloadFilteredStats}
                disabled={stats.loading}
                sx={{ 
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  display: isXsDown ? 'none' : 'inline-flex'
                }}
              >
                Download
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {stats.loading && <LinearProgress sx={{ mb: 1.5 }} />}

      <Grid container spacing={getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 })} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          {stats.loading && !stats.overview ? (
            <Paper variant="outlined" sx={{ p: 2, height: '100%', borderTop: '3px solid', borderColor: 'divider' }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton width={40} height={40} />
              </Box>
              <Skeleton width="80%" height={20} sx={{ mx: 'auto' }} />
            </Paper>
          ) : (
            <StatCard 
              title="Total Attendance" 
              value={stats.overview?.total_attendance || 0} 
              icon={<People />} 
              color="primary" 
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {stats.loading && !stats.overview ? (
            <Paper variant="outlined" sx={{ p: 2, height: '100%', borderTop: '3px solid', borderColor: 'divider' }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton width={40} height={40} />
              </Box>
              <Skeleton width="80%" height={20} sx={{ mx: 'auto' }} />
            </Paper>
          ) : (
            <StatCard 
              title="Overdue Cells" 
              value={filteredOverdueCells.length || 0} 
              subtitle={`${getPeriodDisplayText(period)}`}
              icon={<Warning />} 
              color="warning" 
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {stats.loading && !stats.overview ? (
            <Paper variant="outlined" sx={{ p: 2, height: '100%', borderTop: '3px solid', borderColor: 'divider' }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton width={40} height={40} />
              </Box>
              <Skeleton width="80%" height={20} sx={{ mx: 'auto' }} />
            </Paper>
          ) : (
            <StatCard 
              title="Tasks Due" 
              value={stats.overview?.tasks_due_in_period || 0} 
              subtitle={`${getPeriodDisplayText(period)}`}
              icon={<Task />} 
              color="secondary" 
            />
          )}
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ mb: 1.5 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant={isSmDown ? "scrollable" : "standard"} 
          scrollButtons={isSmDown ? "auto" : false}
          centered={!isSmDown}
          sx={{ minHeight: 48 }}
        >
          <Tab label={`Overdue Cells (${filteredOverdueCells.length})`} />
          <Tab label={`Tasks (${filteredTasks.length})`} />
          <Tab label={`Calendar (${filteredEvents.length})`} />
        </Tabs>
      </Paper>

      <Box minHeight="400px">
        {activeTab === 0 && (
          <Paper sx={{ p: getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 }) }}>
            <Box display="flex" justifyContent="space-between" alignItems={isXsDown ? "flex-start" : "center"} mb={1.5} flexDirection={isXsDown ? "column" : "row"} gap={isXsDown ? 1 : 0}>
              <Typography variant="subtitle1" fontWeight="medium">
                Overdue Cells ({filteredOverdueCells.length})
              </Typography>
              <Box display="flex" gap={1} alignItems="center">
                <Chip 
                  label={`${getPeriodDisplayText(period)}`} 
                  color="warning" 
                  size="small" 
                  variant="outlined"
                />
                <Button
                  size="small"
                  variant="text"
                  color="warning"
                  startIcon={<Visibility fontSize="small" />}
                  onClick={() => setOverdueModalOpen(true)}
                  disabled={filteredOverdueCells.length === 0}
                  sx={{ fontSize: '0.75rem' }}
                >
                  View All
                </Button>
              </Box>
            </Box>
            {filteredOverdueCells.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6, 
                color: 'text.secondary',
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1.5
              }}>
                <Warning sx={{ fontSize: 48, opacity: 0.3, mb: 1.5 }} />
                <Typography variant="body1">No overdue cells</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                  Great job! All cells are up to date for {getPeriodDisplayText(period)}.
                </Typography>
              </Box>
            ) : (
              <>
                {filteredOverdueCells.slice(0, 5).map((c, i) => (
                  <Card key={i} variant="outlined" sx={{ mb: 1, p: 1.5, boxShadow: 1, '&:hover': { boxShadow: 2 } }}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ bgcolor: 'warning.main', mr: 1.5, width: 32, height: 32 }}><Warning fontSize="small" /></Avatar>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="medium" noWrap>{c.eventName || 'Unnamed'}</Typography>
                        <Typography variant="caption" color="textSecondary" noWrap sx={{ fontSize: '0.7rem' }}>
                          {formatDate(c.date)} • {c.eventLeaderName || 'No leader'}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                ))}
                {filteredOverdueCells.length > 5 && (
                  <Box textAlign="center" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      Showing 5 of {filteredOverdueCells.length} overdue cells
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Paper>
        )}
        
        {activeTab === 1 && (
          <Paper sx={{ 
            p: getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 }), 
            height: getResponsiveValue({ xs: 'auto', sm: 'calc(100vh - 320px)', md: 'calc(100vh - 320px)', lg: 'calc(100vh - 320px)', xl: 'calc(100vh - 320px)' }),
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: isXsDown ? "flex-start" : "center", 
              mb: 2,
              flexShrink: 0,
              flexDirection: isXsDown ? "column" : "row",
              gap: isXsDown ? 1 : 0
            }}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  All Tasks by Person ({stats.groupedTasks.length} people • {filteredTasks.length} total)
                </Typography>
              </Box>
              <Chip 
                label={`Period: ${getPeriodDisplayText(period)}`} 
                color="secondary" 
                size="small" 
                variant="outlined"
              />
            </Box>

            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555',
              },
            }}>
              {stats.groupedTasks.length === 0 && !stats.loading ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6, 
                  color: 'text.secondary',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1.5
                }}>
                  <Task sx={{ fontSize: 48, opacity: 0.3, mb: 1.5 }} />
                  <Typography variant="body1">No tasks found</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    No tasks found for {getPeriodDisplayText(period)}.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {stats.groupedTasks.map(({ user, tasks, totalCount, completedCount, incompleteCount }) => {
                    const key = user.email || user.fullName;
                    const isExpanded = expandedUsers.includes(key);

                    return (
                      <Box key={key} sx={{ 
                        backgroundColor: 'background.paper', 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        boxShadow: 1, 
                        overflow: 'hidden', 
                        transition: 'all 0.2s', 
                        '&:hover': { boxShadow: 2 } 
                      }}>
                        <Box
                          sx={{ 
                            p: 1.5, 
                            cursor: 'pointer', 
                            backgroundColor: incompleteCount > 0 ? 'error.50' : 'transparent', 
                            '&:hover': { backgroundColor: 'action.hover' } 
                          }}
                          onClick={() => toggleExpand(key)}
                        >
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <Avatar sx={{ 
                                bgcolor: 'primary.main', 
                                width: 40, 
                                height: 40, 
                                fontSize: '1rem', 
                                fontWeight: 'bold' 
                              }}>
                                {user.fullName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">{user.fullName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {totalCount} task{totalCount !== 1 ? 's' : ''} • {completedCount} completed
                                  {incompleteCount === 0 && totalCount > 0 && ' — ALL DONE!'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <IconButton size="small" sx={{ p: 0.5 }}>
                                <ExpandMore sx={{ 
                                  transition: 'transform 0.2s ease', 
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                                }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>

                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 1.5, pb: 1.5, pt: 1, backgroundColor: 'grey.50' }}>
                            <Divider sx={{ mb: 1.5 }} />
                            {tasks.length === 0 ? (
                              <Typography color="text.secondary" fontStyle="italic" variant="caption">No tasks assigned</Typography>
                            ) : (
                              <Stack spacing={1}>
                                {tasks.map(task => (
                                  <Box key={task._id} sx={{ 
                                    p: 1.5, 
                                    borderRadius: 1.5, 
                                    backgroundColor: 'background.paper', 
                                    border: '1px solid', 
                                    borderColor: 'divider', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center' 
                                  }}>
                                    <Box>
                                      <Typography variant="caption" fontWeight="medium">
                                        {task.name || task.taskType || 'Untitled Task'}
                                      </Typography>
                                      {task.contacted_person?.name && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                          Contact: {task.contacted_person.name}
                                        </Typography>
                                      )}
                                      {task.followup_date && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontSize: '0.7rem' }}>
                                          Due: {formatDate(task.followup_date)}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Chip
                                      label={task.status || 'Pending'}
                                      size="small"
                                      color={['completed', 'done'].includes(task.status?.toLowerCase()) ? 'success' : 
                                            task.status?.toLowerCase() === 'overdue' ? 'error' : 'warning'}
                                      sx={{ fontSize: '0.7rem', height: 22 }}
                                    />
                                  </Box>
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper sx={{ 
            p: getResponsiveValue({ xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2 }), 
            height: getResponsiveValue({ xs: 'auto', sm: 'calc(100vh - 320px)', md: 'calc(100vh - 320px)', lg: 'calc(100vh - 320px)', xl: 'calc(100vh - 320px)' }),
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: isXsDown ? "flex-start" : "center", 
              mb: 2,
              flexShrink: 0,
              flexDirection: isXsDown ? "column" : "row",
              gap: isXsDown ? 1 : 0
            }}>
              <Typography variant="subtitle1">
                Event Calendar ({filteredEvents.length} events)
              </Typography>
              <Button variant="contained" startIcon={<Add />} size="small" onClick={handleCreateEvent}>
                Create Event
              </Button>
            </Box>
            
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'hidden',
              display: 'flex', 
              flexDirection: isSmDown ? "column" : "row", 
              gap: 2 
            }}>
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}>
                {EnhancedCalendar}
              </Box>
              
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto',
                pr: 1 
              }}>
                <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Events on {formatDisplayDate(selectedDate)}
                </Typography>
                {eventsOnSelectedDate.length > 0 ? (
                  <Stack spacing={1}>
                    {eventsOnSelectedDate.map(e => (
                      <Card key={e._id} sx={{ 
                        p: 1.5, 
                        boxShadow: 1,
                        transition: 'all 0.2s',
                        '&:hover': { 
                          boxShadow: 2, 
                          transform: 'translateY(-1px)' 
                        }
                      }}>
                        <Typography variant="body2" fontWeight="medium">{e.eventName}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Chip 
                            label={e.eventTypeName} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                            {e.time} • {e.location || 'No location'}
                          </Typography>
                        </Box>
                        {e.eventLeaderName && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                            Leader: {e.eventLeaderName}
                          </Typography>
                        )}
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 6, 
                    color: 'text.secondary',
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    mt: 1
                  }}>
                    <Event sx={{ fontSize: 48, opacity: 0.3, mb: 1.5 }} />
                    <Typography variant="body2">No events scheduled for this date</Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<Add />} 
                      onClick={handleCreateEvent}
                      sx={{ mt: 1.5, fontSize: '0.75rem' }}
                    >
                      Create Event
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* CREATE EVENT MODAL */}
      <Dialog 
        open={createEventModalOpen} 
        onClose={() => setCreateEventModalOpen(false)} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, boxShadow: 24 } }}
        fullScreen={isXsDown}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, 
          color: 'white', 
          p: 3 
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box component="span" sx={{ fontSize: 28 }}>Create New Event</Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>{formatDisplayDate(selectedDate)}</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setCreateEventModalOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 2, 
              color: 'primary.main', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              fontSize: '0.75rem', 
              letterSpacing: 1 
            }}>
              EVENT DETAILS
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField 
                  label="Event Name" 
                  value={newEventData.eventName} 
                  onChange={e => setNewEventData(p => ({ ...p, eventName: e.target.value }))} 
                  fullWidth 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={eventTypesLoading}>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={newEventData.eventTypeName || ''}
                    onChange={e => setNewEventData(p => ({ ...p, eventTypeName: e.target.value }))}
                  >
                    {eventTypesLoading ? (
                      <MenuItem disabled>Loading event types...</MenuItem>
                    ) : eventTypes.length > 0 ? (
                      eventTypes.map((type) => (
                        <MenuItem key={type._id || type.name} value={type.name}>
                          {type.name} {type.description && `- ${type.description}`}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No event types available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Time" 
                  type="time" 
                  value={newEventData.time} 
                  onChange={e => setNewEventData(p => ({ ...p, time: e.target.value }))} 
                  fullWidth 
                  InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Location" 
                  value={newEventData.location} 
                  onChange={e => setNewEventData(p => ({ ...p, location: e.target.value }))} 
                  fullWidth 
                />
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ 
              mb: 2, 
              color: 'primary.main', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              fontSize: '0.75rem', 
              letterSpacing: 1 
            }}>
              EVENT LEADER INFORMATION
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField 
                  label="Leader Name" 
                  value={newEventData.eventLeaderName} 
                  onChange={e => setNewEventData(p => ({ ...p, eventLeaderName: e.target.value }))} 
                  fullWidth 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Leader Email" 
                  type="email" 
                  value={newEventData.eventLeaderEmail} 
                  onChange={e => setNewEventData(p => ({ ...p, eventLeaderEmail: e.target.value }))} 
                  fullWidth 
                />
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box>
            <Typography gutterBottom sx={{ 
              mb: 2, 
              color: 'primary.main', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              fontSize: '0.75rem', 
              letterSpacing: 1 
            }}>
              ADDITIONAL INFORMATION
            </Typography>
            <TextField 
              label="Description" 
              value={newEventData.description} 
              onChange={e => setNewEventData(p => ({ ...p, description: e.target.value }))} 
              fullWidth 
              multiline 
              rows={4} 
            />
            <Box mt={2} p={2} sx={{ 
              backgroundColor: 'rgba(33, 150, 243, 0.08)', 
              borderRadius: 2, 
              border: '1px solid rgba(33, 150, 243, 0.2)' 
            }}>
              <FormControlLabel 
                control={
                  <Checkbox 
                    checked={newEventData.isRecurring} 
                    onChange={e => setNewEventData(p => ({ ...p, isRecurring: e.target.checked }))} 
                  />
                } 
                label="Recurring Event" 
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: 'rgba(0,0,0,0.02)' }}>
          <Button onClick={() => setCreateEventModalOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveEvent} disabled={!newEventData.eventName}>
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* OVERDUE CELLS MODAL */}
      <Dialog open={overdueModalOpen} onClose={() => setOverdueModalOpen(false)} maxWidth="md" fullWidth fullScreen={isXsDown}>
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
          color: 'white', 
          p: 3
        }}>
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
            <IconButton onClick={() => setOverdueModalOpen(false)} sx={{ color: 'white' }}>
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
                <Card key={cell._id} variant="outlined" sx={{ p: 2, backgroundColor: 'error.50' }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'warning.main' }}><Warning /></Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {cell.eventName || 'Unnamed Cell'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Leader: {cell.eventLeaderName || 'Not assigned'} • {cell.location || 'No location'}
                      </Typography>
                      <Typography variant="caption" color="error" fontWeight="medium">
                        {formatDate(cell.date)} — {cell.status?.toUpperCase() || 'INCOMPLETE'}
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
          <Button onClick={() => setOverdueModalOpen(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default StatsDashboard;