import React, { useState, useEffect, useCallback } from 'react';
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

// Skeleton Components
const StatCardSkeleton = () => (
  <Paper variant="outlined" sx={{
    p: 3,
    textAlign: "center",
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140
  }}>
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton variant="text" width={60} height={40} />
    </Stack>
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="60%" />
  </Paper>
);

const TaskRowSkeleton = () => (
  <Box sx={{ p: 2, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 1 }}>
    <Box display="flex" alignItems="center" gap={1.5}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box flex={1}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="40%" height={16} />
      </Box>
      <Skeleton variant="rounded" width={70} height={28} />
    </Box>
  </Box>
);

const EventCardSkeleton = () => (
  <Card variant="outlined" sx={{ mb: 1, p: 1.5 }}>
    <Box display="flex" alignItems="center">
      <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1.5 }} />
      <Box flex={1}>
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="60%" height={16} />
      </Box>
    </Box>
  </Card>
);

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
  const containerPadding = getResponsiveValue(1, 2, 3, 4, 4);
  const titleVariant = getResponsiveValue("subtitle1", "h6", "h5", "h4", "h4");
  const cardSpacing = getResponsiveValue(1, 2, 2, 3, 3);
  
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

  const [period, setPeriod] = useState('weekly');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedUsers, setExpandedUsers] = useState([]);
  const [newEventData, setNewEventData] = useState({
    eventName: '', 
    eventTypeName: '', 
    date: '', 
    eventLeaderName: '', 
    eventLeaderEmail: '',
    location: '', 
    time: '19:00', 
    description: '', 
    isRecurring: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const m = new Date(prev);
      m.setMonth(m.getMonth() - 1);
      return m;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const m = new Date(prev);
      m.setMonth(m.getMonth() + 1);
      return m;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getDateRange = () => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (period === 'weekly') {
      // Monday to Sunday week (backend uses Monday as start)
      const day = now.getDay(); // 0 = Sunday
      // Adjust to get Monday as start
      const daysSinceMonday = day === 0 ? 6 : day - 1;
      start.setDate(now.getDate() - daysSinceMonday); // Start: Monday
      end.setDate(start.getDate() + 6); // End: Sunday
    } else if (period === 'monthly') {
      start.setDate(1); // First day of month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of current month
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const fetchStats = useCallback(async (forceRefresh = false) => {
    const cacheKey = `statsDashboard_${period}`;
    
    // If not forcing refresh, check cache
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setStats({
            ...data,
            loading: false,
            error: null
          });
          return;
        }
      }
    }

    try {
      setRefreshing(true);
      setIsRefreshing(true);
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      const token = localStorage.getItem("token");
      const headers = { 
        Authorization: `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      };

      // Use the new optimized endpoint
      const response = await fetch(
        `${BACKEND_URL}/stats/dashboard-optimized?period=${period}&include_details=true`, 
        { headers }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to load dashboard data`);
      }

      const dashboardData = await response.json();

      if (!dashboardData.success) {
        throw new Error('Failed to load dashboard data');
      }

      // Transform the backend data to match your frontend structure
      const transformedData = {
        overview: {
          total_attendance: dashboardData.overview?.total_attendance || 0,
          outstanding_cells: dashboardData.overview?.outstanding_cells || 0,
          outstanding_tasks: dashboardData.overview?.outstanding_tasks || 0,
          people_behind: dashboardData.overview?.people_behind || 0,
          total_tasks: dashboardData.overview?.total_tasks || 0,
          completed_tasks: dashboardData.overview?.completed_tasks || 0
        },
        events: dashboardData.upcoming_events || [],
        overdueCells: dashboardData.overdue_cells || [],
        allTasks: [], // Will be populated from grouped_tasks
        allUsers: [], // Will be extracted from grouped_tasks
        groupedTasks: dashboardData.grouped_tasks || [],
        loading: false,
        error: null
      };

      // Extract tasks and users from grouped_tasks
      const allTasks = [];
      const allUsers = new Set();
      
      dashboardData.grouped_tasks?.forEach(group => {
        if (group.user) {
          allUsers.add({
            _id: group.user._id,
            name: group.user.fullName?.split(' ')[0] || '',
            surname: group.user.fullName?.split(' ')[1] || '',
            email: group.user.email,
            fullName: group.user.fullName
          });
        }
        
        if (group.tasks) {
          group.tasks.forEach(task => {
            allTasks.push({
              ...task,
              assignedfor: group.user?.email
            });
          });
        }
      });

      transformedData.allTasks = allTasks;
      transformedData.allUsers = Array.from(allUsers);

      // Set the transformed data to state
      setStats(transformedData);

      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify({
        data: transformedData,
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error("Fetch stats error:", err);
      setStats(prev => ({ 
        ...prev, 
        error: err.message || 'Failed to load dashboard data', 
        loading: false 
      }));
    } finally {
      setRefreshing(false);
      setTimeout(() => setIsRefreshing(false), 1000); // Keep spinning for at least 1 second
    }
  }, [period]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch when period changes
  useEffect(() => {
    fetchStats();
  }, [period]);

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

  const toggleExpand = (key) => {
    setExpandedUsers(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]);
  };

  const formatDate = (d) => {
    if (!d) return 'Not set';
    
    try {
      // Check if it's an ISO string (from backend)
      if (typeof d === 'string' && d.includes('T')) {
        return new Date(d).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      
      // Fallback for other date formats
      return new Date(d).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      console.error("Date formatting error:", e, d);
      return 'Invalid date';
    }
  };

  const formatDisplayDate = (d) => !d ? 'Not set' : new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const getEventsForDate = (date) => {
    return stats.events.filter(e => {
      if (!e.date) return false;
      
      try {
        const eventDate = new Date(e.date);
        const compareDate = new Date(date);
        
        return eventDate.toISOString().split('T')[0] === 
               compareDate.toISOString().split('T')[0];
      } catch (err) {
        return false;
      }
    });
  };

  const handleCreateEvent = () => {
    // Clear all fields - start with empty form
    setNewEventData({
      eventName: '', 
      eventTypeName: eventTypes.length > 0 ? eventTypes[0].name : '', 
      date: selectedDate,
      eventLeaderName: '', 
      eventLeaderEmail: '',
      location: '', 
      time: '19:00', 
      description: '', 
      isRecurring: false,
    });
    setCreateEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!newEventData.eventName.trim()) {
      setSnackbar({ open: true, message: 'Event Name is required!', severity: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const payload = {
        eventName: newEventData.eventName.trim(),
        eventTypeName: newEventData.eventTypeName || (eventTypes.length > 0 ? eventTypes[0].name : 'CELLS'),
        date: newEventData.date || selectedDate,
        time: newEventData.time || '19:00',
        location: newEventData.location || null,
        description: newEventData.description || null,
        eventLeaderName: newEventData.eventLeaderName || null,
        eventLeaderEmail: newEventData.eventLeaderEmail || null,
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
        eventName: '', 
        eventTypeName: '', 
        date: '', 
        eventLeaderName: '', 
        eventLeaderEmail: '',
        location: '', 
        time: '19:00', 
        description: '', 
        isRecurring: false,
      });

      setSnackbar({ open: true, message: 'Event created successfully!', severity: 'success' });
      
      // Force refresh the stats data
      fetchStats(true);
    } catch (err) {
      console.error("Create event failed:", err);
      setSnackbar({ open: true, message: err.message || 'Failed to create event', severity: 'error' });
    }
  };

  const handleRefresh = () => {
    fetchStats(true); // Force refresh bypassing cache
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <Paper variant="outlined" sx={{
      p: getResponsiveValue(1.5, 2, 2.5, 3, 3),
      textAlign: "center",
      boxShadow: 3,
      height: '100%',
      borderTop: `4px solid ${theme.palette[color].main}`,
      transition: 'all 0.2s',
      '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
    }}>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
        <Avatar sx={{ bgcolor: `${color}.main` }}>{icon}</Avatar>
        <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color={`${color}.main`}>
          {value}
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary">{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  );

  if (stats.error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Alert severity="error" action={<Button onClick={handleRefresh}>Retry</Button>}>
          {stats.error}
        </Alert>
      </Box>
    );
  }

  const eventsOnSelectedDate = getEventsForDate(selectedDate);
  
  return (
    <Box p={containerPadding} maxWidth="1400px" mx="auto" mt={8}>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3} gap={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={e => setPeriod(e.target.value)}>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh">
          <IconButton 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            sx={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {(stats.loading || refreshing) && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={cardSpacing} mb={4}>
        <Grid item xs={6} md={3}>
          {stats.loading ? <StatCardSkeleton /> : <StatCard title="Total Attendance" value={stats.overview?.total_attendance || 0} icon={<People />} color="primary" />}
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <StatCardSkeleton /> :
            <StatCard title="Overdue Cells" value={stats.overview?.outstanding_cells || 0} icon={<Warning />} color="warning" />
          }
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <StatCardSkeleton /> : <StatCard title="Incomplete Tasks" value={stats.overview?.outstanding_tasks || 0} icon={<Task />} color="secondary" />}
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <StatCardSkeleton /> : <StatCard title="People Behind" value={stats.overview?.people_behind || 0} icon={<Warning />} color="error" />}
        </Grid>
      </Grid>

      {/* Main Content Container with Consistent Height */}
      <Paper 
        variant="outlined" 
        sx={{ 
          mb: 2,
          height: '60vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)} 
          variant={isSmDown ? "scrollable" : "standard"} 
          centered
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            flexShrink: 0
          }}
        >
          <Tab label="Overdue Cells" />
          <Tab label="Tasks" />
          <Tab label="Calendar" />
        </Tabs>

        {/* Tab Content Container - Takes remaining space */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'hidden',
          p: { xs: 1.5, sm: 2, md: 3 },
        }}>
          {activeTab === 0 && (
            <Box height="100%" display="flex" flexDirection="column">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Overdue Cells</Typography>
                <Chip label={stats.overview?.outstanding_cells || 0} color="warning" />
              </Box>
              {stats.loading ? (
                <Box flex={1} overflow="auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <EventCardSkeleton key={i} />
                  ))}
                </Box>
              ) : (
                <Box flex={1} overflow="auto">
                  {stats.overdueCells.slice(0, 5).map((c, i) => (
                    <Card key={i} variant="outlined" sx={{ mb: 1.5, p: 2, boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}><Warning /></Avatar>
                        <Box flex={1}>
                          <Typography variant="subtitle2" fontWeight="medium" noWrap>{c.eventName || 'Unnamed'}</Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>
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
                      startIcon={<Visibility />}
                      onClick={() => setOverdueModalOpen(true)}
                      disabled={(stats.overview?.outstanding_cells || 0) === 0}
                    >
                      View All
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box height="100%" display="flex" flexDirection="column">
              <Typography variant="h6" gutterBottom mb={2}>
                All Tasks by Person ({stats.groupedTasks.length} people • {stats.allTasks.length} total)
              </Typography>

              {stats.loading ? (
                <Box flex={1} overflow="auto">
                  <Stack spacing={2}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TaskRowSkeleton key={i} />
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box flex={1} overflow="auto" sx={{ 
                  pr: 1,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px',
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
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          '&:hover': { boxShadow: 2 }
                        }}>
                          <Box
                            sx={{ 
                              p: 2, 
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
                                  <Typography variant="subtitle1" fontWeight="bold">{user.fullName}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {totalCount} task{totalCount !== 1 ? 's' : ''} • {completedCount} done
                                    {incompleteCount > 0 && ` • ${incompleteCount} behind`}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                {incompleteCount > 0 && (
                                  <Chip 
                                    label={`${incompleteCount} behind`} 
                                    color="error" 
                                    size="small" 
                                    sx={{ fontWeight: 'bold' }} 
                                  />
                                )}
                                <IconButton size="small">
                                  <ExpandMore sx={{ 
                                    transition: 'transform 0.2s ease', 
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' 
                                  }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>

                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ px: 2, pb: 2, pt: 1, backgroundColor: 'grey.50' }}>
                              <Divider sx={{ mb: 1.5 }} />
                              {tasks.length === 0 ? (
                                <Typography color="text.secondary" fontStyle="italic" align="center">
                                  No tasks assigned
                                </Typography>
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
                                        <Typography variant="body2" fontWeight="medium">
                                          {task.name || task.taskType || 'Untitled Task'}
                                        </Typography>
                                        {task.contacted_person?.name && (
                                          <Typography variant="caption" color="text.secondary">
                                            Contact: {task.contacted_person.name}
                                          </Typography>
                                        )}
                                      </Box>
                                      <Chip
                                        label={task.status || 'Pending'}
                                        size="small"
                                        color={['completed', 'done'].includes(task.status?.toLowerCase()) ? 'success' : task.status?.toLowerCase() === 'overdue' ? 'error' : 'warning'}
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
                </Box>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box height="100%" display="flex" flexDirection="column">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Event Calendar</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleCreateEvent}>
                  Create Event
                </Button>
              </Box>
              
              {stats.loading ? (
                <Box flex={1} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={3}>
                  {/* Calendar Skeleton */}
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 2,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ flexShrink: 0 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Skeleton variant="text" width={200} height={40} />
                        <Box display="flex" gap={1}>
                          <Skeleton variant="circular" width={40} height={40} />
                          <Skeleton variant="rounded" width={80} height={40} />
                          <Skeleton variant="circular" width={40} height={40} />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                        {Array.from({ length: 7 }).map((_, i) => (
                          <Skeleton key={i} variant="text" height={40} sx={{ textAlign: 'center' }} />
                        ))}
                      </Box>
                    </Box>
                    <Box flex={1} overflow="auto">
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                        {Array.from({ length: 42 }).map((_, i) => (
                          <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 2 }} />
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  {/* Events List Skeleton */}
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                      <Skeleton variant="text" width="60%" height={28} />
                      <Skeleton variant="text" width="40%" height={20} />
                    </Box>
                    <Box flex={1} overflow="auto" p={2}>
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Box key={i} sx={{ mb: 1.5, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <Skeleton variant="text" width="80%" />
                          <Skeleton variant="text" width="60%" />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box flex={1} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={3}>
                  {/* Calendar Container */}
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ flexShrink: 0, p: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </Typography>
                        <Box display="flex" gap={1}>
                          <IconButton size="small" onClick={goToPreviousMonth}>
                            <ChevronLeft />
                          </IconButton>
                          <Button size="small" variant="outlined" onClick={goToToday}>
                            Today
                          </Button>
                          <IconButton size="small" onClick={goToNextMonth}>
                            <ChevronRight />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Weekday Headers */}
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: 0.5, 
                        mb: 1,
                        backgroundColor: 'background.paper',
                        borderRadius: 2,
                        overflow: 'hidden'
                      }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                          <Box key={i} sx={{ 
                            py: 1.5, 
                            textAlign: 'center', 
                            fontWeight: 'bold', 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                            color: 'text.primary', 
                            backgroundColor: i === 0 || i === 6 ? 'action.hover' : 'transparent',
                            borderRight: i < 6 ? '1px solid' : 'none', 
                            borderColor: 'divider' 
                          }}>
                            {isSmDown ? day[0] : day}
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    {/* Calendar Days Container - Scrollable */}
                    <Box flex={1} overflow="auto" p={2} pt={0}>
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(7, 1fr)', 
                        gap: 0.5 
                      }}>
                        {(() => {
                          // Calculate event counts for each date
                          const eventCounts = {};
                          stats.events.forEach(e => {
                            if (e.date) {
                              const d = e.date.split('T')[0];
                              eventCounts[d] = (eventCounts[d] || 0) + 1;
                            }
                          });

                          const today = new Date().toISOString().split('T')[0];
                          const year = currentMonth.getFullYear();
                          const month = currentMonth.getMonth();
                          const firstDay = new Date(year, month, 1).getDay();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const days = [];
                          
                          // Add empty cells for days before the first day of month
                          for (let i = 0; i < firstDay; i++) days.push(null);
                          
                          // Add days of the month
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
                          
                          return days.map((d, i) => !d ? (
                            <Box key={`empty-${i}`} sx={{ height: 52 }} />
                          ) : (
                            <Box
                              key={d.date}
                              onClick={() => setSelectedDate(d.date)}
                              sx={{
                                height: 52,
                                borderRadius: 2,
                                cursor: 'pointer',
                                backgroundColor: d.isSelected ? 'primary.main' : d.isToday ? 'primary.50' : 'background.default',
                                color: d.isSelected ? 'white' : d.isToday ? 'primary.main' : 'text.primary',
                                border: d.isToday && !d.isSelected ? '2px solid' : '1px solid',
                                borderColor: d.isToday && !d.isSelected ? 'primary.main' : 'divider',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                '&:hover': { 
                                  backgroundColor: d.isSelected ? 'primary.dark' : 'action.hover', 
                                  transform: 'translateY(-2px)', 
                                  boxShadow: 4 
                                }
                              }}
                            >
                              <Typography variant="body2" fontWeight={d.isToday || d.isSelected ? 'bold' : 'medium'}>
                                {d.day}
                              </Typography>
                              {d.eventCount > 0 && (
                                <Box sx={{ 
                                  position: 'absolute', 
                                  bottom: 6, 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  bgcolor: d.isSelected ? 'white' : 'primary.main', 
                                  boxShadow: 1 
                                }} />
                              )}
                            </Box>
                          ));
                        })()}
                      </Box>
                    </Box>
                  </Box>

                  {/* Events List Container - Now scrollable */}
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    minHeight: 0, // Important for proper scrolling
                  }}>
                    <Box sx={{ 
                      p: 2, 
                      borderBottom: '1px solid', 
                      borderColor: 'divider',
                      flexShrink: 0 
                    }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Events on {formatDisplayDate(selectedDate)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {eventsOnSelectedDate.length} event{eventsOnSelectedDate.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    
                    {/* Events List - Scrollable */}
                    <Box 
                      flex={1} 
                      overflow="auto" 
                      sx={{
                        '&::-webkit-scrollbar': {
                          width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          borderRadius: '3px',
                        },
                      }}
                    >
                      {eventsOnSelectedDate.length > 0 ? (
                        <Box p={2}>
                          {eventsOnSelectedDate.map(e => (
                            <Card 
                              key={e._id} 
                              sx={{ 
                                mb: 1.5, 
                                p: 2, 
                                transition: 'all 0.2s',
                                '&:hover': {
                                  boxShadow: 3,
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight="medium" noWrap>
                                {e.eventName}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                                <Chip 
                                  label={e.eventType} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {e.time || 'No time set'}
                                </Typography>
                              </Box>
                              {e.location && (
                                <Typography variant="caption" color="text.secondary" display="block" mt={0.5} noWrap>
                                  📍 {e.location}
                                </Typography>
                              )}
                              {e.eventLeaderName && (
                                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                  👤 {e.eventLeaderName}
                                </Typography>
                              )}
                            </Card>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          py: 4,
                          color: 'text.secondary',
                          height: '100%'
                        }}>
                          <CalendarToday sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                          <Typography variant="body2">No events scheduled</Typography>
                          <Button 
                            variant="text" 
                            size="small" 
                            startIcon={<Add />} 
                            onClick={handleCreateEvent}
                            sx={{ mt: 1 }}
                          >
                            Create Event
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* CREATE EVENT MODAL */}
      <Dialog 
        open={createEventModalOpen} 
        onClose={() => setCreateEventModalOpen(false)} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, boxShadow: 24 } }}
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
                  label="Event Name *" 
                  value={newEventData.eventName} 
                  onChange={e => setNewEventData(p => ({ ...p, eventName: e.target.value }))} 
                  fullWidth 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={eventTypesLoading}>
                  <InputLabel>Event Type *</InputLabel>
                  <Select
                    value={newEventData.eventTypeName || ''}
                    onChange={e => setNewEventData(p => ({ ...p, eventTypeName: e.target.value }))}
                    label="Event Type *"
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
            <Typography variant="subtitle2" sx={{ 
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
                label="Recurring Event (e.g., Weekly Meeting)" 
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: 'rgba(0,0,0,0.02)' }}>
          <Button onClick={() => setCreateEventModalOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<Save />} 
            onClick={handleSaveEvent} 
            disabled={!newEventData.eventName || !newEventData.eventTypeName}
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* OVERDUE CELLS MODAL */}
      <Dialog open={overdueModalOpen} onClose={() => setOverdueModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
          color: 'white', p: 3
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
                    <Chip label={cell.attendees_count || 0} size="small" />
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StatsDashboard;