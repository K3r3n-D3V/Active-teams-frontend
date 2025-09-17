import React, { useState, useEffect } from "react";
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
  Card,
  CardContent,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Skeleton,
} from "@mui/material";
import AddPersonDialog from "../components/AddPersonDialog";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ConsolidationModal from "../components/ConsolidationModal";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

function ServiceCheckIn() {
  const [attendees, setAttendees] = useState(() => {
    const stored = localStorage.getItem("attendees");
    return stored ? JSON.parse(stored) : [];
  });

  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem("events");
    return stored ? JSON.parse(stored) : [];
  });

  const [currentEventId, setCurrentEventId] = useState(
    localStorage.getItem("currentEventId") || ""
  );

  const [eventCheckIns, setEventCheckIns] = useState(() => {
    const stored = localStorage.getItem("eventCheckIns");
    return stored ? JSON.parse(stored) : {};
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [firstTimeAddedIds, setFirstTimeAddedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [consolidationOpen, setConsolidationOpen] = React.useState(false);
  
  // Loading states
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // NEW: modal search & pagination state
  const [modalSearch, setModalSearch] = useState("");
  const [modalPage, setModalPage] = useState(0);
  const [modalRowsPerPage, setModalRowsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    dob: "",
    homeAddress: "",
    invitedBy: "",
    email: "",
    phone: "",
    gender: "",
    leader12: "",
    leader144: "",
    leader1728: "",
  });

  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));
  const isDarkMode = theme.palette.mode === "dark";

  const getResponsiveValue = (xs, sm, md, lg, xl) => {
    if (isXsDown) return xs;
    if (isSmDown) return sm;
    if (isMdDown) return md;
    if (isLgDown) return lg;
    return xl;
  };

  const containerPadding = getResponsiveValue(1, 2, 3, 4, 4);
  const titleVariant = getResponsiveValue("subtitle1", "h6", "h5", "h4", "h4");
  const cardSpacing = getResponsiveValue(1, 2, 2, 3, 3);

  // Persist data to localStorage
  useEffect(() => {
    localStorage.setItem("attendees", JSON.stringify(attendees));
  }, [attendees]);

  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem("currentEventId", currentEventId);
  }, [currentEventId]);

  useEffect(() => {
    localStorage.setItem("eventCheckIns", JSON.stringify(eventCheckIns));
  }, [eventCheckIns]);

  const toArray = (resData) =>
    Array.isArray(resData)
      ? resData
      : Array.isArray(resData?.results)
      ? resData.results
      : Array.isArray(resData?.events)
      ? resData.events
      : [];

  const getAttendeesWithPresentStatus = () => {
    const currentEventCheckIns = eventCheckIns[currentEventId] || [];
    return attendees.map((attendee) => ({
      ...attendee,
      present: currentEventCheckIns.includes(attendee._id),
    }));
  };

  // Skeleton components
  const SkeletonCard = () => (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="80%" height={20} sx={{ mt: 0.5 }} />
            <Skeleton variant="text" width="70%" height={20} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
        <Stack direction="row" spacing={1} justifyContent="flex-end" mb={1}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
          <Skeleton variant="rounded" width={80} height={20} />
          <Skeleton variant="rounded" width={90} height={20} />
          <Skeleton variant="rounded" width={85} height={20} />
        </Stack>
      </CardContent>
    </Card>
  );

  const SkeletonTableRow = () => (
    <TableRow>
      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="circular" width={24} height={24} />
        </Stack>
      </TableCell>
    </TableRow>
  );

  // Fetch events
  // useEffect(() => {
  //   const fetchEvents = async () => {
  //     setIsLoadingEvents(true);
  //     try {
  //       const res = await axios.get(`${BASE_URL}/events`);
  //       const normalized = toArray(res.data).map((e) => ({
  //         id: e._id || e.id || e.eventId,
  //         eventName: e.eventName || e.name || e.title || "Untitled Event",
  //       }));
  //       setEvents(normalized);
  //     } catch (err) {
  //       console.error(err);
  //       toast.error(err.response?.data?.detail || "Failed to fetch events");
  //     } finally {
  //       setIsLoadingEvents(false);
  //     }
  //   };
  //   fetchEvents();
  // }, []);
useEffect(() => {
  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await axios.get(`${BASE_URL}/events`);
      const normalized = toArray(res.data)
        .map((e) => ({
          id: e._id || e.id || e.eventId,
          eventName: e.eventName || e.name || e.title || "Untitled Event",
          eventType: e.eventType || e.type || "", // keep eventType if needed
        }))
        .filter((e) => e.eventType?.toLowerCase() !== "cell"); // exclude type "cells"

      setEvents(normalized);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to fetch events");
    } finally {
      setIsLoadingEvents(false);
    }
  };
  fetchEvents();
}, []);

  // Fetch people
  useEffect(() => {
    const fetchAllPeople = async () => {
      setIsLoadingPeople(true);
      try {
        let allPeople = [];
        let page = 1;
        const perPage = 200;
        let total = Infinity;

        while (allPeople.length < total) {
          const res = await axios.get(
            `${BASE_URL}/people?page=${page}&perPage=${perPage}`
          );
          const results = toArray(res.data);
          const peoplePage = results.map((p) => ({
            _id: p._id || p.id || `${p.Email || p.Name || ""}-${page}`,
            name: p.Name || p.name || "",
            surname: p.Surname || p.surname || "",
            email: p.Email || p.email || "",
            phone: p.Number || p.Phone || p.phone || "",
            leader12: p["Leader @12"] || p.leader12 || "",
            leader144: p["Leader @144"] || p.leader144 || "",
            leader1728: p["Leader @ 1728"] || p.leader1728 || "",
          }));

          allPeople = allPeople.concat(peoplePage);
          total =
            typeof res.data?.total === "number"
              ? res.data.total
              : allPeople.length;

          if (results.length === 0) break;
          page += 1;
        }

        setAttendees(allPeople);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.detail || err.message);
      } finally {
        setIsLoadingPeople(false);
      }
    };

    fetchAllPeople();
  }, []);

  const handleConsolidationClick = () => setConsolidationOpen(true);
  const handleFinishConsolidation = (task) => {
    console.log("Consolidation task:", task);
    // Save to DB here
  };

  // Handle edit
  const handleEditClick = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || "",
      surname: person.surname || "",
      dob: person.dob || "",
      homeAddress: person.homeAddress || "",
      email: person.email || "",
      phone: person.phone || "",
      gender: person.gender || "",
      invitedBy: person.invitedBy || "",
      leader12: person.leader12 || "",
      leader144: person.leader144 || "",
      leader1728: person.leader1728 || "",
    });
    setOpenDialog(true);
  };

  // Handle save (add/update)
  const handlePersonSave = (responseData) => {
    const newPersonData = responseData.person || responseData;
    const newPersonId = responseData.id || responseData._id || newPersonData._id;

    const newPerson = {
      _id: newPersonId,
      name: newPersonData.Name || formData.name,
      surname: newPersonData.Surname || formData.surname,
      email: newPersonData.Email || formData.email,
      phone: newPersonData.Phone || newPersonData.Number || formData.phone,
      leader12: newPersonData["Leader @12"] || formData.leader12 || "",
      leader144: newPersonData["Leader @144"] || formData.leader144 || "",
      leader1728: newPersonData["Leader @ 1728"] || formData.leader1728 || "",
    };

    let isNew = false;

    setAttendees((prevAttendees) => {
      const exists = prevAttendees.some((att) => att._id === newPersonId);
      if (exists) return prevAttendees.map((att) => (att._id === newPersonId ? newPerson : att));
      isNew = true;
      newPerson.isNew = true;
      return [newPerson, ...prevAttendees];
    });

    if (isNew) {
      setFirstTimeAddedIds((prev) => [...prev, newPersonId]);
      setPage(0);
      toast.success(`${newPerson.name} ${newPerson.surname} added successfully!`);
      setTimeout(() => {
        setFirstTimeAddedIds((prev) => prev.filter((id) => id !== newPersonId));
      }, 10000);
    } else {
      toast.success(`${newPerson.name} ${newPerson.surname} updated successfully!`);
    }
  };

  // Handle delete
  const handleDelete = async (personId) => {
    try {
      const res = await fetch(`${BASE_URL}/people/${personId}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(`Delete failed: ${errorData.detail}`);
        return;
      }
      setAttendees((prev) => prev.filter((p) => p._id !== personId));
      toast.success("Person deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting the person");
    }
  };

  const handleToggleCheckIn = async (attendee) => {
    if (!currentEventId) {
      toast.error("Please select an event");
      return;
    }

    try {
      const isCurrentlyPresent = attendee.present;
      if (!isCurrentlyPresent) {
        const res = await axios.post(`${BASE_URL}/checkin`, {
          event_id: currentEventId,
          name: attendee.name,
        });
        toast.success(res.data?.message || "Checked in");
        setEventCheckIns((prev) => ({
          ...prev,
          [currentEventId]: [...(prev[currentEventId] || []), attendee._id],
        }));
      } else {
        const res = await axios.post(`${BASE_URL}/uncapture`, {
          event_id: currentEventId,
          name: attendee.name,
        });
        toast.info(res.data?.message || "Uncaptured");
        setEventCheckIns((prev) => ({
          ...prev,
          [currentEventId]: (prev[currentEventId] || []).filter((id) => id !== attendee._id),
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.message);
    }
  };

  // Load existing check-ins when event changes
  useEffect(() => {
    const loadEventCheckIns = async () => {
      if (!currentEventId) return;
      try {
        const res = await axios.get(`${BASE_URL}/events/${currentEventId}/checkins`);
        const checkedInPeople = toArray(res.data);
        const checkedInIds = checkedInPeople
          .map((person) => {
            const match = attendees.find(
              (a) => a.name === (person.name || person.Name) || a._id === (person._id || person.id)
            );
            return match?._id;
          })
          .filter(Boolean);
        if (checkedInIds.length > 0) {
          setEventCheckIns((prev) => ({ ...prev, [currentEventId]: checkedInIds }));
        }
      } catch {
        // fallback to localStorage
      }
    };
    if (currentEventId && attendees.length > 0) loadEventCheckIns();
  }, [currentEventId, attendees]);

  const attendeesWithStatus = getAttendeesWithPresentStatus();

  const filteredAttendees = attendeesWithStatus.filter((a) => {
    const lc = search.toLowerCase();
    const bag = [
      a.name,
      a.surname,
      a.email,
      a.phone,
      a.leader12,
      a.leader144,
      a.leader1728,
      firstTimeAddedIds.includes(a._id) ? "first time" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return bag.includes(lc);
  });

  const paginatedAttendees = filteredAttendees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const presentCount = attendeesWithStatus.filter((a) => a.present).length;

  // Data for modal (present attendees only)
  const modalBaseList = attendeesWithStatus.filter((a) => a.present);
  const modalFilteredAttendees = modalBaseList.filter((a) => {
    const lc = modalSearch.toLowerCase();
    const bag = [a.name, a.surname, a.email, a.phone, a.leader12, a.leader144, a.leader1728]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return bag.includes(lc);
  });
  const modalPaginatedAttendees = modalFilteredAttendees.slice(
    modalPage * modalRowsPerPage,
    modalPage * modalRowsPerPage + modalRowsPerPage
  );

  // Reusable card for mobile
  const AttendeeCard = ({ attendee }) => (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        "&:last-child": { mb: 0 },
        ...(firstTimeAddedIds.includes(attendee._id) && {
          border: `2px solid ${theme.palette.success.main}`,
          backgroundColor: theme.palette.success.light + "0a",
        }),
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {attendee.name} {attendee.surname}
              {firstTimeAddedIds.includes(attendee._id) && (
                <Chip label="First Time" size="small" sx={{ ml: 1, fontSize: "0.7rem", height: 20 }} color="success" />
              )}
            </Typography>
            {attendee.email && <Typography variant="body2" color="text.secondary">{attendee.email}</Typography>}
            {attendee.phone && <Typography variant="body2" color="text.secondary">{attendee.phone}</Typography>}
          </Box>
        </Box>

        {/* Actions row */}
        <Stack direction="row" spacing={1} justifyContent="flex-end" mb={1}>
          <IconButton onClick={() => handleEditClick(attendee)} color="primary" size="small">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => handleDelete(attendee._id)} color="error" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => handleToggleCheckIn(attendee)} color="success" disabled={!currentEventId} size="small">
            {attendee.present ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
          </IconButton>
        </Stack>

        {(attendee.leader12 || attendee.leader144 || attendee.leader1728) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {attendee.leader12 && (
                <Chip label={`@12: ${attendee.leader12}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {attendee.leader144 && (
                <Chip label={`@144: ${attendee.leader144}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {attendee.leader1728 && (
                <Chip label={`@1728: ${attendee.leader1728}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box p={containerPadding} sx={{ maxWidth: "1400px", margin: "0 auto", mt: getResponsiveValue(2, 3, 4, 5, 5), minHeight: "100vh" }}>
      <ToastContainer position={isSmDown ? "bottom-center" : "top-right"} autoClose={3000} hideProgressBar={isSmDown} />
      <Typography variant={titleVariant} fontWeight={700} gutterBottom textAlign="center" sx={{ mb: cardSpacing }}>
        Service Check-In
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        <Grid item xs={6}>
          <Paper
            variant="outlined"
            sx={{ p: getResponsiveValue(1.5, 2, 2.5, 3, 3), textAlign: "center", cursor: "pointer", "&:hover": { boxShadow: theme.shadows[2], transform: "translateY(-1px)" } }}
            onClick={() => { setModalOpen(true); setModalSearch(""); setModalPage(0); }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <GroupIcon color="primary" sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              {isLoadingPeople ? (
                <Skeleton variant="text" width={40} height={getResponsiveValue(32, 40, 48, 48, 56)} />
              ) : (
                <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600} color="primary">{presentCount}</Typography>
              )}
            </Stack>
            <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
              Present
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper variant="outlined" sx={{ p: getResponsiveValue(1.5, 2, 2.5, 3, 3), textAlign: "center" }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <PersonIcon color="action" sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              {isLoadingPeople ? (
                <Skeleton variant="text" width={40} height={getResponsiveValue(32, 40, 48, 48, 56)} />
              ) : (
                <Typography variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} fontWeight={600}>{attendees.length}</Typography>
              )}
            </Stack>
            <Typography variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")} color="text.secondary">
              Total
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Controls */}
      <Grid container spacing={cardSpacing} mb={cardSpacing} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <Select 
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")} 
            value={currentEventId} 
            onChange={(e) => setCurrentEventId(e.target.value)} 
            displayEmpty 
            fullWidth
            disabled={isLoadingEvents}
          >
            <MenuItem value="">
              {isLoadingEvents ? "Loading events..." : "Select Event"}
            </MenuItem>
            {events.map((ev) => (
              <MenuItem key={ev.id} value={ev.id}>{ev.eventName}</MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={6} md={5}>
          <TextField 
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")} 
            placeholder="Search attendees..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} 
            fullWidth 
            disabled={isLoadingPeople}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Tooltip title="Add Person">
            <PersonAddIcon onClick={() => setOpenDialog(true)} sx={{ cursor: "pointer", fontSize: 36, color: isDarkMode ? "white" : "black", "&:hover": { color: "primary.dark" } }} />
          </Tooltip>
        </Grid>
        {/* Consolidation */}
        <Tooltip title="Consolidation">
          <EmojiPeopleIcon onClick={handleConsolidationClick} sx={{ cursor: "pointer", fontSize: 36, color: isDarkMode ? "white" : "black", "&:hover": { color: "secondary.dark" }, pb: 0.2 }} />
        </Tooltip>
      </Grid>

      {/* Mobile vs Desktop */}
      {isMdDown ? (
        <Box>
          {/* Mobile Cards with Fixed Height and Scroll */}
          <Box 
            sx={{ 
              maxHeight: 500, 
              overflowY: "auto",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 1
            }}
          >
            {isLoadingPeople 
              ? Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} />)
              : paginatedAttendees.map((att) => <AttendeeCard key={att._id} attendee={att} />)
            }
          </Box>

          {/* Pagination under cards */}
          {!isLoadingPeople && (
            <TablePagination 
              component="div" 
              count={filteredAttendees.length} 
              page={page} 
              onPageChange={(e, newPage) => setPage(newPage)} 
              rowsPerPage={rowsPerPage} 
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
              rowsPerPageOptions={[5, 10, 20, 50]} 
            />
          )}
        </Box>
      ) : (
        <Box>
          {/* Page Info for Desktop - Only show when not loading */}
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflowY: "auto" }}>
            <Table size={getResponsiveValue("small", "small", "medium", "medium", "medium")} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Leader @12</TableCell>
                  <TableCell>Leader @144</TableCell>
                  <TableCell>Leader @1728</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingPeople 
                  ? Array.from({ length: 5 }).map((_, index) => <SkeletonTableRow key={index} />)
                  : paginatedAttendees.map((att) => (
                      <TableRow key={att._id} hover>
                        <TableCell>{att.name} {att.surname}</TableCell>
                        <TableCell>{att.phone || "-"}</TableCell>
                        <TableCell>{att.leader12 || "-"}</TableCell>
                        <TableCell>{att.leader144 || "-"}</TableCell>
                        <TableCell>{att.leader1728 || "-"}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleDelete(att._id)} color="error" size="small"><DeleteIcon /></IconButton>
                          <IconButton onClick={() => handleEditClick(att)} color="primary" size="small"><EditIcon /></IconButton>
                          <IconButton onClick={() => handleToggleCheckIn(att)} color="success" size="small" disabled={!currentEventId}>
                            {att.present ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Pagination (desktop table or global) - Only show when not loading */}
      {!isMdDown && !isLoadingPeople && (
        <TablePagination component="div" count={filteredAttendees.length} page={page} onPageChange={(e, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 20, 50]} />
      )}

      {/* Add / Edit Dialog */}
      <AddPersonDialog open={openDialog} onClose={() => setOpenDialog(false)} onSave={handlePersonSave} formData={formData} setFormData={setFormData} isEdit={Boolean(editingPerson)} personId={editingPerson?._id || null} />

      {/* PRESENT Attendees Modal with its own search + pagination */}
      <Dialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            ...(isSmDown && {
              margin: 2,
              maxHeight: '80vh',
              width: 'calc(100% - 32px)',
            })
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Attendees Present: {presentCount}
        </DialogTitle>
        <DialogContent dividers sx={{ maxHeight: isSmDown ? 400 : 500, overflowY: "auto", p: isSmDown ? 1 : 2 }}>
          {/* Modal Search */}
          <TextField
            size="small"
            placeholder="Search present attendees..."
            value={modalSearch}
            onChange={(e) => { setModalSearch(e.target.value); setModalPage(0); }}
            fullWidth
            sx={{ mb: 2 }}
          />

          {isSmDown ? (
            /* Mobile Card View for Modal */
            <Box>
              {modalPaginatedAttendees.map((a) => (
                <Card key={a._id} variant="outlined" sx={{ mb: 1, "&:last-child": { mb: 0 } }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                          {a.name} {a.surname}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mt={0.5}>
                          {a.leader12 && (
                            <Chip label={`@12: ${a.leader12}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                          {a.leader144 && (
                            <Chip label={`@144: ${a.leader144}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                          {a.leader1728 && (
                            <Chip label={`@1728: ${a.leader1728}`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 18 }} />
                          )}
                        </Stack>
                      </Box>
                      <IconButton color="error" size="small" onClick={() => handleToggleCheckIn(a)}>
                        <CheckCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              {modalPaginatedAttendees.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No matching attendees
                </Typography>
              )}
            </Box>
          ) : (
            /* Desktop Table View for Modal */
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Leader@12</TableCell>
                  <TableCell>Leader@144</TableCell>
                  <TableCell>Leader@1728</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modalPaginatedAttendees.map((a) => (
                  <TableRow key={a._id} hover>
                    <TableCell>{a.name} {a.surname}</TableCell>
                    <TableCell>{a.leader12 || "—"}</TableCell>
                    <TableCell>{a.leader144 || "—"}</TableCell>
                    <TableCell>{a.leader1728 || "—"}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => handleToggleCheckIn(a)}>
                        <CheckCircleOutlineIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {modalPaginatedAttendees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No matching attendees</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Modal Pagination */}
          <Box mt={1}>
            <TablePagination
              component="div"
              count={modalFilteredAttendees.length}
              page={modalPage}
              onPageChange={(e, newPage) => setModalPage(newPage)}
              rowsPerPage={modalRowsPerPage}
              onRowsPerPageChange={(e) => { setModalRowsPerPage(parseInt(e.target.value, 10)); setModalPage(0); }}
              rowsPerPageOptions={[5, 10, 20]}
              sx={{
                ...(isSmDown && {
                  '& .MuiTablePagination-toolbar': {
                    minHeight: 40,
                    paddingLeft: 1,
                    paddingRight: 1,
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.8rem',
                  }
                })
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
          <Button onClick={() => setModalOpen(false)} variant="outlined" size={isSmDown ? "small" : "medium"}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ConsolidationModal open={consolidationOpen} onClose={() => setConsolidationOpen(false)} attendeesWithStatus={attendeesWithStatus} onFinish={handleFinishConsolidation} />
    </Box>
  );
}

export default ServiceCheckIn;