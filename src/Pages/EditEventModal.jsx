import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Grid, Alert,
  Divider, Chip, CircularProgress, Tooltip, Checkbox, FormGroup, Collapse,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Person,
  Event,
  Lock,
  PlayArrow,
  Pause,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const USER_ROLES = {
  ADMIN: 'admin', LEADER_1: 'leader1', LEADER_12: 'leader12', 
  LEADER_144: 'leader144', REGISTRANT: 'registrant', USER: 'user'
};

const EditEventModal = ({ isOpen, onClose, event, token, refreshEvents }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [editScope, setEditScope] = useState('single');
  const [contextFilter, ] = useState('all');
  const [isCellEvent, setIsCellEvent] = useState(false); 
  const [, setPersonIdentifier] = useState('');
  const [originalPersonIdentifier, setOriginalPersonIdentifier] = useState('');
  const [originalContext, setOriginalContext] = useState({ day: null, location: null, eventName: null });
  const [availableFields, setAvailableFields] = useState([]);
  const [changedFields, setChangedFields] = useState([]);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const [isActiveToggle, setIsActiveToggle] = useState(true);
  const [deactivationDialogOpen, setDeactivationDialogOpen] = useState(false);
  const [deactivationWeeks, setDeactivationWeeks] = useState(2);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  const [isPermanent,setIsPermanent] = useState(false)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [loggedInUserRole] = useState(() => {
    try {
      const storedProfile = localStorage.getItem("userProfile");
      if (storedProfile) return JSON.parse(storedProfile).role || "user";
    } catch { return "user"; }
    return "user";
  });

  const isAdmin = loggedInUserRole === USER_ROLES.ADMIN;
  const isLeader1 = loggedInUserRole === USER_ROLES.LEADER_1;
  // const isLeader12 = loggedInUserRole === USER_ROLES.LEADER_12;
  const isLeader144 = loggedInUserRole === USER_ROLES.LEADER_144;
  const hasEditPermission = isAdmin || isLeader1;
  
  const fieldMapping = {
    'Leader': ['Leader', 'eventLeader', 'eventLeaderName'],
    'eventLeader': ['eventLeader', 'Leader', 'eventLeaderName'],
    'Email': ['Email', 'eventLeaderEmail', 'email'],
    'Address': ['Address', 'location', 'address'],
    'Day': ['Day', 'recurring_day'],
    'Time': ['Time', 'time'],
    'Event Name': ['Event Name', 'eventName'],
    'status': ['status', 'Status'],
  };
console.log("EditEventModal rendered with event:", fieldMapping);
  const getFieldPermissions = useCallback((field) => {
    const fl = field.toLowerCase();
    const isWeekId = fl.includes('week') && (fl.includes('identifier') || fl.includes('id'));
    const isOriginalEventId = (fl.includes('original') && fl.includes('event') && fl.includes('id'));
    const isComposedEventId = (fl.includes('composite') || fl.includes('composed')) && fl.includes('id');
    const isEventType = fl.includes('event') && (fl.includes('type') || fl === 'eventtype');
    const isRestrictedLeader = fl === 'leader1' || fl === 'leader12' || fl.includes('leader at 12');

    if (isWeekId || isOriginalEventId || isComposedEventId) 
      return { disabled: true, reason: 'This field cannot be edited' };
    if (isEventType) return { disabled: true, reason: 'Event type cannot be edited' };
    if (isRestrictedLeader) {
      if (isLeader144) return { disabled: true, reason: 'Leader at 144 cannot edit leader fields' };
      if (!hasEditPermission) return { disabled: true, reason: 'Leader fields can only be edited by administrators and Leader 1' };
    }
    return { disabled: false, reason: null };
  }, [hasEditPermission, isLeader144]);

  const isFieldDisabled = useCallback((field) => getFieldPermissions(field).disabled, [getFieldPermissions]);
  const getDisabledReason = useCallback((field) => getFieldPermissions(field).reason, [getFieldPermissions]);

  const cleanEventId = (event) => {
    if (!event) return null;
    const cleanEvent = { ...event };
    if (cleanEvent._id?.includes?.('_')) cleanEvent._id = cleanEvent._id.split('_')[0];
    if (cleanEvent.id?.includes?.('_')) cleanEvent.id = cleanEvent.id.split('_')[0];
    return cleanEvent;
  };

  useEffect(() => {
    if (event) {
      const cleanEvent = cleanEventId(event);
      const identifier = cleanEvent.Leader || cleanEvent.eventLeader || cleanEvent.eventLeaderName || '';
      setOriginalPersonIdentifier(identifier);
      setPersonIdentifier(identifier);

      const day = cleanEvent.Day || cleanEvent.recurring_day?.[0] || null;
      const location = cleanEvent.Address || cleanEvent.location || null;
      const eventName = cleanEvent['Event Name'] || cleanEvent.eventName || null;
      setOriginalContext({ day, location, eventName });
      const eventType = cleanEvent['Event Type'] || cleanEvent.eventType || '';
      const isCell = eventType.toLowerCase() === 'cells';
      setIsCellEvent(isCell);
      
      if (isCell) {
        setEditScope('person'); 
      } else {
        setEditScope('single'); 
      }

      const initialData = {};
      Object.keys(cleanEvent).forEach(key => {
        const systemFields = ['_id', '__v', 'id', 'UUID', 'created_at', 'updated_at',
          'persistent_attendees', 'attendees', 'total_attendance', 'isEventType', 'eventTypeId', 'last_updated'];
        if (!systemFields.includes(key)) {
          initialData[key] = cleanEvent[key] ?? '';
        }
      });

      setFormData(initialData);
      setIsActiveToggle(initialData.is_active !== undefined ? initialData.is_active : true);

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
        if (isEmptyToRemove || isValueChanged) changed.push(key);
      });
      setChangedFields(changed);
    }
  }, [formData, event]);

  const handleChange = (field, value) => {
    const permissions = getFieldPermissions(field);
    if (permissions.disabled) {
      toast.warning(permissions.reason);
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

const handleDeactivateCell = async () => {
  try {
    setIsToggling(true);
    const userToken = localStorage.getItem("access_token") || token;
    
    const params = new URLSearchParams({
      weeks: deactivationWeeks.toString(),
      "is_permanent_deact":isPermanent
    });
    console.log("BOOL",isPermanent)
    
    if (deactivationReason) {
      params.append('reason', deactivationReason);
    }
    
    if (editScope === 'single' || !isCellEvent) {
      const cellName = formData.eventName || formData['Event Name'];
    
      params.append('cell_identifier', cellName);
      params.append('person_name', originalPersonIdentifier);
      
      if (originalContext.day) {
        params.append('day_of_week', originalContext.day);
      }
    } else {
      if (contextFilter === 'all') {
        params.append('cell_identifier', originalPersonIdentifier);
      } else if (contextFilter === 'day' && originalContext.day) {
        params.append('cell_identifier', originalPersonIdentifier);
        params.append('day_of_week', originalContext.day);
      } else if (contextFilter === 'eventName' && originalContext.eventName) {
        // Deactivate by EXACT cell name
        params.append('cell_identifier', originalContext.eventName);
        params.append('person_name', originalPersonIdentifier);
      }
    }
    
    console.log("Calling endpoint with:", params.toString());
    
    const response = await fetch(`${BACKEND_URL}/cells/deactivate?${params.toString()}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${userToken}` 
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Deactivation failed');
    }
    
    const result = await response.json();
    
    // Success message
    toast.success(
      <div>
        <div>{new Date(result.deactivation_end) < new Date()?"You cell has been successfully deactivated":result.message}</div>
        <div style={{ fontSize: '0.85em', marginTop: '5px' }}>
          Will auto-reactivate on: {new Date(result.deactivation_end) < new Date()?"Never":new Date(result.deactivation_end).toLocaleDateString()}
        </div>
      </div>
    );
    
    // Update local state
    setIsActiveToggle(false);
    setFormData(prev => ({
      ...prev, 
      is_active: false,
      deactivation_start: new Date().toISOString(),
      deactivation_end: result.deactivation_end,
      deactivation_reason: deactivationReason
    }));
    
    // Close and reset
    setDeactivationDialogOpen(false);
    setDeactivationReason('');
    setDeactivationWeeks(2);
    
    if (refreshEvents) refreshEvents();
    
  } catch (error) {
    console.error('Deactivation error:', error);
    toast.error(error.message);
    setIsActiveToggle(true);
  } finally {
    setIsToggling(false);
  }
};

  const handleReactivateCell = async () => {
    try {
      setIsToggling(true);
      const userToken = localStorage.getItem("access_token") || token;
      if (!userToken) {
        toast.error("No authentication token found. Please log in again.");
        setIsToggling(false);
        return;
      }
      
      const params = new URLSearchParams();
      let endpoint = '/cells/reactivate';
      
      if (editScope === 'single' || !isCellEvent) {
        // Reactivate specific cell
        const cellName = formData.eventName || formData['Event Name'] || originalContext.eventName;
        params.append('cell_identifier', cellName);
        params.append('person_name', originalPersonIdentifier);
        
        if (originalContext.day) {
          params.append('day_of_week', originalContext.day);
        }
      } else {
        // Reactivate based on person scope
        if (contextFilter === 'all') {
          params.append('cell_identifier', originalPersonIdentifier);
        } else if (contextFilter === 'day' && originalContext.day) {
          params.append('cell_identifier', originalPersonIdentifier);
          params.append('day_of_week', originalContext.day);
        } else if (contextFilter === 'eventName' && originalContext.eventName) {
          params.append('cell_identifier', originalContext.eventName);
          params.append('person_name', originalPersonIdentifier);
        }
      }
      
      const response = await fetch(`${BACKEND_URL}${endpoint}?${params.toString()}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${userToken}` 
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      toast.success(result.message);
      
      // Update local state
      setIsActiveToggle(true);
      setFormData(prev => ({
        ...prev, 
        is_active: true,
        deactivation_start: null,
        deactivation_end: null,
        deactivation_reason: null
      }));
      
      if (refreshEvents) refreshEvents();
      
    } catch (error) {
      console.error('Reactivation error:', error);
      toast.error(`Failed to reactivate: ${error.message}`);
      setIsActiveToggle(false);
    } finally {
      setIsToggling(false);
    }
  };
  console.log("THE EVENT",event)

  const handleActiveToggle = (newValue) => {
    if (isToggling || isFieldDisabled('is_active')) return;
    
    if (newValue === false) {
      // Show deactivation dialog
      setDeactivationDialogOpen(true);
    } else {
      // Immediate reactivation
      handleReactivateCell();
    }
  };

  const prepareUpdateData = () => {
    const cleanData = {};
    
    changedFields.forEach(field => {
      if (isFieldDisabled(field)) return;
      const value = formData[field];
      
      if (value === '' || value === null || value === undefined) {
        cleanData[field] = null;
      } else {
        cleanData[field] = value;
      }
      
      // Special handling for status fields
      if (field === 'status' || field === 'Status') {
        cleanData['status'] = value;
        cleanData['Status'] = value;
      }
      
      if (field === 'eventName' || field === 'Event Name') {
        cleanData['eventName'] = value;
        cleanData['Event Name'] = value;
      }
      
      if (field === 'Day' || field === 'day') {
        cleanData['Day'] = value;
        cleanData['day'] = value;
      }
      
      if (field === 'Address' || field === 'location') {
        cleanData['Address'] = value;
        cleanData['location'] = value;
      }
      
      if (field === 'Time' || field === 'time') {
        cleanData['Time'] = value;
        cleanData['time'] = value;
      }
      
      if (field === 'Email' || field === 'eventLeaderEmail') {
        cleanData['Email'] = value;
        cleanData['eventLeaderEmail'] = value;
      }
    });
    
    return {...cleanData,"is_permanent_deact":isPermanent};
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (changedFields.length === 0) {
        toast.info("No changes made");
        onClose();
        return;
      }

      const unauthorizedFields = changedFields.filter(field => isFieldDisabled(field));
      if (unauthorizedFields.length > 0) {
        toast.error(`You don't have permission to modify: ${unauthorizedFields.join(', ')}`);
        setLoading(false);
        return;
      }

      const updateData = prepareUpdateData();
      
      if (Object.keys(updateData).length === 0) {
        toast.info("No valid changes to save");
        setLoading(false);
        return;
      }

      let endpoint, method, body;

      const originalEventName = event['Event Name'] || event.eventName;
      const originalDay = event.Day || event.day;
      // const originalPerson = event.Leader || event.eventLeader || event.eventLeaderName;
      
      const newEventName = formData['Event Name'] || formData.eventName;
      const newDay = formData.Day || formData.day;

      if (editScope === 'single') {
        let identifier = event._id || event.id || event.UUID;
        if (identifier?.includes?.('_')) identifier = identifier.split('_')[0];
        
        if (!identifier) {
          toast.error("Cannot update: Event ID not found");
          setLoading(false);
          return;
        }
        
        endpoint = `/events/cells/${identifier}`;
        method = 'PUT';
        body = JSON.stringify(updateData);
        
        
        if (newEventName && newEventName !== originalEventName) {
          const confirmMsg = `Update event name from "${originalEventName}" to "${newEventName}"?\n\nThis will update ONLY this specific event.\n\nContinue?`;
          if (!window.confirm(confirmMsg)) {
            setLoading(false);
            return;
          }
        }
      } 
      else if (editScope === 'person') {
        if (!originalPersonIdentifier) {
          toast.error("Cannot update: Person identifier not found");
          setLoading(false);
          return;
        }
        
        if (!originalEventName) {
          toast.error("Cannot update: Original event name is required for 'Update All'");
          setLoading(false);
          return;
        }
        
        if (!originalDay) {
          toast.error("Cannot update: Original day is required for 'Update All'");
          setLoading(false);
          return;
        }
        
        endpoint = `/events/person/${encodeURIComponent(originalPersonIdentifier)}/event/${encodeURIComponent(originalEventName)}/day/${encodeURIComponent(originalDay)}`;
        method = 'PUT';
        body = JSON.stringify(updateData);
        
        let confirmMsg = `This will update ONLY:\n\n`;
        confirmMsg += `• Person: ${originalPersonIdentifier}\n`;
        confirmMsg += `• Event name: "${originalEventName}"\n`;
        confirmMsg += `• Day: ${originalDay}\n\n`;
        
        const changes = [];
        if (newEventName && newEventName !== originalEventName) {
          changes.push(`Event name: "${originalEventName}" → "${newEventName}"`);
        }
        if (newDay && newDay !== originalDay) {
          changes.push(`Day: ${originalDay} → ${newDay}`);
        }
        
        const otherFields = changedFields.filter(f => 
          !['Event Name', 'eventName', 'Day', 'day'].includes(f)
        );
        if (otherFields.length > 0) {
          changes.push(`Other fields: ${otherFields.join(', ')}`);
        }
        
        if (changes.length > 0) {
          confirmMsg += `Changes:\n${changes.join('\n')}\n\n`;
        }
        
        confirmMsg += `Continue?`;
        
        if (!window.confirm(confirmMsg)) {
          setLoading(false);
          return;
        }
      }

      const userToken = localStorage.getItem("access_token") || token;
      if (!userToken) {
        toast.error("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method, 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${userToken}` 
        }, 
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { detail: errorText }; }
        
        if (response.status === 404) {
          toast.error(`Not found: ${errorData.detail || 'The event or events could not be found'}`);
        } else if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          localStorage.removeItem("access_token");
        } else if (response.status === 409) {
          toast.error(`Conflict: ${errorData.detail || 'Duplicate event detected'}`);
        } else {
          toast.error(`Update failed: ${errorData.detail || errorData.message || `Error ${response.status}`}`);
        }
        
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (editScope === 'person') {
        if (result.success) {
          if (result.modified_count === 0) {
            toast.info(`No changes were made to ${originalEventName} events`);
          } else {
            toast.success(`Updated ${result.modified_count || 0} ${originalDay} events named "${originalEventName}"`);
          }
        } else {
          toast.warning(result.message || "Update completed with warnings");
        }
      } else {
        if (result.success) {
          if (result.modified) {
            toast.success('Event updated successfully');
          } else {
            toast.info('No changes were made to the event');
          }
        } else {
          toast.error(result.message || 'Update failed');
        }
      }
      
      onClose(true);

    } catch (error) {
      console.error("Error saving:", error);
      if (!error.message.includes('401')) {
        toast.error(`Failed to save: ${error.message || error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field] || '';
    const isChanged = changedFields.includes(field);
    const isDisabled = isFieldDisabled(field);
    const disabledReason = getDisabledReason(field);
    const displayName = field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase()).trim();
    const fieldType = typeof value === 'object' && value !== null ? 'object' : typeof value;
    const fl = field.toLowerCase();

    const labelContent = (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {displayName}
        {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
        {isDisabled && <Lock fontSize="small" color="disabled" />}
      </Box>
    );

    // Skip these fields entirely
    if (field === 'is_active' || field === 'Display date' || field === 'Display_date' || 
        field === 'display_date' || field === 'did_not_meet' || field === 'Did_not_meet' ||
        field === 'S' || field === 's' || field === 'Data-recurring' || field === 'data-recurring' ||
        field === 'is_recurring' || field === 'isRecurring' || field === 'is_overdue' || 
        field === 'isOverdue') {
      return null;
    }

    if ((fl.includes('date') && !fl.includes('datecaptured') && !fl.includes('display')) || field === 'date') {
      let dateValue = '';
      if (value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            dateValue = date.toISOString().slice(0, 16);
          }
        } catch (e) {
          console.warn(`Invalid date for ${field}:`, value, e);
        }
      }
      
      const content = (
        <TextField fullWidth margin="normal" label={labelContent} type="datetime-local"
          value={dateValue}
          onChange={(e) => handleChange(field, e.target.value)}
          InputLabelProps={{ shrink: true }} error={isChanged}
          helperText={isChanged ? "Changed" : ""} disabled={isDisabled} />
      );
      return isDisabled && disabledReason ? (
        <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
      ) : <Box key={field}>{content}</Box>;
    }

    if (fl.includes('time') && !fl.includes('datetime')) {
      const content = (
        <TextField fullWidth margin="normal" label={labelContent} type="time" value={value || ''}
          onChange={(e) => handleChange(field, e.target.value)} InputLabelProps={{ shrink: true }}
          error={isChanged} helperText={isChanged ? "Changed" : ""} disabled={isDisabled} />
      );
      return isDisabled && disabledReason ? (
        <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
      ) : <Box key={field}>{content}</Box>;
    }

    if (fl.includes('email')) {
      const content = (
        <TextField fullWidth margin="normal" label={labelContent} value={value} type="email"
          onChange={(e) => handleChange(field, e.target.value)} error={isChanged}
          helperText={isChanged ? "Changed" : ""} disabled={isDisabled} />
      );
      return isDisabled && disabledReason ? (
        <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
      ) : <Box key={field}>{content}</Box>;
    }

    if (fieldType === 'boolean') {
      const content = (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
          <FormControlLabel
            control={<Switch checked={!!value} onChange={(e) => handleChange(field, e.target.checked)}
              color={isChanged ? "warning" : "primary"} disabled={isDisabled} />}
            label={labelContent} />
        </Box>
      );
      return isDisabled && disabledReason ? (
        <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
      ) : <Box key={field}>{content}</Box>;
    }

    if (Array.isArray(value)) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const content = (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {displayName}
            {isChanged && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />}
            {isDisabled && <Lock fontSize="small" color="disabled" />}
          </Typography>
          <FormGroup row>
            {days.map(day => (
              <FormControlLabel key={day}
                control={<Checkbox checked={value.includes(day)}
                  onChange={(e) => {
                    if (isDisabled) return;
                    const newValue = e.target.checked ? [...value, day] : value.filter(d => d !== day);
                    handleChange(field, newValue);
                  }} size="small" disabled={isDisabled} />}
                label={day.substring(0, 3)} />
            ))}
          </FormGroup>
          {!isDisabled && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button size="small" onClick={() => handleChange(field, [])}>Clear All</Button>
            </Box>
          )}
        </Box>
      );
      return isDisabled && disabledReason ? (
        <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
      ) : <Box key={field}>{content}</Box>;
    }

    if (fl.includes('day') && !fl.includes('recurring') && typeof value === 'string') {
      const content = (
        <FormControl fullWidth margin="normal" error={isChanged} disabled={isDisabled}>
          <InputLabel>{displayName}</InputLabel>
          <Select value={value || ''} label={displayName}
            onChange={(e) => handleChange(field, e.target.value)} disabled={isDisabled}>
            <MenuItem value="">None</MenuItem>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
              .map(day => <MenuItem key={day} value={day}>{day}</MenuItem>)}
          </Select>
          {isChanged && <Typography variant="caption" color="warning.main">Changed</Typography>}
        </FormControl>
      );
      return isDisabled && disabledReason ? (
        <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
      ) : <Box key={field}>{content}</Box>;
    }

    if (fl === 'status') {
      const statusOptions = ['complete', 'incomplete', 'did_not_meet', 'cancelled'];
      const content = (
        <FormControl fullWidth margin="normal" error={isChanged} disabled={isDisabled}>
          <InputLabel>Status</InputLabel>
          <Select value={value || ''} label="Status"
            onChange={(e) => handleChange(field, e.target.value)} disabled={isDisabled}>
            <MenuItem value="">None</MenuItem>
            {statusOptions.map(status => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
          {isChanged && <Typography variant="caption" color="warning.main">Changed</Typography>}
        </FormControl>
      );
      return isDisabled && disabledReason ? (
        <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
      ) : <Box key={field}>{content}</Box>;
    }

    if (fl.includes('description') || (typeof value === 'string' && value.length > 50)) {
      const content = (
        <TextField fullWidth margin="normal" label={labelContent} value={value}
          onChange={(e) => handleChange(field, e.target.value)} multiline rows={3}
          error={isChanged} helperText={isChanged ? "Changed" : ""} disabled={isDisabled} />
      );
      return isDisabled && disabledReason ? (
        <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
      ) : <Box key={field}>{content}</Box>;
    }

    const content = (
      <TextField fullWidth margin="normal" label={labelContent} value={value}
        onChange={(e) => handleChange(field, e.target.value)} error={isChanged}
        helperText={isChanged ? "Changed" : ""} disabled={isDisabled} />
    );
    return isDisabled && disabledReason ? (
      <Tooltip key={field} title={disabledReason} arrow><Box>{content}</Box></Tooltip>
    ) : <Box key={field}>{content}</Box>;
  };

  const renderActiveStatusSection = () => {
    const isCurrentlyActive = formData.is_active !== false;
    const deactivationEnd = formData.deactivation_end || formData.deactivationEnd;
    const currentDeactivationReason = formData.deactivation_reason || formData.deactivationReason;
    
    return (
      <Box sx={{ mb: 3, p: 2, border: '1px solid',
        borderColor: isCurrentlyActive ? 'success.main' : 'warning.main', borderRadius: 2,
        bgcolor: isCurrentlyActive ? 'success.50' : 'warning.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1,
            color: isCurrentlyActive ? 'success.dark' : 'warning.dark' }}>
            {isCurrentlyActive ? (<><PlayArrow color="success" />{isCellEvent ? 'Cell' : 'Event'} is Active</>) : 
              (<><Pause color="warning" />{isCellEvent ? 'Cell' : 'Event'} is Deactivated</>)}
          </Typography>
          <FormControlLabel control={
              <Switch checked={isActiveToggle}
                onChange={(e) => {
                  handleActiveToggle(e.target.checked);
                }}
                disabled={isToggling || isFieldDisabled('is_active')}
                color={isCurrentlyActive ? "success" : "warning"} />
            }
            label={<Typography variant="body2">{isActiveToggle ? 'Active' : 'Deactivated'}{isToggling && '...'}</Typography>}
            sx={{ m: 0 }} />
        </Box>
       {!isCurrentlyActive && deactivationEnd && (
  <Alert
    severity="warning"
    icon={false}
    sx={{ mt: 1, mb: 1 }}
  >
    <Typography variant="body2">
      <strong>Deactivated until:</strong>{' '}
      {new Date(deactivationEnd) < new Date()? "Never": new Date(deactivationEnd).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </Typography>

    {currentDeactivationReason && (
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        <strong>Reason:</strong> {currentDeactivationReason}
      </Typography>
    )}
  </Alert>
)}

        
        {editScope === 'person' && isCellEvent && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {contextFilter === 'day' && originalContext.day && 
              `${isActiveToggle ? 'Deactivating' : 'Activating'} only ${originalContext.day} cells`}
            {contextFilter === 'eventName' && originalContext.eventName && 
              `${isActiveToggle ? 'Deactivating' : 'Activating'} only "${originalContext.eventName}" cells`}
            {contextFilter === 'all' && 
              `${isActiveToggle ? 'Deactivating' : 'Activating'} ALL cells for this person`}
          </Typography>
        )}
      </Box>
    );
  };

  if (!event) return null;

  const personFields = availableFields.filter(f =>
    ['Leader', 'eventLeader', 'eventLeaderName', 'Email', 'eventLeaderEmail', 'email',
      'leader1', 'leader12', 'Leader at 12'].includes(f)
  );

  const eventFields = availableFields.filter(f => {
    const fl = f.toLowerCase();
    const allowed = ['eventname', 'event name', 'event type', 'eventtypename', 'description',
      'status', 'isticketed', 'isglobal', 'haspersonsteps'];
    return allowed.includes(fl);
  });

  const locationFields = availableFields.filter(f => ['Address', 'location', 'address'].includes(f));
  const timeFields = availableFields.filter(f => ['date', 'Date Of Event', 'time', 'Time', 'Day', 'recurring_day'].includes(f));
  const otherFields = availableFields.filter(f => {
    const skipFields = ['is_active', 'Display date', 'Display_date', 'display_date', 
                        'did_not_meet', 'Did_not_meet', 'S', 's', 'Data-recurring', 
                        'data-recurring', 'is_recurring', 'isRecurring', 'is_overdue', 'isOverdue'];
    return ![...personFields, ...eventFields, ...locationFields, ...timeFields, ...skipFields].includes(f);
  });
  
  const eventName = formData.eventName || formData['Event Name'] || 'Unnamed Event';

  return (
    <>
      <Dialog open={isOpen} onClose={() => onClose(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">Edit: {eventName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Person: <strong>{originalPersonIdentifier || 'Unknown'}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isCellEvent ? (
                <Chip label="CELL" color="primary" size="small" sx={{ fontSize: '0.7rem' }} />
              ) : (
                <Chip label="SINGLE" color="success" size="small" sx={{ fontSize: '0.7rem' }} />
              )}
              <Button size="small" onClick={() => setAdvancedMode(!advancedMode)}
                startIcon={advancedMode ? <ExpandLess /> : <ExpandMore />}>
                {advancedMode ? 'Simple' : 'Advanced'}
              </Button>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
  <Box sx={{ pt: 1 }}>
    {renderActiveStatusSection()}

    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        Update Method:
      </Typography>

      <FormControl fullWidth>
        {isCellEvent ? (
          <Box sx={{ 
            p: 2, 
            border: 1, 
            borderColor: 'primary.main', 
            borderRadius: 1, 
            bgcolor: 'primary.50' 
          }}>
            <Typography variant="body2" fontWeight="bold" color="primary.main">
              Update All Recurring Events
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Required for Cell consistency. All occurrences will be updated.
            </Typography>
          </Box>
                ) : (
                  <Box sx={{ 
                    p: 2, 
                    border: 1, 
                    borderColor: 'success.main', 
                    borderRadius: 1, 
                    bgcolor: 'success.50' 
                  }}>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      Single Event Only
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Update only this specific event.
                    </Typography>
                  </Box>
                )}
              </FormControl>

              {isCellEvent && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                     Changes will apply to all occurrences.
                  </Typography>
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {changedFields.length > 0 && (
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
                    const isDisabled = isFieldDisabled(field);

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
                            {isDisabled && (
                              <>
                                <br />
                                <Typography variant="caption" color="error">
                                  {getDisabledReason(field)}
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      >
                        <Chip
                          label={displayField}
                          size="small"
                          color={isDisabled ? "error" : "primary"}
                          variant="outlined"
                          onDelete={() => {
                            handleChange(field, event[field] !== undefined ? event[field] : '');
                          }}
                          icon={isDisabled ? <Lock fontSize="small" /> : undefined}
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
                      <Person /> Person Information
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
                      <Event /> Event Information
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
                    <Button
                      fullWidth
                      onClick={() => setShowAllFields(!showAllFields)}
                      startIcon={showAllFields ? <ExpandLess /> : <ExpandMore />}
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
              <Grid container spacing={2}>
                {['eventName', 'Event Name', 'eventLeader', 'Leader', 'eventLeaderEmail', 'Email',
                  'date', 'Date Of Event', 'time', 'Time', 'location', 'Address',
                  'status',
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
                  {changedFields.length} field(s) changed
                  {changedFields.some(f => isFieldDisabled(f)) && (
                    <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                      (Some fields require higher permissions)
                    </Typography>
                  )}
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
                disabled={loading || changedFields.length === 0 || changedFields.some(f => isFieldDisabled(f))}
                color={isCellEvent ? 'primary' : 'success'}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Saving...' : (
                  isCellEvent ? 'Update All Cell Events' : 'Update This Event'
                )}
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deactivationDialogOpen}
        onClose={() => {
          setDeactivationDialogOpen(false);
          setIsActiveToggle(true); 
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            Deactivate Event
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {editScope === 'person' ? (
              contextFilter === 'day' && originalContext.day ? 
                `You are about to deactivate ${originalContext.day} cells for "${originalPersonIdentifier}".` :
              contextFilter === 'eventName' && originalContext.eventName ?
                `You are about to deactivate "${originalContext.eventName}" cells for "${originalPersonIdentifier}".` :
                `You are about to deactivate ALL cells for "${originalPersonIdentifier}".`
            ) : (
              `You are about to deactivate "${eventName}".`
            )}
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Deactivation Period</InputLabel>
            <Select
              value={deactivationWeeks}
              onChange={(e) =>{ 
                setDeactivationWeeks(e.target.value);
                if (e.target.value === -1) setIsPermanent(true)
              }}
              label="Deactivation Period"
            >
              <MenuItem value={1}>1 Week</MenuItem>
              <MenuItem value={2}>2 Weeks</MenuItem>
              <MenuItem value={3}>3 Weeks</MenuItem>
              <MenuItem value={4}>4 Weeks</MenuItem>
              <MenuItem value={8}>2 Months</MenuItem>
              <MenuItem value={12}>3 Months</MenuItem>
              <MenuItem value={-1}>Never</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label="Reason (Optional)"
            value={deactivationReason}
            onChange={(e) => setDeactivationReason(e.target.value)}
            placeholder=""
            multiline
            rows={2}
          />
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              The cell will automatically reactivate after the deactivation period ends.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeactivationDialogOpen(false);
              setIsActiveToggle(true); 
            }}
            disabled={isToggling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeactivateCell}
            variant="contained"
            color="warning"
            startIcon={isToggling ? <CircularProgress size={20} /> : <Pause />}
            disabled={isToggling}
          >
            {isToggling ? 'Deactivating...' : 'Confirm Deactivation'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditEventModal;