// People.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from 'axios';
import {
  Box, Paper, Typography, Badge, useTheme, useMediaQuery, Card, CardContent,
  IconButton, Chip, Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
  TextField, InputAdornment, Button, Snackbar, Alert, AppBar, Toolbar, Slide, Popover
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon,
  Phone as PhoneIcon, LocationOn as LocationIcon, Group as GroupIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import AddPersonDialog from '../components/AddPersonDialog';

// Slide transition for Snackbar
const slideTransition = (props) => <Slide {...props} direction="down" />;

// Define stages
const stages = [
  { id: 'Win', title: 'Win', description: 'This is the first stage where people are won to the ministry.' },
  { id: 'Consolidate', title: 'Consolidate', description: 'People are consolidated in the group and connected to leaders.' },
  { id: 'Disciple', title: 'Disciple', description: 'Focused teaching and growth to become strong in faith.' },
  { id: 'Send', title: 'Send', description: 'Mature people are sent out to lead or minister to others.' }
];

// Individual Person Card
const PersonCard = React.memo(({ person, onEdit, onDelete, isDragging = false }) => {
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
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: getAvatarColor(person.name), mr: 1 }}>
            {getInitials(person.name)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" noWrap>{person.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {person.gender} • {formatDate(person.dob)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}><MoreVertIcon fontSize="small" /></IconButton>
        </Box>

        <Box sx={{ mb: 1 }}>
          {person.email && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><EmailIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.email}</Typography></Box>}
          {person.phone && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.phone}</Typography></Box>}
          {person.location && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><LocationIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.location}</Typography></Box>}
          {person.cellLeader && <Box sx={{ display: 'flex', alignItems: 'center' }}><GroupIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.cellLeader}</Typography></Box>}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip label={person.stage} size="small" sx={{ height: 20, fontSize: 10, backgroundColor: getStageColor(person.stage), color: '#fff' }} />
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

// DragDrop board component
const DragDropBoard = ({ people, onDragEnd, onEditPerson, onDeletePerson, loading, currentPage, setCurrentPage, pageSize }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);

  const getPeopleByStage = useCallback(
    stage => people.filter(p => (p.stage || '').toLowerCase() === stage.toLowerCase()),
    [people]
  );
  const handlePopoverOpen = (event, stage) => { setAnchorEl(event.currentTarget); setCurrentStage(stage); };
  const handlePopoverClose = () => { setAnchorEl(null); setCurrentStage(null); };
  const popoverOpen = Boolean(anchorEl);

  if (loading) return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading people...</Typography>;

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', flexWrap: isSmall || isMedium ? 'wrap' : 'nowrap', gap: 3, justifyContent: 'center', flexDirection: isSmall ? 'column' : 'row', py: 1 }}>
          {stages.map(stage => {
            const stagePeopleAll = getPeopleByStage(stage.id);
            const start = (currentPage - 1) * pageSize;
            const stagePeople = stagePeopleAll.slice(start, start + pageSize);
            const stageWidth = isSmall ? '100%' : isMedium ? '45%' : '250px';

            return (
              <Paper key={stage.id} sx={{ flex: `0 0 ${stageWidth}`, minWidth: 220, borderRadius: 2, overflow: 'hidden', mb: isSmall || isMedium ? 2 : 0, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.common.white }}>
                <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100], color: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[900] }}>
                  <Typography variant="subtitle1">{stage.title}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge badgeContent={stagePeopleAll.length} sx={{ '& .MuiBadge-badge': { backgroundColor: theme.palette.mode === 'dark' ? '#fff' : '#000', color: theme.palette.mode === 'dark' ? '#000' : '#fff', fontSize: 10, transform: 'translateY(1px)', minWidth: 16, height: 16 } }} >
                      <Box sx={{ width: 18, height: 18 }} />
                    </Badge>
                    <IconButton size="small" onClick={(e) => handlePopoverOpen(e, stage)}>
                      <VisibilityIcon fontSize="small" sx={{ color: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.grey[900] }} />
                    </IconButton>
                  </Box>
                </Box>

                <Droppable droppableId={stage.id}>
                  {(provided) => (
                    <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ p: 1, minHeight: 140, maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden', backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[50] }}>
                      {stagePeople.length > 0 ? stagePeople.map((person, index) => (
                        <Draggable key={person._id} draggableId={person._id} index={index}>
                          {(provided, snapshot) => (
                            <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <PersonCard person={person} onEdit={onEditPerson} onDelete={onDeletePerson} isDragging={snapshot.isDragging} />
                            </Box>
                          )}
                        </Draggable>
                      )) : <Box sx={{ textAlign: 'center', border: '1px dashed', borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[500] : '#aaa', borderRadius: 1, p: 3, mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>Drop people here</Box>}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            );
          })}
        </Box>
      </DragDropContext>

      <Popover open={popoverOpen} anchorEl={anchorEl} onClose={handlePopoverClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }} PaperProps={{ sx: { p: 2, borderRadius: 2, boxShadow: 4, minWidth: 220, backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff' } }}>
        {currentStage && (
          <Box>
            <Typography variant="subtitle2">{currentStage.title}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{currentStage.description}</Typography>
          </Box>
        )}
      </Popover>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
        <Button size="small" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Previous</Button>
        <Typography sx={{ alignSelf: 'center' }}>Page {currentPage} of {Math.ceil(people.length / pageSize)}</Typography>
        <Button size="small" disabled={currentPage >= Math.ceil(people.length / pageSize)} onClick={() => setCurrentPage(prev => prev + 1)}>Next</Button>
      </Box>
    </>
  );
};

// Main People Section
export const PeopleSection = () => {
  const theme = useTheme();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({ name: '', surname: '', dob: '', email: '', phone: '', homeAddress: '', invitedBy: '', gender: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/people?perPage=0');
      const data = Array.isArray(res.data?.results) ? res.data.results.map(p => ({
        _id: p._id,
        name: p.Name || "",
        surname: p.Surname || "",
        gender: p.Gender || "",
        dob: p.DateOfBirth || "",
        location: p.Location || "",
        email: p.Email || "",
        phone: p.Phone || "",
        homeAddress: p.HomeAddress || "",
        stage: p.Stage || "Win",
        lastUpdated: p.UpdatedAt || null,
        cellLeader: p.Leader || ""
      })) : [];
      setPeople(data);
    } catch (err) {
      console.error('Error fetching people:', err);
      setSnackbar({ open: true, message: 'Failed to load people', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPeople(); }, []);

const filteredPeople = useMemo(() => {
  const search = searchTerm.toLowerCase().trim().split(/\s+/); // split search into words
  return people.filter(p => {
    const fullName = `${p.name} ${p.surname}`.toLowerCase();
    const leader = p.cellLeader?.toLowerCase() || "";

    // Check if every word in the search exists in either full name or leader
    return search.every(word =>
      fullName.includes(word) || leader.includes(word)
    );
  });
}, [people, searchTerm]);

  // Reset page if filtered list is shorter
  useEffect(() => {
    if (currentPage > Math.ceil(filteredPeople.length / pageSize)) setCurrentPage(1);
  }, [filteredPeople]);

  const handleDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    setPeople(prev => {
      const idx = prev.findIndex(p => p._id === draggableId);
      if (idx === -1) return prev;
      const movingPerson = { ...prev[idx], stage: destination.droppableId };
      const updatedList = [...prev];
      updatedList.splice(idx, 1);
      updatedList.splice(destination.index, 0, movingPerson);
      return updatedList;
    });

    try {
      await axios.post("http://localhost:8000/people", { _id: draggableId, Stage: destination.droppableId });
      setSnackbar({ open: true, message: "Stage updated successfully", severity: "success" });
    } catch (err) {
      console.error("Error updating stage:", err);
      setSnackbar({ open: true, message: "Failed to update stage", severity: "error" });
      fetchPeople();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', mt: 8, px: 2, pb: 4 }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ py: 0.5 }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>People</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => { setEditingPerson(null); setIsModalOpen(true); }}
            sx={{ ml: 2, backgroundColor: theme.palette.mode === 'dark' ? '#fff' : '#000', color: theme.palette.mode === 'dark' ? '#000' : '#fff', '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#222' }, textTransform: 'none' }}
          >Add</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ my: 2 }}>
        <TextField
          fullWidth size="small" placeholder="Search..."
          value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Box>

      <Typography variant="h6" sx={{ px: 1, mb: 1 }}>My People</Typography>
      <Box sx={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 2, py: 2, mb: 4 }}>
        <DragDropBoard
          people={filteredPeople}
          onDragEnd={handleDragEnd}
          onEditPerson={(p) => { setEditingPerson(p); setIsModalOpen(true); }}
          onDeletePerson={(id) => setPeople(prev => prev.filter(p => p._id !== id))}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
        />
      </Box>

      <AddPersonDialog
        open={isModalOpen}
        formData={formData}
        setFormData={setFormData}
        onClose={() => { setIsModalOpen(false); setEditingPerson(null); }}
        onSave={() => {
          const newPerson = { ...formData, _id: Date.now().toString(), stage: 'Win', lastUpdated: new Date() };
          setPeople(prev => [newPerson, ...prev]);
          setIsModalOpen(false);
          setSnackbar({ open: true, message: editingPerson ? 'Person updated' : 'Person added', severity: 'success' });
        }}
        editingPerson={editingPerson}
      />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} TransitionComponent={slideTransition}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

