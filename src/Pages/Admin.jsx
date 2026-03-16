import React, { useState, useEffect, useCallback, useMemo, useContext, useRef } from 'react';
import { AuthContext } from "../contexts/AuthContext";
import {
  Box, Paper, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Tabs, Tab,
  InputAdornment, CircularProgress, Tooltip, Stack, Divider, List,
  ListItem, ListItemText, useTheme, Fab, TablePagination, useMediaQuery,
  Skeleton, Alert, AlertTitle, Menu, Badge
} from '@mui/material';
import {
  Search, Delete, Shield, Refresh, People,
  AdminPanelSettings, History, Person as PersonIcon,
  HowToReg as RegistrantIcon, Add as AddIcon,
  ArrowDropDown, Business as BusinessIcon,
  Edit as EditIcon, Close as CloseIcon,
  Check as CheckIcon, Warning as WarningIcon,
  Settings as SettingsIcon,
  Restaurant as RestaurantIcon,
  ChildCare as ChildCareIcon,
  VolunteerActivism as VolunteerIcon,
  MusicNote as MusicIcon,
  Handshake as HandshakeIcon,
  LocalPolice as SecurityIcon,
  Coffee as CoffeeIcon
} from '@mui/icons-material';
import NewUserModal from '../components/NewUserModal';

let globalUsersData = null;
let globalDataLoaded = false;
let globalDataTimestamp = null;
let globalOrgFilter = null;
const CACHE_DURATION = 5 * 60 * 1000; 

const SUPREME_ADMIN_EMAIL = "tkgenia1234@gmail.com";

export default function AdminDashboard() {
  const theme = useTheme();
  const { authFetch, isRefreshingToken, user: currentUser } = useContext(AuthContext);
  
  const isSupremeAdmin = currentUser?.email === SUPREME_ADMIN_EMAIL;
  
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
  const [totalUsers, setTotalUsers] = useState(0); // <-- ADD THIS LINE
  const [activityLog, setActivityLog] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // Organization state
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgAnchorEl, setOrgAnchorEl] = useState(null);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  
  // Organization Modal state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [orgFormErrors, setOrgFormErrors] = useState({});
  const [savingOrg, setSavingOrg] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  
  const initialLoadRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  // Calculate dynamic role stats
  const roleStats = useMemo(() => {
    const stats = {};
    users.forEach(user => {
      const role = user.role || 'Unknown';
      stats[role] = (stats[role] || 0) + 1;
    });
    return stats;
  }, [users]);

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    users.forEach(user => {
      if (user.role) roles.add(user.role);
    });
    return Array.from(roles).sort();
  }, [users]);

  // Dynamic role icon based on role name
  const getRoleIcon = (roleName) => {
    if (!roleName) return <PersonIcon />;
    const lowerRole = roleName.toLowerCase();
    
    if (lowerRole.includes('main leader') || lowerRole.includes('head')) return <AdminPanelSettings />;
    if (lowerRole.includes('shepard') || lowerRole.includes('shepherd')) return <HandshakeIcon />;
    if (lowerRole.includes('logic')) return <SettingsIcon />;
    if (lowerRole.includes('gate') || lowerRole.includes('security')) return <SecurityIcon />;
    if (lowerRole.includes('intercessor') || lowerRole.includes('prayer')) return <VolunteerIcon />;
    if (lowerRole.includes('children')) return <ChildCareIcon />;
    if (lowerRole.includes('youth')) return <People />;
    if (lowerRole.includes('welcome') || lowerRole.includes('usher')) return <HandshakeIcon />;
    if (lowerRole.includes('technical') || lowerRole.includes('sound')) return <SettingsIcon />;
    if (lowerRole.includes('kitchen') || lowerRole.includes('cleaning')) return <RestaurantIcon />;
    if (lowerRole.includes('worship') || lowerRole.includes('music')) return <MusicIcon />;
    if (lowerRole.includes('coffee') || lowerRole.includes('hospitality')) return <CoffeeIcon />;
    
    return <PersonIcon />;
  };

  // Dynamic role color
  const getRoleColor = (role) => {
    if (!role) return 'default';
    
    const roleColors = {
      'Main Leader': 'error',
      'Logic': 'primary',
      'Shepard': 'secondary',
      'Shepherd': 'secondary',
      'Gate Keeper': 'warning',
      'Intercessor': 'info',
      "Children's Leader": 'success',
      'Youth Leader': 'secondary',
      'Welcome Team': 'primary',
      'Prayer Team': 'info',
      'Usher': 'warning',
      'Technical Team': 'default',
      'Cleaning Team': 'default',
      'Kitchen Team': 'default',
      'Grounds Keeper': 'default',
      'admin': 'error',
      'leader': 'primary',
      'leaderAt12': 'secondary',
      'user': 'success',
      'registrant': 'warning'
    };
    
    return roleColors[role] || 
      ['error', 'primary', 'secondary', 'success', 'warning', 'info'][
        role.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6
      ];
  };

    const addActivityLog = useCallback((action, details) => {
    const newLog = {
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'Current Admin'
    };
    setActivityLog(prev => [newLog, ...prev].slice(0, 50));
  }, [currentUser]);
  const getRoleDisplay = (role) => {
    if (!role) return 'Unknown';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  
  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // Fetch organizations for supreme admin
  const fetchOrganizations = useCallback(async () => {
    if (!isSupremeAdmin) return;
    
    setLoadingOrgs(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/organizations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } else {
        console.error('Failed to fetch organizations');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoadingOrgs(false);
    }
  }, [API_BASE_URL, authFetch, isSupremeAdmin]);

// Fetch all users with intelligent caching and pagination
const fetchAllData = useCallback(async (forceRefresh = false) => {
  // Check if cache is valid (not expired and same org filter)
  const now = Date.now();
  const cacheValid = globalDataLoaded && 
                     globalDataTimestamp && 
                     (now - globalDataTimestamp < CACHE_DURATION) &&
                     globalOrgFilter === selectedOrg &&
                     !forceRefresh;
  
  if (cacheValid) {
    console.log('🔵 Using cached data:', globalUsersData?.length, 'users');
    setUsers(globalUsersData);
    setTotalUsers(globalUsersData?.length || 0);
    setLoading(false);
    return;
  }

  // Prevent multiple simultaneous fetches
  if (isRefreshingToken) {
    console.log('⏳ Token refreshing, waiting...');
    return;
  }

  if (fetchInProgressRef.current) {
    console.log('⏳ Fetch already in progress, skipping...');
    return;
  }

  fetchInProgressRef.current = true;
  setLoading(true);
  
  try {
    // Build URL with pagination parameters
    const skip = page * rowsPerPage;
    let url = `${API_BASE_URL}/admin/users?skip=${skip}&limit=${rowsPerPage}`;
    
    if (selectedOrg) {
      url += `&organization=${encodeURIComponent(selectedOrg)}`;
    }
    
    console.log('🟡 Fetching users from:', url);
    console.log(`Page ${page}, skip: ${skip}, limit: ${rowsPerPage}`);
    
    const response = await authFetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🟢 Received data from API:', data);
    
    // Handle different response formats
    let usersArray = [];
    let totalCount = 0;
    
    if (data.users && Array.isArray(data.users)) {
      // Format: { users: [...], total: 123 }
      usersArray = data.users;
      totalCount = data.total || usersArray.length;
    } else if (Array.isArray(data)) {
      // Format: [...] (direct array)
      usersArray = data;
      totalCount = usersArray.length;
    } else {
      console.error('Invalid response format:', data);
      usersArray = [];
      totalCount = 0;
    }
    
    console.log(`📊 Loaded ${usersArray.length} users on current page, total in DB: ${totalCount}`);
    
    if (Array.isArray(usersArray)) {
      // Transform data once and cache it
      const transformedUsers = usersArray.map(user => {
        // Debug first few users
        if (usersArray.indexOf(user) < 3) {
          console.log('Sample user transformation:', {
            id: user.id,
            name: user.name,
            surname: user.surname,
            role: user.role,
            organization: user.organization
          });
        }
        
        return {
          id: user.id,
          name: user.name && user.surname 
            ? `${user.name} ${user.surname}`.trim() 
            : user.name || user.surname || 'Unknown',
          email: user.email || '',
          role: user.role || 'Unknown',
          phoneNumber: user.phone_number,
          dateOfBirth: user.date_of_birth,
          address: user.address,
          gender: user.gender,
          invitedBy: user.invitedBy,
          organization: user.organization,
          createdAt: user.created_at
        };
      });

      // Update cache with transformed data
      globalUsersData = transformedUsers;
      globalDataLoaded = true;
      globalDataTimestamp = now;
      globalOrgFilter = selectedOrg;

      // Update state
      setUsers(transformedUsers);
      setTotalUsers(totalCount);
      
      console.log(`✅ State updated: ${transformedUsers.length} users displayed, ${totalCount} total in DB`);
      
      // Add activity log for refresh
      if (forceRefresh) {
        addActivityLog('DATA_REFRESH', `Refreshed user data: ${totalCount} total users`);
      }
    }
    
  } catch (err) {
    console.error('🔴 Error fetching data:', err);
    
    // If we have stale cache, show it with warning
    if (globalUsersData) {
      console.log('⚠️ Showing stale cached data due to error');
      setUsers(globalUsersData);
      setTotalUsers(globalUsersData.length);
      
      // Show non-blocking error notification
      alert('Using cached data. Unable to refresh from server.');
    } else {
      setUsers([]);
      setTotalUsers(0);
    }
  } finally {
    setLoading(false);
    fetchInProgressRef.current = false;
  }
}, [API_BASE_URL, authFetch, isRefreshingToken, selectedOrg, page, rowsPerPage, addActivityLog]);

  // Handle organization change
  const handleOrgChange = (orgName) => {
    setSelectedOrg(orgName);
    setOrgAnchorEl(null);
    globalDataLoaded = false;
    setPage(0);
    setSelectedRole('all');
    setSearchTerm('');
  };

  // Open organization modal for create
  const handleOpenCreateOrg = () => {
    setEditingOrg(null);
    setOrgFormData({
      name: '',
      address: '',
      phone: '',
      email: ''
    });
    setOrgFormErrors({});
    setShowOrgModal(true);
  };

  // Open organization modal for edit
  const handleOpenEditOrg = (org) => {
    setEditingOrg(org);
    setOrgFormData({
      name: org.name || '',
      address: org.address || '',
      phone: org.phone || '',
      email: org.email || ''
    });
    setOrgFormErrors({});
    setShowOrgModal(true);
    setOrgAnchorEl(null);
  };

  // Validate organization form
  const validateOrgForm = () => {
    const errors = {};
    if (!orgFormData.name.trim()) {
      errors.name = 'Organization name is required';
    }
    if (!orgFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(orgFormData.email)) {
      errors.email = 'Email is invalid';
    }
    setOrgFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save organization (create or update)
  const handleSaveOrganization = async () => {
    if (!validateOrgForm()) return;
    
    setSavingOrg(true);
    try {
      const url = editingOrg 
        ? `${API_BASE_URL}/admin/organizations/${editingOrg.id}`
        : `${API_BASE_URL}/admin/organizations`;
      
      const method = editingOrg ? 'PUT' : 'POST';
      
      const response = await authFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save organization');
      }
      
      addActivityLog(
        editingOrg ? 'ORGANIZATION_UPDATED' : 'ORGANIZATION_CREATED',
        `${editingOrg ? 'Updated' : 'Created'} organization: ${orgFormData.name}`
      );
      
      await fetchOrganizations();
      
      if (editingOrg && selectedOrg === editingOrg.name && orgFormData.name !== editingOrg.name) {
        setSelectedOrg(orgFormData.name);
      }
      
      setShowOrgModal(false);
      
    } catch (err) {
      console.error('Error saving organization:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSavingOrg(false);
    }
  };

  // Delete organization
  const handleDeleteOrganization = async (orgId, orgName) => {
    if (!window.confirm(`Are you sure you want to delete "${orgName}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingOrg(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/organizations/${orgId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete organization');
      }
      
      addActivityLog('ORGANIZATION_DELETED', `Deleted organization: ${orgName}`);
      
      await fetchOrganizations();
      
      if (selectedOrg === orgName) {
        setSelectedOrg(null);
        globalDataLoaded = false;
      }
      
      setShowOrgModal(false);
      
    } catch (err) {
      console.error('Error deleting organization:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingOrg(false);
    }
  };

  const handleManualRefresh = useCallback(async () => {
    globalDataLoaded = false;
    await fetchAllData(true);
    if (isSupremeAdmin) {
      await fetchOrganizations();
    }
  }, [fetchAllData, fetchOrganizations, isSupremeAdmin]);

  // Initial data fetch
  useEffect(() => {
    if (!globalDataLoaded && !isRefreshingToken) {
      fetchAllData();
    } else {
      setUsers(globalUsersData);
      setLoading(false);
    }
    
    if (isSupremeAdmin) {
      fetchOrganizations();
    }
    
    initialLoadRef.current = false;
  }, [fetchAllData, isRefreshingToken, isSupremeAdmin, fetchOrganizations]);

  useEffect(() => {
    if (isRefreshingToken) {
      setLoading(true);
    } else if (initialLoadRef.current === false && !globalDataLoaded) {
      fetchAllData();
    } else if (globalDataLoaded) {
      setLoading(false);
    }
  }, [isRefreshingToken, fetchAllData]);

  useEffect(() => {
    if (selectedOrg !== undefined) {
      globalDataLoaded = false;
      fetchAllData(true);
    }
  }, [selectedOrg, fetchAllData]);
// Fetch data when page or rowsPerPage changes
useEffect(() => {
  if (globalDataLoaded) {
    console.log(`Page changed to ${page}, fetching new data...`);
    fetchAllData(true);
  }
}, [page, rowsPerPage]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user');
      }

      addActivityLog('USER_CREATED', `Created new user: ${userData.name} ${userData.surname} (${userData.role})`);
      setShowAddUserModal(false);
      
      globalDataLoaded = false;
      await fetchAllData(true);
      
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
        headers: { 'Content-Type': 'application/json' },
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user');
      }

      addActivityLog('USER_DELETED', `Deleted user: ${selectedUser.name}`);
      
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      
      setUsers(updatedUsers);
      globalUsersData = updatedUsers;
      
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingUser(false);
    }
  };
  // Fetch distinct roles for the current organization
const fetchOrganizationRoles = useCallback(async () => {
  try {
    const org = selectedOrg || currentUser?.organization;
    if (!org) return;
    
    const response = await authFetch(`${API_BASE_URL}/admin/roles/distinct?organization=${encodeURIComponent(org)}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Organization roles:', data.roles);
      setOrganizationRoles(data.roles || []);
    }
  } catch (err) {
    console.error('Error fetching roles:', err);
  }
}, [API_BASE_URL, authFetch, selectedOrg, currentUser]);

// Call when organization changes
useEffect(() => {
  if (selectedOrg || currentUser?.organization) {
    fetchOrganizationRoles();
  }
}, [selectedOrg, fetchOrganizationRoles]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filterKey = `${normalizedSearch}|${selectedRole}`;

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) || 
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [users, searchTerm, selectedRole]);

  const pageMemoryRef = useRef({});
  const prevFilterKeyRef = useRef(filterKey);

  useEffect(() => {
    const prevKey = prevFilterKeyRef.current;
    if (prevKey !== filterKey) {
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
    const maxPage = Math.max(0, Math.ceil(filteredUsers.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
      pageMemoryRef.current[filterKey] = maxPage;
    }
  }, [filteredUsers.length, rowsPerPage, page, filterKey]);

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

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

  // Colors for role cards
  const roleCardColors = [
    '#f44336', '#9c27b0', '#4caf50', '#ff9800', '#607d8b',
    '#2196f3', '#e91e63', '#00bcd4', '#8bc34a', '#ff5722',
    '#673ab7', '#3f51b5', '#009688', '#795548', '#ffc107'
  ];

  // User Card for mobile view
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
              {isSupremeAdmin && user.organization && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <BusinessIcon fontSize="inherit" /> {user.organization}
                </Typography>
              )}
              <Chip 
                label={getRoleDisplay(user.role)} 
                color={getRoleColor(user.role)} 
                size="small" 
                icon={getRoleIcon(user.role)}
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

  // Skeleton components
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
      {isSupremeAdmin && (
        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width="60%" /></TableCell>
      )}
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

  const shouldShowLoading = loading || (isRefreshingToken && !globalDataLoaded);

  if (shouldShowLoading) {
    return (
      <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: getResponsiveValue(2, 3, 4, 5, 5), minHeight: "100vh" }}>
        {isSupremeAdmin && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant="rounded" width={200} height={40} />
          </Box>
        )}
        
        <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
          Admin Dashboard
        </Typography>

        <Grid container spacing={cardSpacing} mb={cardSpacing}>
          <Grid item xs={6} sm={4} md={2}>
            <SkeletonStatsCard />
          </Grid>
          {Array.from({ length: Math.min(5, Object.keys(roleStats).length) }).map((_, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <SkeletonStatsCard />
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <Skeleton variant="rounded" height={40} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Skeleton variant="rounded" height={40} />
              </Grid>
            </Grid>
          </Box>

          {isMdDown ? (
            <Box sx={{ p: 1 }}>
              {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width="70%" /></TableCell>
                    {isSupremeAdmin && (
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton variant="text" width="60%" /></TableCell>
                    )}
                    <TableCell align="right"><Skeleton variant="text" width="50%" /></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => <SkeletonTableRow key={index} />)}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    );
  }
  const RoleOption = ({ role, selectedUser, onSelect }) => {
  // Add safety check for selectedUser
  if (!selectedUser) return null;
  
  return (
    <Paper
      variant="outlined"
      sx={{ 
        p: 2, 
        cursor: 'pointer',
        border: selectedUser?.role === role.name ? 2 : 1,
        borderColor: selectedUser?.role === role.name ? 'primary.main' : 'divider',
        borderRadius: 1,
        transition: 'all 0.2s',
        '&:hover': { 
          borderColor: 'primary.main', 
          bgcolor: 'action.hover',
          transform: 'translateY(-1px)',
          boxShadow: 1
        }
      }}
      onClick={onSelect}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ width: 24, height: 24, bgcolor: role.color || '#9c27b0' }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Typography variant="body1" fontWeight="medium">
            {role.name}
          </Typography>
          {!role.is_system && (
            <Chip 
              label="custom" 
              size="small" 
              variant="outlined" 
              sx={{ height: 20, fontSize: '0.625rem' }}
            />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {role.count} {role.count === 1 ? 'person' : 'people'}
        </Typography>
      </Stack>
    </Paper>
  );
};

  return (
    <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: getResponsiveValue(2, 3, 4, 5, 5), minHeight: "100vh" }}>
      {/* Header with Organization Switcher for Supreme Admin */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" fontWeight="bold">
            Admin Dashboard
          </Typography>
          {selectedOrg && (
            <Chip
              icon={<BusinessIcon />}
              label={selectedOrg}
              onDelete={() => handleOrgChange(null)}
              color="primary"
              variant="outlined"
              size="medium"
            />
          )}
        </Box>
        
        {isSupremeAdmin && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={(e) => setOrgAnchorEl(e.currentTarget)}
              startIcon={<BusinessIcon />}
              endIcon={<ArrowDropDown />}
              sx={{ 
                boxShadow: 1, 
                borderRadius: 2,
                minWidth: 200,
                justifyContent: 'space-between'
              }}
            >
              {selectedOrg || 'All Organizations'}
            </Button>
            <Menu
              anchorEl={orgAnchorEl}
              open={Boolean(orgAnchorEl)}
              onClose={() => setOrgAnchorEl(null)}
              PaperProps={{
                sx: { maxHeight: 400, width: 300 }
              }}
            >
              <MenuItem 
                onClick={() => {
                  handleOrgChange(null);
                  setOrgAnchorEl(null);
                }}
                selected={!selectedOrg}
                sx={{ justifyContent: 'space-between' }}
              >
                <Typography variant="body2">All Organizations</Typography>
                <Chip 
                  label={users.length} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              </MenuItem>
              <Divider />
              {organizations.map((org) => (
                <MenuItem 
                  key={org.id}
                  onClick={() => {
                    handleOrgChange(org.name);
                    setOrgAnchorEl(null);
                  }}
                  selected={selectedOrg === org.name}
                  sx={{ 
                    justifyContent: 'space-between',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium">{org.name}</Typography>
                    <Badge badgeContent={org.user_count} color="primary" max={999} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {org.email}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditOrg(org);
                      }}
                      sx={{ ml: 'auto' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </MenuItem>
              ))}
              <Divider />
              <MenuItem onClick={handleOpenCreateOrg} sx={{ color: 'primary.main' }}>
                <AddIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">Add New Organization</Typography>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>

      {/* Dynamic Stats Cards */}
      <Grid container spacing={cardSpacing} sx={{ mb: cardSpacing }}>
   {/* Total People Card - FIXED */}
<Grid item xs={6} sm={4} md={2}>
  <Card sx={cardStyles}>
    <CardContent sx={{ textAlign: 'center', p: getResponsiveValue(1.5, 2, 2.5, 3, 3) }}>
      <Avatar sx={{ bgcolor: '#2196f3', width: 56, height: 56, mb: 2, mx: 'auto', boxShadow: 2 }}>
        <People />
      </Avatar>
      <Typography variant="h4" fontWeight="bold">{totalUsers}</Typography> {/* ← USE totalUsers */}
      <Typography variant="body2" color="text.secondary">Total People</Typography>
    </CardContent>
  </Card>
</Grid>
        
        {/* Dynamic Role Cards - One for each unique role */}
        {Object.entries(roleStats).map(([role, count], index) => {
          const colorIndex = index % roleCardColors.length;
          
          return (
            <Grid item xs={6} sm={4} md={2} key={role}>
              <Card sx={cardStyles}>
                <CardContent sx={{ textAlign: 'center', p: getResponsiveValue(1.5, 2, 2.5, 3, 3) }}>
                  <Avatar sx={{ bgcolor: roleCardColors[colorIndex], width: 56, height: 56, mb: 2, mx: 'auto', boxShadow: 2 }}>
                    {getRoleIcon(role)}
                  </Avatar>
                  <Typography variant="h4" fontWeight="bold">{count}</Typography>
                  <Typography variant="body2" color="text.secondary">{role}</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Main Content */}
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
            variant={isMdDown ? "fullWidth" : "standard"}
            sx={{ 
              '& .MuiTab-root': { 
                fontWeight: 600, 
                borderRadius: 1,
                fontSize: getResponsiveValue('0.75rem', '0.875rem', '0.875rem', '1rem', '1rem'),
                minWidth: isMdDown ? 'auto' : 120
              }
            }}
          >
            <Tab label="USERS" />
            <Tab label="ROLES & PERMISSIONS" />
            <Tab label="ACTIVITY LOG" />
          </Tabs>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />} 
              onClick={handleManualRefresh}
              sx={{ 
                boxShadow: 1, 
                borderRadius: 2, 
                height: 40,
                minWidth: getResponsiveValue('auto', 'auto', 100, 100, 100)
              }}
              size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
            >
              Refresh
            </Button>
   
          </Box>
        </Box>

        {/* Users Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: getResponsiveValue(1, 2, 3, 3, 3) }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                }}
                size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
              />
              <FormControl sx={{ minWidth: getResponsiveValue('100%', 200, 200, 200, 200) }}>
                <InputLabel>Filter Role</InputLabel>
                <Select 
                  value={selectedRole} 
                  label="Filter Role" 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
                >
                 <MenuItem value="all">All Roles ({totalUsers})</MenuItem> 
                  {uniqueRoles.map(role => (
                    <MenuItem key={role} value={role}>
                      {role} ({roleStats[role]})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {filteredUsers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No users found</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or filter criteria
                </Typography>
              </Box>
            ) : (
              <>
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
                      onPageChange={handlePageChange} 
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
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Created</TableCell>
                            {isSupremeAdmin && (
                              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Organization</TableCell>
                            )}
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedUsers.map(user => (
                            <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {user.phoneNumber || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </Typography>
                              </TableCell>
                              {isSupremeAdmin && (
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {user.organization || 'N/A'}
                                  </Typography>
                                </TableCell>
                              )}
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
  count={totalUsers} // Use total from backend, not filteredUsers.length
  page={page} 
  onPageChange={handlePageChange} 
  rowsPerPage={rowsPerPage} 
  onRowsPerPageChange={(e) => { 
    setRowsPerPage(parseInt(e.target.value, 10)); 
    setPage(0); 
    globalDataLoaded = false; // Force refresh when rows per page changes
  }} 
  rowsPerPageOptions={[5, 10, 20, 50, 100]} 
/>
                  </Box>
                )}
              </>
            )}
          </Box>
        )}

        {/* Roles Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: getResponsiveValue(1, 2, 3, 3, 3) }}>
            <Alert severity="info" sx={{ mb: 3, boxShadow: 1, borderRadius: 2 }}>
              <AlertTitle>Role Distribution</AlertTitle>
              {uniqueRoles.length} unique roles found in this organization
            </Alert>
            
            <Grid container spacing={cardSpacing}>
              {uniqueRoles.map((role, idx) => {
                const colorIndex = idx % roleCardColors.length;
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={role}>
                    <Card sx={cardStyles}>
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: roleCardColors[colorIndex], 
                            width: 48, 
                            height: 48,
                            boxShadow: 2
                          }}>
                            {getRoleIcon(role)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {getRoleDisplay(role)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {roleStats[role]} {roleStats[role] === 1 ? 'person' : 'people'}
                            </Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {role === 'admin' && 'Full system access'}
                          {role === 'leader' && 'Group leaders managing cells'}
                          {role === 'leaderAt12' && 'Leaders at 12 level'}
                          {role === 'user' && 'Regular members'}
                          {role === 'registrant' && 'Event check-in volunteers'}
                          {!['admin', 'leader', 'leaderAt12', 'user', 'registrant'].includes(role) && 
                            `${role} role in this organization`}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Activity Log Tab */}
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
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <History sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No activity yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  Actions will appear here as you manage users
                </Typography>
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
                              {log.action} • {new Date(log.timestamp).toLocaleString()} • by {log.user}
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

      {/* Organization Modal */}
      <Dialog 
        open={showOrgModal} 
        onClose={() => !savingOrg && setShowOrgModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {editingOrg ? 'Edit Organization' : 'New Organization'}
          </Typography>
          <IconButton onClick={() => setShowOrgModal(false)} size="small" disabled={savingOrg}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {editingOrg && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Members: {editingOrg.user_count || 0}
                </Typography>
              </Alert>
            )}
            
            <TextField
              label="Organization Name *"
              value={orgFormData.name}
              onChange={(e) => setOrgFormData({...orgFormData, name: e.target.value})}
              error={!!orgFormErrors.name}
              helperText={orgFormErrors.name}
              fullWidth
              required
              disabled={savingOrg}
            />
            
            <TextField
              label="Address"
              value={orgFormData.address}
              onChange={(e) => setOrgFormData({...orgFormData, address: e.target.value})}
              fullWidth
              multiline
              rows={2}
              disabled={savingOrg}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Phone"
                  value={orgFormData.phone}
                  onChange={(e) => setOrgFormData({...orgFormData, phone: e.target.value})}
                  fullWidth
                  disabled={savingOrg}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Email *"
                  type="email"
                  value={orgFormData.email}
                  onChange={(e) => setOrgFormData({...orgFormData, email: e.target.value})}
                  error={!!orgFormErrors.email}
                  helperText={orgFormErrors.email}
                  fullWidth
                  required
                  disabled={savingOrg}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          {editingOrg && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleDeleteOrganization(editingOrg.id, editingOrg.name)}
              disabled={savingOrg || deletingOrg}
              startIcon={deletingOrg ? <CircularProgress size={20} /> : <Delete />}
              sx={{ mr: 'auto' }}
            >
              {deletingOrg ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          <Button 
            variant="outlined" 
            onClick={() => setShowOrgModal(false)}
            disabled={savingOrg}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveOrganization}
            disabled={savingOrg}
            startIcon={savingOrg ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {savingOrg ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Supreme Admin */}
      {isSupremeAdmin && (
        <Fab
          color="primary"
          aria-label="add organization"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            boxShadow: 4,
            '&:hover': { boxShadow: 8 }
          }}
          onClick={handleOpenCreateOrg}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Role Change Modal */}
   {/* Role Change Modal - SINGLE VERSION */}
<Dialog 
  open={showRoleModal} 
  onClose={() => !updatingRole && setShowRoleModal(false)} 
  maxWidth="sm" 
  fullWidth
  PaperProps={{ sx: { borderRadius: 2 } }}
>
  <DialogTitle>
    <Typography variant="h6" fontWeight="bold">Change User Role</Typography>
  </DialogTitle>
  <DialogContent>
    {selectedUser && (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          User: <strong>{selectedUser.name}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Current Role: <Chip 
            label={selectedUser.role} 
            size="small"
            sx={{ 
              bgcolor: getRoleColor(selectedUser.role),
              color: 'white'
            }}
          />
        </Typography>
        
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
          Available Roles for {selectedOrg || currentUser?.organization}:
        </Typography>
        
        <Stack spacing={1}>
          {/* Show system roles first */}
          {organizationRoles.filter(r => r.is_system).map(role => (
            <RoleOption
              key={role.name}
              role={role}
              selectedUser={selectedUser}
              onSelect={() => handleRoleChange(selectedUser.id, role.name)}
            />
          ))}
          
          {/* Show custom roles */}
          {organizationRoles.filter(r => !r.is_system).length > 0 && (
            <>
              <Divider sx={{ my: 1 }}>
                <Chip label="Custom Roles" size="small" />
              </Divider>
              
              {organizationRoles.filter(r => !r.is_system).map(role => (
                <RoleOption
                  key={role.name}
                  role={role}
                  selectedUser={selectedUser}
                  onSelect={() => handleRoleChange(selectedUser.id, role.name)}
                />
              ))}
            </>
          )}
        </Stack>
      </>
    )}
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button 
      onClick={() => setShowRoleModal(false)} 
      disabled={updatingRole}
      variant="outlined"
    >
      Cancel
    </Button>
  </DialogActions>
</Dialog>
      {/* Delete Confirmation Modal */}
      <Dialog 
        open={showDeleteConfirm} 
        onClose={() => !deletingUser && setShowDeleteConfirm(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ 
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ py: 2 }}>
          <Typography variant="h6" fontWeight="bold" color="error">Delete User</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Typography variant="body1">
                Are you sure you want to delete <strong>{selectedUser.name}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Email: {selectedUser.email}
              </Typography>
              {selectedUser.role === 'admin' && !isSupremeAdmin && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  You cannot delete another admin user.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setShowDeleteConfirm(false)} 
            disabled={deletingUser}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteUser}
            disabled={deletingUser || (selectedUser?.role === 'admin' && !isSupremeAdmin)}
            startIcon={deletingUser ? <CircularProgress size={16} /> : <Delete />}
          >
            {deletingUser ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}