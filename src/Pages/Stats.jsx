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
} from '@mui/material';
import {
  People,
  CellTower,
  Task,
  Warning,
  Groups,
  Refresh,
  Add,
  CalendarToday,
  Close,
  Visibility,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  Event,
} from '@mui/icons-material';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Centralized Event Calculation Service (Pure JS)
class EventCalculationService {
  static isCellEvent(event) {
    if (!event.eventType) return false;
    const eventType = event.eventType.toLowerCase();
    return (
      eventType.includes('cell') ||
      eventType.includes('small group') ||
      eventType.includes('small-group') ||
      eventType.includes('small_groups')
    );
  }

  static isEventCompleted(event) {
    const did_not_meet = event.did_not_meet || false;
    const hasAttendees = event.attendees && event.attendees.length > 0;
    const status = (event.status || '').toLowerCase().trim();
    return hasAttendees || status === 'completed' || status === 'closed' || did_not_meet;
  }

  static getOverdueCells(events) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter(event => {
      if (!this.isCellEvent(event)) return false;
      if (this.isEventCompleted(event)) return false;
      if (!event.date) return false;

      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    });
  }
}

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
    recentPeople: 0,
    incompleteTasks: [],
    peopleWithTasks: [],
    allTasks: [],
    loading: true,
    error: null
  });

  const [period, setPeriod] = useState('weekly');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const [newEventData, setNewEventData] = useState({
    eventName: '',
    eventType: 'CELLS',
    date: '',
    eventLeaderName: '',
    eventLeaderEmail: '',
    location: '',
    time: '19:00',
    description: '',
    isRecurring: false,
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [viewAllCellsModalOpen, setViewAllCellsModalOpen] = useState(false);
  const [viewAllTasksModalOpen, setViewAllTasksModalOpen] = useState(false);
  const [viewPeopleTasksModalOpen, setViewPeopleTasksModalOpen] = useState(false);

  // ==================== FETCH STATS — FULLY WORKING WITH PAGINATION ====================
const fetchStats = async () => {
  try {
    setRefreshing(true);
    setStats(prev => ({ ...prev, loading: true, error: null }));

    const token = localStorage.getItem("token");
    if (!token) throw new Error("Authentication required");

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const FIXED_START_DATE = '2025-10-27';  // Your ministry launch date

    // 1. FETCH ALL CELL EVENTS SINCE LAUNCH (with pagination)
    let allCellEvents = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `${BACKEND_URL}/events/cells?page=${page}&limit=100&start_date=${FIXED_START_DATE}`,
        { headers }
      );

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Failed to fetch cells (page ${page}): ${res.status} ${error}`);
      }

      const data = await res.json();
      const events = data.events || data.data || [];

      allCellEvents = [...allCellEvents, ...events];

      // Stop if we got less than 100 → no more pages
      hasMore = events.length === 100;
      page++;
    }

    console.log(`Successfully loaded ${allCellEvents.length} cell events since 27 Oct 2025`);

    // 2. Fetch Tasks
    let allTasks = [];
    try {
      const tasksRes = await fetch(`${BACKEND_URL}/tasks`, { headers });
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        allTasks = data.tasks || data.results || data.data || [];
      }
    } catch (e) { console.warn("Tasks fetch failed:", e); }

    const incompleteTasks = allTasks.filter(t =>
      !['completed', 'closed', 'done', 'cancelled'].includes((t.status || '').toLowerCase().trim())
    );

    // 3. People with Task Progress
    let peopleWithTasks = [];
    let recentPeopleCount = Math.max(1, Math.floor(allCellEvents.length * 0.12));

    try {
      const peopleRes = await fetch(`${BACKEND_URL}/tasks`, { headers });
      if (peopleRes.ok) {
        const data = await peopleRes.json();
        const people = data.people || data.results || data.data || [];
        recentPeopleCount = people.length;

        peopleWithTasks = people.map(p => {
          const completed = p.completedTasks || 0;
          const expected = (p.role || '').toLowerCase().includes('leader') || (p.role || '').toLowerCase().includes('admin')
            ? 70 : 45;
          const isBehind = completed < expected;
          return {
            ...p,
            completedTasks: completed,
            expectedTasks: expected,
            isBehind,
            tasksDifference: expected - completed
          };
        }).sort((a, b) => b.tasksDifference - a.tasksDifference);
      }
    } catch (e) { console.warn("People fetch failed:", e); }

    // 4. Calculate Metrics
    const overdueCells = EventCalculationService.getOverdueCells(allCellEvents);
    const totalAttendance = allCellEvents.reduce((sum, e) => sum + (e.attendees?.length || 0), 0);
    const daysSinceLaunch = Math.floor((new Date() - new Date(FIXED_START_DATE)) / (1000 * 60 * 60 * 24));

    const overviewData = {
      total_attendance: totalAttendance,
      outstanding_cells: overdueCells.length,
      outstanding_tasks: incompleteTasks.length,
      recent_people: recentPeopleCount,
      people_behind: peopleWithTasks.filter(p => p.isBehind).length,
      events_count: allCellEvents.length,
      days_since_launch: daysSinceLaunch
    };

    setStats({
      overview: overviewData,
      events: allCellEvents,
      overdueCells,
      recentPeople: recentPeopleCount,
      allTasks,
      incompleteTasks,
      peopleWithTasks,
      loading: false,
      error: null
    });

  } catch (err) {
    console.error("Fetch error:", err);
    setStats(prev => ({ ...prev, error: err.message || 'Failed to load data', loading: false }));
  } finally {
    setRefreshing(false);
  }
};

  useEffect(() => { fetchStats(); }, [period]);

  const handleRefresh = () => fetchStats();

  // ==================== CALENDAR & EVENTS ====================
  const getEventsForDate = (date) => stats.events.filter(e => e.date && new Date(e.date).toISOString().split('T')[0] === date);
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const events = getEventsForDate(date);
    if (events.length > 0) setSnackbar({ open: true, message: `${events.length} event(s) on ${formatDisplayDate(date)}`, severity: 'info' });
  };

  const handleCreateEvent = () => {
    setNewEventData(prev => ({ ...prev, date: selectedDate }));
    setCreateEventModalOpen(true);
  };

  const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  const handleSaveEvent = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("userProfile") || "{}");
      const payload = {
        ...newEventData,
        eventLeaderName: newEventData.eventLeaderName || `${user.name || ''} ${user.surname || ''}`.trim(),
        eventLeaderEmail: newEventData.eventLeaderEmail || user.email,
        status: 'incomplete',
        UUID: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const res = await fetch(`${BACKEND_URL}/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create event");

      setCreateEventModalOpen(false);
      setNewEventData({ eventName: '', eventType: 'CELLS', date: '', eventLeaderName: '', eventLeaderEmail: '', location: '', time: '19:00', description: '', isRecurring: false });
      setSnackbar({ open: true, message: 'Event created successfully!', severity: 'success' });
      fetchStats();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to create event', severity: 'error' });
    }
  };

  const formatDate = (d) => !d ? 'Not set' : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDisplayDate = (d) => !d ? 'Not set' : new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const getMonthlyEventCounts = () => {
    const counts = {};
    stats.events.forEach(e => {
      if (e.date) {
        const dateStr = new Date(e.date).toISOString().split('T')[0];
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  };

  // ==================== ENHANCED CALENDAR ====================
  const EnhancedCalendar = () => {
    const eventCounts = getMonthlyEventCounts();
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
        days.push({ day, date: dateStr, eventCount: eventCounts[dateStr] || 0, isToday: dateStr === today, isSelected: dateStr === selectedDate });
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

         {/* WEEKDAY HEADERS — Landscape & Beautiful */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 1,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 1,
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Box
                key={index}
                sx={{
                  py: 1.5,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: 'text.primary',
                  backgroundColor: index === 0 || index === 6 ? 'action.hover' : 'transparent',
                  borderRight: index < 6 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                {/* On mobile: show only first letter, on larger screens: full name */}
                {isSmDown ? day[0] : day}
              </Box>
            ))}
          </Box>

          {/* CALENDAR DAYS GRID */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
            }}
          >
            {days.map((d, i) =>
              !d ? (
                <Box key={`empty-${i}`} sx={{ height: 52 }} />
              ) : (
                <Box
                  key={d.date}
                  onClick={() => handleDateSelect(d.date)}
                  sx={{
                    height: 52,
                    borderRadius: 2,
                    cursor: 'pointer',
                    backgroundColor: d.isSelected
                      ? 'primary.main'
                      : d.isToday
                      ? 'primary.50'
                      : 'background.default',
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
                      boxShadow: 4,
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={d.isToday || d.isSelected ? 'bold' : 'medium'}
                  >
                    {d.day}
                  </Typography>
                  {d.eventCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 6,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: d.isSelected ? 'white' : 'primary.main',
                        boxShadow: 1,
                      }}
                    />
                  )}
                </Box>
              )
            )}
          </Box>
        </Box>
      );
    };

  // ==================== SKELETONS & CARDS ====================
  const StatCardSkeleton = () => (
    <Paper variant="outlined" sx={{ p: 3, textAlign: "center", boxShadow: 3, height: '100%' }}>
      <Stack spacing={2} alignItems="center">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={20} />
      </Stack>
    </Paper>
  );

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

  const OutstandingItem = ({ item, type }) => (
    <Card variant="outlined" sx={{ mb: 1.5, p: 2, boxShadow: 2, '&:hover': { boxShadow: 4 } }}>
      <Box display="flex" alignItems="center">
        <Avatar sx={{ bgcolor: type === 'cells' ? 'warning.main' : 'secondary.main', mr: 2 }}>
          {type === 'cells' ? <Warning /> : <Task />}
        </Avatar>
        <Box flex={1}>
          <Typography variant="subtitle2" fontWeight="medium" noWrap>
            {item.eventName || item.name || item.title || 'Unnamed'}
          </Typography>
          <Typography variant="caption" color="textSecondary" noWrap>
            {type === 'cells' ? `${formatDate(item.date)} • ${item.eventLeaderName || 'No leader'}` :
              `${item.taskType || 'Task'} • ${item.assignedfor || 'Unassigned'}`}
          </Typography>
        </Box>
      </Box>
    </Card>
  );

  // ==================== FULL BEAUTIFUL MODALS ====================
  const CreateEventModal = () => (
    <Dialog open={createEventModalOpen} onClose={() => setCreateEventModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: 24 } }}>
      <DialogTitle sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white', p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box component="span" sx={{ fontSize: 28 }}>Create New Event</Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Create New Event</Typography>
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
            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Event Type</InputLabel><Select value={newEventData.eventType} onChange={e => setNewEventData(p => ({ ...p, eventType: e.target.value }))}>{['CELLS', 'GLOBAL', 'SERVICE', 'MEETING', 'TRAINING', 'OUTREACH'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}</Select></FormControl></Grid>
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
  );

  const ViewAllCellsModal = () => (
    <Dialog open={viewAllCellsModalOpen} onClose={() => setViewAllCellsModalOpen(false)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        All Overdue Cells ({stats.overdueCells.length})
        <IconButton onClick={() => setViewAllCellsModalOpen(false)}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer component={Paper}>
          <Table stickyHeader size="small">
            <TableHead><TableRow><TableCell><strong>Event Name</strong></TableCell><TableCell><strong>Leader</strong></TableCell><TableCell><strong>Date</strong></TableCell></TableRow></TableHead>
            <TableBody>
              {stats.overdueCells.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>{c.eventName}</TableCell>
                  <TableCell>{c.eventLeaderName}</TableCell>
                  <TableCell>{formatDate(c.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions><Button onClick={() => setViewAllCellsModalOpen(false)}>Close</Button></DialogActions>
    </Dialog>
  );

  const ViewAllTasksModal = () => (
    <Dialog open={viewAllTasksModalOpen} onClose={() => setViewAllTasksModalOpen(false)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        All Tasks ({stats.allTasks.length})
        <IconButton onClick={() => setViewAllTasksModalOpen(false)}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer component={Paper}>
          <Table stickyHeader size="small">
            <TableHead><TableRow><TableCell><strong>Name</strong></TableCell><TableCell><strong>Type</strong></TableCell><TableCell><strong>Status</strong></TableCell></TableRow></TableHead>
            <TableBody>
              {stats.allTasks.map((t) => (
                <TableRow key={t._id}>
                  <TableCell>{t.name || t.title}</TableCell>
                  <TableCell>{t.taskType}</TableCell>
                  <TableCell><Chip label={t.status} color={t.status === 'completed' ? 'success' : 'warning'} size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions><Button onClick={() => setViewAllTasksModalOpen(false)}>Close</Button></DialogActions>
    </Dialog>
  );

  const ViewPeopleTasksModal = () => (
    <Dialog open={viewPeopleTasksModalOpen} onClose={() => setViewPeopleTasksModalOpen(false)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        People Task Progress ({stats.peopleWithTasks.length})
        <IconButton onClick={() => setViewPeopleTasksModalOpen(false)}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer component={Paper}>
          <Table stickyHeader size="small">
            <TableHead><TableRow><TableCell><strong>Name</strong></TableCell><TableCell><strong>Completed / Expected</strong></TableCell><TableCell><strong>Progress</strong></TableCell></TableRow></TableHead>
            <TableBody>
              {stats.peopleWithTasks.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>{p.name} {p.surname}</TableCell>
                  <TableCell>{p.completedTasks} / {p.expectedTasks}</TableCell>
                  <TableCell>
                    <LinearProgress variant="determinate" value={(p.completedTasks / p.expectedTasks) * 100} color={p.isBehind ? "error" : "success"} />
                    {p.isBehind && <Chip label={`${p.tasksDifference} behind`} color="error" size="small" sx={{ ml: 1 }} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions><Button onClick={() => setViewPeopleTasksModalOpen(false)}>Close</Button></DialogActions>
    </Dialog>
  );

  // ==================== RENDER ====================
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
      {/* Header */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3} gap={2}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} onChange={e => setPeriod(e.target.value)}>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh"><IconButton onClick={handleRefresh} disabled={refreshing}><Refresh /></IconButton></Tooltip>
      </Box>
      {(stats.loading || refreshing) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Stats Grid */}
      <Grid container spacing={cardSpacing} mb={4}>
        <Grid item xs={6} md={3}>{stats.loading ? <StatCardSkeleton /> : <StatCard title="Total Attendance" value={stats.overview?.total_attendance || 0} icon={<People />} color="primary" />}</Grid>
        <Grid item xs={6} md={3}>{stats.loading ? <StatCardSkeleton /> : <StatCard title="Overdue Cells" value={stats.overview?.outstanding_cells || 0} icon={<Warning />} color="warning" />}</Grid>
        <Grid item xs={6} md={3}>{stats.loading ? <StatCardSkeleton /> : <StatCard title="Incomplete Tasks" value={stats.overview?.outstanding_tasks || 0} icon={<Task />} color="secondary" />}</Grid>
        <Grid item xs={6} md={3}>{stats.loading ? <StatCardSkeleton /> : <Box onClick={() => setViewPeopleTasksModalOpen(true)} sx={{ cursor: 'pointer' }}><StatCard title="People Behind" value={stats.overview?.people_behind || 0} icon={<Warning />} color="error" /></Box>}</Grid>
      </Grid>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant={isSmDown ? "scrollable" : "standard"} centered>
          <Tab label="Overdue Cells" />
          <Tab label="Tasks" />
          <Tab label="People Progress" />
          <Tab label="Calendar" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box minHeight="500px">
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" mb={2}><Typography variant="h6">Overdue Cells</Typography><Chip label={stats.overdueCells.length} color="warning" /></Box>
            {stats.overdueCells.slice(0, 5).map((c, i) => <OutstandingItem key={i} item={c} type="cells" />)}
            {stats.overdueCells.length > 5 && <Button onClick={() => setViewAllCellsModalOpen(true)} startIcon={<Visibility />}>View All</Button>}
          </Paper>
        )}

        {activeTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" mb={2}><Typography variant="h6">All Tasks</Typography><Chip label={stats.allTasks.length} /></Box>
            {stats.allTasks.slice(0, 5).map((t, i) => <OutstandingItem key={i} item={t} type="tasks" />)}
            {stats.allTasks.length > 5 && <Button onClick={() => setViewAllTasksModalOpen(true)} startIcon={<Visibility />}>View All</Button>}
          </Paper>
        )}

        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>People Task Progress</Typography>
            {stats.peopleWithTasks.slice(0, 5).map((p, i) => (
              <Card key={i} sx={{ mb: 2, p: 2, borderLeft: p.isBehind ? '4px solid red' : '4px solid green' }}>
                <Typography>{p.name} {p.surname}</Typography>
                <Typography variant="body2">Completed: {p.completedTasks} / {p.expectedTasks}</Typography>
                <LinearProgress variant="determinate" value={(p.completedTasks / p.expectedTasks) * 100} color={p.isBehind ? "error" : "success"} sx={{ mt: 1 }} />
              </Card>
            ))}
            <Button onClick={() => setViewPeopleTasksModalOpen(true)}>View All People</Button>
          </Paper>
        )}

        {activeTab === 3 && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Event Calendar</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleCreateEvent}>Create Event</Button>
            </Box>
            <Box display="flex" flexDirection={isSmDown ? "column" : "row"} gap={4}>
              <Box flex={1}><EnhancedCalendar /></Box>
              <Box flex={1}>
                <Typography variant="subtitle1" gutterBottom>Events on {formatDisplayDate(selectedDate)}</Typography>
                {eventsOnSelectedDate.length > 0 ? eventsOnSelectedDate.map((e) => (
                  <Card key={e._id} sx={{ mb: 1, p: 2 }}>
                    <Typography variant="subtitle2">{e.eventName}</Typography>
                    <Typography variant="caption">{e.eventType} • {e.time}</Typography>
                  </Card>
                )) : <Typography color="textSecondary">No events scheduled</Typography>}
              </Box>
            </Box>
          </Paper>
        )}
      </Box>

      {/* All Modals */}
      <CreateEventModal />
      <ViewAllCellsModal />
      <ViewAllTasksModal />
      <ViewPeopleTasksModal />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default StatsDashboard;