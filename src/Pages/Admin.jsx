import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Tabs, Tab,
  InputAdornment, CircularProgress, Alert, AlertTitle, Checkbox,
  FormControlLabel, Tooltip, Stack, Divider, List, ListItem, ListItemText,
  Autocomplete, useTheme
} from '@mui/material';
import {
  Search, PersonAdd, Edit, Delete, Shield, Refresh, People, TrendingUp,
  AdminPanelSettings, Circle, Close, History, Person as PersonIcon,
  CalendarToday as CalendarIcon, Home as HomeIcon, Email as EmailIcon,
  Phone as PhoneIcon, Wc as GenderIcon
} from '@mui/icons-material';

export default function AdminDashboard() {
  const theme = useTheme();
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

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (showAddUserModal) {
      fetchPeopleList();
    }
  }, [showAddUserModal]);

  const addActivityLog = (action, details) => {
    const newLog = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user: 'Current Admin'
    };
    setActivityLog(prev => [newLog, ...prev].slice(0, 50));
  };

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

  const fetchAllData = async () => {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user');
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
      fetchAllData();
      
    } catch (err) {
      console.error('Error creating user:', err);
      alert(err.message);
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

  const getRoleDisplay = (role) => role.charAt(0).toUpperCase() + role.slice(1);
  const getInitials = (name) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleCount = (roleName) => users.filter(u => u.role === roleName).length;

  const stats = {
    totalUsers: users.length,
    activeToday: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'admin').length,
    leaders: users.filter(u => u.role === 'leader').length
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Loading dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5', p: 3 }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
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

  const peopleOptions = peopleList.map(person => ({
    label: `${person.Name || ""} ${person.Surname || ""}`.trim(),
    person
  }));

  return (
    <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5', minHeight: '100vh', pt: 3 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">User Management</Typography>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAllData}>Refresh</Button>
        </Stack>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Avatar sx={{ bgcolor: '#2196f3', width: 56, height: 56, mb: 2 }}><People /></Avatar>
              <Typography variant="h4" fontWeight="bold">{stats.totalUsers}</Typography>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Avatar sx={{ bgcolor: '#4caf50', width: 56, height: 56, mb: 2 }}><TrendingUp /></Avatar>
              <Typography variant="h4" fontWeight="bold">{stats.activeToday}</Typography>
              <Typography variant="body2" color="text.secondary">Active Users</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Avatar sx={{ bgcolor: '#f44336', width: 56, height: 56, mb: 2 }}><Shield /></Avatar>
              <Typography variant="h4" fontWeight="bold">{stats.admins}</Typography>
              <Typography variant="body2" color="text.secondary">Administrators</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card><CardContent>
              <Avatar sx={{ bgcolor: '#9c27b0', width: 56, height: 56, mb: 2 }}><AdminPanelSettings /></Avatar>
              <Typography variant="h4" fontWeight="bold">{stats.leaders}</Typography>
              <Typography variant="body2" color="text.secondary">Leaders</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Paper>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Users" />
            <Tab label="Roles & Permissions" />
            <Tab label="Activity Log" />
          </Tabs>

          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                />
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filter Role</InputLabel>
                  <Select value={selectedRole} label="Filter Role" onChange={(e) => setSelectedRole(e.target.value)}>
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="leader">Leader</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="registrant">Registrant</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setShowAddUserModal(true)} sx={{ minWidth: 150 }}>
                  Add User
                </Button>
              </Stack>

              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Phone</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: '#9c27b0' }}>{getInitials(user.name)}</Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">{user.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell><Chip label={getRoleDisplay(user.role)} color={getRoleColor(user.role)} size="small" /></TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2" color="text.secondary">{user.phoneNumber || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2" color="text.secondary">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Change Role">
                            <IconButton size="small" onClick={() => { setSelectedUser(user); setShowRoleModal(true); }}>
                              <Shield fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton size="small" onClick={() => { setSelectedUser(user); setShowDeleteConfirm(true); }} sx={{ color: 'error.main' }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Role Hierarchy</AlertTitle>
                Admin → Leader → User → Registrant
              </Alert>
              
              <Grid container spacing={3}>
                {roles.map((role, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Avatar sx={{ bgcolor: `${getRoleColor(role.name)}.main`, width: 48, height: 48 }}>
                            <Shield />
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

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
            <Box sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">Recent Activity</Typography>
                <Chip icon={<History />} label={`${activityLog.length} events`} size="small" variant="outlined" />
              </Stack>
              {activityLog.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <History sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">No activity yet</Typography>
                </Box>
              ) : (
                <List>
                  {activityLog.map((log, idx) => (
                    <React.Fragment key={log.id}>
                      <ListItem>
                        <ListItemText
                          primary={log.details}
                          secondary={`${log.action} • ${new Date(log.timestamp).toLocaleString()}`}
                        />
                      </ListItem>
                      {idx < activityLog.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Paper>
      </Container>

      {/* Add User Modal - Enhanced Version */}
      <Dialog open={showAddUserModal} onClose={() => !creatingUser && setShowAddUserModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Add New User</Typography>
            <IconButton onClick={() => setShowAddUserModal(false)} disabled={creatingUser}><Close /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              name="name"
              value={newUser.name}
              onChange={(e) => { setNewUser({...newUser, name: e.target.value}); setFormErrors({...formErrors, name: ''}); }}
              fullWidth
              size="small"
              error={!!formErrors.name}
              helperText={formErrors.name}
              disabled={creatingUser}
            />
            <TextField
              label="Surname"
              name="surname"
              value={newUser.surname}
              onChange={(e) => { setNewUser({...newUser, surname: e.target.value}); setFormErrors({...formErrors, surname: ''}); }}
              fullWidth
              size="small"
              error={!!formErrors.surname}
              helperText={formErrors.surname}
              disabled={creatingUser}
            />
            <TextField
              label="Date of Birth"
              type="date"
              name="date_of_birth"
              value={newUser.date_of_birth}
              onChange={(e) => { setNewUser({...newUser, date_of_birth: e.target.value}); setFormErrors({...formErrors, date_of_birth: ''}); }}
              fullWidth
              size="small"
              error={!!formErrors.date_of_birth}
              helperText={formErrors.date_of_birth}
              disabled={creatingUser}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Home Address"
              name="address"
              value={newUser.address}
              onChange={(e) => { setNewUser({...newUser, address: e.target.value}); setFormErrors({...formErrors, address: ''}); }}
              fullWidth
              size="small"
              error={!!formErrors.address}
              helperText={formErrors.address}
              disabled={creatingUser}
            />
            <TextField
              label="Email Address"
              type="email"
              name="email"
              value={newUser.email}
              onChange={(e) => { setNewUser({...newUser, email: e.target.value}); setFormErrors({...formErrors, email: ''}); }}
              fullWidth
              size="small"
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={creatingUser}
            />
            <TextField
              label="Phone Number"
              name="phone_number"
              value={newUser.phone_number}
              onChange={(e) => { setNewUser({...newUser, phone_number: e.target.value}); setFormErrors({...formErrors, phone_number: ''}); }}
              fullWidth
              size="small"
              error={!!formErrors.phone_number}
              helperText={formErrors.phone_number}
              disabled={creatingUser}
            />
            <TextField
              label="Gender"
              name="gender"
              select
              value={newUser.gender}
              onChange={(e) => { setNewUser({...newUser, gender: e.target.value}); setFormErrors({...formErrors, gender: ''}); }}
              fullWidth
              size="small"
              error={!!formErrors.gender}
              helperText={formErrors.gender}
              disabled={creatingUser}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
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
                />
              )}
            />

            <Divider sx={{ my: 1 }} />
            
            <TextField
              label="Password"
              type="password"
              name="password"
              value={newUser.password}
              onChange={(e) => { setNewUser({...newUser, password: e.target.value}); setFormErrors({...formErrors, password: ''}); }}
              fullWidth
              size="small"
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={creatingUser}
            />
            <TextField
              label="Role"
              name="role"
              select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              fullWidth
              size="small"
              disabled={creatingUser}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="leader">Leader</MenuItem>
              <MenuItem value="registrant">Registrant</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            {(newUser.leader12 || newUser.leader144 || newUser.leader1728) && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Leader Information (Auto-populated)
                </Typography>
                {newUser.leader12 && (
                  <TextField
                    label="Leader @12"
                    value={newUser.leader12}
                    fullWidth
                    size="small"
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                )}
                {newUser.leader144 && (
                  <TextField
                    label="Leader @144"
                    value={newUser.leader144}
                    fullWidth
                    size="small"
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                )}
                {newUser.leader1728 && (
                  <TextField
                    label="Leader @1728"
                    value={newUser.leader1728}
                    fullWidth
                    size="small"
                    disabled
                    InputProps={{ readOnly: true }}
                  />
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowAddUserModal(false)} disabled={creatingUser}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateUser} disabled={creatingUser}>
            {creatingUser ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Change Modal */}
      <Dialog open={showRoleModal} onClose={() => !updatingRole && setShowRoleModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
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
                      '&:hover': { borderColor: updatingRole ? 'divider' : 'primary.main', bgcolor: updatingRole ? 'inherit' : 'action.hover' }
                    }}
                    onClick={() => !updatingRole && handleRoleChange(selectedUser.id, roleName)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Circle fontSize="small" color={getRoleColor(roleName)} />
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
        <DialogActions>
          <Button onClick={() => setShowRoleModal(false)} disabled={updatingRole}>
            {updatingRole ? 'Updating...' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onClose={() => !deletingUser && setShowDeleteConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold" color="error">Delete User</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
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
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowDeleteConfirm(false)} disabled={deletingUser}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteUser}
            disabled={deletingUser}
            startIcon={deletingUser ? <CircularProgress size={16} /> : <Delete />}
          >
            {deletingUser ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}