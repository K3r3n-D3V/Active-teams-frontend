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
  Typography,
  useTheme,
  IconButton,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const CreateEvents = ({
  user,
  isModal = false,
  onClose,
  eventTypes = [],
  selectedEventType,
  selectedEventTypeObj = null,
  fetchEvents,
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

  const { isGlobal: isGlobalEvent, isTicketed: isTicketedEvent, hasPersonSteps } =
    eventTypeFlags;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [peopleData, setPeopleData] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [priceTiers, setPriceTiers] = useState([]);

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
  });

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

  useEffect(() => {
  if (selectedEventTypeObj) {
    console.log('Selected Event Type Obj:', selectedEventTypeObj); // Add this for debugging
    
    setEventTypeFlags({
      isGlobal: !!selectedEventTypeObj.isGlobal,
      isTicketed: !!selectedEventTypeObj.isTicketed,
      hasPersonSteps: !!selectedEventTypeObj.hasPersonSteps, // Make sure this is set
    });

    setFormData((prev) => ({
      ...prev,
      eventType: selectedEventTypeObj.name || prev.eventType,
    }));
  } else if (selectedEventType) {
    setFormData((prev) => ({
      ...prev,
      eventType: selectedEventType,
    }));
  }
}, [selectedEventTypeObj, selectedEventType]);

// Add this useEffect to debug
useEffect(() => {
  console.log('Current eventTypeFlags:', eventTypeFlags);
  console.log('Should show leader fields:', hasPersonSteps && !isGlobalEvent);
}, [eventTypeFlags, hasPersonSteps, isGlobalEvent]);

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

const fetchPeople = async (filter = "") => {
  try {
    setLoadingPeople(true);
    const params = new URLSearchParams();
    params.append("perPage", "1000");
    if (filter) params.append("name", filter); 

    const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    const peopleArray = data.people || data.results || data || [];

    const formatted = peopleArray.map((p) => ({
      id: p._id || p.id || Math.random(),
      fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
      email: p.Email || p.email || "",
      leader1: p["Leader @1"] || p.leader1 || "",
      leader12: p["Leader @12"] || p.leader12 || "",
    }));

    setPeopleData(formatted);
    
  } catch (err) {
    console.error("Error fetching people:", err);
    setPeopleData([]);
  } finally {
    setLoadingPeople(false);
  }
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
          data.recurringDays = Array.isArray(data.recurring_day) ? data.recurring_day : [];
        }

        if (data.isTicketed !== undefined) {
          setEventTypeFlags(prev => ({
            ...prev,
            isTicketed: !!data.isTicketed
          }));
        }

        if (data.isTicketed) {
          console.log("Setting price tiers for ticketed event:", data.priceTiers);
          if (data.priceTiers && Array.isArray(data.priceTiers) && data.priceTiers.length > 0) {
            const formattedPriceTiers = data.priceTiers.map(tier => ({
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

    if (!isGlobalEvent) {
      if (hasPersonSteps && formData.recurringDays.length === 0) {
        newErrors.recurringDays = "Select at least one recurring day";
      }

      if (!hasPersonSteps) {
        if (!formData.date) newErrors.date = "Date is required";
        if (!formData.time) newErrors.time = "Time is required";
      }

      if (isTicketedEvent) {
        if (priceTiers.length === 0) {
          newErrors.priceTiers = "Add at least one price tier for ticketed events";
        } else {
          priceTiers.forEach((tier, index) => {
            if (!tier.name) newErrors[`tier_${index}_name`] = "Price name is required";
            if (tier.price === "" || isNaN(Number(tier.price)) || Number(tier.price) < 0)
              newErrors[`tier_${index}_price`] = "Valid price is required";
            if (!tier.ageGroup) newErrors[`tier_${index}_ageGroup`] = "Age group is required";
            if (!tier.memberType) newErrors[`tier_${index}_memberType`] = "Member type is required";
            if (!tier.paymentMethod) newErrors[`tier_${index}_paymentMethod`] = "Payment method is required";
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
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const eventTypeToSend = selectedEventTypeObj?.name || selectedEventType || formData.eventType || "";

      if (!eventTypeToSend) {
        toast.error("Event type is required");
        setIsSubmitting(false);
        return;
      }

      console.log('Creating event with type:', eventTypeToSend);

let dayValue = "";

if (formData.date) {
  dayValue = getDayFromDate(formData.date);
} else if (formData.recurringDays.length > 0) {
  // Fallback: if no date but has recurring days, use first recurring day
  dayValue = formData.recurringDays[0];
} else {
 
  dayValue = "One-time";
}

      const payload = {
  UUID: generateUUID(),
  eventTypeName: eventTypeToSend,  // Backend expects this field name
  eventName: formData.eventName,
  isTicketed: !!isTicketedEvent,
  isGlobal: !!isGlobalEvent,
  hasPersonSteps: !!hasPersonSteps,
  location: formData.location,
  eventLeader: formData.eventLeader,
  eventLeaderName: formData.eventLeader,  // Backend uses this
  eventLeaderEmail: user?.email || "",    // Backend uses this
  description: formData.description,
  userEmail: user?.email || "",           // Backend uses this
  recurring_day: formData.recurringDays,
  day: dayValue,
  status: "open",
  leader1: formData.leader1 || "",
  leader12: formData.leader12 || "",
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

      console.log('Final Payload:', payload);

      const token = localStorage.getItem("token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      const response = eventId
        ? await axios.put(`${BACKEND_URL.replace(/\/$/, "")}/events/${eventId}`, payload, { headers })
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
              timestamp: Date.now()
            }
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
          errorMsg = "Validation errors: " + errorData.detail.map(errorObj => {
            if (errorObj.msg) return errorObj.msg;
            if (errorObj.loc && errorObj.msg) return `${errorObj.loc.join('.')}: ${errorObj.msg}`;
            return JSON.stringify(errorObj);
          }).join(', ');
        }
        else if (errorData.detail && typeof errorData.detail === 'object') {
          errorMsg = errorData.detail.msg || JSON.stringify(errorData.detail);
        }
        else if (errorData.message) {
          errorMsg = errorData.message;
        }
        else if (errorData.detail) {
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
          borderColor: isDarkMode ? theme.palette.divider : "rgba(0, 0, 0, 0.23)",
        },
        "&:hover fieldset": {
          borderColor: isDarkMode ? theme.palette.primary.light : "rgba(0, 0, 0, 0.87)",
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
      "& .MuiInputLabel-root": {
        color: theme.palette.text.secondary,
        "&.Mui-focused": {
          color: theme.palette.primary.main,
        },
        "&.MuiInputLabel-shrink": {
          color: theme.palette.text.secondary,
        },
      },
      "& .MuiInputAdornment-root .MuiSvgIcon-root": {
        color: theme.palette.text.secondary,
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
          borderColor: isDarkMode ? theme.palette.divider : "rgba(0, 0, 0, 0.23)",
        },
        "&:hover fieldset": {
          borderColor: isDarkMode ? theme.palette.primary.light : "rgba(0, 0, 0, 0.87)",
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

          <form onSubmit={handleSubmit}>
            <TextField
              label="Event Type *"
              value={formData.eventType}
              fullWidth
              size="small"
              sx={{ mb: 3, ...darkModeStyles.textField }}
              InputProps={{ readOnly: true }}
              disabled
            />

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
                  <Typography
                    variant="h6"
                    sx={darkModeStyles.sectionTitle}
                  >
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
                      onChange={(e) =>
                        handlePriceTierChange(index, "name", e.target.value)
                      }
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
                      onChange={(e) =>
                        handlePriceTierChange(index, "price", e.target.value)
                      }
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
                      onChange={(e) =>
                        handlePriceTierChange(index, "ageGroup", e.target.value)
                      }
                      fullWidth
                      size="small"
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      error={!!errors[`tier_${index}_ageGroup`]}
                      helperText={errors[`tier_${index}_ageGroup`]}
                    />

                    <TextField
                      label="Member Type *"
                      value={tier.memberType}
                      onChange={(e) =>
                        handlePriceTierChange(
                          index,
                          "memberType",
                          e.target.value
                        )
                      }
                      fullWidth
                      size="small"
                      sx={{ mb: 2, ...darkModeStyles.textField }}
                      error={!!errors[`tier_${index}_memberType`]}
                      helperText={errors[`tier_${index}_memberType`]}
                    />

                    <TextField
                      label="Payment Method *"
                      value={tier.paymentMethod}
                      onChange={(e) =>
                        handlePriceTierChange(
                          index,
                          "paymentMethod",
                          e.target.value
                        )
                      }
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

            <Box
              display="flex"
              gap={2}
              flexDirection={{ xs: "column", sm: "row" }}
              mb={3}
            >
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
              <Typography
                fontWeight="bold"
                mb={1}
                sx={darkModeStyles.sectionTitle}
              >
                Recurring Days {hasPersonSteps && !isGlobalEvent && <span style={{ color: "red" }}>*</span>}
              </Typography>
              <Box
                display="flex"
                flexWrap="wrap"
                gap={2}
                sx={darkModeStyles.daysContainer}
              >
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
                  />
                ))}
              </Box>
              {errors.recurringDays && (
                <Typography variant="caption" sx={darkModeStyles.errorText}>
                  {errors.recurringDays}
                </Typography>
              )}
            </Box>

            <TextField
              label="Location *"
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

            <Box sx={{ mb: 3, position: 'relative' }}>
              <TextField
                label="Event Leader *"
                value={formData.eventLeader}
                onChange={(e) => {
                  handleChange("eventLeader", e.target.value);
                  if (e.target.value.length >= 2) {
                    fetchPeople(e.target.value);
                  } else {
                    setPeopleData([]);
                  }
                }}
                onFocus={() => {
                  if (formData.eventLeader.length === 0) {
                    setPeopleData([]);
                  }
                }}
                fullWidth
                size="small"
                sx={darkModeStyles.textField}
                error={!!errors.eventLeader}
                helperText={errors.eventLeader || (peopleData.length > 0 ? `${peopleData.length} people found` : "Type to search for people")}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Type name to search..."
              />
              
              {peopleData.length > 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  backgroundColor: isDarkMode ? theme.palette.background.paper : '#fff',
                  border: `1px solid ${isDarkMode ? theme.palette.divider : '#ccc'}`,
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  mt: 0.5,
                }}>
                  {peopleData.map((person) => (
                    <Box
                      key={person.id || `${person.fullName}-${person.email}`}
                      sx={{
                        padding: '12px',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${isDarkMode ? theme.palette.divider : '#f0f0f0'}`,
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f5f5f5',
                        },
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      }}
                      onClick={() => {
                        const selectedName = person.fullName;
                        
                        if (hasPersonSteps && !isGlobalEvent) {
                          setFormData((prev) => ({
                            ...prev,
                            eventLeader: selectedName,
                            eventName: selectedName,
                            leader1: person.leader1 || "",
                            leader12: person.leader12 || "",
                          }));
                        } else {
                          handleChange("eventLeader", selectedName);
                        }
                        setPeopleData([]);
                      }}
                    >
                      <Typography variant="body1" fontWeight="500">
                        {person.fullName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {person.email}
                        {person.leader1 && ` • L@1: ${person.leader1}`}
                        {person.leader12 && ` • L@12: ${person.leader12}`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
              
              {loadingPeople && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Searching...
                </Typography>
              )}
            </Box>

            {hasPersonSteps && !isGlobalEvent && (
              <>
                <TextField
                  label="Leader @1 *"
                  value={formData.leader1 || ""}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.leader1}
                  helperText={errors.leader1}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Leader @12 *"
                  value={formData.leader12 || ""}
                  fullWidth
                  size="small"
                  sx={{ mb: 2, ...darkModeStyles.textField }}
                  error={!!errors.leader12}
                  helperText={errors.leader12}
                  InputProps={{ readOnly: true }}
                />
              </>
            )}

            <Box sx={{ mb: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
              {isTicketedEvent && <Chip label="Ticketed Event" color="warning" size="small" />}
              {isGlobalEvent && <Chip label="Global Event" color="info" size="small" />}
              {hasPersonSteps && !isGlobalEvent && <Chip label="Personal Steps Event" color="secondary" size="small" />}
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
                  bgcolor: "primary.main",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "primary.dark" },
                  "&:disabled": {
                    bgcolor: isDarkMode ? "#333" : "#ccc",
                    color: isDarkMode ? "#666" : "#999",
                  },
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