import React, { useState, useEffect } from 'react';
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
  Autocomplete
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Close as CloseIcon, 
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  Person as PersonIcon,
  Description as DescriptionIcon
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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

// Event Creation Popup Component
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
    'Cell Meeting'
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

  // Initialize form data when editing or creating
  useEffect(() => {
    if (editingEvent) {
      // Pre-fill form with existing event data
      const eventDate = new Date(editingEvent.start);
      const hours = eventDate.getHours();
      const minutes = eventDate.getMinutes();
      const timePeriod = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      setFormData({
        eventType: editingEvent.eventType || '',
        eventName: editingEvent.title || '',
        isTicketed: editingEvent.isTicketed || false,
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
      // Pre-fill date when creating new event
      const date = new Date(selectedDate);
      setFormData(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0]
      }));
    } else {
      resetForm();
    }
  }, [editingEvent, selectedDate, open]);

  // Mock people data - replace with actual API call
  useEffect(() => {
    const mockPeople = [
      { _id: '1', fullName: 'John Doe', email: 'john@example.com' },
      { _id: '2', fullName: 'Jane Smith', email: 'jane@example.com' },
      { _id: '3', fullName: 'Mike Johnson', email: 'mike@example.com' }
    ];
    setPeopleData(mockPeople);
  }, []);

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
      // Create the payload to match your backend API structure
      const [hoursStr, minutesStr] = formData.time.split(':');
      let hours = Number(hoursStr);
      const minutes = Number(minutesStr);
      if (formData.timePeriod === 'PM' && hours !== 12) hours += 12;
      if (formData.timePeriod === 'AM' && hours === 12) hours = 0;
      
      // Create datetime string that matches your backend format
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

      // Add price only if ticketed
      if (formData.isTicketed && formData.price) {
        payload.price = parseFloat(formData.price);
      }

      const url = editingEvent 
        ? `${backendUrl}/events/${editingEvent.event_id}`
        : `${backendUrl}/events`;
      
      const method = editingEvent ? 'PUT' : 'POST';

      // Send to your actual backend API
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      setSuccessMessage(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
      setSuccessAlert(true);
      resetForm();
      
      // Refresh the events list to include the new/updated event
      onEventCreated();
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error saving event:', err);
      
      let errorMsg = editingEvent 
        ? 'Failed to update event. Please try again.'
        : 'Failed to create event. Please try again.';
      
      if (err.message) {
        errorMsg = err.message;
      }
      
      setErrorMessage(errorMsg);
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
            <TextField
              label="Event Leader"
              value={formData.eventLeader}
              onChange={(e) => handleChange('eventLeader', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2, ...darkModeStyles.textField }}
              error={!!errors.eventLeader}
              helperText={errors.eventLeader}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
              }}
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
          autoHideDuration={3000}
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

const StatsDashboard = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const schedulerView = isMobile ? "day" : isTablet ? "week" : "month";

  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      { label: 'Calls', data: [50, 100, 75, 120, 160], borderColor: '#42a5f5', tension: 0.4 },
      { label: 'Cells', data: [80, 60, 130, 140, 110], borderColor: '#66bb6a', tension: 0.4 }
    ]
  });

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => ({
        ...prev,
        datasets: prev.datasets.map(ds => ({
          ...ds,
          data: ds.data.map(n => Math.max(0, n + Math.round((Math.random() - 0.5) * 20)))
        }))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tasks = [
    { name: 'Tegra Mungudi', email: 'tegra@example.com', count: 64 },
    { name: 'Kevin Cyberg', email: 'kevin@example.com', count: 3 },
    { name: 'Timmy Ngezo', email: 'timmy@example.com', count: 10 },
    { name: 'Zen Diaz', email: 'zen@example.com', count: 29 },
    { name: 'Eliak James', email: 'eliak@example.com', count: 4 },
    { name: 'Thabo Tshims', email: 'thabo@example.com', count: 24 }
  ];

  const cells = [
    { name: 'Tegra Mungudi', location: 'Rosettenville School cell' },
    { name: 'Kevin Cyberg', location: '98 Albert Street (Home) Cell' },
    { name: 'Timmy Ngezo', location: 'Downtown Community Cell' },
    { name: 'Zen Diaz', location: 'Eastside Cell Group' }
  ];

  // Events state that fetches from backend API
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events from backend API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different response structures from your backend
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
      
      // Transform events to match scheduler format
      const transformedEvents = events.map(event => {
        let startDate, endDate;
        
        // Handle different date formats from your backend
        if (event.date) {
          startDate = new Date(event.date);
          endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours
        } else {
          startDate = new Date(event.start || event.startDate);
          endDate = new Date(event.end || event.endDate || startDate.getTime() + (2 * 60 * 60 * 1000));
        }
        
        return {
          event_id: event._id || event.id || event.event_id,
          title: event.eventName || event.title || event.name,
          start: startDate,
          end: endDate,
          eventType: event.eventType || event.type,
          location: event.location,
          eventLeader: event.eventLeader,
          description: event.description,
          isTicketed: event.isTicketed,
          price: event.price,
          recurringDays: event.recurring_day || event.recurringDays || [],
          // Include original event data for reference
          originalData: event
        };
      });
      
      setAllEvents(transformedEvents);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Refresh events when returning from other pages or sections
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again, refresh events
        fetchEvents();
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh events
      fetchEvents();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Filter out cell events for the scheduler
  const schedulerEvents = allEvents.filter(event => 
    !event.eventType || !event.eventType.toLowerCase().includes('cell')
  );

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

  const handleEventCreated = async () => {
    // Refresh events from backend after creating a new event
    await fetchEvents();
  };

  const handleSchedulerEventsChange = async (updatedEvents) => {
    try {
      // When events are modified in the scheduler (moved, edited, deleted)
      setAllEvents(updatedEvents);
      
    } catch (error) {
      console.error('Error updating events:', error);
      // Revert to original events if update fails
      await fetchEvents();
    }
  };

  // Handle custom event creation dialog opening
  const openEventDialog = (selectedDate = null, eventToEdit = null) => {
    setSelectedEventDate(selectedDate);
    setEditingEvent(eventToEdit);
    setEventDialogOpen(true);
  };

  const closeEventDialog = () => {
    setEventDialogOpen(false);
    setSelectedEventDate(null);
    setEditingEvent(null);
  };

  // Custom event renderer for scheduler
  const customEventRenderer = ({ event, ...props }) => {
    return (
      <div
        {...props}
        style={{
          ...props.style,
          backgroundColor: event.eventType === 'Sunday Service' ? '#3f51b5' : 
                          event.eventType === 'Friday Service' ? '#f44336' :
                          event.eventType === 'Workshop' ? '#ff9800' :
                          event.eventType === 'Cell Meeting' ? '#4caf50' : '#9c27b0',
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
          openEventDialog(null, event);
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
      <Box sx={{ width: '100%', maxWidth: 1200, px: { xs: 1, sm: 2 }, mt: "50px" }}>
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
              '&:hover': {
                boxShadow: mode === 'dark' 
                  ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                  : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
              }
            }}>
              <Typography variant="subtitle2">August</Typography>
              <Typography variant="h4" fontWeight="bold" mt={2}>87.5%</Typography>
              <Typography>Service Growth</Typography>
              <Pie
                data={{
                  labels: ["August", "July"],
                  datasets: [{ data: [87.5, 12.5], backgroundColor: ["#3f51b5", "#e0e0e0"], hoverOffset: 4 }]
                }}
              />
            </Paper>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3} direction="column">
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: cardColor,
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>Weekend Services</Typography>
                    <Box sx={{
                      p: 1,
                      borderRadius: 1,
                      boxShadow: itemShadow,
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: mode === 'dark'
                          ? '0 6px 20px rgba(0, 0, 0, 0.5)'
                          : '0 6px 20px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <EditIcon fontSize="small" />
                    </Box>
                  </Box>
                  <Typography variant="caption">August</Typography>
                  <Bar
                    data={{
                      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                      datasets: [{ label: 'Attendance', data: [120, 150, 100, 180], backgroundColor: theme.palette.primary.main, borderRadius: 6 }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      aspectRatio: 2,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 50, color: theme.palette.text.secondary }, grid: { color: theme.palette.divider } },
                        x: { ticks: { color: theme.palette.text.secondary }, grid: { display: false } }
                      }
                    }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: cardColor,
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Typography>Amount of Calls<br />And Cells Captured</Typography>
                  <Typography variant="caption">August</Typography>
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      aspectRatio: 2,
                      plugins: { legend: { labels: { usePointStyle: true, pointStyle: 'rectRounded', color: theme.palette.text.primary } } },
                      scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 50, color: theme.palette.text.secondary }, grid: { color: theme.palette.divider } },
                        x: { ticks: { color: theme.palette.text.secondary }, grid: { display: false } }
                      }
                    }}
                  />
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
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    Outstanding Cells
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {cells.map((item, i) => (
                      <Box 
                        key={i} 
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 3,
                          p: { xs: 1, sm: 2 },
                          borderRadius: 1,
                          boxShadow: itemShadow,
                          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                            transform: 'translateY(-2px)',
                            boxShadow: mode === 'dark'
                              ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)'
                              : '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          mr: { xs: 2, sm: 3 }, 
                          width: { xs: 40, sm: 48 }, 
                          height: { xs: 40, sm: 48 }, 
                          fontSize: { xs: 18, sm: 24 },
                          boxShadow: avatarShadow,
                          transition: 'box-shadow 0.2s ease-in-out'
                        }}>
                          {item.name[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              fontWeight: 500 
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            {item.location}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
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
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    Outstanding Tasks
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {tasks.map((item, i) => (
                      <Box 
                        key={i} 
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 3,
                          p: { xs: 1, sm: 2 },
                          borderRadius: 1,
                          boxShadow: itemShadow,
                          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                            transform: 'translateY(-2px)',
                            boxShadow: mode === 'dark'
                              ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)'
                              : '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          mr: { xs: 2, sm: 3 }, 
                          width: { xs: 40, sm: 48 }, 
                          height: { xs: 40, sm: 48 }, 
                          fontSize: { xs: 18, sm: 24 },
                          boxShadow: avatarShadow,
                          transition: 'box-shadow 0.2s ease-in-out'
                        }}>
                          {item.name[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              fontWeight: 500 
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            {item.email}
                          </Typography>
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
                          boxShadow: countBoxShadow,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: mode === 'dark'
                              ? '0 6px 16px rgba(0, 0, 0, 0.5)'
                              : '0 6px 16px rgba(0, 0, 0, 0.15)'
                          }
                        }}>
                          <Typography sx={{ 
                            fontWeight: 'bold', 
                            fontSize: { xs: 16, sm: 18 } 
                          }}>
                            {item.count.toString().padStart(2, '0')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
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
              boxShadow: cardShadow,
              transition: 'box-shadow 0.3s ease-in-out',
              '&:hover': {
                boxShadow: mode === 'dark' 
                  ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                  : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
              }
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                  Church Scheduler
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => openEventDialog()}
                  disabled={loading}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark
                    }
                  }}
                >
                  Create Event
                </Button>
              </Box>
              
              {/* Error Message */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                  <Button size="small" onClick={fetchEvents} sx={{ ml: 1 }}>
                    Retry
                  </Button>
                </Alert>
              )}

              {/* Loading State */}
              {loading ? (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height={400}
                >
                  <Typography>Loading events...</Typography>
                </Box>
              ) : (
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: 400, sm: 500, md: 600 },
                  overflow: 'hidden',
                  borderRadius: 1,
                  boxShadow: itemShadow,
                  "& .rs__root": { 
                    width: '100% !important', 
                    height: '100% !important' 
                  },
                  "& .rs__header": {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  },
                  "& .rs__cell": {
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    cursor: 'pointer'
                  },
                  "& .rs__event": {
                    fontSize: { xs: '0.7rem', sm: '0.8rem' },
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                    }
                  },
                  "& .rs__table": {
                    minWidth: { xs: '100%', sm: 'auto' }
                  },
                  // Override scheduler's default event creation behavior
                  "& .rs__cell--today": {
                    backgroundColor: mode === 'dark' ? 'rgba(63, 81, 181, 0.1)' : 'rgba(63, 81, 181, 0.05)'
                  }
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
                    // Custom event handlers to override default behavior
                    onCellClick={(date) => {
                      // Open custom dialog when clicking on empty cell
                      openEventDialog(date);
                    }}
                    onEventClick={(event) => {
                      // Open custom dialog when clicking on existing event
                      openEventDialog(null, event);
                    }}
                    // Disable built-in event creation
                    editable={false}
                    eventRenderer={customEventRenderer}
                    style={{
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                      width: '100%'
                    }}
                  />
                </Box>
              )}
            </Paper>
          </Grid>

        </Grid>

        {/* Floating Action Button - Alternative placement */}
        <Fab
          color="primary"
          aria-label="create event"
          onClick={() => openEventDialog()}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
            boxShadow: mode === 'dark' 
              ? '0 8px 24px rgba(0, 0, 0, 0.6)'
              : '0 8px 24px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: mode === 'dark'
                ? '0 12px 32px rgba(0, 0, 0, 0.8)'
                : '0 12px 32px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <AddIcon />
        </Fab>

        {/* Event Creation Dialog */}
        <EventCreationPopup
          open={eventDialogOpen}
          onClose={closeEventDialog}
          onEventCreated={handleEventCreated}
          user={{ email: 'user@example.com' }}
          backendUrl={BACKEND_URL}
          selectedDate={selectedEventDate}
          editingEvent={editingEvent}
        />
      </Box>
    </Box>
  );
};

export default StatsDashboard;