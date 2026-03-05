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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import UndoIcon from '@mui/icons-material/Undo';

const EventHistory = React.memo(function EventHistory({
  onViewDetails,
  onViewNewPeople,
  onViewConverts,
  onUnsaveEvent,
  events = [],
  isLoading = false,
  onRefresh,
  searchTerm = '',
}) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));

  // ── helpers ────────────────────────────────────────────────────────────────

  const canUnsaveEvent = React.useCallback((row) => {
    if (!row?.date) return false;
    try {
      const ed = new Date(row.date);
      const today = new Date();
      return (
        new Date(ed.getFullYear(), ed.getMonth(), ed.getDate()).getTime() ===
        new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
      );
    } catch {
      return false;
    }
  }, []);

  const getAttendanceCount = React.useCallback((row) => {
    if (!row) return 0;
    if (typeof row.total_attendance === 'number') return row.total_attendance;
    if (typeof row.attendance === 'number') return row.attendance;
    if (Array.isArray(row.attendees)) return row.attendees.length;
    if (Array.isArray(row.attendanceData)) return row.attendanceData.length;
    return 0;
  }, []);

  const getNewPeopleCount = React.useCallback((row) => {
    if (!row) return 0;
    if (typeof row.new_people_count === 'number') return row.new_people_count;
    if (typeof row.newPeople === 'number') return row.newPeople;
    if (Array.isArray(row.new_people)) return row.new_people.length;
    if (Array.isArray(row.newPeopleData)) return row.newPeopleData.length;
    return 0;
  }, []);

  const getConsolidatedCount = React.useCallback((row) => {
    if (!row) return 0;
    if (typeof row.consolidation_count === 'number') return row.consolidation_count;
    if (typeof row.consolidated === 'number') return row.consolidated;
    if (Array.isArray(row.consolidations)) return row.consolidations.length;
    if (Array.isArray(row.consolidatedData)) return row.consolidatedData.length;
    return 0;
  }, []);

  const sortAlpha = (arr) =>
    [...arr].sort((a, b) =>
      `${a.name || ''} ${a.surname || ''}`
        .toLowerCase()
        .localeCompare(`${b.name || ''} ${b.surname || ''}`.toLowerCase()),
    );

  const handleView = React.useCallback(
    (row, type) => {
      if (!row) return;
      switch (type) {
        case 'attendance':
          if (onViewDetails) onViewDetails(row, sortAlpha(row.attendanceData || row.attendees || []));
          break;
        case 'newPeople':
          if (onViewNewPeople) onViewNewPeople(row, sortAlpha(row.newPeopleData || row.new_people || []));
          break;
        case 'consolidated':
          if (onViewConverts) onViewConverts(row, sortAlpha(row.consolidatedData || row.consolidations || []));
          break;
        default:
          break;
      }
    },
    [onViewDetails, onViewNewPeople, onViewConverts],
  );

  const handleUnsave = React.useCallback(
    (row) => {
      if (!row || !canUnsaveEvent(row)) return;
      if (onUnsaveEvent) onUnsaveEvent(row);
    },
    [onUnsaveEvent, canUnsaveEvent],
  );

  // ── filtered rows ───────────────────────────────────────────────────────────

  const filtered = React.useMemo(() => {
    if (!Array.isArray(events)) return [];
    if (!searchTerm.trim()) return events;
    const term = searchTerm.toLowerCase().trim();
    return events.filter(
      (e) =>
        e &&
        ((e.eventName && e.eventName.toLowerCase().includes(term)) ||
          (e.date && e.date.toString().toLowerCase().includes(term)) ||
          (e.status && e.status.toLowerCase().includes(term)) ||
          (e.closed_by && e.closed_by.toLowerCase().includes(term))),
    );
  }, [events, searchTerm]);

  // ── VIEW button ─────────────────────────────────────────────────────────────

  const ViewBtn = ({ onClick, disabled, color, icon }) => (
    <Tooltip title={disabled ? 'No data' : 'View'}>
      <span>
        <Button
          size="small"
          variant="outlined"
          color={color}
          startIcon={icon}
          onClick={onClick}
          disabled={disabled}
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.07em',
            px: 1.5,
            py: '5px',
            minWidth: 90,
            borderRadius: '6px',
            opacity: disabled ? 0.32 : 1,
            '&.Mui-disabled': {
              borderColor: 'currentColor',
              color: 'currentColor',
            },
          }}
        >
          VIEW
        </Button>
      </span>
    </Tooltip>
  );

  // ── columns ─────────────────────────────────────────────────────────────────

  const columns = React.useMemo(() => {
    const cols = [
      // ── Event (date label + name) ────────────────────────────────────────
      {
        field: 'eventName',
        headerName: 'Event',
        flex: 1,
        minWidth: isSmDown ? 180 : 280,
        sortable: true,
        valueGetter: (value, row) => {
          if (!row) return '';
          const date = row.date
            ? new Date(row.date).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: isSmDown ? 'short' : 'long',
                day: 'numeric',
              })
            : 'No date';
          return `${date} - ${row.eventName || 'Unnamed Event'}`;
        },
        // Sort by the raw date timestamp on the row, ignoring the formatted string value
        sortComparator: (v1, v2, cellParams1, cellParams2) => {
          const t1 = cellParams1.api.getRow(cellParams1.id)?.date
            ? new Date(cellParams1.api.getRow(cellParams1.id).date).getTime()
            : 0;
          const t2 = cellParams2.api.getRow(cellParams2.id)?.date
            ? new Date(cellParams2.api.getRow(cellParams2.id).date).getTime()
            : 0;
          return t1 - t2;
        },
        renderCell: (params) => (
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{
              fontSize: isSmDown ? '0.75rem' : '0.875rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1,
            }}
          >
            {params.value}
          </Typography>
        ),
      },

      // ── Attendance count ─────────────────────────────────────────────────
      {
        field: 'attendanceCount',
        headerName: 'Attendance',
        width: isSmDown ? 75 : 110,
        sortable: true,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (value, row) => getAttendanceCount(row),
        renderCell: (params) => (
          <Typography
            fontWeight={700}
            color={params.value > 0 ? 'primary.main' : 'text.disabled'}
            fontSize={isSmDown ? '0.8rem' : '0.95rem'}
          >
            {params.value}
          </Typography>
        ),
      },

      // ── New People count ─────────────────────────────────────────────────
      {
        field: 'newPeopleCount',
        headerName: 'New People',
        width: isSmDown ? 70 : 110,
        sortable: true,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (value, row) => getNewPeopleCount(row),
        renderCell: (params) => (
          <Typography
            fontWeight={700}
            color={params.value > 0 ? 'success.main' : 'text.disabled'}
            fontSize={isSmDown ? '0.8rem' : '0.95rem'}
          >
            {params.value}
          </Typography>
        ),
      },

      // ── Consolidated count ───────────────────────────────────────────────
      {
        field: 'consolidatedCount',
        headerName: 'Consolidated',
        width: isSmDown ? 75 : 120,
        sortable: true,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (value, row) => getConsolidatedCount(row),
        renderCell: (params) => (
          <Typography
            fontWeight={700}
            color={params.value > 0 ? 'secondary.main' : 'text.disabled'}
            fontSize={isSmDown ? '0.8rem' : '0.95rem'}
          >
            {params.value}
          </Typography>
        ),
      },

      // ── VIEW Attendance ──────────────────────────────────────────────────
      {
        field: 'viewAttendance',
        headerName: isSmDown ? '' : 'Attendance',
        width: isSmDown ? 48 : 130,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const count = getAttendanceCount(params.row);
          return isSmDown ? (
            <Tooltip title={count === 0 ? 'No data' : 'View Attendance'}>
              <span>
                <IconButton size="small" color="primary" disabled={count === 0}
                  onClick={() => handleView(params.row, 'attendance')}
                  sx={{ opacity: count === 0 ? 0.3 : 1 }}>
                  <VisibilityIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <ViewBtn onClick={() => handleView(params.row, 'attendance')}
              disabled={count === 0} color="primary"
              icon={<VisibilityIcon sx={{ fontSize: '0.95rem' }} />} />
          );
        },
      },

      // ── VIEW New People ──────────────────────────────────────────────────
      {
        field: 'viewNewPeople',
        headerName: isSmDown ? '' : 'New People',
        width: isSmDown ? 48 : 130,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const count = getNewPeopleCount(params.row);
          return isSmDown ? (
            <Tooltip title={count === 0 ? 'No data' : 'View New People'}>
              <span>
                <IconButton size="small" color="success" disabled={count === 0}
                  onClick={() => handleView(params.row, 'newPeople')}
                  sx={{ opacity: count === 0 ? 0.3 : 1 }}>
                  <PersonIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <ViewBtn onClick={() => handleView(params.row, 'newPeople')}
              disabled={count === 0} color="success"
              icon={<PersonIcon sx={{ fontSize: '0.95rem' }} />} />
          );
        },
      },

      // ── VIEW Consolidated ────────────────────────────────────────────────
      {
        field: 'viewConsolidated',
        headerName: isSmDown ? '' : 'Consolidated',
        width: isSmDown ? 48 : 140,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const count = getConsolidatedCount(params.row);
          return isSmDown ? (
            <Tooltip title={count === 0 ? 'No data' : 'View Consolidated'}>
              <span>
                <IconButton size="small" color="secondary" disabled={count === 0}
                  onClick={() => handleView(params.row, 'consolidated')}
                  sx={{ opacity: count === 0 ? 0.3 : 1 }}>
                  <EmojiPeopleIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <ViewBtn onClick={() => handleView(params.row, 'consolidated')}
              disabled={count === 0} color="secondary"
              icon={<EmojiPeopleIcon sx={{ fontSize: '0.95rem' }} />} />
          );
        },
      },
    ];

    // ── Unsave (optional) ────────────────────────────────────────────────────
    if (onUnsaveEvent) {
      cols.push({
        field: 'unsave',
        headerName: '',
        width: isSmDown ? 48 : 90,
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const canUnsave = canUnsaveEvent(params.row);
          return (
            <Tooltip title={canUnsave ? 'Unsave event' : "Only today's events can be unsaved"}>
              <span>
                <IconButton size="small" color="warning" disabled={!canUnsave}
                  onClick={() => handleUnsave(params.row)}
                  sx={{ opacity: !canUnsave ? 0.25 : 1 }}>
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      });
    }

    return cols;
  }, [
    isSmDown,
    getAttendanceCount, getNewPeopleCount, getConsolidatedCount,
    handleView, handleUnsave, canUnsaveEvent, onUnsaveEvent,
  ]);

  // ── sizes ───────────────────────────────────────────────────────────────────

  const gridHeight    = isMdDown ? 'calc(100vh - 220px)' : 650;
  const gridMinHeight = isMdDown ? 500 : 650;
  const gridMaxHeight = isMdDown ? 650 : 700;

  // ── loading ─────────────────────────────────────────────────────────────────

  if (isLoading && filtered.length === 0) {
    return (
      <Paper variant="outlined" sx={{ boxShadow: 3, overflow: 'hidden', width: '100%', height: gridHeight, minHeight: gridMinHeight }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Skeleton variant="rounded" height={48} />
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} variant="rounded" height={44} />)}
        </Box>
      </Paper>
    );
  }

  // ── empty ───────────────────────────────────────────────────────────────────

  if (!filtered || filtered.length === 0) {
    return (
      <Paper variant="outlined" sx={{
        boxShadow: 3, overflow: 'hidden', width: '100%',
        height: gridHeight, minHeight: gridMinHeight,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2, p: 4,
      }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          {events?.length === 0 ? 'No event history found' : 'No matching events found'}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {events?.length === 0
            ? 'Closed events with attendance data will appear here'
            : 'Try a different search term'}
        </Typography>
        {onRefresh && (
          <Button variant="outlined" onClick={onRefresh} startIcon={<RefreshIcon />}>
            Refresh Events
          </Button>
        )}
      </Paper>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <Paper variant="outlined" sx={{
      boxShadow: 3, overflow: 'hidden', width: '100%',
      height: gridHeight, minHeight: gridMinHeight, maxHeight: gridMaxHeight,
    }}>
      <DataGrid
        rows={filtered}
        columns={columns}
        loading={isLoading}
        disableRowSelectionOnClick
        disableColumnMenu
        getRowId={(row) => row.id || row._id || Math.random().toString(36)}
        rowHeight={52}
        columnHeaderHeight={48}
        initialState={{
          pagination: { paginationModel: { pageSize: isSmDown ? 10 : 25 } },
          // Sort by eventName desc — but sortComparator uses the raw date timestamp
          sorting: { sortModel: [{ field: 'eventName', sort: 'desc' }] },
        }}
        pageSizeOptions={isSmDown ? [10, 25] : [10, 25, 50]}
        sx={{
          width: '100%',
          height: '100%',
          border: 'none',

          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            minHeight: '48px !important',
            maxHeight: '48px !important',
          },
          '& .MuiDataGrid-columnHeader': {
            height: '48px !important',
            px: '16px',
            '& .MuiDataGrid-iconButtonContainer': { visibility: 'visible', width: 'auto' },
            '& .MuiDataGrid-sortIcon': { opacity: 0.5 },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: '0.82rem',
            color: theme.palette.text.primary,
            whiteSpace: 'nowrap',
            overflow: 'visible',
          },
          '& .MuiDataGrid-columnSeparator': { display: 'none' },

          '& .MuiDataGrid-row': {
            '&:hover': { backgroundColor: theme.palette.action.hover },
            '&.Mui-selected': { backgroundColor: 'transparent' },
            '&.Mui-selected:hover': { backgroundColor: theme.palette.action.hover },
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            px: '16px',
            fontSize: '0.875rem',
            outline: 'none !important',
            '&:focus, &:focus-within': { outline: 'none' },
          },
          '& .MuiDataGrid-cell[data-field="eventName"]':         { justifyContent: 'flex-start' },
          '& .MuiDataGrid-cell[data-field="attendanceCount"]':   { justifyContent: 'center' },
          '& .MuiDataGrid-cell[data-field="newPeopleCount"]':    { justifyContent: 'center' },
          '& .MuiDataGrid-cell[data-field="consolidatedCount"]': { justifyContent: 'center' },
          '& .MuiDataGrid-cell[data-field="viewAttendance"]':    { justifyContent: 'center' },
          '& .MuiDataGrid-cell[data-field="viewNewPeople"]':     { justifyContent: 'center' },
          '& .MuiDataGrid-cell[data-field="viewConsolidated"]':  { justifyContent: 'center' },
          '& .MuiDataGrid-cell[data-field="unsave"]':            { justifyContent: 'center' },

          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            minHeight: '52px',
          },
          '& .MuiTablePagination-root': { fontSize: '0.75rem' },
          '& .MuiDataGrid-virtualScroller': { outline: 'none' },
          '& .MuiDataGrid-row:last-child .MuiDataGrid-cell': { borderBottom: 'none' },
          '& .MuiDataGrid-overlayWrapper': { minHeight: 100 },
        }}
      />
    </Paper>
  );
});

export default EventHistory;