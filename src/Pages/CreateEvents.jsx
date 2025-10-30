import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Checkbox,
  Chip,
  Card,
  CardContent,
  FormControlLabel,
  Box,
  InputAdornment,
  Snackbar,
  Alert,
  Typography,
  useTheme,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const CreateEvents = ({
  user,
  isModal = false,
  onClose,
  eventTypes = [],
  selectedEventType, // may be a string (name) or unused
  selectedEventTypeObj = null, // canonical object (name + flags). THIS IS THE KEY PROP.
}) => {
  const navigate = useNavigate();
  const { id: eventId } = useParams();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // eventTypeFlags will always reflect the authoritative checkbox values coming from selectedEventTypeObj
  const [eventTypeFlags, setEventTypeFlags] = useState({
    isGlobal: false,
    isTicketed: false,
    hasPersonSteps: false,
  });

  // keep a small derived convenience set
  const {
    isGlobal: isGlobalEvent,
    isTicketed: isTicketedEvent,
    hasPersonSteps,
  } = eventTypeFlags;

  // Basic UI / submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorAlert, setErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [peopleData, setPeopleData] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);

  // Price tiers state (for ticketed events)
  const [priceTiers, setPriceTiers] = useState([
    { name: "", price: "", ageGroup: "", memberType: "", paymentMethod: "" },
  ]);

  const isAdmin = user?.role === "admin";

  const [formData, setFormData] = useState({
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
    priceTiers: [{ name: "", price: "", ageGroup: "", memberType: "", paymentMethod: "" }],
  });

  // Errors
  const [errors, setErrors] = useState({});

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
const standardPrice = 100;

  const calculatePrice = (name) => {
    switch (name) {
      case "Standard":
        return standardPrice;
      case "Early Bird":
        return standardPrice - 20;
      case "Child":
        return standardPrice / 2;
      case "Group Package":
        return 70;
      case "Free":
      case "Guest":
        return 0;
      default:
        return 0;
    }
  };
  // ---------------------------
  // Keep flags & formData in sync with the selectedEventTypeObj prop
  // ---------------------------
  useEffect(() => {
    // If a full object was passed, use its flags and name
    if (selectedEventTypeObj) {
      setEventTypeFlags({
        isGlobal: !!selectedEventTypeObj.isGlobal,
        isTicketed: !!selectedEventTypeObj.isTicketed,
        hasPersonSteps: !!selectedEventTypeObj.hasPersonSteps,
      });

      setFormData((prev) => ({
        ...prev,
        eventType: selectedEventTypeObj.name || prev.eventType,
      }));
    } else if (selectedEventType) {
      // If only a string name was passed (fallback), show the string but keep flags default false
      setFormData((prev) => ({
        ...prev,
        eventType: selectedEventType,
      }));
      setEventTypeFlags((prev) => ({
        ...prev,
        // keep previous flags if any — don't override with false unless you want that
      }));
    }
    // We intentionally only depend on the props so updates propagate
  }, [selectedEventTypeObj, selectedEventType]);

  // ---------------------------
  // Fetch people (used in autocomplete)
  // ---------------------------
  const fetchPeople = async (filter = "") => {
    try {
      setLoadingPeople(true);
      const params = new URLSearchParams();
      params.append("perPage", "1000");
      if (filter) params.append("name", filter);

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${
          p.Surname || p.surname || ""
        }`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p.leader1 || "",
        leader12: p["Leader @12"] || p.leader12 || "",
        leader144: p["Leader @144"] || p.leader144 || "",
      }));

      setPeopleData(formatted);
    } catch (err) {
      console.error("Error fetching people:", err);
      setErrorMessage("Failed to load people data. Please refresh the page.");
      setErrorAlert(true);
      setPeopleData([]);
    } finally {
      setLoadingPeople(false);
    }
  };

  useEffect(() => {
    // initial load
    if (BACKEND_URL) fetchPeople();
    // only run when BACKEND_URL changes
  }, [BACKEND_URL]);

  // ---------------------------
  // Price tiers initialization for new ticketed events
  // ---------------------------
  useEffect(() => {
    if (!eventId && isTicketedEvent && priceTiers.length === 0) {
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
  }, [eventId, isTicketedEvent]); // reacts to changes in selected event type flags

  // ---------------------------
  // Load existing event when editing
  // ---------------------------
  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/events/${eventId}`);
        const data = response.data;

        // Normalize date/time for inputs
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

        // normalize recurring days
        if (data.recurring_day) {
          data.recurringDays = Array.isArray(data.recurring_day)
            ? data.recurring_day
            : [];
        }

        // If the selected event type flags indicate ticketed, load priceTiers from the event
        if (isTicketedEvent) {
          if (
            data.priceTiers &&
            Array.isArray(data.priceTiers) &&
            data.priceTiers.length > 0
          ) {
            setPriceTiers(data.priceTiers);
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
        }

        setFormData((prev) => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setErrorMessage("Failed to load event data. Please try again.");
        setErrorAlert(true);
      }
    };

    fetchEventData();
  }, [eventId, BACKEND_URL, isTicketedEvent]); // depends on isTicketedEvent so that switching type updates tiers

  // ---------------------------
  // Handlers: form change and recurring days
  // ---------------------------
  const handleChange = (field, value) => {
    setFormData((prev) => {
      // clear field error if present
      if (errors[field]) {
        setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
      }

      // // special-case eventType cell detection
      // if (field === "eventType" && typeof value === "string") {
      //   const isCell = value.toLowerCase().includes("cell");
      //   const wasCell = (prev.eventType || "").toLowerCase().includes("cell");

      //   if (isCell !== wasCell) {
      //     return {
      //       ...prev,
      //       [field]: value,
      //       eventName: "",
      //       leader1: "",
      //       leader12: "",
      //       eventLeader: "",
      //       ...(isCell ? { date: "", time: "", timePeriod: "AM" } : {}),
      //     };
      //   }
      // }

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

  // ---------------------------
  // Price tier helpers
  // ---------------------------
   const handleAddPriceTier = () => {
    setEventData((prev) => ({
      ...prev,
      priceTiers: [
        ...prev.priceTiers,
        {
          name: "",
          price: "",
          ageGroup: "",
          memberType: "",
          paymentMethod: "",
        },
      ],
    }));
  };

  const handleRemovePriceTier = (index) => {
    setEventData((prev) => ({
      ...prev,
      priceTiers: prev.priceTiers.filter((_, i) => i !== index),
    }));
  };

  const handlePriceTierChange = (index, field, value) => {
    setEventData((prev) => {
      const updatedTiers = [...prev.priceTiers];
      updatedTiers[index][field] = value;

      // Auto-calculate price if name changes
      if (field === "name") {
        updatedTiers[index].price = calculatePrice(value);
      }

      // Ensure only one price name per tier (not multiple selections)
      return { ...prev, priceTiers: updatedTiers };
    });
  };

  // ---------------------------
  // Reset / validate
  // ---------------------------
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
    if (!formData.eventLeader)
      newErrors.eventLeader = "Event leader is required";
    if (!formData.description)
      newErrors.description = "Description is required";

    // If event is NOT global, apply usual rules
    if (!isGlobalEvent) {
      if (hasPersonSteps && formData.recurringDays.length === 0) {
        newErrors.recurringDays = "Select at least one recurring day";
      }

      if (!hasPersonSteps) {
        if (!formData.date) newErrors.date = "Date is required";
        if (!formData.time) newErrors.time = "Time is required";
      }

      // Ticketed event price tiers
      if (isTicketedEvent) {
        if (priceTiers.length === 0) {
          newErrors.priceTiers =
            "Add at least one price tier for ticketed events";
        } else {
          priceTiers.forEach((tier, index) => {
            if (!tier.name)
              newErrors[`tier_${index}_name`] = "Price name is required";
            if (
              tier.price === "" ||
              isNaN(Number(tier.price)) ||
              Number(tier.price) < 0
            )
              newErrors[`tier_${index}_price`] = "Valid price is required";
            if (!tier.ageGroup)
              newErrors[`tier_${index}_ageGroup`] = "Age group is required";
            if (!tier.memberType)
              newErrors[`tier_${index}_memberType`] = "Member type is required";
            if (!tier.paymentMethod)
              newErrors[`tier_${index}_paymentMethod`] =
                "Payment method is required";
          });
        }
      }

      // Personal steps leaders
      if (hasPersonSteps) {
        if (!formData.leader1) newErrors.leader1 = "Leader @1 is required";
        if (!formData.leader12) newErrors.leader12 = "Leader @12 is required";
      }
    } else {
      // Global events still expect a date/time
      if (!formData.date) newErrors.date = "Date is required";
      if (!formData.time) newErrors.time = "Time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------
  // Submit (create or update)
  // ---------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const eventTypeToSend = selectedEventTypeObj?.name || formData.eventType;

      const payload = {
        eventType: eventTypeToSend,
        eventName: formData.eventName,
        isTicketed: !!isTicketedEvent,
        isGlobal: !!isGlobalEvent,
        hasPersonSteps: !!hasPersonSteps,
        location: formData.location,
        eventLeader: formData.eventLeader,
        description: formData.description,
        userEmail: user?.email || "",
        recurring_day: formData.recurringDays,
        status: "open",
      };

      // ✅ FIX: Properly format and include price tiers
      if (isTicketedEvent && priceTiers.length > 0) {
        payload.priceTiers = priceTiers.map((tier) => ({
          name: tier.name || "",
          price: parseFloat(tier.price) || 0,
          ageGroup: tier.ageGroup || "",
          memberType: tier.memberType || "",
          paymentMethod: tier.paymentMethod || "",
        }));

        console.log("📋 Including price tiers:", payload.priceTiers);
      } else {
        payload.priceTiers = [];
      }

      // person steps leaders
      if (hasPersonSteps && !isGlobalEvent) {
        if (formData.leader1) payload.leader1 = formData.leader1;
        if (formData.leader12) payload.leader12 = formData.leader12;
      }

      // date/time assembly
      if (
        (!hasPersonSteps || isGlobalEvent) &&
        formData.date &&
        formData.time
      ) {
        const [hoursStr, minutesStr] = formData.time.split(":");
        let hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        if (formData.timePeriod === "PM" && hours !== 12) hours += 12;
        if (formData.timePeriod === "AM" && hours === 12) hours = 0;

        payload.date = `${formData.date}T${hours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
      }

      console.log("📤 Submitting payload:", JSON.stringify(payload, null, 2));

      const response = eventId
        ? await axios.put(`${BACKEND_URL}/events/${eventId}`, payload)
        : await axios.post(`${BACKEND_URL}/events`, payload);

      console.log("✅ Server response:", response.data);

      setSuccessMessage(
        hasPersonSteps && !isGlobalEvent
          ? `The ${
              formData.eventName
            } event with leadership hierarchy has been ${
              eventId ? "updated" : "created"
            } successfully!`
          : eventId
          ? "Event updated successfully!"
          : "Event created successfully!"
      );
      setSuccessAlert(true);

      if (!eventId) resetForm();

      setTimeout(() => {
        if (isModal && typeof onClose === "function") {
          onClose();
        } else {
          navigate("/events", { state: { refresh: true } });
        }
      }, 1200);
    } catch (err) {
      console.error("❌ Error submitting event:", err);
      console.error("❌ Error response:", err.response?.data);
      setErrorMessage(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          "Failed to submit event"
      );
      setErrorAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------
  // Derived helpers used in render
  // ---------------------------
  // const isCell = (formData.eventType || "").toLowerCase().includes("cell");

  // styling objects (you had these — keep them)
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
    // Theme-aware, more polished dark/light styles
    textField: {
      "& .MuiOutlinedInput-root": {
        bgcolor: isDarkMode ? theme.palette.background.paper : "#fff",
        color: isDarkMode ? theme.palette.text.primary : "inherit",
        "& fieldset": {
          borderColor: isDarkMode ? theme.palette.divider : "rgba(0,0,0,0.23)",
        },
        "&:hover fieldset": {
          borderColor:
            theme.palette.mode === "dark"
              ? theme.palette.primary.light
              : "rgba(0,0,0,0.87)",
        },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
        },
      },
      "& .MuiInputLabel-root": {
        color: isDarkMode ? theme.palette.text.secondary : "rgba(0, 0, 0, 0.6)",
        "&.Mui-focused": {
          color: theme.palette.primary.main,
        },
      },
      "& .MuiInputAdornment-root .MuiSvgIcon-root": {
        color: isDarkMode
          ? theme.palette.text.secondary
          : "rgba(0, 0, 0, 0.54)",
      },
      "& .MuiFormHelperText-root": {
        color: isDarkMode ? theme.palette.text.secondary : "rgba(0,0,0,0.6)",
      },
    },
    select: {
      "& .MuiOutlinedInput-root": {
        bgcolor: isDarkMode ? theme.palette.background.paper : "#fff",
        color: isDarkMode ? theme.palette.text.primary : "inherit",
      },
      "& .MuiInputLabel-root": {
        color: isDarkMode ? theme.palette.text.secondary : "rgba(0, 0, 0, 0.6)",
      },
    },
    formControlLabel: {
      "& .MuiFormControlLabel-label": {
        color: isDarkMode ? theme.palette.text.primary : "inherit",
      },
    },
    button: {
      outlined: {
        borderColor: isDarkMode
          ? theme.palette.divider
          : theme.palette.primary.main,
        color: isDarkMode
          ? theme.palette.text.primary
          : theme.palette.primary.main,
        "&:hover": {
          borderColor: theme.palette.primary.dark,
          bgcolor: isDarkMode
            ? "rgba(255,255,255,0.03)"
            : "rgba(25,118,210,0.04)",
        },
      },
      contained: {
        bgcolor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        "&:hover": {
          bgcolor: theme.palette.primary.dark,
        },
      },
    },
    errorText: {
      color: theme.palette.mode === "dark" ? "#ff8888" : "#d32f2f",
    },
  };

  // permission guard
  if (isGlobalEvent && !["admin", "registrant"].includes(user?.role)) {
    return (
      <Typography variant="h6" color="error" textAlign="center" mt={5}>
        You do not have permission to view or create this event.
      </Typography>
    );
  }

  // Ensure card background matches theme (applies to modal and page)
  const cardBg = isDarkMode ? theme.palette.background.paper : "#ffffff";
  const cardBorder = isDarkMode ? `1px solid ${theme.palette.divider}` : "none";

  // ---------------------------
  // END: logic portion — the next thing is `return` (render).
  // Paste your existing return UI code after this point.
  // ---------------------------

  return (
    <Box sx={containerStyle}>
      <Card
        sx={{
          ...cardStyle,
          bgcolor: cardBg,
          color: isDarkMode ? theme.palette.text.primary : "inherit",
          border: cardBorder,
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
              color="primary"
            >
              {eventId ? "Edit Event" : "Create New Event"}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            {/* Event Type */}
            <TextField
              value={
                // Normalize the value to always show the actual event type
                (() => {
                  const et = formData.eventType;
                  if (!et) return "";
                  return typeof et === "string" ? et : et.name || "";
                })()
              }
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              InputProps={{
                readOnly: true,
              }}
              disabled
            />

            {/* Event Name */}
            <TextField
              label="Event Name"
              value={formData.eventName}
              onChange={(e) => handleChange("eventName", e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.eventName}
              helperText={
                errors.eventName ||
                (hasPersonSteps && !isGlobalEvent
                  ? "Auto-filled when event leader is selected"
                  : "")
              }
            />

            {/* TICKETED EVENT PRICE TIERS */}
            {/* === Ticketed Fields Section === */}
            {/* === Ticketed Fields Section === */}
 {isTicketedEvent && (
          <Box mt={2}>
            <Typography variant="h6">Price Tiers</Typography>
            {formData.priceTiers.map((tier, i) => (
              <Box key={i} display="flex" gap={1} alignItems="center" mb={1}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>Tier Name</InputLabel>
                  <Select
                    value={tier.name}
                    label="Tier Name"
                    onChange={(e) => handlePriceTierChange(i, "name", e.target.value)}
                  >
                    <MenuItem value="R40">R40</MenuItem>
                    <MenuItem value="R50">R50</MenuItem>
                    <MenuItem value="R80">R80</MenuItem>
                    <MenuItem value="R100">R100</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Price"
                  type="number"
                  value={tier.price}
                  onChange={(e) => handlePriceTierChange(i, "price", e.target.value)}
                  error={!!errors[`tier_${i}_price`]}
                  helperText={errors[`tier_${i}_price`] || ""}
                />
                <TextField
                  label="Age Group"
                  value={tier.ageGroup}
                  onChange={(e) => handlePriceTierChange(i, "ageGroup", e.target.value)}
                  error={!!errors[`tier_${i}_ageGroup`]}
                  helperText={errors[`tier_${i}_ageGroup`] || ""}
                />
                <TextField
                  label="Member Type"
                  value={tier.memberType}
                  onChange={(e) => handlePriceTierChange(i, "memberType", e.target.value)}
                  error={!!errors[`tier_${i}_memberType`]}
                  helperText={errors[`tier_${i}_memberType`] || ""}
                />
                <TextField
                  label="Payment Method"
                  value={tier.paymentMethod}
                  onChange={(e) => handlePriceTierChange(i, "paymentMethod", e.target.value)}
                  error={!!errors[`tier_${i}_paymentMethod`]}
                  helperText={errors[`tier_${i}_paymentMethod`] || ""}
                />
                <IconButton onClick={() => handleRemovePriceTier(i)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={handleAddPriceTier}>
              Add Price Tier
            </Button>
          </Box>
        )}
            {/* Date & Time */}
            <Box
              display="flex"
              gap={2}
              flexDirection={{ xs: "column", sm: "row" }}
              mb={3}
            >
              <TextField
                label="Date"
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
                label="Time"
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

            {/* Recurring Days */}
            <Box mb={3}>
              <Typography
                fontWeight="bold"
                mb={1}
                sx={{ color: isDarkMode ? "#ffffff" : "inherit" }}
              >
                Recurring Days{" "}
                {hasPersonSteps && !isGlobalEvent && (
                  <span style={{ color: "red" }}>*</span>
                )}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: isDarkMode ? "#bbb" : "#666", mb: 2 }}
              >
                {hasPersonSteps && !isGlobalEvent
                  ? "Select the days this cell meets regularly"
                  : "Optional: Select days if this event repeats weekly"}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {days.map((day) => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={formData.recurringDays.includes(day)}
                        onChange={() => handleDayChange(day)}
                      />
                    }
                    label={day}
                    sx={darkModeStyles.formControlLabel}
                  />
                ))}
              </Box>
              {errors.recurringDays && (
                <Typography variant="caption" sx={darkModeStyles.errorText}>
                  {errors.recurringDays}
                </Typography>
              )}
            </Box>

            {/* Location */}
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              error={!!errors.location}
              helperText={errors.location}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Autocomplete
              freeSolo
              filterOptions={(options) => options}
              loading={loadingPeople}
              options={peopleData}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.fullName || ""
              }
              isOptionEqualToValue={(option, value) => {
                return (
                  (typeof option === "string" ? option : option.fullName) ===
                  (typeof value === "string" ? value : value.fullName)
                );
              }}
              renderOption={(props, option) => (
                <li
                  {...props}
                  key={option.id || option.fullName || Math.random()}
                >
                  {option.fullName}
                </li>
              )}
              value={
                typeof formData.eventLeader === "string"
                  ? formData.eventLeader
                  : peopleData.find(
                      (p) => p.fullName === formData.eventLeader
                    ) || ""
              }
              // FIXED: Improved auto-fill logic
              onChange={(event, newValue) => {
                if (newValue) {
                  const name =
                    typeof newValue === "string"
                      ? newValue
                      : newValue?.fullName || "";

                  // For Personal Steps events (hasPersonSteps), auto-fill leaders
                  if (hasPersonSteps && !isGlobalEvent) {
                    console.log(
                      "🔄 Auto-filling leaders for Personal Steps event:",
                      {
                        eventLeader: name,
                        leader1: newValue.leader1,
                        leader12: newValue.leader12,
                        personData: newValue,
                      }
                    );

                    setFormData((prev) => ({
                      ...prev,
                      eventLeader: name,
                      eventName: name,
                      leader1: newValue.leader1 || "",
                      leader12: newValue.leader12 || "",
                    }));
                  }
                  // For regular Cell events, just set event name
                  else if (hasPersonSteps && !isGlobalEvent) {
                    setFormData((prev) => ({
                      ...prev,
                      eventLeader: name,
                      eventName: name,
                    }));
                  }
                  // For other event types, just set the leader
                  else {
                    handleChange("eventLeader", name);
                  }
                } else {
                  handleChange("eventLeader", "");
                  // Clear auto-filled fields if leader is cleared
                  if (hasPersonSteps && !isGlobalEvent) {
                    setFormData((prev) => ({
                      ...prev,
                      leader1: "",
                      leader12: "",
                    }));
                  }
                }
              }}
              onInputChange={(event, newInputValue) => {
                handleChange("eventLeader", newInputValue || "");
                if (newInputValue && newInputValue.length >= 2) {
                  fetchPeople(newInputValue);
                } else if (!newInputValue) {
                  fetchPeople("");
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Event Leader"
                  size="small"
                  required
                  sx={{ mb: 3, ...darkModeStyles.textField }}
                  error={!!errors.eventLeader}
                  helperText={
                    errors.eventLeader ||
                    (loadingPeople
                      ? "Loading..."
                      : hasPersonSteps && !isGlobalEvent
                      ? `Select leader to auto-fill hierarchy (${peopleData.length} found)`
                      : `Type to search (${peopleData.length} found)`)
                  }
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            {hasPersonSteps && !isGlobalEvent && (
              <>
                {/* Leader @1 - READ ONLY, AUTO-FILLED */}
                <TextField
                  label="Leader @1"
                  value={formData.leader1 || ""}
                  fullWidth
                  size="small"
                  required
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.leader1}
                  helperText={
                    errors.leader1 ||
                    "Auto-filled from Event Leader's hierarchy"
                  }
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Will be auto-filled when Event Leader is selected"
                />

                {/* Leader @12 - READ ONLY, AUTO-FILLED */}
                <TextField
                  label="Leader @12"
                  value={formData.leader12 || ""}
                  fullWidth
                  size="small"
                  required
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.leader12}
                  helperText={
                    errors.leader12 ||
                    "Auto-filled from Event Leader's hierarchy"
                  }
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="Will be auto-filled when Event Leader is selected"
                />
              </>
            )}

            {/* ADD THIS: Event Type Badges for Visual Feedback */}
            <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {isTicketedEvent && (
                <Chip
                  label="💰 Ticketed Event"
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {isGlobalEvent && (
                <Chip
                  label="🌍 Global Event"
                  color="info"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {hasPersonSteps && !isGlobalEvent && (
                <Chip
                  label="📊 Personal Steps Event"
                  color="secondary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {hasPersonSteps && !isGlobalEvent && (
                <Chip
                  label="👥 Cell Group"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
            {/* Description */}
            <TextField
              label="Description"
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

            {/* Buttons */}
            <Box display="flex" gap={2} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  if (isModal && typeof onClose === "function") {
                    onClose();
                  } else {
                    navigate("/events", { state: { refresh: true } });
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
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
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

          {/* Success Snackbar */}
          <Snackbar
            open={successAlert}
            autoHideDuration={3000}
            onClose={() => setSuccessAlert(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert severity="success" variant="filled">
              {successMessage}
            </Alert>
          </Snackbar>

          {/* Error Snackbar */}
          <Snackbar
            open={errorAlert}
            autoHideDuration={3000}
            onClose={() => setErrorAlert(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert severity="error" variant="filled">
              {errorMessage}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateEvents;
