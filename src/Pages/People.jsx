import React, { useState, useEffect, useMemo, useCallback, useRef, useContext } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AuthContext } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';
import {
  Box, Paper, Typography, Badge, useTheme, useMediaQuery, Card, CardContent,
  IconButton, Chip, Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
  TextField, InputAdornment, Button, Snackbar, Alert, Skeleton, ToggleButton,
  ToggleButtonGroup, Tooltip, Pagination, CircularProgress, LinearProgress, Grid
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon,
  Phone as PhoneIcon, LocationOn as LocationIcon, Group as GroupIcon,
  ViewModule as ViewModuleIcon, ViewList as ViewListIcon, People as PeopleIcon,
  PersonOutline as PersonOutlineIcon, EmojiEvents as WinIcon,
  Handshake as ConsolidateIcon, School as DiscipleIcon, Send as SendIcon
} from '@mui/icons-material';
import AddPersonDialog from '../components/AddPersonDialog';
import PeopleListView from '../components/PeopleListView';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import PeopleImportFAB from '../components/PeopleImportFAB';

if (!window.globalPeopleCache) window.globalPeopleCache = null;
if (!window.globalCacheTimestamp) window.globalCacheTimestamp = null;
if (!window.globalPeopleCacheOrg) window.globalPeopleCacheOrg = null;
const CACHE_DURATION = 5 * 60 * 1000;

function getLeadersByLevel(person) {
  if (Array.isArray(person?.leaders) && person.leaders.length > 0) {
    const map = {};
    for (const l of person.leaders) {
      if (l?.level != null && l?.name) {
        map[`leader${l.level}`] = l.name;
      }
    }
    if (Object.keys(map).length > 0) return map;
  }
  const l1 = person?.["Leader @1"] || "";
  const l12 = person?.["Leader @12"] || "";
  const l144 = person?.["Leader @144"] || "";
  const l1728 = person?.["Leader @1728"] || "";
  const map = {};
  if (l1) map.leader1 = l1;
  if (l12) map.leader12 = l12;
  if (l144) map.leader144 = l144;
  if (l1728) map.leader1728 = l1728;
  return map;
}

function getLeadersCombined(person) {
  return Object.values(getLeadersByLevel(person)).join(" ");
}

const stages = [
  { id: 'Win', title: 'Win' },
  { id: 'Consolidate', title: 'Consolidate' },
  { id: 'Disciple', title: 'Disciple' },
  { id: 'Send', title: 'Send' },
];

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

  const leaderEntries = useMemo(() => {
    if (Array.isArray(person.leadersRaw) && person.leadersRaw.length > 0) {
      return person.leadersRaw
        .filter(l => l?.name)
        .map(l => ([`leader${l.level}`, l.name]));
    }
    const map = getLeadersByLevel(person);
    return Object.entries(map).filter(([, name]) => name);
  }, [person]);

  return (
    <Card sx={{
      cursor: 'grab',
      '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' },
      transition: 'all 0.2s ease-in-out',
      boxShadow: isDragging ? 6 : 2,
      backgroundColor: isDragging ? 'action.selected' : 'background.paper',
      mb: 1,
    }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: getAvatarColor(`${person.name} ${person.surname}`), mr: 1 }}>
            {getInitials(`${person.name} ${person.surname}`)}
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

          {/* dynamic leaders — renders all levels */}
          {leaderEntries.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              {leaderEntries.map(([key, name]) => {
                const level = key.replace("leader", "");
                return (
                  <Box key={key} sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption">Leader @{level}: {name}</Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip label={person.Stage} size="small"
            sx={{ height: 20, fontSize: 10, backgroundColor: getStageColor(person.Stage), color: '#fff' }} />
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

    setAllPeople(prev => prev.map(p => String(p._id) === String(draggableId) ? { ...p, Stage: newStage } : p));

    try {
      const response = await authFetch(`${BACKEND_URL}/people/${draggableId}`, {
        method: 'PATCH',
        body: JSON.stringify({ Stage: newStage }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      setAllPeople(prev => prev.map(p =>
        String(p._id) === String(draggableId)
          ? { ...p, Stage: newStage, lastUpdated: data.person?.UpdatedAt || new Date().toISOString() }
          : p
      ));

      if (updatePersonInCache) {
        updatePersonInCache(draggableId, { Stage: newStage, lastUpdated: data.person?.UpdatedAt || new Date().toISOString() });
      }

      window.globalPeopleCache = allPeople.map(p =>
        String(p._id) === String(draggableId)
          ? { ...p, Stage: newStage, lastUpdated: data.person?.UpdatedAt || new Date().toISOString() }
          : p
      );
    } catch (err) {
      console.error("Failed to update Stage:", err.message || err);
      setAllPeople(prev => prev.map(p => String(p._id) === String(draggableId) ? originalPerson : p));
      alert(`Failed to update stage: ${err.message || 'Unknown error'}`);
    }
  };

  if (loading && people.length === 0 && !window.globalPeopleCache) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {stages.map(s => (
          <Paper key={s.id} sx={{ flex: '1 0 250px', minWidth: 220, borderRadius: 2, p: 2 }}>
            {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1 }} />)}
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', flexWrap: isSmall || isMedium ? 'wrap' : 'nowrap', gap: 3, justifyContent: 'center', py: 1 }}>
        {stages.map(stage => {
          const stagePeople = people.filter(p =>
            (p.Stage || '').trim().toLowerCase() === stage.id.toLowerCase() && (p.name || p.surname)
          );
          const stageWidth = isSmall ? '100%' : isMedium ? '45%' : '250px';
          return (
            <Paper key={stage.id} sx={{
              flex: `0 0 ${stageWidth}`, minWidth: 220, borderRadius: 2, overflow: 'hidden',
              mb: isSmall || isMedium ? 2 : 0,
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.common.white,
            }}>
              <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100] }}>
                <Typography variant="subtitle1">{stage.title}</Typography>
                <Badge badgeContent={stagePeople.length} sx={{ '& .MuiBadge-badge': { backgroundColor: theme.palette.mode === 'dark' ? '#fff' : '#000', color: theme.palette.mode === 'dark' ? '#000' : '#fff', fontSize: 10 } }} />
              </Box>
              <Droppable droppableId={stage.id}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ p: 1, minHeight: 140, maxHeight: '400px', overflowY: 'auto' }}>
                    {stagePeople.length > 0
                      ? stagePeople.map((person, index) => (
                        <Draggable key={person._id} draggableId={String(person._id)} index={index}>
                          {(provided, snapshot) => (
                            <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <PersonCard person={person} onEdit={onEditPerson} onDelete={onDeletePerson} isDragging={snapshot.isDragging} />
                            </Box>
                          )}
                        </Draggable>
                      ))
                      : <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>No people</Typography>
                    }
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

export const PeopleSection = () => {
  const theme = useTheme();
  const { user, authFetch } = useContext(AuthContext);
  const { userProfile } = useContext(UserContext);

  const currentUserOrg = useMemo(() => {
    const org = user?.org_id || user?.organization || user?.Organization || "";
    return org.toLowerCase().replace(" ", "-");
  }, [user]);

  const currentUserName = (user?.name && user?.surname)
    ? `${(user.name || '').trim()} ${(user.surname || '').trim()}`.toLowerCase()
    : (userProfile?.name ? userProfile.name.toLowerCase() : '').trim();

  const [personToDelete, setPersonToDelete] = useState(null);
  const [allPeople, setAllPeople] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '', surname: '', dob: '', address: '', email: '', number: '',
    invitedBy: '', gender: '', leader12: '', leader144: '', leader1728: '', stage: 'Win',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('grid');
  const [viewFilter, setViewFilter] = useState('myPeople');
  const [stageFilter, setStageFilter] = useState('all');
  const [gridPage, setGridPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ source: '', org: '' });
  const ITEMS_PER_PAGE = 100;

  const isFetchingRef = useRef(false);
  const searchDebounceRef = useRef(null);
  const peopleFetchPromiseRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const fetchAllPeople = useCallback(async (forceRefresh = false) => {
  const now = Date.now();
  const orgKey = currentUserOrg;
 
  if (window.globalPeopleCacheOrg && window.globalPeopleCacheOrg !== orgKey) {
    console.log(`Org changed from ${window.globalPeopleCacheOrg} to ${orgKey} — clearing cache`);
    window.globalPeopleCache = null;
    window.globalCacheTimestamp = null;
    window.globalPeopleCacheOrg = null;
  }
 
  if (
    !forceRefresh &&
    window.globalPeopleCache &&
    window.globalCacheTimestamp &&
    (now - window.globalCacheTimestamp < CACHE_DURATION)
  ) {
    setAllPeople(window.globalPeopleCache);
    setCacheInfo({ source: 'local-cache', org: orgKey });
    return window.globalPeopleCache;
  }
 
  // ── KEY FIX ──────────────────────────────────────────────────────────────────
  // When forceRefresh is true we must abandon any in-progress fetch and start
  // fresh. Without this, a pending peopleFetchPromiseRef from a prior load
  // (e.g. the initial mount) returns stale data and the import results never
  // appear in the board.
  if (forceRefresh) {
    isFetchingRef.current = false;
    peopleFetchPromiseRef.current = null;
  }
  // ─────────────────────────────────────────────────────────────────────────────
 
  if (isFetchingRef.current && peopleFetchPromiseRef.current) {
    try { return await peopleFetchPromiseRef.current || window.globalPeopleCache || []; }
    catch { return window.globalPeopleCache || []; }
  }
 
  isFetchingRef.current = true;
  setLoading(true);
 
  peopleFetchPromiseRef.current = (async () => {
    try {
      const response = await authFetch(`${BACKEND_URL}/cache/people`);
      if (!response || !response.ok) throw new Error('Failed to fetch people');
      const data = await response.json();
 
      if (!data.success) throw new Error(data.error || 'Cache returned error');
 
      console.log(`People loaded: ${data.total_count} records | source: ${data.source} | org: ${data.organization}`);
      setCacheInfo({ source: data.source, org: data.organization || orgKey });
 
      const rawPeople = data?.cached_data || [];
 
      const mapped = rawPeople.map(raw => {
        const name    = (raw.Name    || raw.name    || '').toString().trim();
        const surname = (raw.Surname || raw.surname || '').toString().trim();
        const email   = (raw.Email   || raw.email   || '').toString().trim();
        const phone   = (raw.Number  || raw.Phone   || raw.phone || '').toString().trim();
        const address = (raw.Address || raw.address || '').toString().trim();
 
        const leaderMap      = getLeadersByLevel(raw);
        const leadersCombined = Object.values(leaderMap).join(' ');
        const fullName       = `${name} ${surname}`.trim();
 
        return {
          _id:               (raw._id || raw.id || '').toString(),
          name,
          surname,
          fullName,
          fullNameLower:     fullName.toLowerCase(),
          emailLower:        email.toLowerCase(),
          phoneLower:        phone.toLowerCase(),
          addressLower:      address.toLowerCase(),
          gender:            (raw.Gender || raw.gender || '').toString().trim(),
          dob:               raw.Birthday || raw.DateOfBirth || '',
          location:          address,
          email,
          phone,
          Stage:             (raw.Stage || 'Win').toString().trim(),
          lastUpdated:       raw.UpdatedAt || null,
          invitedBy:         (raw.InvitedBy || '').toString().trim(),
          org_id:            raw.org_id || '',
          Organization:      raw.Organization || raw.Organisation || '',
          ...leaderMap,
          leaders:           leaderMap,
          leadersCombinedLower: leadersCombined.toLowerCase(),
          leadersRaw:        Array.isArray(raw.leaders) ? raw.leaders : [],
        };
      });
 
      window.globalPeopleCache    = mapped;
      window.globalCacheTimestamp = Date.now();
      window.globalPeopleCacheOrg = orgKey;
      setAllPeople(mapped);
      return mapped;
    } catch (err) {
      console.error('Fetch error:', err);
      setSnackbar({ open: true, message: `Failed to load people: ${err?.message}`, severity: 'error' });
      if (window.globalPeopleCache) {
        setAllPeople(window.globalPeopleCache);
        return window.globalPeopleCache;
      }
      return [];
    } finally {
      setLoading(false);
      isFetchingRef.current      = false;
      peopleFetchPromiseRef.current = null;
    }
  })();
 
  return await peopleFetchPromiseRef.current;
}, [BACKEND_URL, authFetch, currentUserOrg]);

const refetchPeople = useCallback(async () => {
  console.log('Refetching people after import...');
  setIsRefreshing(true);
  try {
    // Clear window-level cache
    window.globalPeopleCache    = null;
    window.globalCacheTimestamp = null;
    window.globalPeopleCacheOrg = null;
 
    // ── KEY FIX: reset the in-progress guard so fetchAllPeople(true)
    // is guaranteed to start a fresh request, even if an earlier load
    // is still in-flight (e.g. the initial mount fetch).
    isFetchingRef.current      = false;
    peopleFetchPromiseRef.current = null;
 
    await fetchAllPeople(true);
 
    setSnackbar({
      open:     true,
      message:  'People list refreshed — new imports are now visible.',
      severity: 'success',
    });
  } catch (error) {
    console.error('Error refreshing people:', error);
    setSnackbar({
      open:     true,
      message:  'Failed to refresh people data',
      severity: 'error',
    });
  } finally {
    setIsRefreshing(false);
  }
}, [fetchAllPeople]);

  const prevOrgRef = useRef(currentUserOrg);
  useEffect(() => {
    if (prevOrgRef.current !== currentUserOrg) {
      console.log(`Org changed: ${prevOrgRef.current} → ${currentUserOrg}`);
      prevOrgRef.current = currentUserOrg;
      window.globalPeopleCache = null;
      window.globalCacheTimestamp = null;
      window.globalPeopleCacheOrg = null;
      setAllPeople([]);
      fetchAllPeople(true);
    }
  }, [currentUserOrg, fetchAllPeople]);

  useEffect(() => {
    if (window.globalPeopleCache && window.globalPeopleCacheOrg === currentUserOrg) {
      setAllPeople(window.globalPeopleCache);
    }
    fetchAllPeople(false);
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchTerm.trim()) setIsSearching(true);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchTerm]);

  const searchPeople = useCallback((peopleList, searchValue, field = 'name') => {
    const rawQ = (searchValue || "").trim();
    if (!rawQ) return peopleList;
    const q = rawQ.toLowerCase();

    if (field === 'phone') {
      const digits = rawQ.replace(/\D/g, "");
      if (!digits) return peopleList;
      return peopleList.filter(p => (p.phone || "").replace(/\D/g, "").includes(digits));
    }
    if (field === 'leaders') {
      const matches = peopleList.filter(p => (p.leadersCombinedLower || "").includes(q));
      return matches.sort((a, b) => (a.leadersCombinedLower || "").indexOf(q) - (b.leadersCombinedLower || "").indexOf(q));
    }
    if (field === 'email') {
      const matches = peopleList.filter(p => (p.emailLower || "").includes(q));
      return matches.sort((a, b) => (a.emailLower || "").indexOf(q) - (b.emailLower || "").indexOf(q));
    }
    if (field === 'location') {
      const matches = peopleList.filter(p => (p.addressLower || "").includes(q));
      return matches.sort((a, b) => (a.addressLower || "").indexOf(q) - (b.addressLower || "").indexOf(q));
    }
    if (field === 'stage') {
      return peopleList.filter(p => (p.Stage || "").toLowerCase().includes(q));
    }

    const tokens = q.split(/\s+/).filter(Boolean);
    const matches = peopleList.filter(p => {
      const full = p.fullNameLower || '';
      return tokens.every(tok => full.includes(tok));
    });

    const scoreFor = (p) => {
      const full = p.fullNameLower || '';
      const name = (p.name || '').toLowerCase();
      const surname = (p.surname || '').toLowerCase();
      if (full === q) return 0;
      if (full.startsWith(q)) return 1;
      if (name === q) return 2;
      if (surname === q) return 3;
      if (name.startsWith(q)) return 4;
      if (surname.startsWith(q)) return 5;
      if (tokens.every(tok => name.startsWith(tok) || surname.startsWith(tok))) return 6;
      if (full.indexOf(tokens[0]) === 0) return 7;
      return 10;
    };

    matches.sort((a, b) => {
      const diff = scoreFor(a) - scoreFor(b);
      if (diff !== 0) return diff;
      return (a.fullNameLower || '').localeCompare(b.fullNameLower || '');
    });
    return matches;
  }, []);

  const filterMyPeople = useCallback((peopleList) => {
    if (!currentUserName) return peopleList;
    const userName = currentUserName.toLowerCase().trim();
    return peopleList.filter(person =>
      Object.values(person.leaders || {}).some(name =>
        name && name.toLowerCase() === userName
      )
    );
  }, [currentUserName]);

  const filteredPeople = useMemo(() => {
    let result = allPeople;
    if (viewFilter === 'myPeople') result = filterMyPeople(result);
    if (stageFilter !== 'all') result = result.filter(p => (p.Stage || '').trim().toLowerCase() === stageFilter.toLowerCase());
    if (debouncedSearchTerm.trim()) result = searchPeople(result, debouncedSearchTerm, searchField);
    return result;
  }, [allPeople, debouncedSearchTerm, searchField, viewFilter, stageFilter, searchPeople, filterMyPeople]);

  const paginatedPeople = useMemo(() => {
    if (viewMode === 'list' || debouncedSearchTerm.trim()) return filteredPeople;
    const startIndex = (gridPage - 1) * ITEMS_PER_PAGE;
    return filteredPeople.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPeople, gridPage, viewMode, debouncedSearchTerm]);

  const totalPages = useMemo(() => {
    if (viewMode === 'list' || debouncedSearchTerm.trim()) return 1;
    return Math.ceil(filteredPeople.length / ITEMS_PER_PAGE);
  }, [filteredPeople.length, viewMode, debouncedSearchTerm]);

  const stageCounts = useMemo(() => {
    let base = allPeople;
    if (viewFilter === 'myPeople') base = filterMyPeople(base);
    return {
      Win: base.filter(p => (p.Stage || '').trim().toLowerCase() === 'win').length,
      Consolidate: base.filter(p => (p.Stage || '').trim().toLowerCase() === 'consolidate').length,
      Disciple: base.filter(p => (p.Stage || '').trim().toLowerCase() === 'disciple').length,
      Send: base.filter(p => (p.Stage || '').trim().toLowerCase() === 'send').length,
      total: base.length,
    };
  }, [allPeople, viewFilter, filterMyPeople]);

  useEffect(() => { setGridPage(1); }, [debouncedSearchTerm, searchField, viewFilter, stageFilter]);

  const updatePersonInCache = useCallback((personId, updates) => {
    setAllPeople(prev => {
      const updated = prev.map(person => {
        if (String(person._id) !== String(personId)) return person;
        const merged = { ...person, ...updates };
        merged.fullName = `${merged.name || ''} ${merged.surname || ''}`.trim();
        merged.fullNameLower = merged.fullName.toLowerCase();
        merged.emailLower = (merged.email || '').toLowerCase();
        merged.phoneLower = (merged.phone || '').toLowerCase();
        merged.addressLower = (merged.location || '').toLowerCase();
        merged.leadersCombinedLower = getLeadersCombined(merged).toLowerCase();
        return merged;
      });
      window.globalPeopleCache = updated;
      return updated;
    });
  }, []);

  const addPersonToCache = useCallback((newPerson) => {
    setAllPeople(prev => {
      const p = { ...newPerson };
      p.fullName = `${p.name || ''} ${p.surname || ''}`.trim();
      p.fullNameLower = p.fullName.toLowerCase();
      p.emailLower = (p.email || '').toLowerCase();
      p.phoneLower = (p.phone || '').toLowerCase();
      p.addressLower = (p.location || '').toLowerCase();
      p.leadersCombinedLower = getLeadersCombined(p).toLowerCase();
      const updated = [...prev, p];
      window.globalPeopleCache = updated;
      return updated;
    });
  }, []);

  const removePersonFromCache = useCallback((personId) => {
    setAllPeople(prev => {
      const updated = prev.filter(p => String(p._id) !== String(personId));
      window.globalPeopleCache = updated;
      return updated;
    });
  }, []);

  const handleRefresh = () => fetchAllPeople(true);
  const handleViewFilterChange = (e, v) => { if (v !== null) setViewFilter(v); };
  const handleViewChange = (e, v) => { if (v !== null) setViewMode(v); };

  const handleEditPerson = (person) => {
    setEditingPerson(person);
    let formattedDob = '';
    if (person.dob) {
      try {
        const d = new Date(person.dob);
        if (!isNaN(d.getTime())) formattedDob = d.toISOString().split('T')[0];
      } catch { }
    }
    const lm = person.leaders || {};
    setFormData({
      name: person.name || '',
      surname: person.surname || '',
      dob: formattedDob,
      address: person.location || '',
      email: person.email || '',
      number: person.phone || '',
      invitedBy: lm.leader1 || person.invitedBy || '',
      gender: person.gender || '',
      leader12: lm.leader12 || '',
      leader144: lm.leader144 || '',
      leader1728: lm.leader1728 || '',
      stage: person.Stage || 'Win',
    });
    setIsModalOpen(true);
  };

  const handleDeletePerson = (personId) => {
    const person = allPeople.find(p => String(p._id) === String(personId));
    setPersonToDelete(person);
  };

  const handleConfirmDelete = async () => {
    if (!personToDelete) return;
    try {
      const res = await authFetch(`${BACKEND_URL}/people/${personToDelete._id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Delete failed'); }
      removePersonFromCache(personToDelete._id);
      setSnackbar({ open: true, message: 'Person deleted successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Delete failed', severity: 'error' });
    } finally {
      setPersonToDelete(null);
    }
  };


const handleSaveFromDialog = useCallback(async (savedPerson) => {
  const leadersMap = {
    leader1: savedPerson.invitedBy || '',
    leader12: savedPerson.leader12 || '',
    leader144: savedPerson.leader144 || '',
    leader1728: savedPerson.leader1728 || '',
  };
  const leadersCombined = Object.values(leadersMap).join(' ');

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
    leaders: leadersMap,
    leadersCombinedLower: leadersCombined.toLowerCase(),
    leadersRaw: savedPerson.leaders || [],
  };

  if (editingPerson) {
    // Edit: optimistic local update is fine — person already exists in the list
    updatePersonInCache(editingPerson._id, mappedPerson);
    setSnackbar({ open: true, message: 'Person updated successfully', severity: 'success' });
  } else {
    // Add: clear cache and fetch fresh from server so org-scoped data is correct
    setSnackbar({ open: true, message: 'Person added — refreshing list…', severity: 'info' });

    window.globalPeopleCache = null;
    window.globalCacheTimestamp = null;
    window.globalPeopleCacheOrg = null;

    try {
      await fetchAllPeople(true);
      setSnackbar({ open: true, message: 'Person added successfully', severity: 'success' });
    } catch (err) {
      console.error('Refresh after add failed:', err);
      addPersonToCache(mappedPerson); // fallback: at least show optimistic record
      setSnackbar({ open: true, message: 'Person added (refresh list if needed)', severity: 'warning' });
    }
  }
}, [editingPerson, updatePersonInCache, addPersonToCache, fetchAllPeople]);

  const handleCloseDialog = () => {
    setIsModalOpen(false);
    setEditingPerson(null);
    setFormData({ name: '', surname: '', dob: '', address: '', email: '', number: '', invitedBy: '', gender: '', leader12: '', leader144: '', leader1728: '', stage: 'Win' });
  };

  const isSearchingNow = debouncedSearchTerm.trim().length > 0;

  const getResponsiveValue = (xs, sm, md, lg, xl) => {
    if (window.innerWidth >= theme.breakpoints.values.xl) return xl;
    if (window.innerWidth >= theme.breakpoints.values.lg) return lg;
    if (window.innerWidth >= theme.breakpoints.values.md) return md;
    if (window.innerWidth >= theme.breakpoints.values.sm) return sm;
    return xs;
  };
  const cardSpacing = getResponsiveValue(1.5, 2, 2.5, 3, 3);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', mt: 8, px: 2, pb: 4 }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }} />}

      {/* Stage filter cards */}
      <Box sx={{ maxWidth: '1400px', margin: '0 auto', width: '100%', mb: 3 }}>
        <Grid container spacing={cardSpacing}>
          {[
            { id: 'all', label: 'Total People', value: stageCounts.total, icon: <PeopleIcon />, color: '#2196f3' },
            { id: 'Win', label: 'Win', value: stageCounts.Win, icon: <WinIcon />, color: '#4caf50' },
            { id: 'Consolidate', label: 'Consolidate', value: stageCounts.Consolidate, icon: <ConsolidateIcon />, color: '#ff9800' },
            { id: 'Disciple', label: 'Disciple', value: stageCounts.Disciple, icon: <DiscipleIcon />, color: '#9c27b0' },
            { id: 'Send', label: 'Send', value: stageCounts.Send, icon: <SendIcon />, color: '#f44336' },
          ].map((stat) => (
            <Grid item xs={6} sm={4} md={2.4} key={stat.id}>
              <Card sx={{
                width: '100%', height: 200, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                border: stageFilter === stat.id ? `3px solid ${stat.color}` : '1px solid',
                borderColor: stageFilter === stat.id ? stat.color : 'divider',
                transform: stageFilter === stat.id ? 'scale(1.03)' : 'scale(1)',
                boxShadow: stageFilter === stat.id ? 6 : 2,
                '&:hover': { transform: 'scale(1.03)', boxShadow: 6 },
              }} onClick={() => setStageFilter(stat.id)}>
                <CardContent sx={{ textAlign: 'center', p: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56, mb: 1, boxShadow: 2 }}>{stat.icon}</Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ lineHeight: 1 }}>{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', px: 1, mb: 1 }}>
        <Box>
          <Typography variant="h6">
            {viewFilter === 'myPeople' ? 'My People' : 'All People'}
            {stageFilter !== 'all' && ` — ${stageFilter}`}
            {isSearchingNow && ` (${filteredPeople.length} results)`}
            {isSearching && <CircularProgress size={16} sx={{ ml: 1 }} />}
            {isRefreshing && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Typography>
          {/* Org + cache source indicator */}
          <Typography variant="caption" color="text.secondary">
            {cacheInfo.org
              ? `${cacheInfo.org.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
              : (user?.Organization || user?.organization || 'All Organizations')}
            {' · '}
            {allPeople.length} people loaded
            {cacheInfo.source && cacheInfo.source !== 'cache' && (
              <Chip
                label={cacheInfo.source === 'loading' ? 'Loading…' : cacheInfo.source}
                size="small"
                color={cacheInfo.source === 'stale_cache' ? 'warning' : 'default'}
                sx={{ ml: 1, height: 16, fontSize: '0.6rem' }}
              />
            )}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup value={viewFilter} exclusive onChange={handleViewFilterChange} size="small">
            <Tooltip title="View All People" arrow>
              <ToggleButton value="all" aria-label="all people">
                <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} /> All
              </ToggleButton>
            </Tooltip>
            <Tooltip title="View My People Only" arrow>
              <ToggleButton value="myPeople" aria-label="my people">
                <PersonOutlineIcon fontSize="small" sx={{ mr: 0.5 }} /> Mine
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
            <Tooltip title="Grid View" arrow>
              <ToggleButton value="grid" aria-label="grid view"><ViewModuleIcon fontSize="small" /></ToggleButton>
            </Tooltip>
            <Tooltip title="List View" arrow>
              <ToggleButton value="list" aria-label="list view"><ViewListIcon fontSize="small" /></ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
          <Button variant="outlined" size="small" onClick={handleRefresh} disabled={loading || isRefreshing}>
            {loading || isRefreshing ? 'Loading...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Search row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, px: 1 }}>
        <TextField size="small" placeholder="Search..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {isSearching ? <CircularProgress size={20} /> : <SearchIcon />}
              </InputAdornment>
            )
          }}
          sx={{ flex: 1 }} />
        <TextField size="small" select value={searchField} onChange={(e) => setSearchField(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="phone">Phone</MenuItem>
          <MenuItem value="location">Location</MenuItem>
          <MenuItem value="leaders">Leaders</MenuItem>
        </TextField>
      </Box>

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
                    updated.forEach(u => {
                      const idx = newAll.findIndex(p => String(p._id) === String(u._id));
                      if (idx !== -1) newAll[idx] = u;
                    });
                    window.globalPeopleCache = newAll;
                    return newAll;
                  });
                }
              }}
              onEditPerson={handleEditPerson}
              onDeletePerson={handleDeletePerson}
              loading={loading}
              updatePersonInCache={updatePersonInCache}
              allPeople={allPeople}
              setAllPeople={setAllPeople}
            />
            {!isSearchingNow && totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination count={totalPages} page={gridPage} onChange={(e, p) => setGridPage(p)}
                  color="primary" size="large" showFirstButton showLastButton />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ px: 2 }}>
            <PeopleListView people={filteredPeople} onEdit={handleEditPerson} onDelete={handleDeletePerson} loading={loading} />
          </Box>
        )}

        <AddPersonDialog
          open={isModalOpen} onClose={handleCloseDialog} onSave={handleSaveFromDialog}
          formData={formData} setFormData={setFormData}
          isEdit={!!editingPerson} personId={editingPerson?._id || null}
        />

        <DeleteConfirmationModal
          open={!!personToDelete}
          onClose={() => setPersonToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Person"
          content={`Are you sure you want to delete ${personToDelete?.fullName || 'this person'}? This action cannot be undone.`}
        />

        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>
      </Box>
      <PeopleImportFAB onImportComplete={refetchPeople} />
    </Box>
  );
};