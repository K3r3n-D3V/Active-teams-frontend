import { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  TextField,
  Checkbox,
  Chip,
  Card,
  CardContent,
  FormControlLabel,
  Box,
  MenuItem,
  InputAdornment,
  Typography,
  useTheme,
  IconButton,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Popper } from "@mui/material";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useOrgConfig } from "../contexts/OrgConfigContext";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const GEOAPIFY_COUNTRY_CODE = (import.meta.env.VITE_GEOAPIFY_COUNTRY_CODE || "za").toLowerCase();

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SameWidthPopper = (props) => {
  const { anchorEl } = props;
  const width =
    anchorEl && typeof anchorEl.getBoundingClientRect === "function"
      ? anchorEl.getBoundingClientRect().width
      : undefined;
  return <Popper {...props} placement="bottom-start" style={{ zIndex: 20000, width }} />;
};

let _cachedPeople = null;
let _cacheLoadedAt = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function loadPeopleCache(token) {
  const now = Date.now();
  if (_cachedPeople && _cacheLoadedAt && now - _cacheLoadedAt < CACHE_TTL_MS) {
    return _cachedPeople;
  }
  const res = await fetch(`${BACKEND_URL}/cache/people`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load people cache");
  const data = await res.json();
  const people = data.cached_data || [];
  _cachedPeople = people;
  _cacheLoadedAt = now;
  return people;
}

function searchPeopleLocally(people, query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  return people
    .filter((p) => {
      const full = `${p.Name || ""} ${p.Surname || ""}`.toLowerCase();
      return (
        full.includes(q) ||
        (p.Email || "").toLowerCase().includes(q)
      );
    })
    .slice(0, 20)
    .map((p) => ({
      id: p._id,
      fullName: `${p.Name || ""} ${p.Surname || ""}`.trim(),
      email: p.Email || p.email || "",
      leader1: p["Leader @1"] || p.leader1 || "",
      leader12: p["Leader @12"] || p.leader12 || "",
      leader144: p["Leader @144"] || p.leader144 || "",
    }));
}

const CreateEvents = ({
  user,
  isModal = false,
  onClose,
  eventTypes = [],
  selectedEventType,
  selectedEventTypeObj = null,
}) => {
  const navigate = useNavigate();
  const { id: paramEventID } = useParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { getAllHierarchyLevels } = useOrgConfig();

  const [eventId, setEventId] = useState(paramEventID || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingPeople, setIsSearchingPeople] = useState(false);
  const [cacheReady, setCacheReady] = useState(!!_cachedPeople);
  const [peopleData, setPeopleData] = useState([]);
  const [priceTiers, setPriceTiers] = useState([]);
  const [autoPopulatedFields, setAutoPopulatedFields] = useState(new Set());

  const [eventTypeFlags, setEventTypeFlags] = useState({
    isGlobal: false,
    isTicketed: false,
    hasPersonSteps: false,
  });

  const { isGlobal: isGlobalEvent, isTicketed: isTicketedEvent, hasPersonSteps } = eventTypeFlags;

  const [formData, setFormData] = useState({
    eventType: selectedEventTypeObj?.name || selectedEventType || "",
    eventName: "",
    email: "",
    date: "",
    time: "",
    timePeriod: "AM",
    recurringDays: [],
    location: "",
    eventLeader: "",
    eventLeaderEmail: "",
    description: "",
    leader1: "",
    leader12: "",
    leader144: "",
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [errors, setErrors] = useState({});
  const formAlert = useRef();
  const isSelectingFromDropdown = useRef(false);
  const searchDebounceRef = useRef(null);
  const userSelectedEventType = useRef(false);

  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [biasLonLat, setBiasLonLat] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    loadPeopleCache(token)
      .then(() => setCacheReady(true))
      .catch((err) => console.warn("People cache preload failed:", err));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setBiasLonLat({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setBiasLonLat(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const query = formData.location?.trim();
    if (!query || query.length < 2) { setLocationOptions([]); return; }
    if (!GEOAPIFY_API_KEY) { setLocationError("Missing Geoapify API key."); return; }
    const debounce = setTimeout(async () => {
      setLocationLoading(true);
      setLocationError("");
      try {
        let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:${GEOAPIFY_COUNTRY_CODE}&limit=7&apiKey=${GEOAPIFY_API_KEY}`;
        if (biasLonLat) url += `&bias=proximity:${biasLonLat.lon},${biasLonLat.lat}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Geoapify request failed");
        const data = await res.json();
        setLocationOptions(
          (data.features || []).map((f) => {
            const p = f.properties || {};
            return {
              label: p.formatted || p.address_line1 || "",
              formatted: p.formatted || "",
              suburb: p.suburb || p.district || "",
              city: p.city || p.town || p.village || "",
              state: p.state || "",
              postcode: p.postcode || "",
              lat: f.geometry?.coordinates?.[1],
              lon: f.geometry?.coordinates?.[0],
            };
          })
        );
      } catch (err) {
        setLocationError("Location search failed. Please type manually.");
        setLocationOptions([]);
      } finally {
        setLocationLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounce);
  }, [formData.location, biasLonLat]);

  useEffect(() => {
    const determineEventType = () => {
      if (selectedEventTypeObj) {
        return {
          eventType: selectedEventTypeObj.name || selectedEventTypeObj.displayName || "",
          isGlobal: !!selectedEventTypeObj.isGlobal,
          isTicketed: !!selectedEventTypeObj.isTicketed,
          hasPersonSteps: !!selectedEventTypeObj.hasPersonSteps,
        };
      }
      if (selectedEventType) {
        if (selectedEventType === "all" || selectedEventType.toUpperCase() === "ALL CELLS") {
          return { eventType: "CELLS", isGlobal: false, isTicketed: false, hasPersonSteps: true };
        }
        const foundEventType = eventTypes.find((et) => {
          const etName = et.name || et.displayName || "";
          return etName === selectedEventType || etName.toLowerCase() === selectedEventType.toLowerCase() || et._id === selectedEventType;
        });
        if (foundEventType) {
          return {
            eventType: foundEventType.name || foundEventType.displayName || selectedEventType,
            isGlobal: !!foundEventType.isGlobal,
            isTicketed: !!foundEventType.isTicketed,
            hasPersonSteps: !!foundEventType.hasPersonSteps,
          };
        }
      }
      return { eventType: "", isGlobal: false, isTicketed: false, hasPersonSteps: false };
    };
    const { eventType, isGlobal, isTicketed, hasPersonSteps: hps } = determineEventType();
    setEventTypeFlags({ isGlobal, isTicketed, hasPersonSteps: hps });
    if (!userSelectedEventType.current) {
      setFormData((prev) => ({ ...prev, eventType }));
    }
  }, [selectedEventTypeObj, selectedEventType, eventTypes, getAllHierarchyLevels]);

  useEffect(() => {
    if (isTicketedEvent && priceTiers.length === 0) {
      setPriceTiers([{ name: "", price: "", ageGroup: "", memberType: "", paymentMethod: "" }]);
    }
  }, [isTicketedEvent]);

  useEffect(() => {
    if (!eventId) return;
    const fetchEventData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`${BACKEND_URL}/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        if (data.date) {
          const dt = new Date(data.date);
          data.date = dt.toISOString().split("T")[0];
          const hours = dt.getHours();
          const minutes = dt.getMinutes();
          data.time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
          data.timePeriod = hours >= 12 ? "PM" : "AM";
        }
        if (data.recurring_day) data.recurringDays = Array.isArray(data.recurring_day) ? data.recurring_day : [];
        if (data.isTicketed !== undefined) setEventTypeFlags((prev) => ({ ...prev, isTicketed: !!data.isTicketed }));
        if (data.isTicketed) {
          setPriceTiers(data.priceTiers?.length > 0 ? data.priceTiers.map((t) => ({ ...t, price: t.price?.toString() || "" })) : [{ name: "", price: "", ageGroup: "", memberType: "", paymentMethod: "" }]);
        } else {
          setPriceTiers([]);
        }
        setFormData((prev) => ({ ...prev, ...data }));
        window.history.replaceState({}, "", window.location.pathname);
      } catch (err) {
        toast.error("Failed to load event data.");
      }
    };
    fetchEventData();
  }, [eventId]);

  const fetchPeople = useCallback(async (q) => {
    if (!q?.trim() || q.trim().length < 2) { setPeopleData([]); return; }
    setIsSearchingPeople(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) { toast.error("Please log in again"); return; }
      const people = await loadPeopleCache(token);
      const results = searchPeopleLocally(people, q);
      setPeopleData(results);
    } catch (err) {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BACKEND_URL}/people?name=${encodeURIComponent(q.split(" ")[0])}&perPage=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const raw = (await res.json()).results || [];
        const filtered = raw
          .filter((p) => `${p.Name || ""} ${p.Surname || ""}`.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 20)
          .map((p) => ({
            id: p._id,
            fullName: `${p.Name || ""} ${p.Surname || ""}`.trim(),
            email: p.Email || "",
            leader1: p["Leader @1"] || "",
            leader12: p["Leader @12"] || "",
            leader144: p["Leader @144"] || "",
          }));
        setPeopleData(filtered);
      } catch {
        setPeopleData([]);
      }
    } finally {
      setIsSearchingPeople(false);
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
      return { ...prev, [field]: value };
    });
  };

  const handleIsRecurringChange = (e) => {
    setIsRecurring(e.target.checked);
    if (!e.target.checked) handleChange("recurringDays", []);
  };

  const handleDayChange = (day) => {
    setFormData((prev) => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter((d) => d !== day)
        : [...prev.recurringDays, day],
    }));
  };

  const handleAddPriceTier = () =>
    setPriceTiers((prev) => [...prev, { name: "", price: "", ageGroup: "", memberType: "", paymentMethod: "" }]);
  const handlePriceTierChange = (index, field, value) =>
    setPriceTiers((prev) => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  const handleRemovePriceTier = (index) =>
    setPriceTiers((prev) => prev.filter((_, i) => i !== index));

  const validateForm = () => {
    const newErrors = {};
    if (!formData.eventType) newErrors.eventType = "Event type is required";
    if (!formData.eventName) newErrors.eventName = "Event name is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.eventLeader) newErrors.eventLeader = "Event leader is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (isTicketedEvent) {
      if (priceTiers.length === 0) newErrors.priceTiers = "Add at least one price tier";
      else {
        priceTiers.forEach((tier, i) => {
          if (!tier.name) newErrors[`tier_${i}_name`] = "Required";
          if (!tier.price || isNaN(Number(tier.price)) || Number(tier.price) < 0) newErrors[`tier_${i}_price`] = "Valid price required";
          if (!tier.ageGroup) newErrors[`tier_${i}_ageGroup`] = "Required";
          if (!tier.memberType) newErrors[`tier_${i}_memberType`] = "Required";
          if (!tier.paymentMethod) newErrors[`tier_${i}_paymentMethod`] = "Required";
        });
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getDayFromDate = (dateString) => {
    if (!dateString) return "";
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayNames[new Date(dateString).getDay()];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { formAlert.current?.scrollIntoView({ behavior: "smooth" }); return; }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) { toast.error("Not authenticated"); return; }
      let eventTypeToSend = selectedEventTypeObj?.name || selectedEventType || formData.eventType || "";
      if (eventTypeToSend === "all" || eventTypeToSend.toLowerCase() === "all cells") eventTypeToSend = "CELLS";
      let dayValue = "";
      if (!formData.recurringDays?.length) dayValue = formData.date ? getDayFromDate(formData.date) : "";
      else if (formData.recurringDays.length === 1) dayValue = formData.recurringDays[0];
      else dayValue = "Recurring";

      const payload = {
        UUID: generateUUID(),
        eventTypeName: formData.eventType,
        eventName: formData.eventName,
        isTicketed: !!isTicketedEvent,
        isGlobal: !!isGlobalEvent,
        hasPersonSteps: !!hasPersonSteps,
        location: formData.location,
        eventLeader: formData.eventLeader,
        eventLeaderName: formData.eventLeader,
        eventLeaderEmail: formData.eventLeaderEmail || "",
        description: formData.description,
        userEmail: user?.email || "",
        recurring_day: formData.recurringDays || [],
        day: dayValue,
        status: "open",
        leader1: formData.leader1 || "",
        leader12: formData.leader12 || "",
        leader144: formData.leader144 || "",
        isRecurring,
        recurringDays: isRecurring ? formData.recurringDays : [],
      };

      if (formData.date && formData.time) {
        const [hoursStr, minutesStr] = formData.time.split(":");
        let hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        if (formData.timePeriod === "PM" && hours !== 12) hours += 12;
        if (formData.timePeriod === "AM" && hours === 12) hours = 0;
        payload.date = `${formData.date}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
        payload.time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }

      if (isTicketedEvent && priceTiers.length > 0) {
        payload.priceTiers = priceTiers.map((t) => ({
          name: t.name || "", price: parseFloat(t.price) || 0,
          ageGroup: t.ageGroup || "", memberType: t.memberType || "", paymentMethod: t.paymentMethod || "",
        }));
      }

      const config = { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } };
      eventId
        ? await axios.put(`${BACKEND_URL}/events/${eventId}`, payload, config)
        : await axios.post(`${BACKEND_URL}/events`, payload, config);

      toast.success(eventId ? "Event updated!" : "Event created!");
      if (!eventId) {
        setFormData({ eventType: selectedEventTypeObj?.name || selectedEventType || "", eventName: "", email: "", date: "", time: "", timePeriod: "AM", recurringDays: [], location: "", eventLeader: "", eventLeaderEmail: "", description: "", leader1: "", leader12: "", leader144: "" });
        setPriceTiers([]);
        setAutoPopulatedFields(new Set());
      }
      setTimeout(() => {
        if (isModal && onClose) onClose(true);
        else navigate("/events", { state: { refresh: true, timestamp: Date.now() } });
      }, 1200);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to submit event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBg     = isDarkMode ? "#2a2a2a" : "#fff";
  const inputBorder = isDarkMode ? "#444"    : "#e0e0e0";
  const inputText   = isDarkMode ? "#fff"    : "#1a1a1a";
  const labelColor  = isDarkMode ? "#aaa"    : "#666";

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: inputBg,
      "& fieldset": { borderColor: inputBorder },
      "&:hover fieldset": { borderColor: isDarkMode ? "#666" : "#bdbdbd" },
    },
    "& .MuiInputLabel-root": { color: labelColor },
    "& .MuiInputBase-input": { color: inputText },
  };

  return (
    <Box
      sx={
        isModal
          ? { width: "100%", bgcolor: isDarkMode ? "#1e1e1e" : "#fff" }
          : {
              minHeight: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              bgcolor: isDarkMode ? "#0d0d0d" : "#f5f5f5",
              px: 2,
            }
      }
    >
      <Card
        sx={
          isModal
            ? {
                width: "100%",
                borderRadius: 0,
                boxShadow: "none",
                bgcolor: isDarkMode ? "#1e1e1e" : "#fff",
              }
            : {
                width: { xs: "100%", sm: "85%", md: "700px" },
                p: 3,
                borderRadius: "20px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                bgcolor: isDarkMode ? "#141414" : "#fff",
              }
        }
      >
        {/* Header — only show in standalone mode; Dialog already has a title */}
        {!isModal && (
          <Box sx={{ p: 3, pb: 2, borderBottom: `1px solid ${isDarkMode ? "#333" : "#e0e0e0"}` }}>
            <Typography variant="h5" fontWeight="600" sx={{ color: inputText }}>
              {eventId ? "Edit Event" : "Create New Event"}
            </Typography>
          </Box>
        )}

        <CardContent
          sx={{
            p: isModal ? 2 : 3,
            pt: 2,
            overflow: "visible",
            bgcolor: isDarkMode ? "#1e1e1e" : "#fff",
          }}
        >
          {Object.keys(errors).length > 0 && (
            <Alert ref={formAlert} severity="error" sx={{ mb: 2 }}>
              Please fill in all required fields
            </Alert>
          )}

          <form onSubmit={handleSubmit}>

            {/* Event Type */}
            <TextField
              select
              label="Event Type *"
              value={formData.eventType || ""}
              onChange={(e) => {
                const name = e.target.value;
                const obj = eventTypes.find((et) => et.name === name);
                userSelectedEventType.current = true;
                setFormData((prev) => ({ ...prev, eventType: name }));
                if (obj) setEventTypeFlags({ isGlobal: !!obj.isGlobal, isTicketed: !!obj.isTicketed, hasPersonSteps: !!obj.hasPersonSteps });
              }}
              fullWidth size="small" sx={{ mb: 2, ...fieldSx }}
              error={!!errors.eventType} helperText={errors.eventType}
              SelectProps={{ MenuProps: { PaperProps: { sx: { bgcolor: inputBg, "& .MuiMenuItem-root": { color: inputText, "&:hover": { bgcolor: isDarkMode ? "#3a3a3a" : "#f5f5f5" } } } } } }}
            >
              {eventTypes.map((et) => (
                <MenuItem key={et.id || et._id || et.name} value={et.name}>{et.name}</MenuItem>
              ))}
            </TextField>

            {/* Event Name */}
            <TextField
              label="Event Name *" value={formData.eventName}
              onChange={(e) => handleChange("eventName", e.target.value)}
              fullWidth size="small" sx={{ mb: 2, ...fieldSx }}
              error={!!errors.eventName} helperText={errors.eventName}
            />

            {/* Price Tiers */}
            {isTicketedEvent && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ color: inputText }}>Price Tiers *</Typography>
                  <Button startIcon={<AddIcon />} onClick={handleAddPriceTier} variant="contained" size="small" sx={{ textTransform: "none" }}>Add Price Tier</Button>
                </Box>
                {errors.priceTiers && <Typography variant="caption" sx={{ color: "#d32f2f", display: "block", mb: 1 }}>{errors.priceTiers}</Typography>}
                {priceTiers.map((tier, index) => (
                  <Card key={index} sx={{ mb: 1.5, p: 2, bgcolor: isDarkMode ? "#2a2a2a" : "#fafafa", border: isDarkMode ? "1px solid #444" : "none" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight="600" sx={{ color: inputText }}>Price Tier {index + 1}</Typography>
                      {priceTiers.length > 1 && <IconButton size="small" onClick={() => handleRemovePriceTier(index)} color="error"><DeleteIcon fontSize="small" /></IconButton>}
                    </Box>
                    {[["name","Price Name"],["price","Price (R)"],["ageGroup","Age Group"],["memberType","Member Type"],["paymentMethod","Payment Method"]].map(([field, label]) => (
                      <TextField key={field} label={`${label} *`} value={tier[field]} type={field === "price" ? "number" : "text"}
                        onChange={(e) => handlePriceTierChange(index, field, e.target.value)}
                        fullWidth size="small" inputProps={field === "price" ? { min: 0, step: "0.01" } : {}}
                        sx={{ mb: field === "paymentMethod" ? 0 : 1.5, ...fieldSx }}
                        error={!!errors[`tier_${index}_${field}`]} helperText={errors[`tier_${index}_${field}`]}
                      />
                    ))}
                  </Card>
                ))}
              </Box>
            )}

            {/* Date & Time */}
            <Box display="flex" gap={2} sx={{ mb: 2 }}>
              <TextField label="Date *" type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)}
                fullWidth size="small" InputLabelProps={{ shrink: true }} sx={fieldSx}
                error={!!errors.date} helperText={errors.date}
              />
              <TextField label="Time *" type="time" value={formData.time} onChange={(e) => handleChange("time", e.target.value)}
                fullWidth size="small" InputLabelProps={{ shrink: true }} sx={fieldSx}
                error={!!errors.time} helperText={errors.time}
              />
            </Box>

            {/* Recurring */}
            <Box sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography fontWeight="500" sx={{ color: inputText, fontSize: "0.875rem" }}>Is Recurring?</Typography>
                <FormControlLabel
                  control={<Checkbox size="small" checked={isRecurring} onChange={handleIsRecurringChange} sx={{ color: isDarkMode ? "#aaa" : "#666", "&.Mui-checked": { color: isDarkMode ? "#90caf9" : "#1976d2" } }} />}
                  label="Yes" sx={{ mb: 0 }}
                />
              </Box>
              {isRecurring && (
                <>
                  <Typography fontWeight="500" sx={{ color: inputText, fontSize: "0.875rem", mb: 1 }}>Recurring Days</Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {days.map((day) => (
                      <FormControlLabel key={day} sx={{ mr: 1, mb: 0.5 }}
                        control={<Checkbox size="small" checked={formData.recurringDays.includes(day)} onChange={() => handleDayChange(day)} sx={{ color: isDarkMode ? "#aaa" : "#666", "&.Mui-checked": { color: isDarkMode ? "#90caf9" : "#1976d2" } }} />}
                        label={<Typography variant="body2" sx={{ color: inputText }}>{day}</Typography>}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>

            {/* Location */}
            <Autocomplete
              freeSolo fullWidth options={locationOptions} value={selectedLocation}
              inputValue={formData.location}
              onInputChange={(_, v) => { handleChange("location", v); setSelectedLocation(null); }}
              onChange={(_, v) => {
                const fmt = typeof v === "string" ? v : v?.formatted || v?.label || "";
                setSelectedLocation(typeof v === "string" ? null : v);
                handleChange("location", fmt);
              }}
              getOptionLabel={(o) => typeof o === "string" ? o : o.label || ""}
              filterOptions={(x) => x}
              loading={locationLoading}
              PopperComponent={SameWidthPopper}
              renderInput={(params) => (
                <TextField {...params} label="Location *" fullWidth size="small" sx={{ mb: 2, ...fieldSx }}
                  error={!!errors.location} helperText={errors.location || locationError || "Start typing a South African location..."}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: labelColor }} /></InputAdornment>,
                    endAdornment: <>{locationLoading ? <CircularProgress color="inherit" size={18} /> : null}{params.InputProps.endAdornment}</>,
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={`${option.lon}-${option.lat}-${option.label}`}>
                  <Box>
                    <Typography variant="body2" sx={{ color: inputText }}>{option.label}</Typography>
                    {(option.suburb || option.city) && (
                      <Typography variant="caption" sx={{ color: labelColor }}>{[option.suburb, option.city, option.state, option.postcode].filter(Boolean).join(" • ")}</Typography>
                    )}
                  </Box>
                </li>
              )}
            />

            {/* ── Event Leader — custom dropdown, NOT clipped ─────────────── */}
            {/* The wrapper must NOT have overflow:hidden */}
            <Box sx={{ mb: 2, position: "relative" }}>
              <TextField
                label="Event Leader *"
                value={formData.eventLeader}
                onChange={(e) => {
                  const value = e.target.value;
                  handleChange("eventLeader", value);
                  handleChange("eventLeaderEmail", "");
                  setPeopleData([]);
                  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                  if (value.trim().length >= 2) {
                    searchDebounceRef.current = setTimeout(() => fetchPeople(value), 200);
                  }
                }}
                onFocus={() => { if (formData.eventLeader.length >= 2) fetchPeople(formData.eventLeader); }}
                onBlur={() => {
                  if (!isSelectingFromDropdown.current) {
                    setTimeout(() => { if (!isSelectingFromDropdown.current) setPeopleData([]); }, 200);
                  }
                }}
                fullWidth size="small" sx={fieldSx}
                error={!!errors.eventLeader}
                helperText={
                  errors.eventLeader ||
                  (isSearchingPeople
                    ? "Searching..."
                    : cacheReady
                    ? "Type to search (instant)"
                    : "Loading people list...")
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: labelColor }} />
                    </InputAdornment>
                  ),
                  endAdornment: isSearchingPeople ? <CircularProgress size={16} /> : null,
                }}
                placeholder="Type name to search..."
                autoComplete="off"
              />

              {/* ↓ Dropdown rendered with fixed positioning so it escapes all overflow */}
              {peopleData.length > 0 && (
                <PeopleDropdown
                  people={peopleData}
                  isDarkMode={isDarkMode}
                  onSelect={(person) => {
                    if (hasPersonSteps && !isGlobalEvent) {
                      setFormData((prev) => ({
                        ...prev,
                        eventLeader: person.fullName,
                        eventLeaderEmail: person.email.toLowerCase(),
                        leader1: person.leader1 || "",
                        leader12: person.leader12 || "",
                      }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        eventLeader: person.fullName,
                        eventLeaderEmail: person.email.toLowerCase(),
                      }));
                    }
                    setPeopleData([]);
                  }}
                  onMouseDown={() => { isSelectingFromDropdown.current = true; }}
                  onMouseUp={() => { isSelectingFromDropdown.current = false; }}
                />
              )}
            </Box>

            {/* Person Steps Fields */}
            {hasPersonSteps && !isGlobalEvent && (
              <>
                <TextField label="Email *" value={formData.email || ""} onChange={(e) => handleChange("email", e.target.value)}
                  fullWidth size="small" sx={{ mb: 2, ...fieldSx }} error={!!errors.email} helperText={errors.email || "Enter the email for this event"}
                />
                <TextField label="Leader @1 *" value={formData.leader1 || ""} onChange={(e) => handleChange("leader1", e.target.value)}
                  fullWidth size="small" sx={{ mb: 2, ...fieldSx }} error={!!errors.leader1} helperText={errors.leader1}
                />
                <TextField label="Leader @12 *" value={formData.leader12 || ""} onChange={(e) => handleChange("leader12", e.target.value)}
                  fullWidth size="small" sx={{ mb: 2, ...fieldSx }} error={!!errors.leader12} helperText={errors.leader12}
                />
              </>
            )}

            {/* Chips */}
            <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {isTicketedEvent && <Chip label="Ticketed Event" color="warning" size="small" />}
              {hasPersonSteps && !isGlobalEvent && <Chip label="Personal Steps Event" color="secondary" size="small" />}
            </Box>

            {/* Description */}
            <TextField
              label="Description *" value={formData.description} onChange={(e) => handleChange("description", e.target.value)}
              fullWidth multiline rows={3} size="small" sx={{ mb: 3, ...fieldSx }}
              error={!!errors.description} helperText={errors.description}
              InputProps={{ startAdornment: <InputAdornment position="start"><DescriptionIcon sx={{ color: labelColor }} /></InputAdornment> }}
            />

            {/* Buttons */}
            <Box display="flex" gap={2}>
              <Button variant="outlined" fullWidth
                onClick={() => { if (isModal && typeof onClose === "function") onClose(); else navigate("/events"); }}
                sx={{ textTransform: "none", py: 1, borderColor: isDarkMode ? "#555" : "#ccc", color: isDarkMode ? "#fff" : "#666" }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}
                sx={{ textTransform: "none", py: 1 }}
              >
                {isSubmitting ? (eventId ? "Updating..." : "Creating...") : eventId ? "Update Event" : "Create Event"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

import { createPortal } from "react-dom";

function PeopleDropdown({ people, isDarkMode, onSelect, onMouseDown, onMouseUp }) {
  const anchorRef = useRef(null);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setRect(r);
    }
  }, [people]);

  const inputBg = isDarkMode ? "#2a2a2a" : "#fff";
  const inputText = isDarkMode ? "#fff" : "#1a1a1a";

  return (
    <>
      {/* Invisible sentinel to measure position */}
      <Box ref={anchorRef} sx={{ position: "absolute", top: "100%", left: 0, right: 0, height: 0 }} />

      {rect &&
        createPortal(
          <Box
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            sx={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              zIndex: 99999,
              backgroundColor: inputBg,
              border: `1px solid ${isDarkMode ? "#444" : "#e0e0e0"}`,
              borderRadius: "4px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {people.map((person) => (
              <Box
                key={person.id || person.fullName}
                onClick={() => onSelect(person)}
                sx={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: `1px solid ${isDarkMode ? "#333" : "#f0f0f0"}`,
                  "&:hover": { backgroundColor: isDarkMode ? "#3a3a3a" : "#f5f5f5" },
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Typography variant="body2" fontWeight="500" sx={{ color: inputText }}>
                  {person.fullName}
                </Typography>
                <Typography variant="caption" sx={{ color: isDarkMode ? "#aaa" : "#666" }}>
                  {person.email}
                  {person.leader1 && ` • L@1: ${person.leader1}`}
                  {person.leader12 && ` • L@12: ${person.leader12}`}
                </Typography>
              </Box>
            ))}
          </Box>,
          document.body
        )}
    </>
  );
}

export default CreateEvents;