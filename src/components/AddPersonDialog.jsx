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
  MenuItem,
  Autocomplete,
} from "@mui/material";
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Wc as GenderIcon,
} from "@mui/icons-material";
import axios from "axios";

export default function AddPersonDialog({ open, onClose, onSave, formData, setFormData }) {
  const theme = useTheme();
  const [peopleList, setPeopleList] = useState([]);
  const [errors, setErrors] = useState({});

  // Dynamic colors based on theme mode
  const inputBg = theme.palette.mode === "dark" ? "#424242" : "#fff";
  const inputLabel = theme.palette.text.secondary;
  const inputText = theme.palette.text.primary;
  const btnBg = theme.palette.mode === "dark" ? "#000" : theme.palette.primary.main;
  const btnHover = theme.palette.mode === "dark" ? "#222" : theme.palette.primary.dark;
  const cancelBorder = theme.palette.mode === "dark" ? "#666" : "#ccc";
  const cancelBgHover = theme.palette.mode === "dark" ? "#333" : "#f5f5f5";
  const cancelText = theme.palette.mode === "dark" ? "#fff" : "#333";

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

  const leftFields = [
    { name: "name", label: "Name", icon: <PersonIcon fontSize="small" sx={{ color: inputText }} />, required: true },
    { name: "surname", label: "Surname", icon: <PersonIcon fontSize="small" sx={{ color: inputText }} />, required: true },
    { name: "dob", label: "Date of Birth", icon: <CalendarIcon fontSize="small" sx={{ color: inputText }} />, required: true, type: "date" },
  ];

  const rightFields = [
    { name: "homeAddress", label: "Home Address", icon: <HomeIcon fontSize="small" sx={{ color: inputText }} />, required: true },
    { name: "email", label: "Email Address", icon: <EmailIcon fontSize="small" sx={{ color: inputText }} />, required: true, type: "email" },
    { name: "phone", label: "Phone Number", icon: <PhoneIcon fontSize="small" sx={{ color: inputText }} />, required: true },
    { name: "gender", label: "Gender", icon: <GenderIcon fontSize="small" sx={{ color: inputText }} />, select: true, options: ["Male", "Female"], required: true },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    [...leftFields, ...rightFields].forEach(({ name, label, required }) => {
      if (required) {
        const value = formData[name];
        if (!value || (typeof value === "string" && value.trim() === "")) {
          newErrors[name] = `${label.replace(" :", "")} is required`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = () => {
    if (validate()) {
      onSave();
    }
  };

  const inputStyles = (error) => ({
    borderRadius: 2,
    backgroundColor: inputBg,
    color: inputText,
    border: error ? `1.5px solid ${theme.palette.error.main}` : "1.5px solid transparent",
    paddingLeft: 0,
    "& .MuiInputBase-input": {
      color: inputText,
      padding: "10.5px 14px",
    },
    "& .MuiSelect-icon": {
      color: theme.palette.mode === "dark" ? "#bbb" : "#555",
    },
  });

  const labelStyles = {
    fontWeight: 500,
    color: inputLabel,
  };

  const renderTextField = ({ name, label, select, options, type }) => {
    if (name === "invitedBy") {
      return (
        <Autocomplete
          key={name}
          freeSolo
          options={peopleList}
          value={formData[name] || ""}
          onChange={(e, newValue) => setFormData((prev) => ({ ...prev, invitedBy: newValue }))}
          onInputChange={(e, newInputValue) => setFormData((prev) => ({ ...prev, invitedBy: newInputValue }))}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Invited By"
              size="small"
              margin="dense"
              InputProps={{
                ...params.InputProps,
                sx: inputStyles(false),
              }}
              InputLabelProps={{ sx: labelStyles }}
              sx={{ mb: 1 }}
            />
          )}
        />
      );
    }

    return (
      <TextField
        key={name}
        label={label}
        name={name}
        type={type || "text"}
        select={select}
        value={formData[name] || ""}
        onChange={handleInputChange}
        fullWidth
        size="small"
        margin="dense"
        error={!!errors[name]}
        helperText={errors[name]}
        InputProps={{
          sx: inputStyles(!!errors[name]),
        }}
        InputLabelProps={{
          shrink: type === "date" || Boolean(formData[name]),
          sx: labelStyles,
        }}
        sx={{ mb: 1 }}
      >
        {select &&
          options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
      </TextField>
    );
  };

  const isFormValid = () => {
    return [...leftFields, ...rightFields].every(({ name, required }) => {
      if (!required) return true;
      const val = formData[name];
      return val !== undefined && val !== null && val.toString().trim() !== "";
    });
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
          overflow: "hidden",
          boxShadow: 5,
          backgroundColor: theme.palette.background.paper,
        },
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
            {renderTextField({ name: "invitedBy" })} {/* Autocomplete */}
          </Grid>
          <Grid item xs={12} sm={6}>
            {rightFields.map(renderTextField)}
          </Grid>
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
            textTransform: "uppercase",
            fontWeight: "bold",
            "&:hover": { borderColor: cancelBorder, backgroundColor: cancelBgHover },
            minWidth: 120,
            px: 3,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSaveClick}
          disabled={!isFormValid()}
          sx={{
            backgroundColor: isFormValid() ? btnBg : "#999",
            color: "#fff",
            textTransform: "none",
            borderRadius: 2,
            minWidth: 140,
            px: 3,
            boxShadow: 3,
            "&:hover": {
              backgroundColor: isFormValid() ? btnHover : "#999",
            },
          }}
        >
          Save Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
