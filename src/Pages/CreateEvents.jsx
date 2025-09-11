import { useState, useEffect } from 'react';
import {
  Button, TextField, Checkbox, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, FormControlLabel, Box, InputAdornment, Snackbar, Alert, Typography,
  useTheme
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const CreateEvents = ({ user }) => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
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
  const [searchLeader, setSearchLeader] = useState('');
  const [showPeopleList, setShowPeopleList] = useState(false);

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
    description: '',
    leader12: '',
    leader144: '',
    email: ''
  });

  const [errors, setErrors] = useState({});
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Days of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Time periods
  const timePeriods = ['AM', 'PM'];

  const filteredPeople = Array.isArray(peopleData)
    ? peopleData.filter(person =>
      person.fullName?.toLowerCase().includes(searchLeader.toLowerCase())
    )
    : [];

  const handlePersonSelect = (person) => {
    setSearchLeader(person.fullName);
    setShowPeopleList(false);

    setFormData(prev => ({
      ...prev,
      eventLeader: person._id,
      leader12: person.leader12Id || '',
      leader144: person.leader144Id || '',
      email: person.email || ''
    }));
  };

  // Fetch people from backend
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/people`);

        if (Array.isArray(response.data)) {
          const transformedData = response.data.map(person => ({
            _id: person._id,
            name: person.Name || person.name,
            surname: person.Surname || person.surname,
            email: person.Email || person.email,
            leader12Id: person["Leader @12 Id"] || '',
            leader144Id: person["Leader @144 Id"] || '',
            fullName: `${person.Name || person.name} ${person.Surname || person.surname}`
          }));

          setPeopleData(transformedData);
        } else {
          console.warn('People data is not an array', response.data);
        }
      } catch (err) {
        console.error("Failed to fetch people data:", err);
        setErrorMessage("Failed to load people data. Please try again.");
        setErrorAlert(true);
      }
    };

    fetchPeople();
  }, [BACKEND_URL]);

  // Fetch event data if editing
  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/events/${eventId}`);
        const data = response.data;

        if (data.date) {
          const dt = new Date(data.date);
          data.date = dt.toISOString().split('T')[0];
          const hours = dt.getHours();
          const minutes = dt.getMinutes();
          data.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          data.timePeriod = hours >= 12 ? 'PM' : 'AM';
        }

        if (data.recurring_day) {
          data.recurringDays = Array.isArray(data.recurring_day) ? data.recurring_day : [];
        }

        data.price = data.price ? data.price.toString() : '';

        // Collect leaders dynamically
        data.leaders = Object.entries(data)
          .filter(([key, value]) => key.toLowerCase().startsWith("leader") && value)
          .map(([key, value]) => ({ slot: key, name: value }));

        setFormData(data);
        setSearchLeader(data.eventLeader || '');
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setErrorMessage("Failed to load event data. Please try again.");
        setErrorAlert(true);
      }
    };

    fetchEventData();
  }, [eventId, BACKEND_URL]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));

    if (field === 'eventType') {
      const isCell = value.toLowerCase().includes("cell");
      const wasCell = formData.eventType.toLowerCase().includes("cell");

      if (isCell !== wasCell) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          eventName: '',
          leader12: '',
          leader144: '',
          email: '',
          ...(isCell ? { date: '', time: '', timePeriod: 'AM' } : {})
        }));
        setSearchLeader('');
      }
    }

    // Clear eventLeader ID when typing manually (not selecting from dropdown)
    if (field === 'eventLeader') {
      setFormData(prev => ({
        ...prev,
        eventLeader: '',
        leader12: '',
        leader144: '',
        email: ''
      }));
    }
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
    const isCell = formData.eventType.toLowerCase().includes("cell");

    if (!formData.eventType) {
      newErrors.eventType = 'Event type is required';
    }

    if (!formData.eventName) {
      newErrors.eventName = 'Event name is required';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    if (!searchLeader) {
      newErrors.eventLeader = 'Event leader is required';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    }

    if (isCell && formData.recurringDays.length === 0) {
      newErrors.recurringDays = 'Select at least one recurring day';
    }

    if (!isCell) {
      if (!formData.date) {
        newErrors.date = 'Date is required';
      }
      if (!formData.time) {
        newErrors.time = 'Time is required';
      }
    }

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
      description: '',
      leader12: '',
      leader144: '',
      email: ''
    });
    setErrors({});
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsSubmitting(true);

  try {
    const isCell = formData.eventType.toLowerCase().includes("cell");

    // Prepare payload
    const payload = {
      ...formData,
      eventLeader: formData.eventLeader,
      leader12: formData.leader12,
      leader144: formData.leader144,
      userEmail: user?.email || '',
      recurring_day: formData.recurringDays
    };

    // Convert ticketed price to number if needed
    if (payload.price) {
      payload.price = parseFloat(payload.price);
    } else {
      delete payload.price;
    }

    // Handle date and time
    if (!isCell) {
      if (payload.date && payload.time) {
        const [hoursStr, minutesStr] = payload.time.split(':');
        let hours = Number(hoursStr);
        const minutes = Number(minutesStr);

        if (payload.timePeriod === 'PM' && hours !== 12) hours += 12;
        if (payload.timePeriod === 'AM' && hours === 12) hours = 0;

        const [year, month, day] = payload.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day, hours, minutes, 0); // local time
        payload.date = dateObj.toISOString(); // send ISO to backend
      } else {
        payload.date = null;
      }
    } else {
      payload.date = null; // Cell events have no date
    }

    // Remove time fields
    delete payload.time;
    delete payload.timePeriod;

    // Send request
    if (eventId) {
      await axios.put(`${BACKEND_URL}/events/${eventId}`, payload);
    } else {
      await axios.post(`${BACKEND_URL}/events`, payload);
    }

    // Update leaders for UI display
    const selectedLeader = peopleData.find(p => p._id === formData.eventLeader);
    setFormData(prev => ({
      ...prev,
      leaders: [
        { slot: 'eventLeader', name: selectedLeader?.fullName || '' },
        { slot: 'leader12', name: formData.leader12 },
        { slot: 'leader144', name: formData.leader144 }
      ]
    }));

    setSuccessMessage(
      isCell
        ? `The ${formData.eventName} Cell has been ${eventId ? 'updated' : 'created'} successfully!`
        : eventId ? "Event updated successfully!" : "Event created successfully!"
    );
    setSuccessAlert(true);

    if (!eventId) resetForm();

    setTimeout(() => {
      navigate("/events");
    }, 1800);

  } catch (err) {
    console.error("Error submitting event:", err.response?.data || err.message);
    setErrorMessage(
      err.response?.data?.detail ||
      err.response?.data?.message ||
      "Something went wrong. Please try again!"
    );
    setErrorAlert(true);
  } finally {
    setIsSubmitting(false);
  }
};

  const isCell = formData.eventType.toLowerCase().includes("cell");

  const darkModeStyles = {
    card: {
      bgcolor: isDarkMode ? '#1e1e1e' : 'white',
      color: isDarkMode ? '#ffffff' : 'black',
      border: isDarkMode ? '1px solid #333' : 'none',
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        bgcolor: isDarkMode ? '#2d2d2d' : 'white',
        color: isDarkMode ? '#ffffff' : 'inherit',
        '& fieldset': {
          borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)'
        },
        '&:hover fieldset': {
          borderColor: isDarkMode ? '#777' : 'rgba(0, 0, 0, 0.87)'
        },
        '&.Mui-focused fieldset': {
          borderColor: theme.palette.primary.main
        },
      },
      '& .MuiInputLabel-root': {
        color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)',
        '&.Mui-focused': {
          color: theme.palette.primary.main
        },
      },
      '& .MuiInputAdornment-root .MuiSvgIcon-root': {
        color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.54)',
      },
    },
    select: {
      '& .MuiOutlinedInput-root': {
        bgcolor: isDarkMode ? '#2d2d2d' : 'white',
        color: isDarkMode ? '#ffffff' : 'inherit'
      },
      '& .MuiInputLabel-root': {
        color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)'
      },
    },
    formControlLabel: {
      '& .MuiFormControlLabel-label': {
        color: isDarkMode ? '#ffffff' : 'inherit'
      },
    },
    button: {
      outlined: {
        borderColor: isDarkMode ? '#555' : 'primary.main',
        color: isDarkMode ? '#ffffff' : 'primary.main',
        '&:hover': {
          borderColor: isDarkMode ? '#777' : 'primary.dark',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(25,118,210,0.04)'
        },
      },
    },
    errorText: {
      color: isDarkMode ? '#ff6b6b' : 'red'
    },
    warningText: {
      color: 'orange'
    },
    peopleList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 10,
      maxHeight: '200px',
      overflowY: 'auto',
      border: '1px solid #ccc',
      borderRadius: '6px',
      bgcolor: isDarkMode ? '#2d2d2d' : 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    personItem: {
      padding: '12px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #eee',
      color: isDarkMode ? '#ffffff' : 'inherit',
      '&:hover': {
        bgcolor: isDarkMode ? '#3d3d3d' : '#f5f5f5'
      },
      '&:last-child': {
        borderBottom: 'none'
      }
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      bgcolor: isDarkMode ? '#121212' : '#f5f5f5',
      px: 2
    }}>
      <Card sx={{
        width: { xs: '100%', sm: '85%', md: '700px' },
        p: 5,
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        ...darkModeStyles.card
      }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4} color="primary">
            {eventId ? 'Edit Event' : 'Create New Event'}
          </Typography>

          {/* New Type Form */}
          <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }} mb={2}>
            <Button
              variant="outlined"
              onClick={() => setShowNewTypeForm(!showNewTypeForm)}
              startIcon={<AddIcon />}
              sx={darkModeStyles.button.outlined}
            >
              New Type
            </Button>
            {showNewTypeForm && (
              <>
                <TextField
                  placeholder="Enter new event type"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  fullWidth
                  size="small"
                  sx={darkModeStyles.textField}
                />
                <Button
                  variant="contained"
                  onClick={addNewEventType}
                  size="small"
                  sx={{ bgcolor: 'primary.main', px: 2, py: 0.5 }}
                >
                  Add
                </Button>
              </>
            )}
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Event Type */}
            <FormControl fullWidth size="small" sx={{ mb: 3, ...darkModeStyles.select }}>
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
                <Typography variant="caption" sx={darkModeStyles.errorText}>
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
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.eventName}
              helperText={errors.eventName || (isCell ? "Auto-filled when event leader is selected" : "")}
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
              sx={{ mb: 2, ...darkModeStyles.formControlLabel }}
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
                sx={{ mb: 3, ...darkModeStyles.textField }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R</InputAdornment>
                }}
              />
            )}

            {/* Date & Time */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={3}>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={isCell}
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
                disabled={isCell}
                error={!!errors.time}
                helperText={errors.time}
                sx={darkModeStyles.textField}
              />
              <FormControl size="small" sx={{ minWidth: 80, ...darkModeStyles.select }}>
                <InputLabel>AM/PM</InputLabel>
                <Select
                  value={formData.timePeriod}
                  label="AM/PM"
                  onChange={(e) => handleChange('timePeriod', e.target.value)}
                  disabled={isCell}
                >
                  {timePeriods.map(period => (
                    <MenuItem key={period} value={period}>{period}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Recurring Days */}
            {isCell && (
              <Box mb={3}>
                <Typography fontWeight="bold" mb={1} sx={{ color: isDarkMode ? '#ffffff' : 'inherit' }}>
                  Recurring Days <span style={{ color: 'red' }}>*</span>
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {days.map(day => (
                    <FormControlLabel
                      key={day}
                      control={
                        <Checkbox
                          checked={formData.recurringDays.includes(day)}
                          onChange={() => handleDayChange(day)}
                        />
                      }
                      label={day}
                      sx={darkModeStyles.formControlLabel}
                    />
                  ))}
                </Box>
                {errors.recurringDays && (
                  <Typography variant="caption" sx={darkModeStyles.errorText}>
                    {errors.recurringDays}
                  </Typography>
                )}
              </Box>
            )}

            {/* Location */}
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.location}
              helperText={errors.location}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LocationOnIcon /></InputAdornment>
              }}
            />

            {/* Event Leader */}
            <Box sx={{ position: 'relative', mb: 3 }}>
              <TextField
                label="Event Leader"
                value={searchLeader}
                onChange={(e) => {
                  setSearchLeader(e.target.value);
                  setShowPeopleList(!!e.target.value);
                  handleChange('eventLeader', e.target.value);
                }}
                fullWidth
                size="small"
                sx={darkModeStyles.textField}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
                }}
                error={!!errors.eventLeader}
                helperText={errors.eventLeader || "Type to search and select a person from the list"}
              />

              {showPeopleList && filteredPeople.length > 0 && (
                <Box sx={darkModeStyles.peopleList}>
                  {filteredPeople.map((person, idx) => (
                    <Box
                      key={person._id || idx}
                      onClick={() => handlePersonSelect(person)}
                      sx={darkModeStyles.personItem}
                    >
                      <Typography variant="body1">{person.fullName}</Typography>
                      {isCell && (
                        <Typography variant="caption" sx={{ color: isDarkMode ? '#bbb' : '#666' }}>
                          Leader @12: {person.leader12} | Leader @144: {person.leader144}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Show warning if user typed but didn't select */}

            </Box>

            {/* Cell Leadership */}
            {isCell && (
              <Box mb={3}>
                <Typography variant="h6" sx={{ mb: 2, color: isDarkMode ? '#ffffff' : 'inherit' }}>
                  Leadership Hierarchy
                </Typography>
                <TextField
                  label="Leader at 12"
                  value={formData.leader12}
                  onChange={(e) => handleChange('leader12', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><DescriptionIcon /></InputAdornment>
                  }}
                />
                <TextField
                  label="Leader at 144"
                  value={formData.leader144}
                  onChange={(e) => handleChange('leader144', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><DescriptionIcon /></InputAdornment>
                  }}
                />
              </Box>
            )}

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
                onClick={() => navigate("/events", { state: { refresh: true } })}
                sx={darkModeStyles.button.outlined}
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
                  ? (eventId ? 'Updating...' : 'Creating...')
                  : (eventId ? 'Update Event' : 'Create Event')
                }
              </Button>
            </Box>
          </form>

          {/* Event Leaders Display */}
          {formData.leaders && formData.leaders.length > 0 && (
            <Box mt={2}>
              <Typography variant="h6">Event Leaders:</Typography>
              <Box component="ul">
                {formData.leaders.map((leader, idx) => (
                  <Typography component="li" key={idx}>
                    {leader.slot}: {leader.name}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

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
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateEvents;