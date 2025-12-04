import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Checkbox,
  FormGroup,
  Collapse,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const EditEventModal = ({ isOpen, onClose, event, token, refreshEvents }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editScope, setEditScope] = useState('single'); // 'single' or 'person'
  const [personIdentifier, setPersonIdentifier] = useState('');
  const [originalPersonIdentifier, setOriginalPersonIdentifier] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [changedFields, setChangedFields] = useState([]);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  // Get backend URL from environment variable
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Field mapping between old and new structures
  const fieldMapping = {
    // Person identification fields
    'Leader': ['Leader', 'eventLeader', 'eventLeaderName'],
    'eventLeader': ['eventLeader', 'Leader', 'eventLeaderName'],
    'eventLeaderName': ['eventLeaderName', 'Leader', 'eventLeader'],
    
    // Contact fields
    'Email': ['Email', 'eventLeaderEmail', 'email'],
    'eventLeaderEmail': ['eventLeaderEmail', 'Email', 'email'],
    'email': ['email', 'Email', 'eventLeaderEmail'],
    
    // Location fields
    'Address': ['Address', 'location', 'address'],
    'location': ['location', 'Address', 'address'],
    'address': ['address', 'Address', 'location'],
    
    // Day fields
    'Day': ['Day', 'recurring_day'],
    'recurring_day': ['recurring_day', 'Day'],
    
    // Time fields
    'Time': ['Time', 'time'],
    'time': ['time', 'Time'],
    
    // Event name fields
    'Event Name': ['Event Name', 'eventName'],
    'eventName': ['eventName', 'Event Name'],
    
    // Event type fields
    'Event Type': ['Event Type', 'eventTypeName'],
    'eventTypeName': ['eventTypeName', 'Event Type'],
    
    // Leader assistant fields
    'leader1': ['leader1'],
    'leader12': ['leader12'],
    'Leader at 12': ['Leader at 12'],
  };

  useEffect(() => {
    if (event) {
      console.log("Event data for editing:", event);
      
      // Determine person identifier from the event
      const identifier = 
        event.Leader || 
        event.eventLeader || 
        event.eventLeaderName || 
        '';
      
      setOriginalPersonIdentifier(identifier);
      setPersonIdentifier(identifier);
      
      // Prepare form data - convert null/undefined to empty string for form inputs
      const initialData = {};
      
      // Collect ALL fields from the event (except system fields)
      Object.keys(event).forEach(key => {
        // Skip system/internal fields
        const systemFields = ['_id', '__v', 'id', 'UUID', 'created_at', 'updated_at', 
                              'persistent_attendees', 'attendees', 'total_attendance',
                              'isEventType', 'eventTypeId', 'last_updated'];
        if (!systemFields.includes(key)) {
          initialData[key] = event[key] !== undefined && event[key] !== null ? event[key] : '';
        }
      });
      
      setFormData(initialData);
      
      // Determine which fields can be edited
      const editableFields = Object.keys(initialData).filter(key => 
        !['_id', 'id', '__v', 'UUID', 'created_at', 'updated_at', 
          'persistent_attendees', 'attendees', 'total_attendance',
          'isEventType', 'eventTypeId', 'last_updated'].includes(key)
      );
      
      setAvailableFields(editableFields);
    }
  }, [event]);

  // Track field changes
  useEffect(() => {
    if (event) {
      const changed = [];
      Object.keys(formData).forEach(key => {
        const originalValue = event[key];
        const newValue = formData[key];
        
        // Handle comparison (empty string should remove field - null in backend)
        const isEmptyToRemove = (newValue === '' && originalValue !== undefined && originalValue !== null && originalValue !== '');
        const isValueChanged = newValue !== originalValue;
        
        if (isEmptyToRemove || isValueChanged) {
          changed.push(key);
        }
      });
      setChangedFields(changed);
    }
  }, [formData, event]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRemoveField = (field) => {
    // Set to empty string (will be converted to null for backend)
    setFormData(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const detectPersonFields = () => {
    const personFields = [
      'Leader', 'eventLeader', 'eventLeaderName',
      'Email', 'eventLeaderEmail', 'email',
      'leader1', 'leader12', 'Leader at 12'
    ];
    
    return {
      changedFields,
      hasPersonFieldChange: changedFields.some(field => 
        personFields.includes(field)
      ),
      personFields
    };
  };

  const prepareUpdateData = () => {
    const cleanData = {};
    changedFields.forEach(field => {
      const value = formData[field];
      
      // Convert empty string to null (for field removal in backend)
      if (value === '') {
        cleanData[field] = null;
      } 
      // For other values, send as-is (backend will handle)
      else if (value !== undefined && value !== null) {
        cleanData[field] = value;
      }
      
      // If this field is in mapping, add related fields
      if (fieldMapping[field]) {
        fieldMapping[field].forEach(relatedField => {
          if (relatedField !== field && availableFields.includes(relatedField)) {
            if (value === '') {
              cleanData[relatedField] = null;
            } else {
              cleanData[relatedField] = value;
            }
          }
        });
      }
    });
    
    // Special handling for Day field - backend will handle Event Name
    if (cleanData.Day && (event['Event Name'] || event.eventName)) {
      console.log("Day changed - backend will handle Event Name update");
    }
    
    return cleanData;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Detect what kind of fields are being changed
      const fieldAnalysis = detectPersonFields();
      
      console.log("Field analysis:", fieldAnalysis);
      
      // If no changes, just close
      if (changedFields.length === 0) {
        toast.info("No changes made");
        onClose(false);
        return;
      }
      
      // Prepare clean data for backend
      const updateData = prepareUpdateData();
      
      console.log("Data for backend:", updateData);
      
      let endpoint, method, body;
      
      if (editScope === 'person' && originalPersonIdentifier && fieldAnalysis.hasPersonFieldChange) {
        // Update ALL person's cells
        endpoint = `/events/update-person-cells/${encodeURIComponent(originalPersonIdentifier)}`;
        method = 'PUT';
        body = JSON.stringify(updateData);
        
        // Ask for confirmation
        const confirmed = window.confirm(
          `WARNING: This will update ALL events for "${originalPersonIdentifier}"\n\n` +
          `Fields to update: ${changedFields.join(', ')}\n\n` +
          `Are you sure you want to continue?`
        );
        
        if (!confirmed) {
          setLoading(false);
          return;
        }
      } else {
        // Update only this single event
        const identifier = event._id || event.id || event.UUID;
        endpoint = `/events/cells/${identifier}`;
        method = 'PUT';
        body = JSON.stringify(updateData);
      }
      
      // Call backend API using environment variable
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Backend response:", result);
      
      // Show success message
      if (editScope === 'person') {
        toast.success(`Updated ${result.modified_count || result.updated_count || 0} events successfully`);
      } else {
        toast.success('Event updated successfully');
      }
      
      // Refresh events and close
      if (refreshEvents) {
        refreshEvents();
      }
      onClose(true);
      
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(`Failed to save: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field] || '';
    const isChanged = changedFields.includes(field);
    const isPersonField = fieldMapping[field] && fieldMapping[field].length > 1;
    
    // Get field display name
    const displayName = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    // Determine input type based on field name and value type
    const fieldType = typeof value === 'object' && value !== null ? 'object' : typeof value;
    const fieldLower = field.toLowerCase();
    
    // Date fields
    if ((fieldLower.includes('date') && !fieldLower.includes('datecaptured') && !fieldLower.includes('datecreated')) || field === 'date') {
      return (
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            margin="normal"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {displayName}
                {isPersonField && <PersonIcon fontSize="small" color="action" />}
                {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
              </Box>
            }
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange(field, e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={isChanged}
            helperText={isChanged ? "Changed" : ""}
          />
          {value && (
            <IconButton
              size="small"
              onClick={() => handleRemoveField(field)}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
    
    // Time fields
    if (fieldLower.includes('time')) {
      return (
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            margin="normal"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {displayName}
                {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
              </Box>
            }
            type="time"
            value={value || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={isChanged}
            helperText={isChanged ? "Changed" : ""}
          />
          {value && (
            <IconButton
              size="small"
              onClick={() => handleRemoveField(field)}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
    
    // Email fields
    if (fieldLower.includes('email')) {
      return (
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            margin="normal"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {displayName}
                {isPersonField && <PersonIcon fontSize="small" color="action" />}
                {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
              </Box>
            }
            type="email"
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            error={isChanged}
            helperText={isChanged ? "Changed" : ""}
          />
          {value && (
            <IconButton
              size="small"
              onClick={() => handleRemoveField(field)}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
    
    // Boolean fields (switches)
    if (fieldType === 'boolean') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleChange(field, e.target.checked)}
                color={isChanged ? "warning" : "primary"}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{displayName}</Typography>
                {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
              </Box>
            }
          />
          <IconButton size="small" onClick={() => handleChange(field, false)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }
    
    // Array fields (like recurring_day)
    if (Array.isArray(value)) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {displayName}
            {isPersonField && <PersonIcon fontSize="small" color="action" />}
            {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
          </Typography>
          <FormGroup row>
            {days.map(day => (
              <FormControlLabel
                key={day}
                control={
                  <Checkbox
                    checked={value.includes(day)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...value, day]
                        : value.filter(d => d !== day);
                      handleChange(field, newValue);
                    }}
                    size="small"
                  />
                }
                label={day.substring(0, 3)}
              />
            ))}
          </FormGroup>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button size="small" onClick={() => handleChange(field, [])}>
              Clear All
            </Button>
          </Box>
        </Box>
      );
    }
    
    // Day selection fields (single day)
    if (fieldLower.includes('day') && !fieldLower.includes('recurring') && typeof value === 'string') {
      return (
        <Box sx={{ position: 'relative' }}>
          <FormControl fullWidth margin="normal" error={isChanged}>
            <InputLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {displayName}
                {isPersonField && <PersonIcon fontSize="small" color="action" />}
              </Box>
            </InputLabel>
            <Select
              value={value || ''}
              label={displayName}
              onChange={(e) => handleChange(field, e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                .map(day => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
            </Select>
            {isChanged && <Typography variant="caption" color="warning.main">Changed</Typography>}
          </FormControl>
          {value && (
            <IconButton
              size="small"
              onClick={() => handleChange(field, '')}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
    
    // Status fields
    if (fieldLower === 'status') {
      const statusOptions = ['open', 'closed', 'complete', 'incomplete', 'did_not_meet', 'cancelled'];
      return (
        <Box sx={{ position: 'relative' }}>
          <FormControl fullWidth margin="normal" error={isChanged}>
            <InputLabel>Status</InputLabel>
            <Select
              value={value || ''}
              label="Status"
              onChange={(e) => handleChange(field, e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {statusOptions.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
            {isChanged && <Typography variant="caption" color="warning.main">Changed</Typography>}
          </FormControl>
          {value && (
            <IconButton
              size="small"
              onClick={() => handleChange(field, '')}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
    
    // Description/long text fields
    if (fieldLower.includes('description') || (typeof value === 'string' && value.length > 50)) {
      return (
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            margin="normal"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {displayName}
                {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
              </Box>
            }
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            multiline
            rows={3}
            error={isChanged}
            helperText={isChanged ? "Changed" : ""}
          />
          {value && (
            <IconButton
              size="small"
              onClick={() => handleRemoveField(field)}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      );
    }
    
    // Default text field
    return (
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          margin="normal"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {displayName}
              {isPersonField && <PersonIcon fontSize="small" color="action" />}
              {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
            </Box>
          }
          value={value}
          onChange={(e) => handleChange(field, e.target.value)}
          error={isChanged}
          helperText={isChanged ? "Changed" : ""}
        />
        {value && (
          <IconButton
            size="small"
            onClick={() => handleRemoveField(field)}
            sx={{ position: 'absolute', right: 8, top: 20 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    );
  };

  if (!event) return null;
  
  const fieldAnalysis = detectPersonFields();
  
  // Categorize fields
  const personFields = availableFields.filter(f => 
    ['Leader', 'eventLeader', 'eventLeaderName', 'Email', 'eventLeaderEmail', 'email', 
     'leader1', 'leader12', 'Leader at 12'].includes(f)
  );
  
  const eventFields = availableFields.filter(f => 
    ['eventName', 'Event Name', 'Event Type', 'eventTypeName', 'description', 
     'status', 'isTicketed', 'isGlobal', 'hasPersonSteps'].includes(f)
  );
  
  const locationFields = availableFields.filter(f => 
    ['Address', 'location', 'address'].includes(f)
  );
  
  const timeFields = availableFields.filter(f => 
    ['date', 'Date Of Event', 'time', 'Time', 'Day', 'recurring_day'].includes(f)
  );
  
  const otherFields = availableFields.filter(f => 
    ![...personFields, ...eventFields, ...locationFields, ...timeFields].includes(f)
  );

  // Get event name for display
  const eventName = formData.eventName || formData['Event Name'] || 'Unnamed Event';

  return (
    <Dialog 
      open={isOpen} 
      onClose={() => onClose(false)}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="div">
              Edit: {eventName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Person: <strong>{originalPersonIdentifier || 'Unknown'}</strong>
              {originalPersonIdentifier !== personIdentifier && (
                <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                  (Will update: {personIdentifier})
                </Typography>
              )}
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => setAdvancedMode(!advancedMode)}
            startIcon={advancedMode ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {advancedMode ? 'Simple' : 'Advanced'}
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {/* Update Scope Selection */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Update Scope:
            </Typography>
            
            {fieldAnalysis.hasPersonFieldChange && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <InfoIcon sx={{ mr: 1 }} />
                You are editing person-identifying fields. These changes can affect all of this person's events.
              </Alert>
            )}
            
            <FormControl fullWidth>
              <Select
                value={editScope}
                onChange={(e) => setEditScope(e.target.value)}
                size="small"
              >
                <MenuItem value="single">
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Single Event Only
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Update only this specific event
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="person" disabled={!fieldAnalysis.hasPersonFieldChange || !originalPersonIdentifier}>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      All Person's Events
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Update all {originalPersonIdentifier}'s events
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            
            {editScope === 'person' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <WarningIcon sx={{ mr: 1 }} />
                <strong>Warning:</strong> This will update <strong>ALL</strong> events for <strong>{originalPersonIdentifier}</strong>.
                This action cannot be undone.
              </Alert>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Changed Fields Summary */}
          {changedFields.length > 0 && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Fields to update ({changedFields.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {changedFields.map(field => {
                  const isPersonField = fieldAnalysis.personFields.includes(field);
                  const displayField = field
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/_/g, ' ')
                    .replace(/^./, str => str.toUpperCase());
                  
                  const originalValue = event[field];
                  const newValue = formData[field];
                  
                  return (
                    <Tooltip 
                      key={field} 
                      title={
                        <Box>
                          <Typography variant="caption">
                            <strong>From:</strong> {originalValue !== undefined && originalValue !== null ? JSON.stringify(originalValue) : '(empty)'}
                          </Typography>
                          <br />
                          <Typography variant="caption">
                            <strong>To:</strong> {newValue !== '' ? JSON.stringify(newValue) : '(remove field)'}
                          </Typography>
                        </Box>
                      }
                    >
                      <Chip
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {displayField}
                            {isPersonField ? <PersonIcon fontSize="small" /> : <EventIcon fontSize="small" />}
                          </Box>
                        }
                        size="small"
                        color={isPersonField ? "warning" : "primary"}
                        variant="outlined"
                        onDelete={() => {
                          // Revert this field to original value
                          handleChange(field, event[field] !== undefined ? event[field] : '');
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
              
              {fieldAnalysis.hasPersonFieldChange && editScope === 'single' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You are changing person fields but only updating this event.
                  Consider using "All Person's Events" to update all {originalPersonIdentifier}'s cells.
                </Alert>
              )}
            </Box>
          )}
          
          {/* Field Categories */}
          {advancedMode ? (
            // Advanced Mode: Show all fields by category
            <Box>
              {/* Person Information */}
              {personFields.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon /> Person Information
                  </Typography>
                  <Grid container spacing={2}>
                    {personFields.map(field => (
                      <Grid item xs={12} md={6} key={field}>
                        {renderField(field)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {/* Event Information */}
              {eventFields.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon /> Event Information
                  </Typography>
                  <Grid container spacing={2}>
                    {eventFields.map(field => (
                      <Grid item xs={12} md={6} key={field}>
                        {renderField(field)}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {/* Location & Time */}
              <Grid container spacing={3}>
                {locationFields.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Location
                    </Typography>
                    {locationFields.map(field => renderField(field))}
                  </Grid>
                )}
                
                {timeFields.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Time & Schedule
                    </Typography>
                    {timeFields.map(field => renderField(field))}
                  </Grid>
                )}
              </Grid>
              
              {/* Other Fields (collapsible) */}
              {otherFields.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Button
                    fullWidth
                    onClick={() => setShowAllFields(!showAllFields)}
                    startIcon={showAllFields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    size="small"
                  >
                    {showAllFields ? 'Hide' : 'Show'} Other Fields ({otherFields.length})
                  </Button>
                  
                  <Collapse in={showAllFields}>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {otherFields.map(field => (
                        <Grid item xs={12} md={6} key={field}>
                          {renderField(field)}
                        </Grid>
                      ))}
                    </Grid>
                  </Collapse>
                </Box>
              )}
            </Box>
          ) : (
            // Simple Mode: Show only key fields
            <Grid container spacing={2}>
              {/* Show important fields first */}
              {['eventName', 'Event Name', 'eventLeader', 'Leader', 'eventLeaderEmail', 'Email', 
                'date', 'Date Of Event', 'time', 'Time', 'location', 'Address', 'status', 'Status',
                'recurring_day', 'Day', 'description', 'leader1', 'leader12', 'Leader at 12']
                .filter(field => availableFields.includes(field))
                .map(field => (
                  <Grid item xs={12} md={6} key={field}>
                    {renderField(field)}
                  </Grid>
                ))}
            </Grid>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Box>
            {changedFields.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {changedFields.length} field(s) changed • 
                {fieldAnalysis.hasPersonFieldChange ? ' Includes person fields' : ' Event fields only'}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={() => onClose(false)} 
              disabled={loading}
              color="inherit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={loading || changedFields.length === 0}
              color={editScope === 'person' ? 'warning' : 'primary'}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Saving...' : 
               editScope === 'person' ? `Update All Events` : 
               'Update Event'}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditEventModal;

