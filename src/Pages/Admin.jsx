import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { AuthContext } from "../contexts/AuthContext";
import {
  Box, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Tabs, Tab,
  InputAdornment, CircularProgress, Tooltip, Stack, Divider, List,
  ListItem, ListItemText, useTheme, Fab, TablePagination, useMediaQuery,
  Skeleton, Alert, AlertTitle
} from '@mui/material';
import {
  Search, Delete, Shield, Refresh, People,
  AdminPanelSettings, History, Person as PersonIcon,
  HowToReg as RegistrantIcon, Add as AddIcon
} from '@mui/icons-material';
import NewUserModal from '../components/NewUserModal';

let globalUsersData = null;
let globalDataLoaded = false;

export default function AdminDashboard() {
  const theme = useTheme();
  const { authFetch, isRefreshingToken } = useContext(AuthContext);
  
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
  const cardSpacing = getResponsiveValue(1, 2, 2, 3, 3);

  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(!globalDataLoaded);
  
  const [users, setUsers] = useState(globalUsersData || []);
  const [activityLog, setActivityLog] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [roles] = useState([
    { name: 'admin', description: 'Full system access' },
    { name: 'leader', description: 'Group leaders managing cells' },
    { name: 'leaderAt12', description: 'Leaders at 12 level - can view cells under them' },
    { name: 'user', description: 'Regular members' },
    { name: 'registrant', description: 'Event check-in volunteers' }
  ]);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  const initialLoadRef = useRef(true);
  const fetchInProgressRef = useRef(false);

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

  const fetchAllData = useCallback(async (forceRefresh = false) => {
    if (globalDataLoaded && !forceRefresh) {
      setUsers(globalUsersData);
      setLoading(false);
      fetchInProgressRef.current = false;
      return;
    }

    if (isRefreshingToken) {
      fetchInProgressRef.current = false;
      return;
    }

    fetchInProgressRef.current = true;
    setLoading(true);
    
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.users && Array.isArray(data.users)) {
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

        globalUsersData = transformedUsers;
        globalDataLoaded = true;

        setUsers(transformedUsers);
        addActivityLog('DATA_REFRESH', 'User data refreshed successfully');
      } else {
        console.error('Invalid response format:', data);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [API_BASE_URL, authFetch, isRefreshingToken]);

  const handleManualRefresh = useCallback(async () => {
    await fetchAllData(true);
  }, [fetchAllData]);

  useEffect(() => {
    if (!globalDataLoaded && !isRefreshingToken) {
      fetchAllData();
    } else {
      setUsers(globalUsersData);
      setLoading(false);
    }
    
    initialLoadRef.current = false;
  }, [fetchAllData, isRefreshingToken]);

  useEffect(() => {
    if (isRefreshingToken) {
      setLoading(true);
    } else if (initialLoadRef.current === false && !globalDataLoaded) {
      fetchAllData();
    } else if (globalDataLoaded) {
      setLoading(false);
    }
  }, [isRefreshingToken, fetchAllData]);

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

  const handleCreateUser = async (userData) => {
    setCreatingUser(true);
    
    try {
      if (isRefreshingToken) {
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!isRefreshingToken) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      }

      const payload = {
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        password: userData.password,
        phone_number: userData.phone_number,
        date_of_birth: userData.date_of_birth,
        address: userData.address,
        gender: userData.gender,
        invitedBy: userData.invitedBy,
        leader12: userData.leader12,
        leader144: userData.leader144,
        leader1728: userData.leader1728,
        stage: userData.stage || 'Win',
        role: userData.role
      };

      const response = await authFetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.ok) {
        addActivityLog('USER_CREATED', `Created new user: ${userData.name} ${userData.surname} (${userData.role})`);
        setShowAddUserModal(false);
        
        globalDataLoaded = false;
        await fetchAllData(true);
      }
      
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
      const response = await authFetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user role');
      }

      const user = users.find(u => u.id === userId);
      addActivityLog('ROLE_UPDATED', `Updated ${user?.name}'s role to ${newRole}`);

      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      
      setUsers(updatedUsers);
      globalUsersData = updatedUsers;
      
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
      if (isRefreshingToken) {
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (!isRefreshingToken) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);
        });
      }

      const response = await authFetch(`${API_BASE_URL}/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        addActivityLog('USER_DELETED', `Deleted user: ${selectedUser.name}`);
        
        const updatedUsers = users.filter(user => user.id !== selectedUser.id);
        
        setUsers(updatedUsers);
        globalUsersData = updatedUsers;
        
        setShowDeleteConfirm(false);
        setSelectedUser(null);
      }
      
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingUser(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = { 
      admin: 'error', 
      leader: 'primary', 
      leaderAt12: 'secondary',
      user: 'success', 
      registrant: 'warning' 
    };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role) => {
    const icons = { 
      admin: <Shield />, 
      leader: <AdminPanelSettings />, 
      leaderAt12: <People />,
      user: <PersonIcon />, 
      registrant: <RegistrantIcon /> 
    };
    return icons[role] || <PersonIcon />;
  };

  const getRoleDisplay = (role) => role.charAt(0).toUpperCase() + role.slice(1);
  const getInitials = (name) => name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filterKey = `${normalizedSearch}|${selectedRole}`;

  const filteredUsers = useMemo(() => users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  })
   .sort((a, b) => a.name.localeCompare(b.name)), // This line ensures that the user's names appear in alphabetical order 
   [users, searchTerm, selectedRole]);


  // Resets pagination to first page whenever filters change(searchTerm & selectedRole)
//     useEffect(() => {
//     setPage(0);
// }, [searchTerm, selectedRole]);

const pageMemoryRef = useRef({}); //memory store , does not cause reRenders
const prevFilterKeyRef = useRef(filterKey);

useEffect(() => {
  const prevKey = prevFilterKeyRef.current;

  if (prevKey !== filterKey) {
    // Saves page for the filter we are leaving
    pageMemoryRef.current[prevKey] = page;
    prevFilterKeyRef.current = filterKey;
  }
}, [filterKey, page]);

useEffect(() => {
  const rememberedPage = pageMemoryRef.current[filterKey] ?? 0;
  setPage(rememberedPage);
}, [filterKey]);
const handlePageChange = (event, newPage) => {
  setPage(newPage);
  pageMemoryRef.current[filterKey] = newPage;
};
useEffect(() => {
  const maxPage = Math.max(
    0,
    Math.ceil(filteredUsers.length / rowsPerPage) - 1
  );

  if (page > maxPage) {
    setPage(maxPage);
    pageMemoryRef.current[filterKey] = maxPage;
  }
}, [filteredUsers.length, rowsPerPage, page, filterKey]);
const paginatedUsers = useMemo(() => {
  const start = page * rowsPerPage;
  return filteredUsers.slice(start, start + rowsPerPage);
}, [filteredUsers, page, rowsPerPage]);

  // const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getRoleCount = (roleName) => users.filter(u => u.role === roleName).length;

  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeToday: users.filter(u => u.status === 'active').length,
    admins: getRoleCount('admin'),
    leaders: getRoleCount('leader'),
    leaderAt12: getRoleCount('leaderAt12'),
    registrants: getRoleCount('registrant'),
    regularUsers: getRoleCount('user')
  }), [users]);

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

  const shouldShowLoading = loading || (isRefreshingToken && !globalDataLoaded);

  if (shouldShowLoading) {
    return (
      <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: getResponsiveValue(2, 3, 4, 5, 5), minHeight: "100vh" }}>
        <Skeleton 
          variant="text" 
          width="40%" 
          height={getResponsiveValue(32, 40, 48, 56, 56)} 
          sx={{ mx: 'auto', mb: cardSpacing }} 
        />

        <Grid container spacing={cardSpacing} mb={cardSpacing}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
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

  return (
    <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: getResponsiveValue(2, 3, 4, 5, 5), minHeight: "100vh" }}>
      <Grid container spacing={cardSpacing} sx={{ mb: cardSpacing }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: <People />, color: '#2196f3' },
          { label: 'Administrators', value: stats.admins, icon: <Shield />, color: '#f44336' },
          { label: 'Leaders', value: stats.leaders, icon: <AdminPanelSettings />, color: '#9c27b0' },
          { label: 'Leaders at 12', value: stats.leaderAt12, icon: <People />, color: '#4caf50' },
          { label: 'Registrants', value: stats.registrants, icon: <RegistrantIcon />, color: '#ff9800' },
          { label: 'Regular Users', value: stats.regularUsers, icon: <PersonIcon />, color: '#607d8b' }
        ].map((stat, index) => (
          <Grid item xs={6} sm={4} md={2} key={index}>
            <Card sx={cardStyles}>
              <CardContent sx={{ textAlign: 'center', flexGrow: 1, p: getResponsiveValue(1.5, 2, 2.5, 3, 3) }}>
                <Avatar sx={{ 
                  bgcolor: stat.color, 
                  width: getResponsiveValue(40, 48, 56, 64, 64), 
                  height: getResponsiveValue(40, 48, 56, 64, 64), 
                  mb: 2, 
                  mx: 'auto', 
                  boxShadow: 2 
                }}>
                  {stat.icon}
                </Avatar>
                <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight="bold" color="text.primary">
                  {stat.value}
                </Typography>
                <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary" sx={{ mt: 1 }}>
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          display: 'flex', 
          flexDirection: getResponsiveValue('column', 'column', 'row', 'row', 'row'),
          justifyContent: 'space-between', 
          alignItems: getResponsiveValue('stretch', 'stretch', 'center', 'center', 'center'),
          p: 2,
          gap: getResponsiveValue(2, 2, 0, 0, 0)
        }}>
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
            onClick={handleManualRefresh}
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
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: 1,
                    borderRadius: 1,
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '& input': {
                      backgroundColor: 'transparent !important',
                      '&:-webkit-autofill': {
                        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
                        WebkitTextFillColor: `${theme.palette.text.primary} !important`,
                        caretColor: `${theme.palette.text.primary} !important`,
                        borderRadius: '4px',
                      },
                    },
                  },
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
                  <MenuItem value="leaderAt12">Leader at 12</MenuItem>
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
                  {paginatedUsers.map(user => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </Box>
                <TablePagination 
                  component="div" 
                  count={filteredUsers.length} 
                  page={page} 
                  onPageChange={(e, newPage) => setPage(newPage)} 
                  rowsPerPage={rowsPerPage} 
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
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
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper', display: { xs: 'none', md: 'table-cell' } }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper', display: { xs: 'none', md: 'table-cell' } }}>Created</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedUsers.map(user => (
                        <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'all 0.2s' }}>
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
                            <Typography variant="body2" color="text.secondary">{user.phoneNumber || 'N/A'}</Typography>
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
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
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
              Admin → Leader → Leader at 12 → User → Registrant
            </Alert>
            
            <Grid container spacing={cardSpacing}>
              {roles.map((role, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Card sx={cardStyles}>
                    <CardContent sx={{ p: getResponsiveValue(2, 2, 3, 3, 3) }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: `${getRoleColor(role.name)}.main`, 
                          width: 48, 
                          height: 48,
                          boxShadow: 2
                        }}>
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

      <NewUserModal
        open={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserCreated={handleCreateUser}
        loading={creatingUser}
      />

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
                {['admin', 'leader', 'leaderAt12', 'user', 'registrant'].map(roleName => (
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
        aria-label="add user"
        onClick={() => setShowAddUserModal(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: 3,
          '&:hover': {
            boxShadow: 6
          }
        }}
        size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}