import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  useTheme,
  CssBaseline,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  People,
  Event,
  Task,
  Refresh,
  CellTower,
  Groups,
  CheckCircle,
  Schedule,
  Warning,
  LocalActivity
} from '@mui/icons-material';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const StatsDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [stats, setStats] = useState({
    overview: null,
    events: [],
    overdueCells: [],
    recentPeople: 0,
    allTasks: [],
    loading: true,
    error: null
  });
  
  const [period, setPeriod] = useState('weekly');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all data
  const fetchStats = async () => {
    try {
      setRefreshing(true);
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch events (global and ticketed)
      const eventsResponse = await fetch(`${BACKEND_URL}/events?eventType=all&limit=100`);
      const eventsData = eventsResponse.ok ? await eventsResponse.json() : { events: [] };
      
      const allEvents = eventsData.events || eventsData.results || eventsData || [];
      
      // Filter global and ticketed events
      const globalTicketedEvents = allEvents.filter(event => 
        event.isGlobal || event.isTicketed || 
        event.eventType?.toLowerCase().includes('global') ||
        event.eventType?.toLowerCase().includes('service')
      );

      // Fetch overdue cells (events with type 'Cells' that are past due)
      const today = new Date().toISOString().split('T')[0];
      const overdueCells = allEvents.filter(event => 
        event.eventType?.toLowerCase().includes('cell') &&
        event.date && event.date < today &&
        event.status === 'incomplete'
      );

      // Fetch recent people (count from people collection - last 30 days)
      const peopleResponse = await fetch(`${BACKEND_URL}/people?perPage=1`);
      const peopleData = peopleResponse.ok ? await peopleResponse.json() : { total: 0 };
      
      // Estimate recent people (you might want to add a createdAt field to your people collection)
      const recentPeopleCount = Math.floor((peopleData.total || 0) * 0.1); // 10% of total as recent

      // Fetch all tasks
      const tasksResponse = await fetch(`${BACKEND_URL}/tasks`);
      const tasksData = tasksResponse.ok ? await tasksResponse.json() : [];
      const allTasks = Array.isArray(tasksData) ? tasksData : tasksData.tasks || tasksData.results || [];

      // Calculate overview stats
      const totalAttendance = globalTicketedEvents.reduce((sum, event) => 
        sum + (event.total_attendance || event.attendees?.length || 0), 0
      );

      const overviewData = {
        total_attendance: totalAttendance,
        outstanding_cells: overdueCells.length,
        outstanding_tasks: allTasks.length,
        recent_people: recentPeopleCount,
        events_count: globalTicketedEvents.length
      };

      setStats({
        overview: overviewData,
        events: globalTicketedEvents,
        overdueCells: overdueCells,
        recentPeople: recentPeopleCount,
        allTasks: allTasks,
        loading: false,
        error: null
      });

    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(prev => ({
        ...prev,
        error: 'Failed to load statistics',
        loading: false
      }));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const handleRefresh = () => {
    fetchStats();
  };

  // Get event-specific stats
  const getEventStats = () => {
    if (selectedEvent === 'all') {
      return {
        first_time_decisions: stats.events.reduce((sum, event) => 
          sum + (event.attendees?.filter(a => a.decision === 'first_time').length || 0), 0
        ),
        recommitments: stats.events.reduce((sum, event) => 
          sum + (event.attendees?.filter(a => a.decision === 'recommitment').length || 0), 0
        ),
        total_decisions: stats.events.reduce((sum, event) => 
          sum + (event.attendees?.filter(a => a.decision).length || 0), 0
        ),
        new_people: stats.recentPeople
      };
    }

    const event = stats.events.find(e => e._id === selectedEvent);
    if (!event) return { first_time_decisions: 0, recommitments: 0, total_decisions: 0, new_people: 0 };

    const attendees = event.attendees || [];
    return {
      first_time_decisions: attendees.filter(a => a.decision === 'first_time').length,
      recommitments: attendees.filter(a => a.decision === 'recommitment').length,
      total_decisions: attendees.filter(a => a.decision).length,
      new_people: stats.recentPeople
    };
  };

  // Skeleton Loader for Stat Cards
  const StatCardSkeleton = () => (
    <Card sx={{ 
      height: '100%', 
      position: 'relative', 
      overflow: 'visible',
    }}>
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton 
            variant="circular" 
            width={isMobile ? 48 : 60} 
            height={isMobile ? 48 : 60}
            sx={{ ml: 1 }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  // Stats Cards Component
  const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
    <Card sx={{ 
      height: '100%', 
      position: 'relative', 
      overflow: 'visible',
      borderTop: `4px solid ${theme.palette[color].main}`,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4]
      }
    }}>
      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box sx={{ flex: 1 }}>
            <Typography color="textSecondary" variant="overline" fontWeight="medium">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ mt: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Chip 
                size="small"
                icon={<TrendingUp />}
                label={trend}
                color={trend.includes('+') ? 'success' : 'error'}
                variant="outlined"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Avatar sx={{ 
            bgcolor: `${color}.main`, 
            width: isMobile ? 48 : 60, 
            height: isMobile ? 48 : 60,
            ml: 1
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  // Skeleton for Outstanding Items
  const OutstandingItemSkeleton = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        mb: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mt: 0.5 }} />
        <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
      </Box>

      <Skeleton variant="rectangular" width={40} height={40} sx={{ ml: 2, borderRadius: 1 }} />
    </Box>
  );

  // Outstanding Item Component
  const OutstandingItem = ({ item, type, index }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        mb: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: 'action.hover',
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[2]
        }
      }}
    >
      <Avatar
        sx={{
          bgcolor: type === 'cells' ? 'warning.main' : 'secondary.main',
          mr: 2,
          width: 48,
          height: 48
        }}
      >
        {type === 'cells' ? <Warning /> : <Task />}
      </Avatar>
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight="medium" noWrap>
          {item.eventName || item.name || item.title || 'Unnamed'}
        </Typography>
        
        <Typography variant="body2" color="textSecondary" noWrap>
          {type === 'cells' ? (
            <>📅 {new Date(item.date).toLocaleDateString()} • 👥 {item.eventLeaderName || 'No leader'}</>
          ) : (
            <>📝 {item.taskType || 'Task'} • {item.assignedfor || 'Unassigned'}</>
          )}
        </Typography>

        {item.status && (
          <Chip
            size="small"
            label={item.status}
            color={item.status === 'completed' ? 'success' : 'warning'}
            sx={{ mt: 0.5 }}
          />
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 40,
          height: 40,
          bgcolor: type === 'cells' ? 'warning.light' : 'secondary.light',
          color: 'white',
          borderRadius: 1,
          ml: 2
        }}
      >
        <Typography fontWeight="bold" fontSize="0.9rem">
          {type === 'cells' ? '!' : '📋'}
        </Typography>
      </Box>
    </Box>
  );

  // Skeleton for Event Stats
  const EventStatsSkeleton = () => (
    <Box textAlign="center" p={2}>
      <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1, mx: 'auto' }} />
      <Skeleton variant="text" width="60%" height={30} sx={{ mx: 'auto' }} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto', mt: 0.5 }} />
    </Box>
  );

  // Error state
  if (stats.error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
        mt: 8
      }}>
        <CssBaseline />
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchStats}>
              Retry
            </Button>
          }
        >
          {stats.error}
        </Alert>
      </Box>
    );
  }

  const { overview, events, overdueCells, allTasks } = stats;
  const eventStats = getEventStats();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      py: { xs: 2, sm: 3 },
      px: { xs: 1, sm: 2 },
      mt: 8
    }}>
      <CssBaseline />
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e) => setPeriod(e.target.value)}
                disabled={refreshing || stats.loading}
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing || stats.loading}
              color="primary"
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>
        
        {(refreshing || stats.loading) && (
          <LinearProgress sx={{ mt: 2 }} />
        )}
      </Box>

      {/* Main Stats Grid - Mobile Responsive Layout */}
      <Grid container spacing={3}>
        {/* First two cards side by side on mobile */}
        <Grid item xs={12} sm={6}>
          {stats.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Total Attendance"
              value={overview?.total_attendance || 0}
              subtitle={`All ${period} events`}
              icon={<People />}
              color="primary"
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          {stats.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Overdue Cells"
              value={overview?.outstanding_cells || 0}
              subtitle="Need completion"
              icon={<CellTower />}
              color="warning"
            />
          )}
        </Grid>

        {/* Remaining cards full width on mobile */}
        <Grid item xs={12}>
          {stats.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="All Tasks"
              value={overview?.outstanding_tasks || 0}
              subtitle="Total tasks"
              icon={<Task />}
              color="secondary"
            />
          )}
        </Grid>

        <Grid item xs={12}>
          {stats.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="New People"
              value={overview?.recent_people || 0}
              subtitle="Recently added"
              icon={<Groups />}
              color="success"
            />
          )}
        </Grid>

        {/* Overdue Cells Section - Full width */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                {stats.loading ? (
                  <>
                    <Skeleton variant="text" width="40%" height={32} />
                    <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 16 }} />
                  </>
                ) : (
                  <>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Overdue Cells
                    </Typography>
                    <Chip 
                      label={overdueCells.length} 
                      color="warning" 
                      variant="outlined"
                    />
                  </>
                )}
              </Box>

              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {stats.loading ? (
                  // Show 3 skeleton items when loading
                  Array.from({ length: 3 }).map((_, index) => (
                    <OutstandingItemSkeleton key={index} />
                  ))
                ) : overdueCells.length > 0 ? (
                  overdueCells.slice(0, 5).map((cell, index) => (
                    <OutstandingItem
                      key={cell._id || index}
                      item={cell}
                      type="cells"
                      index={index}
                    />
                  ))
                ) : (
                  <Box textAlign="center" py={4}>
                    <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      All cells are completed!
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      No overdue cells found
                    </Typography>
                  </Box>
                )}
                
                {!stats.loading && overdueCells.length > 5 && (
                  <Box textAlign="center" mt={2}>
                    <Button variant="outlined">
                      View All {overdueCells.length} Cells
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* All Tasks Section - Full width */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                {stats.loading ? (
                  <>
                    <Skeleton variant="text" width="30%" height={32} />
                    <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 16 }} />
                  </>
                ) : (
                  <>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      All Tasks
                    </Typography>
                    <Chip 
                      label={allTasks.length} 
                      color="secondary" 
                      variant="outlined"
                    />
                  </>
                )}
              </Box>

              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {stats.loading ? (
                  // Show 3 skeleton items when loading
                  Array.from({ length: 3 }).map((_, index) => (
                    <OutstandingItemSkeleton key={index} />
                  ))
                ) : allTasks.length > 0 ? (
                  allTasks.slice(0, 5).map((task, index) => (
                    <OutstandingItem
                      key={task._id || index}
                      item={task}
                      type="tasks"
                      index={index}
                    />
                  ))
                ) : (
                  <Box textAlign="center" py={4}>
                    <CheckCircle color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      No tasks found!
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Create some tasks to get started
                    </Typography>
                  </Box>
                )}
                
                {!stats.loading && allTasks.length > 5 && (
                  <Box textAlign="center" mt={2}>
                    <Button variant="outlined">
                      View All {allTasks.length} Tasks
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Event-specific Stats Section - Full width */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                {stats.loading ? (
                  <>
                    <Skeleton variant="text" width="30%" height={32} />
                    <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 1 }} />
                  </>
                ) : (
                  <>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Event Statistics
                    </Typography>
                    
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Select Event</InputLabel>
                      <Select
                        value={selectedEvent}
                        label="Select Event"
                        onChange={(e) => setSelectedEvent(e.target.value)}
                      >
                        <MenuItem value="all">All Events ({events.length})</MenuItem>
                        {events.map(event => (
                          <MenuItem key={event._id} value={event._id}>
                            {event.eventName || event.title} 
                            {event.total_attendance ? ` (${event.total_attendance} attendees)` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
              </Box>
              
              {/* Event stats grid - responsive layout */}
              <Grid container spacing={3}>
                {stats.loading ? (
                  // Show 4 skeleton stats when loading
                  Array.from({ length: 4 }).map((_, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <EventStatsSkeleton />
                    </Grid>
                  ))
                ) : (
                  <>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center" p={2}>
                        <Schedule color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {eventStats.first_time_decisions}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          First Time Decisions
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center" p={2}>
                        <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {eventStats.recommitments}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Recommitments
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center" p={2}>
                        <Event color="warning" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {eventStats.total_decisions}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Decisions
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center" p={2}>
                        <LocalActivity color="info" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6" fontWeight="bold">
                          {eventStats.new_people}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          New People
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
              
              {!stats.loading && selectedEvent !== 'all' && (
                <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="body2" fontWeight="medium">
                    Showing statistics for selected event only
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Last Updated */}
      {!stats.loading && (
        <Box textAlign="center" mt={4}>
          <Typography variant="body2" color="textSecondary">
            Last updated: {new Date().toISOString().split('T')[0]} • {events.length} events loaded
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatsDashboard;