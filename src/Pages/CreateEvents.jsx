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

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Geoapify
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const GEOAPIFY_COUNTRY_CODE = (
  import.meta.env.VITE_GEOAPIFY_COUNTRY_CODE || "za"
).toLowerCase();

/**
 * Popper that forces the dropdown (autocomplete suggestions) to:
 * - match the input width exactly
 * - have a high z-index (so it shows over modals)
 */
const SameWidthPopper = (props) => {
  const { anchorEl } = props;

  const width =
    anchorEl && typeof anchorEl.getBoundingClientRect === "function"
      ? anchorEl.getBoundingClientRect().width
      : undefined;

  return (
    <Popper
      {...props}
      placement="bottom-start"
      style={{
        zIndex: 20000,
        width, //match input width
      }}
    />
  );
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
  const { id: eventId } = useParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [eventTypeFlags, setEventTypeFlags] = useState({
    isGlobal: false,
    isTicketed: false,
    hasPersonSteps: false,
  });

  const {
    isGlobal: isGlobalEvent,
    isTicketed: isTicketedEvent,
    hasPersonSteps,
  } = eventTypeFlags;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [peopleData, setPeopleData] = useState([]);
  const [loadingPeople] = useState(false);
  const [priceTiers, setPriceTiers] = useState([]);

  const isAdmin = user?.role === "admin";
  console.log("view role", isAdmin);

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
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [errors, setErrors] = useState({});
  const formAlert = useRef();

  // -----------------------------
  // GEOAPIFY LOCATION AUTOCOMPLETE (with geolocation bias)
  // -----------------------------
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Bias location for better SA results
  const [biasLonLat, setBiasLonLat] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBiasLonLat({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        setBiasLonLat(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleIsRecurringChange = (e) => {
    const checked = e.target.checked;
    setIsRecurring(checked);
    if (!checked) {
      setFormData((prev) => ({
        ...prev,
        recurringDays: [],
      }));
    }
  };

  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      setLocationError(
        "Missing Geoapify API key. Please set VITE_GEOAPIFY_API_KEY in your .env file."
      );
      return;
    }

    const query = (formData.location || "").trim();
    if (query.length < 3) {
      setLocationOptions([]);
      setLocationError("");
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLocationLoading(true);
        setLocationError("");

        const biasParam = biasLonLat
          ? `&bias=proximity:${encodeURIComponent(
              biasLonLat.lon
            )},${encodeURIComponent(biasLonLat.lat)}`
          : "";

        const url =
          `https://api.geoapify.com/v1/geocode/autocomplete` +
          `?text=${encodeURIComponent(query)}` +
          `&limit=10` +
          `&lang=en` +
          `&filter=countrycode:${encodeURIComponent(GEOAPIFY_COUNTRY_CODE)}` +
          biasParam +
          `&format=json` +
          `&apiKey=${encodeURIComponent(GEOAPIFY_API_KEY)}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Location lookup failed");

        const data = await res.json();
        if (!isActive) return;

        const results = Array.isArray(data?.results) ? data.results : [];

        const mapped = results
          .map((r) => ({
            label: r.formatted || "",
            formatted: r.formatted || "",
            suburb: r.suburb || "",
            city: r.city || r.town || r.village || "",
            state: r.state || "",
            postcode: r.postcode || "",
            lat: r.lat,
            lon: r.lon,
          }))
          .filter((x) => x.label);

        setLocationOptions(mapped);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setLocationError(
          "Could not load location suggestions. Please type manually."
        );
        setLocationOptions([]);
      } finally {
        if (isActive) setLocationLoading(false);
      }
    }, 350);

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [formData.location, biasLonLat]);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    console.log("CreateEvents - Props received:", {
      selectedEventTypeObj,
      selectedEventType,
      eventTypes: eventTypes.map((et) => ({
        name: et.name,
        isGlobal: et.isGlobal,
        isTicketed: et.isTicketed,
        hasPersonSteps: et.hasPersonSteps,
      })),
    });

    const determineEventType = () => {
      // If we have a selectedEventTypeObj, use its properties
      if (selectedEventTypeObj) {
        console.log("Using selectedEventTypeObj:", selectedEventTypeObj);
        return {
          eventType: selectedEventTypeObj.name || selectedEventTypeObj.displayName || "",
          isGlobal: !!selectedEventTypeObj.isGlobal,
          isTicketed: !!selectedEventTypeObj.isTicketed,
          hasPersonSteps: !!selectedEventTypeObj.hasPersonSteps,
        };
      }
      // If we have a selectedEventType string, find the matching object
      if (selectedEventType) {
        console.log("Looking for event type:", selectedEventType);
        // Handle "all" and convert to "CELLS" - FIXED: Always set hasPersonSteps to true for CELLS
        if (selectedEventType === "all" || selectedEventType.toUpperCase() === "ALL CELLS") {
          console.log("Detected ALL CELLS - converting to CELLS with personal steps");
          return {
            eventType: "CELLS",
            isGlobal: false,
            isTicketed: false,
            hasPersonSteps: true, // FIXED: This was the issue - always true for CELLS
          };
        }
        // Try to find the full event type object
        const foundEventType = eventTypes.find((et) => {
          const etName = et.name || et.displayName || "";
          const searchName = selectedEventType;
          return (
            etName === searchName ||
            etName.toLowerCase() === searchName.toLowerCase() ||
            et._id === searchName ||
            etName.includes(searchName) ||
            searchName.includes(etName)
          );
        });
        if (foundEventType) {
          console.log("Found event type:", foundEventType);
          return {
            eventType: foundEventType.name || foundEventType.displayName || selectedEventType,
            isGlobal: !!foundEventType.isGlobal,
            isTicketed: !!foundEventType.isTicketed,
            hasPersonSteps: !!foundEventType.hasPersonSteps,
          };
        } else {
          console.log("Event type not found, using defaults");
          // For CELLS type specifically, set hasPersonSteps to true
          const isCellsType = selectedEventType.toUpperCase() === "CELLS";
          return {
            eventType: selectedEventType,
            isGlobal: false,
            isTicketed: false,
            hasPersonSteps: isCellsType, // FIXED: Set to true only for CELLS type
          };
        }
      }
      return {
        eventType: "",
        isGlobal: false,
        isTicketed: false,
        hasPersonSteps: false,
      };
    };

    const { eventType, isGlobal, isTicketed, hasPersonSteps } = determineEventType();

    console.log("Final event type settings:", {
      eventType,
      isGlobal,
      isTicketed,
      hasPersonSteps,
    });

    setEventTypeFlags({
      isGlobal,
      isTicketed,
      hasPersonSteps,
    });

    setFormData((prev) => ({
      ...prev,
      eventType,
      ...(prev.hasPersonSteps && !hasPersonSteps
        ? {
            leader1: "",
            leader12: "",
          }
        : {}),
    }));
  }, [selectedEventTypeObj, selectedEventType, eventTypes]);

  useEffect(() => {
    console.log("Leader fields debug:", {
      hasPersonSteps,
      isGlobalEvent,
      shouldShowLeaderFields: hasPersonSteps && !isGlobalEvent,
      formData: {
        leader1: formData.leader1,
        leader12: formData.leader12,
      },
    });
  }, [hasPersonSteps, isGlobalEvent, formData.leader1, formData.leader12]);

  useEffect(() => {
    console.log("Price tier debug:", {
      isTicketedEvent,
      isGlobalEvent,
      shouldShowPriceTiers: isTicketedEvent && !isGlobalEvent,
      priceTiersCount: priceTiers.length,
    });
  }, [isTicketedEvent, isGlobalEvent, priceTiers]);

  useEffect(() => {
    if (isTicketedEvent && priceTiers.length === 0) {
      setPriceTiers([
        {
          name: "",
          price: "",
          ageGroup: "",
          memberType: "",
          paymentMethod: "",
        },
      ]);
    }
  }, [isTicketedEvent]);

  // Add to your component state
  const [allPeopleCache, setAllPeopleCache] = useState([]);

  // Fetch all people once on component mount
  useEffect(() => {
    const fetchAllPeople = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/people?perPage=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const formatted = (data?.results || []).map((p) => ({
            id: p._id,
            fullName: `${p.Name || ""} ${p.Surname || ""}`.trim(),
            email: p.Email || "",
            leader1: p["Leader @1"] || "",
            leader12: p["Leader @12"] || "",
          }));
          setAllPeopleCache(formatted);
        }
      } catch (err) {
        console.error("Error caching people:", err);
      }
    };

    fetchAllPeople();
  }, []);

  // Updated fetchPeople function
  const fetchPeople = (q) => {
    if (!q.trim()) {
      setPeopleData([]);
      return;
    }

    const searchLower = q.toLowerCase().trim();
    const filtered = allPeopleCache.filter((person) => {
      const fullName = person.fullName.toLowerCase();
      // Simple: just check if full name contains the search
      return fullName.includes(searchLower);
    });

    setPeopleData(filtered.slice(0, 10));
  };

  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/events/${eventId}`);
        const data = response.data;

        console.log("Fetched event data:", data);

        if (data.date) {
          const dt = new Date(data.date);
          data.date = dt.toISOString().split("T")[0];
          const hours = dt.getHours();
          const minutes = dt.getMinutes();
          data.time = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
          data.timePeriod = hours >= 12 ? "PM" : "AM";
        }

        if (data.recurring_day) {
          data.recurringDays = Array.isArray(data.recurring_day)
            ? data.recurring_day
            : [];
        }

        if (data.isTicketed !== undefined) {
          setEventTypeFlags((prev) => ({
            ...prev,
            isTicketed: !!data.isTicketed,
          }));
        }

        if (data.isTicketed) {
          console.log("Setting price tiers for ticketed event:", data.priceTiers);
          if (
            data.priceTiers &&
            Array.isArray(data.priceTiers) &&
            data.priceTiers.length > 0
          ) {
            const formattedPriceTiers = data.priceTiers.map((tier) => ({
              name: tier.name || "",
              price: tier.price || "",
              ageGroup: tier.ageGroup || "",
              memberType: tier.memberType || "",
              paymentMethod: tier.paymentMethod || "",
            }));
            setPriceTiers(formattedPriceTiers);
          } else {
            setPriceTiers([
              {
                name: "",
                price: "",
                ageGroup: "",
                memberType: "",
                paymentMethod: "",
              },
            ]);
          }
        } else {
          setPriceTiers([]);
        }

        setFormData((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Failed to fetch event:", err);
        toast.error("Failed to load event data. Please try again.");
      }
    };

    fetchEventData();
  }, [eventId, BACKEND_URL]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      if (errors[field]) {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
      }

      return {
        ...prev,
        [field]: value,
      };
    });
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

  const handleLeaderSelect = (person) => {
    setFormData((prev) => ({
      ...prev,
      eventLeader: person.fullName,
      eventLeaderEmail: person.email,
    }));
  };
  console.log("Leader select debug:", handleLeaderSelect)

  const handleRemovePriceTier = (index) => {
    setPriceTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      eventType: selectedEventTypeObj?.name || selectedEventType || "",
      eventName: "",
      date: "",
      time: "",
      timePeriod: "AM",
      recurringDays: [],
      location: "",
      eventLeader: "",
      description: "",
      leader1: "",
      leader12: "",
    });
    setPriceTiers([]);
    setErrors({});
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

    if (!isGlobalEvent) {
      if (hasPersonSteps && formData.recurringDays.length === 0) {
        newErrors.recurringDays = "Select at least one recurring day";
      }

      if (!hasPersonSteps) {
        if (!formData.date) newErrors.date = "Date is required";
        if (!formData.time) newErrors.time = "Time is required";
      }

      if (isTicketedEvent ) {
        if (priceTiers.length === 0) {
          newErrors.priceTiers = "Add at least one price tier for ticketed events";
        } else {
          priceTiers.forEach((tier, index) => {
            if (!tier.name) newErrors[`tier_${index}_name`] = "Price name is required";
            if (tier.price === "" || isNaN(Number(tier.price)) || Number(tier.price) < 0)
              newErrors[`tier_${index}_price`] = "Valid price is required";
            if (!tier.ageGroup) newErrors[`tier_${index}_ageGroup`] = "Age group is required";
            if (!tier.memberType) newErrors[`tier_${index}_memberType`] = "Member type is required";
            if (!tier.paymentMethod)
              newErrors[`tier_${index}_paymentMethod`] = "Payment method is required";
          });
        }
      }

      if (hasPersonSteps) {
        if (!formData.leader1) newErrors.leader1 = "Leader @1 is required";
        if (!formData.leader12) newErrors.leader12 = "Leader @12 is required";
      }
    } else {
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.time) newErrors.time = "Time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getDayFromDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return setTimeout(() => {
        formAlert.current.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }

    setIsSubmitting(true);

    try {
      let eventTypeToSend =
        selectedEventTypeObj?.name || selectedEventType || formData.eventType || "";
      if (eventTypeToSend === "all" || eventTypeToSend.toLowerCase() === "all cells") {
        eventTypeToSend = "CELLS";
      }

      if (!eventTypeToSend) {
        toast.error("Event type is required");
        setIsSubmitting(false);
        return;
      }

      console.log("Creating event with type:", eventTypeToSend);

      let dayValue = "";

      if (!formData.recurringDays || formData.recurringDays.length === 0) {
        dayValue = formData.date ? getDayFromDate(formData.date) : "";
      } else if (formData.recurringDays.length === 1) {
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
        recurring_day: formData.recurringDays,
        day: dayValue,
        status: "open",
        leader1: formData.leader1 || "",
        leader12: formData.leader12 || "",
        isRecurring: isRecurring,
        recurringDays: isRecurring ? formData.recurringDays : [],
      };

      if (formData.date && formData.time) {
        const [hoursStr, minutesStr] = formData.time.split(":");
        let hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        if (formData.timePeriod === "PM" && hours !== 12) hours += 12;
        if (formData.timePeriod === "AM" && hours === 12) hours = 0;

        payload.date = `${formData.date}T${hours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
        payload.time = `${hours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }

if (isTicketedEvent) {
  if (priceTiers.length > 0) {
    payload.priceTiers = priceTiers.map((tier) => ({
      name: tier.name || "",
      price: parseFloat(tier.price) || 0,
      ageGroup: tier.ageGroup || "",
      memberType: tier.memberType || "",
      paymentMethod: tier.paymentMethod || "",
    }));
  } else {
    payload.priceTiers = [];
  }
} else {
        payload.priceTiers = [];
      }

      if (hasPersonSteps && !isGlobalEvent) {
        payload.leader1 = formData.leader1 || "";
        payload.leader12 = formData.leader12 || "";
      }

      console.log("Final Payload:", payload);

      const token = localStorage.getItem("token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      const response = eventId
        ? await axios.put(`${BACKEND_URL.replace(/\/$/, "")}/events/${eventId}`, payload, {
            headers,
          })
        : await axios.post(`${BACKEND_URL.replace(/\/$/, "")}/events`, payload, { headers });

      console.log("Response:", response.data);

      toast.success(
        eventId ? "Event updated successfully!" : "Event created successfully!"
      );

      if (!eventId) resetForm();

      setTimeout(() => {
        if (isModal && typeof onClose === "function") {
          onClose(true);
        } else {
          navigate("/events", {
            state: {
              refresh: true,
              timestamp: Date.now(),
            },
          });
        }
      }, 1200);
    } catch (err) {
      console.error("Error:", err);
      console.error("Response:", err?.response?.data);

      let errorMsg = "Failed to submit event";

      if (err?.response?.data) {
        const errorData = err.response.data;

        if (Array.isArray(errorData.detail)) {
          errorMsg =
            "Validation errors: " +
            errorData.detail
              .map((errorObj) => {
                if (errorObj.msg) return errorObj.msg;
                if (errorObj.loc && errorObj.msg)
                  return `${errorObj.loc.join(".")}: ${errorObj.msg}`;
                return JSON.stringify(errorObj);
              })
              .join(", ");
        } else if (errorData.detail && typeof errorData.detail === "object") {
          errorMsg = errorData.detail.msg || JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.detail) {
          errorMsg = errorData.detail;
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerStyle = isModal
    ? {
        padding: "0",
        minHeight: "auto",
        backgroundColor: "transparent",
        width: "100%",
        height: "100%",
        maxHeight: "none",
        overflowY: "auto",
      }
    : {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: isDarkMode ? "#121212" : "#f5f5f5",
        px: 2,
      };

  const cardStyle = isModal
    ? {
        width: "100%",
        height: "100%",
        padding: "1.5rem",
        borderRadius: 0,
        boxShadow: "none",
        backgroundColor: "transparent",
        maxHeight: "none",
        overflow: "visible",
      }
    : {
        width: { xs: "100%", sm: "85%", md: "700px" },
        p: 5,
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      };

  const darkModeStyles = {
    textField: {
      "& .MuiOutlinedInput-root": {
        bgcolor: isDarkMode ? theme.palette.background.paper : "#fff",
        color: theme.palette.text.primary,
        "& fieldset": {
          borderColor: isDarkMode
            ? theme.palette.divider
            : "rgba(0, 0, 0, 0.23)",
        },
        "&:hover fieldset": {
          borderColor: isDarkMode
            ? theme.palette.primary.light
            : "rgba(0, 0, 0, 0.87)",
        },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
        },
        "& input": {
          color: theme.palette.text.primary,
          WebkitTextFillColor: theme.palette.text.primary,
        },
        "& textarea": {
          color: theme.palette.text.primary,
        },
      },

      // Make date/time picker icons white in dark mode
      "& .MuiInputAdornment-root .MuiSvgIcon-root": {
        color: isDarkMode ? "#fff" : theme.palette.text.secondary,
      },

      "& .MuiInputLabel-root": {
        color: theme.palette.text.secondary,
        "&.Mui-focused": {
          color: theme.palette.primary.main,
        },
        "&.MuiInputLabel-shrink": {
          color: theme.palette.text.secondary,
        },
      },
      "& .MuiFormHelperText-root": {
        color: theme.palette.text.secondary,
        "&.Mui-error": {
          color: theme.palette.error.main,
        },
      },
    },

    autocomplete: {
      "& .MuiOutlinedInput-root": {
        bgcolor: isDarkMode ? theme.palette.background.paper : "#fff",
        color: theme.palette.text.primary,
        "& fieldset": {
          borderColor: isDarkMode
            ? theme.palette.divider
            : "rgba(0, 0, 0, 0.23)",
        },
        "&:hover fieldset": {
          borderColor: isDarkMode
            ? theme.palette.primary.light
            : "rgba(0, 0, 0, 0.87)",
        },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.primary.main,
        },
      },
      "& .MuiAutocomplete-input": {
        color: theme.palette.text.primary,
      },
      "& .MuiInputLabel-root": {
        color: theme.palette.text.secondary,
      },
    },

    formControlLabel: {
      "& .MuiFormControlLabel-label": {
        color: theme.palette.text.primary,
        fontSize: "0.95rem",
        fontWeight: 500,
      },
      "& .MuiCheckbox-root": {
        color: theme.palette.text.secondary,
        "&.Mui-checked": {
          color: theme.palette.primary.main,
        },
      },
    },

    button: {
      contained: {
        bgcolor: isDarkMode ? "#194c99ff" : theme.palette.primary.dark,
        color: "#fff",
        "&:hover": {
          bgcolor: isDarkMode ? "#2f6bbeff" : theme.palette.primary.main,
        },
      },

      outlined: {
        borderColor: theme.palette.divider,
        color: theme.palette.text.primary,
        "&:hover": {
          borderColor: theme.palette.primary.dark,
          bgcolor: theme.palette.action.hover,
        },
      },
    },

    errorText: {
      color: theme.palette.error.main,
    },

    card: {
      bgcolor: isDarkMode ? theme.palette.background.paper : "#fff",
      border: `1px solid ${theme.palette.divider}`,
    },

    sectionTitle: {
      color: theme.palette.text.primary,
    },

    helperText: {
      color: theme.palette.text.secondary,
    },

    daysContainer: {
      "& .MuiFormControlLabel-root": {
        margin: 0,
        "& .MuiFormControlLabel-label": {
          color: theme.palette.text.primary,
          fontSize: "0.95rem",
          fontWeight: 500,
        },
      },
    },
  };

  return (
    <Box sx={containerStyle}>
      <Card
        sx={{
          ...cardStyle,
          ...(isDarkMode && !isModal
            ? {
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
              }
            : {}),
        }}
      >
        <CardContent
          sx={{
            padding: isModal ? "0" : "1rem",
            "&:last-child": { paddingBottom: isModal ? "0" : "1rem" },
          }}
        >
          {!isModal && (
            <Typography
              variant="h4"
              fontWeight="bold"
              textAlign="center"
              mb={4}
              sx={{ color: isDarkMode ? "#ffffff" : theme.palette.primary.main }}
            >
              {eventId ? "Edit Event" : "Create New Event"}
            </Typography>
          )}
          {Object.keys(errors).length !== 0 && (
            <Alert
              ref={formAlert}
              sx={{
                marginBottom: "20px",
              }}
              severity="error"
            >
              Please fill In all required fields
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              select
              label="Event Type *"
              value={formData.eventType || ""}
              onChange={(e) => {
                const selectedName = e.target.value;

                const selectedObj = eventTypes.find((et) => et.name === selectedName);

                setFormData((prev) => ({
                  ...prev,
                  eventType: selectedName,
                }));

                if (selectedObj) {
                  setIsGlobalEvent(selectedObj.isGlobal);
                  setIsTicketedEvent(selectedObj.isTicketed);
                  setHasPersonSteps(selectedObj.hasPersonSteps);
                }
              }}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
            >
              {eventTypes.map((et) => (
                <MenuItem key={et.id} value={et.name}>
                  {et.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Event Name *"
              value={formData.eventName}
              onChange={(e) => handleChange("eventName", e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.eventName}
              helperText={errors.eventName}
            />

            {isTicketedEvent && (
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={darkModeStyles.sectionTitle}>
                    Price Tiers *
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddPriceTier}
                    variant="contained"
                    size="small"
                  >
                    Add Price Tier
                  </Button>
                </Box>
                {errors.priceTiers && (
                  <Typography
                    variant="caption"
                    sx={{ ...darkModeStyles.errorText, mb: 1, display: "block" }}
                  >
                    {errors.priceTiers}
                  </Typography>
                )}

                {priceTiers.map((tier, index) => (
                  <Card
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      ...darkModeStyles.card,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                      >
                        Price Tier {index + 1}
                      </Typography>
                      {priceTiers.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemovePriceTier(index)}
                          color="error"
                        >
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
                      sx={{ mb: 2, ...darkModeStyles.textField }}
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
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      error={!!errors[`tier_${index}_price`]}
                      helperText={errors[`tier_${index}_price`]}
                    />

                    <TextField
                      label="Age Group *"
                      value={tier.ageGroup}
                      onChange={(e) => handlePriceTierChange(index, "ageGroup", e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      error={!!errors[`tier_${index}_ageGroup`]}
                      helperText={errors[`tier_${index}_ageGroup`]}
                    />

                    <TextField
                      label="Member Type *"
                      value={tier.memberType}
                      onChange={(e) => handlePriceTierChange(index, "memberType", e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      error={!!errors[`tier_${index}_memberType`]}
                      helperText={errors[`tier_${index}_memberType`]}
                    />

                    <TextField
                      label="Payment Method *"
                      value={tier.paymentMethod}
                      onChange={(e) => handlePriceTierChange(index, "paymentMethod", e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ ...darkModeStyles.textField }}
                      error={!!errors[`tier_${index}_paymentMethod`]}
                      helperText={errors[`tier_${index}_paymentMethod`]}
                    />
                  </Card>
                ))}
              </Box>
            )}

            <Box display="flex" gap={2} flexDirection={{ xs: "column", sm: "row" }} mb={3}>
              <TextField
                label="Date *"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!errors.date}
                helperText={errors.date}
                sx={darkModeStyles.textField}
              />
              <TextField
                label="Time *"
                type="time"
                value={formData.time}
                onChange={(e) => handleChange("time", e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                error={!!errors.time}
                helperText={errors.time}
                sx={darkModeStyles.textField}
              />
            </Box>

            <Box mb={3}>
              <Typography fontWeight="bold" mb={1} sx={darkModeStyles.sectionTitle}>
                Is Recurring?{" "}
                {hasPersonSteps && !isGlobalEvent && <span style={{ color: "red" }}>*</span>}
              </Typography>
              <FormControlLabel
                control={<Checkbox checked={isRecurring} onChange={handleIsRecurringChange} />}
                label="Yes"
              />

              <Typography fontWeight="bold" mb={1} sx={darkModeStyles.sectionTitle}>
                Recurring Days{" "}
                {hasPersonSteps && !isGlobalEvent && <span style={{ color: "red" }}>*</span>}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2} sx={darkModeStyles.daysContainer}>
                {days.map((day) => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={formData.recurringDays.includes(day)}
                        onChange={() => handleDayChange(day)}
                        disabled={!isRecurring}
                      />
                    }
                    label={day}
                  />
                ))}
              </Box>
              {errors.recurringDays && (
                <Typography variant="caption" sx={darkModeStyles.errorText}>
                  {errors.recurringDays}
                </Typography>
              )}
            </Box>

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
              PopperComponent={SameWidthPopper} // this makes dropdown same width
              ListboxProps={{ sx: darkModeStyles.autocompleteListbox }}
              PaperComponent={({ children }) => (
                <Paper
                  sx={{
                    width: "100%", //keeps the paper inside popper at same width
                    bgcolor: isDarkMode ? theme.palette.background.paper : "#fff",
                    border: `1px solid ${isDarkMode ? theme.palette.divider : "#ccc"}`,
                  }}
                >
                  {children}
                </Paper>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Location *"
                  fullWidth
                  size="small"
                  sx={{ mb: 3, ...darkModeStyles.textField }}
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
                        <LocationOnIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {locationLoading ? (
                          <CircularProgress color="inherit" size={18} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={`${option.lon ?? ""}-${option.lat ?? ""}-${option.label}`}>
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    {(option.suburb || option.city || option.state || option.postcode) && (
                      <Typography variant="caption" color="text.secondary">
                        {[option.suburb, option.city, option.state, option.postcode]
                          .filter(Boolean)
                          .join(" • ")}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
            />

            {/* Event Leader section */}
            <Box sx={{ mb: 3, position: "relative" }}>
              <TextField
                label="Event Leader *"
                value={formData.eventLeader}
                onChange={(e) => {
                  handleChange("eventLeader", e.target.value);
                  if (e.target.value.trim().length >= 1) {
                    fetchPeople(e.target.value);
                  } else {
                    setPeopleData([]);
                  }
                }}
                onFocus={() => {
                  if (formData.eventLeader.length >= 1) {
                    fetchPeople(formData.eventLeader);
                  }
                }}
                onBlur={() => {
                  // Delay hiding dropdown to allow for selection
                  setTimeout(() => setPeopleData([]), 200);
                }}
                fullWidth
                size="small"
                sx={darkModeStyles.textField}
                error={!!errors.eventLeader}
                helperText={errors.eventLeader || "Type name and surname to search..."}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
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
                    zIndex: 1000,
                    backgroundColor: isDarkMode ? theme.palette.background.paper : "#fff",
                    border: `1px solid ${isDarkMode ? theme.palette.divider : "#ccc"}`,
                    borderRadius: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    maxHeight: "200px",
                    overflowY: "auto",
                    mt: 0.5,
                  }}
                >
                  {peopleData.map((person) => (
                    <Box
                      key={person.id || `${person.fullName}-${person.email}`}
                      sx={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom: `1px solid ${
                          isDarkMode ? theme.palette.divider : "#f0f0f0"
                        }`,
                        "&:hover": {
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.1)"
                            : "#f5f5f5",
                        },
                        "&:last-child": {
                          borderBottom: "none",
                        },
                      }}
                      onClick={() => {
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
                      <Typography variant="body1" fontWeight="500">
                        {person.fullName}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", fontSize: "0.75rem" }}
                      >
                        {person.email}
                        {person.leader1 && ` • L@1: ${person.leader1}`}
                        {person.leader12 && ` • L@12: ${person.leader12}`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {loadingPeople && (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                  Searching...
                </Typography>
              )}
            </Box>

            {hasPersonSteps && !isGlobalEvent && (
              <>
                <TextField
                  label="Email *"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.email}
                  helperText={errors.email || "Enter the email for this event"}
                />

                <TextField
                  label="Leader @1 *"
                  value={formData.leader1 || ""}
                  onChange={(e) => handleChange("leader1", e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.leader1}
                  helperText={errors.leader1 || "Enter the Leader @1 for this cell"}
                />

                <TextField
                  label="Leader @12 *"
                  value={formData.leader12 || ""}
                  onChange={(e) => handleChange("leader12", e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.leader12}
                  helperText={errors.leader12 || "Enter the Leader @12 for this cell"}
                />
              </>
            )}

            <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {isTicketedEvent && (
                <Chip label="Ticketed Event" color="warning" size="small" />
              )}
              {isGlobalEvent && null}
              {hasPersonSteps && !isGlobalEvent && (
                <Chip label="Personal Steps Event" color="secondary" size="small" />
              )}
            </Box>

            <TextField
              label="Description *"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              multiline
              rows={3}
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.description}
              helperText={errors.description}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Box display="flex" gap={2} sx={{ mt: 3 }}>
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
                sx={darkModeStyles.button.outlined}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting}
                sx={{
                  ...darkModeStyles.button.contained,
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