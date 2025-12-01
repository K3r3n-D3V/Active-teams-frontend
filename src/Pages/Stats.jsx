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
    eventName: '', eventTypeName: '', date: '', eventLeaderName: '', eventLeaderEmail: '',
    location: '', time: '19:00', description: '', isRecurring: false,
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  const getDateRange = () => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (period === 'weekly') {
      const day = now.getDay(); // 0 = Sunday
      start.setDate(now.getDate() - day);        // Start: Sunday
      end.setDate(now.getDate() + (6 - day));    // End: Saturday
    } else if (period === 'monthly') {
      start.setDate(1);                          // First day of month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);                            // Last day of current month
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const fetchStats = useCallback(async () => {
    const cacheKey = `statsDashboard_${period}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData && !refreshing) {
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

    try {
      setRefreshing(true);
      setStats(prev => ({ ...prev, loading: true, error: null }));
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      // === 1. Fetch Overdue/Incomplete Cells ===
      let allCellEvents = [];
      let page = 1;
      while (true) {
        const res = await fetch(`${BACKEND_URL}/events/cells?page=${page}&limit=100&start_date=2025-10-27`, { headers });
        if (!res.ok) break;
        const data = await res.json();
        const events = data.events || data.data || [];
        allCellEvents.push(...events);
        if (events.length < 100) break;
        page++;
      }

      const overdueCells = allCellEvents.filter(e => {
        const s = (e.status || '').toString().toLowerCase().trim();
        return s === 'overdue' || s === 'incomplete';
      });

      // 2. Fetch Tasks + Apply Date Filter
      let allTasks = [];
      try {
        const res = await fetch(`${BACKEND_URL}/tasks/all`, { headers });
        if (res.ok) {
          const data = await res.json();
          const rawTasks = data.tasks || data.results || data.data || data || [];

          const { start, end } = getDateRange();

          const filteredTasks = rawTasks.filter((task) => {
            const rawDate = task.date || task.followup_date || task.createdAt || task.dueDate;
            if (!rawDate) return false;

            const taskDate = new Date(rawDate);
            if (isNaN(taskDate)) return false;

            return taskDate >= start && taskDate <= end;
          });

          allTasks = filteredTasks;
        }
      } catch (e) {
        console.error("Tasks failed", e);
      }

      // 3. Fetch Users
      let allUsers = [];
      try {
        const res = await fetch(`${BACKEND_URL}/api/users`, { headers });
        if (res.ok) {
          const data = await res.json();
          allUsers = data.users || data.data || [];
        }
      } catch (e) {
        console.error("Users failed", e);
      }

      const userMap = {};
      allUsers.forEach(u => {
        if (u._id) userMap[u._id.toString()] = u;
        if (u.email) userMap[u.email.toLowerCase()] = u;
      });

      const getUserFromTask = (task) => {
        if (task.assignedTo) {
          const id = typeof task.assignedTo === 'object' ? task.assignedTo._id || task.assignedTo.id : task.assignedTo;
          if (id && userMap[id.toString()]) return userMap[id.toString()];
        }
        if (task.assignedfor && userMap[task.assignedfor.toLowerCase()]) {
          return userMap[task.assignedfor.toLowerCase()];
        }
        return null;
      };

      const taskGroups = {};
      allTasks.forEach(task => {
        const user = getUserFromTask(task);
        if (!user) return;
        const key = user._id || user.email;
        if (!taskGroups[key]) taskGroups[key] = { user, tasks: [] };
        taskGroups[key].tasks.push(task);
      });

      const groupedTasks = allUsers.map(user => {
        const key = user._id || user.email;
        const group = taskGroups[key] || { tasks: [] };
        const tasks = group.tasks;
        const completed = tasks.filter(t => ['completed', 'done', 'closed'].includes((t.status || '').toLowerCase())).length;
        const incomplete = tasks.length - completed;

        return {
          user: {
            _id: user._id,
            fullName: `${user.name || ''} ${user.surname || ''}`.trim() || user.email?.split('@')[0] || 'Unknown',
            email: user.email || '',
          },
          tasks,
          totalCount: tasks.length,
          completedCount: completed,
          incompleteCount: incomplete
        };
      }).sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));

      const overview = {
        total_attendance: overdueCells.reduce((s, e) => s + (e.attendees?.length || 0), 0),
        outstanding_cells: overdueCells.length,
        outstanding_tasks: allTasks.filter(t => !['completed', 'done', 'closed'].includes((t.status || '').toLowerCase())).length,
        people_behind: groupedTasks.filter(g => g.incompleteCount > 0).length,
      };

      const newStats = {
        overview,
        events: overdueCells,
        overdueCells,
        allTasks,
        allUsers,
        groupedTasks,
        loading: false,
        error: null
      };

      setStats(newStats);

      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify({
        data: newStats,
        timestamp: Date.now()
      }));

    } catch (err) {
      console.error("Fetch stats error:", err);
      setStats(prev => ({ ...prev, error: err.message || 'Failed to load data', loading: false }));
    } finally {
      setRefreshing(false);
    }
  }, [period, refreshing]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  const formatDate = (d) => !d ? 'Not set' : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDisplayDate = (d) => !d ? 'Not set' : new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const getEventsForDate = (date) => stats.events.filter(e => e.date && new Date(e.date).toISOString().split('T')[0] === date);

  const handleCreateEvent = () => {
    setNewEventData(prev => ({ ...prev, date: selectedDate }));
    setCreateEventModalOpen(true);
  };

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
      
      // Clear cache to force fresh data
      const cacheKey = `statsDashboard_${period}`;
      localStorage.removeItem(cacheKey);
    } catch (err) {
      console.error("Create event failed:", err);
      setSnackbar({ open: true, message: err.message || 'Failed to create event', severity: 'error' });
    }
  };

  const EnhancedCalendar = () => {
    const eventCounts = {};
    stats.events.forEach(e => {
      if (e.date) {
        const d = e.date.split('T')[0];
        eventCounts[d] = (eventCounts[d] || 0) + 1;
      }
    });

    const today = new Date().toISOString().split('T')[0];
    const goToPreviousMonth = () => setCurrentMonth(prev => { const m = new Date(prev); m.setMonth(m.getMonth() - 1); return m; });
    const goToNextMonth = () => setCurrentMonth(prev => { const m = new Date(prev); m.setMonth(m.getMonth() + 1); return m; });
    const goToToday = () => { setCurrentMonth(new Date()); setSelectedDate(today); };

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
          day, date: dateStr,
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant={titleVariant} fontWeight="bold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton size="small" onClick={goToPreviousMonth}><ChevronLeft /></IconButton>
            <Button size="small" variant="outlined" onClick={goToToday}>Today</Button>
            <IconButton size="small" onClick={goToNextMonth}><ChevronRight /></IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1, backgroundColor: 'background.paper', borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <Box key={i} sx={{ py: 1.5, textAlign: 'center', fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: 'text.primary', backgroundColor: i === 0 || i === 6 ? 'action.hover' : 'transparent', borderRight: i < 6 ? '1px solid' : 'none', borderColor: 'divider' }}>
              {isSmDown ? day[0] : day}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {days.map((d, i) => !d ? <Box key={`empty-${i}`} sx={{ height: 52 }} /> : (
            <Box
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              sx={{
                height: 52, borderRadius: 2, cursor: 'pointer',
                backgroundColor: d.isSelected ? 'primary.main' : d.isToday ? 'primary.50' : 'background.default',
                color: d.isSelected ? 'white' : d.isToday ? 'primary.main' : 'text.primary',
                border: d.isToday && !d.isSelected ? '2px solid' : '1px solid',
                borderColor: d.isToday && !d.isSelected ? 'primary.main' : 'divider',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', transition: 'all 0.2s ease',
                '&:hover': { backgroundColor: d.isSelected ? 'primary.dark' : 'action.hover', transform: 'translateY(-2px)', boxShadow: 4 }
              }}
            >
              <Typography variant="body2" fontWeight={d.isToday || d.isSelected ? 'bold' : 'medium'}>{d.day}</Typography>
              {d.eventCount > 0 && (
                <Box sx={{ position: 'absolute', bottom: 6, width: 8, height: 8, borderRadius: '50%', bgcolor: d.isSelected ? 'white' : 'primary.main', boxShadow: 1 }} />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
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
        <Alert severity="error" action={<Button onClick={fetchStats}>Retry</Button>}>
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
        <Tooltip title="Refresh"><IconButton onClick={fetchStats} disabled={refreshing}><Refresh /></IconButton></Tooltip>
      </Box>

      {(stats.loading || refreshing) && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={cardSpacing} mb={4}>
        <Grid item xs={6} md={3}>
          {stats.loading ? <Skeleton variant="rectangular" height={140} /> : <StatCard title="Total Attendance" value={stats.overview?.total_attendance || 0} icon={<People />} color="primary" />}
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <Skeleton variant="rectangular" height={140} /> :
            <>
              <StatCard title="Overdue Cells" value={stats.overview?.outstanding_cells || 0} icon={<Warning />} color="warning" />
            </>
          }
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <Skeleton variant="rectangular" height={140} /> : <StatCard title="Incomplete Tasks" value={stats.overview?.outstanding_tasks || 0} icon={<Task />} color="secondary" />}
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <Skeleton variant="rectangular" height={140} /> : <StatCard title="People Behind" value={stats.overview?.people_behind || 0} icon={<Warning />} color="error" />}
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant={isSmDown ? "scrollable" : "standard"} centered>
          <Tab label="Overdue Cells" />
          <Tab label="Tasks" />
          <Tab label="Calendar" />
        </Tabs>
      </Paper>

      <Box minHeight="500px">
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Overdue Cells</Typography>
              <Chip label={stats.overdueCells.length} color="warning" />
            </Box>
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
          </Paper>
        )}
        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom mb={3}>
              All Tasks by Person ({stats.groupedTasks.length} people • {stats.allTasks.length} total)
            </Typography>

            <Stack spacing={3}>
              {stats.groupedTasks.map(({ user, tasks, totalCount, completedCount, incompleteCount }) => {
                const key = user.email || user.fullName;
                const isExpanded = expandedUsers.includes(key);

                return (
                  <Box key={key} sx={{ Whom: 3, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 3, overflow: 'hidden', transition: 'all 0.2s', '&:hover': { boxShadow: 6 } }}>
                    <Box
                      sx={{ p: 3, cursor: 'pointer', backgroundColor: incompleteCount > 0 ? 'error.50' : 'transparent', '&:hover': { backgroundColor: 'action.hover' } }}
                      onClick={() => toggleExpand(key)}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2.5}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {user.fullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">{user.fullName}</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                              {totalCount} task{totalCount !== 1 ? 's' : ''} → {completedCount} completed
                              {incompleteCount > 0 && ` • ${incompleteCount} behind`}
                              {incompleteCount === 0 && totalCount > 0 && ' — ALL DONE!'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          {incompleteCount > 0 && <Chip label={`${incompleteCount} behind`} color="error" size="medium" sx={{ fontWeight: 'bold', px: 2, height: 36 }} />}
                          <IconButton size="small">
                            <ExpandMore sx={{ transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 3, pb: 3, pt: 1, backgroundColor: 'grey.50' }}>
                        <Divider sx={{ mb: 2 }} />
                        {tasks.length === 0 ? (
                          <Typography color="text.secondary" fontStyle="italic">No tasks assigned</Typography>
                        ) : (
                          <Stack spacing={1.5}>
                            {tasks.map(task => (
                              <Box key={task._id} sx={{ p: 2, borderRadius: 2, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">{task.name || task.taskType || 'Untitled Task'}</Typography>
                                  {task.contacted_person?.name && <Typography variant="caption" color="text.secondary">Contact: {task.contacted_person.name}</Typography>}
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
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Event Calendar</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleCreateEvent}>
                Create Event
              </Button>
            </Box>
            <Box display="flex" flexDirection={isSmDown ? "column" : "row"} gap={4}>
              <Box flex={1}><EnhancedCalendar /></Box>
              <Box flex={1}>
                <Typography variant="subtitle1" gutterBottom>Events on {formatDisplayDate(selectedDate)}</Typography>
                {eventsOnSelectedDate.length > 0 ? eventsOnSelectedDate.map(e => (
                  <Card key={e._id} sx={{ mb: 1, p: 2 }}>
                    <Typography variant="subtitle2">{e.eventName}</Typography>
                    <Typography variant="caption">{e.eventTypeName} • {e.time}</Typography>
                  </Card>
                )) : <Typography color="textSecondary">No events scheduled</Typography>}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* CREATE EVENT MODAL */}
      <Dialog open={createEventModalOpen} onClose={() => setCreateEventModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: 24 } }}>
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white', p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box component="span" sx={{ fontSize: 28 }}>Create New Event</Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>{formatDisplayDate(selectedDate)}</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setCreateEventModalOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 2, sm: 3 }, mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>EVENT DETAILS</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12}><TextField label="Event Name" value={newEventData.eventName} onChange={e => setNewEventData(p => ({ ...p, eventName: e.target.value }))} fullWidth required /></Grid>
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
              <Grid item xs={12} sm={6}><TextField label="Time" type="time" value={newEventData.time} onChange={e => setNewEventData(p => ({ ...p, time: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={12}><TextField label="Location" value={newEventData.location} onChange={e => setNewEventData(p => ({ ...p, location: e.target.value }))} fullWidth /></Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>EVENT LEADER INFORMATION</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12}><TextField label="Leader Name" value={newEventData.eventLeaderName} onChange={e => setNewEventData(p => ({ ...p, eventLeaderName: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12}><TextField label="Leader Email" type="email" value={newEventData.eventLeaderEmail} onChange={e => setNewEventData(p => ({ ...p, eventLeaderEmail: e.target.value }))} fullWidth /></Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box>
            <Typography gutterBottom sx={{ mb: 2, color: 'primary.main', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>ADDITIONAL INFORMATION</Typography>
            <TextField label="Description" value={newEventData.description} onChange={e => setNewEventData(p => ({ ...p, description: e.target.value }))} fullWidth multiline rows={4} />
            <Box mt={2} p={2} sx={{ backgroundColor: 'rgba(33, 150, 243, 0.08)', borderRadius: 2, border: '1px solid rgba(33, 150, 243, 0.2)' }}>
              <FormControlLabel control={<Checkbox checked={newEventData.isRecurring} onChange={e => setNewEventData(p => ({ ...p, isRecurring: e.target.checked }))} />} label="Recurring Event" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: 'rgba(0,0,0,0.02)' }}>
          <Button onClick={() => setCreateEventModalOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveEvent} disabled={!newEventData.eventName}>Create Event</Button>
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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

    </Box>
  );
};

export default StatsDashboard;