import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Grid, Typography, Card, CardContent, LinearProgress, Chip, IconButton, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, Avatar, useTheme, useMediaQuery,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Checkbox, FormControlLabel, Stack, Divider, Tooltip, Tabs, Tab
} from '@mui/material';
import Collapse from '@mui/material/Collapse';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  People, CellTower, Task, Warning, Groups, Refresh, Add, CalendarToday, Close,
  Visibility, ChevronLeft, ChevronRight, Save, CheckCircle, Event
} from '@mui/icons-material';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const StatsDashboard = () => {
  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

  const getResponsiveValue = (xs, sm, md, lg, xl) => {
    if (isXsDown) return xs;
    if (isSmDown) return sm;
    if (isMdDown) return md;
    return lg !== undefined ? lg : xl;
  };
  
  const containerPadding = getResponsiveValue(1, 1.5, 2, 2.5, 2.5); // Reduced padding
  const titleVariant = getResponsiveValue("subtitle1", "h6", "h5", "h4", "h4");
  const cardSpacing = getResponsiveValue(1, 1.5, 2, 2, 2); // Reduced spacing
  
  const [stats, setStats] = useState({
    overview: null,
    events: [],
    overdueCells: [],
    allTasks: [],
    allUsers: [],
    groupedTasks: [],
    loading: true,
    error: null
  });

  const [period] = useState('weekly'); // Removed period state change functionality
  const [taskFilter, setTaskFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
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
  const [initialLoad, setInitialLoad] = useState(true);

  const CACHE_DURATION = 5 * 60 * 1000;

  const getDateRange = useCallback(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    // Always use weekly (removed period switching)
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    end.setDate(now.getDate() + (6 - day));

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }, []);

  const getTaskFilterDateRange = useCallback((filter) => {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    
    switch(filter) {
      case 'lastWeek':
        start.setDate(now.getDate() - 7 - now.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'lastMonth':
        start.setMonth(now.getMonth() - 1);
        start.setDate(1);
        end.setMonth(now.getMonth() - 1);
        end.setDate(new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate());
        break;
      case 'thisWeek':
        start.setDate(now.getDate() - now.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'thisMonth':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'all':
      default:
        start.setFullYear(now.getFullYear() - 1);
        end.setFullYear(now.getFullYear() + 1);
        break;
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, []);

  const fetchStats = useCallback(async () => {
    const cacheKey = `statsDashboard_${period}_${taskFilter}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData && !refreshing) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_DURATION) {
        setStats({
          ...data,
          loading: false,
          error: null
        });
        setInitialLoad(false);
        return;
      }
    }

    try {
      setRefreshing(true);
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      const token = localStorage.getItem("token");
      const headers = { 
        Authorization: `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      };

      const { start: periodStart, end: periodEnd } = getDateRange();
      const { start: taskStart, end: taskEnd } = getTaskFilterDateRange(taskFilter);
      
      const periodStartDate = periodStart.toISOString().split('T')[0];
      const periodEndDate = periodEnd.toISOString().split('T')[0];
      const taskStartDate = taskStart.toISOString().split('T')[0];
      const taskEndDate = taskEnd.toISOString().split('T')[0];

      const response = await fetch(
        `${BACKEND_URL}/stats/dashboard-comprehensive?period=${period}&task_filter=${taskFilter}&task_start=${taskStartDate}&task_end=${taskEndDate}&period_start=${periodStartDate}&period_end=${periodEndDate}`, 
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const newStats = {
        overview: data.overview,
        events: data.overdueCells || [],
        overdueCells: data.overdueCells || [],
        allTasks: data.allTasks || [],
        allUsers: data.allUsers || [],
        groupedTasks: data.groupedTasks || [],
        loading: false,
        error: null
      };

      setStats(newStats);
      setInitialLoad(false);
      
      localStorage.setItem(cacheKey, JSON.stringify({
        data: newStats,
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error("Fetch stats error:", err);
      
      try {
        const token = localStorage.getItem("token");
        const headers = { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        };
        
        const quickResponse = await fetch(`${BACKEND_URL}/stats/dashboard-quick?period=${period}`, { headers });
        if (quickResponse.ok) {
          const quickData = await quickResponse.json();
          
          const tasksResponse = await fetch(`${BACKEND_URL}/tasks/all-optimized?period=${period}&limit=200`, { headers });
          const tasksData = tasksResponse.ok ? await tasksResponse.json() : { tasks: [] };
          
          const tasksByUser = {};
          tasksData.tasks?.forEach(task => {
            const assignedTo = task.assignedfor;
            if (assignedTo) {
              if (!tasksByUser[assignedTo]) {
                tasksByUser[assignedTo] = {
                  tasks: [],
                  completed: 0,
                  incomplete: 0
                };
              }
              
              tasksByUser[assignedTo].tasks.push(task);
              const status = (task.status || '').toLowerCase();
              if (['completed', 'done', 'closed'].includes(status)) {
                tasksByUser[assignedTo].completed++;
              } else {
                tasksByUser[assignedTo].incomplete++;
              }
            }
          });
          
          const groupedTasks = Object.entries(tasksByUser).map(([email, data]) => ({
            user: {
              _id: email,
              fullName: email.split('@')[0],
              email: email
            },
            tasks: data.tasks,
            totalCount: data.tasks.length,
            completedCount: data.completed,
            incompleteCount: data.incomplete
          }));
          
          const newStats = {
            overview: quickData.overview,
            events: quickData.overdueCellsSample || [],
            overdueCells: quickData.overdueCellsSample || [],
            allTasks: tasksData.tasks || [],
            allUsers: [],
            groupedTasks: groupedTasks,
            loading: false,
            error: null
          };
          
          setStats(newStats);
          localStorage.setItem(cacheKey, JSON.stringify({
            data: newStats,
            timestamp: Date.now()
          }));
        } else {
          throw err;
        }
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        setStats(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load data', 
          loading: false 
        }));
      }
      
      setInitialLoad(false);
    } finally {
      setRefreshing(false);
    }
  }, [period, refreshing, getDateRange, getTaskFilterDateRange, taskFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!initialLoad) {
      fetchStats();
    }
  }, [taskFilter]);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/event-types`, {
          headers: { Authorization: `Bearer ${token}` }
        });

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
  }, []);

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
    stats.events.filter(e => e.date && new Date(e.date).toISOString().split('T')[0] === date),
    [stats.events]
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
      const token = localStorage.getItem("token");
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

      const res = await fetch(`${BACKEND_URL}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
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
      
      const cacheKey = `statsDashboard_${period}_${taskFilter}`;
      localStorage.removeItem(cacheKey);
    } catch (err) {
      console.error("Create event failed:", err);
      setSnackbar({ open: true, message: err.message || 'Failed to create event', severity: 'error' });
    }
  };

  const EnhancedCalendar = useMemo(() => {
    const eventCounts = {};
    stats.events.forEach(e => {
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
  }, [stats.events, currentMonth, selectedDate, isSmDown]);

  const StatCard = React.memo(({ title, value, subtitle, icon, color = 'primary' }) => (
    <Paper variant="outlined" sx={{
      p: getResponsiveValue(1, 1.5, 1.5, 2, 2),
      textAlign: "center",
      boxShadow: 1,
      height: '100%',
      borderTop: `3px solid ${theme.palette[color].main}`,
      transition: 'all 0.2s',
      '&:hover': { boxShadow: 3, transform: 'translateY(-1px)' }
    }}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={0.5}>
        <Avatar sx={{ bgcolor: `${color}.main`, width: 32, height: 32 }}>{icon}</Avatar>
        <Typography variant="h5" fontWeight={600} color={`${color}.main`}>
          {value}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  ));

  if (initialLoad && stats.loading) {
    return (
      <Box p={containerPadding} maxWidth="1400px" mx="auto" mt={8}>
        <Grid container spacing={cardSpacing} mb={3}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
        <Box mt={3}>
          <Skeleton variant="rectangular" height={350} />
        </Box>
      </Box>
    );
  }

  if (stats.error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Alert severity="error" action={<Button onClick={fetchStats}>Retry</Button>}>
          {stats.error}
        </Alert>
      </Box>
    );
  }

  const eventsOnSelectedDate = getEventsForDate(selectedDate);
  
  return (
    <Box p={containerPadding} maxWidth="1400px" mx="auto" mt={8}>
      {/* Removed period dropdown - only refresh button remains */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2} gap={1}>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchStats} disabled={refreshing} size="small">
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {(stats.loading || refreshing) && <LinearProgress sx={{ mb: 1.5 }} />}

      {/* Removed "People Behind" card - now only 3 cards */}
      <Grid container spacing={cardSpacing} mb={3}>
        <Grid item xs={6} md={4}>
          {stats.loading ? <Skeleton variant="rectangular" height={100} /> : 
            <StatCard title="Total Attendance" value={stats.overview?.total_attendance || 0} icon={<People />} color="primary" />
          }
        </Grid>
        <Grid item xs={6} md={4}>
          {stats.loading ? <Skeleton variant="rectangular" height={100} /> :
            <>
              <StatCard title="Overdue Cells" value={stats.overview?.outstanding_cells || 0} icon={<Warning />} color="warning" />
            </>
          }
        </Grid>
        <Grid item xs={6} md={4}>
          {stats.loading ? <Skeleton variant="rectangular" height={100} /> : 
            <StatCard title="Incomplete Tasks" value={stats.overview?.outstanding_tasks || 0} icon={<Task />} color="secondary" />
          }
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ mb: 1.5 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)} 
          variant={isSmDown ? "scrollable" : "standard"} 
          centered
          sx={{ minHeight: 48 }}
        >
          <Tab label="Overdue Cells" />
          <Tab label="Tasks" />
          <Tab label="Calendar" />
        </Tabs>
      </Paper>

      {/* Reduced container height */}
      <Box minHeight="400px">
        {activeTab === 0 && (
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1.5}>
              <Typography variant="subtitle1" fontWeight="medium">Overdue Cells</Typography>
              <Chip label={stats.overdueCells.length} color="warning" size="small" />
            </Box>
            {stats.overdueCells.slice(0, 5).map((c, i) => (
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
            <Box textAlign="center" mt={1}>
              <Button
                size="small"
                variant="text"
                color="warning"
                startIcon={<Visibility fontSize="small" />}
                onClick={() => setOverdueModalOpen(true)}
                disabled={(stats.overview?.outstanding_cells || 0) === 0}
                sx={{ fontSize: '0.75rem' }}
              >
                View All
              </Button>
            </Box>
          </Paper>
        )}
        
        {activeTab === 1 && (
          <Paper sx={{ 
            p: 2, 
            height: 'calc(100vh - 320px)', // Reduced height
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2,
              flexShrink: 0 
            }}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  All Tasks by Person ({stats.groupedTasks.length} people • {stats.allTasks.length} total)
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label="All"
                    size="small"
                    color={taskFilter === 'all' ? 'primary' : 'default'}
                    onClick={() => setTaskFilter('all')}
                    clickable
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                  <Chip
                    label="Last Week"
                    size="small"
                    color={taskFilter === 'lastWeek' ? 'primary' : 'default'}
                    onClick={() => setTaskFilter('lastWeek')}
                    clickable
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                  <Chip
                    label="Last Month"
                    size="small"
                    color={taskFilter === 'lastMonth' ? 'primary' : 'default'}
                    onClick={() => setTaskFilter('lastMonth')}
                    clickable
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                  <Chip
                    label="This Week"
                    size="small"
                    color={taskFilter === 'thisWeek' ? 'primary' : 'default'}
                    onClick={() => setTaskFilter('thisWeek')}
                    clickable
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                  <Chip
                    label="This Month"
                    size="small"
                    color={taskFilter === 'thisMonth' ? 'primary' : 'default'}
                    onClick={() => setTaskFilter('thisMonth')}
                    clickable
                    sx={{ fontSize: '0.7rem', height: 24 }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                  Showing: {taskFilter === 'all' ? 'All time' : 
                           taskFilter === 'lastWeek' ? 'Last week' :
                           taskFilter === 'lastMonth' ? 'Last month' :
                           taskFilter === 'thisWeek' ? 'This week' : 'This month'}
                </Typography>
              </Box>
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
                            {/* Reduced avatar size */}
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
                              {/* Reduced text sizes */}
                              <Typography variant="body2" fontWeight="medium">{user.fullName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {totalCount} task{totalCount !== 1 ? 's' : ''} • {completedCount} completed
                                {/* {incompleteCount > 0 && ` • ${incompleteCount} behind`} */}
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
                
                {stats.groupedTasks.length === 0 && !stats.loading && (
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
                      {taskFilter === 'all' ? 'No tasks have been assigned yet.' :
                       `No tasks found for ${taskFilter === 'lastWeek' ? 'last week' :
                        taskFilter === 'lastMonth' ? 'last month' :
                        taskFilter === 'thisWeek' ? 'this week' : 'this month'}.`}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper sx={{ 
            p: 2, 
            height: 'calc(100vh - 390px)', // Same reduced height as tasks tab
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2,
              flexShrink: 0 
            }}>
              <Typography variant="subtitle1">Event Calendar</Typography>
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

      {/* CREATE EVENT MODAL - unchanged except for minor spacing adjustments */}
      <Dialog open={createEventModalOpen} onClose={() => setCreateEventModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: 24 } }}>
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
      <Dialog open={overdueModalOpen} onClose={() => setOverdueModalOpen(false)} maxWidth="md" fullWidth>
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
                  Overdue / Incomplete Cells ({stats.overdueCells.length})
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
          {stats.overdueCells.length === 0 ? (
            <Typography color="text.secondary" align="center" py={4}>
              No overdue cells — great job!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {stats.overdueCells.map((cell) => (
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
    </Box>
  );
};

export default StatsDashboard;