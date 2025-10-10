import { useState, useEffect } from 'react';
import {
  Button, TextField, Checkbox, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, FormControlLabel, Box, InputAdornment, Snackbar, Alert, Typography,
  useTheme, Autocomplete, IconButton
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
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
  hasPersonSteps = false,
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
    paymentMethod: '',
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
    leaders: [],
    customAgeGroups: [],
    customMemberTypes: [],
    customPaymentMethods: [],
    newAgeGroup: '',
    newMemberType: '',
    newPaymentMethod: ''
  });

  const [errors, setErrors] = useState({});
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const fetchPeople = async (filter = "") => {
    console.log("fetchPeople called with filter:", filter);
    try {
      setLoadingPeople(true);
      const params = new URLSearchParams();
      params.append("perPage", "1000");
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
      setPeopleData([]);
    } finally {
      setLoadingPeople(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [BACKEND_URL]);

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
        data.ageGroup = data.ageGroup || '';
        data.memberType = data.memberType || '';

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

  useEffect(() => {
    const selectedEventType = localStorage.getItem('selectedEventType');
    if (selectedEventType) {
      const parsed = JSON.parse(selectedEventType);
      setFormData(prev => ({
        ...prev,
        eventType: parsed.name || '',
      }));
    }
  }, []);

  const handleChange = (field, value) => {
    console.log(`Changing ${field} to:`, value);

    setFormData(prev => {
      if (errors[field]) {
        setErrors(prevErrors => ({ ...prevErrors, [field]: '' }));
      }

      if (field === 'eventType') {
        const isCell = value.toLowerCase().includes("cell");
        const wasCell = prev.eventType.toLowerCase().includes("cell");

        if (isCell !== wasCell) {
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

      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleAddCustomOption = (fieldType, newValue) => {
    if (!newValue.trim()) return;

    const fieldMap = {
      ageGroup: {
        customField: 'customAgeGroups',
        valueField: 'ageGroup',
        newField: 'newAgeGroup'
      },
      memberType: {
        customField: 'customMemberTypes',
        valueField: 'memberType',
        newField: 'newMemberType'
      },
      paymentMethod: {
        customField: 'customPaymentMethods',
        valueField: 'paymentMethod',
        newField: 'newPaymentMethod'
      }
    };

    const { customField, valueField, newField } = fieldMap[fieldType];

    setFormData(prev => ({
      ...prev,
      [customField]: [...(prev[customField] || []), newValue.trim()],
      [valueField]: newValue.trim(),
      [newField]: ''
    }));
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
      paymentMethod: '',
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
      leaders: [],
      customAgeGroups: [],
      customMemberTypes: [],
      customPaymentMethods: [],
      newAgeGroup: '',
      newMemberType: '',
      newPaymentMethod: ''
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

      if (isTicketedEvent) {
        if (!formData.ageGroup) {
          newErrors.ageGroup = 'Age group is required for ticketed events';
        }
        if (!formData.memberType) {
          newErrors.memberType = 'Member type is required for ticketed events';
        }
        if (!formData.paymentMethod) {
          newErrors.paymentMethod = 'Payment method is required for ticketed events';
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
          newErrors.price = 'Price is required for ticketed events';
        }
      }

      if (hasPersonSteps && !isGlobalEvent) {
        if (!formData.leader1) {
          newErrors.leader1 = "Leader @1 is required";
        }
        if (!formData.leader12) {
          newErrors.leader12 = "Leader @12 is required";
        }
      }

    } else {
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

      const payload = {
        eventType: formData.eventType,
        eventName: formData.eventName,
        isTicketed: isTicketedEvent,
        location: formData.location,
        eventLeader: formData.eventLeader,
        description: formData.description,
        userEmail: user?.email || '',
        recurring_day: formData.recurringDays,
        status: 'open'  
      };

      if (isTicketedEvent) {
        payload.ageGroup = formData.ageGroup;
        payload.memberType = formData.memberType;
        payload.paymentMethod = formData.paymentMethod;  
        payload.price = formData.price ? parseFloat(formData.price) : 0;
      } else {
        payload.price = null;
      }

      if (hasPersonSteps && !isGlobalEvent) {
        if (formData.leader1) payload.leader1 = formData.leader1;
        if (formData.leader12) payload.leader12 = formData.leader12;
      }

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
            {/* Event Type */}
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

            {/* TICKETED EVENT FIELDS */}
            {isTicketedEvent && (
              <>
                <Typography variant="h6" sx={{ mb: 2, mt: 3, color: isDarkMode ? '#ffffff' : 'inherit' }}>
                  Ticket Information
                </Typography>

                {/* Age Group */}
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth sx={{ ...darkModeStyles.select }} error={!!errors.ageGroup}>
                    <InputLabel>Age Group *</InputLabel>
                    <Select
                      name="ageGroup"
                      value={formData.ageGroup}
                      onChange={handleInputChange}
                      label="Age Group *"
                    >
                      <MenuItem value="Child">Child</MenuItem>
                      <MenuItem value="Adult">Adult</MenuItem>
                      <MenuItem value="Senior">Senior</MenuItem>
                      <MenuItem value="All Ages">All Ages</MenuItem>
                      {formData.customAgeGroups?.map((group, index) => (
                        <MenuItem key={`custom-age-${index}`} value={group}>
                          {group}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.newAgeGroup || ''}
                    onChange={(e) => handleChange('newAgeGroup', e.target.value)}
                    placeholder="Add custom age group (e.g., Early Birds, Students)"
                    sx={{ mt: 1, ...darkModeStyles.textField }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && formData.newAgeGroup?.trim()) {
                        e.preventDefault();
                        handleAddCustomOption('ageGroup', formData.newAgeGroup);
                      }
                    }}
                    InputProps={{
                      endAdornment: formData.newAgeGroup?.trim() && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={() => handleAddCustomOption('ageGroup', formData.newAgeGroup)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {errors.ageGroup && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {errors.ageGroup}
                    </Typography>
                  )}
                </Box>

                {/* Member Type */}
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth sx={{ ...darkModeStyles.select }} error={!!errors.memberType}>
                    <InputLabel>Member Type *</InputLabel>
                    <Select
                      name="memberType"
                      value={formData.memberType}
                      onChange={handleInputChange}
                      label="Member Type *"
                    >
                      <MenuItem value="Member">Member</MenuItem>
                      <MenuItem value="First Time">First Time</MenuItem>
                      <MenuItem value="Guest">Guest</MenuItem>
                      <MenuItem value="VIP">VIP</MenuItem>
                      {formData.customMemberTypes?.map((type, index) => (
                        <MenuItem key={`custom-member-${index}`} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.newMemberType || ''}
                    onChange={(e) => handleChange('newMemberType', e.target.value)}
                    placeholder="Add custom member type (e.g., Early Bird, Student)"
                    sx={{ mt: 1, ...darkModeStyles.textField }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && formData.newMemberType?.trim()) {
                        e.preventDefault();
                        handleAddCustomOption('memberType', formData.newMemberType);
                      }
                    }}
                    InputProps={{
                      endAdornment: formData.newMemberType?.trim() && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={() => handleAddCustomOption('memberType', formData.newMemberType)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {errors.memberType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {errors.memberType}
                    </Typography>
                  )}
                </Box>

                {/* Payment Method */}
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth sx={{ ...darkModeStyles.select }} error={!!errors.paymentMethod}>
                    <InputLabel>Payment Method *</InputLabel>
                    <Select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      label="Payment Method *"
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="EFT">EFT</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                      <MenuItem value="Mobile Money">Mobile Money</MenuItem>
                      <MenuItem value="Free">Free</MenuItem>
                      {formData.customPaymentMethods?.map((method, index) => (
                        <MenuItem key={`custom-payment-${index}`} value={method}>
                          {method}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.newPaymentMethod || ''}
                    onChange={(e) => handleChange('newPaymentMethod', e.target.value)}
                    placeholder="Add custom payment method (e.g., Crypto, Bank Transfer)"
                    sx={{ mt: 1, ...darkModeStyles.textField }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && formData.newPaymentMethod?.trim()) {
                        e.preventDefault();
                        handleAddCustomOption('paymentMethod', formData.newPaymentMethod);
                      }
                    }}
                    InputProps={{
                      endAdornment: formData.newPaymentMethod?.trim() && (
                        <InputAdornment position="end">
                          <IconButton 
                            size="small" 
                            onClick={() => handleAddCustomOption('paymentMethod', formData.newPaymentMethod)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {errors.paymentMethod && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      {errors.paymentMethod}
                    </Typography>
                  )}
                </Box>

                {/* Price */}
                <TextField
                  label="Price (R) *"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  fullWidth
                  sx={{ mb: 3, ...darkModeStyles.textField }}
                  inputProps={{ min: 0, step: "0.01" }}
                  placeholder="0.00"
                  error={!!errors.price}
                  helperText={errors.price}
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

            {/* Recurring Days */}
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

            {/* Event Leader - WITH AUTO-FILL FOR PERSON STEPS */}
            <Autocomplete
              key={`autocomplete-eventLeader`}
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
                if (newValue) {
                  const name = typeof newValue === 'string' ? newValue : newValue?.fullName || '';
                  
                  if (hasPersonSteps && !isGlobalEvent && typeof newValue === 'object') {
                    // Auto-fill leaders for Personal Steps events
                    setFormData(prev => ({
                      ...prev,
                      eventLeader: name,
                      eventName: name,
                      leader1: newValue.leader1 || '',
                      leader12: newValue.leader144 || '', // Using leader144 from database for Leader @12
                    }));
                  } else {
                    handleChange('eventLeader', name);
                    if (isCell && !isGlobalEvent) {
                      setFormData(prev => ({ ...prev, eventName: name }));
                    }
                  }
                } else {
                  handleChange('eventLeader', '');
                }
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
                      : hasPersonSteps && !isGlobalEvent
                        ? `Select leader to auto-fill hierarchy (${peopleData.length} found)`
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
                {/* Leader @1 - READ ONLY, AUTO-FILLED */}
                <TextField
                  label="Leader @1"
                  value={formData.leader1 || ''}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.leader1}
                  helperText={
                    errors.leader1 || "Auto-filled from Event Leader's hierarchy"
                  }
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                  placeholder="Will be auto-filled when Event Leader is selected"
                />

                {/* Leader @12 - READ ONLY, AUTO-FILLED */}
                <TextField
                  label="Leader @12"
                  value={formData.leader12 || ''}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.leader12}
                  helperText={
                    errors.leader12 || "Auto-filled from Event Leader's Leader @144"
                  }
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    )
                  }}
                  placeholder="Will be auto-filled when Event Leader is selected"
                />
              </>
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