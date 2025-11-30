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
  const [eventStats, setEventStats] = useState({});
  
  // Use the same dialog states as ServiceCheckIn
  const [modalOpen, setModalOpen] = useState(false);
  const [newPeopleModalOpen, setNewPeopleModalOpen] = useState(false);
  const [consolidatedModalOpen, setConsolidatedModalOpen] = useState(false);
  
  // Data for dialogs
  const [currentDialogData, setCurrentDialogData] = useState({
    present: [],
    newPeople: [],
    consolidated: []
  });

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
      return data;
    } catch (error) {
      console.error('Error fetching real-time event data:', error);
      return null;
    }
  };

  // Fetch stats for all events
  const fetchAllEventStats = async (eventsList) => {
    const stats = {};
    
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

  // Handle viewing attendance details - using same modal as ServiceCheckIn
  const handleViewDetails = async (eventId) => {
    const event = localEvents.find(e => e.id === eventId);
    const stats = eventStats[eventId];
    
    if (onViewDetails) {
      onViewDetails(event, stats?.presentAttendees || []);
    } else {
      setCurrentDialogData(prev => ({
        ...prev,
        present: stats?.presentAttendees || []
      }));
      setModalOpen(true);
    }
  };

  // Handle viewing new people - using same modal as ServiceCheckIn
  const handleViewNewPeople = async (eventId) => {
    const event = localEvents.find(e => e.id === eventId);
    const stats = eventStats[eventId];
    
    if (onViewNewPeople) {
      onViewNewPeople(event, stats?.newPeopleList || []);
    } else {
      setCurrentDialogData(prev => ({
        ...prev,
        newPeople: stats?.newPeopleList || []
      }));
      setNewPeopleModalOpen(true);
    }
  };

  // Handle viewing consolidations - using same modal as ServiceCheckIn
  const handleViewConverts = async (eventId) => {
    const event = localEvents.find(e => e.id === eventId);
    const stats = eventStats[eventId];
    
    if (onViewConverts) {
      onViewConverts(event, stats?.consolidationsList || []);
    } else {
      setCurrentDialogData(prev => ({
        ...prev,
        consolidated: stats?.consolidationsList || []
      }));
      setConsolidatedModalOpen(true);
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

  // Card Components (copied from ServiceCheckIn for consistent display)
  const PresentAttendeeCard = ({ attendee, showNumber, index }) => {
    return (
      <Card
        variant="outlined"
        sx={{
          mb: 1,
          boxShadow: 2,
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          "&:last-child": { mb: 0 },
          border: `2px solid ${theme.palette.primary.main}`,
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.primary.dark + "1a" 
            : theme.palette.primary.light + "0a",
        }}
      >
        <CardContent sx={{ 
          p: 1.5,
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            width: '100%',
            gap: 1
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {showNumber && `${index}. `}{attendee.name} {attendee.surname}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
                {attendee.phone && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {attendee.phone}
                  </Typography>
                )}
                {attendee.email && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {attendee.email}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {attendee.leader1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      @1:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {attendee.leader1}
                    </Typography>
                  </Box>
                )}
                
                {attendee.leader12 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      @12:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {attendee.leader12}
                    </Typography>
                  </Box>
                )}
                
                {attendee.leader144 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold" color="primary">
                      @144:
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {attendee.leader144}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const NewPersonCard = ({ person, showNumber, index }) => (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        boxShadow: 2,
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        "&:last-child": { mb: 0 },
        border: `2px solid ${theme.palette.success.main}`,
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.success.dark + "1a" 
          : theme.palette.success.light + "0a",
      }}
    >
      <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {showNumber && `${index}. `}{person.name} {person.surname}
            </Typography>
            {person.email && <Typography variant="body2" color="text.secondary">{person.email}</Typography>}
            {person.phone && <Typography variant="body2" color="text.secondary">{person.phone}</Typography>}
            {person.gender && (
              <Chip 
                label={`Gender: ${person.gender}`} 
                size="small" 
                variant="outlined" 
                sx={{ mt: 0.5, fontSize: "0.7rem", height: 20 }} 
              />
            )}
          </Box>
        </Box>

        {person.invitedBy && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              <Chip 
                label={`Invited by: ${person.invitedBy}`} 
                size="small" 
                variant="outlined" 
                sx={{ fontSize: "0.7rem", height: 20 }} 
              />
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );

  const ConsolidatedPersonCard = ({ person, showNumber, index }) => {
    const decisionType = person.decision_type || person.consolidation_type || "Commitment";
    const displayDecisionType = decisionType || 'Commitment';
    
    return (
      <Card
        variant="outlined"
        sx={{
          mb: 1,
          boxShadow: 2,
          minHeight: '140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          "&:last-child": { mb: 0 },
          border: `2px solid ${theme.palette.secondary.main}`,
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.secondary.dark + "1a" 
            : theme.palette.secondary.light + "0a",
        }}
      >
        <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {showNumber && `${index}. `}{person.person_name} {person.person_surname}
                <Chip
                  label={displayDecisionType}
                  size="small"
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }}
                  color={displayDecisionType === 'Recommitment' ? 'primary' : 'secondary'}
                />
              </Typography>
              {person.person_email && <Typography variant="body2" color="text.secondary">{person.person_email}</Typography>}
              {person.person_phone && <Typography variant="body2" color="text.secondary">{person.person_phone}</Typography>}
            </Box>
          </Box>

          <Stack direction="row" spacing={1} justifyContent="flex-end" mb={1}>
            <Chip
              label={`Assigned to: ${person.assigned_to || 'Not assigned'}`}
              size="small"
              variant="outlined"
              color="primary"
            />
          </Stack>

          {(person.created_at || person.decision_type || person.notes) && (
            <>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                {person.created_at && (
                  <Chip 
                    label={`Date: ${new Date(person.created_at).toLocaleDateString()}`} 
                    size="small" 
                    variant="outlined" 
                    sx={{ fontSize: "0.7rem", height: 20 }} 
                  />
                )}
                <Chip
                  label={`Type: ${displayDecisionType}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem", height: 20 }}
                />
                {person.status && (
                  <Chip
                    label={`Status: ${person.status}`}
                    size="small"
                    color={person.status === 'completed' ? 'success' : 'default'}
                    sx={{ fontSize: "0.7rem", height: 20 }}
                  />
                )}
                {person.notes && (
                  <Tooltip title={person.notes}>
                    <Chip
                      label="Has Notes"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem", height: 20 }}
                    />
                  </Tooltip>
                )}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // Show skeleton loader only on initial load
  if (loading && localEvents.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        {isMdDown && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={56} 
            sx={{ mb: 2, borderRadius: 1 }}
          />
        )}
        
        {isMdDown ? (
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

      {/* PRESENT Attendees Modal - Same as ServiceCheckIn */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            boxShadow: 6,
            maxHeight: '90vh',
            ...(isSmDown && {
              margin: 2,
              maxHeight: '85vh',
              width: 'calc(100% - 32px)',
            })
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Attendees Present: {currentDialogData.present.length}
        </DialogTitle>
        <DialogContent dividers sx={{ 
          maxHeight: isSmDown ? 600 : 700,
          overflowY: "auto", 
          p: isSmDown ? 1 : 2 
        }}>
          {currentDialogData.present.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No attendees present for this event
            </Typography>
          ) : (
            <>
              {isSmDown ? (
                <Box>
                  {currentDialogData.present.map((a, idx) => (
                    <PresentAttendeeCard 
                      key={a.id || a._id} 
                      attendee={a} 
                      showNumber={true} 
                      index={idx + 1} 
                    />
                  ))}
                </Box>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '40px' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '150px' }}>Name & Surname</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '100px' }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '150px' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '90px' }}>Leader @1</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '90px' }}>Leader @12</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: '90px' }}>Leader @144</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentDialogData.present.map((a, idx) => (
                      <TableRow key={a.id || a._id} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="600" noWrap>
                              {a.name} {a.surname}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={a.phone || ""}>
                            {a.phone || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={a.email || ""}>
                            {a.email || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={a.leader1 || ""}>
                            {a.leader1 || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={a.leader12 || ""}>
                            {a.leader12 || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap title={a.leader144 || ""}>
                            {a.leader144 || "—"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

{/* NEW PEOPLE Modal - Updated to show gender and invitedBy */}
<Dialog
  open={newPeopleModalOpen}
  onClose={() => setNewPeopleModalOpen(false)}
  fullWidth
  maxWidth="md"
  PaperProps={{
    sx: {
      boxShadow: 6,
      ...(isSmDown && {
        margin: 2,
        maxHeight: '80vh',
        width: 'calc(100% - 32px)',
      })
    }
  }}
>
  <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
    New People: {currentDialogData.newPeople.length}
  </DialogTitle>
  <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
    {currentDialogData.newPeople.length === 0 ? (
      <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
        No new people added for this event
      </Typography>
    ) : (
      <>
        {isSmDown ? (
          <Box>
            {currentDialogData.newPeople.map((a, idx) => (
              <NewPersonCard 
                key={a.id || a._id} 
                person={a} 
                showNumber={true} 
                index={idx + 1} 
              />
            ))}
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: '40px' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: '150px' }}>Name & Surname</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: '100px' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: '150px' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: '100px' }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: '150px' }}>Invited By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentDialogData.newPeople.map((a, idx) => (
                <TableRow key={a.id || a._id} hover sx={{ '&:hover': { boxShadow: 1 } }}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="600" noWrap>
                        {a.name} {a.surname}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={a.phone || ""}>
                      {a.phone || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={a.email || ""}>
                      {a.email || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {a.gender || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={a.invitedBy || ""}>
                      {a.invitedBy || "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </>
    )}
  </DialogContent>
  <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
    <Button onClick={() => setNewPeopleModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>
      Close
    </Button>
  </DialogActions>
</Dialog>

      {/* CONSOLIDATED Modal - Same as ServiceCheckIn */}
      <Dialog
        open={consolidatedModalOpen}
        onClose={() => setConsolidatedModalOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            boxShadow: 6,
            ...(isSmDown && {
              margin: 2,
              maxHeight: '80vh',
              width: 'calc(100% - 32px)',
            })
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Consolidated People: {currentDialogData.consolidated.length}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          {currentDialogData.consolidated.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No consolidated people for this event
            </Typography>
          ) : (
            <>
              {isSmDown ? (
                <Box>
                  {currentDialogData.consolidated.map((person, idx) => (
                    <ConsolidatedPersonCard
                      key={person.id || person._id || idx}
                      person={person}
                      showNumber={true}
                      index={idx + 1}
                    />
                  ))}
                </Box>
              ) : (
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
                    {currentDialogData.consolidated.map((person, idx) => (
                      <TableRow key={person.id || person._id || idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {person.person_name} {person.person_surname}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {person.person_email && (
                              <Typography variant="body2">{person.person_email}</Typography>
                            )}
                            {person.person_phone && (
                              <Typography variant="body2" color="text.secondary">{person.person_phone}</Typography>
                            )}
                            {!person.person_email && !person.person_phone && "—"}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={person.decision_type || 'Commitment'}
                            size="small"
                            color={person.decision_type === 'Recommitment' ? 'primary' : 'secondary'}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>{person.assigned_to || 'Not assigned'}</TableCell>
                        <TableCell>
                          {person.created_at ? new Date(person.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button onClick={() => setConsolidatedModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EventHistory;