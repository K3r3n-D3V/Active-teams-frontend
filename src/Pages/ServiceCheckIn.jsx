// Keep your imports the same
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
} from "@mui/material";
import AddPersonDialog from "../components/AddPersonDialog";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const BASE_URL = "http://localhost:8000";

function ServiceCheckIn({ currentEvent }) { // ensure you pass the event as a prop
  const [attendees, setAttendees] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    dob: "",
    address: "",
    invitedBy: "",
    email: "",
    phone: "",
    gender: "",
  });

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  // Fetch all people
  useEffect(() => {
    const fetchAllPeople = async () => {
      try {
        let allPeople = [];
        let page = 1;
        const perPage = 100;
        let total = 0;

        do {
          const res = await axios.get(`${BASE_URL}/people?page=${page}&perPage=${perPage}`);
          const peoplePage = Array.isArray(res.data.results)
            ? res.data.results.map(p => ({
                _id: p._id,
                name: p.Name || "",
                surname: p.Surname || "",
                email: p.Email || "",
                phone: p.Phone || "",
                leader: p.Leader || "",
                present: p.Present || false,
                firstTime: p.FirstTime || false,
              }))
            : [];

          allPeople = [...allPeople, ...peoplePage];
          total = res.data.total || 0;
          page++;
        } while (allPeople.length < total);

        setAttendees(allPeople);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.detail || error.message);
      }
    };

    fetchAllPeople();
  }, []);

  // Filter attendees based on search
  const filteredAttendees = attendees.filter(
    (a) =>
      (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
      (a.surname && a.surname.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
  );

  const paginatedAttendees = filteredAttendees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const presentCount = filteredAttendees.filter((a) => a.present).length;
  const attendeesCount = filteredAttendees.length;

  const buttonStyles = {
    backgroundColor: isDarkMode ? "white" : "black",
    color: isDarkMode ? "black" : "white",
    "&:hover": {
      backgroundColor: isDarkMode ? "#ddd" : "#222",
    },
  };

  const handleSaveDetails = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }

    const newPerson = {
      ...formData,
      leader: "New",
      present: false,
      firstTime: true,
      eventId: null,
    };

    try {
      const res = await axios.post(`${BASE_URL}/people`, newPerson);
      const addedPerson = {
        ...newPerson,
        _id: res.data.id || Date.now().toString(),
      };
      setAttendees((prev) => [...(Array.isArray(prev) ? prev : []), addedPerson]);
      setFormData({
        name: "",
        surname: "",
        dob: "",
        address: "",
        invitedBy: "",
        email: "",
        phone: "",
        gender: "",
      });
      setOpenDialog(false);
      toast.success("Person added");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // Toggle check-in / uncapture
  const handleToggleCheckIn = async (attendee) => {
    if (!currentEvent) {
      toast.error("No event selected");
      return;
    }

    try {
      if (!attendee.present) {
        // Check-in
        const res = await axios.post(`${BASE_URL}/checkin`, {
          event_id: currentEvent._id,
          name: attendee.name,
        });
        toast.success(res.data.message);

        setAttendees(prev =>
          prev.map(a => a._id === attendee._id ? { ...a, present: true } : a)
        );
      } else {
        // Uncapture
        const res = await axios.post(`${BASE_URL}/uncapture`, {
          event_id: currentEvent._id,
          name: attendee.name,
        });
        toast.info(res.data.message);

        setAttendees(prev =>
          prev.map(a => a._id === attendee._id ? { ...a, present: false } : a)
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.message);
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3 }} sx={{ maxWidth: "1200px", margin: "0 auto", mt: 5 }}>
      <ToastContainer />
      <Typography variant={isSmDown ? "h6" : "h5"} fontWeight={700} gutterBottom textAlign="center">
        Service Check-In
      </Typography>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={6}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">{presentCount}</Typography>
            <Typography variant="body2">Attendees Present</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">{attendeesCount}</Typography>
            <Typography variant="body2">Total Attendees</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2} alignItems="center">
        <Grid item xs={12} sm={8}>
          <TextField
            size="small"
            placeholder="Search members by name, surname, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            fullWidth
            sx={buttonStyles}
            onClick={() => setOpenDialog(true)}
          >
            Add Person
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="center">Present</TableCell>
              <TableCell>Leader</TableCell>
              <TableCell>First Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAttendees.length > 0 ? (
              paginatedAttendees.map((attendee) => (
                <TableRow key={attendee._id || attendee.id}>
                  <TableCell>{attendee.name} {attendee.surname}</TableCell>
                  <TableCell>{attendee.email}</TableCell>
                  <TableCell>{attendee.phone}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleToggleCheckIn(attendee)} color="success">
                      {attendee.present ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{attendee.leader}</TableCell>
                  <TableCell>{attendee.firstTime ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">No attendees found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredAttendees.length}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 20, 50]}
      />

      <AddPersonDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveDetails}
        formData={formData}
        setFormData={setFormData}
      />
    </Box>
  );
}

export default ServiceCheckIn;
