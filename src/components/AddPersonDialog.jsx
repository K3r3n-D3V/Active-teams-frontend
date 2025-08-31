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

export default function AddPersonDialog({ open, onClose, onSave, formData, setFormData, isEdit = false, personId = null }) {
  const theme = useTheme();
  const [peopleList, setPeopleList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submission

  const inputBg = theme.palette.mode === "dark" ? "#424242" : "#fff";
  const inputLabel = theme.palette.text.secondary;
  const inputText = theme.palette.text.primary;
  const btnBg = theme.palette.mode === "dark" ? "#000" : theme.palette.primary.main;
  const btnHover = theme.palette.mode === "dark" ? "#222" : theme.palette.primary.dark;
  const cancelBorder = theme.palette.mode === "dark" ? "#666" : "#ccc";
  const cancelBgHover = theme.palette.mode === "dark" ? "#333" : "#f5f5f5";
  const cancelText = theme.palette.mode === "dark" ? "#fff" : "#333";

  // Reset form and submission state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setErrors({});
    }
  }, [open]);

  // Fetch people data for "Invited By" field
  useEffect(() => {
    if (!open) return;
    const fetchPeople = async () => {
      try {
        const response = await axios.get("http://localhost:8000/people?perPage=16000");
        console.log("Fetched people for invitedBy:", response.data.results); // Debug log
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
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle invited by selection and auto-populate leader fields
  const handleInvitedByChange = (selectedPerson) => {
    if (selectedPerson) {
      // Find the full person object
      const person = peopleList.find(p => 
        `${p.Name} ${p.Surname}`.trim() === selectedPerson ||
        p.Name === selectedPerson
      );
      
      if (person) {
        setFormData((prev) => ({
          ...prev,
          invitedBy: selectedPerson,
          leader12: person["Leader @12"] || "",
          leader144: person["Leader @144"] || "",
          leader1728: person["Leader @ 1728"] || ""
        }));
      } else {
        // If not found in list, just set the invitedBy field
        setFormData((prev) => ({
          ...prev,
          invitedBy: selectedPerson,
          leader12: "",
          leader144: "",
          leader1728: ""
        }));
      }
    } else {
      // Clear all fields if nothing selected
      setFormData((prev) => ({
        ...prev,
        invitedBy: "",
        leader12: "",
        leader144: "",
        leader1728: ""
      }));
    }
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

  // const handleSaveClick = async () => {
  //   if (!validate() || isSubmitting) return;

  //   setIsSubmitting(true); // Disable button and prevent double submission

  //   try {
  //     // Send data in the format expected by your backend
  //     const payload = {
  //       name: formData.name,
  //       surname: formData.surname,
  //       dob: formData.dob,
  //       homeAddress: formData.homeAddress,
  //       email: formData.email,
  //       phone: formData.phone,
  //       gender: formData.gender,
  //       invitedBy: formData.invitedBy,
  //       leader12: formData.leader12,
  //       leader144: formData.leader144,
  //       leader1728: formData.leader1728,
  //     };

  //     console.log("Submitting payload:", payload);
  //     const res = await axios.post("http://localhost:8000/people", payload);
      
  //     console.log("Person created successfully:", res.data);
      
  //     // Call parent success handler FIRST
  //     onSave(res.data);
      
  //     // Clear the form data
  //     setFormData({
  //       name: "",
  //       surname: "",
  //       dob: "",
  //       homeAddress: "",
  //       email: "",
  //       phone: "",
  //       gender: "",
  //       invitedBy: "",
  //       leader12: "",
  //       leader144: "",
  //       leader1728: ""
  //     });
      
  //     // Close the dialog
  //     onClose();
      
  //   } catch (err) {
  //     console.error("Failed to save person:", err);
      
  //     if (err.response?.status === 400) {
  //       if (err.response?.data?.detail?.includes("email")) {
  //         alert(`Error: ${err.response.data.detail}`);
  //       } else {
  //         alert(`Error: ${err.response.data.detail || "Bad request"}`);
  //       }
  //     } else if (err.response?.status === 500) {
  //       alert("Server error occurred. Please try again.");
  //     } else {
  //       alert("Failed to save person. Please check your connection and try again.");
  //     }
  //   } finally {
  //     setIsSubmitting(false); // Re-enable the button
  //   }
  // };

const handleSaveClick = async () => {
  if (!validate() || isSubmitting) return;

  setIsSubmitting(true);

  try {
    const payload = {
      name: formData.name,
      surname: formData.surname,
      dob: formData.dob,
      homeAddress: formData.homeAddress,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender,
      invitedBy: formData.invitedBy,
      leader12: formData.leader12,
      leader144: formData.leader144,
      leader1728: formData.leader1728,
    };

    let res;

    if (isEdit && personId) {
      // PATCH for update
      res = await axios.patch(`http://localhost:8000/people/${personId}`, payload);
      console.log("Person updated successfully:", res.data);
      
      // Call onSave with updated form data + id, since backend does not return updated person
      onSave({ ...payload, _id: personId });
    } else {
      // POST for create
      res = await axios.post("http://localhost:8000/people", payload);
      console.log("Person created successfully:", res.data);

      onSave(res.data);
    }

    // Clear form
    setFormData({
      name: "",
      surname: "",
      dob: "",
      homeAddress: "",
      email: "",
      phone: "",
      gender: "",
      invitedBy: "",
      leader12: "",
      leader144: "",
      leader1728: ""
    });

    // Close dialog
    onClose();

  } catch (err) {
    console.error("Failed to save person:", err);

    if (err.response?.status === 400) {
      alert(`Error: ${err.response.data?.detail || "Bad request"}`);
    } else if (err.response?.status === 500) {
      alert("Server error occurred. Please try again.");
    } else {
      alert("Failed to save person. Please check your connection and try again.");
    }

  } finally {
    setIsSubmitting(false);
  }
};

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    onClose();
     setFormData(initialFormState);
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
      // Create options with full names for better searching
      const peopleOptions = peopleList.map(person => {
        const fullName = `${person.Name || ''} ${person.Surname || ''}`.trim();
        return {
          label: fullName || person.Name || 'Unknown',
          person: person
        };
      });

      console.log("People options for invitedBy:", peopleOptions); // Debug log

      return (
        <Autocomplete
          key={name}
          freeSolo
          disabled={isSubmitting}
          options={peopleOptions}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
          value={formData[name] || ""}
          onChange={(e, newValue) => {
            if (typeof newValue === 'object' && newValue !== null) {
              // Selected from dropdown - auto-populate leader fields
              handleInvitedByChange(newValue.label);
            } else {
              // Typed freely - just set the value
              handleInvitedByChange(newValue);
            }
          }}
          onInputChange={(e, newInputValue) => {
            setFormData((prev) => ({ ...prev, invitedBy: newInputValue }));
          }}
          filterOptions={(options, { inputValue }) => {
            if (!inputValue) return options; // Show all options when no input
            return options.filter(option =>
              option.label.toLowerCase().includes(inputValue.toLowerCase())
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Invited By"
              size="small"
              margin="dense"
              placeholder="Type to search or select from list"
              InputProps={{ ...params.InputProps, sx: inputStyles(false) }}
              InputLabelProps={{ sx: labelStyles }}
              sx={{ mb: 1 }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props}>
              <div>
                <Typography variant="body2">
                  {option.label}
                </Typography>
                {option.person["Leader @12"] && (
                  <Typography variant="caption" color="text.secondary">
                    Leader @12: {option.person["Leader @12"]}
                  </Typography>
                )}
              </div>
            </li>
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
      disableEscapeKeyDown={isSubmitting} // Prevent closing with ESC while submitting
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: 5, backgroundColor: theme.palette.background.paper } }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight={600} color={inputText}>Add New Person</Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            {leftFields.map(renderTextField)}
            {renderTextField({ name: "invitedBy" })}
          </Grid>
          <Grid item xs={12} sm={6}>
            {rightFields.map(renderTextField)}
            
            {/* Auto-populated Leader Fields - Read Only */}
            {(formData.leader12 || formData.leader144 || formData.leader1728) && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: inputLabel }}>
                  Leader Information (Auto-populated)
                </Typography>
                
                {formData.leader12 && (
                  <TextField
                    label="Leader @12"
                    value={formData.leader12}
                    fullWidth
                    size="small"
                    margin="dense"
                    disabled={isSubmitting}
                    InputProps={{ 
                      readOnly: true,
                      sx: { 
                        ...inputStyles(false), 
                        backgroundColor: theme.palette.action.hover,
                        opacity: 0.8
                      } 
                    }}
                    InputLabelProps={{ sx: labelStyles }}
                    sx={{ mb: 1 }}
                  />
                )}
                
                {formData.leader144 && (
                  <TextField
                    label="Leader @144"
                    value={formData.leader144}
                    fullWidth
                    size="small"
                    margin="dense"
                    disabled={isSubmitting}
                    InputProps={{ 
                      readOnly: true,
                      sx: { 
                        ...inputStyles(false), 
                        backgroundColor: theme.palette.action.hover,
                        opacity: 0.8
                      } 
                    }}
                    InputLabelProps={{ sx: labelStyles }}
                    sx={{ mb: 1 }}
                  />
                )}
                
                {formData.leader1728 && (
                  <TextField
                    label="Leader @1728"
                    value={formData.leader1728}
                    fullWidth
                    size="small"
                    margin="dense"
                    disabled={isSubmitting}
                    InputProps={{ 
                      readOnly: true,
                      sx: { 
                        ...inputStyles(false), 
                        backgroundColor: theme.palette.action.hover,
                        opacity: 0.8
                      } 
                    }}
                    InputLabelProps={{ sx: labelStyles }}
                    sx={{ mb: 1 }}
                  />
                )}
              </>
            )}
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