import React, { useState, useEffect } from 'react';
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
  CssBaseline,
  useMediaQuery,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  Stack,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  TablePagination
} from '@mui/material';
import {
  TrendingUp,
  People,
  Event,
  Task,
  Refresh,
  CellTower,
  Groups,
  CheckCircle,
  Schedule,
  Warning,
  LocalActivity,
  Add,
  CalendarToday,
  Close,
  Visibility,
  ChevronLeft,
  ChevronRight,
  Save
} from '@mui/icons-material';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Centralized Event Calculation Service
class EventCalculationService {
  static isCellEvent(event) {
    if (!event.eventType) return false;
    
    const eventType = event.eventType.toLowerCase();
    return eventType.includes('cell') || 
           eventType.includes('small group') ||
           eventType.includes('small-group') ||
           eventType.includes('small_groups');
  }

  static isEventCompleted(event) {
    const did_not_meet = event.did_not_meet || false;
    const hasAttendees = event.attendees && event.attendees.length > 0;
    const status = (event.status || '').toLowerCase().trim();
    
    return hasAttendees || 
           status === 'completed' || 
           status === 'closed' || 
           did_not_meet;
  }

  static getOverdueCells(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueCells = events.filter(event => {
      if (!this.isCellEvent(event)) return false;
      if (this.isEventCompleted(event)) return false;
      if (!event.date) return false;
      
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      return eventDate < today;
    });

    return overdueCells;
  }

  static getOverdueCount(events) {
    return this.getOverdueCells(events).length;
  }
}

const StatsDashboard = () => {
  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));
  const isDarkMode = theme.palette.mode === "dark";

  // Responsive value helper
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

  const [stats, setStats] = useState({
    overview: null,
    events: [],
    overdueCells: [],
    recentPeople: 0,
    allTasks: [],
    loading: true,
    error: null
  });
  
  const [period, setPeriod] = useState('weekly');
  const [refreshing, setRefreshing] = useState(false);
  
  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState({
    eventName: '',
    eventType: 'CELLS',
    date: '',
    eventLeaderName: '',
    eventLeaderEmail: '',
    leader1: '',
    leader12: '',
    location: '',
    time: '19:00',
    description: '',
    isRecurring: false,
    recurringDay: '',
    day: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Modal states for viewing all items
  const [viewAllCellsModalOpen, setViewAllCellsModalOpen] = useState(false);
  const [viewAllTasksModalOpen, setViewAllTasksModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      setStats(prev => ({ ...prev, loading: true, error: null }));

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Calculate date range based on period
      const getDateRange = () => {
        const now = new Date();
        const start = new Date();
        
        if (period === 'weekly') {
          start.setDate(now.getDate() - 7);
        } else {
          start.setDate(now.getDate() - 30);
        }
        
        return {
          start: start.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
      };

      const dateRange = getDateRange();

      // Fetch events with simpler parameters
      let allEvents = [];
      let page = 1;
      const perPage = 50;
      let hasMore = true;

      while (hasMore) {
        const eventsParams = {
          page: page.toString(),
          perPage: perPage.toString()
        };

        const eventsResponse = await fetch(
          `${BACKEND_URL}/events?${new URLSearchParams(eventsParams)}`,
          { headers }
        );
        
        if (!eventsResponse.ok) {
          throw new Error(`Failed to fetch events: ${eventsResponse.status}`);
        }

        const eventsData = await eventsResponse.json();
        const eventsBatch = eventsData.events || eventsData.results || eventsData.data || [];
        
        if (eventsBatch.length === 0) {
          hasMore = false;
        } else {
          allEvents = [...allEvents, ...eventsBatch];
          page++;
          
          if (page > 20) {
            hasMore = false;
          }
        }
      }

      // Filter events by date range on the client side
      const filteredEvents = allEvents.filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return eventDate >= startDate && eventDate <= endDate;
      });

      // Filter global and ticketed events for attendance stats
      const globalTicketedEvents = filteredEvents.filter(event => 
        event.isGlobal || 
        event.isTicketed || 
        (event.eventType && (
          event.eventType.toLowerCase().includes('global') ||
          event.eventType.toLowerCase().includes('service') ||
          event.eventType.toLowerCase().includes('sunday') ||
          event.eventType.toLowerCase().includes('main')
        ))
      );

      // Use centralized service for overdue calculation
      const overdueCells = EventCalculationService.getOverdueCells(allEvents);

      // Fetch all tasks
      let allTasks = [];
      try {
        const tasksResponse = await fetch(`${BACKEND_URL}/tasks`, { headers });
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          allTasks = Array.isArray(tasksData) ? tasksData : tasksData.tasks || tasksData.results || [];
        }
      } catch (tasksError) {
        console.warn('Error fetching tasks:', tasksError);
      }

      // Fetch recent people count
      let recentPeopleCount = 0;
      try {
        const peopleResponse = await fetch(`${BACKEND_URL}/people?perPage=1`, { headers });
        if (peopleResponse.ok) {
          const peopleData = await peopleResponse.json();
          const totalPeople = peopleData.total || peopleData.count || 0;
          recentPeopleCount = Math.max(1, Math.floor(totalPeople * 0.1));
        }
      } catch (peopleError) {
        recentPeopleCount = Math.floor(allEvents.length * 0.1);
      }

      // Calculate overview stats
      const totalAttendance = globalTicketedEvents.reduce((sum, event) => 
        sum + (event.total_attendance || event.attendees?.length || 0), 0
      );

      const overviewData = {
        total_attendance: totalAttendance,
        outstanding_cells: overdueCells.length,
        outstanding_tasks: allTasks.length,
        recent_people: recentPeopleCount,
        events_count: globalTicketedEvents.length
      };

      setStats({
        overview: overviewData,
        events: globalTicketedEvents,
        overdueCells: overdueCells,
        recentPeople: recentPeopleCount,
        allTasks: allTasks,
        loading: false,
        error: null
      });

    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(prev => ({
        ...prev,
        error: err.message || 'Failed to load statistics',
        loading: false
      }));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const handleRefresh = () => {
    fetchStats();
  };

  // Calendar and Event Creation Functions
  const getEventsForDate = (date) => {
    return stats.events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === date;
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const eventsOnDate = getEventsForDate(date);
    if (eventsOnDate.length > 0) {
      setSnackbar({
        open: true,
        message: `${eventsOnDate.length} event(s) on ${formatDisplayDate(date)}`,
        severity: 'info'
      });
    }
  };

  const handleCreateEvent = () => {
    const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    setNewEventData({
      ...newEventData,
      date: selectedDate,
      day: dayOfWeek,
      recurringDay: newEventData.isRecurring ? newEventData.recurringDay : ''
    });
    setCreateEventModalOpen(true);
  };

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSaveEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const currentUser = JSON.parse(localStorage.getItem("userProfile") || "{}");
      const eventData = {
        ...newEventData,
        eventLeaderName: newEventData.eventLeaderName || `${currentUser.name || ''} ${currentUser.surname || ''}`.trim(),
        eventLeaderEmail: newEventData.eventLeaderEmail || currentUser.email,
        status: 'incomplete',
        UUID: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await fetch(`${BACKEND_URL}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status}`);
      }

      const result = await response.json();
      
      setCreateEventModalOpen(false);
      setNewEventData({
        eventName: '',
        eventType: 'CELLS',
        date: '',
        eventLeaderName: '',
        eventLeaderEmail: '',
        leader1: '',
        leader12: '',
        location: '',
        time: '19:00',
        description: '',
        isRecurring: false,
        recurringDay: '',
        day: ''
      });

      setSnackbar({
        open: true,
        message: 'Event created successfully!',
        severity: 'success'
      });

      fetchStats();

    } catch (error) {
      console.error('Error creating event:', error);
      setSnackbar({
        open: true,
        message: `Failed to create event: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Get events count for each day in current month
  const getMonthlyEventCounts = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyEvents = stats.events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    const counts = {};
    monthlyEvents.forEach(event => {
      const date = new Date(event.date).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    return counts;
  };

  // Enhanced Calendar Component
  const EnhancedCalendar = () => {
    const eventCounts = getMonthlyEventCounts();
    const today = new Date().toISOString().split('T')[0];
    
    const goToPreviousMonth = () => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        newMonth.setMonth(newMonth.getMonth() - 1);
        return newMonth;
      });
    };

    const goToNextMonth = () => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        newMonth.setMonth(newMonth.getMonth() + 1);
        return newMonth;
      });
    };

    const goToToday = () => {
      setCurrentMonth(new Date());
      setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const getDaysInMonth = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const firstDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null);
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const eventCount = eventCounts[dateString] || 0;
        const isSelected = dateString === selectedDate;
        const isToday = dateString === today;
        
        days.push({
          day,
          date: dateString,
          eventCount,
          isSelected,
          isToday
        });
      }
      
      return days;
    };

    const days = getDaysInMonth();

    return (
      <Box>
        {/* Calendar Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant={getResponsiveValue("body1", "h6", "h6", "h6", "h6")} fontWeight="bold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton size="small" onClick={goToPreviousMonth}>
              <ChevronLeft />
            </IconButton>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={goToToday}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              Today
            </Button>
            <IconButton size="small" onClick={goToNextMonth}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {/* Day Headers */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
            mb: 1
          }}
        >
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <Box key={day} sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" fontWeight="bold" color="textSecondary">
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Days */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
          }}
        >
          {days.map((dayInfo, index) => {
            if (!dayInfo) {
              return <Box key={`empty-${index}`} sx={{ p: 1, height: 32 }} />;
            }

            const { day, date, eventCount, isSelected, isToday } = dayInfo;

            return (
              <Box
                key={date}
                sx={{
                  p: 0.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 1,
                  backgroundColor: isSelected ? theme.palette.primary.main : 
                                  isToday ? theme.palette.action.hover : 'transparent',
                  color: isSelected ? theme.palette.primary.contrastText : 'inherit',
                  border: isToday && !isSelected ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  height: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
                onClick={() => {
                  setSelectedDate(date);
                  handleDateSelect(date);
                }}
              >
                <Typography 
                  variant="caption" 
                  fontWeight={isToday ? 'bold' : 'normal'}
                  sx={{
                    color: isSelected ? 'white' : 
                           new Date(date) < new Date().setHours(0,0,0,0) ? 'text.secondary' : 'text.primary'
                  }}
                >
                  {day}
                </Typography>
                {eventCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 1,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: isSelected ? 'white' : theme.palette.primary.main,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  // Skeleton Loaders
  const StatCardSkeleton = () => (
    <Paper
      variant="outlined"
      sx={{
        p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
        textAlign: "center",
        boxShadow: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
        <Skeleton variant="circular" width={getResponsiveValue(20, 24, 28, 32, 32)} height={getResponsiveValue(20, 24, 28, 32, 32)} />
        <Skeleton variant="text" width="40%" height={getResponsiveValue(24, 28, 32, 36, 40)} sx={{ borderRadius: 1 }} />
      </Stack>
      <Skeleton variant="text" width="70%" height={getResponsiveValue(16, 18, 20, 22, 24)} sx={{ mx: 'auto', borderRadius: 1 }} />
    </Paper>
  );

  // Stats Cards Component - Optimized for mobile
  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <Paper
      variant="outlined"
      sx={{
        p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
        textAlign: "center",
        cursor: "pointer",
        boxShadow: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
        transition: "all 0.2s",
        borderTop: `4px solid ${theme.palette[color].main}`,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
        <Avatar sx={{ 
          bgcolor: `${color}.main`, 
          width: getResponsiveValue(24, 28, 32, 36, 40), 
          height: getResponsiveValue(24, 28, 32, 36, 40)
        }}>
          {icon}
        </Avatar>
        <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color={`${color}.main`}>
          {value}
        </Typography>
      </Stack>
      <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" display="block">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  // Outstanding Item Component
  const OutstandingItem = ({ item, type, index }) => (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        boxShadow: 2,
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        "&:last-child": { mb: 0 },
        transition: "all 0.2s",
        "&:hover": { boxShadow: 4, transform: "translateY(-1px)" }
      }}
    >
      <Avatar
        sx={{
          bgcolor: type === 'cells' ? 'warning.main' : 'secondary.main',
          mr: 2,
          width: getResponsiveValue(32, 40, 48, 48, 48),
          height: getResponsiveValue(32, 40, 48, 48, 48)
        }}
      >
        {type === 'cells' ? <Warning /> : <Task />}
      </Avatar>
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight="medium" noWrap>
          {item.eventName || item.name || item.title || 'Unnamed'}
        </Typography>
        
        <Typography variant="caption" color="textSecondary" noWrap>
          {type === 'cells' ? (
            <>📅 {formatDate(item.date)} • 👥 {item.eventLeaderName || 'No leader'}</>
          ) : (
            <>📝 {item.taskType || 'Task'} • {item.assignedfor || 'Unassigned'}</>
          )}
        </Typography>

        {item.status && (
          <Chip
            size="small"
            label={item.status}
            color={item.status === 'completed' ? 'success' : 'warning'}
            sx={{ mt: 0.5 }}
          />
        )}
      </Box>
    </Card>
  );

  // Skeleton for Outstanding Items
  const OutstandingItemSkeleton = () => (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        boxShadow: 2,
        minHeight: '80px',
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        "&:last-child": { mb: 0 }
      }}
    >
      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="60%" height={16} sx={{ mt: 0.5 }} />
        <Skeleton variant="rounded" width={60} height={20} sx={{ mt: 0.5, borderRadius: 10 }} />
      </Box>
    </Card>
  );

  // Enhanced Create Event Modal
  const CreateEventModal = () => (
    <Dialog 
      open={createEventModalOpen} 
      onClose={() => setCreateEventModalOpen(false)}
      maxWidth="md"
      fullWidth
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
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant={getResponsiveValue("h6", "h6", "h5", "h5", "h5")}>
            Create New Event - {formatDisplayDate(selectedDate)}
          </Typography>
          <IconButton onClick={() => setCreateEventModalOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Event Name"
                value={newEventData.eventName}
                onChange={(e) => setNewEventData({...newEventData, eventName: e.target.value})}
                fullWidth
                required
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={getResponsiveValue("small", "small", "medium", "medium", "medium")}>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={newEventData.eventType}
                  label="Event Type"
                  onChange={(e) => setNewEventData({...newEventData, eventType: e.target.value})}
                >
                  <MenuItem value="CELLS">Cell</MenuItem>
                  <MenuItem value="GLOBAL">Global Event</MenuItem>
                  <MenuItem value="SERVICE">Service</MenuItem>
                  <MenuItem value="MEETING">Meeting</MenuItem>
                  <MenuItem value="TRAINING">Training</MenuItem>
                  <MenuItem value="OUTREACH">Outreach</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                value={newEventData.location}
                onChange={(e) => setNewEventData({...newEventData, location: e.target.value})}
                fullWidth
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Event Leader Name"
                value={newEventData.eventLeaderName}
                onChange={(e) => setNewEventData({...newEventData, eventLeaderName: e.target.value})}
                fullWidth
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Event Leader Email"
                type="email"
                value={newEventData.eventLeaderEmail}
                onChange={(e) => setNewEventData({...newEventData, eventLeaderEmail: e.target.value})}
                fullWidth
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={newEventData.isRecurring}
                    onChange={(e) => setNewEventData({...newEventData, isRecurring: e.target.checked})}
                    size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
                  />
                }
                label="This is a recurring event"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Time"
                type="time"
                value={newEventData.time}
                onChange={(e) => setNewEventData({...newEventData, time: e.target.value})}
                fullWidth
                InputLabelProps={{ shrink: true }}
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                value={newEventData.description}
                onChange={(e) => setNewEventData({...newEventData, description: e.target.value})}
                fullWidth
                multiline
                rows={3}
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
        <Button 
          onClick={() => setCreateEventModalOpen(false)} 
          size={isSmDown ? "small" : "medium"}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSaveEvent} 
          variant="contained"
          disabled={!newEventData.eventName}
          startIcon={<Save />}
          size={isSmDown ? "small" : "medium"}
        >
          Create Event
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Modal for viewing all overdue cells
  const ViewAllCellsModal = () => (
    <Dialog 
      open={viewAllCellsModalOpen} 
      onClose={() => setViewAllCellsModalOpen(false)}
      maxWidth="lg"
      fullWidth
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
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant={getResponsiveValue("h6", "h6", "h5", "h5", "h5")} fontWeight="bold">
            All Overdue Cells ({stats.overdueCells.length})
          </Typography>
          <IconButton onClick={() => setViewAllCellsModalOpen(false)} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
        {isSmDown ? (
          <Box>
            {stats.overdueCells.map((cell, index) => (
              <Card key={cell._id || index} variant="outlined" sx={{ mb: 1, p: 1.5, boxShadow: 2 }}>
                <Typography variant="subtitle2" fontWeight="medium">
                  {cell.eventName || 'Unnamed'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Leader: {cell.eventLeaderName || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Date: {formatDate(cell.date)}
                </Typography>
                <Chip
                  size="small"
                  label={cell.status || 'incomplete'}
                  color="warning"
                  sx={{ mt: 0.5 }}
                />
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Event Name</strong></TableCell>
                  <TableCell><strong>Leader</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.overdueCells.map((cell, index) => (
                  <TableRow key={cell._id || index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {cell.eventName || 'Unnamed'}
                      </Typography>
                    </TableCell>
                    <TableCell>{cell.eventLeaderName || '-'}</TableCell>
                    <TableCell>{formatDate(cell.date)}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={cell.status || 'incomplete'} 
                        color="warning"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {stats.overdueCells.length === 0 && (
          <Box textAlign="center" py={4}>
            <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No overdue cells found!
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
        <Button 
          onClick={() => setViewAllCellsModalOpen(false)} 
          size={isSmDown ? "small" : "medium"}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Error state
  if (stats.error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
        mt: 8
      }}>
        <CssBaseline />
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchStats}>
              Retry
            </Button>
          }
        >
          {stats.error}
        </Alert>
      </Box>
    );
  }

  const { overview, events, overdueCells, allTasks } = stats;
  const eventsOnSelectedDate = getEventsForDate(selectedDate);

  return (
    <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: 8, minHeight: "100vh" }}>
      <CssBaseline />
      
      {/* Header with Controls and Stats in one line */}
      <Box sx={{ mb: cardSpacing }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box sx={{ flex: 1, minWidth: isSmDown ? '100%' : 'auto' }}>
            {/* Empty space on left for balance */}
          </Box>
          
          <Box display="flex" gap={1} alignItems="center" sx={{ ml: 'auto' }}>
            <FormControl 
              size={getResponsiveValue("small", "small", "medium", "medium", "medium")} 
              sx={{ minWidth: 120 }}
            >
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e) => setPeriod(e.target.value)}
                disabled={refreshing || stats.loading}
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Refresh">
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing || stats.loading}
                color="primary"
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {(refreshing || stats.loading) && (
          <LinearProgress sx={{ mt: 1 }} />
        )}
      </Box>

      {/* Main Stats Grid - 2x2 layout on mobile */}
      <Grid container spacing={cardSpacing} sx={{ mb: cardSpacing }}>
        <Grid item xs={6} sm={6} md={3}>
          {stats.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Total Attendance"
              value={overview?.total_attendance || 0}
              subtitle={`${period} events`}
              icon={<People />}
              color="primary"
            />
          )}
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          {stats.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Overdue Cells"
              value={overview?.outstanding_cells || 0}
              subtitle="Need completion"
              icon={<CellTower />}
              color="warning"
            />
          )}
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          {stats.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="All Tasks"
              value={overview?.outstanding_tasks || 0}
              subtitle="Total tasks"
              icon={<Task />}
              color="secondary"
            />
          )}
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          {stats.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="New People"
              value={overview?.recent_people || 0}
              subtitle="Recently added"
              icon={<Groups />}
              color="success"
            />
          )}
        </Grid>
      </Grid>

      {/* Tabs for Content Sections */}
      <Paper variant="outlined" sx={{ mb: 2, boxShadow: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overdue Cells" />
          <Tab label="All Tasks" />
          <Tab label="Calendar" />
        </Tabs>
      </Paper>

      {/* Tab Content with consistent height */}
      <Box sx={{ minHeight: '400px' }}>
        {activeTab === 0 && (
          <Paper variant="outlined" sx={{ boxShadow: 3, p: isSmDown ? 1 : 2, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              {stats.loading ? (
                <>
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 16 }} />
                </>
              ) : (
                <>
                  <Typography variant={getResponsiveValue("h6", "h6", "h5", "h5", "h5")} fontWeight="bold">
                    Overdue Cells
                  </Typography>
                  <Chip 
                    label={overdueCells.length} 
                    color="warning" 
                    variant="outlined"
                  />
                </>
              )}
            </Box>

            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {stats.loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <OutstandingItemSkeleton key={index} />
                ))
              ) : overdueCells.length > 0 ? (
                overdueCells.slice(0, 5).map((cell, index) => (
                  <OutstandingItem
                    key={cell._id || index}
                    item={cell}
                    type="cells"
                    index={index}
                  />
                ))
              ) : (
                <Box textAlign="center" py={4}>
                  <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    All cells are completed!
                  </Typography>
                </Box>
              )}
              
              {!stats.loading && overdueCells.length > 5 && (
                <Box textAlign="center" mt={2}>
                  <Button 
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => setViewAllCellsModalOpen(true)}
                    size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
                  >
                    View All {overdueCells.length} Cells
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {activeTab === 1 && (
          <Paper variant="outlined" sx={{ boxShadow: 3, p: isSmDown ? 1 : 2, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              {stats.loading ? (
                <>
                  <Skeleton variant="text" width="30%" height={32} />
                  <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 16 }} />
                </>
              ) : (
                <>
                  <Typography variant={getResponsiveValue("h6", "h6", "h5", "h5", "h5")} fontWeight="bold">
                    All Tasks
                  </Typography>
                  <Chip 
                    label={allTasks.length} 
                    color="secondary" 
                    variant="outlined"
                  />
                </>
              )}
            </Box>

            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {stats.loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <OutstandingItemSkeleton key={index} />
                ))
              ) : allTasks.length > 0 ? (
                allTasks.slice(0, 5).map((task, index) => (
                  <OutstandingItem
                    key={task._id || index}
                    item={task}
                    type="tasks"
                    index={index}
                  />
                ))
              ) : (
                <Box textAlign="center" py={4}>
                  <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No tasks found!
                  </Typography>
                </Box>
              )}
              
              {!stats.loading && allTasks.length > 5 && (
                <Box textAlign="center" mt={2}>
                  <Button 
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => setViewAllTasksModalOpen(true)}
                    size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
                  >
                    View All {allTasks.length} Tasks
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper variant="outlined" sx={{ boxShadow: 3, p: isSmDown ? 1 : 2, height: '100%' }}>
            {stats.loading ? (
              <Box>
                <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
              </Box>
            ) : (
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
                  <Typography variant={getResponsiveValue("h6", "h6", "h5", "h5", "h5")} fontWeight="bold">
                    Event Calendar
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip 
                      icon={<CalendarToday />}
                      label={formatDisplayDate(selectedDate)}
                      variant="outlined"
                      size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
                    />
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleCreateEvent}
                      size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
                    >
                      Create Event
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: isSmDown ? 'column' : 'row', gap: 3 }}>
                  {/* Enhanced Calendar */}
                  <Box sx={{ flex: 1 }}>
                    <EnhancedCalendar />
                  </Box>

                  {/* Events for selected date */}
                  <Box sx={{ flex: 1, minWidth: isSmDown ? '100%' : 300 }}>
                    <Typography variant={getResponsiveValue("body1", "h6", "h6", "h6", "h6")} gutterBottom>
                      Events on {formatDisplayDate(selectedDate)}
                    </Typography>
                    
                    <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
                      {eventsOnSelectedDate.length > 0 ? (
                        eventsOnSelectedDate.map((event, index) => (
                          <Card key={event._id || index} sx={{ mb: 1, p: 1.5 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {event.eventName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Type: {event.eventType} • {event.time || 'No time set'}
                            </Typography>
                            <Chip
                              size="small"
                              label={event.status || 'incomplete'}
                              color={event.status === 'completed' ? 'success' : 'warning'}
                              sx={{ mt: 0.5 }}
                            />
                          </Card>
                        ))
                      ) : (
                        <Box textAlign="center" py={3}>
                          <Event color="disabled" sx={{ fontSize: 48, mb: 1 }} />
                          <Typography variant="body2" color="textSecondary">
                            No events scheduled
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* Modals */}
      <CreateEventModal />
      <ViewAllCellsModal />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StatsDashboard;