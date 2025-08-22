import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  Typography,
  useTheme,
  InputAdornment,
  MenuItem,
  Autocomplete
} from "@mui/material";
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Group as GroupIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Wc as GenderIcon
} from "@mui/icons-material";
import axios from "axios";

export default function AddPersonDialog({ open, onClose, onSave, formData, setFormData }) {
  const theme = useTheme();
  const [peopleList, setPeopleList] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!open) return;
    const fetchPeople = async () => {
      try {
        const response = await axios.get("/api/people");
        const names = response.data.map((person) => person.name);
        setPeopleList(names);
      } catch (err) {
        console.error("Failed to fetch people:", err);
        setPeopleList([]);
      }
    };
    fetchPeople();
  }, [open]);

  const inputBg = theme.palette.mode === "dark" ? "#424242" : "#fafafa";
  const inputLabel = theme.palette.mode === "dark" ? "#e0e0e0" : "#333";
  const inputText = theme.palette.mode === "dark" ? "#fff" : "#000";
  const btnBg = "#000";
  const btnHover = "#222";
  const cancelBorder = theme.palette.mode === "dark" ? "#666" : "#ccc";
  const cancelBgHover = theme.palette.mode === "dark" ? "#333" : "#f5f5f5";
  const cancelText = theme.palette.mode === "dark" ? "#fff" : "#333";

  const leftFields = [
    { name: "name", label: "Name :", icon: <PersonIcon fontSize="small" /> },
    { name: "surname", label: "Surname :", icon: <PersonIcon fontSize="small" /> },
    { name: "dob", label: "Date of Birth :", icon: <CalendarIcon fontSize="small" /> }
  ];

  const rightFields = [
    { name: "homeAddress", label: "Home Address :", icon: <HomeIcon fontSize="small" /> },
    { name: "email", label: "Email Address :", icon: <EmailIcon fontSize="small" /> },
    { name: "phone", label: "Phone Number :", icon: <PhoneIcon fontSize="small" /> },
    { name: "gender", label: "Gender :", icon: <GenderIcon fontSize="small" />, select: true, options: ["Male", "Female"] }
  ];

  const renderTextField = ({ name, label, icon, select, options }) => {
    if (name === "invitedBy") {
      return (
        <Autocomplete
          key={name}
          freeSolo
          options={peopleList}
          value={formData[name] || ""}
          onChange={(e, newValue) => setFormData((prev) => ({ ...prev, invitedBy: newValue }))}
          onInputChange={(e, newInputValue) =>
            setFormData((prev) => ({ ...prev, invitedBy: newInputValue }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Invited By :"
              size="small"
              margin="dense"
              InputProps={{
                ...params.InputProps,
                startAdornment: <InputAdornment position="start">{<GroupIcon fontSize="small" />}</InputAdornment>,
                sx: { borderRadius: 2, backgroundColor: inputBg, color: inputText }
              }}
              InputLabelProps={{ sx: { fontWeight: 500, color: inputLabel } }}
              sx={{ mb: 1 }}
            />
          )}
        />
      );
    }

    if (select) {
      return (
        <TextField
          key={name}
          select
          label={label}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          fullWidth
          size="small"
          margin="dense"
          InputProps={{
            startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
            sx: { borderRadius: 2, backgroundColor: inputBg, color: inputText }
          }}
          InputLabelProps={{ sx: { fontWeight: 500, color: inputLabel } }}
          sx={{ mb: 1 }}
        >
          {options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    return (
      <TextField
        key={name}
        label={label}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        fullWidth
        size="small"
        margin="dense"
        InputProps={{
          startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
          sx: { borderRadius: 2, backgroundColor: inputBg, color: inputText }
        }}
        InputLabelProps={{ sx: { fontWeight: 500, color: inputLabel } }}
        sx={{ mb: 1 }}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: 5,
          backgroundColor: theme.palette.background.paper
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight={600} color={inputText}>
          Add New Person
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            {leftFields.map(renderTextField)}
            {renderTextField({ name: "invitedBy" })} {/* Autocomplete inserted here */}
          </Grid>
          <Grid item xs={12} sm={6}>{rightFields.map(renderTextField)}</Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: 2,
            borderColor: cancelBorder,
            color: cancelText,
            "&:hover": { borderColor: cancelBorder, backgroundColor: cancelBgHover },
            minWidth: 120
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={onSave}
          sx={{
            backgroundColor: btnBg,
            color: "#fff",
            "&:hover": { backgroundColor: btnHover },
            borderRadius: 2,
            minWidth: 140,
            px: 3,
            boxShadow: 3,
            textTransform: "none"
          }}
        >
          Save Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
