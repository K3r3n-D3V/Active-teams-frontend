import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
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
  const { authFetch } = useContext(AuthContext);
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

      const response = await authFetch(`${BACKEND_URL}/people/${draggableId}`, {
        method: 'PATCH',
        body: JSON.stringify({
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
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      const updateWithTimestamp = (peopleArray) => {
        return peopleArray.map(p =>
          String(p._id) === String(draggableId)
            ? { ...p, Stage: newStage, lastUpdated: data.UpdatedAt || new Date().toISOString() }
            : p
        );
      };

      setAllPeople(updateWithTimestamp);

      if (updatePersonInCache) {
        updatePersonInCache(draggableId, {
          Stage: newStage,
          lastUpdated: data.UpdatedAt || new Date().toISOString()
        });
      }

    } catch (err) {
      console.error("Failed to update Stage:", err.message || err);

      setAllPeople(prev => prev.map(p =>
        String(p._id) === String(draggableId) ? originalPerson : p
      ));

      alert(`Failed to update stage: ${err.message || 'Unknown error'}`);
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
  const { user, authFetch } = useContext(AuthContext);
  const { userProfile } = useContext(UserContext);
  // ensure currentUserName is defined (fixes ReferenceError)
  const currentUserName = (user?.name && user?.surname)
    ? `${(user.name || '').trim()} ${(user.surname || '').trim()}`.toLowerCase()
    : (userProfile?.name ? userProfile.name.toLowerCase() : '').trim();
  const [allPeople, setAllPeople] = useState(globalPeopleCache || []);
  const [loading, setLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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
  const [viewFilter, setViewFilter] = useState('myPeople'); // 'all' or 'myPeople'
  const [gridPage, setGridPage] = useState(1);
  const ITEMS_PER_PAGE = 100;
  const isFetchingRef = useRef(false);
  const searchDebounceRef = useRef(null);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Fetch all people with caching and in-flight guard
  const fetchAllPeople = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && globalPeopleCache && globalCacheTimestamp && (now - globalCacheTimestamp < CACHE_DURATION)) {
      setAllPeople(globalPeopleCache);
      return globalPeopleCache;
    }

    if (isFetchingRef.current) {
      return globalPeopleCache || [];
    }

    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await authFetch(`${BACKEND_URL}/people?perPage=0`);
      if (!response || !response.ok) throw new Error('Failed to fetch people');
      const data = await response.json();
      const rawPeople = data?.results || [];
      const mapped = rawPeople.map(raw => {
        const name = (raw.Name || raw.name || "").toString().trim();
        const surname = (raw.Surname || raw.surname || "").toString().trim();
        const email = (raw.Email || raw.email || "").toString().trim();
        const phone = (raw.Number || raw.Phone || "").toString().trim();
        const address = (raw.Address || raw.address || "").toString().trim();
        const leader1 = (raw["Leader @1"] || "").toString().trim();
        const leader12 = (raw["Leader @12"] || "").toString().trim();
        const leader144 = (raw["Leader @144"] || "").toString().trim();
        const leader1728 = (raw["Leader @1728"] || "").toString().trim();

        const fullName = `${name} ${surname}`.trim();
        const fullNameLower = fullName.toLowerCase();
        const emailLower = email.toLowerCase();
        const leadersCombinedLower = `${leader1} ${leader12} ${leader144} ${leader1728}`.toLowerCase();
        const searchText = `${fullNameLower} ${emailLower} ${phone} ${address.toLowerCase()} ${leadersCombinedLower}`;

        return {
          _id: (raw._id || raw.id || "").toString(),
          name,
          surname,
          fullName,
          fullNameLower,
          emailLower,
          gender: (raw.Gender || raw.gender || "").toString().trim(),
          dob: raw.Birthday || raw.DateOfBirth || "",
          location: address,
          email,
          phone,
          Stage: (raw.Stage || "Win").toString().trim(),
          lastUpdated: raw.UpdatedAt || null,
          invitedBy: (raw.InvitedBy || "").toString().trim(),
          leaders: { leader1, leader12, leader144, leader1728 },
          searchText,
          leadersCombinedLower
        };
      });

      globalPeopleCache = mapped;
      globalCacheTimestamp = Date.now();
      setAllPeople(mapped);
      return mapped;
    } catch (err) {
      console.error('Fetch error:', err);
      setSnackbar({ open: true, message: `Failed to load people: ${err?.message}`, severity: 'error' });
      return globalPeopleCache || [];
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [BACKEND_URL, authFetch]);

useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    // slightly longer debounce to avoid excessive work on very large datasets
    searchDebounceRef.current = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchTerm]);
  useEffect(() => {
    let cancelled = false;
    const REFINEMENT_THRESHOLD = 2 * 60 * 1000; // 2 minutes

    const refineIfNeeded = async () => {
      if (!debouncedSearchTerm || !debouncedSearchTerm.trim()) return;

    return peopleList.filter(person => {
      switch (field) {
        case 'name': {
          const nameLower = person.name.toLowerCase();
          const surnameLower = person.surname.toLowerCase();
          const fullName = `${nameLower} ${surnameLower}`;
          
          return nameLower.includes(searchLower) ||
            surnameLower.includes(searchLower) ||
            fullName.includes(searchLower);
        }
        case 'email':
          return person.email.toLowerCase().includes(searchLower);
        case 'phone':
          return person.phone.includes(searchValue.trim());
        case 'location':
          return person.location.toLowerCase().includes(searchLower);
        case 'leaders': {
          const leader1Lower = person.leaders.leader1.toLowerCase();
          const leader12Lower = person.leaders.leader12.toLowerCase();
          const leader144Lower = person.leaders.leader144.toLowerCase();
          const leader1728Lower = person.leaders.leader1728.toLowerCase();

      // If we already have relatively fresh data and some local people, skip refinement
      if (globalPeopleCache && allPeople && allPeople.length > 0 && cacheAge < REFINEMENT_THRESHOLD) {
        return;
        await fetchAllPeople(false);
      } catch (e) {
        // ignore - keep whatever results the local quick-search produced
        console.error("Refinement failed:", e);
      } finally {
        if (!cancelled) setIsRefining(false);
      }
    };
    refineIfNeeded();
    return () => { cancelled = true; };
  }, [debouncedSearchTerm, fetchAllPeople, allPeople]);

  // Optimized search function
  const searchPeople = useCallback((peopleList, searchValue, field = 'name') => {
    const rawQ = (searchValue || "").trim();
    const q = rawQ.toLowerCase();
    if (!q) return peopleList;

    // phone: digits-only match
    if (field === 'phone') {
      const digits = rawQ.replace(/\D/g, "");
      if (!digits) return peopleList;
    }

    // leaders: match against precomputed leadersCombinedLower
    if (field === 'leaders') {
      return peopleList.filter(p => (p.leadersCombinedLower || "").includes(q));
    }

    // email: match emailLower
    if (field === 'email') {
      return peopleList.filter(p => (p.emailLower || "").includes(q));
    }

    // location: match location string (use searchText fallback but prefer location)
    if (field === 'location') {
      return peopleList.filter(p => (p.location || "").toLowerCase().includes(q));
    }

    // stage: exact-ish match
    if (field === 'stage') {
      return peopleList.filter(p => (p.Stage || "").toLowerCase().includes(q));
    }

    // NAME search: match tokens and rank results so exact/full-name matches surface first
    // split query into tokens
    const tokens = q.split(/\s+/).filter(Boolean);
    const matches = peopleList.filter(p => {
      const full = p.fullNameLower || `${(p.name||'')} ${(p.surname||'')}`.toLowerCase();
      return tokens.every(tok => full.includes(tok));
    });

    // scoring: exact full match -> startsWith -> includes
    const scoreFor = (p) => {
      const full = p.fullNameLower || '';
      if (full === q) return 0;
      if (full.startsWith(q)) return 1;
      // count tokens at front matches higher
      const tokenMatchCount = tokens.reduce((c, t) => c + (full.indexOf(t) === 0 ? 1 : 0), 0);
      if (tokenMatchCount === tokens.length) return 2;
      return 3;
    };

    matches.sort((a,b) => scoreFor(a) - scoreFor(b));
    return matches;
  }, []);

  const filterMyPeople = useCallback((peopleList) => {
    if (!currentUserName) return peopleList;

    const userName = currentUserName.toLowerCase().trim();

    return peopleList.filter(person => {
      return person.leaders.leader1.toLowerCase() === userName ||
        person.leaders.leader12.toLowerCase() === userName ||
        person.leaders.leader144.toLowerCase() === userName ||
        person.leaders.leader1728.toLowerCase() === userName;
    });
  }, [currentUserName]);

  // Use debounced search term
  const filteredPeople = useMemo(() => {
    let result = allPeople;

    if (viewFilter === 'myPeople') {
      result = filterMyPeople(result);
    }

    result = searchPeople(result, debouncedSearchTerm, searchField);

    return result;
  }, [allPeople, debouncedSearchTerm, searchField, viewFilter, searchPeople, filterMyPeople]);

  const paginatedPeople = useMemo(() => {
    if (viewMode === 'list' || debouncedSearchTerm.trim()) {
      return filteredPeople;
    }

    const startIndex = (gridPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPeople.slice(startIndex, endIndex);
  }, [filteredPeople, gridPage, viewMode, debouncedSearchTerm]);

  const totalPages = useMemo(() => {
    if (viewMode === 'list' || debouncedSearchTerm.trim()) return 1;
    return Math.ceil(filteredPeople.length / ITEMS_PER_PAGE);
  }, [filteredPeople.length, viewMode, debouncedSearchTerm]);

  useEffect(() => {
    if (globalPeopleCache && allPeople.length === 0) {
      setAllPeople(globalPeopleCache);
    }

    fetchAllPeople(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setGridPage(1);
  }, [debouncedSearchTerm, searchField, viewFilter]);

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
      const updated = prev.map(person => {
        if (String(person._id) !== String(personId)) return person;
        const merged = { ...person, ...updates };
        merged.fullName = `${(merged.name || '')} ${(merged.surname || '')}`.trim();
        merged.fullNameLower = (merged.fullName || '').toLowerCase();
        merged.emailLower = (merged.email || '').toLowerCase();
        merged.leadersCombinedLower = `${merged.leaders?.leader1 || ''} ${merged.leaders?.leader12 || ''} ${merged.leaders?.leader144 || ''} ${merged.leaders?.leader1728 || ''}`.toLowerCase();
        merged.searchText = `${merged.fullNameLower} ${merged.emailLower} ${(merged.phone||'')} ${(merged.location||'').toLowerCase()} ${merged.leadersCombinedLower}`;
        return merged;
      });
       globalPeopleCache = updated;
       return updated;
     });
  }, []);
 
  const addPersonToCache = useCallback((newPerson) => {
    setAllPeople(prev => {
      const p = { ...newPerson };
      p.fullName = `${(p.name || '')} ${(p.surname || '')}`.trim();
      p.fullNameLower = (p.fullName || '').toLowerCase();
      p.emailLower = (p.email || '').toLowerCase();
      p.leadersCombinedLower = `${p.leaders?.leader1 || ''} ${p.leaders?.leader12 || ''} ${p.leaders?.leader144 || ''} ${p.leaders?.leader1728 || ''}`.toLowerCase();
      p.searchText = `${p.fullNameLower} ${p.emailLower} ${(p.phone||'')} ${(p.location||'').toLowerCase()} ${p.leadersCombinedLower}`;
      const updated = [...prev, p];
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
      invitedBy: person.leaders?.leader1 || person.invitedBy || '',
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
        leader12: savedPerson.leader12 || '',
        leader144: savedPerson.leader144 || '',
        leader1728: savedPerson.leader1728 || ''
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

  const isSearching = debouncedSearchTerm.trim().length > 0;

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
          placeholder="Search..."
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
            {/* small refinement indicator shown while background fetch completes */}
      {isRefining && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, mb: 2 }}>
          <CircularProgress size={14} />
          <Typography variant="caption" color="text.secondary">Results are being refined…</Typography>
        </Box>
      )}

      {stageFilter !== 'all' && (
        <Box sx={{ px: 1, mb: 2 }}>
          <Chip 
            label={`Filtered by: ${stageFilter.charAt(0).toUpperCase() + stageFilter.slice(1)}`}
            onDelete={() => setStageFilter('all')}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      <Box sx={{ position: 'relative' }}>
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