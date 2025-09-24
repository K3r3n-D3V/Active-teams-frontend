import { useState, useEffect } from 'react';
import {
  Button, TextField, Checkbox, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, FormControlLabel, Box, InputAdornment, Snackbar, Alert, Typography,
  useTheme, Autocomplete
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const CreateEvents = ({
  user,
  isModal = false,
  onClose,
  eventTypes = [],
  selectedEventType = '',
  isGlobalEvent = false,
  isTicketedEvent = false,
  hasPersonSteps = false
}) => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorAlert, setErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [peopleData, setPeopleData] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false);
 
  // Hardcoded Leader at 1 options
  const leaderAt1Options = [
    { fullName: 'Vicky Enslin', _id: 'vicky_enslin' },
    { fullName: 'Gavin Enslin', _id: 'gavin_enslin' }
  ];

  useEffect(() => {
    if (eventTypes.length === 1) {
      setFormData(prev => ({ ...prev, eventType: eventTypes[0] }));
    }
  }, [eventTypes]);

  const [formData, setFormData] = useState({
    eventType: selectedEventType || '',
    eventName: '',
    ageGroup: '',
    memberType: '',
    price: '',
    date: '',
    time: '',
    timePeriod: 'AM',
    recurringDays: [],
    location: '',
    eventLeader: '',
    description: '',
    leader1: '',
    leader12: '',
    email: '',
    leaders: []
  });


  const [errors, setErrors] = useState({});
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Days of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Time periods
  const timePeriods = ['AM', 'PM'];

  // Fetch people function
  const fetchPeople = async (filter = "") => {
    try {
      setLoadingPeople(true);
      const params = new URLSearchParams();
      if (filter) params.append("name", filter);
      params.append("perPage", "100");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`);
      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p.leader1 || "",
        leader12: p["Leader @12"] || p.leader12 || "",
        leader144: p["Leader @144"] || p.leader144 || "",
      }));

      setPeopleData(formatted);
      console.log('Fetched people:', formatted.length, 'with filter:', filter);
    } catch (err) {
      console.error("Error fetching people:", err);
      setErrorMessage("Failed to load people data. Please refresh the page.");
      setErrorAlert(true);
    } finally {
      setLoadingPeople(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPeople();
  }, [BACKEND_URL]);

  // Debounced search effect
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchPeople(searchName);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchName]);

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

        // Handle new fields
        data.ageGroup = data.ageGroup || '';
        data.memberType = data.memberType || '';

        // Collect leaders dynamically
        data.leaders = Object.entries(data)
          .filter(([key, value]) => key.toLowerCase().startsWith("leader") && value)
          .map(([key, value]) => ({ slot: key, name: value }));

        setFormData(data);
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
          leader1: '',
          leader12: '',
          email: '',
          eventLeader: '',
          ...(isCell ? { date: '', time: '', timePeriod: 'AM' } : {})
        }));
      }
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

    if (!formData.eventLeader) {
      newErrors.eventLeader = 'Event leader is required';
    }

    if (!formData.description) {
      newErrors.description = 'Description is required';
    }

    // Skip additional validations for global events
    if (!isGlobalEvent) {
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

      // Validate ticketed fields when event type is configured as ticketed
      if (isTicketedEvent) {
        if (!formData.ageGroup) {
          newErrors.ageGroup = 'Age group is required for ticketed events';
        }
        if (!formData.memberType) {
          newErrors.memberType = 'Member type is required for ticketed events';
        }
        if (!formData.price) {
          newErrors.price = 'Price is required for ticketed events';
        }
      }
    } else {
      // For global events, only validate basic date/time
      if (!formData.date) {
        newErrors.date = 'Date is required';
      }
      if (!formData.time) {
        newErrors.time = 'Time is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      eventType: '',
      eventName: '',
      ageGroup: '',
      memberType: '',
      price: '',
      date: '',
      time: '',
      timePeriod: 'AM',
      recurringDays: [],
      location: '',
      eventLeader: '',
      description: '',
      leader1: '',
      leader12: '',
      email: '',
      leaders: []
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const isCell = formData.eventType.toLowerCase().includes("cell");

      // Prepare payload with field names that match your backend model
      const payload = {
        eventType: formData.eventType,
        eventName: formData.eventName,
        isTicketed: isTicketedEvent,
        location: formData.location,
        eventLeader: formData.eventLeader,
        description: formData.description,
        userEmail: user?.email || '',
        recurring_day: formData.recurringDays
      };

      // Handle ticketed event fields when event type is configured as ticketed
      if (isTicketedEvent) {
        payload.ageGroup = formData.ageGroup;
        payload.memberType = formData.memberType;
        payload.price = formData.price ? parseFloat(formData.price) : 0;
      } else {
        payload.price = null;
      }

      // Add leaders for cell events with person steps
      if (isCell && !isGlobalEvent && hasPersonSteps) {
        if (formData.leader1) payload.leader1 = formData.leader1;
        if (formData.leader12) payload.leader12 = formData.leader12;
        if (formData.email) payload.email = formData.email;
      }

      // Handle date for non-cell events OR global events
      if ((!isCell || isGlobalEvent) && formData.date && formData.time) {
        const [hoursStr, minutesStr] = formData.time.split(':');
        let hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        if (formData.timePeriod === 'PM' && hours !== 12) hours += 12;
        if (formData.timePeriod === 'AM' && hours === 12) hours = 0;

        const dateTimeString = `${formData.date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        payload.date = dateTimeString;
      }

      console.log('Payload being sent:', JSON.stringify(payload, null, 2));

      // Send request
      const response = eventId
        ? await axios.put(`${BACKEND_URL}/events/${eventId}`, payload)
        : await axios.post(`${BACKEND_URL}/events`, payload);

      console.log('Server response:', response.data);

      setSuccessMessage(
        isCell && !isGlobalEvent
          ? `The ${formData.eventName} Cell has been ${eventId ? 'updated' : 'created'} successfully!`
          : eventId ? "Event updated successfully!" : "Event created successfully!"
      );
      setSuccessAlert(true);

      if (!eventId) resetForm();

      // Close modal or navigate after a brief delay to show success message
      setTimeout(() => {
        if (isModal && typeof onClose === 'function') {
          onClose();
        } else {
          navigate("/events", { state: { refresh: true } });
        }
      }, 1500);

    } catch (err) {
      console.error("Error submitting event:", err);
      console.error("Error response:", err.response?.data);

      let errorMsg = "Something went wrong. Please try again!";

      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        }
      }

      setErrorMessage(errorMsg);
      setErrorAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCell = formData.eventType.toLowerCase().includes("cell");

  // Modified styles for modal use
  const containerStyle = isModal ? {
    padding: '0',
    minHeight: 'auto',
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    maxHeight: 'none',
    overflowY: 'auto',
  } : {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    bgcolor: isDarkMode ? '#121212' : '#f5f5f5',
    px: 2
  };

  const cardStyle = isModal ? {
    width: '100%',
    height: '100%',
    padding: '1.5rem',
    borderRadius: 0,
    boxShadow: 'none',
    backgroundColor: 'transparent',
    maxHeight: 'none',
    overflow: 'visible',
  } : {
    width: { xs: '100%', sm: '85%', md: '700px' },
    p: 5,
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  };

  const darkModeStyles = {
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
    }
  };
  // New dropdown options
  const ageGroupOptions = ['Child', 'Adult'];
  const memberTypeOptions = ['Guild', 'First Time'];
  // Only define if not already defined
  // const isTicketedEvent = formData.eventType === 'Ticketed';
  // const isGlobalEvent = formData.eventType === 'Global';


  return (
    <Box sx={containerStyle}>
      <Card sx={{
        ...cardStyle,
        ...(isDarkMode && !isModal ? {
          bgcolor: '#1e1e1e',
          color: '#ffffff',
          border: '1px solid #333',
        } : {})
      }}>
        <CardContent sx={{
          padding: isModal ? '0' : '1rem',
          '&:last-child': { paddingBottom: isModal ? '0' : '1rem' }
        }}>
          {!isModal && (
            <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4} color="primary">
              {eventId ? 'Edit Event' : 'Create New Event'}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label={isGlobalEvent ? "Event Group Name" : "Event Type"}
              value={formData.eventType}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              InputProps={{
                readOnly: true,
              }}
              disabled
            />

            {/* Event Name */}
            <TextField
              label="Event Name"
              value={formData.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.eventName}
              helperText={errors.eventName || (isCell && !isGlobalEvent ? "Auto-filled when event leader is selected" : "")}
            />

            {/* Ticketed Event Fields */}
            {isTicketedEvent && !isGlobalEvent && !hasPersonSteps && (
              <>
                {/* Age Group */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Age Group</InputLabel>
                  <Select
                    value={formData.ageGroup}
                    onChange={(e) => handleChange('ageGroup', e.target.value)}
                  >
                    <MenuItem value="Child">Child</MenuItem>
                    <MenuItem value="Adult">Adult</MenuItem>
                  </Select>
                </FormControl>

                {/* Member Type */}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Member Type</InputLabel>
                  <Select
                    value={formData.memberType}
                    onChange={(e) => handleChange('memberType', e.target.value)}
                  >
                    <MenuItem value="Guild">Guild</MenuItem>
                    <MenuItem value="First">First</MenuItem>
                  </Select>
                </FormControl>

                {/* Price */}
                <TextField
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {/* Global Event: hide Age Group, Member Type, Price (so no fields here) */}

            {/* Personal Steps Fields */}
            {hasPersonSteps && (
              <>
                <TextField
                  label="Leader @1"
                  value={formData.leader1}
                  onChange={(e) => handleChange('leader1', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Leader @12"
                  value={formData.leader12}
                  onChange={(e) => handleChange('leader12', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
              </>
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
                disabled={isCell && !isGlobalEvent}
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
                disabled={isCell && !isGlobalEvent}
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
                  disabled={isCell && !isGlobalEvent}
                >
                  {timePeriods.map(period => (
                    <MenuItem key={period} value={period}>{period}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>


            {/* Age Group + Member Type side by side */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={3}>
              <FormControl fullWidth size="small" error={!!errors.ageGroup}>
                <InputLabel sx={{ color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)' }}>Age Group *</InputLabel>
                <Select
                  value={formData.ageGroup}
                  label="Age Group *"
                  onChange={(e) => handleChange('ageGroup', e.target.value)}
                  sx={{
                    bgcolor: isDarkMode ? '#2d2d2d' : 'white',
                    color: isDarkMode ? '#ffffff' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#777' : 'rgba(0, 0, 0, 0.87)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  {ageGroupOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
                {errors.ageGroup && (
                  <Typography variant="caption" sx={darkModeStyles.errorText}>
                    {errors.ageGroup}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth size="small" error={!!errors.memberType}>
                <InputLabel sx={{ color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)' }}>Member Type *</InputLabel>
                <Select
                  value={formData.memberType}
                  label="Member Type *"
                  onChange={(e) => handleChange('memberType', e.target.value)}
                  sx={{
                    bgcolor: isDarkMode ? '#2d2d2d' : 'white',
                    color: isDarkMode ? '#ffffff' : 'inherit',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? '#777' : 'rgba(0, 0, 0, 0.87)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  {memberTypeOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
                {errors.memberType && (
                  <Typography variant="caption" sx={darkModeStyles.errorText}>
                    {errors.memberType}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Price field below */}
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


            {/* Recurring Days - Show for all events */}
            <Box mb={3}>
              <Typography fontWeight="bold" mb={1} sx={{ color: isDarkMode ? '#ffffff' : 'inherit' }}>
                Recurring Days {isCell && !isGlobalEvent && <span style={{ color: 'red' }}>*</span>}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#bbb' : '#666', mb: 2 }}>
                {isCell && !isGlobalEvent
                  ? 'Select the days this cell meets regularly'
                  : 'Optional: Select days if this event repeats weekly'}
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
            <TextField
              label="Event Leader"
              value={formData.eventLeader}
              onChange={(e) => handleChange('eventLeader', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.eventLeader}
              helperText={errors.eventLeader}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
              }}
            />

            {/* Cell Leadership Section - Only show for cell events with person steps and non-global events */}
            {isCell && !isGlobalEvent && hasPersonSteps && (
              <Box mb={3}>
                <Typography
                  variant="h6"
                  sx={{ mb: 2, color: isDarkMode ? '#ffffff' : 'inherit' }}
                >
                  Leadership Hierarchy
                </Typography>

                {/* Leader at 1 - HARDCODED OPTIONS */}
                <Autocomplete
                  options={leaderAt1Options}
                  getOptionLabel={(option) => option.fullName || ''}
                  value={leaderAt1Options.find(p => p.fullName === formData.leader1) || null}
                  onChange={(event, newValue) => {
                    handleChange('leader1', newValue?.fullName || '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Leader at 1"
                      size="small"
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      helperText="Only Vicky Enslin and Gavin Enslin available"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />

                {/* Leader at 12 - SERVER-SIDE FILTERING */}
                <Autocomplete
                  freeSolo
                  loading={loadingPeople}
                  options={peopleData}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.fullName || '';
                  }}
                  value={peopleData.find(p => p.fullName === formData.leader12) || formData.leader12 || ''}
                  onChange={(event, newValue) => {
                    const selectedName = typeof newValue === 'string' ? newValue : (newValue?.fullName || '');
                    handleChange('leader12', selectedName);
                  }}
                  onInputChange={(event, newInputValue) => {
                    handleChange('leader12', newInputValue);
                    setSearchName(newInputValue);
                  }}
                  filterOptions={(options) => options}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Leader at 12"
                      size="small"
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      helperText={loadingPeople ? "Loading..." : `Search by name (${peopleData.length} people found)`}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body1">{option.fullName}</Typography>
                        {option.email && (
                          <Typography variant="body2" color="text.secondary">
                            {option.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
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
            <Box display="flex" gap={2} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  if (isModal && typeof onClose === 'function') {
                    onClose();
                  } else {
                    navigate("/events", { state: { refresh: true } });
                  }
                }}
                sx={darkModeStyles.button.outlined}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
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