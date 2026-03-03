import React from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Skeleton,
  Stack,
  Chip,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import UndoIcon from '@mui/icons-material/Undo';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import MergeIcon from '@mui/icons-material/Merge';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';


const EventHistory = React.memo(function EventHistory({
  onViewDetails,
  onViewNewPeople,
  onViewConverts,
  onUnsaveEvent,
  events = [],
  isLoading = false,
  onRefresh,
  searchTerm = ""
}) {
  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down('xs'));
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const isDarkMode = theme.palette.mode === 'dark';

  const canUnsaveEvent = React.useCallback((event) => {
    if (!event || !event.date) return false;
    try {
      const eventDate = new Date(event.date);
      const today = new Date();
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return eventDay.getTime() === todayDay.getTime();
    } catch {
      return false;
    }
  }, []);

  const filteredEvents = React.useMemo(() => {
    if (!Array.isArray(events)) return [];
    if (!searchTerm.trim()) return events;
    const term = searchTerm.toLowerCase().trim();
    return events.filter(event => {
      if (!event) return false;
      return (
        (event.eventName && event.eventName.toLowerCase().includes(term)) ||
        (event.date && event.date.toString().toLowerCase().includes(term)) ||
        (event.status && event.status.toLowerCase().includes(term)) ||
        (event.closed_by && event.closed_by.toLowerCase().includes(term))
      );
    });
  }, [events, searchTerm]);

  const getAttendanceCount = React.useCallback((event) => {
    if (!event) return 0;
    if (typeof event.total_attendance === 'number') return event.total_attendance;
    if (typeof event.attendance === 'number') return event.attendance;
    if (Array.isArray(event.attendees)) return event.attendees.length;
    if (Array.isArray(event.attendanceData)) return event.attendanceData.length;
    return 0;
  }, []);

  const getNewPeopleCount = React.useCallback((event) => {
    if (!event) return 0;
    if (typeof event.new_people_count === 'number') return event.new_people_count;
    if (typeof event.newPeople === 'number') return event.newPeople;
    if (Array.isArray(event.new_people)) return event.new_people.length;
    if (Array.isArray(event.newPeopleData)) return event.newPeopleData.length;
    return 0;
  }, []);

  const getConsolidatedCount = React.useCallback((event) => {
    if (!event) return 0;
    if (typeof event.consolidation_count === 'number') return event.consolidation_count;
    if (typeof event.consolidated === 'number') return event.consolidated;
    if (Array.isArray(event.consolidations)) return event.consolidations.length;
    if (Array.isArray(event.consolidatedData)) return event.consolidatedData.length;
    return 0;
  }, []);

  const handleViewDetails = React.useCallback((event, type) => {
    if (!event) return;

    const sortAlphabetically = (arr) =>
      [...arr].sort((a, b) =>
        `${a.name || ''} ${a.surname || ''}`.toLowerCase()
          .localeCompare(`${b.name || ''} ${b.surname || ''}`.toLowerCase())
      );

    switch (type) {
      case 'attendance': {
        const data = sortAlphabetically(event.attendanceData || event.attendees || []);
        if (onViewDetails) onViewDetails(event, data);
        break;
      }
      case 'newPeople': {
        const data = sortAlphabetically(event.newPeopleData || event.new_people || []);
        if (onViewNewPeople) onViewNewPeople(event, data);
        break;
      }
      case 'consolidated': {
        const data = sortAlphabetically(event.consolidatedData || event.consolidations || []);
        if (onViewConverts) onViewConverts(event, data);
        break;
      }
      default:
        break;
    }
  }, [onViewDetails, onViewNewPeople, onViewConverts]);

  const handleUnsaveEvent = React.useCallback((event) => {
    if (!event || !canUnsaveEvent(event)) return;
    if (onUnsaveEvent) onUnsaveEvent(event);
  }, [onUnsaveEvent, canUnsaveEvent]);

  const columns = React.useMemo(() => {
    const eventNameCol = {
      field: 'eventName',
      headerName: 'Event',
      flex: 1.4,
      minWidth: isSmDown ? 160 : 220,
      sortable: true,
      valueGetter: (params) => params.row?.eventName || 'Unnamed Event',
      renderCell: (params) => {
        const event = params.row || {};
        const eventName = event.eventName || 'Unnamed Event';
        const eventDate = event.date
          ? new Date(event.date).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: isSmDown ? 'short' : 'long',
            day: 'numeric',
          })
          : 'No date';

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 0.5 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                fontSize: isXsDown ? '0.7rem' : isSmDown ? '0.75rem' : '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3,
              }}
            >
              {eventName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: isXsDown ? '0.6rem' : '0.75rem', display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.2 }}
            >
              <CalendarTodayIcon sx={{ fontSize: '0.7rem' }} />
              {eventDate}
            </Typography>
          </Box>
        );
      },
    };

    const attendanceCol = {
      field: 'attendance',
      headerName: isXsDown ? 'Att' : isSmDown ? 'Att' : 'Attendance',
      width: isXsDown ? 55 : isSmDown ? 65 : 100,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params) => getAttendanceCount(params.row),
      renderCell: (params) => {
        const count = getAttendanceCount(params.row);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
            <GroupIcon sx={{ fontSize: isXsDown ? '0.75rem' : '0.85rem', color: 'primary.main', opacity: 0.7 }} />
            <Typography
              fontWeight={600}
              color="primary"
              fontSize={isXsDown ? '0.7rem' : isSmDown ? '0.75rem' : '0.9rem'}
            >
              {count}
            </Typography>
          </Box>
        );
      },
    };

    const newPeopleCol = {
      field: 'newPeople',
      headerName: isXsDown ? 'New' : isSmDown ? 'New' : 'New People',
      width: isXsDown ? 55 : isSmDown ? 65 : 100,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params) => getNewPeopleCount(params.row),
      renderCell: (params) => {
        const count = getNewPeopleCount(params.row);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
            <PersonAddAltIcon sx={{ fontSize: isXsDown ? '0.75rem' : '0.85rem', color: 'success.main', opacity: 0.7 }} />
            <Typography
              fontWeight={600}
              color="success.main"
              fontSize={isXsDown ? '0.7rem' : isSmDown ? '0.75rem' : '0.9rem'}
            >
              {count}
            </Typography>
          </Box>
        );
      },
    };

    const consolidatedCol = {
      field: 'consolidated',
      headerName: isXsDown ? 'Con' : isSmDown ? 'Cons' : 'Consolidated',
      width: isXsDown ? 55 : isSmDown ? 65 : 110,
      sortable: true,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params) => getConsolidatedCount(params.row),
      renderCell: (params) => {
        const count = getConsolidatedCount(params.row);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
            <MergeIcon sx={{ fontSize: isXsDown ? '0.75rem' : '0.85rem', color: 'secondary.main', opacity: 0.7 }} />
            <Typography
              fontWeight={600}
              color="secondary.main"
              fontSize={isXsDown ? '0.7rem' : isSmDown ? '0.75rem' : '0.9rem'}
            >
              {count}
            </Typography>
          </Box>
        );
      },
    };

    const actionsCol = {
      field: 'actions',
      headerName: 'Actions',
      flex: isSmDown ? 0 : 0.8,
      width: isSmDown ? 140 : undefined,
      minWidth: isSmDown ? 130 : 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const event = params.row || {};
        const attendanceCount = getAttendanceCount(event);
        const newPeopleCount = getNewPeopleCount(event);
        const consolidatedCount = getConsolidatedCount(event);
        const canUnsave = canUnsaveEvent(event);

        if (isSmDown) {
          return (
            <Stack direction="row" spacing={0.3} alignItems="center" justifyContent="center">
              <Tooltip title="View Attendance">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(event, 'attendance')}
                    disabled={attendanceCount === 0}
                    color="primary"
                    sx={{ padding: '4px', opacity: attendanceCount === 0 ? 0.3 : 1 }}
                  >
                    <VisibilityIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="View New People">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(event, 'newPeople')}
                    disabled={newPeopleCount === 0}
                    color="success"
                    sx={{ padding: '4px', opacity: newPeopleCount === 0 ? 0.3 : 1 }}
                  >
                    <PersonIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="View Consolidated">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(event, 'consolidated')}
                    disabled={consolidatedCount === 0}
                    color="secondary"
                    sx={{ padding: '4px', opacity: consolidatedCount === 0 ? 0.3 : 1 }}
                  >
                    <EmojiPeopleIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canUnsave ? 'Unsave event' : "Only today's events can be unsaved"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleUnsaveEvent(event)}
                    disabled={!canUnsave}
                    color="warning"
                    sx={{ padding: '4px', opacity: !canUnsave ? 0.3 : 1 }}
                  >
                    <UndoIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        }

        return (
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
            <Tooltip title={attendanceCount === 0 ? 'No attendance data' : 'View Attendance'}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewDetails(event, 'attendance')}
                  disabled={attendanceCount === 0}
                  sx={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    minWidth: 'auto',
                    opacity: attendanceCount === 0 ? 0.4 : 1,
                  }}
                >
                  Attend
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={newPeopleCount === 0 ? 'No new people' : 'View New People'}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<PersonIcon />}
                  onClick={() => handleViewDetails(event, 'newPeople')}
                  disabled={newPeopleCount === 0}
                  sx={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    minWidth: 'auto',
                    opacity: newPeopleCount === 0 ? 0.4 : 1,
                  }}
                >
                  New
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={consolidatedCount === 0 ? 'No consolidations' : 'View Consolidated'}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<EmojiPeopleIcon />}
                  onClick={() => handleViewDetails(event, 'consolidated')}
                  disabled={consolidatedCount === 0}
                  sx={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    minWidth: 'auto',
                    opacity: consolidatedCount === 0 ? 0.4 : 1,
                  }}
                >
                  Cons
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={canUnsave ? 'Unsave this event' : "Only today's events can be unsaved"}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<UndoIcon />}
                  onClick={() => handleUnsaveEvent(event)}
                  disabled={!canUnsave}
                  sx={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    minWidth: 'auto',
                    opacity: !canUnsave ? 0.3 : 1,
                  }}
                >
                  Unsave
                </Button>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    };

    return [eventNameCol, attendanceCol, newPeopleCol, consolidatedCol, actionsCol];
  }, [
    isXsDown, isSmDown,
    getAttendanceCount, getNewPeopleCount, getConsolidatedCount,
    handleViewDetails, handleUnsaveEvent, canUnsaveEvent,
  ]);

  if (isLoading && filteredEvents.length === 0) {
    return (
      <Box sx={{ width: '100%' }}>
        <Paper
          variant="outlined"
          sx={{
            boxShadow: 3,
            overflow: 'hidden',
            width: '100%',
            height: isMdDown ? 'calc(100vh - 220px)' : 650,
            minHeight: isMdDown ? 400 : 650,
          }}
        >
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rounded" height={56} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={400} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={52} />
          </Box>
        </Paper>
      </Box>
    );
  }

  if (!filteredEvents || filteredEvents.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          boxShadow: 3,
          overflow: 'hidden',
          width: '100%',
          height: isMdDown ? 'calc(100vh - 220px)' : 650,
          minHeight: isMdDown ? 400 : 650,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: isSmDown ? 2 : 4,
        }}
      >
        <Typography
          variant={isSmDown ? 'body1' : 'h6'}
          color="text.secondary"
          textAlign="center"
        >
          {events?.length === 0 ? 'No event history found' : 'No matching events found'}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {events?.length === 0
            ? 'Closed events with attendance data will appear here'
            : 'Try a different search term'}
        </Typography>
        {onRefresh && (
          <Button
            variant="outlined"
            onClick={onRefresh}
            startIcon={<RefreshIcon />}
            size={isSmDown ? 'small' : 'medium'}
          >
            Refresh Events
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/*
        Paper — exactly matches the ServiceCheckIn DataGrid Paper:
          variant="outlined"
          boxShadow: 3
          overflow: hidden
          same height formula
      */}
      <Paper
        variant="outlined"
        sx={{
          boxShadow: 3,
          overflow: 'hidden',
          width: '100%',
          height: isMdDown
            ? 'calc(100vh - 220px)'
            : 650,
          minHeight: isMdDown ? 500 : 650,
          maxHeight: isMdDown ? '650px' : 700,
        }}
      >
        <DataGrid
          rows={filteredEvents}
          columns={columns}
          loading={isLoading}

          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}

          initialState={{
            pagination: {
              paginationModel: { pageSize: isSmDown ? 10 : 25 },
            },
            sorting: {
              sortModel: [{ field: 'eventName', sort: 'desc' }],
            },
          }}
          pageSizeOptions={isSmDown ? [5, 10, 25] : [10, 25, 50]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id || row._id || Math.random().toString(36)}
          rowHeight={56}
          sx={{
            width: '100%',
            height: '100%',
            '& .MuiDataGrid-columnHeaders': {
              width: '100% !important',
              backgroundColor: theme.palette.action.hover,
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-columnHeader': {
              fontWeight: 600,
              minWidth: '40px',
              fontSize: isXsDown ? '0.7rem' : '0.8rem',
              padding: isXsDown ? '4px 2px' : '6px 4px',
              '& .MuiDataGrid-iconButtonContainer': { visibility: 'visible !important' },
              '& .MuiDataGrid-sortIcon': { opacity: 1 },
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              padding: isXsDown ? '2px 4px' : '4px 6px',
              fontSize: isXsDown ? '0.7rem' : '0.8rem',
              minWidth: '40px',
            },
            '& .MuiDataGrid-cell[data-field="eventName"]': {
              justifyContent: 'flex-start',
              textAlign: 'left',
              paddingLeft: isSmDown ? '8px' : '12px',
            },
            '& .MuiDataGrid-cell[data-field="attendance"]': { justifyContent: 'center' },
            '& .MuiDataGrid-cell[data-field="newPeople"]': { justifyContent: 'center' },
            '& .MuiDataGrid-cell[data-field="consolidated"]': { justifyContent: 'center' },
            '& .MuiDataGrid-cell[data-field="actions"]': { justifyContent: 'center' },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '& .MuiDataGrid-toolbarContainer': {
              padding: isXsDown ? '4px 2px' : '12px 8px',
              borderBottom: `1px solid ${theme.palette.divider}`,
              ...(isSmDown && { flexDirection: 'column', alignItems: 'flex-start', gap: 1 }),
            },
            '& .MuiDataGrid-footerContainer': {
              display: 'flex',
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              minHeight: '52px',
            },
            '& .MuiTablePagination-root': {
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '8px 4px',
              fontSize: '0.75rem',
            },
            ...(isSmDown && {
              '& .MuiDataGrid-columnSeparator': { display: 'none' },
            }),
          }}
        />
      </Paper>
    </Box>
  );
});

export default EventHistory;