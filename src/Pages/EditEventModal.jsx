import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Grid, Alert,
  Divider, Chip, CircularProgress, Tooltip, Checkbox, FormGroup, Collapse,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Warning,
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
  const [contextFilter, setContextFilter] = useState('all');
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

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [loggedInUserRole] = useState(() => {
    try {
      const storedProfile = localStorage.getItem("userProfile");
      if (storedProfile) return JSON.parse(storedProfile).role || "user";
    } catch (e) { console.error("Failed to parse profile:", e); }
    return "user";
  });

  const isAdmin = loggedInUserRole === USER_ROLES.ADMIN;
  const isLeader1 = loggedInUserRole === USER_ROLES.LEADER_1;
  const isLeader12 = loggedInUserRole === USER_ROLES.LEADER_12;
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

  const handleActiveToggle = async (newValue) => {
    try {
      setIsToggling(true);
      const userToken = localStorage.getItem("access_token") || token;
      if (!userToken) {
        toast.error("No authentication token found. Please log in again.");
        setIsToggling(false);
        return;
      }
      
      let endpoint;
      const queryParams = new URLSearchParams();
      queryParams.append('is_active', newValue.toString());
      
      if (newValue === false) {
        if (!deactivationDialogOpen) {
          setIsActiveToggle(!newValue);
          setDeactivationDialogOpen(true);
          setIsToggling(false);
          return;
        }
        queryParams.append('weeks', deactivationWeeks.toString());
        if (deactivationReason) queryParams.append('reason', deactivationReason);
      }

      if (editScope === 'person' && originalPersonIdentifier) {
        if (contextFilter === 'day' && originalContext.day) {
          endpoint = `/events/person/${encodeURIComponent(originalPersonIdentifier)}/day/${encodeURIComponent(originalContext.day)}/toggle-active`;
        } else if (contextFilter === 'location' && originalContext.location) {
          endpoint = `/events/person/${encodeURIComponent(originalPersonIdentifier)}/location/${encodeURIComponent(originalContext.location)}/toggle-active`;
        } else if (contextFilter === 'eventName' && originalContext.eventName) {
          endpoint = `/events/person/${encodeURIComponent(originalPersonIdentifier)}/eventname/${encodeURIComponent(originalContext.eventName)}/toggle-active`;
        } else {
          endpoint = `/events/person/${encodeURIComponent(originalPersonIdentifier)}/toggle-active-all`;
        }
      } else {
        const eventId = event._id || event.id || event.UUID;
        endpoint = `/events/${encodeURIComponent(eventId)}/toggle-active`;
      }
      
      const response = await fetch(`${BACKEND_URL}${endpoint}?${queryParams.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          localStorage.removeItem("access_token");
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      toast.success(result.message || 'Status updated successfully');
      
      setIsActiveToggle(newValue);
      setFormData(prev => ({
        ...prev, is_active: newValue,
        deactivation_start: newValue ? null : (prev.deactivation_start || null),
        deactivation_end: newValue ? null : (prev.deactivation_end || null),
        deactivation_reason: newValue ? null : (prev.deactivation_reason || null)
      }));
      
      setDeactivationDialogOpen(false);
      setDeactivationReason('');
      setDeactivationWeeks(2);
      if (refreshEvents) refreshEvents();
      
    } catch (error) {
      console.error('Toggle error:', error);
      if (!error.message.includes('401')) toast.error(`Failed to update status: ${error.message}`);
      setIsActiveToggle(!newValue);
    } finally {
      setIsToggling(false);
    }
  };

 
  const prepareUpdateData = () => {
  const cleanData = {};
  console.log("=== PREPARING UPDATE DATA ===");
  console.log("Changed fields:", changedFields);
  
  changedFields.forEach(field => {
    if (isFieldDisabled(field)) return;
    const value = formData[field];
    console.log(`Field: ${field}, Value: ${value}`);
    
    if (value === '') cleanData[field] = null;
    else if (value !== undefined && value !== null) cleanData[field] = value;

    // Field mapping for related fields
    if (fieldMapping[field]) {
      console.log(`Field ${field} maps to:`, fieldMapping[field]);
      fieldMapping[field].forEach(relatedField => {
        if (relatedField !== field && availableFields.includes(relatedField)) {
          if (isFieldDisabled(relatedField)) return;
          if (value === '') cleanData[relatedField] = null;
          else {
            // Special handling for Day/recurring_day conversion
            if (field === 'Day' && relatedField === 'recurring_day') {
              cleanData[relatedField] = [value];
            } else if (field === 'recurring_day' && relatedField === 'Day') {
              if (Array.isArray(value) && value.length > 0) {
                cleanData[relatedField] = value[0];
              } else if (typeof value === 'string') {
                cleanData[relatedField] = value;
              }
            } else {
              cleanData[relatedField] = value;
            }
          }
        }
      });
    }
  });
  
  console.log("Final update data to send:", cleanData);
  return cleanData;
};

  const handleSubmit = async () => {
    
    try {
      setLoading(true);
  
    console.log("=== UPDATE START ===");
    console.log("Edit scope:", editScope);
    console.log("Original event name:", event['Event Name']);
    console.log("New event name from form:", formData['Event Name'] || formData.eventName);
    console.log("Changed fields:", changedFields);
      if (changedFields.length === 0) {
        toast.info("No changes made");
        onClose(false);
        return;
      }

      const unauthorizedFields = changedFields.filter(field => isFieldDisabled(field));
      if (unauthorizedFields.length > 0) {
        toast.error(`You don't have permission to modify: ${unauthorizedFields.join(', ')}`);
        setLoading(false);
        return;
      }

      if (editScope === 'person' && !isAdmin) {
        toast.error('Only administrators can update all events for a person');
        setLoading(false);
        return;
      }

      const updateData = prepareUpdateData();
      let endpoint, method, body;

      if (editScope === 'person' && originalPersonIdentifier) {
        if (contextFilter === 'day' && originalContext.day) {
          endpoint = `/events/update-person-cells-by-day/${encodeURIComponent(originalPersonIdentifier)}/${encodeURIComponent(originalContext.day)}`;
        } else if (contextFilter === 'location' && originalContext.location) {
          endpoint = `/events/update-person-cells-by-location/${encodeURIComponent(originalPersonIdentifier)}/${encodeURIComponent(originalContext.location)}`;
        } else if (contextFilter === 'eventName' && originalContext.eventName) {
          endpoint = `/events/update-person-cells-by-eventname/${encodeURIComponent(originalPersonIdentifier)}/${encodeURIComponent(originalContext.eventName)}`;
        } else {
          endpoint = `/events/update-person-cells/${encodeURIComponent(originalPersonIdentifier)}`;
        }
        method = 'PUT';
        body = JSON.stringify(updateData);

        let confirmMsg = `Update events for "${originalPersonIdentifier}"`;
        if (contextFilter === 'day') confirmMsg += ` on ${originalContext.day}`;
        else if (contextFilter === 'location') confirmMsg += ` at ${originalContext.location}`;
        else if (contextFilter === 'eventName') confirmMsg += ` named "${originalContext.eventName}"`;
        else confirmMsg += ' (ALL events)';
        confirmMsg += `?\n\nFields: ${changedFields.join(', ')}`;

        if (!window.confirm(confirmMsg)) {
          setLoading(false);
          return;
        }
      } else {
        let identifier = event._id || event.id || event.UUID;
        if (identifier?.includes?.('_')) identifier = identifier.split('_')[0];
        endpoint = `/events/cells/${identifier}`;
        method = 'PUT';
        body = JSON.stringify(updateData);
      }

      const userToken = localStorage.getItem("access_token") || token;
      if (!userToken) {
        toast.error("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }, body
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { detail: errorText }; }
        if (response.status === 401) {
          toast.error("Your session has expired. Please log in again.");
          localStorage.removeItem("access_token");
        }
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (editScope === 'person') {
        toast.success(`Updated ${result.modified_count || result.updated_count || 0} events successfully`);
      } else {
        toast.success('Event updated successfully');
      }
      
      if (refreshEvents) refreshEvents();
      onClose(true);

    } catch (error) {
      console.error("Error saving:", error);
      if (!error.message.includes('401')) toast.error(`Failed to save: ${error.message || error}`);
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

  if (field === 'is_active') return null;

  if ((fl.includes('date') && !fl.includes('datecaptured')) || field === 'date') {
    // Safe date parsing
    let dateValue = '';
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          dateValue = date.toISOString().slice(0, 16);
        }
      } catch (e) {
        console.warn(`Invalid date for ${field}:`, value);
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
    const statusOptions = ['open', 'closed', 'complete', 'incomplete', 'did_not_meet', 'cancelled'];
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
    const deactivationReason = formData.deactivation_reason || formData.deactivationReason;
    
    return (
      <Box sx={{ mb: 3, p: 2, border: '1px solid',
        borderColor: isCurrentlyActive ? 'success.main' : 'warning.main', borderRadius: 2,
        bgcolor: isCurrentlyActive ? 'success.50' : 'warning.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1,
            color: isCurrentlyActive ? 'success.dark' : 'warning.dark' }}>
            {isCurrentlyActive ? (<><PlayArrow color="success" />Cell is Active</>) : 
              (<><Pause color="warning" />Cell is Deactivated</>)}
          </Typography>
          <FormControlLabel control={
              <Switch checked={isActiveToggle}
                onChange={(e) => {
                  if (isToggling || isFieldDisabled('is_active')) return;
                  const newValue = e.target.checked;
                  newValue === false ? setDeactivationDialogOpen(true) : handleActiveToggle(true);
                }}
                disabled={isToggling || isFieldDisabled('is_active')}
                color={isCurrentlyActive ? "success" : "warning"} />
            }
            label={<Typography variant="body2">{isActiveToggle ? 'Active' : 'Deactivated'}{isToggling && '...'}</Typography>}
            sx={{ m: 0 }} />
        </Box>
        
        {!isCurrentlyActive && deactivationEnd && (
          <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
            <Typography variant="body2">
              <strong>Deactivated until:</strong>{' '}
              {new Date(deactivationEnd).toLocaleDateString('en-ZA', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </Typography>
            {deactivationReason && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>Reason:</strong> {deactivationReason}
              </Typography>
            )}
          </Alert>
        )}
        
        {editScope === 'person' && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {contextFilter === 'day' && originalContext.day && 
              `${isActiveToggle ? 'Deactivating' : 'Activating'} only ${originalContext.day} cells`}
            {contextFilter === 'location' && originalContext.location && 
              `${isActiveToggle ? 'Deactivating' : 'Activating'} only cells at ${originalContext.location}`}
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
  const otherFields = availableFields.filter(f =>
    ![...personFields, ...eventFields, ...locationFields, ...timeFields].includes(f) && f !== 'is_active'
  );
  
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
            <Button size="small" onClick={() => setAdvancedMode(!advancedMode)}
              startIcon={advancedMode ? <ExpandLess /> : <ExpandMore />}>
              {advancedMode ? 'Simple' : 'Advanced'}
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            {!hasEditPermission && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Lock fontSize="small" sx={{ mr: 1 }} />
                Some fields are restricted to administrators and Leader 1 only.
                Locked fields <Lock fontSize="small" color="disabled" /> cannot be modified.
              </Alert>
            )}

            {renderActiveStatusSection()}

            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Update Scope:
              </Typography>

              <FormControl fullWidth>
                <Select
                  value={editScope}
                  onChange={(e) => setEditScope(e.target.value)}
                  size="small"
                  disabled={editScope === 'person' && !isAdmin}
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
                  <MenuItem value="person" disabled={!originalPersonIdentifier || !isAdmin}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        All Person's Events
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Update all {originalPersonIdentifier}'s events
                        {!isAdmin && " (Admin only)"}
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {editScope === 'person' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Warning sx={{ mr: 1 }} />
                  This will update all events for <strong>{originalPersonIdentifier}</strong>.
                  {!isAdmin && " This feature requires administrator privileges."}
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
            <Pause color="warning" />
            Deactivate Cell
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {editScope === 'person' ? (
              `You are about to deactivate ALL cells for "${originalPersonIdentifier}".`
            ) : (
              `You are about to deactivate "${eventName}".`
            )}
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Deactivation Period</InputLabel>
            <Select
              value={deactivationWeeks}
              onChange={(e) => setDeactivationWeeks(e.target.value)}
              label="Deactivation Period"
            >
              <MenuItem value={1}>1 Week</MenuItem>
              <MenuItem value={2}>2 Weeks</MenuItem>
              <MenuItem value={3}>3 Weeks</MenuItem>
              <MenuItem value={4}>4 Weeks</MenuItem>
              <MenuItem value={8}>2 Months</MenuItem>
              <MenuItem value={12}>3 Months</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label="Reason (Optional)"
            value={deactivationReason}
            onChange={(e) => setDeactivationReason(e.target.value)}
            placeholder="e.g., Leader on vacation, Venue unavailable"
            multiline
            rows={2}
          />
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              The cell will automatically reactivate after the deactivation period.
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
            onClick={() => handleActiveToggle(false)}
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