import React, { useState, useEffect } from "react";
import { 
  Box, 
  Paper, 
  IconButton, 
  useTheme, 
  Typography, 
  Alert, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
  Card,
  CardContent,
  TextField,
  TablePagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useMediaQuery
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import MergeIcon from "@mui/icons-material/Merge";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown Date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Helper function to extract events from response
const toArray = (resData) =>
  Array.isArray(resData)
    ? resData
    : Array.isArray(resData?.results)
      ? resData.results
      : Array.isArray(resData?.events)
        ? resData.events
        : [];

function EventHistory({ 
  onViewDetails,
  onViewNewPeople,
  onViewConverts,
  events = []
}) {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localEvents, setLocalEvents] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  
  // Dialog states
  const [detailsDialog, setDetailsDialog] = useState({ open: false, event: null });
  const [newPeopleDialog, setNewPeopleDialog] = useState({ open: false, event: null });
  const [convertsDialog, setConvertsDialog] = useState({ open: false, event: null });

  // Pagination for mobile cards
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [search, setSearch] = useState("");

  const displayEvents = events.length > 0 ? events : localEvents;


const fetchEvents = async () => {
  if (events.length > 0) return;

  try {
    setLoading(true);
    setError(null);
    setHasFetched(true);
    
    const token = localStorage.getItem('token');
    
    if (!API_URL) {
      throw new Error('API URL is not configured');
    }

    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    const response = await fetch(`${API_URL}/events/global`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      throw new Error('Authentication failed. Your session may have expired. Please log in again.');
    }

    if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to view events.');
    }

    if (!response.ok) {
      throw new Error(`Failed to load events (Error ${response.status}). Please try again.`);
    }

    const data = await response.json();
    
    console.log('📋 Raw events data for history:', data);

    // Handle different response structures using toArray
    const eventsData = toArray(data);
    
    console.log('🔍 All events from API:', eventsData);

    // ✅ FIXED: Transform the data to match what the frontend expects
    const transformedEvents = eventsData.map(event => ({
      id: event._id || event.id,
      eventName: event.eventName || event.name || "Unnamed Event",
      status: event.status || "incomplete",
      isGlobal: event.isGlobal || true,
      isTicketed: event.isTicketed || false,
      date: event.date || event.createdAt || event.created_at,
      eventType: event.eventType || "Global Events",
      
      // ✅ FIXED: Use the correct data from backend
      total_attendance: event.total_attendance || event.attendees?.length || 0,
      attendees: event.attendees || [],
      did_not_meet: event.did_not_meet || false,
      
      // ✅ FIXED: Use the enhanced data from backend
      newPeople: event.newPeople || [], // This comes from get_new_people_for_event
      consolidations: event.consolidations || [], // This comes from get_consolidations_for_event
      summary: event.summary || {} // This comes from get_event_summary_stats
    }));
    
    setLocalEvents(transformedEvents);
    console.log(`🎯 Final events to display: ${transformedEvents.length}`, transformedEvents);

  } catch (err) {
    console.error('Error fetching events:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  // Check localStorage for cached events on component mount
  useEffect(() => {
    const cachedEvents = localStorage.getItem("events");
    if (cachedEvents && !events.length) {
      try {
        const parsedEvents = JSON.parse(cachedEvents);
        if (parsedEvents.length > 0) {
          setLocalEvents(parsedEvents);
          setHasFetched(true);
        }
      } catch (error) {
        console.error('Error parsing cached events:', error);
      }
    }
  }, [events.length]);

const getEventStats = (event) => {
  // ✅ FIXED: Use the data from the enhanced backend response
  const attendance = event.total_attendance || event.attendees?.length || 0;
  
  // Use newPeople array length from backend
  const newPeople = event.newPeople?.length || event.summary?.new_people || 0;
  
  // Use consolidations array length from backend  
  const consolidated = event.consolidations?.length || event.summary?.total_decisions || 0;

  return {
    attendance,
    newPeople,
    consolidated
  };
};

const handleViewDetails = (eventId) => {
  const event = displayEvents.find(e => e.id === eventId);
  if (onViewDetails) {
    onViewDetails(eventId);
  } else {
    // ✅ Show the attendees that were captured in that event
    setDetailsDialog({ open: true, event });
  }
};

const handleViewNewPeople = (eventId) => {
  const event = displayEvents.find(e => e.id === eventId);
  if (onViewNewPeople) {
    onViewNewPeople(eventId);
  } else {
    // ✅ Show the new people for this event
    setNewPeopleDialog({ open: true, event });
  }
};

const handleViewConverts = (eventId) => {
  const event = displayEvents.find(e => e.id === eventId);
  if (onViewConverts) {
    onViewConverts(eventId);
  } else {
    // ✅ Show the consolidations/decisions for this event
    setConvertsDialog({ open: true, event });
  }
};

  const rows = displayEvents.map((event) => {
    const stats = getEventStats(event);
    return {
      id: event.id,
      date: `${formatDate(event.date)} - ${event.eventName}`,
      attendanceCount: stats.attendance,
      newPeopleCount: stats.newPeople,
      consolidatedCount: stats.consolidated,
      eventId: event.id,
      rawEvent: event
    };
  });

  // Filter rows based on search
  const filteredRows = rows.filter(row => {
    const searchLower = search.toLowerCase();
    return row.date.toLowerCase().includes(searchLower);
  });

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns = [
    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 2, 
      minWidth: 200
    },
    { 
      field: 'attendanceCount', 
      headerName: 'Attendance', 
      flex: 1, 
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      type: 'number'
    },
    { 
      field: 'newPeopleCount', 
      headerName: 'New People', 
      flex: 1, 
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      type: 'number'
    },
    { 
      field: 'consolidatedCount', 
      headerName: 'Decisions', 
      flex: 1, 
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      type: 'number'
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip 
          label={params.row.rawEvent.status || 'Unknown'} 
          size="small"
          color={
            params.row.rawEvent.status === 'complete' ? 'success' :
            params.row.rawEvent.status === 'incomplete' ? 'warning' :
            params.row.rawEvent.did_not_meet ? 'error' : 'default'
          }
          variant="outlined"
        />
      )
    },
    {
      field: 'viewDetails',
      headerName: 'Details',
      width: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="small" 
          color="primary"
          onClick={() => handleViewDetails(params.row.eventId)}
          title="View Attendance Details"
          sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            '&:hover': { 
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          <GroupIcon fontSize="small" />
        </IconButton>
      )
    },
    {
      field: 'viewNewPeople',
      headerName: 'New',
      width: 80,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="small" 
          color="primary"
          onClick={() => handleViewNewPeople(params.row.eventId)}
          disabled={params.row.newPeopleCount === 0}
          title="View New People"
          sx={{ 
            backgroundColor: theme.palette.success.main,
            color: 'white',
            '&:hover': { 
              backgroundColor: theme.palette.success.dark
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
        >
          <PersonAddAltIcon fontSize="small" />
        </IconButton>
      )
    },
    {
      field: 'viewConverts',
      headerName: 'Decisions',
      width: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="small" 
          color="primary"
          onClick={() => handleViewConverts(params.row.eventId)}
          disabled={params.row.consolidatedCount === 0}
          title="View Decisions"
          sx={{ 
            backgroundColor: theme.palette.secondary.main,
            color: 'white',
            '&:hover': { 
              backgroundColor: theme.palette.secondary.dark
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
        >
          <MergeIcon fontSize="small" />
        </IconButton>
      )
    },
  ];

  // Event Card Component for Mobile
  const EventCard = ({ event, index }) => {
    const stats = getEventStats(event.rawEvent);
    
    return (
      <Card
        variant="outlined"
        sx={{
          mb: 1,
          boxShadow: 2,
          "&:last-child": { mb: 0 },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {index}. {event.rawEvent.eventName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(event.rawEvent.date)}
              </Typography>
              <Chip 
                label={event.rawEvent.status || 'Unknown'} 
                size="small" 
                color={
                  event.rawEvent.status === 'complete' ? 'success' :
                  event.rawEvent.status === 'incomplete' ? 'warning' :
                  event.rawEvent.did_not_meet ? 'error' : 'default'
                }
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" gap={1}>
            <Chip 
              icon={<GroupIcon />} 
              label={`${stats.attendance} Present`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
            <Chip 
              icon={<PersonAddAltIcon />} 
              label={`${stats.newPeople} New`} 
              size="small" 
              color="success"
              variant="outlined"
            />
            <Chip 
              icon={<MergeIcon />} 
              label={`${stats.consolidated} Decisions`} 
              size="small" 
              color="secondary"
              variant="outlined"
            />
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleViewDetails(event.eventId)}
              sx={{ 
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': { 
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              <GroupIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleViewNewPeople(event.eventId)}
              disabled={stats.newPeople === 0}
              sx={{ 
                backgroundColor: theme.palette.success.main,
                color: 'white',
                '&:hover': { 
                  backgroundColor: theme.palette.success.dark
                },
                '&.Mui-disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled
                }
              }}
            >
              <PersonAddAltIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleViewConverts(event.eventId)}
              disabled={stats.consolidated === 0}
              sx={{ 
                backgroundColor: theme.palette.secondary.main,
                color: 'white',
                '&:hover': { 
                  backgroundColor: theme.palette.secondary.dark
                },
                '&.Mui-disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled
                }
              }}
            >
              <MergeIcon fontSize="small" />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Loading events...</Typography>
      </Box>
    );
  }

  if (error && !hasFetched) {
    return (
      <Box>
        <Alert 
          severity="error" 
          sx={{ m: 2, boxShadow: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchEvents} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          Error loading events: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchEvents} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          Error loading events: {error}
        </Alert>
      )}

      {/* Search bar for mobile */}
      {isMdDown && (
        <TextField
          size="small"
          placeholder="Search events..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          fullWidth
          sx={{ mb: 2, boxShadow: 1 }}
        />
      )}
      
      {displayEvents.length === 0 ? (
        <Paper 
          sx={{ 
            p: { xs: 2, sm: 4 }, 
            textAlign: 'center', 
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {loading ? 'Loading events...' : hasFetched ? 'No Events Found' : 'Event History'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading 
              ? 'Please wait while we fetch your events...'
              : hasFetched 
                ? 'Global events will appear here once they are created.'
                : 'Click the button below to load your event history.'
            }
          </Typography>
          {!loading && (
            <Button 
              variant="contained" 
              onClick={fetchEvents}
              startIcon={<RefreshIcon />}
              sx={{ mt: 2, boxShadow: 1 }}
            >
              {hasFetched ? 'Refresh Events' : 'Load Events'}
            </Button>
          )}
        </Paper>
      ) : isMdDown ? (
        // Mobile/Tablet View - Cards
        <Box>
          <Box 
            sx={{ 
              maxHeight: 500, 
              overflowY: "auto",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 1,
              boxShadow: 2
            }}
          >
            {paginatedRows.map((row, idx) => (
              <EventCard key={row.id} event={row} index={page * rowsPerPage + idx + 1} />
            ))}
          </Box>

          <TablePagination 
            component="div" 
            count={filteredRows.length} 
            page={page} 
            onPageChange={(e, newPage) => setPage(newPage)} 
            rowsPerPage={rowsPerPage} 
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
            rowsPerPageOptions={[25, 50, 100]} 
            sx={{ boxShadow: 2, borderRadius: 1, mt: 1 }}
          />
        </Box>
      ) : (
        // Desktop View - DataGrid
        <Paper 
          variant="outlined" 
          sx={{ 
            height: 600, 
            width: '100%',
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 100 } },
              sorting: {
                sortModel: [{ field: 'date', sort: 'desc' }],
              },
            }}
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-toolbarContainer': {
                p: 1,
                flexWrap: 'wrap'
              },
            }}
          />
        </Paper>
      )}

      {/* Attendance Details Dialog */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={() => setDetailsDialog({ open: false, event: null })}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmDown}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Attendance Details</Typography>
            <Typography variant="caption" color="text.secondary">
              {detailsDialog.event?.eventName} - {formatDate(detailsDialog.event?.date)}
            </Typography>
          </Box>
          <IconButton onClick={() => setDetailsDialog({ open: false, event: null })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" color="primary">
                {detailsDialog.event?.total_attendance || detailsDialog.event?.attendees?.length || 0}
              </Typography>
              <Chip 
                icon={<GroupIcon />} 
                label="Total Attendance" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">Attendees List:</Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {(detailsDialog.event?.attendees || []).map((attendee, index) => (
                <React.Fragment key={attendee.id || index}>
                  <ListItem>
                    <ListItemText 
                      primary={attendee.name || attendee.fullName || `Person ${index + 1}`}
                      secondary={
                        <Stack spacing={0.5}>
                          {attendee.phone && <Typography variant="caption">Phone: {attendee.phone}</Typography>}
                          {attendee.email && <Typography variant="caption">Email: {attendee.email}</Typography>}
                          {attendee.decision && <Typography variant="caption">Decision: {attendee.decision}</Typography>}
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < (detailsDialog.event?.attendees?.length - 1) && <Divider />}
                </React.Fragment>
              ))}
              {(!detailsDialog.event?.attendees || detailsDialog.event.attendees.length === 0) && (
                <ListItem>
                  <ListItemText primary="No attendee details available" />
                </ListItem>
              )}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, event: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New People Dialog */}
      <Dialog 
        open={newPeopleDialog.open} 
        onClose={() => setNewPeopleDialog({ open: false, event: null })}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmDown}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">New People</Typography>
            <Typography variant="caption" color="text.secondary">
              {newPeopleDialog.event?.eventName} - {formatDate(newPeopleDialog.event?.date)}
            </Typography>
          </Box>
          <IconButton onClick={() => setNewPeopleDialog({ open: false, event: null })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" color="success.main">
                {newPeopleDialog.event?.newPeople?.length || 0}
              </Typography>
              <Chip 
                icon={<PersonAddAltIcon />} 
                label="New People" 
                color="success" 
                variant="outlined"
              />
            </Box>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">New People List:</Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {(newPeopleDialog.event?.newPeople || []).map((person, index) => (
                <React.Fragment key={person.id || index}>
                  <ListItem>
                    <ListItemText 
                      primary={person.name || person.fullName || `Person ${index + 1}`}
                      secondary={
                        <Stack spacing={0.5}>
                          {person.phone && <Typography variant="caption">Phone: {person.phone}</Typography>}
                          {person.email && <Typography variant="caption">Email: {person.email}</Typography>}
                          {person.decision && <Typography variant="caption">Decision: {person.decision}</Typography>}
                          <Chip 
                            label="New Person" 
                            size="small" 
                            color="success" 
                            variant="outlined"
                          />
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < (newPeopleDialog.event?.newPeople?.length - 1) && <Divider />}
                </React.Fragment>
              ))}
              {(!newPeopleDialog.event?.newPeople || newPeopleDialog.event.newPeople.length === 0) && (
                <ListItem>
                  <ListItemText primary="No new people found for this event" />
                </ListItem>
              )}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPeopleDialog({ open: false, event: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Decisions Dialog */}
      <Dialog 
        open={convertsDialog.open} 
        onClose={() => setConvertsDialog({ open: false, event: null })}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmDown}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Decisions Made</Typography>
            <Typography variant="caption" color="text.secondary">
              {convertsDialog.event?.eventName} - {formatDate(convertsDialog.event?.date)}
            </Typography>
          </Box>
          <IconButton onClick={() => setConvertsDialog({ open: false, event: null })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h4" color="secondary.main">
                {convertsDialog.event?.consolidations?.length || 0}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip 
                  label={`First Time: ${convertsDialog.event?.summary?.first_time_decisions || 0}`}
                  color="primary" 
                  size="small"
                />
                <Chip 
                  label={`Recommitments: ${convertsDialog.event?.summary?.recommitments || 0}`}
                  color="secondary" 
                  size="small"
                />
              </Stack>
            </Box>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">Decisions List:</Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {(convertsDialog.event?.consolidations || []).map((person, index) => (
                <React.Fragment key={person.id || index}>
                  <ListItem>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography>{person.name || `${person.name} ${person.surname}` || `Person ${index + 1}`}</Typography>
                          <Chip 
                            label={person.type === 'first_time' ? 'First Time' : 'Recommitment'}
                            color={person.type === 'first_time' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          {person.phone && <Typography variant="caption">Phone: {person.phone}</Typography>}
                          {person.email && <Typography variant="caption">Email: {person.email}</Typography>}
                          {person.assigned_to && <Typography variant="caption">Assigned to: {person.assigned_to}</Typography>}
                          {person.decision_date && <Typography variant="caption">Date: {formatDate(person.decision_date)}</Typography>}
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < (convertsDialog.event?.consolidations?.length - 1) && <Divider />}
                </React.Fragment>
              ))}
              {(!convertsDialog.event?.consolidations || convertsDialog.event.consolidations.length === 0) && (
                <ListItem>
                  <ListItemText primary="No decisions recorded for this event" />
                </ListItem>
              )}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertsDialog({ open: false, event: null })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EventHistory;