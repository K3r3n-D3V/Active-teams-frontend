// People.jsx (Exact match search + View filter)
import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';
import {
  Box, Paper, Typography, Badge, useTheme, useMediaQuery, Card, CardContent,
  IconButton, Chip, Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
  TextField, InputAdornment, Button, Snackbar, Alert, Skeleton, ToggleButton, 
  ToggleButtonGroup, Tooltip, Pagination, CircularProgress, LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon,
  Phone as PhoneIcon, LocationOn as LocationIcon, Group as GroupIcon,
  ViewModule as ViewModuleIcon, ViewList as ViewListIcon, People as PeopleIcon,
  PersonOutline as PersonOutlineIcon
} from '@mui/icons-material';
import AddPersonDialog from '../components/AddPersonDialog';
import PeopleListView from '../components/PeopleListView';

// Global cache outside component to persist across remounts
let globalPeopleCache = null;
let globalCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ---------------- Stages ----------------
const stages = [
  { id: 'Win', title: 'Win', description: 'This is the first stage where people are won to the ministry.' },
  { id: 'Consolidate', title: 'Consolidate', description: 'People are consolidated in the group and connected to leaders.' },
  { id: 'Disciple', title: 'Disciple', description: 'Focused teaching and growth to become strong in faith.' },
  { id: 'Send', title: 'Send', description: 'Mature people are sent out to lead or minister to others.' }
];

// ---------------- PersonCard ----------------
const PersonCard = React.memo(({ person, onEdit, onDelete, isDragging }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = e => { e.stopPropagation(); setAnchorEl(e.currentTarget); };
  const handleMenuClose = () => setAnchorEl(null);
  const handleEdit = () => { onEdit(person); handleMenuClose(); };
  const handleDelete = () => { onDelete(person._id); handleMenuClose(); };

  const getInitials = useCallback(name => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || "?", []);
  const getAvatarColor = useCallback(name => ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'][(name?.length || 0) % 6], []);
  const formatDate = useCallback(date => date ? new Date(date).toLocaleDateString() : "-", []);
  const getStageColor = useCallback(stage => {
    switch (stage) {
      case 'Win': return 'success.main';
      case 'Consolidate': return 'info.main';
      case 'Disciple': return 'warning.main';
      case 'Send': return 'error.main';
      default: return 'primary.main';
    }
  }, []);

  return (
    <Card sx={{
      cursor: 'grab',
      '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' },
      transition: 'all 0.2s ease-in-out',
      boxShadow: isDragging ? 6 : 2,
      backgroundColor: isDragging ? 'action.selected' : 'background.paper',
      mb: 1
    }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: 12,
              backgroundColor: getAvatarColor(person.name + " " + person.surname),
              mr: 1
            }}
          >
            {getInitials(person.name + " " + person.surname)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" noWrap>{person.name} {person.surname}</Typography>
            <Typography variant="caption" color="text.secondary">{person.gender} • {formatDate(person.dob)}</Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}><MoreVertIcon fontSize="small" /></IconButton>
        </Box>

        <Box sx={{ mb: 1 }}>
          {person.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption">{person.email}</Typography>
            </Box>
          )}
          {person.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption">{person.phone}</Typography>
            </Box>
          )}
          {person.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <LocationIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption">{person.location}</Typography>
            </Box>
          )}

          {/* Leaders block */}
          {(person.leaders.leader1 || person.leaders.leader12 || person.leaders.leader144 || person.leaders.leader1728) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              {person.leaders.leader1 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">Leader @1: {person.leaders.leader1}</Typography>
                </Box>
              )}
              {person.leaders.leader12 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">Leader @12: {person.leaders.leader12}</Typography>
                </Box>
              )}
              {person.leaders.leader144 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">Leader @144: {person.leaders.leader144}</Typography>
                </Box>
              )}
              {person.leaders.leader1728 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">Leader @1728: {person.leaders.leader1728}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={person.Stage}
            size="small"
            sx={{
              height: 20,
              fontSize: 10,
              backgroundColor: getStageColor(person.Stage),
              color: '#fff'
            }}
          />
          <Typography variant="caption">Updated: {formatDate(person.lastUpdated)}</Typography>
        </Box>

        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          <MenuItem onClick={handleEdit}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
});

// ---------------- DragDropBoard ----------------
const DragDropBoard = ({ people, setPeople, onEditPerson, onDeletePerson, loading, updatePersonInCache, allPeople, setAllPeople }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStage = destination.droppableId;
    
    const originalPerson = allPeople.find(p => String(p._id) === String(draggableId));
    if (!originalPerson) return;

    const updatePeopleStage = (peopleArray) => {
      return peopleArray.map(p => 
        String(p._id) === String(draggableId) 
          ? { ...p, Stage: newStage }
          : p
      );
    };

    setAllPeople(updatePeopleStage);

    try {
      const personToUpdate = allPeople.find(p => String(p._id) === String(draggableId));
      
      const response = await axios.patch(`${BACKEND_URL}/people/${draggableId}`, {
        Name: personToUpdate.name,
        Surname: personToUpdate.surname,
        Gender: personToUpdate.gender,
        Birthday: personToUpdate.dob,
        Address: personToUpdate.location,
        Email: personToUpdate.email,
        Number: personToUpdate.phone,
        Stage: newStage,
        "Leader @1": personToUpdate.leaders.leader1,
        "Leader @12": personToUpdate.leaders.leader12,
        "Leader @144": personToUpdate.leaders.leader144,
        "Leader @1728": personToUpdate.leaders.leader1728
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      const updateWithTimestamp = (peopleArray) => {
        return peopleArray.map(p =>
          String(p._id) === String(draggableId) 
            ? { ...p, Stage: newStage, lastUpdated: response.data.UpdatedAt || new Date().toISOString() }
            : p
        );
      };

      setAllPeople(updateWithTimestamp);

      if (updatePersonInCache) {
        updatePersonInCache(draggableId, {
          Stage: newStage,
          lastUpdated: response.data.UpdatedAt || new Date().toISOString()
        });
      }

    } catch (err) {
      console.error("Failed to update Stage:", err.response?.data || err.message);
      
      setAllPeople(prev => prev.map(p => 
        String(p._id) === String(draggableId) ? originalPerson : p
      ));
      
      alert(`Failed to update stage: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
    }
  };

  // Only show skeleton if loading AND no data at all (first ever load)
  if (loading && people.length === 0 && !globalPeopleCache) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {stages.map(Stage => (
          <Paper key={Stage.id} sx={{ flex: '1 0 250px', minWidth: 220, borderRadius: 2, p: 2 }}>
            {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1 }} />)}
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', flexWrap: isSmall || isMedium ? 'wrap' : 'nowrap', gap: 3, justifyContent: 'center', py: 1 }}>
        {stages.map(Stage => {
          const stagePeople = people.filter(p =>
            (p.Stage || '').trim().toLowerCase() === Stage.id.toLowerCase() &&
            (p.name || p.surname)
          );
          const stageWidth = isSmall ? '100%' : isMedium ? '45%' : '250px';
          return (
            <Paper key={Stage.id} sx={{ flex: `0 0 ${stageWidth}`, minWidth: 220, borderRadius: 2, overflow: 'hidden', mb: isSmall || isMedium ? 2 : 0, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.common.white }}>
              <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100] }}>
                <Typography variant="subtitle1">{Stage.title}</Typography>
                <Badge badgeContent={stagePeople.length} sx={{ '& .MuiBadge-badge': { backgroundColor: theme.palette.mode === 'dark' ? '#fff' : '#000', color: theme.palette.mode === 'dark' ? '#000' : '#fff', fontSize: 10 } }} />
              </Box>

              <Droppable droppableId={Stage.id}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ p: 1, minHeight: 140, maxHeight: '400px', overflowY: 'auto' }}>
                    {stagePeople.length > 0 ? stagePeople.map((person, index) => (
                      <Draggable key={person._id} draggableId={String(person._id)} index={index}>
                        {(provided, snapshot) => (
                          <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <PersonCard person={person} onEdit={onEditPerson} onDelete={onDeletePerson} isDragging={snapshot.isDragging} />
                          </Box>
                        )}
                      </Draggable>
                    )) : <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>No people</Typography>}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          );
        })}
      </Box>
    </DragDropContext>
  );
};

// ---------------- PeopleSection ----------------
export const PeopleSection = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const { userProfile } = useContext(UserContext);
  const [allPeople, setAllPeople] = useState(globalPeopleCache || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '', surname: '', dob: '', address: '', email: '', number: '',
    invitedBy: '', gender: '', leader12: '', leader144: '', leader1728: '',
    stage: 'Win'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('grid');
  const [viewFilter, setViewFilter] = useState('all'); // 'all' or 'myPeople'
  const [gridPage, setGridPage] = useState(1);
  const ITEMS_PER_PAGE = 100;
  const isFetchingRef = useRef(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Get current user's full name from context
  const currentUserName = useMemo(() => {
    if (userProfile?.name && userProfile?.surname) {
      return `${userProfile.name} ${userProfile.surname}`.trim();
    }
    if (user?.email) {
      return user.email; // Fallback to email if name not available
    }
    return '';
  }, [userProfile, user]);

  // Get current user info - Replace this with your actual user context/auth
  useEffect(() => {
    // TODO: Replace with actual user fetching logic
    // For now, using placeholder - you need to get the logged-in user's name
    const fetchCurrentUser = async () => {
      try {
        // Example: const userData = await axios.get(`${BACKEND_URL}/current-user`);
        // setCurrentUser(userData.data);
        
        // PLACEHOLDER - Replace with actual user data
        setCurrentUser({
          name: 'John Doe', // Replace with actual user's full name
          // You might store this in localStorage, context, or fetch from API
        });
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };
    
    fetchCurrentUser();
  }, [BACKEND_URL]);

  const fetchAllPeople = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && globalPeopleCache && globalCacheTimestamp && (now - globalCacheTimestamp < CACHE_DURATION)) {
      console.log('Using cached data');
      return;
    }

    if (isFetchingRef.current) {
      console.log('Fetch already in progress');
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      const res = await axios.get(`${BACKEND_URL}/people`, { 
        params: { perPage: 0 },
        timeout: 80000 
      });
      const rawPeople = res.data?.results || [];

      const mapped = rawPeople.map(raw => ({
        _id: (raw._id || raw.id || "").toString(),
        name: (raw.Name || raw.name || "").toString().trim(),
        surname: (raw.Surname || raw.surname || "").toString().trim(),
        gender: (raw.Gender || raw.gender || "").toString().trim(),
        dob: raw.Birthday || raw.DateOfBirth || "",
        location: (raw.Address || raw.address || "").toString().trim(),
        email: (raw.Email || raw.email || "").toString().trim(),
        phone: (raw.Number || raw.Phone || "").toString().trim(),
        Stage: (raw.Stage || "Win").toString().trim(),
        lastUpdated: raw.UpdatedAt || null,
        invitedBy: (raw.InvitedBy || "").toString().trim(),
        leaders: {
          leader1: (raw["Leader @1"] || "").toString().trim(),
          leader12: (raw["Leader @12"] || "").toString().trim(),
          leader144: (raw["Leader @144"] || "").toString().trim(),
          leader1728: (raw["Leader @1728"] || "").toString().trim(),
        }
      }));

      globalPeopleCache = mapped;
      globalCacheTimestamp = Date.now();
      setAllPeople(mapped);
      
      console.log(`Data fetched and cached successfully: ${mapped.length} people`);
    } catch (err) {
      console.error('Fetch error:', err);
      setSnackbar({ open: true, message: `Failed to load people: ${err?.message}`, severity: 'error' });
      if (!globalPeopleCache) {
        setAllPeople([]);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [BACKEND_URL]);

  const searchPeople = useCallback((peopleList, searchValue, field) => {
    if (!searchValue.trim()) return peopleList;

    const searchLower = searchValue.toLowerCase().trim();
    
    return peopleList.filter(person => {
      switch (field) {
        case 'name':
          // Exact match for name, surname, or full name
          const fullName = `${person.name} ${person.surname}`.toLowerCase();
          const nameLower = person.name.toLowerCase();
          const surnameLower = person.surname.toLowerCase();
          
          return nameLower === searchLower || 
                 surnameLower === searchLower || 
                 fullName === searchLower;
        case 'email':
          return person.email.toLowerCase() === searchLower;
        case 'phone':
          return person.phone === searchValue.trim();
        case 'location':
          return person.location.toLowerCase() === searchLower;
        case 'leaders':
          return person.leaders.leader1.toLowerCase() === searchLower ||
                 person.leaders.leader12.toLowerCase() === searchLower ||
                 person.leaders.leader144.toLowerCase() === searchLower ||
                 person.leaders.leader1728.toLowerCase() === searchLower;
        default:
          return person.name.toLowerCase() === searchLower;
      }
    });
  }, []);

  const filterMyPeople = useCallback((peopleList) => {
    if (!currentUserName) return peopleList;
    
    const userName = currentUserName.toLowerCase().trim();
    
    return peopleList.filter(person => {
      // Check if current user is listed as any of their leaders
      return person.leaders.leader1.toLowerCase() === userName ||
             person.leaders.leader12.toLowerCase() === userName ||
             person.leaders.leader144.toLowerCase() === userName ||
             person.leaders.leader1728.toLowerCase() === userName;
    });
  }, [currentUserName]);

  const filteredPeople = useMemo(() => {
    let result = allPeople;
    
    // Apply view filter first
    if (viewFilter === 'myPeople') {
      result = filterMyPeople(result);
    }
    
    // Then apply search
    result = searchPeople(result, searchTerm, searchField);
    
    return result;
  }, [allPeople, searchTerm, searchField, viewFilter, searchPeople, filterMyPeople]);

  const paginatedPeople = useMemo(() => {
    if (viewMode === 'list' || searchTerm.trim()) {
      return filteredPeople;
    }
    
    const startIndex = (gridPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPeople.slice(startIndex, endIndex);
  }, [filteredPeople, gridPage, viewMode, searchTerm]);

  const totalPages = useMemo(() => {
    if (viewMode === 'list' || searchTerm.trim()) return 1;
    return Math.ceil(filteredPeople.length / ITEMS_PER_PAGE);
  }, [filteredPeople.length, viewMode, searchTerm]);

  useEffect(() => {
    if (globalPeopleCache && allPeople.length === 0) {
      setAllPeople(globalPeopleCache);
    }
    
    fetchAllPeople(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setGridPage(1);
  }, [searchTerm, searchField, viewFilter]);

  const handleRefresh = () => {
    fetchAllPeople(true);
  };

  const handleViewFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setViewFilter(newFilter);
    }
  };

  const updatePersonInCache = useCallback((personId, updates) => {
    setAllPeople(prev => {
      const updated = prev.map(person => 
        String(person._id) === String(personId) 
          ? { ...person, ...updates } 
          : person
      );
      globalPeopleCache = updated;
      return updated;
    });
  }, []);

  const addPersonToCache = useCallback((newPerson) => {
    setAllPeople(prev => {
      const updated = [...prev, newPerson];
      globalPeopleCache = updated;
      return updated;
    });
  }, []);

  const removePersonFromCache = useCallback((personId) => {
    setAllPeople(prev => {
      const updated = prev.filter(person => String(person._id) !== String(personId));
      globalPeopleCache = updated;
      return updated;
    });
  }, []);

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const handleEditPerson = (person) => {
    setEditingPerson(person);
    
    let formattedDob = '';
    if (person.dob) {
      try {
        const date = new Date(person.dob);
        if (!isNaN(date.getTime())) {
          formattedDob = date.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Error formatting DOB:', e);
      }
    }
    
    setFormData({
      name: person.name || '',
      surname: person.surname || '',
      dob: formattedDob,
      address: person.location || '',
      email: person.email || '',
      number: person.phone || '',
      invitedBy: person.invitedBy || '',
      gender: person.gender || '',
      leader12: person.leaders?.leader12 || '',
      leader144: person.leaders?.leader144 || '',
      leader1728: person.leaders?.leader1728 || '',
      stage: person.Stage || 'Win'
    });
    setIsModalOpen(true);
  };

  const handleSaveFromDialog = (savedPerson) => {
    const mappedPerson = {
      _id: savedPerson._id || editingPerson?._id,
      name: savedPerson.name || '',
      surname: savedPerson.surname || '',
      gender: savedPerson.gender || '',
      dob: savedPerson.dob || '',
      location: savedPerson.address || '',
      email: savedPerson.email || '',
      phone: savedPerson.number || '',
      Stage: savedPerson.stage || 'Win',
      lastUpdated: new Date().toISOString(),
      invitedBy: savedPerson.invitedBy || '',
      leaders: {
        leader1: savedPerson.invitedBy || '',
        leader12: savedPerson.leaders?.[0] || '',
        leader144: savedPerson.leaders?.[1] || '',
        leader1728: savedPerson.leaders?.[2] || ''
      }
    };

    if (editingPerson) {
      updatePersonInCache(editingPerson._id, mappedPerson);
      setSnackbar({ open: true, message: 'Person updated successfully', severity: 'success' });
    } else {
      addPersonToCache(mappedPerson);
      setSnackbar({ open: true, message: 'Person added successfully', severity: 'success' });
    }
  };

  const handleCloseDialog = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
    setFormData({
      name: '', surname: '', dob: '', address: '', email: '', number: '',
      invitedBy: '', gender: '', leader12: '', leader144: '', leader1728: '',
      stage: 'Win'
    });
  };

  const isSearching = searchTerm.trim().length > 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', mt: 8, px: 2, pb: 4 }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }} />}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, mb: 1 }}>
        <Typography variant="h6">
          {viewFilter === 'myPeople' ? 'My People' : 'All People'} 
          {isSearching && ` (${filteredPeople.length} results)`}
          {loading && <CircularProgress size={16} sx={{ ml: 2 }} />}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewFilter}
            exclusive
            onChange={handleViewFilterChange}
            size="small"
          >
            <Tooltip title="View All People" arrow>
              <ToggleButton value="all" aria-label="all people">
                <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                All
              </ToggleButton>
            </Tooltip>
            <Tooltip title="View My People Only" arrow>
              <ToggleButton value="myPeople" aria-label="my people">
                <PersonOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />
                Mine
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <Tooltip title="Grid View" arrow>
              <ToggleButton value="grid" aria-label="grid view">
                <ViewModuleIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="List View" arrow>
              <ToggleButton value="list" aria-label="list view">
                <ViewListIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
          
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, px: 1 }}>
        <TextField
          size="small"
          placeholder="Search (exact match)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="phone">Phone</MenuItem>
          <MenuItem value="location">Location</MenuItem>
          <MenuItem value="leaders">Leaders</MenuItem>
        </TextField>
      </Box>

      <Box sx={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 2, py: 2, mb: 2, position: 'relative' }}>
        {viewMode === 'grid' ? (
          <>
            <DragDropBoard
              people={paginatedPeople}
              setPeople={(updateFn) => {
                if (typeof updateFn === 'function') {
                  const updated = updateFn(paginatedPeople);
                  setAllPeople(prev => {
                    const newAll = [...prev];
                    updated.forEach(updatedPerson => {
                      const idx = newAll.findIndex(p => String(p._id) === String(updatedPerson._id));
                      if (idx !== -1) {
                        newAll[idx] = updatedPerson;
                      }
                    });
                    globalPeopleCache = newAll;
                    return newAll;
                  });
                }
              }}
              onEditPerson={handleEditPerson}
              onDeletePerson={(id) => {
                removePersonFromCache(id);
              }}
              loading={loading}
              updatePersonInCache={updatePersonInCache}
              allPeople={allPeople}
              setAllPeople={setAllPeople}
            />
            
            {!isSearching && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination 
                  count={totalPages} 
                  page={gridPage} 
                  onChange={(e, page) => setGridPage(page)}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ px: 2 }}>
            <PeopleListView
              people={filteredPeople}
              onEdit={handleEditPerson}
              onDelete={(id) => {
                removePersonFromCache(id);
              }}
              loading={loading}
            />
          </Box>
        )}

        <AddPersonDialog
          open={isModalOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveFromDialog}
          formData={formData}
          setFormData={setFormData}
          isEdit={!!editingPerson}
          personId={editingPerson?._id || null}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};