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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

const initialFormState = {
  name: "",
  surname: "",
  dob: "",
  address: "",
  email: "",
  number: "",
  gender: "",
  invitedBy: "",
  leader12: "",
  leader144: "",
  leader1728: "",
  stage: "Win",  // <-- add this
};

export default function AddPersonDialog({ open, onClose, onSave, formData, setFormData, isEdit = false, personId = null }) {
  const theme = useTheme();
  const [peopleList, setPeopleList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputBg = theme.palette.mode === "dark" ? "#424242" : "#fff";
  const inputLabel = theme.palette.text.secondary;
  const inputText = theme.palette.text.primary;
  const btnBg = theme.palette.mode === "dark" ? "#000" : theme.palette.primary.main;
  const btnHover = theme.palette.mode === "dark" ? "#222" : theme.palette.primary.dark;
  const cancelBorder = theme.palette.mode === "dark" ? "#666" : "#ccc";
  const cancelBgHover = theme.palette.mode === "dark" ? "#333" : "#f5f5f5";
  const cancelText = theme.palette.mode === "dark" ? "#fff" : "#333";

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const fetchAllPeople = async () => {
      const allPeople = [];
      let page = 1;
      const perPage = 1000;
      let moreData = true;

      try {
        while (moreData) {
          const response = await axios.get(`${BASE_URL}/people?page=${page}&perPage=${perPage}`);
          const results = response.data?.results || [];

          allPeople.push(...results);

          if (results.length < perPage) {
            moreData = false;
          } else {
            page += 1;
          }
        }
        setPeopleList(allPeople);
        console.log("Total people fetched:", allPeople.length);
      } catch (err) {
        console.error("Failed to fetch people:", err);
        setPeopleList([]);
      }
    };

    fetchAllPeople();
  }, [open]);

  const leftFields = [
    { name: "name", label: "Name", icon: <PersonIcon fontSize="small" sx={{ color: inputText }} />, required: true },
    { name: "surname", label: "Surname", icon: <PersonIcon fontSize="small" sx={{ color: inputText }} />, required: true },
    { name: "dob", label: "Date of Birth", icon: <CalendarIcon fontSize="small" sx={{ color: inputText }} />, required: true, type: "date" },
  ];

  const rightFields = [
    { name: "address", label: "Home Address", icon: <HomeIcon fontSize="small" sx={{ color: inputText }} />, required: true },
    { name: "email", label: "Email Address", icon: <EmailIcon fontSize="small" sx={{ color: inputText }} />, required: true, type: "email" },
    { name: "number", label: "Phone Number", icon: <PhoneIcon fontSize="small" sx={{ color: inputText }} />, required: true },
    { name: "gender", label: "Gender", icon: <GenderIcon fontSize="small" sx={{ color: inputText }} />, select: true, options: ["Male", "Female"], required: true },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleInvitedByChange = (value) => {
    if (!value) {
      setFormData(prev => ({
        ...prev,
        invitedBy: "",
        leader12: "",
        leader144: "",
        leader1728: ""
      }));
      return;
    }

    const label = typeof value === "string" ? value : value.label;
    const person = peopleList.find(
      p => `${p.Name} ${p.Surname}`.trim() === label.trim()
    );

    setFormData(prev => ({
      ...prev,
      invitedBy: label,
      leader12: person?.["Leader @12"] || "",
      leader144: person?.["Leader @144"] || "",
      leader1728: person?.["Leader @1728"] || ""
    }));
  };

  const validate = () => {
    const newErrors = {};
    [...leftFields, ...rightFields].forEach(({ name, label, required }) => {
      if (required && !formData[name]?.trim()) {
        newErrors[name] = `${label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSaveClick = async () => {
  if (!validate() || isSubmitting) return;

  setIsSubmitting(true);

  try {
    // FIX: Create leaders array from individual leader fields
    const leaders = [
      formData.leader12 || "",
      formData.leader144 || "", 
      formData.leader1728 || ""
    ].filter(leader => leader.trim() !== ""); // Remove empty strings

    const payload = {
      invitedBy: formData.invitedBy,
      name: formData.name,
      surname: formData.surname,
      gender: formData.gender,
      email: formData.email,
      number: formData.number,
      dob: formData.dob,
      address: formData.address,
      leaders: leaders,  // ✅ Send as array, not individual fields
      stage: formData.stage || "Win", 
    };

    console.log("📤 Sending payload:", payload); // Debug log

    let res;

    if (isEdit && personId) {
      res = await axios.patch(`${BASE_URL}/people/${personId}`, payload);
      onSave({ ...payload, _id: personId });
    } else {
      res = await axios.post(`${BASE_URL}/people`, payload);
      onSave(res.data);
    }

    setFormData(initialFormState);
    onClose();
  } catch (err) {
    console.error("Failed to save person:", err);
    const msg = err.response?.data?.detail || "An error occurred";
    toast.error(`Error: ${msg}`);
  } finally {
    setIsSubmitting(false);
  }
};
  const handleClose = () => {
    if (isSubmitting) return;
    setFormData(initialFormState);
    onClose();
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

  const renderLeaderAutocomplete = (name, label) => {
    const peopleOptions = peopleList.map(person => {
      const fullName = `${person.Name || ""} ${person.Surname || ""}`.trim();
      return { label: fullName, person };
    });
    
    return (
      <Autocomplete
        key={name}
        freeSolo
        disabled={isSubmitting}
        options={peopleOptions}
        getOptionLabel={(option) => typeof option === "string" ? option : option.label}
        value={
          peopleOptions.find(option => option.label === formData[name]) || 
          (formData[name] ? { label: formData[name] } : null)
        }
        onChange={(e, newValue) => {
          const value = newValue ? (typeof newValue === "string" ? newValue : newValue.label) : "";
          setFormData(prev => ({ ...prev, [name]: value }));
        }}
        onInputChange={(e, newInputValue, reason) => {
          if (reason === "input") {
            setFormData(prev => ({ ...prev, [name]: newInputValue }));
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            size="small"
            margin="dense"
            InputProps={{ ...params.InputProps, sx: inputStyles(false) }}
            InputLabelProps={{ sx: labelStyles }}
            sx={{ mb: 1 }}
          />
        )}
      />
    );
  };

  const renderTextField = ({ name, label, select, options, type }) => {
    if (name === "invitedBy") {
      const peopleOptions = peopleList.map(person => {
        const fullName = `${person.Name || ""} ${person.Surname || ""}`.trim();
        return { label: fullName, person };
      });

      return (
        <Autocomplete
          key={name}
          freeSolo
          disabled={isSubmitting}
          options={peopleOptions}
          getOptionLabel={(option) => typeof option === "string" ? option : option.label}
          value={
            peopleOptions.find(option => option.label === formData[name]) || 
            (formData[name] ? { label: formData[name] } : null)
          }
          onChange={(e, newValue) => {
            handleInvitedByChange(newValue);
          }}
          onInputChange={(e, newInputValue, reason) => {
            if (reason === "input") {
              setFormData(prev => ({ ...prev, [name]: newInputValue }));
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label || "Invited By"}
              size="small"
              margin="dense"
              error={!!errors[name]}
              helperText={errors[name]}
              InputProps={{ ...params.InputProps, sx: inputStyles(!!errors[name]) }}
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
        disabled={isSubmitting}
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
    return val !== undefined && val !== null && val.toString().trim() !== "";
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isSubmitting}
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: 5, backgroundColor: theme.palette.background.paper } }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight={600} color={inputText}>
          {isEdit ? "Update Person" : "Add New Person"}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            {leftFields.map(renderTextField)}
            {renderTextField({ name: "invitedBy", label: "Invited By" })}
          </Grid>
          <Grid item xs={12} sm={6}>
            {rightFields.map(renderTextField)}
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: inputLabel, fontWeight: 600 }}>
              Additional Leaders (Optional)
            </Typography>
            {renderLeaderAutocomplete("leader12", "Leader @12")}
            {renderLeaderAutocomplete("leader144", "Leader @144")}
            {renderLeaderAutocomplete("leader1728", "Leader @1728")}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            borderRadius: 2, borderColor: cancelBorder, color: cancelText,
            textTransform: "uppercase", fontWeight: "bold",
            "&:hover": { borderColor: cancelBorder, backgroundColor: cancelBgHover },
            minWidth: 120, px: 3,
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveClick}
          disabled={!isFormValid() || isSubmitting}
          sx={{
            backgroundColor: (isFormValid() && !isSubmitting) ? btnBg : "#999",
            color: "#fff",
            textTransform: "none", borderRadius: 2, minWidth: 140, px: 3, boxShadow: 3,
            "&:hover": {
              backgroundColor: (isFormValid() && !isSubmitting) ? btnHover : "#999"
            },
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Saving..." : "Save Details"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}