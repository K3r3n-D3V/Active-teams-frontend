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
  Person as PersonIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const EditEventModal = ({ isOpen, onClose, event, token, refreshEvents, userRole }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editScope, setEditScope] = useState('single'); 
  const [, setPersonIdentifier] = useState('');
  const [originalPersonIdentifier, setOriginalPersonIdentifier] = useState('');
  const [availableFields, setAvailableFields] = useState([]);
  const [changedFields, setChangedFields] = useState([]);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const fieldMapping = {
  'Leader': ['Leader', 'eventLeader', 'eventLeaderName'],
  'eventLeader': ['eventLeader', 'Leader', 'eventLeaderName'],
  'eventLeaderName': ['eventLeaderName', 'Leader', 'eventLeader'],
  'leader1': ['leader1'],
  'leader12': ['leader12'],
  'Leader at 12': ['Leader at 12'],
  
  // Email fields
  'Email': ['Email', 'eventLeaderEmail', 'email'],
  'eventLeaderEmail': ['eventLeaderEmail', 'Email', 'email'],
  'email': ['email', 'Email', 'eventLeaderEmail'],
  
  // Location fields
  'Address': ['Address', 'location', 'address'],
  'location': ['location', 'Address', 'address'],
  'address': ['address', 'Address', 'location'],
  
  // Day/time fields
  'Day': ['Day', 'recurring_day'],
  'recurring_day': ['recurring_day', 'Day'],
  'Time': ['Time', 'time'],
  'time': ['time', 'Time'],
  
  'Event Name': ['Event Name', 'eventName'],
  'eventName': ['eventName', 'Event Name'],
  
  'Event Type': ['Event Type', 'eventTypeName'],
  'eventTypeName': ['eventTypeName', 'Event Type'],
  
  'status': ['status', 'Status'],
  'Status': ['Status', 'status'],
  
  'description': ['description'],
  'isTicketed': ['isTicketed'],
  'isGlobal': ['isGlobal'],
  'hasPersonSteps': ['hasPersonSteps'],
  'Reoccurring': ['Reoccurring', 'recurring'],
  'recurring': ['recurring', 'Reoccurring'],
};

  // Global disabled fields for all users (week identifier, original event id, event type, leaders fields)
  const globalDisabledFields = [
    'week', 'weekIdentifier', 'originalEventId', 'Event Type', 'eventTypeName',
    'Leader', 'eventLeader', 'eventLeaderName', 'leader1', 'leader12', 'Leader at 12'
  ];

  // Additional disables for leader144
  const getAdditionalDisabledFields = () => {
    if (userRole?.toLowerCase() === 'leader144') {
      return ['Leader', 'eventLeader', 'leader1', 'week', 'weekIdentifier']; // already in global, but ensure
    }
    return [];
  };

  const allDisabledFields = [...globalDisabledFields, ...getAdditionalDisabledFields()];

  const normalizedUserRole = userRole?.toLowerCase() || '';
  const canEdit = normalizedUserRole === 'admin' || normalizedUserRole === 'leader1';

  // Debug log
  console.log('User Role:', userRole, 'Normalized:', normalizedUserRole, 'Can Edit:', canEdit);

  const cleanEventId = (event) => {
    if (!event) return null;
    
    const cleanEvent = { ...event };
    
    if (cleanEvent._id && typeof cleanEvent._id === 'string' && cleanEvent._id.includes('_')) {
      cleanEvent._id = cleanEvent._id.split('_')[0];
    }
    
    if (cleanEvent.id && typeof cleanEvent.id === 'string' && cleanEvent.id.includes('_')) {
      cleanEvent.id = cleanEvent.id.split('_')[0];
    }
    
    return cleanEvent;
  };

  useEffect(() => {
    if (event) {
      const cleanEvent = cleanEventId(event);
      
      console.log("Event data for editing (cleaned):", cleanEvent);
      
      const identifier = 
        cleanEvent.Leader || 
        cleanEvent.eventLeader || 
        cleanEvent.eventLeaderName || 
        '';
      
      setOriginalPersonIdentifier(identifier);
      setPersonIdentifier(identifier);
      
      const initialData = {};
      Object.keys(cleanEvent).forEach(key => {
        const systemFields = ['_id', '__v', 'id', 'UUID', 'created_at', 'updated_at', 
                              'persistent_attendees', 'attendees', 'total_attendance',
                              'isEventType', 'eventTypeId', 'last_updated'];
        if (!systemFields.includes(key)) {
          initialData[key] = cleanEvent[key] !== undefined && cleanEvent[key] !== null ? cleanEvent[key] : '';
        }
      });
      
      setFormData(initialData);
      
      const editableFields = Object.keys(initialData).filter(key => 
        !['_id', 'id', '__v', 'UUID', 'created_at', 'updated_at', 
          'persistent_attendees', 'attendees', 'total_attendance',
          'isEventType', 'eventTypeId', 'last_updated'].includes(key)
      );
      
      setAvailableFields(editableFields);
    }
  }, [event]);

  useEffect(() => {
    if (event) {
      const changed = [];
      Object.keys(formData).forEach(key => {
        const originalValue = event[key];
        const newValue = formData[key];
        
        const isEmptyToRemove = (newValue === '' && originalValue !== undefined && originalValue !== null && originalValue !== '');
        const isValueChanged = newValue !== originalValue;
        
        if ((isEmptyToRemove || isValueChanged) && canEdit && !allDisabledFields.includes(key)) {
          changed.push(key);
        }
      });
      setChangedFields(changed);
    }
  }, [formData, event, canEdit, allDisabledFields]);

  const handleChange = (field, value) => {
    if (!canEdit || allDisabledFields.includes(field)) return; // Prevent changes if not editable or field disabled
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const prepareUpdateData = () => {
    const cleanData = {};
    changedFields.forEach(field => {
      const value = formData[field];
      
      if (value === '') {
        cleanData[field] = null;
      } 
      else if (value !== undefined && value !== null) {
        cleanData[field] = value;
      }
      
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
    
    return cleanData;
  };

  const handleSubmit = async () => {
    if (!canEdit) {
      toast.error("You do not have permission to edit events.");
      return;
    }
    try {
      setLoading(true);
      
      if (changedFields.length === 0) {
        toast.info("No changes made");
        onClose(false);
        return;
      }
      
      const updateData = prepareUpdateData();
      
      console.log("Data for backend:", updateData);
      
      let endpoint, method, body;
      
      if (editScope === 'person' && originalPersonIdentifier) {
        endpoint = `/events/update-person-cells/${encodeURIComponent(originalPersonIdentifier)}`;
        method = 'PUT';
        body = JSON.stringify(updateData);
        
        const confirmed = window.confirm(
          `Update all events for "${originalPersonIdentifier}"?\n\n` +
          `Fields: ${changedFields.join(', ')}`
        );
        
        if (!confirmed) {
          setLoading(false);
          return;
        }
      } else {
        let identifier = event._id || event.id || event.UUID;
        
        if (identifier && typeof identifier === 'string' && identifier.includes('_')) {
          const parts = identifier.split('_');
          identifier = parts[0];
          console.log(`Extracted ObjectId: ${identifier} from compound ID`);
        }
        
        endpoint = `/events/cells/${identifier}`;
        method = 'PUT';
        body = JSON.stringify(updateData);
        
        console.log(`Calling single cell endpoint: ${endpoint}`);
      }
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error response:", errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }
        
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Backend response:", result);
      
      if (editScope === 'person') {
        toast.success(`Updated ${result.modified_count || result.updated_count || 0} events successfully`);
      } else {
        toast.success('Event updated successfully');
      }
      
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
    const isFieldDisabled = allDisabledFields.includes(field) || !canEdit;
    
    const displayName = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    const fieldType = typeof value === 'object' && value !== null ? 'object' : typeof value;
    const fieldLower = field.toLowerCase();
    
    // Comment out delete icons for all fields as per previous request
    // {value && (
    //   <IconButton
    //     size="small"
    //     onClick={() => handleChange(field, '')}
    //     sx={{ position: 'absolute', right: 8, top: 20 }}
    //   >
    //     <DeleteIcon fontSize="small" />
    //   </IconButton>
    // )}
    
    if ((fieldLower.includes('date') && !fieldLower.includes('datecaptured') && !fieldLower.includes('datecreated')) || field === 'date') {
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
            type="datetime-local"
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange(field, e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={isChanged}
            helperText={isChanged ? "Changed" : ""}
            disabled={isFieldDisabled}
          />
        </Box>
      );
    }
    
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
            disabled={isFieldDisabled}
          />
        </Box>
      );
    }
    
    if (fieldLower.includes('email')) {
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
            type="email"
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            error={isChanged}
            helperText={isChanged ? "Changed" : ""}
            disabled={isFieldDisabled}
          />
        </Box>
      );
    }
    
    if (fieldType === 'boolean') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleChange(field, e.target.checked)}
                color={isChanged ? "warning" : "primary"}
                disabled={isFieldDisabled}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{displayName}</Typography>
                {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
              </Box>
            }
          />
          {/* Comment out delete icon for boolean */}
          {/* <IconButton size="small" onClick={() => handleChange(field, false)}>
            <DeleteIcon fontSize="small" />
          </IconButton> */}
        </Box>
      );
    }
    
    if (Array.isArray(value)) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {displayName}
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
                    disabled={isFieldDisabled}
                  />
                }
                label={day.substring(0, 3)}
              />
            ))}
          </FormGroup>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button size="small" onClick={() => handleChange(field, [])} disabled={isFieldDisabled}>
              Clear All
            </Button>
          </Box>
        </Box>
      );
    }
    
    if (fieldLower.includes('day') && !fieldLower.includes('recurring') && typeof value === 'string') {
      return (
        <Box sx={{ position: 'relative' }}>
          <FormControl fullWidth margin="normal" error={isChanged}>
            <InputLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {displayName}
              </Box>
            </InputLabel>
            <Select
              value={value || ''}
              label={displayName}
              onChange={(e) => handleChange(field, e.target.value)}
              disabled={isFieldDisabled}
            >
              <MenuItem value="">None</MenuItem>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                .map(day => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
            </Select>
            {isChanged && <Typography variant="caption" color="warning.main">Changed</Typography>}
          </FormControl>
          {/* Comment out delete icon for day select */}
          {/* {value && (
            <IconButton
              size="small"
              onClick={() => handleChange(field, '')}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )} */}
        </Box>
      );
    }
    
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
              disabled={isFieldDisabled}
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
          {/* Comment out delete icon for status select */}
          {/* {value && (
            <IconButton
              size="small"
              onClick={() => handleChange(field, '')}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )} */}
        </Box>
      );
    }
    
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
            disabled={isFieldDisabled}
          />
          {/* Comment out delete icon for description */}
          {/* {value && (
            <IconButton
              size="small"
              onClick={() => handleChange(field, '')}
              sx={{ position: 'absolute', right: 8, top: 20 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )} */}
        </Box>
      );
    }
    
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
          error={isChanged}
          helperText={isChanged ? "Changed" : ""}
          disabled={isFieldDisabled}
        />
        {/* Comment out delete icon for general fields */}
        {/* {value && (
          <IconButton
            size="small"
            onClick={() => handleChange(field, '')}
            sx={{ position: 'absolute', right: 8, top: 20 }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )} */}
      </Box>
    );
  };

  if (!event) return null;
  
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
            </Typography>
          </Box>
          {/* Comment out advanced mode button if not canEdit */}
          {canEdit ? (
            <Button
              size="small"
              onClick={() => setAdvancedMode(!advancedMode)}
              startIcon={advancedMode ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {advancedMode ? 'Simple' : 'Advanced'}
            </Button>
          ) : null}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {/* Add view-only alert if not canEdit */}
          {!canEdit && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You do not have permission to edit this data. Fields are view-only.
            </Alert>
          )}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Update Scope:
            </Typography>
            
            <FormControl fullWidth>
              <Select
                value={editScope}
                onChange={(e) => setEditScope(e.target.value)}
                size="small"
                disabled={!canEdit}
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
                <MenuItem value="person" disabled={!originalPersonIdentifier || !canEdit}>
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
              <Alert severity="info" sx={{ mt: 2 }}>
                <WarningIcon sx={{ mr: 1 }} />
                This will update all events for <strong>{originalPersonIdentifier}</strong>.
              </Alert>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Comment out changed fields box if not canEdit */}
          {changedFields.length > 0 && canEdit && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Fields to update ({changedFields.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {changedFields.map(field => {
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
                        label={displayField}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={() => {
                          handleChange(field, event[field] !== undefined ? event[field] : '');
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            </Box>
          )}
          
          {advancedMode ? (
            <Box>
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
              
              {otherFields.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  {/* Comment out show all fields button if not canEdit */}
                  {canEdit ? (
                    <Button
                      fullWidth
                      onClick={() => setShowAllFields(!showAllFields)}
                      startIcon={showAllFields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      size="small"
                    >
                      {showAllFields ? 'Hide' : 'Show'} Other Fields ({otherFields.length})
                    </Button>
                  ) : null}
                  
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
            <Grid container spacing={2}>
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
            {/* Comment out changed fields count if not canEdit */}
            {changedFields.length > 0 && canEdit && (
              <Typography variant="caption" color="text.secondary">
                {changedFields.length} field(s) changed
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
              disabled={loading || changedFields.length === 0 || !canEdit}
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