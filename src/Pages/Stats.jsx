import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, Card, LinearProgress, Chip, IconButton, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, Avatar, useTheme, useMediaQuery,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar,
  Paper, Checkbox, FormControlLabel, Stack, Divider, Tooltip, Tabs, Tab
} from '@mui/material';
import Collapse from '@mui/material/Collapse';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {
  People, Warning, Task, Refresh, Add, Close,
  Visibility, ChevronLeft, ChevronRight, Save
} from '@mui/icons-material';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

const StatsDashboard = () => {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const getResponsiveValue = (xs, sm, md, lg, xl) => {
    if (window.innerWidth < 600) return xs;
    if (window.innerWidth < 960) return sm;
    if (window.innerWidth < 1280) return md;
    return lg || xl;
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
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 11)); // December 2025
  const [selectedDate, setSelectedDate] = useState('2025-12-01');
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedUsers, setExpandedUsers] = useState([]);
  const [overdueModalOpen, setOverdueModalOpen] = useState(false);

  const [newEventData, setNewEventData] = useState({
    eventName: '', eventTypeName: '', date: '', eventLeaderName: '', eventLeaderEmail: '',
    location: '', time: '19:00', description: '', isRecurring: false,
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypesLoading, setEventTypesLoading] = useState(true);

  // ———————— FETCH DATA FROM 2025-12-01 ONLY ————————
  const fetchStats = useCallback(async (forceRefresh = false) => {
    const cacheKey = `statsDashboard_${period}`;
    const cached = localStorage.getItem(cacheKey);

    if (!forceRefresh && cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        setStats({ ...data, loading: false, error: null });
        return;
      }
    }

    setRefreshing(true);
    setStats(prev => ({ ...prev, loading: true, error: null }));

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      // 1. Fetch cells from Dec 1, 2025 onward
      const fetchOverdueCells = async () => {
        const startDate = '2025-12-01';
        let allEvents = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          try {
            const res = await fetch(
              `${BACKEND_URL}/events/cells?page=${page}&limit=${limit}&start_date=${startDate}`,
              { headers, signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (!res.ok) break;

            const json = await res.json();
            const events = json.events || json.data || json.results || [];

            if (events.length === 0) break;
            allEvents.push(...events);
            if (events.length < limit) break;
            page++;
          } catch (err) {
            break;
          }
        }
        return allEvents;
      };

      const allCellEvents = await fetchOverdueCells();
      const overdueCells = allCellEvents.filter(e =>
        ['overdue', 'incomplete'].includes((e.status || '').toString().toLowerCase().trim())
      );

      // 2. Fetch tasks (weekly/monthly)
      let allTasks = [];
      try {
        const res = await fetch(`${BACKEND_URL}/tasks/all`, { headers });
        if (res.ok) {
          const data = await res.json();
          const rawTasks = data.tasks || data.results || data.data || [];
          const now = new Date();
          const start = new Date(now);
          const end = new Date(now);

          if (period === 'weekly') {
            const day = now.getDay();
            start.setDate(now.getDate() - day);
            end.setDate(now.getDate() + (6 - day));
          } else {
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
          }
          start.setHours(0,0,0,0);
          end.setHours(23,59,59,999);

          allTasks = rawTasks.filter(task => {
            const dateStr = task.date || task.followup_date || task.createdAt || task.dueDate;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d >= start && d <= end;
          });
        }
      } catch (e) { console.error("Tasks failed", e); }

      // 3. Fetch users
      let allUsers = [];
      try {
        const res = await fetch(`${BACKEND_URL}/api/users`, { headers });
        if (res.ok) {
          const data = await res.json();
          allUsers = data.users || data.data || [];
        }
      } catch (e) { console.error("Users failed", e); }

      // Group tasks
      const userMap = {};
      allUsers.forEach(u => {
        if (u._id) userMap[u._id] = u;
        if (u.email) userMap[u.email.toLowerCase()] = u;
      });

      const getUserFromTask = (task) => {
        if (task.assignedTo) {
          const id = typeof task.assignedTo === 'object' ? task.assignedTo._id || task.assignedTo.id : task.assignedTo;
          if (id && userMap[id]) return userMap[id];
        }
        if (task.assignedfor && userMap[task.assignedfor.toLowerCase()]) return userMap[task.assignedfor.toLowerCase()];
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

      // ———————— REAL TOTAL ATTENDANCE FOR DECEMBER 2025 (ALL EVENTS) ————————
let total_attendance = 0;

try {
  // 1. Fetch ALL events (not just cells!) from Dec 1, 2025 onward
  const eventsRes = await fetch(
    `${BACKEND_URL}/events?page=1&limit=500&start_date=2025-12-01`,
    { headers }
  );

  let allEvents = [];
  if (eventsRes.ok) {
    const json = await eventsRes.json();
    allEvents = json.events || json.data || json.results || [];
  }

  // 2. Filter only SERVICE & GLOBAL events in December 2025
  const serviceAndGlobalEvents = allEvents.filter(e => {
    if (!e.date || !e.eventTypeName || !e._id) return false;
    const type = e.eventTypeName.toString().trim().toUpperCase();
    const d = new Date(e.date);
    return (
      (type === 'SERVICE' || type === 'GLOBAL') &&
      d.getFullYear() === 2025 &&
      d.getMonth() === 11
    );
  });

  // 3. Fetch real-time attendance in parallel (super fast + reliable)
  const attendancePromises = serviceAndGlobalEvents.map(async (event) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/service-checkin/real-time-data?event_id=${event._id}`,
        { headers }
      );
      if (!res.ok) return 0;
      const data = await res.json();
      return data.success && data.data?.present_count >= 0
        ? Number(data.data.present_count)
        : 0;
    } catch {
      return 0;
    }
  });

  const counts = await Promise.all(attendancePromises);
  total_attendance = counts.reduce((sum, count) => sum + count, 0);

  console.log(`Found ${serviceAndGlobalEvents.length} service/global events → ${total_attendance} total attendance`);

} catch (err) {
  console.warn('Failed to load real attendance, showing 0', err);
  total_attendance = 0;
}
// ———————————————————————————————————————————————————————————————

    // Now build the overview object with the CORRECT total_attendance
    const overview = {
      total_attendance, // THIS IS NOW THE REAL NUMBER!
      outstanding_cells: overdueCells.length,
      outstanding_tasks: allTasks.filter(t => 
        !['completed', 'done', 'closed'].includes((t.status || '').toLowerCase())
      ).length,
      people_behind: groupedTasks.filter(g => g.incompleteCount > 0).length,
    };
      const newData = {
        overview,
        events: overdueCells,
        overdueCells,
        allTasks,
        allUsers,
        groupedTasks
      };

      setStats({ ...newData, loading: false, error: null });
      localStorage.setItem(cacheKey, JSON.stringify({ data: newData, timestamp: Date.now() }));

    } catch (err) {
      setStats(prev => ({ ...prev, error: err.message || 'Failed to load data', loading: false }));
    } finally {
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/event-types`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEventTypes(data.eventTypes || data.data || data || []);
      } catch {
        setEventTypes([
          { name: "CELLS" }, { name: "GLOBAL" }, { name: "SERVICE" },
          { name: "MEETING" }, { name: "TRAINING" }, { name: "OUTREACH" }
        ]);
      } finally {
        setEventTypesLoading(false);
      }
    };
    load();
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
        eventTypeName: newEventData.eventTypeName || "CELLS",
        date: newEventData.date || selectedDate,
        time: newEventData.time,
        location: newEventData.location || null,
        description: newEventData.description || null,
        eventLeaderName: newEventData.eventLeaderName || `${user.name || ''} ${user.surname || ''}`.trim(),
        eventLeaderEmail: newEventData.eventLeaderEmail || user.email || null,
        isRecurring: newEventData.isRecurring,
        status: 'incomplete',
        created_at: new Date().toISOString(),
      };

      const res = await fetch(`${BACKEND_URL}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error((await res.json()).detail?.[0]?.msg || 'Failed');

      setCreateEventModalOpen(false);
      setNewEventData({ eventName: '', eventTypeName: '', date: '', eventLeaderName: '', eventLeaderEmail: '', location: '', time: '19:00', description: '', isRecurring: false });
      setSnackbar({ open: true, message: 'Event created successfully!', severity: 'success' });
      fetchStats(true);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to create event', severity: 'error' });
    }
  };

  // ———————— CORRECT CALENDAR: Sunday start ————————
  const EnhancedCalendar = () => {
    const eventCounts = {};
    stats.events.forEach(e => {
      if (e.date) {
        const d = e.date.split('T')[0];
        eventCounts[d] = (eventCounts[d] || 0) + 1;
      }
    });

    const today = '2025-12-01'; // Today is Monday, Dec 1, 2025
    const goToPreviousMonth = () => setCurrentMonth(prev => { const m = new Date(prev); m.setMonth(m.getMonth() - 1); return m; });
    const goToNextMonth = () => setCurrentMonth(prev => { const m = new Date(prev); m.setMonth(m.getMonth() + 1); return m; });
    const goToToday = () => { setCurrentMonth(new Date(2025, 11)); setSelectedDate(today); };

    const getDaysInMonth = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDayWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const days = [];
      for (let i = 0; i < firstDayWeekday; i++) days.push(null);

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
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
    </Paper>
  );

  if (stats.error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Alert severity="error" action={<Button onClick={() => fetchStats(true)}>Retry</Button>}>
          {stats.error}
        </Alert>
      </Box>
    );
  }

  const eventsOnSelectedDate = getEventsForDate(selectedDate);

  return (
    <Box p={containerPadding} maxWidth="1400px" mx="auto" mt={8}>
      {/* Header */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3} gap={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={e => setPeriod(e.target.value)}>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh">
          <IconButton onClick={() => fetchStats(true)} disabled={refreshing}>
            <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
          </IconButton>
        </Tooltip>
      </Box>

      {(stats.loading || refreshing) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Stats Cards */}
      <Grid container spacing={cardSpacing} mb={4}>
        <Grid item xs={6} md={3}>
          {stats.loading ? <Skeleton variant="rectangular" height={140} /> : <StatCard title="Total Attendance" value={stats.overview?.total_attendance || 0} icon={<People />} color="primary" />}
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <Skeleton variant="rectangular" height={140} /> : <StatCard title="Overdue Cells" value={stats.overview?.outstanding_cells || 0} icon={<Warning />} color="warning" />}
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <Skeleton variant="rectangular" height={140} /> : <StatCard title="Incomplete Tasks" value={stats.overview?.outstanding_tasks || 0} icon={<Task />} color="secondary" />}
        </Grid>
        <Grid item xs={6} md={3}>
          {stats.loading ? <Skeleton variant="rectangular" height={140} /> : <StatCard title="People Behind" value={stats.overview?.people_behind || 0} icon={<Warning />} color="error" />}
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant={isSmDown ? "scrollable" : "standard"} centered>
          <Tab label="Overdue Cells" />
          <Tab label="Tasks" />
          <Tab label="Calendar" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
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
              <Button size="small" variant="text" color="warning" startIcon={<Visibility />} onClick={() => setOverdueModalOpen(true)}>
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
                  <Box key={key} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
                    <Box sx={{ p: 3, cursor: 'pointer', backgroundColor: incompleteCount > 0 ? 'error.50' : 'transparent' }} onClick={() => toggleExpand(key)}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                            {user.fullName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">{user.fullName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {totalCount} task{totalCount !== 1 ? 's' : ''} — {completedCount} done
                              {incompleteCount > 0 && ` • ${incompleteCount} behind`}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          {incompleteCount > 0 && <Chip label={`${incompleteCount} behind`} color="error" />}
                          <IconButton><ExpandMore sx={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} /></IconButton>
                        </Box>
                      </Box>
                    </Box>
                    <Collapse in={isExpanded}>
                      <Box sx={{ p: 3, pt: 1, bgcolor: 'grey.50' }}>
                        {tasks.map(task => (
                          <Box key={task._id} sx={{ p: 2, mb: 1, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="body2" fontWeight="medium">{task.name || 'Untitled Task'}</Typography>
                                {task.contacted_person?.name && <Typography variant="caption">Contact: {task.contacted_person.name}</Typography>}
                              </Box>
                              <Chip label={task.status || 'Pending'} size="small" color={task.status?.toLowerCase() === 'completed' ? 'success' : 'warning'} />
                            </Box>
                          </Box>
                        ))}
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
                <Typography variant="subtitle1" gutterBottom>
                  Events on {formatDisplayDate(selectedDate)}
                </Typography>
                {eventsOnSelectedDate.length > 0 ? (
                  eventsOnSelectedDate.map(e => (
                    <Card key={e._id} sx={{ mb: 1.5, p: 2 }}>
                      <Typography variant="subtitle2">{e.eventName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {e.eventTypeName} • {e.time || 'Time not set'} • {e.location || 'No location'}
                      </Typography>
                    </Card>
                  ))
                ) : (
                  <Typography color="text.secondary">No events scheduled</Typography>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* CREATE EVENT MODAL — FULLY RESTORED */}
      <Dialog open={createEventModalOpen} onClose={() => setCreateEventModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" component="div">Create New Event</Typography>
              <Typography variant="body2">{formatDisplayDate(selectedDate)}</Typography>
            </Box>
            <IconButton onClick={() => setCreateEventModalOpen(false)} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Event Name *"
                fullWidth
                value={newEventData.eventName}
                onChange={e => setNewEventData(p => ({ ...p, eventName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={newEventData.eventTypeName}
                  onChange={e => setNewEventData(p => ({ ...p, eventTypeName: e.target.value }))}
                >
                  {eventTypes.map(t => (
                    <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Time"
                type="time"
                fullWidth
                value={newEventData.time}
                onChange={e => setNewEventData(p => ({ ...p, time: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Location"
                fullWidth
                value={newEventData.location}
                onChange={e => setNewEventData(p => ({ ...p, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={newEventData.description}
                onChange={e => setNewEventData(p => ({ ...p, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={newEventData.isRecurring} onChange={e => setNewEventData(p => ({ ...p, isRecurring: e.target.checked }))} />}
                label="Recurring Event"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateEventModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEvent} disabled={!newEventData.eventName}>
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* OVERDUE CELLS MODAL */}
      <Dialog open={overdueModalOpen} onClose={() => setOverdueModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white', py: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">Overdue / Incomplete Cells</Typography>
              <Typography variant="body2">{stats.overdueCells.length} cells need attention</Typography>
            </Box>
            <IconButton onClick={() => setOverdueModalOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ py: 2 }}>
            {stats.overdueCells.map(cell => (
              <Card key={cell._id} variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}><Warning /></Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight="bold">{cell.eventName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(cell.date)} • {cell.eventLeaderName || 'No leader'}
                    </Typography>
                  </Box>
                  <Chip label={cell.attendees?.length || 0} />
                </Box>
              </Card>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default StatsDashboard;