import { useEffect, useState, useCallback, useMemo, useContext } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, MenuItem, Autocomplete,
  Box, Alert, Collapse
} from "@mui/material";
import { Groups as LeaderIcon } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { debounce } from "lodash"; 
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../contexts/AuthContext";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

const initialFormState = {
  name: "", surname: "", dob: "", address: "", email: "",
  number: "", gender: "", invitedBy: "", leader1: "", leader12: "",
  leader144: "", stage: "Win",
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
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return dv;
};

export default function AddPersonDialog({
  open, onClose, onSave, formData, setFormData,
  isEdit = false, personId = null,
  editingPersonObject = null,
}) {
  const { authFetch } = useContext(AuthContext);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaderFields, setShowLeaderFields] = useState(false);
  
  const [searchOptions, setSearchOptions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");

  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);

  const debouncedAddressInput = useDebounce(formData.address || "", 500);

  // Search logic: Fetches the actual people matching the name from the DB
  const debouncedPeopleSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSearchOptions([]);
        return;
      }
      try {
        setLoadingSearch(true);
        const response = await authFetch(
          `${BASE_URL}/people/search?query=${encodeURIComponent(query.trim())}&limit=20`
        );
        if (response.ok) {
          const data = await response.json();
          const results = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
          setSearchOptions(results);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoadingSearch(false);
      }
    }, 350),
    [authFetch]
  );

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      setErrors({});
      setShowLeaderFields(false);
      setSearchOptions([]);
    }
  }, [open]);

  // Edit Mode Initialization
  useEffect(() => {
    if (!open || !isEdit || !editingPersonObject) return;
    const src = editingPersonObject;
    const initData = {
      name: src.name || src.Name || "",
      surname: src.surname || src.Surname || "",
      dob: (src.dob || src.birthday || src.Birthday || "").replace(/\//g, "-"),
      address: src.location || src.address || src.homeAddress || src.Address || "",
      email: src.email || src.Email || "",
      number: src.number || src.phone || src.Number || src.Phone || "",
      gender: src.gender || src.Gender || "",
      invitedBy: src.invitedBy || src.InvitedBy || "",
      leader1: src["Leader @1"] || src.leader1 || "",
      leader12: src["Leader @12"] || src.leader12 || "",
      leader144: src["Leader @144"] || src.leader144 || "",
      stage: src.stage || src.Stage || "Win",
    };
    setFormData(initData);
    setOriginalFormData(initData);
  }, [open, isEdit, editingPersonObject]);

  // Address lookup
  useEffect(() => {
    if (!debouncedAddressInput || debouncedAddressInput.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const controller = new AbortController();
    (async () => {
      setIsLoadingAddress(true);
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(debouncedAddressInput)}&apiKey=${GEOAPIFY_API_KEY}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setAddressSuggestions(data.features?.map((f) => ({ label: f.properties.formatted, address: f.properties.formatted })) || []);
      } catch { /* ignore */ }
      finally { setIsLoadingAddress(false); }
    })();
    return () => controller.abort();
  }, [debouncedAddressInput]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const required = ["name", "surname", "dob", "address", "email", "number", "gender", "leader1"];
    const errs = {};
    required.forEach((f) => { if (!formData[f]?.trim()) errs[f] = "Required"; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        dob: formData.dob ? formData.dob.replace(/-/g, "/") : "",
        leaders: [formData.leader1, formData.leader12, formData.leader144],
      };

      const method = isEdit ? "PATCH" : "POST";
      const url = isEdit ? `${BASE_URL}/people/${personId}` : `${BASE_URL}/people`;

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.person || data);
        onClose();
      } else {
        const err = await response.json();
        throw new Error(err.detail || "Save failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonOption = (props, option) => {
    const fullName = `${option.Name || option.name || ""} ${option.Surname || option.surname || ""}`.trim();
    return (
      <li {...props} key={option._id || option.id}>
        <Box>
          <Typography variant="body1">{fullName}</Typography>
          {(option.Email || option.email) && (
            <Typography variant="caption" color="text.secondary">
              {option.Email || option.email}
            </Typography>
          )}
        </Box>
      </li>
    );
  };

  // Search component for Invited By and Leaders
  const renderDynamicAutocomplete = (name, label, required = false) => {
    return (
      <Autocomplete
        freeSolo
        options={searchOptions}
        loading={loadingSearch}
        getOptionLabel={(o) => {
          if (typeof o === "string") return o;
          return `${o.Name || o.name || ""} ${o.Surname || o.surname || ""}`.trim();
        }}
        filterOptions={(x) => x} 
        value={formData[name] || ""}
        onInputChange={(_, newValue) => {
          setCurrentSearchQuery(newValue);
          setFormData(p => ({ ...p, [name]: newValue }));
          debouncedPeopleSearch(newValue);
        }}
        onChange={(_, newValue) => {
          if (newValue && typeof newValue !== "string") {
            const fullName = `${newValue.Name || newValue.name || ""} ${newValue.Surname || newValue.surname || ""}`.trim();
            // Just set the name of the actual person found
            setFormData(p => ({ ...p, [name]: fullName }));
          }
        }}
        renderOption={renderPersonOption}
        noOptionsText={currentSearchQuery.length < 2 ? "Type 2+ characters..." : "No results"}
        renderInput={(params) => (
          <TextField
            {...params} label={label} margin="normal" fullWidth required={required}
            error={!!errors[name]} helperText={errors[name]} sx={uniformInputSx}
          />
        )}
      />
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, m: 2 } }}>
      <DialogTitle>
        <Typography variant="h5">{isEdit ? "Update Person" : "Add New Person"}</Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box>
          <TextField
            margin="normal" fullWidth label="First Name *"
            value={formData.name} onChange={(e) => setFormData(p => ({...p, name: capitaliseWords(e.target.value)}))}
            error={!!errors.name} sx={uniformInputSx}
          />
          <TextField
            margin="normal" fullWidth label="Last Name *"
            value={formData.surname} onChange={(e) => setFormData(p => ({...p, surname: capitaliseWords(e.target.value)}))}
            error={!!errors.surname} sx={uniformInputSx}
          />
          <TextField
            margin="normal" fullWidth label="Date of Birth *" type="date"
            value={formData.dob} onChange={handleInputChange} name="dob"
            InputLabelProps={{ shrink: true }} error={!!errors.dob} sx={uniformInputSx}
          />

          {renderDynamicAutocomplete("invitedBy", "Invited By")}

          <Autocomplete
            freeSolo
            options={addressSuggestions}
            getOptionLabel={(o) => typeof o === "string" ? o : o.label || ""}
            value={formData.address}
            onInputChange={(_, val) => setFormData(p => ({ ...p, address: val }))}
            onChange={(_, val) => setFormData(p => ({ ...p, address: typeof val === "string" ? val : val?.address || "" }))}
            loading={isLoadingAddress}
            renderInput={(params) => (
              <TextField {...params} label="Home Address *" margin="normal" fullWidth error={!!errors.address} sx={uniformInputSx} />
            )}
          />

          <TextField
            margin="normal" fullWidth label="Email Address *" name="email" type="email"
            value={formData.email} onChange={handleInputChange} error={!!errors.email} sx={uniformInputSx}
          />
          <TextField
            margin="normal" fullWidth label="Phone Number *" name="number"
            value={formData.number} onChange={(e) => setFormData(p => ({...p, number: digitsOnly(e.target.value)}))}
            error={!!errors.number} sx={uniformInputSx}
          />
          <TextField
            select margin="normal" fullWidth label="Gender *" name="gender"
            value={formData.gender} onChange={handleInputChange} error={!!errors.gender} sx={uniformInputSx}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </TextField>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Leadership</Typography>
            {renderDynamicAutocomplete("leader1", "Leader @1 *", true)}
          </Box>

          <Collapse in={showLeaderFields}>
            <Box>
              {renderDynamicAutocomplete("leader12", "Leader @12")}
              {renderDynamicAutocomplete("leader144", "Leader @144")}
            </Box>
          </Collapse>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Button onClick={() => setShowLeaderFields(!showLeaderFields)} startIcon={<LeaderIcon />} variant="outlined">
              {showLeaderFields ? "Hide Additional Leaders" : "Add Additional Leaders"}
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <LoadingButton onClick={handleSaveClick} variant="contained" loading={isSubmitting}>
          {isEdit ? "Update" : "Save"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}