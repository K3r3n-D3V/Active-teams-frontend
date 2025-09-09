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
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: getAvatarColor(person.name + " " + person.surname), mr: 1 }}>
            {getInitials(person.name + " " + person.surname)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" noWrap>{person.name} {person.surname}</Typography>
            <Typography variant="caption" color="text.secondary">{person.gender} • {formatDate(person.dob)}</Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}><MoreVertIcon fontSize="small" /></IconButton>
        </Box>

        <Box sx={{ mb: 1 }}>
          {person.email && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><EmailIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.email}</Typography></Box>}
          {person.phone && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.phone}</Typography></Box>}
          {person.location && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><LocationIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.location}</Typography></Box>}
          {person.leaders && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
              {person.leaders.leader12 && <Box sx={{ display: 'flex', alignItems: 'center' }}><GroupIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">Leader @12: {person.leaders.leader12}</Typography></Box>}
              {person.leaders.leader144 && <Box sx={{ display: 'flex', alignItems: 'center' }}><GroupIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">Leader @144: {person.leaders.leader144}</Typography></Box>}
              {person.leaders.leader1728 && <Box sx={{ display: 'flex', alignItems: 'center' }}><GroupIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">Leader @1728: {person.leaders.leader1728}</Typography></Box>}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip label={person.stage} size="small" sx={{ height: 20, fontSize: 10, backgroundColor: getStageColor(person.stage), color: '#fff' }} />
          <Typography variant="caption">Updated: {formatDate(person.lastUpdated)}</Typography>
        </Box>

        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          <MenuItem onClick={handleEdit}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon><ListItemText>Edit</ListItemText></MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Delete</ListItemText></MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
});

// ---------------- DragDropBoard ----------------
const DragDropBoard = ({ people, setPeople, onEditPerson, onDeletePerson, loading }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const BACKEND_URL = `http://127.0.0.1:8000`;

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setPeople(prev => {
      const updated = [...prev];
      const movingIndex = updated.findIndex(p => String(p._id) === String(draggableId));
      if (movingIndex === -1) return prev;
      const [movingPerson] = updated.splice(movingIndex, 1);
      movingPerson.stage = destination.droppableId;

      // Insert at correct index in destination stage
      const stagePeople = updated.filter(p => p.stage === destination.droppableId);
      let insertIndex = destination.index;
      if (insertIndex > stagePeople.length) insertIndex = stagePeople.length;

      let fullIndex = 0;
      let count = 0;
      while (fullIndex < updated.length) {
        if (updated[fullIndex].stage === destination.droppableId) {
          if (count === insertIndex) break;
          count++;
        }
        fullIndex++;
      }
      updated.splice(fullIndex, 0, movingPerson);
      return updated;
    });

    try {
      await axios.patch(`${BACKEND_URL}/people/${draggableId}`, { stage: destination.droppableId });
    } catch (err) {
      console.error("Failed to update stage:", err);
      // rollback if necessary
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {stages.map(stage => (
        <Paper key={stage.id} sx={{ flex: '1 0 250px', minWidth: 220, borderRadius: 2, p: 2 }}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1 }} />)}
        </Paper>
      ))}
    </Box>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', flexWrap: isSmall || isMedium ? 'wrap' : 'nowrap', gap: 3, justifyContent: 'center', py: 1 }}>
        {stages.map(stage => {
          const stagePeople = people.filter(p =>
            (p.stage || '').trim().toLowerCase() === stage.id.toLowerCase() &&
            (p.name || p.surname)
          );
          const stageWidth = isSmall ? '100%' : isMedium ? '45%' : '250px';
          return (
            <Paper key={stage.id} sx={{ flex: `0 0 ${stageWidth}`, minWidth: 220, borderRadius: 2, overflow: 'hidden', mb: isSmall || isMedium ? 2 : 0, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.common.white }}>
              <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100] }}>
                <Typography variant="subtitle1">{stage.title}</Typography>
                <Badge badgeContent={stagePeople.length} sx={{ '& .MuiBadge-badge': { backgroundColor: theme.palette.mode === 'dark' ? '#fff' : '#000', color: theme.palette.mode === 'dark' ? '#000' : '#fff', fontSize: 10 } }} />
              </Box>

              <Droppable droppableId={stage.id}>
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
const FloatingTunnelPagination = ({ page, setPage, totalPages = 160 }) => {
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
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

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
    stage: 'Win'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);

  const PER_PAGE = 200;
  const TOTAL_PAGES = 100;
  const BACKEND_URL = `http://127.0.0.1:8000`;

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    try {
      const params = { perPage: PER_PAGE, page };
      if (searchTerm.trim()) params[searchField] = searchTerm.trim();
      const res = await axios.get(`${BACKEND_URL}/people`, { params, timeout: 30000 });
      const rawPeople = res.data?.results || [];
      const mapped = rawPeople.map(raw => ({
        _id: (raw._id || raw.id || "").toString(),
        name: (raw.Name || raw.name || "").toString().trim(),
        surname: (raw.Surname || raw.surname || "").toString().trim(),
        gender: (raw.Gender || raw.gender || "").toString().trim(),
        dob: raw.DateOfBirth || raw.dob || "",
        location: (raw.Location || raw.address || "").toString().trim(),
        email: (raw.Email || raw.email || "").toString().trim(),
        phone: (raw.Phone || raw.Number || "").toString().trim(),
        stage: (raw.Stage || "Win").toString().trim(),
        lastUpdated: raw.UpdatedAt || null,
        leaders: {
          leader12: (raw["Leader @12"] || "").toString().trim(),
          leader144: (raw["Leader @144"] || "").toString().trim(),
          leader1728: (raw["Leader @ 1728"] || "").toString().trim()
        }
      })).filter(p => p._id);

      // Merge with local state to keep dragged cards
      setPeople(prev => {
        const prevMap = new Map(prev.map(p => [p._id, p]));
        return mapped.map(p => prevMap.get(p._id) || p);
      });

    } catch (err) {
      setSnackbar({ open: true, message: `Failed to load people: ${err?.message}`, severity: 'error' });
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, searchField]);

  useEffect(() => { setPage(1); }, [searchTerm, searchField]);
  useEffect(() => {
    const delayDebounce = setTimeout(() => { fetchPeople(); }, 300);
    return () => clearTimeout(delayDebounce);
  }, [page, searchTerm, searchField, fetchPeople]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', mt: 8, px: 2, pb: 4 }}>
      <Typography variant="h6" sx={{ px: 1, mb: 1 }}>My People</Typography>

      <Box sx={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 2, py: 2, mb: 2, position: 'relative' }}>
        <DragDropBoard
          people={people}
          setPeople={setPeople}
          onEditPerson={(p) => { setEditingPerson(p); setIsModalOpen(true); }}
          onDeletePerson={(id) => setPeople(prev => prev.filter(p => p._id !== id))}
          loading={loading}
        />

        <FloatingTunnelPagination page={page} setPage={setPage} totalPages={TOTAL_PAGES} />

        <AddPersonDialog
          open={isModalOpen}
          formData={formData}
          setFormData={setFormData}
          editingPerson={editingPerson}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchPeople}
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
