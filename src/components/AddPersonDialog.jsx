import React, { useEffect, useState, useCallback, useMemo, useContext } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, useTheme, MenuItem, Autocomplete,
  Box, Alert, Grid, Collapse
} from "@mui/material";
import {
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Wc as GenderIcon,
  GroupAdd as InviteIcon,
  Groups as LeaderIcon
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../contexts/AuthContext";

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
  leader1: "",
  leader12: "",
  leader144: "",
  stage: "Win",
};

// UNIFIED STYLES FOR ALL INPUTS - SAME SIZE
const uniformInputSx = {
  "& .MuiOutlinedInput-root": {
    height: "50px",
    borderRadius: "15px",
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "0.95rem",
    padding: "10px 10px",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.95rem",
  },
  "& .MuiSelect-select": {
    fontSize: "0.95rem",
    padding: "10px 10px",
  },
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function AddPersonDialog({ open, onClose, onSave, formData, setFormData, isEdit = false, personId = null }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { authFetch } = useContext(AuthContext);
  
  const [peopleList, setPeopleList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [searchInputs, setSearchInputs] = useState({
    invitedBy: "",
    leader1: "",
    leader12: "",
    leader144: ""
  });
  const [showLeaderFields, setShowLeaderFields] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setErrors({});
      setSearchInputs({
        invitedBy: "",
        leader1: "",
        leader12: "",
        leader144: ""
      });
      setShowLeaderFields(false);
    }
  }, [open]);

  // Initialize form with person data when opening in edit mode
  useEffect(() => {
    if (open && isEdit && formData) {
      // Check if any leader field has data to determine whether to show the section
      const hasLeaderData = formData.leader1 || formData.leader12 || formData.leader144;
      setShowLeaderFields(hasLeaderData);
      
      // Ensure all fields are properly set from formData
      const updatedFormData = {
        ...initialFormState,
        ...formData,
        // Map backend field names to form field names if needed
        name: formData.name || formData.Name || "",
        surname: formData.surname || formData.Surname || "",
        dob: formData.dob || formData.DOB || formData.dateOfBirth || "",
        address: formData.address || formData.Address || formData.homeAddress || "",
        email: formData.email || formData.Email || "",
        number: formData.number || formData.Number || formData.phone || formData.Phone || "",
        gender: formData.gender || formData.Gender || "",
        invitedBy: formData.invitedBy || formData.InvitedBy || "",
        leader1: formData.leader1 || formData["Leader @1"] || "",
        leader12: formData.leader12 || formData["Leader @12"] || "",
        leader144: formData.leader144 || formData["Leader @144"] || "",
        stage: formData.stage || formData.Stage || "Win",
      };
      
      // Only update if there are actual changes to avoid infinite loops
      if (JSON.stringify(updatedFormData) !== JSON.stringify(formData)) {
        setFormData(updatedFormData);
      }
    }
  }, [open, isEdit, formData, setFormData]);

  const peopleOptions = useMemo(() => {
    return peopleList.map(person => {
      const fullName = `${person.Name || ""} ${person.Surname || ""}`.trim();
      return { 
        label: fullName, 
        person,
        FullName: person.FullName || fullName,
        Email: person.Email || "",
        searchText: `${person.Name || ""} ${person.Surname || ""} ${person.Email || ""}`.toLowerCase()
      };
    });
  }, [peopleList]);

  useEffect(() => {
    if (!open) return;

    const fetchAllPeople = async () => {
      setIsLoadingPeople(true);
      try {
        // Use authFetch instead of axios
        const response = await authFetch(`${BASE_URL}/cache/people`);
        
        if (response.ok) {
          const data = await response.json();
          const cachedData = data.cached_data || [];
          setPeopleList(cachedData);
        } else {
          await fetchPeopleFallback();
        }
      } catch (err) {
        await fetchPeopleFallback();
      } finally {
        setIsLoadingPeople(false);
      }
    };

    const fetchPeopleFallback = async () => {
      try {
        // Use authFetch instead of axios
        const response = await authFetch(`${BASE_URL}/people/simple?per_page=1000`);
        if (response.ok) {
          const data = await response.json();
          setPeopleList(data.results || []);
        }
      } catch (fallbackErr) {
        setPeopleList([]);
      }
    };

    fetchAllPeople();
  }, [open, authFetch]);

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
        leader1: "",
        leader12: "",
        leader144: ""
      }));
      setShowLeaderFields(false);
      return;
    }

    const label = typeof value === "string" ? value : value.label;
    
    const person = peopleList.find(
      p => `${p.Name} ${p.Surname}`.trim() === label.trim() ||
           p.FullName?.trim() === label.trim()
    );

    setFormData(prev => ({
      ...prev,
      invitedBy: label,
      leader1: person?.["Leader @1"] || "",
      leader12: person?.["Leader @12"] || "",
      leader144: person?.["Leader @144"] || ""
    }));

    // Show leader fields if any leader data is populated
    const hasLeaderData = person?.["Leader @1"] || person?.["Leader @12"] || person?.["Leader @144"];
    setShowLeaderFields(hasLeaderData);
  };

  const handleSearchInputChange = (field, value) => {
    setSearchInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filterOptions = useCallback((options, { inputValue }) => {
    if (!inputValue) {
      return options.slice(0, 30);
    }
    
    const searchTerm = inputValue.toLowerCase();
    return options
      .filter(option => 
        option.searchText.includes(searchTerm) ||
        option.label.toLowerCase().includes(searchTerm) ||
        option.Email.toLowerCase().includes(searchTerm)
      )
      .slice(0, 50);
  }, []);

  const renderAutocomplete = (name, label, isInvite = false, disabled = false) => {
    const currentValue = formData[name] || "";
    
    return (
      <Autocomplete
        freeSolo
        disabled={disabled || isSubmitting || isLoadingPeople}
        options={peopleOptions}
        getOptionLabel={(option) => {
          if (typeof option === "string") return option;
          return option.label;
        }}
        filterOptions={filterOptions}
        value={
          peopleOptions.find(option => 
            option.label === currentValue
          ) || 
          (currentValue ? { label: currentValue } : null)
        }
        onChange={(e, newValue) => {
          if (isInvite) {
            handleInvitedByChange(newValue);
          } else {
            const value = newValue ? (typeof newValue === "string" ? newValue : newValue.label) : "";
            setFormData(prev => ({ ...prev, [name]: value }));
            
            // Show leader fields when any leader field gets data
            if (value && !showLeaderFields) {
              setShowLeaderFields(true);
            }
          }
        }}
        onInputChange={(e, newInputValue, reason) => {
          handleSearchInputChange(name, newInputValue);
          
          if (reason === "input") {
            setFormData(prev => ({ ...prev, [name]: newInputValue }));
            
            // Show leader fields when user starts typing in a leader field
            if (newInputValue && !showLeaderFields) {
              setShowLeaderFields(true);
            }
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={!!errors[name]}
            helperText={errors[name]}
            margin="normal"
            fullWidth
            sx={uniformInputSx}
          />
        )}
        loading={isLoadingPeople}
        loadingText="Loading people..."
        noOptionsText="No matches found"
        blurOnSelect
        clearOnBlur
        handleHomeEndKeys
      />
    );
  };

  const renderTextField = (name, label, options = {}) => {
    const { select, selectOptions, type, required, helperText } = options;
    const currentValue = formData[name] || "";

    return (
      <TextField
        margin="normal"
        fullWidth
        label={label}
        name={name}
        type={type || "text"}
        select={select}
        disabled={isSubmitting}
        value={currentValue}
        onChange={handleInputChange}
        error={!!errors[name]}
        helperText={errors[name] || helperText}
        InputLabelProps={{ 
          shrink: type === "date" || Boolean(currentValue)
        }}
        sx={uniformInputSx}
      >
        {select && selectOptions.map((opt) => (
          <MenuItem key={opt} value={opt} sx={{ fontSize: "0.95rem" }}>
            {opt}
          </MenuItem>
        ))}
      </TextField>
    );
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = [
      'name', 'surname', 'dob', 'address', 'email', 'number', 'gender'
    ];
    
    requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const leaders = [
        formData.leader1 || "",
        formData.leader12 || "",
        formData.leader144 || ""
      ].filter(leader => leader.trim() !== "");

      const payload = {
        invitedBy: formData.invitedBy,
        name: formData.name,
        surname: formData.surname,
        gender: formData.gender,
        email: formData.email,
        number: formData.number,
        dob: formData.dob,
        address: formData.address,
        leaders: leaders,
        stage: formData.stage || "Win", 
      };

      let response;

      if (isEdit && personId) {
        // Use authFetch for PATCH request
        response = await authFetch(`${BASE_URL}/people/${personId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          onSave({ ...payload, _id: personId });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Update failed");
        }
      } else {
        // Use authFetch for POST request
        response = await authFetch(`${BASE_URL}/people`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          onSave(data);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Save failed");
        }
      }

      if (!isEdit) {
        setFormData(initialFormState);
      }
      onClose();
    } catch (err) {
      const msg = err.message || "An error occurred";
      toast.error(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    if (!isEdit) {
      setFormData(initialFormState);
    }
    onClose();
  };

  const isFormValid = () => {
    const requiredFields = ['name', 'surname', 'dob', 'address', 'email', 'number', 'gender'];
    return requiredFields.every(field => {
      const val = formData[field];
      return val !== undefined && val !== null && val.toString().trim() !== "";
    });
  };

  const toggleLeaderFields = () => {
    setShowLeaderFields(!showLeaderFields);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isSubmitting}
      PaperProps={{ 
        sx: { 
          borderRadius: 3,
          m: 2,
          maxHeight: '90vh',
        } 
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div">
          {isEdit ? "Update Person" : "Add New Person"}
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrors({})}>
            Please fill in all required fields
          </Alert>
        )}

        {isLoadingPeople && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Loading people data...
            </Typography>
          </Alert>
        )}

        <Box>
          {renderTextField('name', 'First Name *', { required: true })}
          {renderTextField('surname', 'Last Name *', { required: true })}
          {renderTextField('dob', 'Date of Birth *', { 
            type: 'date', 
            required: true 
          })}
          {renderAutocomplete('invitedBy', 'Invited By', true, false)}
          {renderTextField('address', 'Home Address *', { 
            required: true 
          })}
          {renderTextField('email', 'Email Address *', { 
            type: 'email', 
            required: true 
          })}
          {renderTextField('number', 'Phone Number *', { 
            required: true 
          })}
          {renderTextField('gender', 'Gender *', { 
            select: true, 
            selectOptions: ['Male', 'Female'],
            required: true 
          })}

          {/* Leader Fields Section - Hidden by default */}
          <Collapse in={showLeaderFields}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Additional Leaders
              </Typography>
              
              {/* Only Leader @1 is editable, others are disabled */}
              {renderAutocomplete('leader1', 'Leader @1', false, true)}
              {renderAutocomplete('leader12', 'Leader @12', false, true)}
              {renderAutocomplete('leader144', 'Leader @144', false, true)}
            </Box>
          </Collapse>

          {/* Show toggle button only when leader fields are hidden and no leader data exists */}
          {!showLeaderFields && !formData.leader1 && !formData.leader12 && !formData.leader144 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                onClick={toggleLeaderFields}
                startIcon={<LeaderIcon />}
                variant="outlined"
                color="primary"
                size="small"
              >
                View Additional Leaders
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose} 
          color="inherit" 
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={handleSaveClick}
          variant="contained"
          color="primary"
          loading={isSubmitting}
          disabled={!isFormValid() || isLoadingPeople}
          sx={{ minWidth: 100 }}
        >
          {isEdit ? "Update" : "Save"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}