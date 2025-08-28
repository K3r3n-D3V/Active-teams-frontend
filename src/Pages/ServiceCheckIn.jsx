import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useTheme,
  useMediaQuery,
  TablePagination,
  MenuItem,
  Select,
  Chip,
  CircularProgress,
  Tooltip,
  Alert,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";

// Change this once, use everywhere
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const formatDate = (iso) => {
  try {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso || "";
  }
};

const ServiceCheckIn = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const [selectedEventId, setSelectedEventId] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState("");

  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [actionBusyName, setActionBusyName] = useState(""); // show spinner per-row
  const [globalBusy, setGlobalBusy] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // --- Load all events ---
  useEffect(() => {
    let active = true;
    (async () => {
      setEventsLoading(true);
      setEventsError("");
      try {
        const res = await axios.get(`${BASE_URL}/events`);
        const list = (res.data?.events || []).map((e) => ({
          id: e._id || e.id,
          service_name: e.service_name || e.type || "Event",
          date: e.date || e.start_date || e.created_at,
          label:
            (e.service_name ? e.service_name : e.type || "Event") +
            (e.date || e.start_date ? ` — ${formatDate(e.date || e.start_date)}` : ""),
        }));
        if (!active) return;
        setEvents(list);
        if (list.length && !selectedEventId) setSelectedEventId(list[0].id);
      } catch (err) {
        if (!active) return;
        setEventsError(err?.response?.data?.detail || "Failed to load events.");
      } finally {
        if (active) setEventsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // --- Load attendees for selected event ---
  const fetchAttendees = async (eventId) => {
    if (!eventId) return;
    setAttLoading(true);
    setAttError("");
    try {
      const res = await axios.get(`${BASE_URL}/checkins/${eventId}`);
      const raw = res.data?.attendees || [];
      const mapped = raw.map((a) => ({
        id: a.name,
        name: a.name,
        time: a.time,
        checkedIn: true,
        event: res.data?.service_name || "Service",
      }));
      setAttendees(mapped);
    } catch (err) {
      setAttError(err?.response?.data?.detail || "Failed to load check-ins.");
      setAttendees([]);
    } finally {
      setAttLoading(false);
    }
  };

  useEffect(() => {
    setPage(0); // reset pagination on event change
    fetchAttendees(selectedEventId);
  }, [selectedEventId]);

  // --- Actions ---
  const handleRefresh = () => fetchAttendees(selectedEventId);

  const handleCheckIn = async () => {
    if (!selectedEventId || !newName.trim()) return;
    setGlobalBusy(true);
    try {
      await axios.post(`${BASE_URL}/checkin`, {
        event_id: selectedEventId,
        name: newName.trim(),
      });
      setNewName("");
      await fetchAttendees(selectedEventId);
    } catch (err) {
      alert(err?.response?.data?.detail || "Check-in failed.");
    } finally {
      setGlobalBusy(false);
    }
  };

  const handleUncheck = async (name) => {
    if (!selectedEventId || !name) return;
    setActionBusyName(name);
    try {
      await axios.post(`${BASE_URL}/uncapture`, {
        event_id: selectedEventId,
        name,
      });
      setAttendees((prev) => prev.filter((p) => p.name !== name));
    } catch (err) {
      alert(err?.response?.data?.detail || "Remove failed.");
    } finally {
      setActionBusyName("");
    }
  };

  // --- Filters & pagination ---
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return attendees;
    return attendees.filter((p) => p.name.toLowerCase().includes(s));
  }, [attendees, search]);

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(+e.target.value);
    setPage(0);
  };

  return (
    <Box p={isMobile ? 2 : 4} mt={4}> {/* Added mt={4} to move the board down */}
      <Paper elevation={3} sx={{ p: isMobile ? 2 : 4, borderRadius: 3, mt: 2 }}> {/* Added mt: 2 inside Paper for extra spacing */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={2}>
          <Typography variant={isMobile ? "h6" : "h5"}>Service Check-In</Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <span>
                <IconButton onClick={handleRefresh} disabled={!selectedEventId || attLoading}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {eventsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {eventsError}
          </Alert>
        )}

        {/* Controls */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6}>
            <Select
              fullWidth
              size="small"
              value={selectedEventId}
              displayEmpty
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <MenuItem value="">
                {eventsLoading ? "Loading events..." : "Select Event"}
              </MenuItem>
              {events.map((ev) => (
                <MenuItem key={ev.id} value={ev.id}>
                  {ev.label}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Search Attendee (by name)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!selectedEventId}
            />
          </Grid>

          {/* Quick check-in input */}
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              size="small"
              label="Enter name to check-in"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={!selectedEventId || globalBusy}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              size="medium"
              startIcon={<CheckCircleIcon />}
              onClick={handleCheckIn}
              disabled={!selectedEventId || !newName.trim() || globalBusy}
            >
              {globalBusy ? "Checking in..." : "Check In"}
            </Button>
          </Grid>
        </Grid>

        {/* Loader & Errors */}
        {attError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {attError}
          </Alert>
        )}

        {attLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Table */}
            <TableContainer>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    {!isMobile && <TableCell>Checked-in Time</TableCell>}
                    {!isMobile && <TableCell>Event</TableCell>}
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {selectedEventId
                          ? "No attendees match your search."
                          : "Select an event to view check-ins."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paged.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.name}</TableCell>
                        {!isMobile && <TableCell>{formatDate(p.time)}</TableCell>}
                        {!isMobile && <TableCell>{p.event}</TableCell>}
                        <TableCell>
                          <Chip
                            label={p.checkedIn ? "Present" : "Absent"}
                            color={p.checkedIn ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remove check-in">
                            <span>
                              <IconButton
                                color="error"
                                onClick={() => handleUncheck(p.name)}
                                disabled={actionBusyName === p.name}
                              >
                                {actionBusyName === p.name ? (
                                  <CircularProgress size={22} />
                                ) : (
                                  <CancelIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ServiceCheckIn;
