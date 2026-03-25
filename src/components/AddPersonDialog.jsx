import React, { useEffect, useState, useCallback, useMemo, useContext } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, useTheme, MenuItem, Autocomplete,
  Box, Alert, Collapse
} from "@mui/material";
import { Groups as LeaderIcon } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../contexts/AuthContext";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

const initialFormState = {
  name: "",
  surname: "",
  dob: "",
  address: "",
  email: "",
  number: "",
  gender: "",
  invitedBy: "",
  stage: "Win",
  leader1: "",
  leader12: "",
  leader144: "",
};

const uniformInputSx = {
  "& .MuiOutlinedInput-root": { height: "50px", borderRadius: "15px" },
  "& .MuiOutlinedInput-input": { fontSize: "0.95rem", padding: "10px 10px" },
  "& .MuiInputLabel-root": { fontSize: "0.95rem" },
  "& .MuiSelect-select": { fontSize: "0.95rem", padding: "10px 10px" },
};

const capitaliseWords = (str) =>
  str.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : "")).join(" ");

const digitsOnly = (str) => str.replace(/[^\d+]/g, "");

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

function resolveLeaderFields(raw) {
  const result = {};
  
  // First check if leaders array exists
  if (Array.isArray(raw?.leaders) && raw.leaders.length > 0) {
    for (const l of raw.leaders) {
      if (l?.level != null && l?.name) {
        result[`leader${l.level}`] = l.name;
      }
    }
    if (Object.keys(result).length > 0) return result;
  }
  
  // Check for flat leader fields
  for (const key of Object.keys(raw || {})) {
    if (/^leader\d+$/.test(key) && raw[key]) {
      result[key] = raw[key];
    }
    if (/^Leader @(\d+)$/.test(key) && raw[key]) {
      const level = key.match(/^Leader @(\d+)$/)[1];
      result[`leader${level}`] = raw[key];
    }
  }
  
  return result;
}

function buildLeaderPath(inviterPerson) {
  if (!inviterPerson?._id) return [];
  const inviterPath = Array.isArray(inviterPerson.LeaderPath)
    ? inviterPerson.LeaderPath
    : [];
  return [...inviterPath, inviterPerson._id];
}

export default function AddPersonDialog({
  open,
  onClose,
  onSave,
  formData,
  setFormData,
  isEdit = false,
  personId = null,
  currentEventId,
  preloadedPeople = []
}) {
  const theme = useTheme();
  const { authFetch } = useContext(AuthContext);

  const [peopleList, setPeopleList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [searchInputs, setSearchInputs] = useState({ invitedBy: "" });
  const [showLeaderFields, setShowLeaderFields] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [selectedInviter, setSelectedInviter] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const debouncedAddressInput = useDebounce(searchInputs.address || "", 500);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setErrors({});
      setSearchInputs({ invitedBy: "" });
      setShowLeaderFields(false);
      setOriginalFormData(null);
      setSelectedInviter(null);
      setIsInitializing(false);
    }
  }, [open]);

const fetchFullPerson = useCallback(async (id) => {
  if (!id || !isEdit) return null;
  try {
    console.log('🔍 Fetching person with ID:', id);
    const response = await authFetch(`${BASE_URL}/people/${id}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fetched person data - FULL:', JSON.stringify(data, null, 2));
      console.log('📅 Date fields in fetched data:', {
        Birthday: data.Birthday,
        birthday: data.birthday,
        dob: data.dob,
        dateOfBirth: data.dateOfBirth,
        'Date Created': data['Date Created'],
        DateCreated: data.DateCreated
      });
      console.log('👥 Leader fields in fetched data:', {
        InvitedBy: data.InvitedBy,
        invitedBy: data.invitedBy,
        leaders: data.leaders,
        leader1: data.leader1,
        leader12: data.leader12,
        leader144: data.leader144,
        'Leader @1': data['Leader @1'],
        'Leader @12': data['Leader @12'],
        'Leader @144': data['Leader @144']
      });
      return data;
    } else {
      console.error('❌ Failed to fetch person:', response.status);
      return null;
    }
  } catch (err) {
    console.error("❌ Full fetch error:", err);
    return null;
  }
}, [authFetch, isEdit]);

// Load person data when editing
useEffect(() => {
  if (open && isEdit && personId && !isInitializing) {
    setIsInitializing(true);
    (async () => {
      try {
        const fullPerson = await fetchFullPerson(personId);
        let initData;
        
        if (fullPerson) {
          // Handle date conversion - convert from dd/mm/yyyy to yyyy-mm-dd
          let dobValue = "";
          const birthday = fullPerson.Birthday || fullPerson.birthday || "";
          if (birthday) {
            // Check if it's already in yyyy-mm-dd format
            if (birthday.match(/^\d{4}-\d{2}-\d{2}/)) {
              dobValue = birthday;
            } 
            // Check if it's in dd/mm/yyyy format
            else if (birthday.match(/^\d{2}\/\d{2}\/\d{4}/)) {
              const parts = birthday.split('/');
              if (parts.length === 3) {
                dobValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }
            // If it's just the date string without slashes
            else if (birthday.length >= 10) {
              dobValue = birthday;
            }
          }
          
          console.log('📅 Date conversion:', {
            original: birthday,
            converted: dobValue
          });
          
          // Get leaders from the response
          const resolvedLeaders = resolveLeaderFields(fullPerson);
          
          // Also check for direct leader fields
          const directLeaderFields = {};
          Object.keys(fullPerson).forEach(key => {
            if (key.startsWith('leader') || key.startsWith('Leader @')) {
              directLeaderFields[key] = fullPerson[key];
            }
          });
          
          // Build the initial data
          initData = {
            name: fullPerson.Name || fullPerson.name || "",
            surname: fullPerson.Surname || fullPerson.surname || "",
            dob: dobValue,  // Use the converted date
            address: fullPerson.Address || fullPerson.address || "",
            email: fullPerson.Email || fullPerson.email || "",
            number: fullPerson.Number || fullPerson.number || fullPerson.phone || "",
            gender: fullPerson.Gender || fullPerson.gender || "",
            invitedBy: fullPerson.InvitedBy || fullPerson.invitedBy || "",
            ...resolvedLeaders,
            ...directLeaderFields,
            stage: fullPerson.Stage || fullPerson.stage || "Win",
          };
          
          console.log('📝 Initialized form data:', {
            invitedBy: initData.invitedBy,
            dob: initData.dob,
            leader1: initData.leader1,
            leader12: initData.leader12,
            leader144: initData.leader144,
            hasLeaders: Object.keys(resolvedLeaders).length > 0
          });
          
        } else {
          initData = { ...initialFormState };
        }
        
        const hasLeaders = Object.keys(resolveLeaderFields(initData)).length > 0;
        setShowLeaderFields(hasLeaders);
        setFormData(initData);
        setOriginalFormData(initData);
      } catch (error) {
        console.error('Error loading person data:', error);
        toast.error('Failed to load person data');
      } finally {
        setIsInitializing(false);
      }
    })();
  }
}, [open, isEdit, personId, fetchFullPerson, setFormData]);

  // Load people list
  useEffect(() => {
    if (!open) return;

    if (preloadedPeople && preloadedPeople.length > 0) {
      const converted = preloadedPeople.map(p => {
        const { leader1, leader12, leader144 } = resolveLeaderFields(p);
        return {
          _id: p._id,
          Name: p.name || p.Name || "",
          Surname: p.surname || p.Surname || "",
          Email: p.email || p.Email || "",
          Number: p.number || p.phone || p.Number || "",
          Gender: p.gender || p.Gender || "",
          Address: p.address || p.Address || "",
          Birthday: p.birthday || p.Birthday || "",
          InvitedBy: p.invitedBy || p.InvitedBy || "",
          leaders: Array.isArray(p.leaders) ? p.leaders : [],
          LeaderPath: Array.isArray(p.leaderPath) ? p.leaderPath : Array.isArray(p.LeaderPath) ? p.LeaderPath : [],
          LeaderId: p.leaderId || p.LeaderId || null,
          Stage: p.stage || p.Stage || "",
          FullName: p.fullName || `${p.name || p.Name || ''} ${p.surname || p.Surname || ''}`.trim(),
          "Leader @1": leader1,
          "Leader @12": leader12,
          "Leader @144": leader144,
        };
      });
      setPeopleList(converted);
      setIsLoadingPeople(false);
      return;
    }

    (async () => {
      setIsLoadingPeople(true);
      try {
        const response = await authFetch(`${BASE_URL}/cache/people`);
        if (response.ok) {
          const data = await response.json();
          setPeopleList(data.cached_data || []);
        } else {
          const r2 = await authFetch(`${BASE_URL}/people/simple?per_page=1000`);
          if (r2.ok) {
            const d2 = await r2.json();
            setPeopleList(d2.results || []);
          }
        }
      } catch (error) {
        console.error('Error loading people:', error);
        setPeopleList([]);
      } finally {
        setIsLoadingPeople(false);
      }
    })();
  }, [open, preloadedPeople, authFetch]);

  // Find and set the inviter when invitedBy is set
  useEffect(() => {
    if (!open || !formData.invitedBy || peopleList.length === 0 || selectedInviter) return;
    
    const inviterName = formData.invitedBy.trim();
    console.log('🔍 Looking for inviter:', inviterName);
    
    const foundInviter = peopleList.find(person => {
      const fullName = `${person.Name || person.name || ''} ${person.Surname || person.surname || ''}`.trim();
      const match = fullName.toLowerCase() === inviterName.toLowerCase() ||
                    (person.Name || person.name || '').toLowerCase() === inviterName.toLowerCase() ||
                    (person.Surname || person.surname || '').toLowerCase() === inviterName.toLowerCase();
      if (match) {
        console.log('✅ Found inviter:', fullName);
      }
      return match;
    });
    
    if (foundInviter) {
      setSelectedInviter(foundInviter);
      
      // Only set leader fields if they're not already populated
      if (!formData.leader1 && !formData.leader12 && !formData.leader144) {
        const inviterFullName = `${foundInviter.Name || foundInviter.name || ''} ${foundInviter.Surname || foundInviter.surname || ''}`.trim();
        const inviterLeaders = resolveLeaderFields(foundInviter);
        
        setFormData(prev => ({
          ...prev,
          leader1: inviterLeaders.leader1 || inviterFullName,
          leader12: inviterLeaders.leader12 || (inviterLeaders.leader1 ? inviterFullName : ''),
          leader144: inviterLeaders.leader144 || (inviterLeaders.leader12 ? inviterFullName : '')
        }));
        setShowLeaderFields(true);
      }
    }
  }, [open, formData.invitedBy, peopleList, selectedInviter, setFormData]);

  const peopleOptions = useMemo(
    () =>
      peopleList.map((person) => {
        const firstName = person.Name || person.name || "";
        const lastName = person.Surname || person.surname || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const email = person.Email || person.email || "";
        const { leader1, leader12, leader144 } = resolveLeaderFields(person);
        return {
          label: fullName,
          person,
          FullName: person.FullName || fullName,
          Email: email,
          leader1, leader12, leader144,
          searchText: `${firstName} ${lastName} ${email}`.toLowerCase(),
        };
      }),
    [peopleList]
  );

  useEffect(() => {
    if (!debouncedAddressInput || debouncedAddressInput.length < 3) {
      setAddressSuggestions([]); return;
    }
    if (!GEOAPIFY_API_KEY) { setAddressSuggestions([]); return; }
    (async () => {
      setIsLoadingAddress(true);
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(debouncedAddressInput)}&apiKey=${GEOAPIFY_API_KEY}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAddressSuggestions(
          data.features?.map(f => ({ label: f.properties.formatted, address: f.properties.formatted })) || []
        );
      } catch { setAddressSuggestions([]); }
      finally { setIsLoadingAddress(false); }
    })();
  }, [debouncedAddressInput]);

  const handleInputChange = (e) => { 
    const { name, value } = e.target; 
    setFormData(p => ({ ...p, [name]: value })); 
    setErrors(p => ({ ...p, [name]: "" })); 
  };
  
  const handleNameChange = (e) => { 
    const { name, value } = e.target; 
    setFormData(p => ({ ...p, [name]: capitaliseWords(value) })); 
    setErrors(p => ({ ...p, [name]: "" })); 
  };
  
  const handleNumberChange = (e) => { 
    setFormData(p => ({ ...p, number: digitsOnly(e.target.value) })); 
    setErrors(p => ({ ...p, number: "" })); 
  };

  const handleInvitedByChange = useCallback((value) => {
    if (!value) {
      setFormData(p => ({ ...p, invitedBy: "", leader1: "", leader12: "", leader144: "" }));
      setSelectedInviter(null);
      setShowLeaderFields(false);
      return;
    }
    
    const label = typeof value === "string" ? value : value.label;
    console.log('🔄 Invited by changed:', label);

    const option = peopleOptions.find(
      o => o.label === label.trim() || o.FullName?.trim() === label.trim()
    );

    if (!option) {
      setFormData(p => ({ ...p, invitedBy: label, leader1: "", leader12: "", leader144: "" }));
      setSelectedInviter(null);
      setShowLeaderFields(false);
      return;
    }

    setSelectedInviter(option.person);

    const inviterName = option.FullName || option.label;
    let { leader1, leader12, leader144 } = option;

    if (!leader1) leader1 = inviterName;
    else if (!leader12) leader12 = inviterName;
    else if (!leader144) leader144 = inviterName;

    setFormData(p => ({ ...p, invitedBy: label, leader1, leader12, leader144 }));
    setShowLeaderFields(!!(leader1 || leader12 || leader144));
  }, [peopleOptions]);

  const filterOptions = useCallback((options, { inputValue }) => {
    if (!inputValue) return options.slice(0, 30);
    const s = inputValue.toLowerCase();
    return options.filter(o =>
      o.searchText.includes(s) || o.label.toLowerCase().includes(s) || o.Email.toLowerCase().includes(s)
    ).slice(0, 50);
  }, []);

  const hasChanges = useMemo(() => {
    if (!isEdit || !originalFormData) return true;
    return Object.keys(originalFormData).some(k => (formData[k] || "") !== (originalFormData[k] || ""));
  }, [isEdit, formData, originalFormData]);

  const validate = () => {
    const newErrors = {};
    ["name", "surname", "dob", "address", "email", "number", "gender"].forEach(f => {
      if (!formData[f]?.trim()) newErrors[f] = "This field is required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () =>
    ["name", "surname", "dob", "address", "email", "number", "gender"].every(f => formData[f]?.toString().trim() !== "");

const handleSaveClick = async () => {
  if (!validate() || isSubmitting) return;
  setIsSubmitting(true);

  try {
    const leaderPath = selectedInviter ? buildLeaderPath(selectedInviter) : [];
    const leaderId = selectedInviter?._id || null;

    // Convert date from yyyy-mm-dd to dd/mm/yyyy for backend
    let formattedDob = "";
    if (formData.dob) {
      // If it's already in dd/mm/yyyy format
      if (formData.dob.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        formattedDob = formData.dob;
      }
      // Convert from yyyy-mm-dd to dd/mm/yyyy
      else if (formData.dob.match(/^\d{4}-\d{2}-\d{2}/)) {
        const parts = formData.dob.split('-');
        formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      // If it's some other format, try to parse it
      else {
        try {
          const date = new Date(formData.dob);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            formattedDob = `${day}/${month}/${year}`;
          } else {
            formattedDob = formData.dob;
          }
        } catch {
          formattedDob = formData.dob;
        }
      }
    }

    const payload = {
      name: formData.name,
      surname: formData.surname,
      gender: formData.gender,
      email: formData.email,
      number: formData.number,
      phone: formData.number,
      dob: formattedDob,  // Use the formatted date
      address: formData.address,
      invitedBy: formData.invitedBy || "",
      stage: formData.stage || "Win",
      leaderId: leaderId,
      leaderPath: leaderPath,
      invitedById: leaderId,
      leader1: formData.leader1 || "",
      leader12: formData.leader12 || "",
      leader144: formData.leader144 || "",
    };

    console.log('📅 Saving with date:', {
      original: formData.dob,
      formatted: formattedDob
    });

    let response;

    if (isEdit && personId) {
      response = await authFetch(`${BASE_URL}/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const resolved = resolveLeaderFields(data.person || data);
        const normalizedData = {
          _id: personId,
          name: data.person?.Name || data.Name || payload.name,
          surname: data.person?.Surname || data.Surname || payload.surname,
          email: data.person?.Email || data.Email || payload.email,
          number: data.person?.Number || data.Number || payload.number,
          phone: data.person?.Number || data.Number || payload.number,
          gender: data.person?.Gender || data.Gender || payload.gender,
          address: data.person?.Address || data.Address || payload.address,
          birthday: data.person?.Birthday || data.Birthday || payload.dob,
          invitedBy: data.person?.InvitedBy || data.InvitedBy || payload.invitedBy,
          leader1: resolved.leader1 || formData.leader1 || "",
          leader12: resolved.leader12 || formData.leader12 || "",
          leader144: resolved.leader144 || formData.leader144 || "",
          stage: data.person?.Stage || data.Stage || payload.stage || "Win",
          fullName: `${payload.name} ${payload.surname}`.trim(),
          leaders: data.person?.leaders || data.leaders || [],
          LeaderPath: data.person?.LeaderPath || data.LeaderPath || leaderPath,
          LeaderId: data.person?.LeaderId || data.LeaderId || leaderId,
        };
        onSave({ ...normalizedData, __updatedNewPerson: true });
        toast.success("Person updated successfully");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Update failed (${response.status})`);
      }

    } else {
      // Similar date formatting for new person creation
      response = await authFetch(`${BASE_URL}/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const createdPerson = data.person || data;
        const resolved = resolveLeaderFields(createdPerson);
        onSave({
          ...data,
          person: {
            ...createdPerson,
            leader1: resolved.leader1,
            leader12: resolved.leader12,
            leader144: resolved.leader144,
          },
        });
        toast.success("Person added successfully");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Save failed (${response.status})`);
      }
    }

    if (!isEdit) setFormData({ ...initialFormState });
    setSelectedInviter(null);
    onClose();
  } catch (err) {
    console.error('Save error:', err);
    toast.error(`Error: ${err.message || "An error occurred"}`);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleClose = () => {
    if (isSubmitting) return;
    if (!isEdit) setFormData({ ...initialFormState });
    setSelectedInviter(null);
    onClose();
  };

  const renderTextField = (name, label, options = {}) => {
    const { select, selectOptions, type } = options;
    const currentValue = formData[name] || "";
    let onChange = handleInputChange;
    if (name === "name" || name === "surname") onChange = handleNameChange;
    if (name === "number") onChange = handleNumberChange;

    return (
      <TextField
        margin="normal" fullWidth label={label} name={name} type={type || "text"}
        select={select} disabled={isSubmitting} value={currentValue} onChange={onChange}
        error={!!errors[name]} helperText={errors[name]}
        InputLabelProps={{ shrink: type === "date" || Boolean(currentValue) }}
        inputProps={name === "number" ? { inputMode: "tel" } : undefined}
        sx={uniformInputSx}
      >
        {select && selectOptions.map(opt => (
          <MenuItem key={opt} value={opt} sx={{ fontSize: "0.95rem" }}>{opt}</MenuItem>
        ))}
      </TextField>
    );
  };

  const renderAutocomplete = (name, label, isInvite = false) => {
    const currentValue = formData[name] || "";
    const selectedOption = peopleOptions.find(o => o.label === currentValue);
    
    return (
      <Autocomplete
        freeSolo
        disabled={isSubmitting || isLoadingPeople}
        options={peopleOptions}
        getOptionLabel={o => typeof o === "string" ? o : o.label}
        filterOptions={filterOptions}
        value={selectedOption || (currentValue ? { label: currentValue } : null)}
        onChange={(e, newValue) => {
          if (isInvite) {
            handleInvitedByChange(newValue);
          } else {
            const value = newValue ? (typeof newValue === "string" ? newValue : newValue.label) : "";
            setFormData(p => ({ ...p, [name]: value }));
          }
        }}
        onInputChange={(e, newInputValue, reason) => {
          if (reason === "input") {
            if (isInvite) {
              setSearchInputs(p => ({ ...p, invitedBy: newInputValue }));
              setFormData(p => ({ ...p, invitedBy: newInputValue }));
              if (!newInputValue) { setSelectedInviter(null); }
            } else {
              setFormData(p => ({ ...p, [name]: newInputValue }));
            }
          }
        }}
        renderInput={params => (
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
      disableEscapeKeyDown={isSubmitting}
      PaperProps={{ sx: { borderRadius: 3, m: 2, maxHeight: "90vh" } }}>

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
        {isLoadingPeople && peopleList.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">Loading people data...</Typography>
          </Alert>
        )}

        <Box>
          {renderTextField("name", "First Name *", { required: true })}
          {renderTextField("surname", "Last Name *", { required: true })}
          {renderTextField("dob", "Date of Birth *", { type: "date", required: true })}

          {/* Invited By — drives the LeaderPath */}
          {renderAutocomplete("invitedBy", "Invited By", true)}

          {/* Address autocomplete */}
          <Autocomplete
            freeSolo 
            options={addressSuggestions}
            getOptionLabel={o => typeof o === "string" ? o : o.label || o.address || ""}
            value={formData.address}
            onChange={(e, newValue) => {
              const address = typeof newValue === "string" ? newValue : newValue?.address || newValue?.label || "";
              setFormData(p => ({ ...p, address }));
              setErrors(p => ({ ...p, address: "" }));
            }}
            onInputChange={(e, newInputValue) => {
              setSearchInputs(p => ({ ...p, address: newInputValue }));
              setFormData(p => ({ ...p, address: newInputValue }));
              setErrors(p => ({ ...p, address: "" }));
            }}
            loading={isLoadingAddress} 
            loadingText="Searching addresses…"
            noOptionsText={debouncedAddressInput?.length < 3 ? "Type at least 3 characters" : "No addresses found"}
            renderInput={params => (
              <TextField {...params} label="Home Address *" error={!!errors.address}
                helperText={errors.address} margin="normal" fullWidth sx={uniformInputSx} />
            )}
            disabled={isSubmitting} 
            blurOnSelect 
            clearOnBlur={false}
          />

          {renderTextField("email", "Email Address *", { type: "email", required: true })}
          {renderTextField("number", "Phone Number *", { required: true })}
          {renderTextField("gender", "Gender *", {
            select: true, selectOptions: ["Male", "Female"], required: true,
          })}

          {/* Leader chain — display only, derived from inviter's path */}
          <Collapse in={showLeaderFields}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                Leader Chain (auto-assigned from Invited By)
              </Typography>
              <TextField
                label="Leader @1" 
                value={formData.leader1 || ""} 
                disabled 
                fullWidth
                margin="normal" 
                sx={uniformInputSx}
                helperText="Root leader — set automatically"
              />
              <TextField
                label="Leader @12" 
                value={formData.leader12 || ""} 
                disabled 
                fullWidth
                margin="normal" 
                sx={uniformInputSx}
                helperText="Auto-assigned from inviter's hierarchy"
              />
              <TextField
                label="Leader @144" 
                value={formData.leader144 || ""} 
                disabled 
                fullWidth
                margin="normal" 
                sx={uniformInputSx}
                helperText="Auto-assigned from inviter's hierarchy"
              />
            </Box>
          </Collapse>

          {!showLeaderFields && formData.invitedBy && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Button
                onClick={() => setShowLeaderFields(true)}
                startIcon={<LeaderIcon />}
                variant="outlined" 
                color="primary" 
                size="small"
              >
                View Leader Chain
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>Cancel</Button>
        <LoadingButton
          onClick={handleSaveClick} 
          variant="contained" 
          color="primary"
          loading={isSubmitting}
          disabled={!isFormValid() || (isEdit && !hasChanges)}
          sx={{ minWidth: 100 }}
        >
          {isEdit ? "Update" : "Save"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}