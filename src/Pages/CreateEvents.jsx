import React, { useState } from 'react';
import {
  Button,
  TextField,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  FormControlLabel,
  Chip,
  Box,
  InputAdornment,
  Snackbar,
  Alert,
  Typography
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateEvents = () => {
  const navigate = useNavigate();

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

  const isFormValid = () => {
    if (!formData.eventType || !formData.eventName || !formData.location) return false;
    if (!formData.eventLeader || !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.eventLeader.trim())) return false;
    if (!formData.description) return false;
    if (formData.recurringDays.length === 0 && (!formData.date || !formData.time)) return false;
    if (formData.isTicketed && !formData.price) return false;
    return true;
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

      // Convert date & time to ISO if not recurring
      if (payload.recurringDays.length === 0 && payload.date && payload.time) {
        payload.date = new Date(`${payload.date}T${payload.time}`).toISOString();
      }
      delete payload.time;

      // Convert price to number if exists
      if (payload.price) payload.price = parseFloat(payload.price);
      else delete payload.price;

      // ✅ Add default status for all new events
      payload.status = "open";

      await axios.post("http://localhost:8000/event", payload);

      setSuccessAlert(true);
      resetForm();
      setTimeout(() => navigate("/events"), 1500);
    } catch (err) {
      if (err.response) {
  console.error("Backend error:", err.response.data);
  console.error("Status code:", err.response.status);
} else if (err.request) {
  console.error("No response received:", err.request);
} else {
  console.error("Error setting up request:", err.message);
}

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
            Create New Event
          </Typography>

          {/* New Event Type */}
          <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }} mb={2}>
            <Button
              variant="outlined"
              onClick={() => setShowNewTypeForm(!showNewTypeForm)}
              startIcon={<AddIcon />}
              sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            >
              New Type
            </Button>
            {showNewTypeForm && (
              <>
                <TextField
                  placeholder="Enter new event type"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  fullWidth size="small"
                />
                <Button variant="contained" onClick={addNewEventType} sx={{ bgcolor: 'primary.main' }}>
                  Add
                </Button>
              </>
            )}
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Event Type */}
            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.eventType}
                onChange={(e) => handleChange('eventType', e.target.value)}
              >
                {eventTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
              {errors.eventType && <p style={{ color: 'red', fontSize: 12 }}>{errors.eventType}</p>}
            </FormControl>

            {/* Event Name */}
            <TextField
              label="Event Name"
              value={formData.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              fullWidth size="small"
              sx={{ mb: 3 }}
              error={!!errors.eventName}
              helperText={errors.eventName}
            />

            {/* Ticketed */}
            <FormControlLabel
              control={<Checkbox checked={formData.isTicketed} onChange={(e) => handleChange('isTicketed', e.target.checked)} />}
              label="Ticketed Event"
              sx={{ mb: 2 }}
            />

            {formData.isTicketed && (
              <TextField
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                fullWidth size="small"
                error={!!errors.price}
                helperText={errors.price}
                sx={{ mb: 3 }}
                InputProps={{ startAdornment: <InputAdornment position="start">R</InputAdornment> }}
              />
            )}

            {/* Date & Time */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} mb={3}>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date}
              />
              <TextField
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                fullWidth size="small"
                InputLabelProps={{ shrink: true }}
                error={!!errors.time}
                helperText={errors.time}
              />
            </Box>

            {/* Recurring Days */}
            <Box mb={3}>
              <Typography variant="body2" mb={1}>Recurring Days</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {days.map((day) => (
                  <Chip
                    key={day}
                    label={day}
                    color={formData.recurringDays.includes(day) ? 'primary' : 'default'}
                    onClick={() => handleDayChange(day)}
                    clickable
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {/* Location */}
            <TextField
              label="Location"
              name="location"   
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              fullWidth size="small"
              error={!!errors.location}
              helperText={errors.location}
              sx={{ mb: 3 }}
              InputProps={{ startAdornment: <LocationOnIcon fontSize="small" /> }}
            />

            {/* Event Leader */}
            <TextField
              label="Event Leader"
              value={formData.eventLeader}
              onChange={(e) => handleChange('eventLeader', e.target.value)}
              fullWidth size="small"
              error={!!errors.eventLeader}
              helperText={errors.eventLeader}
              sx={{ mb: 3 }}
              InputProps={{ startAdornment: <PersonIcon fontSize="small" /> }}
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              fullWidth multiline minRows={3} size="small"
              error={!!errors.description}
              helperText={errors.description}
              sx={{ mb: 3 }}
              InputProps={{ startAdornment: <DescriptionIcon fontSize="small" /> }}
            />

            {/* Submit Buttons */}
            <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
              <Button variant="outlined" fullWidth disabled={isSubmitting} onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                type="submit" 
                fullWidth 
                disabled={isSubmitting || !isFormValid()}
              >           
                {isSubmitting ? "Creating..." : "Create Event"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* ✅ Snackbar Alerts */}
      <Snackbar 
        open={successAlert} 
        autoHideDuration={3000} 
        onClose={() => setSuccessAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSuccessAlert(false)} severity="success" variant="filled">
          Event Created Successfully!
        </Alert>
      </Snackbar>

      <Snackbar 
        open={errorAlert} 
        autoHideDuration={3000} 
        onClose={() => setErrorAlert(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setErrorAlert(false)} severity="error" variant="filled">
          Failed to create event
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateEvents;
