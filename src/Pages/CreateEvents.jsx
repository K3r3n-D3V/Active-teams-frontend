import { useState, useEffect, useRef } from "react";
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
  Paper,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Popper } from "@mui/material";
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

  // Geoapify Location Autocomplete
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [biasLonLat, setBiasLonLat] = useState(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBiasLonLat({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => setBiasLonLat(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const query = formData.location?.trim();
    if (!query || query.length < 2) {
      setLocationOptions([]);
      return;
    }

    if (!GEOAPIFY_API_KEY) {
      setLocationError("Missing Geoapify API key.");
      return;
    }

    const debounce = setTimeout(async () => {
      setLocationLoading(true);
      setLocationError("");
      try {
        let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:${GEOAPIFY_COUNTRY_CODE}&limit=7&apiKey=${GEOAPIFY_API_KEY}`;

        if (biasLonLat) {
          url += `&bias=proximity:${biasLonLat.lon},${biasLonLat.lat}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("Geoapify request failed");

        const data = await res.json();

        const options = (data.features || []).map((feature) => {
          const p = feature.properties || {};
          return {
            label: p.formatted || p.address_line1 || "",
            formatted: p.formatted || "",
            suburb: p.suburb || p.district || "",
            city: p.city || p.town || p.village || "",
            state: p.state || "",
            postcode: p.postcode || "",
            lat: feature.geometry?.coordinates?.[1],
            lon: feature.geometry?.coordinates?.[0],
          };
        });

        setLocationOptions(options);
      } catch (err) {
        console.error("Location search error:", err);
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
          return (
            etName === selectedEventType ||
            etName.toLowerCase() === selectedEventType.toLowerCase() ||
            et._id === selectedEventType
          );
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
      setFormData((prev) => ({
        ...prev,
        eventType,
        ...(prev.hasPersonSteps && !hps
          ? Object.fromEntries(getAllHierarchyLevels().map((h) => [h.field, ""]))
          : {}),
      }));
    }
  }, [selectedEventTypeObj, selectedEventType, eventTypes, getAllHierarchyLevels]);

  useEffect(() => {
    if (isTicketedEvent && priceTiers.length === 0) {
      setPriceTiers([{ name: "", price: "", ageGroup: "", memberType: "", paymentMethod: "" }]);
    }
  }, [isTicketedEvent]);

  useEffect(() => {
    const queries = new URLSearchParams(window.location.search);
    if (selectedEventTypeObj?.isTicketed === true) {
      const qEventId = queries.get("eventId");
      if (qEventId) setEventId(qEventId);
    }
  }, [selectedEventTypeObj]);

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

        if (data.recurring_day) {
          data.recurringDays = Array.isArray(data.recurring_day) ? data.recurring_day : [];
        }

        if (data.isTicketed !== undefined) {
          setEventTypeFlags((prev) => ({ ...prev, isTicketed: !!data.isTicketed }));
        }

        if (data.isTicketed) {
          setPriceTiers(
            data.priceTiers?.length > 0
              ? data.priceTiers.map((tier) => ({
                  ...tier,
                  price: tier.price?.toString() || "",
                }))
              : [{ name: "", price: "", ageGroup: "", memberType: "", paymentMethod: "" }]
          );
        } else {
          setPriceTiers([]);
        }

        setFormData((prev) => ({ ...prev, ...data }));
        window.history.replaceState({}, "", window.location.pathname);
      } catch (err) {
        console.error("Failed to fetch event:", err);
        toast.error("Failed to load event data. Please try again.");
      }
    };

    fetchEventData();
  }, [eventId]);

  // ==================== HANDLERS ====================

  const handleChange = (field, value) => {
    setFormData((prev) => {
      if (errors[field]) {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
      }
      return { ...prev, [field]: value };
    });
  };

  const handleIsRecurringChange = (e) => {
    const checked = e.target.checked;
    setIsRecurring(checked);
    if (!checked) {
      handleChange("recurringDays", []);
    }
  };

  const handleDayChange = (day) => {
    setFormData((prev) => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter((d) => d !== day)
        : [...prev.recurringDays, day],
    }));
  };

  const handleAddPriceTier = () => {
    setPriceTiers((prev) => [
      ...prev,
      { name: "", price: "", ageGroup: "", memberType: "", paymentMethod: "" },
    ]);
  };

  const handlePriceTierChange = (index, field, value) => {
    setPriceTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemovePriceTier = (index) => {
    setPriceTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchPeople = async (q) => {
    if (!q?.trim() || q.trim().length < 2) {
      setPeopleData([]);
      return;
    }

    try {
      setIsSearchingPeople(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Please log in again");
        return;
      }

      const searchWords = q.trim().split(/\s+/);
      const firstName = searchWords[0];

      let res = await fetch(
        `${BACKEND_URL}/people?name=${encodeURIComponent(firstName)}&perPage=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let people = (await res.json()).results || [];

      if (searchWords.length > 1) {
        const fullQuery = q.toLowerCase();
        people = people.filter((p) =>
          `${p.Name || ""} ${p.Surname || ""}`.toLowerCase().includes(fullQuery)
        );
      }

      if (people.length === 0) {
        res = await fetch(`${BACKEND_URL}/people?perPage=300`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fallbackData = await res.json();
        people = (fallbackData.results || []).slice(0, 20);
      }

      const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
      const userOrg = (userProfile?.org_id || "").toLowerCase();

      const formatted = people.map((p) => {
        const personOrg = (p.org_id || p.Organization || p.Organisation || "").toLowerCase();
        const isDifferentOrg = userOrg && personOrg && personOrg !== userOrg;

        return {
          id: p._id,
          fullName: `${p.Name || ""} ${p.Surname || ""}`.trim(),
          email: p.Email || p.email || "",
          leader1: p["Leader @1"] || "",
          leader12: p["Leader @12"] || "",
          leader144: p["Leader @144"] || "",
          isDifferentOrg,
          org: personOrg,
        };
      });

      setPeopleData(formatted);
    } catch (err) {
      console.error("People search error:", err);
      toast.error("Failed to search people");
      setPeopleData([]);
    } finally {
      setIsSearchingPeople(false);
    }
  };

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
      if (priceTiers.length === 0) {
        newErrors.priceTiers = "Add at least one price tier for ticketed events";
      } else {
        priceTiers.forEach((tier, index) => {
          if (!tier.name) newErrors[`tier_${index}_name`] = "Price name is required";
          if (!tier.price || isNaN(Number(tier.price)) || Number(tier.price) < 0)
            newErrors[`tier_${index}_price`] = "Valid price is required";
          if (!tier.ageGroup) newErrors[`tier_${index}_ageGroup`] = "Age group is required";
          if (!tier.memberType) newErrors[`tier_${index}_memberType`] = "Member type is required";
          if (!tier.paymentMethod)
            newErrors[`tier_${index}_paymentMethod`] = "Payment method is required";
        });
      }
    }

    if (hasPersonSteps && !isGlobalEvent) {
      getAllHierarchyLevels().forEach((h) => {
        if (!formData[h.field] && !autoPopulatedFields.has(h.field)) {
          newErrors[h.field] = `${h.label} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getDayFromDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayNames[date.getDay()];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      formAlert.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("You are not authenticated. Please log in again.");
        return;
      }

      let eventTypeToSend =
        selectedEventTypeObj?.name || selectedEventType || formData.eventType || "";
      if (eventTypeToSend === "all" || eventTypeToSend.toLowerCase() === "all cells") {
        eventTypeToSend = "CELLS";
      }

      let dayValue = "";
      if (formData.recurringDays?.length === 0) {
        dayValue = formData.date ? getDayFromDate(formData.date) : "";
      } else if (formData.recurringDays?.length === 1) {
        dayValue = formData.recurringDays[0];
      } else {
        dayValue = "Recurring";
      }

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

        payload.date = `${formData.date}T${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:00`;
        payload.time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }

      if (isTicketedEvent && priceTiers.length > 0) {
        payload.priceTiers = priceTiers.map((tier) => ({
          name: tier.name || "",
          price: parseFloat(tier.price) || 0,
          ageGroup: tier.ageGroup || "",
          memberType: tier.memberType || "",
          paymentMethod: tier.paymentMethod || "",
        }));
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const response = eventId
        ? await axios.put(`${BACKEND_URL}/events/${eventId}`, payload, config)
        : await axios.post(`${BACKEND_URL}/events`, payload, config);

      toast.success(eventId ? "Event updated successfully!" : "Event created successfully!");

      if (!eventId) {
        setFormData({
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
        setPriceTiers([]);
        setAutoPopulatedFields(new Set());
      }

      setTimeout(() => {
        if (isModal && onClose) {
          onClose(true);
        } else {
          navigate("/events", { state: { refresh: true, timestamp: Date.now() } });
        }
      }, 1200);
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err?.response?.data?.detail || err?.message || "Failed to submit event";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dark mode colour tokens – pure black scheme
  const inputBg          = isDarkMode ? "#1a1a1a" : "#fff";
  const inputBorder      = isDarkMode ? "#3a3a3a" : "#c4c4c4";
  const inputBorderHover = isDarkMode ? "#666666" : "#1976d2";
  const inputText        = isDarkMode ? "#f0f0f0" : "#1a1a1a";
  const labelColor       = isDarkMode ? "#999999" : "#666";
  const labelFocused     = isDarkMode ? "#cccccc" : "#1976d2";
  const helperColor      = isDarkMode ? "#777777" : "#666";
  const adornmentColor   = isDarkMode ? "#888888" : "#9e9e9e";

  const inputSx = {
    backgroundColor: inputBg,
    color: inputText,
    borderRadius: "8px",
    "& fieldset": { borderColor: inputBorder },
    "&:hover fieldset": { borderColor: inputBorderHover },
    "&.Mui-focused fieldset": { borderColor: isDarkMode ? "#cccccc" : "#1976d2", borderWidth: "2px" },
    "&.Mui-disabled": {
      backgroundColor: isDarkMode ? "#111111" : "#f5f5f5",
      "& fieldset": { borderColor: isDarkMode ? "#2a2a2a" : "#e0e0e0" },
    },
  };

  const darkModeStyles = {
    textField: {
      "& .MuiOutlinedInput-root": inputSx,
      "& .MuiInputLabel-root": {
        color: labelColor,
        "&.Mui-focused": { color: isDarkMode ? "#cccccc" : "#1976d2" },
        "&.Mui-error":   { color: theme.palette.error.main },
      },
      "& .MuiInputBase-input": {
        color: inputText,
        "&::placeholder": { color: isDarkMode ? "#555555" : "#aaa", opacity: 1 },
        "&:-webkit-autofill": {
          WebkitBoxShadow: `0 0 0 100px ${inputBg} inset`,
          WebkitTextFillColor: inputText,
        },
      },
      "& .MuiInputBase-inputMultiline": { color: inputText },
      "& .MuiInputAdornment-root .MuiSvgIcon-root": { color: adornmentColor },
      "& .MuiFormHelperText-root": {
        color: helperColor,
        "&.Mui-error": { color: theme.palette.error.main },
      },
      "& .MuiSelect-icon": { color: isDarkMode ? "#999999" : "inherit" },
    },
    sectionTitle: {
      color: isDarkMode ? "#f0f0f0" : "inherit",
    },
    errorText: {
      color: theme.palette.error.main,
    },
    card: {
      bgcolor: isDarkMode ? "#111111" : "#f9f9f9",
      border: isDarkMode ? "1px solid #2a2a2a" : "1px solid #e0e0e0",
    },
    autocompleteListbox: {
      bgcolor: inputBg,
      "& .MuiAutocomplete-option": {
        color: inputText,
        "&:hover, &[data-focus='true']": { backgroundColor: isDarkMode ? "#2a2a2a" : "#f0f0ff" },
        "&[aria-selected='true']": { backgroundColor: isDarkMode ? "#333333" : "#e8eaf6" },
      },
    },
    menuPaper: {
      bgcolor: inputBg,
      border: `1px solid ${inputBorder}`,
    },
    menuItem: {
      color: inputText,
      "&:hover": { bgcolor: isDarkMode ? "#2a2a2a" : "#f5f5f5" },
      "&.Mui-selected": {
        bgcolor: isDarkMode ? "#333333" : "#e8eaf6",
        "&:hover": { bgcolor: isDarkMode ? "#3a3a3a" : "#dde0f5" },
      },
    },
    checkbox: {
      color: isDarkMode ? "#888888" : undefined,
      "&.Mui-checked": { color: isDarkMode ? "#cccccc" : undefined },
    },
    button: {
      outlined: {},
      contained: {},
    },
  };

  // Compact spacing: use smaller margins in modal mode
  const mb = isModal ? 1.5 : 3;
  const mbSm = isModal ? 1 : 2;

  // Replace the return statement with this updated version:

return (
  <Box
    sx={
      isModal
        ? {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
            zIndex: 1300,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 2,
          }
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
              width: "650px",
              maxWidth: "100%",
              maxHeight: "85vh",
              borderRadius: "12px",
              boxShadow: isDarkMode 
                ? "0 4px 20px rgba(0, 0, 0, 0.3)" 
                : "0 4px 20px rgba(0, 0, 0, 0.15)",
              bgcolor: isDarkMode ? "#1e1e1e" : "#fff",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
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
      {/* Header */}
      <Box
        sx={{
          p: 3,
          pb: 2,
          borderBottom: `1px solid ${isDarkMode ? "#333" : "#e0e0e0"}`,
          bgcolor: isDarkMode ? "#1e1e1e" : "#fff",
        }}
      >
        <Typography
          variant="h5"
          fontWeight="600"
          sx={{
            color: isDarkMode ? "#ffffff" : "#1a1a1a",
            fontSize: "1.25rem",
          }}
        >
          {eventId ? "Edit Event" : "Create New Event"}
        </Typography>
      </Box>

      {/* Scrollable Content */}
      <CardContent
        sx={{
          p: 3,
          pt: 2,
          overflowY: "auto",
          flex: 1,
          bgcolor: isDarkMode ? "#1e1e1e" : "#fff",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: isDarkMode ? "#2a2a2a" : "#f1f1f1",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: isDarkMode ? "#555" : "#c1c1c1",
            borderRadius: "3px",
            "&:hover": {
              background: isDarkMode ? "#777" : "#a8a8a8",
            },
          },
        }}
      >
        {Object.keys(errors).length > 0 && (
          <Alert 
            ref={formAlert} 
            severity="error" 
            sx={{ mb: 2 }}
          >
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
              const selectedName = e.target.value;
              const selectedObj = eventTypes.find((et) => et.name === selectedName);
              userSelectedEventType.current = true;
              setFormData((prev) => ({ ...prev, eventType: selectedName }));
              if (selectedObj) {
                setEventTypeFlags({
                  isGlobal: !!selectedObj.isGlobal,
                  isTicketed: !!selectedObj.isTicketed,
                  hasPersonSteps: !!selectedObj.hasPersonSteps,
                });
              }
            }}
            fullWidth
            size="small"
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                '& fieldset': {
                  borderColor: isDarkMode ? '#444' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: isDarkMode ? '#666' : '#bdbdbd',
                },
              },
              '& .MuiInputLabel-root': {
                color: isDarkMode ? '#aaa' : '#666',
              },
              '& .MuiInputBase-input': {
                color: isDarkMode ? '#fff' : '#1a1a1a',
              },
            }}
            SelectProps={{
              MenuProps: {
                PaperProps: { 
                  sx: {
                    bgcolor: isDarkMode ? '#2a2a2a' : '#fff',
                    '& .MuiMenuItem-root': {
                      color: isDarkMode ? '#fff' : '#1a1a1a',
                      '&:hover': {
                        bgcolor: isDarkMode ? '#3a3a3a' : '#f5f5f5',
                      },
                    },
                  },
                },
              },
            }}
          >
            {eventTypes.map((et) => (
              <MenuItem key={et.id} value={et.name}>
                {et.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Event Name */}
          <TextField
            label="Event Name *"
            value={formData.eventName}
            onChange={(e) => handleChange("eventName", e.target.value)}
            fullWidth
            size="small"
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                '& fieldset': {
                  borderColor: isDarkMode ? '#444' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: isDarkMode ? '#666' : '#bdbdbd',
                },
              },
              '& .MuiInputLabel-root': {
                color: isDarkMode ? '#aaa' : '#666',
              },
              '& .MuiInputBase-input': {
                color: isDarkMode ? '#fff' : '#1a1a1a',
              },
            }}
            error={!!errors.eventName}
            helperText={errors.eventName}
          />

          {/* Price Tiers */}
          {isTicketedEvent && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography 
                  variant="subtitle1" 
                  fontWeight="600" 
                  sx={{ 
                    color: isDarkMode ? "#fff" : "#1a1a1a",
                  }}
                >
                  Price Tiers *
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddPriceTier}
                  variant="contained"
                  size="small"
                  sx={{
                    textTransform: "none",
                    bgcolor: isDarkMode ? "#1976d2" : "#1976d2",
                    "&:hover": { bgcolor: isDarkMode ? "#1565c0" : "#1565c0" },
                  }}
                >
                  Add Price Tier
                </Button>
              </Box>
              {errors.priceTiers && (
                <Typography variant="caption" sx={{ color: "#d32f2f", mb: 1, display: "block" }}>
                  {errors.priceTiers}
                </Typography>
              )}

              {priceTiers.map((tier, index) => (
                <Card 
                  key={index} 
                  sx={{ 
                    mb: 1.5, 
                    p: 2, 
                    bgcolor: isDarkMode ? '#2a2a2a' : '#fafafa',
                    border: isDarkMode ? '1px solid #444' : 'none',
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="600" 
                      sx={{ 
                        color: isDarkMode ? "#fff" : "#1a1a1a",
                      }}
                    >
                      Price Tier {index + 1}
                    </Typography>
                    {priceTiers.length > 1 && (
                      <IconButton size="small" onClick={() => handleRemovePriceTier(index)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <TextField
                    label="Price Name *"
                    value={tier.name}
                    onChange={(e) => handlePriceTierChange(index, "name", e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ 
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                        '& fieldset': {
                          borderColor: isDarkMode ? '#555' : '#e0e0e0',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? '#aaa' : '#666',
                      },
                      '& .MuiInputBase-input': {
                        color: isDarkMode ? '#fff' : '#1a1a1a',
                      },
                    }}
                    error={!!errors[`tier_${index}_name`]}
                    helperText={errors[`tier_${index}_name`]}
                  />
                  <TextField
                    label="Price (R) *"
                    type="number"
                    value={tier.price}
                    onChange={(e) => handlePriceTierChange(index, "price", e.target.value)}
                    fullWidth
                    size="small"
                    inputProps={{ min: 0, step: "0.01" }}
                    sx={{ 
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                        '& fieldset': {
                          borderColor: isDarkMode ? '#555' : '#e0e0e0',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? '#aaa' : '#666',
                      },
                      '& .MuiInputBase-input': {
                        color: isDarkMode ? '#fff' : '#1a1a1a',
                      },
                    }}
                    error={!!errors[`tier_${index}_price`]}
                    helperText={errors[`tier_${index}_price`]}
                  />
                  <TextField
                    label="Age Group *"
                    value={tier.ageGroup}
                    onChange={(e) => handlePriceTierChange(index, "ageGroup", e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ 
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                        '& fieldset': {
                          borderColor: isDarkMode ? '#555' : '#e0e0e0',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? '#aaa' : '#666',
                      },
                      '& .MuiInputBase-input': {
                        color: isDarkMode ? '#fff' : '#1a1a1a',
                      },
                    }}
                    error={!!errors[`tier_${index}_ageGroup`]}
                    helperText={errors[`tier_${index}_ageGroup`]}
                  />
                  <TextField
                    label="Member Type *"
                    value={tier.memberType}
                    onChange={(e) => handlePriceTierChange(index, "memberType", e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ 
                      mb: 1.5,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                        '& fieldset': {
                          borderColor: isDarkMode ? '#555' : '#e0e0e0',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? '#aaa' : '#666',
                      },
                      '& .MuiInputBase-input': {
                        color: isDarkMode ? '#fff' : '#1a1a1a',
                      },
                    }}
                    error={!!errors[`tier_${index}_memberType`]}
                    helperText={errors[`tier_${index}_memberType`]}
                  />
                  <TextField
                    label="Payment Method *"
                    value={tier.paymentMethod}
                    onChange={(e) => handlePriceTierChange(index, "paymentMethod", e.target.value)}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
                        '& fieldset': {
                          borderColor: isDarkMode ? '#555' : '#e0e0e0',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: isDarkMode ? '#aaa' : '#666',
                      },
                      '& .MuiInputBase-input': {
                        color: isDarkMode ? '#fff' : '#1a1a1a',
                      },
                    }}
                    error={!!errors[`tier_${index}_paymentMethod`]}
                    helperText={errors[`tier_${index}_paymentMethod`]}
                  />
                </Card>
              ))}
            </Box>
          )}

          {/* Date & Time */}
          <Box display="flex" gap={2} sx={{ mb: 2 }}>
            <TextField
              label="Date *"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                  '& fieldset': {
                    borderColor: isDarkMode ? '#444' : '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#666' : '#bdbdbd',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? '#aaa' : '#666',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : '#1a1a1a',
                },
              }}
              error={!!errors.date}
              helperText={errors.date}
            />
            <TextField
              label="Time *"
              type="time"
              value={formData.time}
              onChange={(e) => handleChange("time", e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                  '& fieldset': {
                    borderColor: isDarkMode ? '#444' : '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#666' : '#bdbdbd',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? '#aaa' : '#666',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : '#1a1a1a',
                },
              }}
              error={!!errors.time}
              helperText={errors.time}
            />
          </Box>

          {/* Recurring */}
          <Box sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Typography 
                fontWeight="500" 
                sx={{ 
                  color: isDarkMode ? "#fff" : "#1a1a1a", 
                  fontSize: "0.875rem" 
                }}
              >
                Is Recurring?
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox 
                    size="small" 
                    checked={isRecurring} 
                    onChange={handleIsRecurringChange}
                    sx={{ 
                      color: isDarkMode ? "#aaa" : "#666",
                      '&.Mui-checked': {
                        color: isDarkMode ? "#90caf9" : "#1976d2",
                      },
                    }}
                  />
                }
                label="Yes"
                sx={{ mb: 0 }}
              />
            </Box>

            {isRecurring && (
              <>
                <Typography 
                  fontWeight="500" 
                  sx={{ 
                    color: isDarkMode ? "#fff" : "#1a1a1a", 
                    fontSize: "0.875rem", 
                    mb: 1 
                  }}
                >
                  Recurring Days
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {days.map((day) => (
                    <FormControlLabel
                      key={day}
                      sx={{ mr: 1, mb: 0.5 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={formData.recurringDays.includes(day)}
                          onChange={() => handleDayChange(day)}
                          sx={{ 
                            color: isDarkMode ? "#aaa" : "#666",
                            '&.Mui-checked': {
                              color: isDarkMode ? "#90caf9" : "#1976d2",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography 
                          variant="body2" 
                          sx={{ color: isDarkMode ? "#fff" : "#1a1a1a" }}
                        >
                          {day}
                        </Typography>
                      }
                    />
                  ))}
                </Box>
                {errors.recurringDays && (
                  <Typography variant="caption" sx={{ color: "#d32f2f", display: "block", mt: 0.5 }}>
                    {errors.recurringDays}
                  </Typography>
                )}
              </>
            )}
          </Box>

          {/* Location */}
          <Autocomplete
            freeSolo
            fullWidth
            options={locationOptions}
            value={selectedLocation}
            inputValue={formData.location}
            onInputChange={(event, newInputValue) => {
              handleChange("location", newInputValue);
              setSelectedLocation(null);
            }}
            onChange={(event, newValue) => {
              const formatted =
                typeof newValue === "string"
                  ? newValue
                  : newValue?.formatted || newValue?.label || "";
              setSelectedLocation(typeof newValue === "string" ? null : newValue);
              handleChange("location", formatted);
            }}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.label || ""
            }
            filterOptions={(x) => x}
            loading={locationLoading}
            PopperComponent={SameWidthPopper}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Location *"
                fullWidth
                size="small"
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                    '& fieldset': {
                      borderColor: isDarkMode ? '#444' : '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: isDarkMode ? '#666' : '#bdbdbd',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#aaa' : '#666',
                  },
                  '& .MuiInputBase-input': {
                    color: isDarkMode ? '#fff' : '#1a1a1a',
                  },
                }}
                error={!!errors.location}
                helperText={
                  errors.location ||
                  locationError ||
                  (GEOAPIFY_API_KEY
                    ? "Start typing a South African location..."
                    : "Missing Geoapify API key.")
                }
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: isDarkMode ? "#aaa" : "#666" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {locationLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={`${option.lon ?? ""}-${option.lat ?? ""}-${option.label}`}>
                <Box>
                  <Typography variant="body2" sx={{ color: isDarkMode ? "#fff" : "#1a1a1a" }}>
                    {option.label}
                  </Typography>
                  {(option.suburb || option.city || option.state || option.postcode) && (
                    <Typography variant="caption" sx={{ color: isDarkMode ? "#aaa" : "#666" }}>
                      {[option.suburb, option.city, option.state, option.postcode]
                        .filter(Boolean)
                        .join(" • ")}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
          />

          {/* Event Leader */}
          <Box sx={{ mb: 2, position: "relative" }}>
            <TextField
              label="Event Leader *"
              value={formData.eventLeader}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("eventLeader", value);
                setPeopleData([]);
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                if (value.trim().length >= 2) {
                  searchDebounceRef.current = setTimeout(() => {
                    fetchPeople(value);
                  }, 300);
                }
              }}
              onFocus={() => {
                if (formData.eventLeader.length >= 2) {
                  fetchPeople(formData.eventLeader);
                }
              }}
              onBlur={() => {
                if (!isSelectingFromDropdown.current) {
                  setTimeout(() => {
                    if (!isSelectingFromDropdown.current) {
                      setPeopleData([]);
                    }
                  }, 200);
                }
              }}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                  '& fieldset': {
                    borderColor: isDarkMode ? '#444' : '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#666' : '#bdbdbd',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: isDarkMode ? '#aaa' : '#666',
                },
                '& .MuiInputBase-input': {
                  color: isDarkMode ? '#fff' : '#1a1a1a',
                },
              }}
              error={!!errors.eventLeader}
              helperText={
                errors.eventLeader ||
                (isSearchingPeople ? "Searching..." : "Type at least 2 characters to search")
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: isDarkMode ? "#aaa" : "#666" }} />
                  </InputAdornment>
                ),
              }}
              placeholder="Type name and surname to search..."
              autoComplete="off"
            />

            {peopleData.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 20000,
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                  border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  maxHeight: "200px",
                  overflowY: "auto",
                  mt: 0.5,
                }}
              >
                {peopleData.map((person) => (
                  <Box
                    key={person.id || `${person.fullName}-${person.email}`}
                    sx={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${isDarkMode ? '#333' : '#f0f0f0'}`,
                      "&:hover": {
                        backgroundColor: isDarkMode ? '#3a3a3a' : '#f5f5f5',
                      },
                      "&:last-child": { borderBottom: "none" },
                    }}
                    onMouseDown={() => { isSelectingFromDropdown.current = true; }}
                    onMouseUp={() => {
                      isSelectingFromDropdown.current = false;
                      const selectedName = person.fullName;
                      const selectedEmail = person.email;
                      if (hasPersonSteps && !isGlobalEvent) {
                        setFormData((prev) => ({
                          ...prev,
                          eventLeader: selectedName,
                          eventLeaderEmail: selectedEmail.toLowerCase(),
                          leader1: person.leader1 || "",
                          leader12: person.leader12 || "",
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          eventLeader: selectedName,
                          eventLeaderEmail: selectedEmail.toLowerCase(),
                        }));
                      }
                      setPeopleData([]);
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      fontWeight="500"
                      sx={{ color: isDarkMode ? "#fff" : "#1a1a1a" }}
                    >
                      {person.fullName}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: isDarkMode ? "#aaa" : "#666" }}
                    >
                      {person.email}
                      {person.leader1 && ` • L@1: ${person.leader1}`}
                      {person.leader12 && ` • L@12: ${person.leader12}`}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Person Steps Fields */}
          {hasPersonSteps && !isGlobalEvent && (
            <>
              <TextField
                label="Email *"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                fullWidth
                size="small"
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                    '& fieldset': {
                      borderColor: isDarkMode ? '#444' : '#e0e0e0',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#aaa' : '#666',
                  },
                  '& .MuiInputBase-input': {
                    color: isDarkMode ? '#fff' : '#1a1a1a',
                  },
                }}
                error={!!errors.email}
                helperText={errors.email || "Enter the email for this event"}
              />
              <TextField
                label="Leader @1 *"
                value={formData.leader1 || ""}
                onChange={(e) => handleChange("leader1", e.target.value)}
                fullWidth
                size="small"
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                    '& fieldset': {
                      borderColor: isDarkMode ? '#444' : '#e0e0e0',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#aaa' : '#666',
                  },
                  '& .MuiInputBase-input': {
                    color: isDarkMode ? '#fff' : '#1a1a1a',
                  },
                }}
                error={!!errors.leader1}
                helperText={errors.leader1 || "Enter the Leader @1 for this cell"}
              />
              <TextField
                label="Leader @12 *"
                value={formData.leader12 || ""}
                onChange={(e) => handleChange("leader12", e.target.value)}
                fullWidth
                size="small"
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                    '& fieldset': {
                      borderColor: isDarkMode ? '#444' : '#e0e0e0',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#aaa' : '#666',
                  },
                  '& .MuiInputBase-input': {
                    color: isDarkMode ? '#fff' : '#1a1a1a',
                  },
                }}
                error={!!errors.leader12}
                helperText={errors.leader12 || "Enter the Leader @12 for this cell"}
              />
            </>
          )}

          {/* Chips */}
          <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {isTicketedEvent && <Chip label="Ticketed Event" color="warning" size="small" />}
            {hasPersonSteps && !isGlobalEvent && (
              <Chip label="Personal Steps Event" color="secondary" size="small" />
            )}
          </Box>

          {/* Description */}
          <TextField
            label="Description *"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#fff',
                '& fieldset': {
                  borderColor: isDarkMode ? '#444' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: isDarkMode ? '#666' : '#bdbdbd',
                },
              },
              '& .MuiInputLabel-root': {
                color: isDarkMode ? '#aaa' : '#666',
              },
              '& .MuiInputBase-input': {
                color: isDarkMode ? '#fff' : '#1a1a1a',
              },
            }}
            error={!!errors.description}
            helperText={errors.description}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DescriptionIcon sx={{ color: isDarkMode ? "#aaa" : "#666" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Action Buttons */}
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                if (isModal && typeof onClose === "function") {
                  onClose();
                } else {
                  navigate("/events");
                }
              }}
              sx={{
                textTransform: "none",
                py: 1,
                borderColor: isDarkMode ? '#555' : '#ccc',
                color: isDarkMode ? '#fff' : '#666',
                '&:hover': {
                  borderColor: isDarkMode ? '#777' : '#999',
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                },
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              sx={{
                textTransform: "none",
                py: 1,
                bgcolor: isDarkMode ? "#1976d2" : "#1976d2",
                '&:hover': { bgcolor: isDarkMode ? "#1565c0" : "#1565c0" },
              }}
            >
              {isSubmitting
                ? eventId
                  ? "Updating..."
                  : "Creating..."
                : eventId
                  ? "Update Event"
                  : "Create Event"}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  </Box>
);
};

export default CreateEvents;