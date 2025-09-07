import React, { useState, useEffect } from 'react';
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

const CreateEvents = () => {
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

  const [eventTypes, setEventTypes] = useState([
    ' Sunday Service', 'Friday Service', ' Workshop', 'Encouter', 'Conference', 'J-Activation', 'Destiny Training', 'Social Event', 'Cell'
  ]);

  const [formData, setFormData] = useState({
    eventType: '', eventName: '', isTicketed: false, price: '', date: '', time: '', timePeriod: 'AM',
    recurringDays: [], location: '', eventLeader: '', description: ''
  });


  const [errors, setErrors] = useState({});
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    if (eventId) {
      axios.get(`${BACKEND_URL}/events/${eventId}`)
        .then(res => {
          const data = res.data;
          if (data.date) {
            const dt = new Date(data.date);
            data.date = dt.toISOString().split('T')[0];
            data.time = dt.toTimeString().split(' ')[0].slice(0, 5);
          }
          setFormData(data);
        })
        .catch(err => console.error("Failed to fetch event:", err));
    }
  }, [eventId]);

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
    if (newEventType.trim() && !eventTypes.includes(newEventType.trim())) {
      setEventTypes(prev => [...prev, newEventType.trim()]);
      setFormData(prev => ({ ...prev, eventType: newEventType.trim() }));
      setNewEventType('');
      setShowNewTypeForm(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const isCell = formData.eventType.toLowerCase().includes("cell");

    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.eventName) newErrors.eventName = 'Event name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.eventLeader) newErrors.eventLeader = 'Event leader is required';
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.eventLeader.trim())) newErrors.eventLeader = 'No numbers or double spaces allowed';
    if (!formData.description) newErrors.description = 'Description is required';

    // ✅ Only require recurring days if the event is a Cell group
const requiresRecurringDays = formData.eventType.toLowerCase().includes("cell");
if (requiresRecurringDays && formData.recurringDays.length === 0) {
  newErrors.recurringDays = 'Select at least one recurring day';
}



    // Only validate date/time if not a cell
    if (!isCell) {
      if (!formData.date) newErrors.date = 'Date is required';
      if (!formData.time) newErrors.time = 'Time is required';
    }

    if (formData.isTicketed && !formData.price) newErrors.price = 'Price is required for ticketed events';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      eventType: '', eventName: '', isTicketed: false, price: '', date: '', time: '',
      recurringDays: [], location: '', eventLeader: '', description: ''
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const isCell = formData.eventType.toLowerCase().includes("cell");
      const payload = { ...formData };

      // ✅ Rename recurringDays to recurring_day for backend compatibility
      payload.recurring_day = formData.recurringDays;
      delete payload.recurringDays;

      // ✅ Format date-time if not a cell
      if (!isCell && payload.date && payload.time) {
        payload.date = new Date(`${payload.date}T${payload.time}`).toISOString();
      } else if (isCell) {
        payload.date = null;
      }

      // ✅ Remove time from payload (already merged into date)
      delete payload.time;

      // ✅ Handle ticket price
      if (payload.price) {
        payload.price = parseFloat(payload.price);
      } else {
        delete payload.price;
      }

      // ✅ Submit: PUT if editing, POST if creating
      if (eventId) {
        await axios.put(`${BACKEND_URL}/events/${eventId}`, payload);
      } else {
        await axios.post(`${BACKEND_URL}/events`, payload);
      }

      setSuccessMessage(
        isCell
          ? `The ${formData.eventName} Cell has been created successfully!`
          : eventId
            ? "Event updated successfully!"
            : "Event created successfully!"
      );
      setSuccessAlert(true);
      if (!eventId) resetForm();

      setTimeout(() => navigate("/events"), 1800);
    } catch (err) {
      if (err.response) {
        console.error("Backend error response:", err.response.data);
      } else {
        console.error("Error:", err.message);
      }
      setErrorAlert(true);
    }
    finally {
      setIsSubmitting(false);
    }
  };


  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Dark mode styles
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
          borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
        },
        '&:hover fieldset': {
          borderColor: isDarkMode ? '#777' : 'rgba(0, 0, 0, 0.87)',
        },
        '&.Mui-focused fieldset': {
          borderColor: isDarkMode ? theme.palette.primary.main : theme.palette.primary.main,
        },
      },
      '& .MuiInputLabel-root': {
        color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)',
        '&.Mui-focused': {
          color: isDarkMode ? theme.palette.primary.main : theme.palette.primary.main,
        },
      },
      '& .MuiInputAdornment-root .MuiSvgIcon-root': {
        color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.54)',
      },
    },
    select: {
      '& .MuiOutlinedInput-root': {
        bgcolor: isDarkMode ? '#2d2d2d' : 'white',
        color: isDarkMode ? '#ffffff' : 'inherit',
        '& fieldset': {
          borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
        },
        '&:hover fieldset': {
          borderColor: isDarkMode ? '#777' : 'rgba(0, 0, 0, 0.87)',
        },
        '&.Mui-focused fieldset': {
          borderColor: isDarkMode ? theme.palette.primary.main : theme.palette.primary.main,
        },
      },
      '& .MuiInputLabel-root': {
        color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)',
        '&.Mui-focused': {
          color: isDarkMode ? theme.palette.primary.main : theme.palette.primary.main,
        },
      },
    },
    checkbox: {
      color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)',
      '&.Mui-checked': {
        color: isDarkMode ? theme.palette.primary.main : theme.palette.primary.main,
      },
    },
    formControlLabel: {
      '& .MuiFormControlLabel-label': {
        color: isDarkMode ? '#ffffff' : 'inherit',
      },
    },
    button: {
      outlined: {
        borderColor: isDarkMode ? '#555' : 'primary.main',
        color: isDarkMode ? '#ffffff' : 'primary.main',
        '&:hover': {
          borderColor: isDarkMode ? '#777' : 'primary.dark',
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(25, 118, 210, 0.04)',
        },
      },
    },
    errorText: {
      color: isDarkMode ? '#ff6b6b' : 'red',
    },
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
            {eventId ? "Edit Event" : "Create New Event"}
          </Typography>

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
            <FormControl fullWidth size="small" sx={{ mb: 3, ...darkModeStyles.select }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.eventType}
                onChange={(e) => handleChange('eventType', e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: isDarkMode ? '#2d2d2d' : 'white',
                      '& .MuiMenuItem-root': {
                        color: isDarkMode ? '#ffffff' : 'inherit',
                        '&:hover': {
                          bgcolor: isDarkMode ? '#3d3d3d' : 'rgba(0, 0, 0, 0.04)',
                        },
                      },
                    },
                  },
                }}
              >
                {eventTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
              {errors.eventType && <p style={darkModeStyles.errorText}>{errors.eventType}</p>}
            </FormControl>

            <TextField
              label="Event Name"
              value={formData.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.eventName}
              helperText={errors.eventName}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isTicketed}
                  onChange={(e) => handleChange('isTicketed', e.target.checked)}
                  sx={darkModeStyles.checkbox}
                />
              }
              label="Ticketed Event"
              sx={{ mb: 2, ...darkModeStyles.formControlLabel }}
            />

            {formData.isTicketed &&
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
            }

            {/* Date & Time */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={3} alignItems="center">
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={formData.eventType.toLowerCase().includes("cell")}
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
                  sx={darkModeStyles.select}
                >
                  <MenuItem value="AM">AM</MenuItem>
                  <MenuItem value="PM">PM</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Recurring Days - always show */}
            <Box mb={3}>
              <Typography fontWeight="bold" mb={1} sx={{ color: isDarkMode ? '#ffffff' : 'inherit' }}>
                Recurring Days
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {days.map(day => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={formData.recurringDays.includes(day)}
                        onChange={() => handleDayChange(day)}
                        sx={darkModeStyles.checkbox}
                      />
                    }
                    label={day}
                    sx={darkModeStyles.formControlLabel}
                  />
                ))}
              </Box>
              {errors.recurringDays && <p style={darkModeStyles.errorText}>{errors.recurringDays}</p>}
            </Box>

            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LocationOnIcon /></InputAdornment>
              }}
              error={!!errors.location}
              helperText={errors.location}
            />

            <TextField
              label="Event Leader"
              value={formData.eventLeader}
              onChange={(e) => handleChange('eventLeader', e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
              }}
              error={!!errors.eventLeader}
              helperText={errors.eventLeader}
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              fullWidth
              multiline
              minRows={3}
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><DescriptionIcon /></InputAdornment>
              }}
              error={!!errors.description}
              helperText={errors.description}
            />

            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/events")}
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
                {isSubmitting ? (eventId ? "Updating..." : "Creating...") : (eventId ? "Update Event" : "Create Event")}
              </Button>
            </Box>
          </form>
        </CardContent>

        <Snackbar open={successAlert} autoHideDuration={3000} onClose={() => setSuccessAlert(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="success" variant="filled">{successMessage}</Alert>
        </Snackbar>
        <Snackbar open={errorAlert} autoHideDuration={3000} onClose={() => setErrorAlert(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" variant="filled">Something went wrong. Please try again!</Alert>
        </Snackbar>
      </Card>
    </Box>
  );
};

export default CreateEvents;