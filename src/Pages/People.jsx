// People.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from 'axios';
import {
  Box, Paper, Typography, Badge, useTheme, useMediaQuery, Card, CardContent,
  IconButton, Chip, Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
  TextField, InputAdornment, Button, Snackbar, Alert, Skeleton
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon,
  Phone as PhoneIcon, LocationOn as LocationIcon, Group as GroupIcon
} from '@mui/icons-material';
import AddPersonDialog from '../components/AddPersonDialog';

// Custom hook for debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

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
          {(person.leaders.leader12 || person.leaders.leader144 || person.leaders.leader1728) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
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
const DragDropBoard = ({ people, setPeople, onEditPerson, onDeletePerson, loading, updatePersonInCache }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStage = destination.droppableId;

    // Store the original people state in case we need to revert
    const originalPeople = [...people];

    // Optimistically update the UI first
    setPeople(prev => {
      const updated = [...prev];
      const movingIndex = updated.findIndex(p => String(p._id) === String(draggableId));
      if (movingIndex === -1) return prev;

      const [movingPerson] = updated.splice(movingIndex, 1);
      movingPerson.Stage = newStage;

      // Insert at correct index in destination Stage
      const stagePeople = updated.filter(p => p.Stage === newStage);
      let insertIndex = Math.min(destination.index, stagePeople.length);

      let fullIndex = 0, count = 0;
      while (fullIndex < updated.length) {
        if (updated[fullIndex].Stage === newStage) {
          if (count === insertIndex) break;
          count++;
        }
        fullIndex++;
      }

      updated.splice(fullIndex, 0, movingPerson);
      return updated;
    });

    // Now update the backend
    try {
      console.log(`Updating person ${draggableId} to stage: ${newStage}`);

      const response = await axios.patch(`${BACKEND_URL}/people/${draggableId}`, {
        Stage: newStage
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('Backend response:', response.data);

      // Update the cache with the backend response
      if (updatePersonInCache) {
        updatePersonInCache(draggableId, {
          Stage: response.data.Stage,
          lastUpdated: response.data.UpdatedAt
        });
      }

      // Verify the backend actually saved the correct stage
      if (response.data.Stage !== newStage) {
        console.warn(`Stage mismatch! Expected: ${newStage}, Got: ${response.data.Stage}`);
        // Update the frontend to match backend
        setPeople(prev => prev.map(p =>
          String(p._id) === String(draggableId) 
            ? { ...p, Stage: response.data.Stage, lastUpdated: response.data.UpdatedAt } 
            : p
        ));
      } else {
        // Update just the timestamp in the current view
        setPeople(prev => prev.map(p =>
          String(p._id) === String(draggableId) 
            ? { ...p, lastUpdated: response.data.UpdatedAt } 
            : p
        ));
      }

    } catch (err) {
      console.error("Failed to update Stage:", err);

      // Revert the optimistic update on error
      setPeople(originalPeople);

      // Show error message to user
      // Note: setSnackbar is not available in this component, you might want to pass it as a prop
      console.error(`Failed to move person: ${err?.response?.data?.detail || err?.message || 'Unknown error'}`);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {stages.map(Stage => (
        <Paper key={Stage.id} sx={{ flex: '1 0 250px', minWidth: 220, borderRadius: 2, p: 2 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1 }} />)}
        </Paper>
      ))}
    </Box>
  );

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

// ---------------- FloatingTunnelPagination ----------------
const FloatingTunnelPagination = ({ page, setPage, totalPages = 160, isSearching }) => {
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const containerCenter = container.offsetWidth / 2;
    const buttons = container.querySelectorAll('button');

    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const btnCenter = rect.left + rect.width / 2 - container.getBoundingClientRect().left;
      const offset = btnCenter - containerCenter;
      const rotation = Math.max(Math.min(offset / 5, 45), -45);
      const scale = Math.max(1 - Math.abs(offset) / 300, 0.8);
      btn.style.transform = `rotateY(${rotation}deg) scale(${scale})`;
      btn.style.zIndex = `${Math.floor(scale * 100)}`;
      btn.style.transition = 'transform 0.1s';
    });
  };

  useEffect(() => {
    handleScroll();
    const container = scrollRef.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Hide pagination when searching
  if (isSearching) return null;

  return (
    <Box
      ref={scrollRef}
      sx={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        overflowX: 'auto',
        maxWidth: '90%',
        py: 1,
        px: 1,
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 4,
        "&::-webkit-scrollbar": { height: 10 },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#888", borderRadius: 5 },
        "&::-webkit-scrollbar-track": { backgroundColor: "#f0f0f0", borderRadius: 5 },
        perspective: 800,
        zIndex: 999
      }}
    >
      {Array.from({ length: totalPages }, (_, i) => (
        <Button
          key={i + 1}
          onClick={() => setPage(i + 1)}
          variant={i + 1 === page ? 'contained' : 'outlined'}
          size="small"
          sx={{
            minWidth: 40,
            mx: 0.5,
            borderRadius: 10,
            px: 1.5,
            py: 0.5,
            textTransform: 'none',
            fontSize: 12,
            transformStyle: 'preserve-3d'
          }}
        >
          {i + 1}
        </Button>
      ))}
    </Box>
  );
};

// ---------------- PeopleSection ----------------
export const PeopleSection = () => {
  const theme = useTheme();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '', surname: '', dob: '', email: '', phone: '', homeAddress: '',
    invitedBy: '', gender: '', leader12: '', leader144: '', leader1728: '',
    Stage: 'Win'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [allPeople, setAllPeople] = useState([]); // Store all fetched people
  const [hasInitialFetch, setHasInitialFetch] = useState(false);

  const PER_PAGE = 200;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Use debounced search term to prevent lag
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms delay

  // Initial fetch function - only called once or on hard refresh
  const fetchAllPeople = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch a large amount or all people at once
      const res = await axios.get(`${BACKEND_URL}/people`, { 
        params: { perPage: 0 }, // perPage: 0 fetches all
        timeout: 80000 
      });
      const rawPeople = res.data?.results || [];

      const mapped = rawPeople.map(raw => ({
        _id: (raw._id || raw.id || "").toString(),
        name: (raw.Name || raw.name || "").toString().trim(),
        surname: (raw.Surname || raw.surname || "").toString().trim(),
        gender: (raw.Gender || raw.gender || "").toString().trim(),
        dob: raw.DateOfBirth || raw.Birthday || "",
        location: (raw.Location || raw.address || raw.HomeAddress || "").toString().trim(),
        email: (raw.Email || raw.email || "").toString().trim(),
        phone: (raw.Phone || raw.Number || "").toString().trim(),
        Stage: (raw.Stage || "Win").toString().trim(),
        lastUpdated: raw.UpdatedAt || null,
        leaders: {
          leader12: (raw["Leader @12"] || "").toString().trim(),
          leader144: (raw["Leader @144"] || "").toString().trim(),
          leader1728: (raw["Leader @1728"] || raw["Leader @ 1728"] || "").toString().trim(),
        }
      }));

      setAllPeople(mapped);
      setHasInitialFetch(true);

    } catch (err) {
      setSnackbar({ open: true, message: `Failed to load people: ${err?.message}`, severity: 'error' });
      setAllPeople([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized search function for better performance
  const searchPeople = useCallback((people, searchValue, field) => {
    if (!searchValue.trim()) return people;

    const searchLower = searchValue.toLowerCase().trim();
    
    return people.filter(person => {
      switch (field) {
        case 'name':
          return person.name.toLowerCase().includes(searchLower) || 
                 person.surname.toLowerCase().includes(searchLower) ||
                 `${person.name} ${person.surname}`.toLowerCase().includes(searchLower);
        case 'email':
          return person.email.toLowerCase().includes(searchLower);
        case 'phone':
          return person.phone.includes(searchValue); // Don't lowercase phone numbers
        case 'location':
          return person.location.toLowerCase().includes(searchLower);
        case 'leaders':
          return person.leaders.leader12.toLowerCase().includes(searchLower) ||
                 person.leaders.leader144.toLowerCase().includes(searchLower) ||
                 person.leaders.leader1728.toLowerCase().includes(searchLower);
        default:
          return person.name.toLowerCase().includes(searchLower);
      }
    });
  }, []);

  // Filter and paginate from cached data using debounced search
  const filteredAndPaginatedPeople = useMemo(() => {
    if (!hasInitialFetch) return [];

    // Apply search filter with debounced search term
    const filtered = searchPeople(allPeople, debouncedSearchTerm, searchField);

    // If searching, show all results (no pagination during search)
    if (debouncedSearchTerm.trim()) {
      return filtered; // Return all search results
    }

    // Apply pagination only when not searching
    const startIndex = (page - 1) * PER_PAGE;
    const endIndex = startIndex + PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  }, [allPeople, debouncedSearchTerm, searchField, page, hasInitialFetch, searchPeople]);

  // Calculate total pages for pagination
  const totalPages = useMemo(() => {
    if (!hasInitialFetch) return 0;
    if (debouncedSearchTerm.trim()) return 1; // Only one page when searching
    return Math.ceil(allPeople.length / PER_PAGE);
  }, [allPeople.length, debouncedSearchTerm, hasInitialFetch]);

  // Update people state when filtered data changes
  useEffect(() => {
    setPeople(filteredAndPaginatedPeople);
  }, [filteredAndPaginatedPeople]);

  // Reset to page 1 when search changes (but not for debounced changes)
  useEffect(() => { 
    setPage(1); 
  }, [searchField]); // Only reset page when search field changes, not search term

  // Reset to page 1 when starting a new search
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      setPage(1);
    }
  }, [debouncedSearchTerm]);

  // Initial fetch on component mount
  useEffect(() => {
    if (!hasInitialFetch) {
      fetchAllPeople();
    }
  }, [fetchAllPeople, hasInitialFetch]);

  // Function to manually refresh data (can be called by refresh button)
  const handleRefresh = () => {
    setHasInitialFetch(false);
    fetchAllPeople();
  };

  // Update a single person in the cached data
  const updatePersonInCache = useCallback((personId, updates) => {
    setAllPeople(prev => prev.map(person => 
      String(person._id) === String(personId) 
        ? { ...person, ...updates } 
        : person
    ));
  }, []);

  // Add person to cache
  const addPersonToCache = useCallback((newPerson) => {
    setAllPeople(prev => [...prev, newPerson]);
  }, []);

  // Remove person from cache
  const removePersonFromCache = useCallback((personId) => {
    setAllPeople(prev => prev.filter(person => String(person._id) !== String(personId)));
  }, []);

  const isSearching = debouncedSearchTerm.trim().length > 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', mt: 8, px: 2, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, mb: 1 }}>
        <Typography variant="h6">
          My People {isSearching && `(${people.length} results)`}
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </Box>

      {/* Search Controls */}
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

      <Box sx={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 2, py: 2, mb: 2, position: 'relative' }}>
        <DragDropBoard
          people={people}
          setPeople={setPeople}
          onEditPerson={(p) => { setEditingPerson(p); setIsModalOpen(true); }}
          onDeletePerson={(id) => {
            setPeople(prev => prev.filter(p => p._id !== id));
            removePersonFromCache(id);
          }}
          loading={loading}
          updatePersonInCache={updatePersonInCache}
        />

        <FloatingTunnelPagination 
          page={page} 
          setPage={setPage} 
          totalPages={totalPages}
          isSearching={isSearching}
        />

        <AddPersonDialog
          open={isModalOpen}
          formData={formData}
          setFormData={setFormData}
          editingPerson={editingPerson}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(newPerson) => {
            if (editingPerson) {
              updatePersonInCache(editingPerson._id, newPerson);
            } else {
              addPersonToCache(newPerson);
            }
          }}
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