import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  TextField, Button, Typography, useTheme, MenuItem, Autocomplete
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

  const inputBg = theme.palette.mode === "dark" ? "#424242" : "#fff";
  const inputLabel = theme.palette.text.secondary;
  const inputText = theme.palette.text.primary;
  const btnBg = theme.palette.mode === "dark" ? "#000" : theme.palette.primary.main;
  const btnHover = theme.palette.mode === "dark" ? "#222" : theme.palette.primary.dark;
  const cancelBorder = theme.palette.mode === "dark" ? "#666" : "#ccc";
  const cancelBgHover = theme.palette.mode === "dark" ? "#333" : "#f5f5f5";
  const cancelText = theme.palette.mode === "dark" ? "#fff" : "#333";

  // Fetch people names for "Invited By" field
  useEffect(() => {
    if (!open) return;
    const fetchPeople = async () => {
      try {
        const response = await axios.get("/api/people");
        setPeopleList(response.data.results || []);
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
    // Trim all input and remove spaces for name/surname
    const newValue = (name === "name" || name === "surname") ? value.replace(/\s+/g, "") : value.trimStart();
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    [...leftFields, ...rightFields].forEach(({ name, label, required }) => {
      if (required) {
        const value = formData[name];
        if (!value || (typeof value === "string" && value.trim() === "")) {
          newErrors[name] = `${label} is required`;
        }
      }
    });

    // Email format validation
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Enter a valid email address";
      } else {
        // Check for duplicate email
        const duplicate = peopleList.find(p => p.Email === formData.email && p._id !== formData._id);
        if (duplicate) newErrors.email = "Email already exists";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validate()) return;

    try {
      const now = new Date().toISOString();
      const payload = {
        _id: formData._id,
        Name: formData.name.trim(),
        Surname: formData.surname.trim(),
        DateOfBirth: formData.dob,
        HomeAddress: formData.homeAddress.trim(),
        Email: formData.email.trim(),
        Phone: formData.phone.trim(),
        Gender: formData.gender,
        InvitedBy: formData.invitedBy?.trim() || "",
        Leader: formData.invitedBy?.trim() || formData.cellLeader || "",
        Stage: formData.stage || "Win",
        CreatedAt: formData._id ? undefined : now,
        UpdatedAt: now,
      };

      const res = formData._id
        ? await axios.put(`http://localhost:8000/people/${formData._id}`, payload)
        : await axios.post("http://localhost:8000/people", payload);

      onSave(res.data);
      onClose();
    } catch (err) {
      console.error("Failed to save person:", err);
      alert("Failed to save person. Check console for details.");
    }
  };

  const inputStyles = (error) => ({
    borderRadius: 2,
    backgroundColor: inputBg,
    color: inputText,
    border: error ? `1.5px solid ${theme.palette.error.main}` : "1.5px solid transparent",
    paddingLeft: 0,
    "& .MuiInputBase-input": { color: inputText, padding: "10.5px 14px" },
    "& .MuiSelect-icon": { color: theme.palette.mode === "dark" ? "#bbb" : "#555" },
  });

  const labelStyles = { fontWeight: 500, color: inputLabel };

  const renderTextField = ({ name, label, select, options, type }) => {
    if (name === "invitedBy") {
      return (
        <Autocomplete
          key={name}
          freeSolo
          options={peopleList.map(p => p.Name)}
          value={formData[name] || ""}
          onChange={(e, newValue) => setFormData((prev) => ({ ...prev, invitedBy: newValue?.trim() }))}
          onInputChange={(e, newInputValue) => setFormData((prev) => ({ ...prev, invitedBy: newInputValue?.trim() }))}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Invited By"
              size="small"
              margin="dense"
              InputProps={{ ...params.InputProps, sx: inputStyles(false) }}
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
        InputProps={{ sx: inputStyles(!!errors[name]) }}
        InputLabelProps={{ shrink: type === "date" || Boolean(formData[name]), sx: labelStyles }}
        sx={{ mb: 1 }}
      >
        {select && options.map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
      </TextField>
    );
  };

  const isFormValid = () => [...leftFields, ...rightFields].every(({ name, required }) => {
    if (!required) return true;
    const val = formData[name];
    return val !== undefined && val !== null && val.toString().trim() !== "" && !errors[name];
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: 5, backgroundColor: theme.palette.background.paper } }}>
      <DialogTitle>
        <Typography variant="h6" fontWeight={600} color={inputText}>
          {formData._id ? "Edit Person" : "Add New Person"}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            {leftFields.map(renderTextField)}
            {renderTextField({ name: "invitedBy" })}
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
            borderRadius: 2, borderColor: cancelBorder, color: cancelText,
            textTransform: "uppercase", fontWeight: "bold",
            "&:hover": { borderColor: cancelBorder, backgroundColor: cancelBgHover },
            minWidth: 120, px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveClick}
          disabled={!isFormValid()}
          sx={{
            backgroundColor: isFormValid() ? btnBg : "#999", color: "#fff",
            textTransform: "none", borderRadius: 2, minWidth: 140, px: 3, boxShadow: 3,
            "&:hover": { backgroundColor: isFormValid() ? btnHover : "#999" },
          }}
        >
          Save Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
