
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
  useMediaQuery,
  Skeleton,
  Tooltip
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import MergeIcon from "@mui/icons-material/Merge";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

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

// Skeleton Loader Components
const DataGridSkeleton = () => (
  <Paper variant="outlined" sx={{ height: 600, width: '100%', p: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Skeleton variant="text" width={200} height={40} />
      <Skeleton variant="rectangular" width={120} height={40} />
    </Box>
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      {[1, 2, 3, 4].map((item) => (
        <Skeleton key={item} variant="text" width={100} height={40} />
      ))}
    </Box>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
      <Box key={row} sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((col) => (
          <Skeleton 
            key={col} 
            variant="rectangular" 
            width={col === 1 ? 200 : col === 7 ? 80 : 100} 
            height={40} 
            sx={{ flex: col === 1 ? 2 : 1 }}
          />
        ))}
      </Box>
    ))}
  </Paper>
);

const MobileCardSkeleton = () => (
  <Card variant="outlined" sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box flex={1}>
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="rectangular" width={80} height={24} sx={{ mt: 1, borderRadius: 1 }} />
        </Box>
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} variant="rectangular" width={100} height={32} sx={{ borderRadius: 16 }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} variant="circular" width={40} height={40} />
        ))}
      </Box>
    </CardContent>
  </Card>
);

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
  const [eventStats, setEventStats] = useState({}); // Store stats for each event
  
  // Dialog states
  const [detailsDialog, setDetailsDialog] = useState({ open: false, event: null, data: [] });
  const [newPeopleDialog, setNewPeopleDialog] = useState({ open: false, event: null, data: [] });
  const [convertsDialog, setConvertsDialog] = useState({ open: false, event: null, data: [] });

  // Pagination for mobile cards
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [search, setSearch] = useState("");

  // Fetch closed events using the same endpoint as ServiceCheckIn
  const fetchClosedEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!BASE_URL) {
        throw new Error('API URL is not configured');
      }

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Use the same events endpoint as ServiceCheckIn
      const response = await fetch(`${BASE_URL}/events/global`, {
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

      // Transform events data
      const eventsData = data.events || data.results || [];
      
      // Filter only closed/complete events
      const closedEvents = eventsData.filter(event => {
        const status = (event.status || '').toLowerCase();
        return status === 'closed' || status === 'complete';
      });

      console.log('🔍 Closed events:', closedEvents);

      const transformedEvents = closedEvents.map(event => ({
        id: event._id || event.id,
        eventName: event.eventName || "Unnamed Event",
        status: (event.status || "closed").toLowerCase(),
        isGlobal: event.isGlobal !== false,
        isTicketed: event.isTicketed || false,
        date: event.date || event.createdAt,
        eventType: event.eventType || "Global Events"
      }));
      
      setLocalEvents(transformedEvents);
      
      // Pre-fetch stats for all events
      await fetchAllEventStats(transformedEvents);

    } catch (err) {
      console.error('Error fetching closed events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time data for a specific event
  const fetchEventRealTimeData = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/service-checkin/real-time-data?event_id=${eventId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch event data: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 Real-time data for event ${eventId}:`, data);
      console.log('✅ Sample attendee:', data.present_attendees?.[0]);
      console.log('✅ Sample new person:', data.new_people?.[0]);
      console.log('✅ Sample consolidation:', data.consolidations?.[0]);
      return data;
    } catch (error) {
      console.error('Error fetching real-time event data:', error);
      return null;
    }
  };

  // Fetch stats for all events
  const fetchAllEventStats = async (eventsList) => {
    const stats = {};
    
    // Use Promise.all to fetch all stats concurrently for faster loading
    const promises = eventsList.map(async (event) => {
      try {
        const realTimeData = await fetchEventRealTimeData(event.id);
        if (realTimeData) {
          stats[event.id] = {
            attendance: realTimeData.present_count || 0,
            newPeople: realTimeData.new_people_count || 0,
            consolidated: realTimeData.consolidation_count || 0,
            presentAttendees: realTimeData.present_attendees || [],
            newPeopleList: realTimeData.new_people || [],
            consolidationsList: realTimeData.consolidations || []
          };
        } else {
          stats[event.id] = {
            attendance: 0,
            newPeople: 0,
            consolidated: 0,
            presentAttendees: [],
            newPeopleList: [],
            consolidationsList: []
          };
        }
      } catch (error) {
        console.error(`Error fetching stats for event ${event.id}:`, error);
        stats[event.id] = {
          attendance: 0,
          newPeople: 0,
          consolidated: 0,
          presentAttendees: [],
          newPeopleList: [],
          consolidationsList: []
        };
      }
    });

    await Promise.all(promises);
    setEventStats(stats);
  };

  // Load events on component mount
  useEffect(() => {
    fetchClosedEvents();
  }, []);

  const handleRefresh = async () => {
    await fetchClosedEvents();
  };

// Handle viewing attendance details
  const handleViewDetails = async (eventId) => {
    const event = localEvents.find(e => e.id === eventId);
    const stats = eventStats[eventId];
    
    if (onViewDetails) {
      onViewDetails(event, stats?.presentAttendees || []);
    } else {
      setDetailsDialog({ 
        open: true, 
        event,
        data: stats?.presentAttendees || [] 
      });
    }
  };

  // Handle viewing new people
  const handleViewNewPeople = async (eventId) => {
    const event = localEvents.find(e => e.id === eventId);
    const stats = eventStats[eventId];
    
    if (onViewNewPeople) {
      onViewNewPeople(event, stats?.newPeopleList || []);
    } else {
      setNewPeopleDialog({ 
        open: true, 
        event,
        data: stats?.newPeopleList || [] 
      });
    }
  };

  // Handle viewing consolidations
  const handleViewConverts = async (eventId) => {
    const event = localEvents.find(e => e.id === eventId);
    const stats = eventStats[eventId];
    
    if (onViewConverts) {
      onViewConverts(event, stats?.consolidationsList || []);
    } else {
      setConvertsDialog({ 
        open: true, 
        event,
        data: stats?.consolidationsList || [] 
      });
    }
  };

  const getEventStats = (event) => {
    return eventStats[event.id] || {
      attendance: 0,
      newPeople: 0,
      consolidated: 0,
      presentAttendees: [],
      newPeopleList: [],
      consolidationsList: []
    };
  };

  const rows = localEvents.map((event) => {
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
      headerName: 'Event', 
      flex: 2, 
      minWidth: 250
    },
    { 
      field: 'attendanceCount', 
      headerName: 'Attendance', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Present
          </Typography>
        </Box>
      )
    },
    { 
      field: 'newPeopleCount', 
      headerName: 'New People', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="success.main" fontWeight="bold">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Added
          </Typography>
        </Box>
      )
    },
    { 
      field: 'consolidatedCount', 
      headerName: 'Decisions', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="secondary.main" fontWeight="bold">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Consolidated
          </Typography>
        </Box>
      )
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
            params.row.rawEvent.status === 'closed' ? 'success' :
            'default'
          }
          variant="outlined"
        />
      )
    },
    {
      field: 'viewDetails',
      headerName: 'View Attendance',
      width: 150,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title="View checked-in attendees">
          <Button 
            size="small" 
            variant="outlined"
            color="primary"
            startIcon={<VisibilityIcon />}
            onClick={() => handleViewDetails(params.row.eventId)}
            disabled={params.row.attendanceCount === 0}
          >
            View ({params.row.attendanceCount})
          </Button>
        </Tooltip>
      )
    },
    {
      field: 'viewNewPeople',
      headerName: 'View New People',
      width: 160,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title="View new people added">
          <Button 
            size="small" 
            variant="outlined"
            color="success"
            startIcon={<VisibilityIcon />}
            onClick={() => handleViewNewPeople(params.row.eventId)}
            disabled={params.row.newPeopleCount === 0}
          >
            View ({params.row.newPeopleCount})
          </Button>
        </Tooltip>
      )
    },
    {
      field: 'viewConverts',
      headerName: 'View Decisions',
      width: 160,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title="View consolidation decisions">
          <Button 
            size="small" 
            variant="outlined"
            color="secondary"
            startIcon={<VisibilityIcon />}
            onClick={() => handleViewConverts(params.row.eventId)}
            disabled={params.row.consolidatedCount === 0}
          >
            View ({params.row.consolidatedCount})
          </Button>
        </Tooltip>
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
          mb: 2,
          boxShadow: 2,
          "&:last-child": { mb: 0 },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={600}>
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
                  event.rawEvent.status === 'closed' ? 'success' :
                  'default'
                }
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          {/* Stats Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 1 }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {stats.attendance}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Present
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {stats.newPeople}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                New People
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h5" color="secondary.main" fontWeight="bold">
                {stats.consolidated}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Decisions
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Button 
              size="small" 
              variant="contained"
              color="primary"
              startIcon={<GroupIcon />}
              onClick={() => handleViewDetails(event.eventId)}
              disabled={stats.attendance === 0}
              sx={{ flex: 1, minWidth: 100 }}
            >
              Attendance
            </Button>
            <Button 
              size="small" 
              variant="contained"
              color="success"
              startIcon={<PersonAddAltIcon />}
              onClick={() => handleViewNewPeople(event.eventId)}
              disabled={stats.newPeople === 0}
              sx={{ flex: 1, minWidth: 100 }}
            >
              New People
            </Button>
            <Button 
              size="small" 
              variant="contained"
              color="secondary"
              startIcon={<MergeIcon />}
              onClick={() => handleViewConverts(event.eventId)}
              disabled={stats.consolidated === 0}
              sx={{ flex: 1, minWidth: 100 }}
            >
              Decisions
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // Show skeleton loader only on initial load
  if (loading && localEvents.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        {/* Search bar skeleton for mobile */}
        {isMdDown && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={56} 
            sx={{ mb: 2, borderRadius: 1 }}
          />
        )}
        
        {isMdDown ? (
          // Mobile/Tablet Skeleton
          <Box>
            <Box sx={{ maxHeight: 500, overflow: 'hidden' }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <MobileCardSkeleton key={item} />
              ))}
            </Box>
            <Box sx={{ mt: 1 }}>
              <Skeleton variant="rectangular" width="100%" height={52} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        ) : (
          // Desktop Skeleton
          <DataGridSkeleton />
        )}
      </Box>
    );
  }

  if (error && localEvents.length === 0) {
    return (
      <Box>
        <Alert 
          severity="error" 
          sx={{ m: 2, boxShadow: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh} startIcon={<RefreshIcon />}>
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
            <Button color="inherit" size="small" onClick={handleRefresh} startIcon={<RefreshIcon />}>
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
      
      {localEvents.length === 0 ? (
        <Paper 
          sx={{ 
            p: { xs: 2, sm: 4 }, 
            textAlign: 'center', 
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {loading ? 'Loading Events...' : 'No Closed Events Found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {loading 
              ? 'Please wait while we load your event history...'
              : 'Only closed/complete events will appear here. Close events in the Service Check-In to see them in history.'
            }
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            sx={{ mt: 2, boxShadow: 1 }}
          >
            {loading ? 'Loading...' : 'Refresh Events'}
          </Button>
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
        onClose={() => setDetailsDialog({ open: false, event: null, data: [] })}
        maxWidth="lg"
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
          <IconButton onClick={() => setDetailsDialog({ open: false, event: null, data: [] })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" color="primary">
                {detailsDialog.data.length} People Checked In
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
            {detailsDialog.data.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No attendance data available for this event
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Leader @12</TableCell>
                    </TableRow>
                  </TableHead>
              <TableBody>
                    {detailsDialog.data.map((attendee, index) => {
                      // Handle different possible data structures
                      const personData = attendee.person || attendee;
                      const name = personData.name || personData.fullName || '';
                      const surname = personData.surname || '';
                      const fullName = `${name} ${surname}`.trim() || `Person ${index + 1}`;
                      const phone = personData.phone || personData.phoneNumber || '';
                      const email = personData.email || '';
                      const leader12 = personData.leader12 || personData.leaders?.leader12 || '';
                      
                      return (
                        <TableRow key={attendee.id || attendee._id || index} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {fullName}
                            </Typography>
                          </TableCell>
                          <TableCell>{phone || "—"}</TableCell>
                          <TableCell>{email || "—"}</TableCell>
                          <TableCell>{leader12 || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, event: null, data: [] })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New People Dialog */}
      <Dialog 
        open={newPeopleDialog.open} 
        onClose={() => setNewPeopleDialog({ open: false, event: null, data: [] })}
        maxWidth="lg"
        fullWidth
        fullScreen={isSmDown}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">New People Added</Typography>
            <Typography variant="caption" color="text.secondary">
              {newPeopleDialog.event?.eventName} - {formatDate(newPeopleDialog.event?.date)}
            </Typography>
          </Box>
          <IconButton onClick={() => setNewPeopleDialog({ open: false, event: null, data: [] })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" color="success.main">
                {newPeopleDialog.data.length} New People Added
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
            {newPeopleDialog.data.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No new people recorded for this event
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Invited By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {newPeopleDialog.data.map((person, index) => (
                      <TableRow key={person.id || person._id || index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {`${person.name || ''} ${person.surname || ''}`.trim() || `Person ${index + 1}`}
                          </Typography>
                        </TableCell>
                        <TableCell>{person.phone || "—"}</TableCell>
                        <TableCell>{person.email || "—"}</TableCell>
                        <TableCell>{person.invitedBy || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPeopleDialog({ open: false, event: null, data: [] })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Decisions Dialog */}
      <Dialog 
        open={convertsDialog.open} 
        onClose={() => setConvertsDialog({ open: false, event: null, data: [] })}
        maxWidth="lg"
        fullWidth
        fullScreen={isSmDown}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Consolidation Decisions</Typography>
            <Typography variant="caption" color="text.secondary">
              {convertsDialog.event?.eventName} - {formatDate(convertsDialog.event?.date)}
            </Typography>
          </Box>
          <IconButton onClick={() => setConvertsDialog({ open: false, event: null, data: [] })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h4" color="secondary.main">
                {convertsDialog.data.length} Decisions Made
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip 
                  label={`First Time: ${convertsDialog.data.filter(p => p.decision_type === 'first_time').length}`}
                  color="primary" 
                  size="small"
                />
                <Chip 
                  label={`Recommitments: ${convertsDialog.data.filter(p => p.decision_type === 'recommitment').length}`}
                  color="secondary" 
                  size="small"
                />
              </Stack>
            </Box>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">Decisions List:</Typography>
            {convertsDialog.data.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No decisions recorded for this event
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Decision Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {convertsDialog.data.map((person, index) => (
                      <TableRow key={person.id || person._id || index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {`${person.person_name || ''} ${person.person_surname || ''}`.trim() || `Person ${index + 1}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {person.person_email && <Typography variant="body2">{person.person_email}</Typography>}
                            {person.person_phone && <Typography variant="body2" color="text.secondary">{person.person_phone}</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={person.decision_type === 'first_time' ? 'First Time' : 'Recommitment'}
                            color={person.decision_type === 'first_time' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.assigned_to || 'Not assigned'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {person.created_at ? formatDate(person.created_at) : 'No date'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertsDialog({ open: false, event: null, data: [] })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EventHistory;