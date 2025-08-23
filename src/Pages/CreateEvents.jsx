import React, { useState } from "react";
import {
  Plus,
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  DollarSign,
  Tag,
} from "lucide-react";

const CreateEvents = ({ onCancel, onEventCreated, userRole = "admin" }) => {
  const [eventTypes, setEventTypes] = useState([
    "Meeting",
    "Workshop",
    "Conference",
    "Training",
  ]);

  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newEventType, setNewEventType] = useState("");
  // Example combining date and time strings into ISO datetime string
// const combinedDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();

  const [formData, setFormData] = useState({
    eventType: "",
    price: "",
    date: "",
    time: "",
    location: "",
    recurringDays: [],
    eventLeader: "",
    description: "",
    isTicketed: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Styles object with blue for validation highlights, no red borders
 const styles = {
  container: {
    padding: "12px 16px",
    fontFamily: "Arial, sans-serif",
    background: "#f9fafb",
    minHeight: "auto", // instead of full viewport height
    maxWidth: "480px",
    margin: "auto",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  maxWidth: {
    maxWidth: "480px",
  },
  header: {
    marginBottom: "12px", // less than before
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: "1.5rem",
    margin: 0,
    lineHeight: 1.2,
  },
  headerSubtitle: {
    fontSize: "0.85rem",
    marginTop: "2px",
    color: "#6b7280",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "8px", // reduce from 16px
  },
  formLabel: {
    display: "flex",
    alignItems: "center",
    fontWeight: "600",
    fontSize: "0.85rem",
    marginBottom: "4px",
  },
  selectContainer: {
    display: "flex",
    alignItems: "center",
  },
  selectInput: {
    flexGrow: 1,
    padding: "6px 8px", // smaller padding
    fontSize: "0.9rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  addBtn: {
    marginLeft: "8px",
    background: "#3b82f6",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    borderRadius: "4px",
    padding: "4px 6px",
  },
  formInput: {
    width: "100%",
    padding: "6px 8px",
    fontSize: "0.9rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    padding: "6px 8px",
    fontSize: "0.9rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    minHeight: "80px", // smaller height than 5 rows default
    resize: "vertical",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px", // smaller gap
  },
  dayCard: {
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "6px 10px",
    textAlign: "center",
    fontSize: "0.8rem",
    cursor: "pointer",
    userSelect: "none",
  },
  dayCardActive: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    borderColor: "#2563eb",
  },
  toggleSwitch: {
    width: "50px",
    height: "24px",
    borderRadius: "12px",
    position: "relative",
    cursor: "pointer",
  },
  toggleSlider: {
    position: "absolute",
    top: "2px",
    width: "20px",
    height: "20px",
    backgroundColor: "#fff",
    borderRadius: "50%",
    transition: "left 0.2s",
  },
  recurringDaysContainer: {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)", // 4 columns for two rows layout (4+3)
  gap: "6px 12px",
  marginTop: "4px",
},

checkboxLabel: {
  display: "flex",
  alignItems: "center",
  fontSize: "0.9rem",
  cursor: "pointer",
  userSelect: "none",
},

checkboxInput: {
  marginRight: "6px",
  width: "16px",
  height: "16px",
  cursor: "pointer",
},

  actions: {
    marginTop: "12px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  btn: {
    padding: "8px 14px",
    fontSize: "0.9rem",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
  },
  btnPrimary: {
    background: "#3b82f6",
    color: "#fff",
    disabled: {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },
  btnSecondary: {
    background: "#e5e7eb",
    color: "#374151",
  },
  errorText: {
    fontSize: "0.75rem",
    color: "#3b82f6",
    marginTop: "4px",
  },
};


  if (userRole !== "admin") {
    return (
      <div style={styles.accessDenied}>
        <div style={styles.accessDeniedCard}>
          <div style={styles.accessDeniedIcon}>
            <X style={{ width: "24px", height: "24px", color: "#3b82f6" }} />
          </div>
          <h2 style={styles.accessDeniedTitle}>Access Denied</h2>
          <p style={styles.accessDeniedText}>
            You don't have permission to create events.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // For price, restrict to numbers or 'Free' (case insensitive)
    if (name === "price") {
      if (
        value === "" ||
        /^[0-9]*$/.test(value) ||
        /^free$/i.test(value.trim())
      ) {
        setFormData({ ...formData, [name]: value });
      }
      return;
    }
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleDayChange = (day) => {
    const updatedDays = formData.recurringDays.includes(day)
      ? formData.recurringDays.filter((d) => d !== day)
      : [...formData.recurringDays, day];
    setFormData({ ...formData, recurringDays: updatedDays });
    // Clear date/time errors if any when toggling days
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (updatedDays.length > 0) {
        delete newErrors.date;
        delete newErrors.time;
      }
      return newErrors;
    });
  };

  const addNewEventType = () => {
    if (
      newEventType.trim() &&
      !eventTypes.some(
        (type) => type.toLowerCase() === newEventType.trim().toLowerCase()
      )
    ) {
      setEventTypes([...eventTypes, newEventType.trim()]);
      setFormData({ ...formData, eventType: newEventType.trim() });
      setNewEventType("");
      setShowNewTypeForm(false);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.eventType;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.eventType.trim()) {
      newErrors.eventType = "Please select or add an event type.";
    }

    if (formData.isTicketed) {
      if (
        !formData.price.trim() ||
        (!/^[0-9]+$/.test(formData.price.trim()) &&
          !/^free$/i.test(formData.price.trim()))
      ) {
        newErrors.price =
          "Please enter a valid price (numbers only) or 'Free'.";
      }
    }

    // If no recurring days selected, date and time are required
    if (formData.recurringDays.length === 0) {
      if (!formData.date) {
        newErrors.date = "Date is required if no recurring days.";
      }
      if (!formData.time) {
        newErrors.time = "Time is required if no recurring days.";
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = "Please enter a location.";
    }
    if (!formData.eventLeader.trim()) {
      newErrors.eventLeader = "Please enter an event leader.";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Please enter a description.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);
  const combinedDateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
  try {
    const response = await fetch("http://localhost:8000/event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer ${yourAuthToken}`, // Replace with actual token if needed
      },
   body: JSON.stringify({
  eventType: formData.eventType,
  eventName: formData.eventName,  // 👈 allow any event name
  date: combinedDateTime,         // Combined date + time
  location: formData.location,
  recurringDays: formData.recurringDays,
  eventLeader: formData.eventLeader,
  description: formData.description,
  isTicketed: formData.isTicketed,
  price: formData.price,

      }),
    });

if (!response.ok) {
let errorMessage = "Error creating event.";

try {
  const errorData = await response.json();

  if (errorData.detail) {
    errorMessage += " " + errorData.detail;
  } else if (Array.isArray(errorData)) {
    errorMessage += " " + errorData.map(err => JSON.stringify(err)).join(", ");
  } else {
    errorMessage += " " + JSON.stringify(errorData, null, 2);
  }
} catch (parseError) {
  errorMessage += " Unknown error occurred.";
}

alert(errorMessage);

  setIsSubmitting(false);
  return;
}


    // ✅ SAFELY PARSE SUCCESS RESPONSE
    const responseText = await response.text();
    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.warn("Could not parse success response as JSON");
    }

    alert("Event created successfully!");
    onEventCreated(data.event);
  } catch (error) {
    alert("Network error: " + error.message);
  }

  setIsSubmitting(false);
};


  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div>
              <h1 style={styles.headerTitle}>Create Event</h1>
              <p style={styles.headerSubtitle}>
                Add a new event to your schedule
              </p>
            </div>
            <button
              style={styles.closeBtn}
              onClick={onCancel}
              aria-label="Close create event form"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </header>
    <form
  style={styles.formContainer}
  onSubmit={handleSubmit}
  noValidate
  aria-live="polite"
>
  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Creating..." : "Create Event"}
  </button>
        
          {/* Event Type */}
          <div style={styles.formGroup}>
            <label
              htmlFor="eventType"
              style={styles.formLabel}
            >
              <Tag size={16} />
              Event Type <sup style={{ color: "#3b82f6" }}>*</sup>
            </label>
            <div style={styles.selectContainer}>
              <select
                id="eventType"
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                style={{
                  ...styles.selectInput,
                  ...(errors.eventType ? styles.selectInputError : {}),
                }}
                aria-describedby={errors.eventType ? "eventTypeError" : undefined}
              >
                <option value="">-- Select event type --</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button
                type="button"
                style={styles.addBtn}
                onClick={() => setShowNewTypeForm(!showNewTypeForm)}
                aria-expanded={showNewTypeForm}
                aria-controls="newEventTypeForm"
              >
                <Plus size={20} />
              </button>
            </div>
            {errors.eventType && (
              <div id="eventTypeError" style={styles.errorText}>
                {errors.eventType}
              </div>
            )}

            {showNewTypeForm && (
              <div id="newEventTypeForm" style={styles.newTypeForm}>
                <label
                  htmlFor="newEventType"
                  style={styles.formLabel}
                >
                  New Event Type
                </label>
                <input
                  id="newEventType"
                  type="text"
                  placeholder="Enter new event type"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                  style={styles.formInput}
                  aria-describedby="newEventTypeHelp"
                />
                <div
                  id="newEventTypeHelp"
                  style={{ fontSize: "0.8rem", color: "#666" }}
                >
                  Add a new event type to the dropdown
                </div>
                <div style={styles.newTypeActions}>
                  <button
                    type="button"
                    style={{ ...styles.btnSmall, ...styles.btnSuccess }}
                    onClick={addNewEventType}
                    disabled={!newEventType.trim()}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.btnSmall,
                      background: "#ccc",
                      color: "#111",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setShowNewTypeForm(false);
                      setNewEventType("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Ticketed toggle and price */}
          <div style={styles.formGroup}>
            <label htmlFor="isTicketed" style={styles.formLabel}>
              <DollarSign size={16} />
              Ticketed Event
            </label>
            <div
              role="switch"
              tabIndex={0}
              aria-checked={formData.isTicketed}
              aria-labelledby="ticketedLabel"
              style={{
                ...styles.toggleSwitch,
                background: formData.isTicketed ? "#3b82f6" : "#ccc",
              }}
              onClick={() =>
                setFormData({ ...formData, isTicketed: !formData.isTicketed })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setFormData({ ...formData, isTicketed: !formData.isTicketed });
                  e.preventDefault();
                }
              }}
            >
              <div
                style={{
                  ...styles.toggleSlider,
                  left: formData.isTicketed ? "28px" : "3px",
                }}
              />
            </div>
            {formData.isTicketed && (
              <div style={{ marginTop: "12px" }}>
                <label
                  htmlFor="price"
                  style={styles.formLabel}
                >
                  Price <sup style={{ color: "#3b82f6" }}>*</sup>
                </label>
                <input
                  type="text"
                  name="price"
                  id="price"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={handleChange}
                  style={{
                    ...styles.formInput,
                    ...(errors.price ? styles.formInputError : {}),
                  }}
                  aria-describedby={errors.price ? "priceError" : undefined}
                />
                {errors.price && (
                  <div id="priceError" style={styles.errorText}>
                    {errors.price}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div style={{ ...styles.formGroup, ...styles.grid2 }}>
            <div>
              <label
                htmlFor="date"
                style={styles.formLabel}
              >
                <Calendar size={16} />
                Date{" "}
                {formData.recurringDays.length === 0 && (
                  <sup style={{ color: "#3b82f6" }}>*</sup>
                )}
              </label>
              <input
                type="date"
                name="date"
                id="date"
                value={formData.date}
                onChange={handleChange}
                style={{
                  ...styles.formInput,
                  ...(errors.date ? styles.formInputError : {}),
                }}
                disabled={formData.recurringDays.length > 0}
                aria-describedby={errors.date ? "dateError" : undefined}
              />
              {errors.date && (
                <div id="dateError" style={styles.errorText}>
                  {errors.date}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="time"
                style={styles.formLabel}
              >
                <Clock size={16} />
                Time{" "}
                {formData.recurringDays.length === 0 && (
                  <sup style={{ color: "#3b82f6" }}>*</sup>
                )}
              </label>
              <input
                type="time"
                name="time"
                id="time"
                value={formData.time}
                onChange={handleChange}
                style={{
                  ...styles.formInput,
                  ...(errors.time ? styles.formInputError : {}),
                }}
                disabled={formData.recurringDays.length > 0}
                aria-describedby={errors.time ? "timeError" : undefined}
              />
              {errors.time && (
                <div id="timeError" style={styles.errorText}>
                  {errors.time}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div style={styles.formGroup}>
            <label
              htmlFor="location"
              style={styles.formLabel}
            >
              <MapPin size={16} />
              Location <sup style={{ color: "#3b82f6" }}>*</sup>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={{
                ...styles.formInput,
                ...(errors.location ? styles.formInputError : {}),
              }}
              aria-describedby={errors.location ? "locationError" : undefined}
              placeholder="Enter location"
            />
            {errors.location && (
              <div id="locationError" style={styles.errorText}>
                {errors.location}
              </div>
            )}
          </div>

        {/* Recurring Days */}
<div style={styles.formGroup}>
  <label style={styles.formLabel}>
    <Calendar size={16} />
    Recurring Days
  </label>
  <div style={styles.recurringDaysContainer} role="group" aria-label="Recurring days">
    {[
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ].map((day) => (
      <label key={day} style={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="recurringDays"
          value={day}
          checked={formData.recurringDays.includes(day)}
          onChange={() => handleDayChange(day)}
          style={styles.checkboxInput}
        />
        {day}
      </label>
    ))}
  </div>
  <small style={{ color: "#666", marginTop: "6px", display: "block" }}>
    Select recurring days to repeat event weekly. Date/time inputs will be disabled.
  </small>
</div>


          {/* Event Leader */}
          <div style={styles.formGroup}>
            <label
              htmlFor="eventLeader"
              style={styles.formLabel}
            >
              <User size={16} />
              Event Leader <sup style={{ color: "#3b82f6" }}>*</sup>
            </label>
            <input
              type="text"
              id="eventLeader"
              name="eventLeader"
              value={formData.eventLeader}
              onChange={handleChange}
              style={{
                ...styles.formInput,
                ...(errors.eventLeader ? styles.formInputError : {}),
              }}
              aria-describedby={errors.eventLeader ? "eventLeaderError" : undefined}
              placeholder="Enter event leader"
            />
            {errors.eventLeader && (
              <div id="eventLeaderError" style={styles.errorText}>
                {errors.eventLeader}
              </div>
            )}
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label
              htmlFor="description"
              style={styles.formLabel}
            >
              <FileText size={16} />
              Description <sup style={{ color: "#3b82f6" }}>*</sup>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{
                ...styles.textarea,
                ...(errors.description ? styles.textareaError : {}),
              }}
              aria-describedby={errors.description ? "descriptionError" : undefined}
              placeholder="Enter event description"
              rows={5}
            />
            {errors.description && (
              <div id="descriptionError" style={styles.errorText}>
                {errors.description}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              type="button"
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...styles.btn,
                ...styles.btnPrimary,
                ...(isSubmitting ? styles.btnPrimary.disabled : {}),
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
          <div style={styles.footerNote}>
            * Required fields
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvents;
