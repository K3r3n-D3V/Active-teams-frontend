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
  console.log("DEBUG: isTicketedEvent prop in CreateEvents:", isTicketedEvent);

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
  const [loadingPeople, setLoadingPeople] = useState(false);

  useEffect(() => {
    if (eventTypes.length === 1) {
      setFormData(prev => ({ ...prev, eventType: eventTypes[0] }));
    }
  }, [eventTypes]);

  const isAdmin = user?.role === "admin";
  console.log("User role:", user?.role, "isAdmin:", isAdmin);

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
    leaders: []
  });

  const [errors, setErrors] = useState({});
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Days of the week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // const ageGroupOptions = ['Child', 'Adult'];
  // const memberTypeOptions = ['Guild', 'First Time'];

  // Fetch people function - FIXED to match AttendanceModal approach
  const fetchPeople = async (filter = "") => {
    console.log("fetchPeople called with filter:", filter);
    try {
      setLoadingPeople(true);
      const params = new URLSearchParams();
      params.append("perPage", "1000"); // Changed from "100" to "1000" to match your logs
      if (filter) {
        params.append("name", filter);
      }

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`);
      console.log("Request URL:", `${BACKEND_URL}/people?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const peopleArray = data.people || data.results || [];
      console.log("Fetched peopleArray:", peopleArray);

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p.leader1 || "",
        leader12: p["Leader @12"] || p.leader12 || "",
        leader144: p["Leader @144"] || p.leader144 || "",
      }));

      console.log("Formatted peopleData:", formatted);
      setPeopleData(formatted);
    } catch (err) {
      console.error("Error fetching people:", err);
      setErrorMessage("Failed to load people data. Please refresh the page.");
      setErrorAlert(true);
      setPeopleData([]); // Reset on error
    } finally {
      setLoadingPeople(false);
    }
  };
  useEffect(() => {
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
    console.log(`Changing ${field} to:`, value); // Debug log

    setFormData(prev => {
      // Clear errors for this field outside setFormData for clarity
      if (errors[field]) {
        setErrors(prevErrors => ({ ...prevErrors, [field]: '' }));
      }

      if (field === 'eventType') {
        const isCell = value.toLowerCase().includes("cell");
        const wasCell = prev.eventType.toLowerCase().includes("cell");

        if (isCell !== wasCell) {
          // Reset dependent fields on switching to/from cell
          return {
            ...prev,
            [field]: value,
            eventName: '',
            leader1: '',
            leader12: '',
            eventLeader: '',
            ...(isCell ? { date: '', time: '', timePeriod: 'AM' } : {})
          };
        }
      }

      // Default: just update the field
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleDayChange = (day) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }));
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
      leaders: []
    });
    setErrors({});
  };

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      leaders: [
        { slot: 'Leader @1', name: prev.leader1 },
        { slot: 'Leader @12', name: prev.leader12 },
      ].filter(l => l.name)
    }));
  }, [formData.leader1, formData.leader12]);

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
        if (!formData.price || parseFloat(formData.price) < 0) {
          newErrors.price = 'Price is required for ticketed events';
        }
      }

      // Validate Person Steps fields - FIXED: removed email validation
      if (hasPersonSteps && !isGlobalEvent) {
        if (!formData.leader1) {
          newErrors.leader1 = "Leader @1 is required";
        }
        if (!formData.leader12) {
          newErrors.leader12 = "Leader @12 is required";
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (isTicketedEvent) {
      setFormData((prev) => ({
        ...prev,
        price: prev.price || "",
        ageGroup: prev.ageGroup || "",
        memberType: prev.memberType || "",
      }));
    }
  }, [isTicketedEvent]);

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
        recurring_day: formData.recurringDays,
        status: 'open'  // ADD THIS LINE
      };

      // Handle ticketed event fields when event type is configured as ticketed
      if (isTicketedEvent) {
        payload.ageGroup = formData.ageGroup;
        payload.memberType = formData.memberType;
        payload.price = formData.price ? parseFloat(formData.price) : 0;
      } else {
        payload.price = null;
      }

      // FIXED: Add leaders for person steps events (removed isCell dependency and email)
      if (hasPersonSteps && !isGlobalEvent) {
        if (formData.leader1) payload.leader1 = formData.leader1;
        if (formData.leader12) payload.leader12 = formData.leader12;
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
        hasPersonSteps && !isGlobalEvent
          ? `The ${formData.eventName} event with leadership hierarchy has been ${eventId ? 'updated' : 'created'} successfully!`
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

  if (isGlobalEvent && !['admin', 'registration'].includes(user?.role)) {
    return (
      <Typography variant="h6" color="error" textAlign="center" mt={5}>
        You do not have permission to view or create this event.
      </Typography>
    );
  }

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
            {/* Event Type - Always show */}
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

            {/* Event Name - Always show */}
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

            {/* TICKETED EVENT FIELDS - Show ONLY for ticketed events */}
            {isTicketedEvent && (
              <>
                {/* Age Group input (changed from dropdown) */}
                <TextField
                  label="Age Group"
                  name="ageGroup"
                  value={formData.ageGroup}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.ageGroup}
                  helperText={errors.ageGroup}
                />

                {/* Member Type input (changed from dropdown) */}
                <TextField
                  label="Member Type"
                  name="memberType"
                  value={formData.memberType}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.memberType}
                  helperText={errors.memberType}
                />


                {/* Price input */}
                <TextField
                  label="Price (R)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                  required
                  inputProps={{ min: 0 }}
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.price}
                  helperText={errors.price}
                />
              </>
            )}

            {/* Date & Time - Show for all events */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={3}>
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
            </Box>


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

            {/* Location - Always show */}
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
            <Autocomplete
              key={`autocomplete-eventLeader`} // Optional but helpful if things rerender oddly
              freeSolo
              filterOptions={(options) => options}
              loading={loadingPeople}
              options={peopleData}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.fullName || ''
              }
              isOptionEqualToValue={(option, value) => {
                return (
                  (typeof option === 'string' ? option : option.fullName) ===
                  (typeof value === 'string' ? value : value.fullName)
                );
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id || option.fullName || Math.random()}>
                  {option.fullName}
                </li>
              )}
              value={
                typeof formData.eventLeader === 'string'
                  ? formData.eventLeader
                  : peopleData.find(p => p.fullName === formData.eventLeader) || ''
              }
              onChange={(event, newValue) => {
                const name = typeof newValue === 'string' ? newValue : newValue?.fullName || '';
                handleChange('eventLeader', name);
              }}
              onInputChange={(event, newInputValue) => {
                handleChange('eventLeader', newInputValue || '');
                if (newInputValue && newInputValue.length >= 2) {
                  fetchPeople(newInputValue);
                } else if (!newInputValue) {
                  fetchPeople('');
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Event Leader"
                  size="small"
                  sx={{ mb: 3, ...darkModeStyles.textField }}
                  error={!!errors.eventLeader}
                  helperText={
                    errors.eventLeader ||
                    (loadingPeople
                      ? "Loading..."
                      : `Type to search (${peopleData.length} found)`)
                  }
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

            {/* Leader @1 and Leader @12 - ONLY show for Person Steps events */}
            {hasPersonSteps && !isGlobalEvent && (
              <>
                {/* Leader @1 */}
                <Autocomplete
                  freeSolo
                  filterOptions={(options) => options}
                  loading={loadingPeople}
                  options={peopleData}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.fullName
                  }
                  value={
                    peopleData.find(p => p.fullName === formData.leader1) || formData.leader1 || ''
                  }
                  onChange={(event, newValue) => {
                    const name = typeof newValue === 'string' ? newValue : newValue?.fullName || '';
                    handleChange('leader1', name);
                  }}
                  onInputChange={(event, newInputValue) => {
                    handleChange('leader1', newInputValue || '');
                    if (newInputValue && newInputValue.length >= 2) {
                      fetchPeople(newInputValue);
                    } else if (!newInputValue) {
                      fetchPeople("");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Leader @1"
                      size="small"
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      error={!!errors.leader1}
                      helperText={
                        errors.leader1 ||
                        (loadingPeople ? "Loading..." : `Type to search (${peopleData.length} available)`)
                      }
                    />
                  )}
                />

                {/* Leader @12 */}
                <Autocomplete
                  freeSolo
                  filterOptions={(options) => options}
                  loading={loadingPeople}
                  options={peopleData}
                  getOptionLabel={(option) =>
                    typeof option === 'string' ? option : option.fullName
                  }
                  value={
                    peopleData.find(p => p.fullName === formData.leader12) || formData.leader12 || ''
                  }
                  onChange={(event, newValue) => {
                    const name = typeof newValue === 'string' ? newValue : newValue?.fullName || '';
                    handleChange('leader12', name);
                  }}
                  onInputChange={(event, newInputValue) => {
                    handleChange('leader12', newInputValue || '');
                    if (newInputValue && newInputValue.length >= 2) {
                      fetchPeople(newInputValue);
                    } else if (!newInputValue) {
                      fetchPeople("");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Leader @12"
                      size="small"
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      error={!!errors.leader12}
                      helperText={
                        errors.leader12 ||
                        (loadingPeople ? "Loading..." : `Type to search (${peopleData.length} available)`)
                      }
                    />
                  )}
                />
              </>
            )}

            {/* Description - Always show */}
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