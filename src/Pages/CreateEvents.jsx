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
  InputAdornment
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateEvents = () => {
  const navigate = useNavigate();
  const toast = ({ title, description }) => alert(`${title}\n${description}`);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newEventType, setNewEventType] = useState('');
  const [eventTypes, setEventTypes] = useState([
    'Workshop', 'Seminar', 'Conference', 'Meetup', 'Training', 'Social Event'
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.eventName) newErrors.eventName = 'Event name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.eventLeader) newErrors.eventLeader = 'Event leader is required';
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
      // Prepare payload for backend
      const payload = { ...formData };

      // Combine date + time into ISO string if not recurring
      if (payload.recurringDays.length === 0 && payload.date && payload.time) {
        payload.date = new Date(`${payload.date}T${payload.time}`).toISOString();
      }

      // Remove time field (backend does not need it)
      delete payload.time;

      // Convert price to number or remove if empty
      if (payload.price) payload.price = parseFloat(payload.price);
      else delete payload.price;

      // Send POST request
      await axios.post("http://localhost:8000/event", payload);

      toast({ title: "Event Created Successfully!", description: `${formData.eventName} has been scheduled.` });
      resetForm();
      navigate("/events");
    } catch (err) {
      console.error(err.response || err);
      toast({ title: "Error", description: "Failed to create event" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pt: 8,
        pb: 8,
        backgroundColor: '#f8fafc',
        px: 4
      }}
    >
      <Card
        sx={{
          width: { xs: '100%', sm: '80%', md: '550px' },
          minHeight: { xs: 'auto', sm: '90vh' },
          p: 5,
          borderRadius: '16px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <CardContent className="space-y-4">
          {/* New Event Type */}
          <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
            <Button
              variant="outlined"
              onClick={() => setShowNewTypeForm(!showNewTypeForm)}
              startIcon={<AddIcon />}
              sx={{ minWidth: 80, height: 36 }}
            >
              New
            </Button>
            {showNewTypeForm && (
              <>
                <TextField
                  placeholder="Enter new event type"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button variant="contained" onClick={addNewEventType} sx={{ minWidth: 60, height: 36 }}>
                  Add
                </Button>
              </>
            )}
          </Box>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Event Type */}
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.eventType}
                onChange={(e) => handleChange('eventType', e.target.value)}
                label="Event Type"
              >
                {eventTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
              {errors.eventType && <p className="text-sm text-red-500">{errors.eventType}</p>}
            </FormControl>

            {/* Event Name */}
            <TextField
              label="Event Name"
              value={formData.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              fullWidth size="small"
              error={!!errors.eventName}
              helperText={errors.eventName}
            />

            {/* Ticketed */}
            <FormControlLabel
              control={<Checkbox checked={formData.isTicketed} onChange={(e) => handleChange('isTicketed', e.target.checked)} />}
              label="Ticketed Event"
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
                InputProps={{ startAdornment: <InputAdornment position="start">R</InputAdornment> }}
              />
            )}

            {/* Date & Time */}
            <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
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
            <Box>
              <p className="font-medium mb-1">Recurring Days</p>
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
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              fullWidth size="small"
              error={!!errors.location}
              helperText={errors.location}
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
              InputProps={{ startAdornment: <PersonIcon fontSize="small" /> }}
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              fullWidth multiline minRows={2} size="small"
              error={!!errors.description}
              helperText={errors.description}
              InputProps={{ startAdornment: <DescriptionIcon fontSize="small" /> }}
            />

            {/* Submit Buttons */}
            <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }}>
              <Button variant="outlined" fullWidth disabled={isSubmitting} onClick={resetForm} size="small">Cancel</Button>
              <Button variant="contained" type="submit" fullWidth disabled={isSubmitting} size="small">
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateEvents;
