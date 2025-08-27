import React, { useState, useEffect } from 'react';
import {
  Button, TextField, Checkbox, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, FormControlLabel, Chip, Box, InputAdornment, Snackbar, Alert, Typography
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const CreateEvents = () => {
  const navigate = useNavigate();
  const { id: eventId } = useParams(); // grab id if editing

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newEventType, setNewEventType] = useState('');
  const [successAlert, setSuccessAlert] = useState(false);
  const [errorAlert, setErrorAlert] = useState(false);

  const [eventTypes, setEventTypes] = useState([
    'Workshop', 'Encouter', 'Conference', 'J-Activation', 'Training', 'Social Event'
  ]);

  const [formData, setFormData] = useState({
    eventType: '', eventName: '', isTicketed: false, price: '', date: '', time: '',
    recurringDays: [], location: '', eventLeader: '', description: ''
  });

  const [errors, setErrors] = useState({});

  // --- Fetch existing event if editing ---
  useEffect(() => {
    if (eventId) {
      axios.get(`http://localhost:8000/events/${eventId}`)
        .then(res => {
          const data = res.data;
          // Split date and time if ISO string exists
          if (data.date) {
            const dt = new Date(data.date);
            data.date = dt.toISOString().split('T')[0];
            data.time = dt.toTimeString().split(' ')[0].slice(0,5);
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
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.eventName) newErrors.eventName = 'Event name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.eventLeader) newErrors.eventLeader = 'Event leader is required';
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.eventLeader.trim())) newErrors.eventLeader = 'No numbers or double spaces allowed';
    if (!formData.description) newErrors.description = 'Description is required';
    if (formData.recurringDays.length === 0) {
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
      const payload = { ...formData };

      if (payload.recurringDays.length === 0 && payload.date && payload.time) {
        payload.date = new Date(`${payload.date}T${payload.time}`).toISOString();
      }
      delete payload.time;

      if (payload.price) payload.price = parseFloat(payload.price);
      else delete payload.price;

      if (eventId) {
        // Update existing event
        await axios.put(`http://localhost:8000/events/${eventId}`, payload);
      } else {
        // Create new event
        await axios.post("http://localhost:8000/event", payload);
      }

      setSuccessAlert(true);
      if (!eventId) resetForm();

      setTimeout(() => navigate("/events"), 1500);
    } catch (err) {
      console.error(err.response || err);
      setErrorAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5', px: 2 }}>
      <Card sx={{ width: { xs: '100%', sm: '85%', md: '700px' }, p: 5, borderRadius: '20px', bgcolor: 'white', color: 'black', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4} color="primary">
            {eventId ? "Edit Event" : "Create New Event"}
          </Typography>

          {/* New Event Type */}
          <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }} mb={2}>
            <Button variant="outlined" onClick={() => setShowNewTypeForm(!showNewTypeForm)} startIcon={<AddIcon />} sx={{ borderColor: 'primary.main', color: 'primary.main' }}>
              New Type
            </Button>
            {showNewTypeForm && (
              <>
                <TextField placeholder="Enter new event type" value={newEventType} onChange={(e) => setNewEventType(e.target.value)} fullWidth size="small" />
                <Button variant="contained" onClick={addNewEventType} sx={{ bgcolor: 'primary.main' }}>Add</Button>
              </>
            )}
          </Box>

          <form onSubmit={handleSubmit}>
            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel>Event Type</InputLabel>
              <Select value={formData.eventType} onChange={(e) => handleChange('eventType', e.target.value)}>
                {eventTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
              {errors.eventType && <p style={{ color: 'red', fontSize: 12 }}>{errors.eventType}</p>}
            </FormControl>

            <TextField label="Event Name" value={formData.eventName} onChange={(e) => handleChange('eventName', e.target.value)} fullWidth size="small" sx={{ mb: 3 }} error={!!errors.eventName} helperText={errors.eventName} />
            <FormControlLabel control={<Checkbox checked={formData.isTicketed} onChange={(e) => handleChange('isTicketed', e.target.checked)} />} label="Ticketed Event" sx={{ mb: 2 }} />
            {formData.isTicketed && <TextField label="Price" type="number" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} fullWidth size="small" error={!!errors.price} helperText={errors.price} sx={{ mb: 3 }} InputProps={{ startAdornment: <InputAdornment position="start">R</InputAdornment> }} />}

            {/* Date & Time */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={3}>
              <TextField label="Date" type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date} />
              <TextField label="Time" type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} error={!!errors.time} helperText={errors.time} />
            </Box>

            {/* Recurring Days */}
            <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
              {days.map(day => (
                <Chip key={day} label={day} clickable color={formData.recurringDays.includes(day) ? "primary" : "default"} onClick={() => handleDayChange(day)} />
              ))}
            </Box>

            <TextField label="Location" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} fullWidth size="small" sx={{ mb: 3 }} InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon /></InputAdornment> }} error={!!errors.location} helperText={errors.location} />
            <TextField label="Event Leader" value={formData.eventLeader} onChange={(e) => handleChange('eventLeader', e.target.value)} fullWidth size="small" sx={{ mb: 3 }} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }} error={!!errors.eventLeader} helperText={errors.eventLeader} />
            <TextField label="Description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} fullWidth multiline minRows={3} size="small" sx={{ mb: 3 }} InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionIcon /></InputAdornment> }} error={!!errors.description} helperText={errors.description} />

            <Box display="flex" gap={2}>
              <Button variant="outlined" fullWidth onClick={() => navigate("/events")}>Cancel</Button>
              <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>{isSubmitting ? (eventId ? "Updating..." : "Creating...") : (eventId ? "Update Event" : "Create Event")}</Button>
            </Box>
          </form>
        </CardContent>

        {/* Alerts */}
        <Snackbar open={successAlert} autoHideDuration={3000} onClose={() => setSuccessAlert(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="success" variant="filled">{eventId ? "Event updated successfully!" : "Event created successfully!"}</Alert>
        </Snackbar>
        <Snackbar open={errorAlert} autoHideDuration={3000} onClose={() => setErrorAlert(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity="error" variant="filled">Something went wrong. Please try again!</Alert>
        </Snackbar>
      </Card>
    </Box>
  );
};

export default CreateEvents;
