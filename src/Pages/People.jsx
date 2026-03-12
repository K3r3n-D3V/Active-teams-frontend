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
  Search as SearchIcon, MoreVert as MoreVertIcon,
  Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon,
  Phone as PhoneIcon, LocationOn as LocationIcon, Group as GroupIcon,
  ViewModule as ViewModuleIcon, ViewList as ViewListIcon, People as PeopleIcon,
  PersonOutline as PersonOutlineIcon, EmojiEvents as WinIcon,
  Handshake as ConsolidateIcon, School as DiscipleIcon, Send as SendIcon
} from '@mui/icons-material';
import AddPersonDialog from '../components/AddPersonDialog';
import PeopleListView from '../components/PeopleListView';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Global cache outside component — persists across remounts
if (!window.globalPeopleCache) window.globalPeopleCache = null;
if (!window.globalCacheTimestamp) window.globalCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const stages = [
  { id: 'Win',         title: 'Win',         description: 'First stage — people won to the ministry.' },
  { id: 'Consolidate', title: 'Consolidate', description: 'Connected to leaders and the group.' },
  { id: 'Disciple',    title: 'Disciple',    description: 'Focused teaching and faith growth.' },
  { id: 'Send',        title: 'Send',        description: 'Mature people sent out to lead.' },
];

// ─── normalisePerson ──────────────────────────────────────────────────────────
// Reads from the NEW backend schema:
//   LeaderId (string), LeaderPath (array), Org_id, Organisation, UpdatedAt
// Old Leader @1 / @12 / @144 / @1728 fields are no longer sent by the backend.
function normalisePerson(raw) {
  const name    = (raw.Name    || raw.name    || '').toString().trim();
  const surname = (raw.Surname || raw.surname || '').toString().trim();
  const email   = (raw.Email   || raw.email   || '').toString().trim();
  const phone   = (raw.Number  || raw.Phone   || raw.phone || '').toString().trim();
  const address = (raw.Address || raw.address || '').toString().trim();

  // New schema — leader fields
  const leaderId = (raw.LeaderId || raw.leader_id || '').toString().trim();
  const leaderPath = (() => {
    const lp = raw.LeaderPath || raw.leader_path || [];
    if (Array.isArray(lp)) return lp.map(v => (v ?? '').toString().trim()).filter(Boolean);
    if (typeof lp === 'string') {
      try { const p = JSON.parse(lp); return Array.isArray(p) ? p.map(String) : [lp]; }
      catch { return lp ? [lp] : []; }
    }
    return [];
  })();

  // Combined string used for leader search filtering
  const leaderSearchStr = [leaderId, ...leaderPath].filter(Boolean).join(' ').toLowerCase();

  const organisation = (raw.Organisation || raw.organisation || '').toString().trim();
  const orgId        = (raw.Org_id || raw.org_id || raw.church_id || '').toString().trim();

  const fullName      = `${name} ${surname}`.trim();
  const fullNameLower = fullName.toLowerCase();

  return {
    _id:              (raw._id || raw.id || '').toString(),
    name, surname,
    fullName, fullNameLower,
    emailLower:       email.toLowerCase(),
    phoneLower:       phone.toLowerCase(),
    addressLower:     address.toLowerCase(),
    leaderSearchStr,
    gender:           (raw.Gender || raw.gender || '').toString().trim(),
    dob:               raw.Birthday || raw.DateOfBirth || '',
    location:          address,
    email, phone,
    Stage:            (raw.Stage || 'Win').toString().trim(),
    lastUpdated:       raw.UpdatedAt || null,
    invitedBy:        (raw.InvitedBy || '').toString().trim(),
    decisionType:     (raw.DecisionType || '').toString().trim(),
    decisionDate:     (raw.DecisionDate || '').toString().trim(),
    // New fields
    leaderId,
    leaderPath,
    organisation,
    orgId,
    _raw: raw,
  };
}

// ─── PersonCard ───────────────────────────────────────────────────────────────
const PersonCard = React.memo(({ person, onEdit, onDelete, isDragging }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = e => { e.stopPropagation(); setAnchorEl(e.currentTarget); };
  const handleMenuClose = () => setAnchorEl(null);
  const handleEdit   = () => { onEdit(person);       handleMenuClose(); };
  const handleDelete = () => { onDelete(person._id); handleMenuClose(); };

  const getInitials    = useCallback(name => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?', []);
  const getAvatarColor = useCallback(name => ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3'][(name?.length || 0) % 6], []);
  const formatDate     = useCallback(date => date ? new Date(date).toLocaleDateString() : '—', []);
  const getStageColor  = useCallback(stage => ({ Win:'success.main', Consolidate:'info.main', Disciple:'warning.main', Send:'error.main' }[stage] || 'primary.main'), []);

  // Show LeaderId as immediate leader; leaderPath length as depth indicator
  const leaderDisplay = person.leaderId || person.leaderPath?.[0] || '';
  const pathDepth     = person.leaderPath?.length ?? 0;

  return (
    <Card sx={{
      cursor: 'grab',
      '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' },
      transition: 'all 0.2s ease-in-out',
      boxShadow: isDragging ? 6 : 2,
      backgroundColor: isDragging ? 'action.selected' : 'background.paper',
      mb: 1,
    }}>
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: getAvatarColor(person.fullName), mr: 1 }}>
            {getInitials(person.fullName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>{person.name} {person.surname}</Typography>
            <Typography variant="caption" color="text.secondary">
              {person.gender}{person.gender && person.dob ? ' • ' : ''}{person.dob ? formatDate(person.dob) : ''}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}><MoreVertIcon fontSize="small" /></IconButton>
        </Box>

        {/* Contact */}
        <Box mb={1}>
          {person.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <EmailIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" noWrap>{person.email}</Typography>
            </Box>
          )}
          {person.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption">{person.phone}</Typography>
            </Box>
          )}
          {person.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" noWrap>{person.location}</Typography>
            </Box>
          )}
        </Box>

        {/* Leader — new schema */}
        {leaderDisplay && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, mb: 1 }}>
            <GroupIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" noWrap>
              <strong>Leader:</strong> {leaderDisplay}
              {pathDepth > 1 && (
                <Typography component="span" variant="caption" color="text.secondary">
                  {' '}(+{pathDepth - 1} in path)
                </Typography>
              )}
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={person.Stage} size="small"
            sx={{ height: 20, fontSize: 10, bgcolor: getStageColor(person.Stage), color: '#fff' }}
          />
          <Typography variant="caption" color="text.secondary">
            {person.lastUpdated ? formatDate(person.lastUpdated) : ''}
          </Typography>
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

// ─── DragDropBoard ────────────────────────────────────────────────────────────
const DragDropBoard = ({ people, onEditPerson, onDeletePerson, loading, updatePersonInCache, allPeople, setAllPeople }) => {
  const theme    = useTheme();
  const isSmall  = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const { authFetch } = useContext(AuthContext);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStage       = destination.droppableId;
    const originalPerson = allPeople.find(p => String(p._id) === String(draggableId));
    if (!originalPerson) return;

    // Optimistic update
    setAllPeople(prev => prev.map(p => String(p._id) === String(draggableId) ? { ...p, Stage: newStage } : p));

    try {
      const p = originalPerson;
      const response = await authFetch(`${BACKEND_URL}/people/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name:         p.name,
          Surname:      p.surname,
          Gender:       p.gender,
          Birthday:     p.dob,
          Address:      p.location,
          Email:        p.email,
          Number:       p.phone,
          Stage:        newStage,
          // New schema fields — no more Leader @N
          LeaderId:     p.leaderId     || '',
          LeaderPath:   p.leaderPath   || [],
          Org_id:       p.orgId        || '',
          Organisation: p.organisation || '',
        }),
      });

      const data = await response.json();
      const ts = data.UpdatedAt || new Date().toISOString();

      setAllPeople(prev => prev.map(p2 =>
        String(p2._id) === String(draggableId) ? { ...p2, Stage: newStage, lastUpdated: ts } : p2
      ));
      updatePersonInCache?.(draggableId, { Stage: newStage, lastUpdated: ts });
      window.globalPeopleCache = allPeople.map(p2 =>
        String(p2._id) === String(draggableId) ? { ...p2, Stage: newStage, lastUpdated: ts } : p2
      );
    } catch (err) {
      // Rollback on failure
      setAllPeople(prev => prev.map(p2 => String(p2._id) === String(draggableId) ? originalPerson : p2));
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
              bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.common.white,
            }}>
              <Box sx={{
                p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
              }}>
                <Typography variant="subtitle1" fontWeight={600}>{stage.title}</Typography>
                <Badge
                  badgeContent={stagePeople.length}
                  sx={{ '& .MuiBadge-badge': { bgcolor: theme.palette.mode === 'dark' ? '#fff' : '#000', color: theme.palette.mode === 'dark' ? '#000' : '#fff', fontSize: 10 } }}
                />
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
                      : <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>No people</Typography>
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

// ─── PeopleSection ────────────────────────────────────────────────────────────
export const PeopleSection = () => {
  const theme = useTheme();
  const { user, authFetch } = useContext(AuthContext);
  const { userProfile }     = useContext(UserContext);

  const currentUserName = useMemo(() => {
    if (user?.name && user?.surname) return `${user.name} ${user.surname}`.toLowerCase().trim();
    return (userProfile?.name || '').toLowerCase().trim();
  }, [user, userProfile]);

  const [allPeople,    setAllPeople]    = useState(window.globalPeopleCache || []);
  const [loading,      setLoading]      = useState(false);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchField,  setSearchField]  = useState('name');
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [editingPerson,setEditingPerson]= useState(null);
  const [formData,     setFormData]     = useState({
    name: '', surname: '', dob: '', address: '', email: '', number: '',
    invitedBy: '', gender: '', leaderId: '', leaderPath: [], stage: 'Win',
  });
  const [snackbar,    setSnackbar]    = useState({ open: false, message: '', severity: 'success' });
  const [viewMode,    setViewMode]    = useState('grid');
  const [viewFilter,  setViewFilter]  = useState('myPeople');
  const [stageFilter, setStageFilter] = useState('all');
  const [gridPage,    setGridPage]    = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const ITEMS_PER_PAGE        = 100;
  const isFetchingRef         = useRef(false);
  const searchDebounceRef     = useRef(null);
  const peopleFetchPromiseRef = useRef(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAllPeople = useCallback(async (forceRefresh = false) => {
    const now = Date.now();

    // Serve from window cache if still fresh
    if (!forceRefresh && window.globalPeopleCache && window.globalCacheTimestamp && (now - window.globalCacheTimestamp < CACHE_DURATION)) {
      setAllPeople(window.globalPeopleCache);
      return window.globalPeopleCache;
    }

    // Deduplicate in-flight requests
    if (isFetchingRef.current && peopleFetchPromiseRef.current) {
      try { return await peopleFetchPromiseRef.current || window.globalPeopleCache || []; }
      catch { return window.globalPeopleCache || []; }
    }

    isFetchingRef.current = true;
    setLoading(true);

    peopleFetchPromiseRef.current = (async () => {
      try {
        // ✅ Correct endpoint — returns all people with new schema fields
        const response = await authFetch(`${BACKEND_URL}/cache/people`);
        if (!response?.ok) throw new Error(`HTTP ${response?.status}: Failed to fetch people`);

        const data = await response.json();

        // Backend shape: { success: true, cached_data: [...] }
        const rawPeople = data?.cached_data || data?.results || [];

        if (!Array.isArray(rawPeople) || rawPeople.length === 0) {
          console.warn('[PeopleSection] /cache/people returned no records. Full response:', data);
        }

        const mapped = rawPeople.map(normalisePerson);

        window.globalPeopleCache    = mapped;
        window.globalCacheTimestamp = Date.now();
        setAllPeople(mapped);
        return mapped;
      } catch (err) {
        console.error('[PeopleSection] fetchAllPeople error:', err);
        setSnackbar({ open: true, message: `Failed to load people: ${err?.message}`, severity: 'error' });
        return window.globalPeopleCache || [];
      } finally {
        setLoading(false);
        isFetchingRef.current         = false;
        peopleFetchPromiseRef.current = null;
      }
    })();

    return await peopleFetchPromiseRef.current;
  }, [authFetch]);

  // ── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchTerm.trim()) setIsSearching(true);
    searchDebounceRef.current = setTimeout(() => { setDebouncedSearchTerm(searchTerm); setIsSearching(false); }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchTerm]);

  // ── Search ────────────────────────────────────────────────────────────────
  const searchPeople = useCallback((peopleList, searchValue, field = 'name') => {
    const rawQ = (searchValue || '').trim();
    if (!rawQ) return peopleList;
    const q = rawQ.toLowerCase();

    if (field === 'phone') {
      const digits = rawQ.replace(/\D/g, '');
      return digits ? peopleList.filter(p => (p.phone || '').replace(/\D/g, '').includes(digits)) : peopleList;
    }
    if (field === 'leaders') {
      return peopleList
        .filter(p => (p.leaderSearchStr || '').includes(q))
        .sort((a, b) => (a.leaderSearchStr || '').indexOf(q) - (b.leaderSearchStr || '').indexOf(q));
    }
    if (field === 'email')    return peopleList.filter(p => (p.emailLower   || '').includes(q)).sort((a,b) => (a.emailLower||'').indexOf(q) - (b.emailLower||'').indexOf(q));
    if (field === 'location') return peopleList.filter(p => (p.addressLower || '').includes(q)).sort((a,b) => (a.addressLower||'').indexOf(q) - (b.addressLower||'').indexOf(q));
    if (field === 'stage')    return peopleList.filter(p => (p.Stage || '').toLowerCase().includes(q));
    if (field === 'decision') return peopleList.filter(p => (p.decisionType || '').toLowerCase().includes(q));

    const tokens  = q.split(/\s+/).filter(Boolean);
    const matches = peopleList.filter(p => tokens.every(tok => (p.fullNameLower || '').includes(tok)));
    const score   = p => {
      const f = p.fullNameLower || '', n = (p.name||'').toLowerCase(), s = (p.surname||'').toLowerCase();
      if (f===q) return 0; if (f.startsWith(q)) return 1; if (n===q) return 2; if (s===q) return 3;
      if (n.startsWith(q)) return 4; if (s.startsWith(q)) return 5; return 10;
    };
    return matches.sort((a,b) => score(a) - score(b) || (a.fullNameLower||'').localeCompare(b.fullNameLower||''));
  }, []);

  // ── "My People" — current user matched against LeaderId OR LeaderPath ────
  const filterMyPeople = useCallback((list) => {
    if (!currentUserName) return list;
    const u = currentUserName.toLowerCase().trim();
    return list.filter(p =>
      (p.leaderId || '').toLowerCase() === u ||
      (p.leaderPath || []).some(lp => (lp || '').toLowerCase() === u)
    );
  }, [currentUserName]);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const filteredPeople = useMemo(() => {
    let r = allPeople;
    if (viewFilter === 'myPeople') r = filterMyPeople(r);
    if (stageFilter !== 'all')     r = r.filter(p => (p.Stage||'').trim().toLowerCase() === stageFilter.toLowerCase());
    if (debouncedSearchTerm.trim()) r = searchPeople(r, debouncedSearchTerm, searchField);
    return r;
  }, [allPeople, debouncedSearchTerm, searchField, viewFilter, stageFilter, searchPeople, filterMyPeople]);

  const paginatedPeople = useMemo(() => {
    if (viewMode === 'list' || debouncedSearchTerm.trim()) return filteredPeople;
    const s = (gridPage - 1) * ITEMS_PER_PAGE;
    return filteredPeople.slice(s, s + ITEMS_PER_PAGE);
  }, [filteredPeople, gridPage, viewMode, debouncedSearchTerm]);

  const totalPages = useMemo(() => {
    if (viewMode === 'list' || debouncedSearchTerm.trim()) return 1;
    return Math.ceil(filteredPeople.length / ITEMS_PER_PAGE);
  }, [filteredPeople.length, viewMode, debouncedSearchTerm]);

  const stageCounts = useMemo(() => {
    const base = viewFilter === 'myPeople' ? filterMyPeople(allPeople) : allPeople;
    return {
      Win:         base.filter(p => (p.Stage||'').trim().toLowerCase() === 'win').length,
      Consolidate: base.filter(p => (p.Stage||'').trim().toLowerCase() === 'consolidate').length,
      Disciple:    base.filter(p => (p.Stage||'').trim().toLowerCase() === 'disciple').length,
      Send:        base.filter(p => (p.Stage||'').trim().toLowerCase() === 'send').length,
      total:       base.length,
    };
  }, [allPeople, viewFilter, filterMyPeople]);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.globalPeopleCache && allPeople.length === 0) setAllPeople(window.globalPeopleCache);
    fetchAllPeople(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setGridPage(1); }, [debouncedSearchTerm, searchField, viewFilter, stageFilter]);

  // ── Cache helpers ─────────────────────────────────────────────────────────
  const updatePersonInCache = useCallback((personId, updates) => {
    setAllPeople(prev => {
      const updated = prev.map(person => {
        if (String(person._id) !== String(personId)) return person;
        const merged           = { ...person, ...updates };
        merged.fullName        = `${merged.name||''} ${merged.surname||''}`.trim();
        merged.fullNameLower   = merged.fullName.toLowerCase();
        merged.emailLower      = (merged.email    || '').toLowerCase();
        merged.phoneLower      = (merged.phone    || '').toLowerCase();
        merged.addressLower    = (merged.location || '').toLowerCase();
        merged.leaderSearchStr = [merged.leaderId, ...(merged.leaderPath||[])].filter(Boolean).join(' ').toLowerCase();
        return merged;
      });
      window.globalPeopleCache = updated;
      return updated;
    });
  }, []);

  const addPersonToCache = useCallback((newPerson) => {
    setAllPeople(prev => {
      const p              = { ...newPerson };
      p.fullName           = `${p.name||''} ${p.surname||''}`.trim();
      p.fullNameLower      = p.fullName.toLowerCase();
      p.emailLower         = (p.email    || '').toLowerCase();
      p.phoneLower         = (p.phone    || '').toLowerCase();
      p.addressLower       = (p.location || '').toLowerCase();
      p.leaderSearchStr    = [p.leaderId, ...(p.leaderPath||[])].filter(Boolean).join(' ').toLowerCase();
      const updated        = [...prev, p];
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

  // ── Dialog handlers ───────────────────────────────────────────────────────
  const handleEditPerson = (person) => {
    setEditingPerson(person);
    let formattedDob = '';
    if (person.dob) {
      try { const d = new Date(person.dob); if (!isNaN(d)) formattedDob = d.toISOString().split('T')[0]; } catch {}
    }
    setFormData({
      name:       person.name        || '',
      surname:    person.surname     || '',
      dob:        formattedDob,
      address:    person.location    || '',
      email:      person.email       || '',
      number:     person.phone       || '',
      invitedBy:  person.invitedBy   || '',
      gender:     person.gender      || '',
      leaderId:   person.leaderId    || '',
      leaderPath: person.leaderPath  || [],
      stage:      person.Stage       || 'Win',
    });
    setIsModalOpen(true);
  };

  const handleSaveFromDialog = (savedPerson) => {
    const mappedPerson = {
      _id:          savedPerson._id || editingPerson?._id,
      name:         savedPerson.name         || '',
      surname:      savedPerson.surname      || '',
      gender:       savedPerson.gender       || '',
      dob:          savedPerson.dob          || '',
      location:     savedPerson.address      || '',
      email:        savedPerson.email        || '',
      phone:        savedPerson.number       || '',
      Stage:        savedPerson.stage        || 'Win',
      lastUpdated:  new Date().toISOString(),
      invitedBy:    savedPerson.invitedBy    || '',
      decisionType: savedPerson.decisionType || '',
      organisation: savedPerson.organisation || '',
      leaderId:     savedPerson.leaderId     || '',
      leaderPath:   savedPerson.leaderPath   || [],
      orgId:        savedPerson.org_id       || '',
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
    setFormData({ name:'', surname:'', dob:'', address:'', email:'', number:'', invitedBy:'', gender:'', leaderId:'', leaderPath:[], stage:'Win' });
  };

  const isSearchingNow = debouncedSearchTerm.trim().length > 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', mt: 8, px: 2, pb: 4 }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }} />}

      {/* ── Stage filter cards ─────────────────────────────────────────────── */}
      <Box sx={{ maxWidth: '1400px', margin: '0 auto', width: '100%', mb: 3 }}>
        <Grid container spacing={2}>
          {[
            { id:'all',         label:'Total People', value: stageCounts.total,       icon:<PeopleIcon />,      color:'#2196f3' },
            { id:'Win',         label:'Win',          value: stageCounts.Win,          icon:<WinIcon />,         color:'#4caf50' },
            { id:'Consolidate', label:'Consolidate',  value: stageCounts.Consolidate,  icon:<ConsolidateIcon />, color:'#ff9800' },
            { id:'Disciple',    label:'Disciple',     value: stageCounts.Disciple,     icon:<DiscipleIcon />,    color:'#9c27b0' },
            { id:'Send',        label:'Send',         value: stageCounts.Send,         icon:<SendIcon />,        color:'#f44336' },
          ].map(stat => (
            <Grid item xs={6} sm={4} md={2.4} key={stat.id}>
              <Card
                onClick={() => setStageFilter(stat.id)}
                sx={{
                  height: 200, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
                  cursor:'pointer', transition:'transform 0.25s, box-shadow 0.25s',
                  border: stageFilter === stat.id ? `3px solid ${stat.color}` : '1px solid',
                  borderColor: stageFilter === stat.id ? stat.color : 'divider',
                  transform: stageFilter === stat.id ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: stageFilter === stat.id ? 6 : 2,
                  '&:hover': { transform:'scale(1.03)', boxShadow:6 },
                }}
              >
                <CardContent sx={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}>
                  <Avatar sx={{ bgcolor: stat.color, width:56, height:56, boxShadow:2 }}>{stat.icon}</Avatar>
                  <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', px:1, mb:1, flexWrap:'wrap', gap:1 }}>
        <Typography variant="h6" fontWeight={600}>
          {viewFilter === 'myPeople' ? 'My People' : 'All People'}
          {stageFilter !== 'all' && ` — ${stageFilter}`}
          {isSearchingNow && ` (${filteredPeople.length} results)`}
          {isSearching && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </Typography>
        <Box sx={{ display:'flex', gap:2, alignItems:'center', flexWrap:'wrap' }}>
          <ToggleButtonGroup value={viewFilter} exclusive onChange={(e,v) => { if(v) setViewFilter(v); }} size="small">
            <Tooltip title="All People" arrow><ToggleButton value="all"><PeopleIcon fontSize="small" sx={{ mr:0.5 }} />All</ToggleButton></Tooltip>
            <Tooltip title="My People" arrow><ToggleButton value="myPeople"><PersonOutlineIcon fontSize="small" sx={{ mr:0.5 }} />Mine</ToggleButton></Tooltip>
          </ToggleButtonGroup>
          <ToggleButtonGroup value={viewMode} exclusive onChange={(e,v) => { if(v) setViewMode(v); }} size="small">
            <Tooltip title="Grid View" arrow><ToggleButton value="grid"><ViewModuleIcon fontSize="small" /></ToggleButton></Tooltip>
            <Tooltip title="List View" arrow><ToggleButton value="list"><ViewListIcon  fontSize="small" /></ToggleButton></Tooltip>
          </ToggleButtonGroup>
          <Button variant="outlined" size="small" onClick={() => fetchAllPeople(true)} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <Box sx={{ display:'flex', gap:2, mb:2, px:1 }}>
        <TextField
          size="small" placeholder="Search…" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start">{isSearching ? <CircularProgress size={20}/> : <SearchIcon/>}</InputAdornment> }}
          sx={{ flex:1 }}
        />
        <TextField size="small" select value={searchField} onChange={e => setSearchField(e.target.value)} sx={{ minWidth:140 }}>
          <MenuItem value="name">Name</MenuItem>
          <MenuItem value="email">Email</MenuItem>
          <MenuItem value="phone">Phone</MenuItem>
          <MenuItem value="location">Location</MenuItem>
          <MenuItem value="leaders">Leader</MenuItem>
          <MenuItem value="decision">Decision Type</MenuItem>
        </TextField>
      </Box>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <Box sx={{ position:'relative' }}>
        {viewMode === 'grid' ? (
          <>
            <DragDropBoard
              people={paginatedPeople}
              onEditPerson={handleEditPerson}
              onDeletePerson={removePersonFromCache}
              loading={loading}
              updatePersonInCache={updatePersonInCache}
              allPeople={allPeople}
              setAllPeople={setAllPeople}
            />
            {!isSearchingNow && totalPages > 1 && (
              <Box sx={{ display:'flex', justifyContent:'center', mt:3 }}>
                <Pagination count={totalPages} page={gridPage} onChange={(e,p) => setGridPage(p)} color="primary" size="large" showFirstButton showLastButton />
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ px:2 }}>
            <PeopleListView
              people={filteredPeople}
              onEdit={handleEditPerson}
              onDelete={removePersonFromCache}
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
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          anchorOrigin={{ vertical:'bottom', horizontal:'right' }}
        >
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};