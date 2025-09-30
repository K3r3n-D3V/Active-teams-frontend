import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  useTheme,
  CssBaseline,
  useMediaQuery,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Fab,
  Button,
  TextField,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  InputAdornment,
  Snackbar,
  Alert,
  Autocomplete,
  CircularProgress,
  DialogActions
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Close as CloseIcon, 
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Scheduler } from '@aldabil/react-scheduler';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Configure backend base URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

/* -------------------------
   Event Creation/Edit Popup
------------------------- */
const EventCreationPopup = ({ 
  open, 
  onClose, 
  onEventCreated, 
  user, 
  backendUrl, 
  selectedDate = null,
  editingEvent = null 
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newEventType, setNewEventType] = useState('');
  const [successAlert, setSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorAlert, setErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [peopleData, setPeopleData] = useState([]);

  const [eventTypes, setEventTypes] = useState([
    'Sunday Service',
    'Friday Service',
    'Workshop',
    'Encounter',
    'Conference',
    'J-Activation',
    'Destiny Training',
    'Social Event',
    'Cell'
  ]);

  const [formData, setFormData] = useState({
    eventType: '',
    eventName: '',
    isTicketed: false,
    price: '',
    date: '',
    time: '',
    timePeriod: 'AM',
    recurringDays: [],
    location: '',
    eventLeader: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timePeriods = ['AM', 'PM'];

  // Fetch people data from backend
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await fetch(`${backendUrl}/people`);
        if (response.ok) {
          const data = await response.json();
          setPeopleData(Array.isArray(data) ? data : data.people || []);
        }
      } catch (error) {
        console.error('Failed to fetch people:', error);
        // Fallback to mock data
        setPeopleData([
          { _id: '1', fullName: 'John Doe', email: 'john@example.com' },
          { _id: '2', fullName: 'Jane Smith', email: 'jane@example.com' },
          { _id: '3', fullName: 'Mike Johnson', email: 'mike@example.com' }
        ]);
      }
    };

    if (open) {
      fetchPeople();
    }
  }, [open, backendUrl]);

  // Initialize/prefill form data
  useEffect(() => {
    if (editingEvent) {
      const eventDate = editingEvent.start ? new Date(editingEvent.start) : new Date();
      const hours = eventDate.getHours();
      const minutes = eventDate.getMinutes();
      const timePeriod = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

      setFormData({
        eventType: editingEvent.eventType || '',
        eventName: editingEvent.title || '',
        isTicketed: !!editingEvent.isTicketed,
        price: editingEvent.price || '',
        date: eventDate.toISOString().split('T')[0],
        time: `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
        timePeriod: timePeriod,
        recurringDays: editingEvent.recurringDays || [],
        location: editingEvent.location || '',
        eventLeader: editingEvent.eventLeader || '',
        description: editingEvent.description || ''
      });
    } else if (selectedDate) {
      const date = new Date(selectedDate);
      setFormData(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0]
      }));
    } else {
      resetForm();
    }
  }, [editingEvent, selectedDate, open]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }));
  };

  const addNewEventType = () => {
    if (!newEventType.trim()) return;
    if (!eventTypes.includes(newEventType.trim())) {
      setEventTypes(prev => [...prev, newEventType.trim()]);
      setFormData(prev => ({ ...prev, eventType: newEventType.trim() }));
    }
    setNewEventType('');
    setShowNewTypeForm(false);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.eventName) newErrors.eventName = 'Event name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.eventLeader) newErrors.eventLeader = 'Event leader is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (formData.isTicketed && !formData.price) {
      newErrors.price = 'Price is required for ticketed events';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      eventType: '',
      eventName: '',
      isTicketed: false,
      price: '',
      date: '',
      time: '',
      timePeriod: 'AM',
      recurringDays: [],
      location: '',
      eventLeader: '',
      description: ''
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Convert 12-hour time to 24-hour format
      const [hoursStr, minutesStr] = formData.time.split(':');
      let hours = Number(hoursStr);
      const minutes = Number(minutesStr);
      if (formData.timePeriod === 'PM' && hours !== 12) hours += 12;
      if (formData.timePeriod === 'AM' && hours === 12) hours = 0;

      const dateTimeString = `${formData.date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      const payload = {
        eventType: formData.eventType,
        eventName: formData.eventName,
        isTicketed: formData.isTicketed,
        location: formData.location,
        eventLeader: formData.eventLeader,
        description: formData.description,
        date: dateTimeString,
        recurring_day: formData.recurringDays,
        userEmail: user?.email || ''
      };

      if (formData.isTicketed && formData.price) {
        payload.price = parseFloat(formData.price);
      }

      const url = editingEvent 
        ? `${backendUrl}/events/${editingEvent.event_id}`
        : `${backendUrl}/events`;

      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || `HTTP ${response.status}`);
      }

      setSuccessMessage(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
      setSuccessAlert(true);
      resetForm();

      // Refresh parent events
      onEventCreated();

      // Close popup after delay
      setTimeout(() => onClose(), 800);

    } catch (err) {
      console.error('Error saving event:', err);
      setErrorMessage(err.message || 'Failed to save event');
      setErrorAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const darkModeStyles = {
    dialog: {
      '& .MuiDialog-paper': {
        bgcolor: isDarkMode ? '#1e1e1e' : 'white',
        color: isDarkMode ? '#ffffff' : 'black'
      }
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        bgcolor: isDarkMode ? '#2d2d2d' : 'white',
        color: isDarkMode ? '#ffffff' : 'inherit',
        '& fieldset': {
          borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)'
        }
      },
      '& .MuiInputLabel-root': {
        color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)'
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={darkModeStyles.dialog}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* New Type Form */}
          <Box display="flex" flexWrap="wrap" alignItems="center" gap={1.5} mb={2}>
            <Button
              variant="outlined"
              onClick={() => setShowNewTypeForm(!showNewTypeForm)}
              startIcon={<AddIcon />}
            >
              New Type
            </Button>

            {showNewTypeForm && (
              <>
                <TextField
                  placeholder="Enter new event type"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  size="small"
                  sx={{ minWidth: 200, ...darkModeStyles.textField }}
                />
                <Button
                  variant="contained"
                  onClick={addNewEventType}
                  size="small"
                >
                  Add
                </Button>
              </>
            )}
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Event Type */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.eventType}
                onChange={(e) => handleChange('eventType', e.target.value)}
                label="Event Type"
              >
                {eventTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
              {errors.eventType && (
                <Typography variant="caption" color="error">
                  {errors.eventType}
                </Typography>
              )}
            </FormControl>

            {/* Event Name */}
            <TextField
              label="Event Name"
              value={formData.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2, ...darkModeStyles.textField }}
              error={!!errors.eventName}
              helperText={errors.eventName}
            />

            {/* Ticketed */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isTicketed}
                  onChange={(e) => handleChange('isTicketed', e.target.checked)}
                />
              }
              label="Ticketed Event"
              sx={{ mb: 2 }}
            />

            {formData.isTicketed && (
              <TextField
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                fullWidth
                size="small"
                error={!!errors.price}
                helperText={errors.price}
                sx={{ mb: 2, ...darkModeStyles.textField }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R</InputAdornment>
                }}
              />
            )}

            {/* Date & Time */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date}
                sx={darkModeStyles.textField}
              />
              <TextField
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!errors.time}
                helperText={errors.time}
                sx={darkModeStyles.textField}
              />
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>AM/PM</InputLabel>
                <Select
                  value={formData.timePeriod}
                  label="AM/PM"
                  onChange={(e) => handleChange('timePeriod', e.target.value)}
                >
                  {timePeriods.map(period => (
                    <MenuItem key={period} value={period}>{period}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Recurring Days */}
            <Box mb={2}>
              <Typography fontWeight="bold" mb={1}>
                Recurring Days (Optional)
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {days.map(day => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={formData.recurringDays.includes(day)}
                        onChange={() => handleDayChange(day)}
                        size="small"
                      />
                    }
                    label={day}
                  />
                ))}
              </Box>
            </Box>

            {/* Location */}
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2, ...darkModeStyles.textField }}
              error={!!errors.location}
              helperText={errors.location}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LocationOnIcon /></InputAdornment>
              }}
            />

            {/* Event Leader */}
            <Autocomplete
              options={peopleData}
              getOptionLabel={(opt) => opt.fullName || opt.email || ''}
              value={peopleData.find(p => p.fullName === formData.eventLeader) || null}
              onChange={(e, val) => handleChange('eventLeader', val ? val.fullName : '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Event Leader"
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.eventLeader}
                  helperText={errors.eventLeader}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start"><PersonIcon /></InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.description}
              helperText={errors.description}
              InputProps={{
                startAdornment: <InputAdornment position="start"><DescriptionIcon /></InputAdornment>
              }}
            />

            {/* Buttons */}
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (editingEvent ? 'Updating...' : 'Creating...') 
                  : (editingEvent ? 'Update Event' : 'Create Event')
                }
              </Button>
            </Box>
          </form>
        </Box>

        {/* Success Snackbar */}
        <Snackbar
          open={successAlert}
          autoHideDuration={3000}
          onClose={() => setSuccessAlert(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" variant="filled">
            {successMessage}
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={errorAlert}
          autoHideDuration={4000}
          onClose={() => setErrorAlert(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" variant="filled">
            {errorMessage}
          </Alert>
        </Snackbar>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------
   Main Dashboard
------------------------- */
const StatsDashboard = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const schedulerView = isMobile ? "day" : isTablet ? "week" : "month";

  // Stats state
  const [statsOverview, setStatsOverview] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState(null);
  const [outstandingItems, setOutstandingItems] = useState({ cells: [], tasks: [] });
  const [peopleWithTasks, setPeopleWithTasks] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [period, setPeriod] = useState('monthly');

  // Chart data
  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      { label: 'Calls', data: [50, 100, 75, 120, 160], borderColor: '#42a5f5', tension: 0.4 },
      { label: 'Cells', data: [80, 60, 130, 140, 110], borderColor: '#66bb6a', tension: 0.4 }
    ]
  });

  // Modal states
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Events state
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global snackbar for actions
  const [globalSnack, setGlobalSnack] = useState({ open: false, severity: 'success', message: '' });

  // Track if data has been loaded to prevent reloads
  const dataLoadedRef = useRef(false);

  // Fetch stats data
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch overview stats
      const overviewResponse = await fetch(`${BACKEND_URL}/stats/overview?period=${period}`);
      if (!overviewResponse.ok) throw new Error('Failed to fetch overview stats');
      const overviewData = await overviewResponse.json();
      setStatsOverview(overviewData);

      // Fetch outstanding items
      const itemsResponse = await fetch(`${BACKEND_URL}/stats/outstanding-items`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setOutstandingItems(itemsData);
      }

      // Fetch people with tasks
      const peopleResponse = await fetch(`${BACKEND_URL}/stats/people-with-tasks`);
      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        setPeopleWithTasks(peopleData.people_with_outstanding_tasks || []);
      }

      // Fetch attendance trend
      const trendResponse = await fetch(`${BACKEND_URL}/stats/attendance-trend?months=6`);
      if (trendResponse.ok) {
        const trendData = await trendResponse.json();
        setAttendanceTrend(trendData);
      }

    } catch (err) {
      console.error('Error fetching stats:', err);
      setGlobalSnack({ 
        open: true, 
        severity: 'error', 
        message: 'Failed to load statistics' 
      });
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch events from backend
  const fetchEvents = async (opts = {}) => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL(`${BACKEND_URL}/events`);
      if (opts.status) url.searchParams.set('status', opts.status);

      const response = await fetch(url.toString(), { 
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      // Handle various response structures
      let events = [];
      if (Array.isArray(data)) {
        events = data;
      } else if (data.events && Array.isArray(data.events)) {
        events = data.events;
      } else if (data.results && Array.isArray(data.results)) {
        events = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        events = data.data;
      }

      // Transform events for scheduler
      const transformedEvents = events.map(event => {
        let startDate, endDate;
        
        if (event.date) {
          startDate = new Date(event.date);
          endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours duration
        } else {
          startDate = new Date(event.start || event.startDate || Date.now());
          endDate = new Date(event.end || event.endDate || startDate.getTime() + (2 * 60 * 60 * 1000));
        }

        return {
          event_id: event._id || event.id || event.event_id,
          title: event.eventName || event.title || event.name || 'Untitled',
          start: startDate,
          end: endDate,
          eventType: event.eventType || event.type || '',
          location: event.location || '',
          eventLeader: event.eventLeader || event.leader || '',
          description: event.description || '',
          isTicketed: !!event.isTicketed,
          price: event.price,
          recurringDays: event.recurring_day || event.recurringDays || [],
          originalData: event
        };
      });

      setAllEvents(transformedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please check your connection and try again.');
      setAllEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetches - only run once
  useEffect(() => {
    if (!dataLoadedRef.current) {
      fetchStats();
      fetchEvents();
      dataLoadedRef.current = true;
    }
  }, [period]);

  // Remove the page visibility and focus listeners to prevent reloads
  // This ensures data is only loaded once when the component mounts

  // Filter events for scheduler (exclude cell events if needed)
  const schedulerEvents = allEvents.filter(event => 
    !event.eventType || !event.eventType.toLowerCase().includes('cell')
  );

  // Backend API helpers
  const createEvent = async (payload) => {
    const response = await fetch(`${BACKEND_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Create failed: ${response.status}`);
    }
    return response.json();
  };

  const updateEvent = async (id, payload) => {
    const response = await fetch(`${BACKEND_URL}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Update failed: ${response.status}`);
    }
    return response.json();
  };

  const deleteEvent = async (id) => {
    const response = await fetch(`${BACKEND_URL}/events/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `Delete failed: ${response.status}`);
    }
    return response.json();
  };

  // Event handlers
  const handleEventCreated = async () => {
    await fetchEvents();
    setGlobalSnack({ open: true, severity: 'success', message: 'Events updated successfully' });
  };

  const handleSchedulerEventsChange = async (updatedEvents) => {
    // This handles drag/drop changes in the scheduler
    // For now, we'll just update local state and refresh from backend
    setAllEvents(updatedEvents);
    // Optionally refresh from backend to ensure consistency
    setTimeout(() => fetchEvents(), 1000);
  };

  // Dialog control functions
  const openCreateEventDialog = (selectedDate = null) => {
    setSelectedEventDate(selectedDate);
    setEditingEvent(null);
    setEventDialogOpen(true);
  };

  const openEditEventDialog = (event) => {
    setEditingEvent(event);
    setSelectedEventDate(null);
    setEventDialogOpen(true);
  };

  const closeEventDialog = () => {
    setEventDialogOpen(false);
    setSelectedEventDate(null);
    setEditingEvent(null);
  };

  // Delete event handler
  const handleDeleteEvent = async (event) => {
    try {
      const eventId = event.event_id || event.originalData?._id;
      if (!eventId) {
        throw new Error('Event ID not found');
      }

      await deleteEvent(eventId);
      await fetchEvents();
      setGlobalSnack({ 
        open: true, 
        severity: 'success', 
        message: 'Event deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      setGlobalSnack({ 
        open: true, 
        severity: 'error', 
        message: error.message || 'Failed to delete event' 
      });
    }
  };

  // ViewerExtraComponent for scheduler's built-in viewer
  const viewerExtraComponent = (fields, event) => {
    return (
      <Box display="flex" gap={1} alignItems="center" sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={(e) => {
            e.stopPropagation();
            openEditEventDialog(event);
          }}
        >
          Edit
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteEvent(event);
          }}
        >
          Delete
        </Button>
      </Box>
    );
  };

  // Custom event renderer for scheduler
  const customEventRenderer = ({ event, ...props }) => {
    const getEventColor = (eventType) => {
      switch (eventType) {
        case 'Sunday Service': return '#3f51b5';
        case 'Friday Service': return '#f44336';
        case 'Workshop': return '#ff9800';
        case 'Cell Meeting': return '#4caf50';
        case 'Conference': return '#9c27b0';
        case 'J-Activation': return '#00bcd4';
        case 'Encounter': return '#795548';
        case 'Destiny Training': return '#607d8b';
        default: return '#9e9e9e';
      }
    };

    return (
      <div
        {...props}
        style={{
          ...props.style,
          backgroundColor: getEventColor(event.eventType),
          border: 'none',
          borderRadius: '4px',
          padding: '2px 6px',
          fontSize: isMobile ? '10px' : '12px',
          fontWeight: 500,
          color: 'white',
          cursor: 'pointer',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        onClick={(e) => {
          e.stopPropagation();
          openEditEventDialog(event);
        }}
      >
        {event.title}
        {event.location && (
          <div style={{ fontSize: isMobile ? '8px' : '10px', opacity: 0.8 }}>
            📍 {event.location}
          </div>
        )}
      </div>
    );
  };

  // Layout styles
  const backgroundColor = mode === 'dark' ? '#1e1e1e' : '#ffffffff';
  const cardColor = mode === 'dark' ? '#2b2b2b' : '#ffffff';

  const cardShadow = mode === 'dark' 
    ? '0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)'
    : '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)';
  
  const itemShadow = mode === 'dark'
    ? '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)';

  const avatarShadow = mode === 'dark'
    ? '0 4px 12px rgba(0, 0, 0, 0.5)'
    : '0 4px 12px rgba(0, 0, 0, 0.15)';

  const countBoxShadow = mode === 'dark'
    ? '0 3px 8px rgba(0, 0, 0, 0.4)'
    : '0 3px 8px rgba(0, 0, 0, 0.12)';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        py: { xs: 2, md: 4 }
      }}
    >
      <CssBaseline />
      {/* Changed width from 100% to 80% */}
      <Box sx={{ width: '80%', maxWidth: 1200, px: { xs: 1, sm: 2 }, mt: "50px" }}>
        
        {/* Period Selector */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Dashboard Overview
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3} justifyContent="center">

          {/* Service Growth */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2, 
              bgcolor: cardColor, 
              height: 545,
              boxShadow: cardShadow,
              transition: 'box-shadow 0.3s ease-in-out',
            }}>
              <Typography variant="subtitle2">{period.charAt(0).toUpperCase() + period.slice(1)}</Typography>
              <Typography variant="h4" fontWeight="bold" mt={2}>
                {statsOverview?.growth_rate || 0}%
              </Typography>
              <Typography>Service Growth</Typography>
              {statsOverview?.attendance_breakdown && Object.keys(statsOverview.attendance_breakdown).length > 0 ? (
                <Pie
                  data={{
                    labels: Object.keys(statsOverview.attendance_breakdown),
                    datasets: [{ 
                      data: Object.values(statsOverview.attendance_breakdown), 
                      backgroundColor: [
                        '#3f51b5', '#f44336', '#4caf50', '#ff9800', 
                        '#9c27b0', '#00bcd4', '#795548'
                      ], 
                      hoverOffset: 4 
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: theme.palette.text.primary
                        }
                      }
                    }
                  }}
                />
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="textSecondary">
                    No attendance data available for {period} period
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3} direction="column">
              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor, boxShadow: cardShadow }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>Attendance Trend</Typography>
                    <Box sx={{ p: 1, borderRadius: 1, boxShadow: itemShadow }}>
                      <EditIcon fontSize="small" />
                    </Box>
                  </Box>
                  <Typography variant="caption">Last 6 Months</Typography>
                  {attendanceTrend && attendanceTrend.labels && attendanceTrend.labels.length > 0 ? (
                    <Bar
                      data={{
                        labels: attendanceTrend.labels,
                        datasets: [{ 
                          label: 'Attendance', 
                          data: attendanceTrend.data, 
                          backgroundColor: theme.palette.primary.main, 
                          borderRadius: 6 
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        aspectRatio: 2,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { 
                            beginAtZero: true, 
                            ticks: { color: theme.palette.text.secondary }, 
                            grid: { color: theme.palette.divider } 
                          },
                          x: { 
                            ticks: { color: theme.palette.text.secondary }, 
                            grid: { display: false } 
                          }
                        }
                      }}
                    />
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                      <Typography color="textSecondary">
                        No trend data available
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor, boxShadow: cardShadow }}>
                  <Typography>Total Attendance</Typography>
                  <Typography variant="caption">{period.charAt(0).toUpperCase() + period.slice(1)}</Typography>
                  <Box display="flex" justifyContent="center" alignItems="center" height={120}>
                    <Typography variant="h2" fontWeight="bold" color="primary">
                      {statsOverview?.total_attendance || 0}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" textAlign="center">
                    Total attendees this {period}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Outstanding Cells & Tasks */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: { xs: 3, sm: 4 }, 
                  borderRadius: 2, 
                  bgcolor: cardColor, 
                  height: 500, 
                  overflowY: 'auto', 
                  boxShadow: cardShadow 
                }}>
                  <Typography variant="h5" gutterBottom>
                    Outstanding Cells ({statsOverview?.outstanding_cells || 0})
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {loadingStats ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                        <CircularProgress />
                      </Box>
                    ) : outstandingItems.cells && outstandingItems.cells.length > 0 ? (
                      outstandingItems.cells.map((item, i) => (
                        <Box 
                          key={i} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 3, 
                            p: { xs: 1, sm: 2 }, 
                            borderRadius: 1, 
                            boxShadow: itemShadow 
                          }}
                        >
                          <Avatar sx={{ 
                            mr: { xs: 2, sm: 3 }, 
                            width: { xs: 40, sm: 48 }, 
                            height: { xs: 40, sm: 48 }, 
                            boxShadow: avatarShadow 
                          }}>
                            {item.name ? item.name[0] : '?'}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {item.name || 'Unnamed Leader'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              {item.location || 'No location specified'}
                            </Typography>
                            {item.title && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {item.title}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                        <Typography color="textSecondary">
                          No outstanding cells
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: { xs: 3, sm: 4 }, 
                  borderRadius: 2, 
                  bgcolor: cardColor, 
                  height: 500, 
                  overflowY: 'auto', 
                  boxShadow: cardShadow 
                }}>
                  <Typography variant="h5" gutterBottom>
                    Outstanding Tasks ({statsOverview?.outstanding_tasks || statsOverview?.outstanding_events || 0})
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {loadingStats ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                        <CircularProgress />
                      </Box>
                    ) : outstandingItems.tasks && outstandingItems.tasks.length > 0 ? (
                      outstandingItems.tasks.map((item, i) => (
                        <Box 
                          key={i} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 3, 
                            p: { xs: 1, sm: 2 }, 
                            borderRadius: 1, 
                            boxShadow: itemShadow 
                          }}
                        >
                          <Avatar sx={{ 
                            mr: { xs: 2, sm: 3 }, 
                            width: { xs: 40, sm: 48 }, 
                            height: { xs: 40, sm: 48 }, 
                            boxShadow: avatarShadow 
                          }}>
                            {item.name ? item.name[0] : '?'}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {item.name || 'Unassigned'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              {item.email || 'No email'}
                            </Typography>
                            {item.title && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {item.title}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            minWidth: { xs: 40, sm: 50 }, 
                            height: { xs: 40, sm: 50 }, 
                            bgcolor: theme.palette.primary.main, 
                            color: theme.palette.primary.contrastText, 
                            borderRadius: 1, 
                            ml: 2, 
                            boxShadow: countBoxShadow 
                          }}>
                            <Typography sx={{ fontWeight: 'bold' }}>
                              {(item.count || 1).toString().padStart(2, '0')}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                        <Typography color="textSecondary">
                          No outstanding tasks
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Scheduler */}
          <Grid item xs={12}>
            <Paper sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 2, 
              bgcolor: cardColor, 
              boxShadow: cardShadow 
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Church Scheduler</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2" color="textSecondary">
                    Total People: {statsOverview?.total_people || 0}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openCreateEventDialog()}
                    disabled={loading}
                    sx={{ 
                      bgcolor: theme.palette.primary.main, 
                      '&:hover': { bgcolor: theme.palette.primary.dark } 
                    }}
                  >
                    Create Event
                  </Button>
                </Box>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                  <Button size="small" onClick={() => fetchEvents()} sx={{ ml: 1 }}>
                    Retry
                  </Button>
                </Alert>
              )}

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Loading events...</Typography>
                </Box>
              ) : (
                <Box sx={{
                  width: '100%', 
                  height: { xs: 400, sm: 500, md: 600 },
                  overflow: 'hidden',
                  borderRadius: 1,
                  boxShadow: itemShadow,
                  "& .rs__root": { width: '100% !important', height: '100% !important' },
                }}>
                  <Scheduler
                    view={schedulerView}
                    events={schedulerEvents}
                    onEventsChange={handleSchedulerEventsChange}
                    config={{
                      defaultTheme: mode,
                      adaptive: true,
                      cellHeight: isMobile ? 35 : isTablet ? 45 : 55,
                      headerHeight: isMobile ? 35 : isTablet ? 45 : 55,
                      fontSize: isMobile ? 11 : isTablet ? 12 : 14,
                      hourFormat: isMobile ? 12 : 24,
                      weekStartsOn: 0,
                      eventItemHeight: isMobile ? 25 : 30,
                      multiDayItemHeight: isMobile ? 25 : 30,
                    }}
                    onCellClick={(date) => {
                      openCreateEventDialog(date);
                    }}
                    editable={false}
                    deletable={false}
                    eventRenderer={customEventRenderer}
                    viewerExtraComponent={viewerExtraComponent}
                    style={{ fontSize: isMobile ? '0.75rem' : '0.875rem', width: '100%' }}
                  />
                </Box>
              )}
            </Paper>
          </Grid>

        </Grid>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="create event"
          onClick={() => openCreateEventDialog()}
          sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
        >
          <AddIcon />
        </Fab>

        {/* Event Creation/Edit Dialog */}
        <EventCreationPopup
          open={eventDialogOpen}
          onClose={closeEventDialog}
          onEventCreated={handleEventCreated}
          user={{ email: 'user@example.com' }}
          backendUrl={BACKEND_URL}
          selectedDate={selectedEventDate}
          editingEvent={editingEvent}
        />

        {/* Global Snackbar */}
        <Snackbar
          open={globalSnack.open}
          autoHideDuration={3000}
          onClose={() => setGlobalSnack({ ...globalSnack, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={globalSnack.severity} variant="filled">
            {globalSnack.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default StatsDashboard;