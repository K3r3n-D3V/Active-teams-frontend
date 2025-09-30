import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  InputAdornment,
  CircularProgress,
  Alert,
  AlertTitle,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Search,
  PersonAdd,
  Edit,
  Delete,
  Shield,
  Refresh,
  People,
  TrendingUp,
  AdminPanelSettings,
  Circle,
  Close,
  History
} from '@mui/icons-material';

export default function AdminDashboard() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    phone_number: '',
    date_of_birth: '',
    role: 'user'
  });

  const [roles, setRoles] = useState([
    { 
      name: 'admin', 
      description: 'Full system access', 
      permissions: {
        'manage_users': true,
        'manage_leaders': true,
        'manage_events': true,
        'view_reports': true,
        'system_settings': true
      }
    },
    { 
      name: 'leader', 
      description: 'Group leaders managing cells', 
      permissions: {
        'manage_users': false,
        'manage_leaders': false,
        'manage_events': true,
        'view_reports': true,
        'system_settings': false
      }
    },
    { 
      name: 'user', 
      description: 'Regular members', 
      permissions: {
        'manage_users': false,
        'manage_leaders': false,
        'manage_events': false,
        'view_reports': false,
        'system_settings': false
      }
    },
    { 
      name: 'registrant', 
      description: 'Event check-in volunteers', 
      permissions: {
        'manage_users': false,
        'manage_leaders': false,
        'manage_events': true,
        'view_reports': false,
        'system_settings': false
      }
    }
  ]);

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchAllData();
  }, []);

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

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in as an admin to access this page.');
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Admin access required. You must be logged in as an administrator to access this dashboard.');
        }
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

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.surname || !newUser.email || !newUser.password) {
      alert('Please fill in all required fields');
      return;
    }

    setCreatingUser(true);
    
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user');
      }

      const createdUser = await response.json();
      
      addActivityLog('USER_CREATED', `Created new user: ${newUser.name} ${newUser.surname} (${newUser.role})`);
      
      setNewUser({
        name: '',
        surname: '',
        email: '',
        password: '',
        phone_number: '',
        date_of_birth: '',
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
      addActivityLog('ROLE_UPDATED', `Updated ${user?.name}'s role from ${user?.role} to ${newRole}`);

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

  const handlePermissionToggle = async (roleName, permission) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/admin/roles/${roleName}/permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          permission,
          enabled: !roles.find(r => r.name === roleName).permissions[permission]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update permission');
      }

      setRoles(roles.map(role => {
        if (role.name === roleName) {
          return {
            ...role,
            permissions: {
              ...role.permissions,
              [permission]: !role.permissions[permission]
            }
          };
        }
        return role;
      }));

      addActivityLog('PERMISSION_UPDATED', `Updated ${permission} for ${roleName} role`);
      
    } catch (err) {
      console.error('Error updating permission:', err);
      alert(err.message);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      leader: 'primary',
      user: 'success',
      registrant: 'warning'
    };
    return colors[role] || 'default';
  };

  const getRoleDisplay = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
    const isAuthError = error.includes('token') || error.includes('Authentication') || error.includes('Admin access');
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5', p: 3 }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <AdminPanelSettings sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {isAuthError ? 'Authentication Required' : 'Error Loading Data'}
            </Typography>
          </Box>
          
          <Alert severity={isAuthError ? 'warning' : 'error'} sx={{ mb: 3 }}>
            <AlertTitle>{isAuthError ? 'Admin Access Required' : 'Error'}</AlertTitle>
            {error}
          </Alert>
          
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={fetchAllData}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pt: 3 }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            User Management
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchAllData}
          >
            Refresh
          </Button>
        </Stack>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Avatar sx={{ bgcolor: '#2196f3', width: 56, height: 56 }}>
                    <People />
                  </Avatar>
                </Stack>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Avatar sx={{ bgcolor: '#4caf50', width: 56, height: 56 }}>
                    <TrendingUp />
                  </Avatar>
                </Stack>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {stats.activeToday}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Avatar sx={{ bgcolor: '#f44336', width: 56, height: 56 }}>
                    <Shield />
                  </Avatar>
                </Stack>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {stats.admins}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administrators
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Avatar sx={{ bgcolor: '#9c27b0', width: 56, height: 56 }}>
                    <AdminPanelSettings />
                  </Avatar>
                </Stack>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {stats.leaders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Leaders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Users" />
            <Tab label="Roles & Permissions" />
            <Tab label="Activity Log" />
          </Tabs>

          {activeTab === 0 && (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl sx={{ minWidth: { xs: '100%', md: 200 } }}>
                  <InputLabel>Filter Role</InputLabel>
                  <Select
                    value={selectedRole}
                    label="Filter Role"
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="leader">Leader</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="registrant">Registrant</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  startIcon={<PersonAdd />}
                  onClick={() => setShowAddUserModal(true)}
                  sx={{ minWidth: { xs: '100%', md: 150 } }}
                >
                  Add User
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider', gap: 1 }}>
                {roles.map((role, idx) => (
                  <Chip
                    key={idx}
                    icon={<Circle />}
                    label={`${getRoleDisplay(role.name)} (${getRoleCount(role.name)})`}
                    color={getRoleColor(role.name)}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>

              <TableContainer sx={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
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
                            <Avatar sx={{ bgcolor: '#9c27b0' }}>
                              {getInitials(user.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {user.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getRoleDisplay(user.role)}
                            color={getRoleColor(user.role)}
                            size="small"
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
                          <Tooltip title="Change Role">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRoleModal(true);
                              }}
                              sx={{ color: 'primary.main' }}
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
                              sx={{ color: 'error.main' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsers.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No users found
                    </Typography>
                  </Box>
                )}
              </TableContainer>
            </Box>
          )}

          {activeTab === 1 && (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
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
                        <Divider sx={{ mb: 2 }} />

                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                          Permissions:
                        </Typography>
                        <Stack spacing={0.5}>
                          {Object.entries(role.permissions).map(([key, value]) => (
                            <FormControlLabel
                              key={key}
                              control={
                                <Checkbox 
                                  checked={value} 
                                  size="small"
                                  onChange={() => handlePermissionToggle(role.name, key)}
                                />
                              }
                              label={
                                <Typography variant="body2">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Typography>
                              }
                            />
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {activeTab === 2 && (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Activity
                </Typography>
                <Chip 
                  icon={<History />}
                  label={`${activityLog.length} events`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              
              {activityLog.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <History sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No activity yet
                  </Typography>
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

      {/* Add User Modal */}
      <Dialog 
        open={showAddUserModal} 
        onClose={() => !creatingUser && setShowAddUserModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">Add New User</Typography>
            <IconButton onClick={() => setShowAddUserModal(false)} disabled={creatingUser}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="First Name"
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              required
            />
            <TextField
              fullWidth
              label="Last Name"
              value={newUser.surname}
              onChange={(e) => setNewUser({...newUser, surname: e.target.value})}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={newUser.phone_number}
              onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
            />
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={newUser.date_of_birth}
              onChange={(e) => setNewUser({...newUser, date_of_birth: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                label="Role"
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="leader">Leader</MenuItem>
                <MenuItem value="registrant">Registrant</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setShowAddUserModal(false)}
            disabled={creatingUser}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateUser}
            disabled={creatingUser}
          >
            {creatingUser ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Change Modal */}
      <Dialog 
        open={showRoleModal} 
        onClose={() => !updatingRole && setShowRoleModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                User: <strong>{selectedUser.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current Role: <Chip 
                  label={getRoleDisplay(selectedUser.role)}
                  color={getRoleColor(selectedUser.role)}
                  size="small"
                />
              </Typography>
              
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                Select New Role:
              </Typography>
              
              <Stack spacing={1} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {['admin', 'leader', 'user', 'registrant'].map(roleName => (
                  <Paper
                    key={roleName}
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      cursor: updatingRole ? 'not-allowed' : 'pointer',
                      border: selectedUser.role === roleName ? 2 : 1,
                      borderColor: selectedUser.role === roleName ? 'primary.main' : 'divider',
                      '&:hover': { 
                        borderColor: updatingRole ? 'divider' : 'primary.main',
                        bgcolor: updatingRole ? 'inherit' : 'action.hover'
                      }
                    }}
                    onClick={() => !updatingRole && handleRoleChange(selectedUser.id, roleName)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Circle 
                          fontSize="small" 
                          color={getRoleColor(roleName)}
                        />
                        <Typography variant="body1" fontWeight="medium">
                          {getRoleDisplay(roleName)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {getRoleCount(roleName)} users
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowRoleModal(false)}
            disabled={updatingRole}
          >
            {updatingRole ? 'Updating...' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog 
        open={showDeleteConfirm} 
        onClose={() => !deletingUser && setShowDeleteConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold" color="error">
            Delete User
          </Typography>
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
          <Button 
            onClick={() => setShowDeleteConfirm(false)}
            disabled={deletingUser}
          >
            Cancel
          </Button>
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