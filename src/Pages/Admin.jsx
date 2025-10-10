import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Container, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Tabs, Tab,
  InputAdornment, CircularProgress, Alert, AlertTitle, Checkbox,
  FormControlLabel, Tooltip, Stack, Divider, List, ListItem, ListItemText,
  Autocomplete, useTheme, Fab, TablePagination, useMediaQuery, Skeleton,
  Menu
} from '@mui/material';
import {
  Search, PersonAdd, Edit, Delete, Shield, Refresh, People, TrendingUp,
  AdminPanelSettings, Circle, Close, History, Person as PersonIcon,
  CalendarToday as CalendarIcon, Home as HomeIcon, Email as EmailIcon,
  Phone as PhoneIcon, Wc as GenderIcon, HowToReg as RegistrantIcon,
  Add as AddIcon, Event as EventIcon, MoreVert as MoreVertIcon
} from '@mui/icons-material';

// EventTypesModal Component
const EventTypesModal = ({ open, onClose, onSubmit, setSelectedEventTypeObj }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    isTicketed: false,
    isGlobal: false,
    hasPersonSteps: false,
    description: "",
  });

  const [errors, setErrors] = useState({});

  const handleCheckboxChange = (name) => (event) => {
    const { checked } = event.target;

    setFormData((prev) => {
      if (checked) {
        return {
          ...prev,
          isTicketed: name === 'isTicketed',
          isGlobal: name === 'isGlobal',
          hasPersonSteps: name === 'hasPersonSteps',
          [name]: checked,
        };
      } else {
        return {
          ...prev,
          [name]: checked,
        };
      }
    });

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Event Type Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Event Type Name must be at least 2 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.isTicketed && !formData.isGlobal && !formData.hasPersonSteps) {
      newErrors.eventType = "Please select at least one event type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      isTicketed: false,
      isGlobal: false,
      hasPersonSteps: false,
      description: "",
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const eventTypeData = {
        name: formData.name.trim(),
        isTicketed: formData.isTicketed,
        isGlobal: formData.isGlobal,
        hasPersonSteps: formData.hasPersonSteps,
        description: formData.description.trim(),
      };

      const result = await onSubmit(eventTypeData);

      if (result && setSelectedEventTypeObj) {
        setSelectedEventTypeObj(result);
      }

      resetForm();
      onClose();

    } catch (error) {
      console.error("Error creating event type:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const getSelectedEventType = () => {
    if (formData.isTicketed) return "Ticketed Event";
    if (formData.isGlobal) return "Global Event";
    if (formData.hasPersonSteps) return "Personal Steps Event";
    return "No event type selected";
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 6
        }
      }}
    >
      <DialogTitle sx={{
        background: 'linear-gradient(45deg, #333 30%, #555 90%)',
        color: 'white',
        py: 2
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">Create New Event Type</Typography>
          <IconButton
            onClick={handleClose}
            disabled={loading}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <TextField
          label="Event Type Name"
          name="name"
          fullWidth
          margin="normal"
          value={formData.name}
          onChange={handleInputChange}
          error={!!errors.name}
          helperText={errors.name}
          placeholder="Create an event type"
          disabled={loading}
          sx={{ mb: 3, mt: 0 }}
        />

        <Box sx={{ mb: 3 }}>
          {/* <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
            Event Type (Select One):
          </Typography> */}

          {errors.eventType && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
              {errors.eventType}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isTicketed"
                  checked={formData.isTicketed}
                  onChange={handleCheckboxChange('isTicketed')}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Ticketed"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontWeight: formData.isTicketed ? 'bold' : 'normal'
                }
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isGlobal"
                  checked={formData.isGlobal}
                  onChange={handleCheckboxChange('isGlobal')}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Global Event"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontWeight: formData.isGlobal ? 'bold' : 'normal'
                }
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="hasPersonSteps"
                  checked={formData.hasPersonSteps}
                  onChange={handleCheckboxChange('hasPersonSteps')}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Person Steps"
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontWeight: formData.hasPersonSteps ? 'bold' : 'normal'
                }
              }}
            />
          </Box>

          {(formData.isTicketed || formData.isGlobal || formData.hasPersonSteps) && (
            <Typography variant="body2" sx={{
              color: '#1976d2',
              fontStyle: 'italic',
              mt: 1
            }}>
              Selected: {getSelectedEventType()}
            </Typography>
          )}
        </Box>

        <TextField
          label="Event Description"
          name="description"
          fullWidth
          multiline
          rows={4}
          value={formData.description}
          onChange={handleInputChange}
          error={!!errors.description}
          helperText={errors.description || "Describe the purpose and details of this event group"}
          placeholder="Enter a detailed description of this event group..."
          disabled={loading}
          sx={{ mb: 2 }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
          sx={{ px: 3 }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ px: 4 }}
        >
          {loading ? "Creating..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));

  const getResponsiveValue = (xs, sm, md, lg, xl) => {
    if (isXsDown) return xs;
    if (isSmDown) return sm;
    if (isMdDown) return md;
    if (isLgDown) return lg;
    return xl;
  };

  const containerPadding = getResponsiveValue(1, 2, 3, 4, 4);
  const titleVariant = getResponsiveValue("subtitle1", "h6", "h5", "h4", "h4");
  const cardSpacing = getResponsiveValue(1, 2, 2, 3, 3);

  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);
  const [peopleList, setPeopleList] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showFabMenu, setShowFabMenu] = useState(null);
  const [showEventTypesModal, setShowEventTypesModal] = useState(false);
  const [eventTypes, setEventTypes] = useState([]);

  const [eventTypeMenuAnchor, setEventTypeMenuAnchor] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    gender: '',
    invitedBy: '',
    leader12: '',
    leader144: '',
    leader1728: '',
    stage: 'Win',
    role: 'user'
  });

  const [roles] = useState([
    { name: 'admin', description: 'Full system access' },
    { name: 'leader', description: 'Group leaders managing cells' },
    { name: 'user', description: 'Regular members' },
    { name: 'registrant', description: 'Event check-in volunteers' }
  ]);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

  const SkeletonCard = () => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="80%" height={20} sx={{ mt: 0.5 }} />
          </Box>
          <Stack direction="row" spacing={1}>
            <Skeleton variant="circular" width={32} height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );

  const SkeletonTableRow = () => (
    <TableRow>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width="70%" /></TableCell>
      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width="60%" /></TableCell>
      <TableCell align="right"><Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} /></TableCell>
    </TableRow>
  );

  const SkeletonStatsCard = () => (
    <Card sx={{ height: '100%', p: getResponsiveValue(1.5, 2, 2.5, 3, 3) }}>
      <CardContent sx={{ textAlign: 'center', p: 1 }}>
        <Skeleton variant="circular" width={getResponsiveValue(40, 48, 56, 64, 64)} height={getResponsiveValue(40, 48, 56, 64, 64)} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width="60%" height={getResponsiveValue(32, 40, 48, 48, 56)} sx={{ mx: 'auto' }} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto' }} />
      </CardContent>
    </Card>
  );

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('access_token');

      if (!token) {
        throw new Error('No authentication token found. Please log in as an admin.');
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Authentication failed. Please log in again.');
        if (response.status === 403) throw new Error('Admin access required.');
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();

      if (!data.users || !Array.isArray(data.users)) {
        throw new Error('Invalid response format from server');
      }

      const transformedUsers = data.users.map(user => ({
        id: user.id,
        name: `${user.name} ${user.surname}`.trim(),
        email: user.email,
        role: user.role,
        status: 'active',
        phoneNumber: user.phone_number,
        dateOfBirth: user.date_of_birth,
        address: user.address,
        gender: user.gender,
        invitedBy: user.invitedBy,
        leader12: user.leader12,
        leader144: user.leader144,
        leader1728: user.leader1728,
        stage: user.stage,
        createdAt: user.created_at
      }));

      setUsers(transformedUsers);
      addActivityLog('DATA_REFRESH', 'User data refreshed successfully');

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFabClick = (event) => {
    setShowFabMenu(event.currentTarget);
  };

  const handleFabMenuClose = () => {
    setShowFabMenu(null);
  };

  const handleFabMenuSelect = (option) => {
    handleFabMenuClose();
    if (option === 'user') setShowAddUserModal(true);
    if (option === 'eventType') setShowEventTypesModal(true);
  };

  const handleEventTypeCardClick = (eventTypeObj) => {
    localStorage.setItem('selectedEventType', JSON.stringify(eventTypeObj));
  };

  const fetchEventTypes = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/event-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEventTypes(data || []);
      }
    } catch (err) {
      console.error('Error fetching event types:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    fetchEventTypes();
  }, [fetchAllData]);

  useEffect(() => {
    if (showAddUserModal) {
      fetchPeopleList();
    }
  }, [showAddUserModal]);

  const addActivityLog = useCallback((action, details) => {
    const newLog = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user: 'Current Admin'
    };
    setActivityLog(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const fetchPeopleList = async () => {
    try {
      const allPeople = [];
      let page = 1;
      const perPage = 1000;
      let moreData = true;

      while (moreData) {
        const response = await fetch(`${API_BASE_URL}/people?page=${page}&perPage=${perPage}`);
        const data = await response.json();
        const results = data?.results || [];
        allPeople.push(...results);

        if (results.length < perPage) {
          moreData = false;
        } else {
          page += 1;
        }
      }
      setPeopleList(allPeople);
    } catch (err) {
      console.error('Failed to fetch people:', err);
      setPeopleList([]);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newUser.name?.trim()) errors.name = 'Name is required';
    if (!newUser.surname?.trim()) errors.surname = 'Surname is required';
    if (!newUser.email?.trim()) errors.email = 'Email is required';
    if (!newUser.password?.trim()) errors.password = 'Password is required';
    if (!newUser.date_of_birth?.trim()) errors.date_of_birth = 'Date of birth is required';
    if (!newUser.address?.trim()) errors.address = 'Address is required';
    if (!newUser.phone_number?.trim()) errors.phone_number = 'Phone number is required';
    if (!newUser.gender?.trim()) errors.gender = 'Gender is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) {
      return;
    }

    setCreatingUser(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const payload = {
        name: newUser.name,
        surname: newUser.surname,
        email: newUser.email,
        password: newUser.password,
        phone_number: newUser.phone_number,
        date_of_birth: newUser.date_of_birth,
        address: newUser.address,
        gender: newUser.gender,
        invitedBy: newUser.invitedBy,
        leader12: newUser.leader12,
        leader144: newUser.leader144,
        leader1728: newUser.leader1728,
        stage: newUser.stage || 'Win',
        role: newUser.role
      };

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to create user');
      }

      addActivityLog('USER_CREATED', `Created new user: ${newUser.name} ${newUser.surname} (${newUser.role})`);

      setNewUser({
        name: '',
        surname: '',
        email: '',
        password: '',
        phone_number: '',
        date_of_birth: '',
        address: '',
        gender: '',
        invitedBy: '',
        leader12: '',
        leader144: '',
        leader1728: '',
        stage: 'Win',
        role: 'user'
      });

      setShowAddUserModal(false);
      setFormErrors({});
      fetchAllData();

    } catch (err) {
      console.error('Error creating user:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user role');
      }

      const user = users.find(u => u.id === userId);
      addActivityLog('ROLE_UPDATED', `Updated ${user?.name}'s role to ${newRole}`);

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      setShowRoleModal(false);
      setSelectedUser(null);

    } catch (err) {
      console.error('Error updating role:', err);
      alert(err.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setDeletingUser(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user');
      }

      addActivityLog('USER_DELETED', `Deleted user: ${selectedUser.name}`);

      setUsers(users.filter(user => user.id !== selectedUser.id));
      setShowDeleteConfirm(false);
      setSelectedUser(null);

    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.message);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleDeleteEventType = async () => {
  handleEventTypeMenuClose();

  if (!selectedEventType || !selectedEventType._id) return;

  const confirmDelete = window.confirm(`Delete "${selectedEventType.name}"?`);
  if (!confirmDelete) return;

  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (!token) {
    alert("Authentication token not found. Please log in.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/events/${selectedEventType._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 404) {
      alert("Event not found or already deleted.");
      setSelectedEventType(null);
      await fetchEventTypes();
      return;
    }

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || 'Failed to delete event');
    }

    // Success
    await fetchEventTypes();
    setSelectedEventType(null);
    alert(`Event "${selectedEventType.name}" deleted successfully.`);
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Could not delete event.");
  }
};



  const handleEventTypeMenuOpen = (event, eventType) => {
    setEventTypeMenuAnchor(event.currentTarget);
    setSelectedEventType(eventType);
  };

  const handleEventTypeMenuClose = () => {
    setEventTypeMenuAnchor(null);
    setSelectedEventType(null);
  };

 const handleEditEventType = () => {
  // Close the menu
  handleEventTypeMenuClose();

  if (selectedEventType) {
    // Open modal in edit mode
    setShowEventTypesModal(true);
  }
};


const handleCreateOrUpdateEventType = async (eventTypeData, id = null) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  const url = id ? `${API_BASE_URL}/event-types/${id}` : `${API_BASE_URL}/event-types`;
  const method = id ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventTypeData)
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.detail || "Failed to save event type");
  }

  await fetchEventTypes(); // refresh list
  return responseData;
};

  const handleCreateEventType = async (eventTypeData) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/event-types`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventTypeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create event type');
      }

      const newEventType = await response.json();
      addActivityLog('EVENT_TYPE_CREATED', `Created new event type: ${eventTypeData.name}`);
      await fetchEventTypes();
      return newEventType;

    } catch (err) {
      console.error('Error creating event type:', err);
      throw err;
    }
  };

  const handleInvitedByChange = (value) => {
    if (!value) {
      setNewUser(prev => ({
        ...prev,
        invitedBy: '',
        leader12: '',
        leader144: '',
        leader1728: ''
      }));
      return;
    }

    const label = typeof value === "string" ? value : value.label;
    const person = peopleList.find(
      p => `${p.Name} ${p.Surname}`.trim() === label.trim()
    );

    setNewUser(prev => ({
      ...prev,
      invitedBy: label,
      leader12: person?.["Leader @12"] || '',
      leader144: person?.["Leader @144"] || '',
      leader1728: person?.["Leader @ 1728"] || ''
    }));
  };

  const getRoleColor = (role) => {
    const colors = { admin: 'error', leader: 'primary', user: 'success', registrant: 'warning' };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: <Shield />,
      leader: <AdminPanelSettings />,
      user: <PersonIcon />,
      registrant: <RegistrantIcon />
    };
    return icons[role] || <PersonIcon />;
  };

  const getRoleDisplay = (role) => role.charAt(0).toUpperCase() + role.slice(1);
  const getInitials = (name) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

  const filteredUsers = useMemo(() => users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  }), [users, searchTerm, selectedRole]);

  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getRoleCount = (roleName) => users.filter(u => u.role === roleName).length;

  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeToday: users.filter(u => u.status === 'active').length,
    admins: getRoleCount('admin'),
    leaders: getRoleCount('leader'),
    registrants: getRoleCount('registrant'),
    regularUsers: getRoleCount('user'),
    eventTypes: eventTypes.length
  }), [users, eventTypes]);

  const cardStyles = {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
    '&:hover': {
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
    },
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 2
  };

  const UserCard = ({ user }) => (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={2} alignItems="center" flex={1}>
            <Avatar sx={{ bgcolor: '#9c27b0', boxShadow: 1 }}>
              {getInitials(user.name)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight="bold">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
              <Chip
                label={getRoleDisplay(user.role)}
                color={getRoleColor(user.role)}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {user.phoneNumber || 'No phone'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'No date'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Change Role">
              <IconButton
                size="small"
                onClick={() => { setSelectedUser(user); setShowRoleModal(true); }}
                sx={{ boxShadow: 1, borderRadius: 1 }}
              >
                <Shield fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete User">
              <IconButton
                size="small"
                onClick={() => { setSelectedUser(user); setShowDeleteConfirm(true); }}
                sx={{ color: 'error.main', boxShadow: 1, borderRadius: 1 }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  const peopleOptions = peopleList.map(person => ({
    label: `${person.Name || ""} ${person.Surname || ""}`.trim(),
    person
  }));

  if (loading) {
    return (
      <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: getResponsiveValue(2, 3, 4, 5, 5), minHeight: "100vh" }}>
        <Skeleton
          variant="text"
          width="40%"
          height={getResponsiveValue(32, 40, 48, 56, 56)}
          sx={{ mx: 'auto', mb: cardSpacing }}
        />

        <Grid container spacing={cardSpacing} mb={cardSpacing}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Grid item xs={6} sm={4} md={2.4} key={index}>
              <SkeletonStatsCard />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={cardSpacing} mb={cardSpacing} alignItems="center">
          <Grid item xs={12} sm={8}>
            <Skeleton variant="rounded" height={40} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Skeleton variant="rounded" height={40} />
          </Grid>
        </Grid>

        {isMdDown ? (
          <Box sx={{ maxHeight: 500, overflowY: "auto", border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 1 }}>
            {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflowY: "auto" }}>
            <Table size={getResponsiveValue("small", "small", "medium", "medium", "medium")} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width="70%" /></TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width="70%" /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => <SkeletonTableRow key={index} />)}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: '100%', boxShadow: 3, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <AdminPanelSettings sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>Error Loading Data</Typography>
          </Box>
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
          <Button variant="contained" fullWidth onClick={fetchAllData} startIcon={<Refresh />}>
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      p={containerPadding}
      sx={{
        maxWidth: "1400px",
        margin: "0 auto",
        mt: getResponsiveValue(2, 3, 4, 5, 5),
        minHeight: "100vh"
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: cardSpacing }}
      >
        <Typography variant={titleVariant} fontWeight="bold" color="text.primary">
          User Management
        </Typography>
      </Stack>

      {eventTypes.length > 0 && (
        <Box
          sx={{
            mb: cardSpacing,
            px: 1,
            py: 2,
            background: 'linear-gradient(90deg, #e3f2fd 0%, #f8bbd0 100%)',
            borderRadius: 3,
            boxShadow: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            overflowX: 'auto',
            minHeight: 70,
            maxWidth: '100%',
          }}
        >
          {eventTypes.map((et) => (
            <Card
              key={et.id}
              sx={{
                minWidth: 200,
                maxWidth: 260,
                mx: 1,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                boxShadow: 3,
                background: 'linear-gradient(135deg, #fff 60%, #e3f2fd 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                  background: 'linear-gradient(135deg, #e3f2fd 60%, #fff 100%)'
                }
              }}
              onClick={() => handleEventTypeCardClick(et)}
            >
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventTypeMenuOpen(e, et);
                }}
              >
                <MoreVertIcon />
              </IconButton>

              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <EventIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                  {et.name}
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {et.description}
              </Typography>

              <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                {et.isTicketed && <Chip label="Ticketed" color="info" size="small" />}
                {et.isGlobal && <Chip label="Global" color="success" size="small" />}
                {et.hasPersonSteps && <Chip label="Person Steps" color="warning" size="small" />}
              </Stack>
            </Card>
          ))}

         <Menu
  anchorEl={eventTypeMenuAnchor}
  open={Boolean(eventTypeMenuAnchor)}
  onClose={handleEventTypeMenuClose}
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
>
  <MenuItem onClick={handleEditEventType}>
    <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
  </MenuItem>
  <MenuItem onClick={handleDeleteEventType}>
    <Delete fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Delete
  </MenuItem>
</Menu>

        </Box>
      )}

      <Grid container spacing={cardSpacing} sx={{ mb: cardSpacing }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: <People />, color: '#2196f3' },
          { label: 'Administrators', value: stats.admins, icon: <Shield />, color: '#f44336' },
          { label: 'Leaders', value: stats.leaders, icon: <AdminPanelSettings />, color: '#9c27b0' },
          { label: 'Registrants', value: stats.registrants, icon: <RegistrantIcon />, color: '#ff9800' },
          { label: 'Regular Users', value: stats.regularUsers, icon: <PersonIcon />, color: '#607d8b' }
        ].map((stat, index) => (
          <Grid item xs={6} sm={4} md={2.4} key={index}>
            <Card sx={cardStyles}>
              <CardContent sx={{ textAlign: 'center', flexGrow: 1, p: getResponsiveValue(1.5, 2, 2.5, 3, 3) }}>
                <Avatar
                  sx={{
                    bgcolor: stat.color,
                    width: getResponsiveValue(40, 48, 56, 64, 64),
                    height: getResponsiveValue(40, 48, 56, 64, 64),
                    mb: 2,
                    mx: 'auto',
                    boxShadow: 2
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Typography
                  variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")}
                  fontWeight="bold"
                  color="text.primary"
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")}
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            display: getResponsiveValue('column', 'column', 'row', 'row', 'row'),
            justifyContent: 'space-between',
            alignItems: getResponsiveValue('stretch', 'stretch', 'center', 'center', 'center'),
            p: 2,
            gap: getResponsiveValue(2, 2, 0, 0, 0),
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                borderRadius: 1,
                fontSize: getResponsiveValue('0.75rem', '0.875rem', '0.875rem', '1rem', '1rem')
              }
            }}
          >
            <Tab label="Users" />
            <Tab label="Roles & Permissions" />
            <Tab label="Activity Log" />
          </Tabs>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAllData}
            sx={{
              boxShadow: 1,
              borderRadius: 2,
              height: 40,
              minWidth: getResponsiveValue('auto', 'auto', 120, 120, 120)
            }}
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
          >
            Refresh
          </Button>
        </Box>

        {activeTab === 0 && (
          <Box sx={{ p: getResponsiveValue(1, 2, 3, 3, 3) }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                  sx: { boxShadow: 1, borderRadius: 1 }
                }}
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              />
              <FormControl sx={{ minWidth: getResponsiveValue('100%', 200, 200, 200, 200) }}>
                <InputLabel>Filter Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Filter Role"
                  onChange={(e) => setSelectedRole(e.target.value)}
                  sx={{ boxShadow: 1, borderRadius: 1 }}
                  size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="leader">Leader</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="registrant">Registrant</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {isMdDown ? (
              <Box>
                <Box
                  sx={{
                    maxHeight: 500,
                    overflowY: "auto",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  {paginatedUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </Box>
                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                />
              </Box>
            ) : (
              <Box>
                <TableContainer sx={{ maxHeight: 500, boxShadow: 1, borderRadius: 1 }}>
                  <Table stickyHeader size={getResponsiveValue("small", "small", "medium", "medium", "medium")}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>User</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Role</TableCell>
                        <TableCell
                          sx={{ fontWeight: 'bold', backgroundColor: 'background.paper', display: { xs: 'none', md: 'table-cell' } }}
                        >
                          Phone
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 'bold', backgroundColor: 'background.paper', display: { xs: 'none', md: 'table-cell' } }}
                        >
                          Created
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow
                          key={user.id}
                          hover
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            transition: 'all 0.2s'
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar sx={{ bgcolor: '#9c27b0', boxShadow: 1 }}>
                                {getInitials(user.name)}
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">{user.name}</Typography>
                                <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getRoleDisplay(user.role)}
                              color={getRoleColor(user.role)}
                              size="small"
                              icon={getRoleIcon(user.role)}
                              sx={{ boxShadow: 1 }}
                            />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            <Typography variant="body2" color="text.secondary">
                              {user.phoneNumber || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            <Typography variant="body2" color="text.secondary">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Tooltip title="Change Role">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowRoleModal(true);
                                  }}
                                  sx={{ boxShadow: 1, borderRadius: 1 }}
                                >
                                  <Shield fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete User">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowDeleteConfirm(true);
                                  }}
                                  sx={{ color: 'error.main', boxShadow: 1, borderRadius: 1 }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                />
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ p: getResponsiveValue(1, 2, 3, 3, 3) }}>
            <Alert severity="info" sx={{ mb: 3, boxShadow: 1, borderRadius: 2 }}>
              <AlertTitle>Role Hierarchy</AlertTitle>
              Admin → Leader → User → Registrant
            </Alert>
            <Grid container spacing={cardSpacing}>
              {roles.map((role, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Card sx={cardStyles}>
                    <CardContent sx={{ p: getResponsiveValue(2, 2, 3, 3, 3) }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: `${getRoleColor(role.name)}.main`,
                            width: 48,
                            height: 48,
                            boxShadow: 2
                          }}
                        >
                          {getRoleIcon(role.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {getRoleDisplay(role.name)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getRoleCount(role.name)} users
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {role.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ p: getResponsiveValue(1, 2, 3, 3, 3) }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Recent Activity</Typography>
              <Chip
                icon={<History />}
                label={`${activityLog.length} events`}
                size="small"
                variant="outlined"
                sx={{ boxShadow: 1 }}
              />
            </Stack>
            {activityLog.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <History sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No activity yet</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  maxHeight: 500,
                  overflowY: "auto",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  p: 1
                }}
              >
                <List>
                  {activityLog.map((log, idx) => (
                    <React.Fragment key={log.id}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {log.details}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {log.action} • {new Date(log.timestamp).toLocaleString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {idx < activityLog.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <Dialog
        open={showAddUserModal}
        onClose={() => !creatingUser && setShowAddUserModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            boxShadow: 6,
            borderRadius: 2,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            m: getResponsiveValue(1, 2, 3, 4, 4)
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
          color: 'white',
          py: 2
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Add New User</Typography>
            <IconButton
              onClick={() => setShowAddUserModal(false)}
              disabled={creatingUser}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: getResponsiveValue(1, 2, 3, 3, 3) }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                name="name"
                value={newUser.name}
                onChange={(e) => { setNewUser({ ...newUser, name: e.target.value }); setFormErrors({ ...formErrors, name: '' }); }}
                fullWidth
                size="small"
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={creatingUser}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Surname"
                name="surname"
                value={newUser.surname}
                onChange={(e) => { setNewUser({ ...newUser, surname: e.target.value }); setFormErrors({ ...formErrors, surname: '' }); }}
                fullWidth
                size="small"
                error={!!formErrors.surname}
                helperText={formErrors.surname}
                disabled={creatingUser}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of Birth"
                type="date"
                name="date_of_birth"
                value={newUser.date_of_birth}
                onChange={(e) => { setNewUser({ ...newUser, date_of_birth: e.target.value }); setFormErrors({ ...formErrors, date_of_birth: '' }); }}
                fullWidth
                size="small"
                error={!!formErrors.date_of_birth}
                helperText={formErrors.date_of_birth}
                disabled={creatingUser}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Gender"
                name="gender"
                select
                value={newUser.gender}
                onChange={(e) => { setNewUser({ ...newUser, gender: e.target.value }); setFormErrors({ ...formErrors, gender: '' }); }}
                fullWidth
                size="small"
                error={!!formErrors.gender}
                helperText={formErrors.gender}
                disabled={creatingUser}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Home Address"
                name="address"
                value={newUser.address}
                onChange={(e) => { setNewUser({ ...newUser, address: e.target.value }); setFormErrors({ ...formErrors, address: '' }); }}
                fullWidth
                size="small"
                error={!!formErrors.address}
                helperText={formErrors.address}
                disabled={creatingUser}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                type="email"
                name="email"
                value={newUser.email}
                onChange={(e) => { setNewUser({ ...newUser, email: e.target.value }); setFormErrors({ ...formErrors, email: '' }); }}
                fullWidth
                size="small"
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={creatingUser}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                name="phone_number"
                value={newUser.phone_number}
                onChange={(e) => { setNewUser({ ...newUser, phone_number: e.target.value }); setFormErrors({ ...formErrors, phone_number: '' }); }}
                fullWidth
                size="small"
                error={!!formErrors.phone_number}
                helperText={formErrors.phone_number}
                disabled={creatingUser}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                disabled={creatingUser}
                options={peopleOptions}
                getOptionLabel={(option) => typeof option === "string" ? option : option.label}
                value={peopleOptions.find(option => option.label === newUser.invitedBy) || null}
                onChange={(e, newValue) => handleInvitedByChange(newValue)}
                onInputChange={(e, newInputValue, reason) => {
                  if (reason === "input") {
                    setNewUser(prev => ({ ...prev, invitedBy: newInputValue }));
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Invited By"
                    size="small"
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                type="password"
                name="password"
                value={newUser.password}
                onChange={(e) => { setNewUser({ ...newUser, password: e.target.value }); setFormErrors({ ...formErrors, password: '' }); }}
                fullWidth
                size="small"
                error={!!formErrors.password}
                helperText={formErrors.password}
                disabled={creatingUser}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Role"
                name="role"
                select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                fullWidth
                size="small"
                disabled={creatingUser}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="leader">Leader</MenuItem>
                <MenuItem value="registrant">Registrant</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Grid>

            {(newUser.leader12 || newUser.leader144 || newUser.leader1728) && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2 }}>
                  Leader Information (Auto-populated)
                </Typography>
                <Grid container spacing={2}>
                  {newUser.leader12 && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Leader @12"
                        value={newUser.leader12}
                        fullWidth
                        size="small"
                        disabled
                        InputProps={{ readOnly: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                      />
                    </Grid>
                  )}
                  {newUser.leader144 && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Leader @144"
                        value={newUser.leader144}
                        fullWidth
                        size="small"
                        disabled
                        InputProps={{ readOnly: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                      />
                    </Grid>
                  )}
                  {newUser.leader1728 && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Leader @1728"
                        value={newUser.leader1728}
                        fullWidth
                        size="small"
                        disabled
                        InputProps={{ readOnly: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: getResponsiveValue(1, 2, 3, 3, 3), gap: 1 }}>
          <Button
            onClick={() => setShowAddUserModal(false)}
            disabled={creatingUser}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={creatingUser}
            sx={{ borderRadius: 2, px: 4 }}
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
          >
            {creatingUser ? <CircularProgress size={20} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showRoleModal}
        onClose={() => !updatingRole && setShowRoleModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            boxShadow: 6,
            borderRadius: 2,
            m: getResponsiveValue(1, 2, 3, 4, 4)
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', py: 2 }}>Change User Role</DialogTitle>
        <DialogContent sx={{ p: getResponsiveValue(1, 2, 3, 3, 3) }}>
          {selectedUser && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                User: <strong>{selectedUser.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current Role: <Chip label={getRoleDisplay(selectedUser.role)} color={getRoleColor(selectedUser.role)} size="small" />
              </Typography>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Select New Role:</Typography>
              <Stack spacing={1}>
                {['admin', 'leader', 'user', 'registrant'].map(roleName => (
                  <Paper
                    key={roleName}
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: updatingRole ? 'not-allowed' : 'pointer',
                      border: selectedUser.role === roleName ? 2 : 1,
                      borderColor: selectedUser.role === roleName ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      boxShadow: 1,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: updatingRole ? 'divider' : 'primary.main',
                        bgcolor: updatingRole ? 'inherit' : 'action.hover',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => !updatingRole && handleRoleChange(selectedUser.id, roleName)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, bgcolor: `${getRoleColor(roleName)}.main` }}>
                          {getRoleIcon(roleName)}
                        </Avatar>
                        <Typography variant="body1" fontWeight="medium">{getRoleDisplay(roleName)}</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{getRoleCount(roleName)} users</Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowRoleModal(false)}
            disabled={updatingRole}
            sx={{ borderRadius: 1 }}
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
          >
            {updatingRole ? 'Updating...' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => !deletingUser && setShowDeleteConfirm(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            boxShadow: 6,
            borderRadius: 2,
            m: getResponsiveValue(1, 2, 3, 4, 4)
          }
        }}
      >
        <DialogTitle sx={{ py: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="error">Delete User</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: getResponsiveValue(1, 2, 3, 3, 3) }}>
          {selectedUser && (
            <>
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
                <AlertTitle>Warning</AlertTitle>
                This action cannot be undone!
              </Alert>
              <Typography variant="body1">
                Are you sure you want to delete <strong>{selectedUser.name}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Email: {selectedUser.email}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={deletingUser}
            variant="outlined"
            sx={{ borderRadius: 1 }}
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            disabled={deletingUser}
            startIcon={deletingUser ? <CircularProgress size={16} /> : <Delete />}
            sx={{ borderRadius: 1 }}
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
          >
            {deletingUser ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

      <Fab
        color="primary"
        aria-label="add"
        onClick={handleFabClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: 3,
          '&:hover': { boxShadow: 6 }
        }}
        size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
      >
        <AddIcon />
      </Fab>
      <Menu
        anchorEl={showFabMenu}
        open={Boolean(showFabMenu)}
        onClose={handleFabMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleFabMenuSelect('user')}>
          <PersonAdd sx={{ mr: 1 }} /> Add User
        </MenuItem>
        <MenuItem onClick={() => handleFabMenuSelect('eventType')}>
          <EventIcon sx={{ mr: 1 }} /> Create Event Type
        </MenuItem>
      </Menu>
     <EventTypesModal
  open={showEventTypesModal}
  onClose={() => {
    setShowEventTypesModal(false);
    setSelectedEventType(null); 
    
  }}
  onSubmit={handleCreateOrUpdateEventType} 
  selectedEventType={selectedEventType}    
  setSelectedEventTypeObj={setSelectedEventType}
/>

    </Box>
  );
}