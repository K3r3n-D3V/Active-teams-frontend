import React, { useState, useEffect } from "react";
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

const CreateEvents = ({ onCancel, onEventCreated }) => {
  const [eventTypes, setEventTypes] = useState([
    "Meeting",
    "Workshop",
    "Conference",
    "Training",
  ]);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newEventType, setNewEventType] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedType, setSelectedType] = useState("Conference");

  const [formData, setFormData] = useState({
    eventType: "",
    eventName: "",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const styles = {
    container: {
      padding: "12px 16px",
      fontFamily: "Arial, sans-serif",
      background: "#f9fafb",
      minHeight: "auto",
      maxWidth: "600px",
      width: "100%",
      margin: "auto",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    header: {
      marginBottom: "12px",
    },
    headerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
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
      marginBottom: "8px",
    },
    formLabel: {
      display: "flex",
      alignItems: "center",
      fontWeight: "600",
      fontSize: "0.85rem",
      marginBottom: "4px",
      gap: "4px",
    },
    selectContainer: {
      display: "flex",
      alignItems: "center",
    },
    selectInput: {
      flexGrow: 1,
      padding: "6px 8px",
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
      minHeight: "80px",
      resize: "vertical",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
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
      gridTemplateColumns: "repeat(2, 1fr)",
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
      flexWrap: "wrap",
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
    },
    btnPrimarySubmitting: {
      background: "#000",
      color: "#fff",
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
    successAlert: {
      backgroundColor: "#34d399",
      color: "#fff",
      padding: "8px",
      marginBottom: "12px",
      borderRadius: "6px",
      textAlign: "center",
    },
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleDayChange = (day) => {
    const updatedDays = formData.recurringDays.includes(day)
      ? formData.recurringDays.filter((d) => d !== day)
      : [...formData.recurringDays, day];
    setFormData({ ...formData, recurringDays: updatedDays });
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
        (type) =>
          type.toLowerCase() === newEventType.trim().toLowerCase()
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
    if (!formData.eventType.trim()) newErrors.eventType = "Please select or add an event type.";
    if (!formData.eventName.trim()) newErrors.eventName = "Please enter an event name.";
    if (formData.isTicketed) {
      if (!formData.price.trim() || (!/^[0-9]+$/.test(formData.price.trim()) && !/^free$/i.test(formData.price.trim()))) {
        newErrors.price = "Please enter a valid price (numbers only) or 'Free'.";
      }
    }
    if (formData.recurringDays.length === 0) {
      if (!formData.date) newErrors.date = "Date is required if no recurring days.";
      if (!formData.time) newErrors.time = "Time is required if no recurring days.";
    }
    if (!formData.location.trim()) newErrors.location = "Please enter a location.";
    if (!formData.eventLeader.trim()) newErrors.eventLeader = "Please enter an event leader.";
    if (!formData.description.trim()) newErrors.description = "Please enter a description.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const payload = {
      eventType: formData.eventType,
      eventName: formData.eventName,
      price: formData.isTicketed ? (formData.price.toLowerCase() === 'free' ? 0 : Number(formData.price)) : 0,
      date: formData.recurringDays.length === 0 ? new Date(`${formData.date}T${formData.time}`).toISOString() : null,
      recurringDays: formData.recurringDays,
      location: formData.location,
      eventLeader: formData.eventLeader,
      description: formData.description,
      isTicketed: formData.isTicketed,
    };

    try {
      const response = await fetch("http://localhost:8000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = data?.detail || data || "Unknown error occurred";
        alert(`Error creating event: ${JSON.stringify(detail, null, 2)}`);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Event created successfully! Redirecting...");
      alert("✅ Event created successfully!");

      if (onEventCreated) {
        onEventCreated(data.event || data);
      }

      setTimeout(() => {
        if (onCancel) {
          onCancel();
        }
      }, 1500);
    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchEvents = async (type = formData.eventType) => {
    if (!type) return;
    try {
      const res = await fetch(`http://localhost:8000/events/type/${type}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    }
  };

  useEffect(() => {
    if (formData.eventType) fetchEvents(formData.eventType);
  }, [formData.eventType]);

  return (
    <div style={styles.container}>
      {/* ... existing header and form content remains unchanged ... */}
      {/* Form actions */}
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
            ...(isSubmitting ? styles.btnPrimarySubmitting : styles.btnPrimary),
          }}
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Creating..." : "Create Event"}
        </button>
      </div>
    </div>
  );
};

export default CreateEvents;
