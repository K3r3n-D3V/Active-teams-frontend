import React, { useState } from "react";
import { Plus, X, Calendar, Clock, MapPin, User, FileText, DollarSign, Tag } from "lucide-react";

const CreateEvents = ({ onCancel, onEventCreated, userRole = "admin" }) => {
  const [eventTypes, setEventTypes] = useState([
    "Meeting",
    "Workshop",
    "Conference",
    "Training",
  ]);
  
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newEventType, setNewEventType] = useState("");
  const [formData, setFormData] = useState({
    eventType: "",
    price: "",
    // date: "",
    time: "",
    location: "",
    recurringDays: [],
    eventLeader: "",
    description: "",
    isTicketed: false,
  });

  // Styles object
  const styles = {
    container: {
      minHeight: '100vh',
      background: '#fff',
      padding: '10px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
    },
    maxWidth: {
      maxWidth: '600px',
      margin: '0 auto'
    },
    header: {
      background: '#111',
      borderRadius: '16px 16px 0 0',
      padding: '20px',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    },
    headerContent: {
      position: 'relative',
      zIndex: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '1.8rem',
      fontWeight: '700',
      margin: 0
    },
    headerSubtitle: {
      color: '#ccc',
      fontSize: '0.95rem',
      margin: 0
    },
    closeBtn: {
      background: '#dc2626',
      border: 'none',
      color: 'white',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    formContainer: {
      background: 'white',
      borderRadius: '0 0 16px 16px',
      padding: '20px',
      border: '1px solid #e5e7eb'
    },
    formGroup: {
      marginBottom: '20px'
    },
    formLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '600',
      color: '#111',
      marginBottom: '8px',
      fontSize: '0.9rem'
    },
    formInput: {
      width: '100%',
      padding: '12px 14px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      background: '#f9fafb',
      fontSize: '0.95rem',
      outline: 'none',
      boxSizing: 'border-box'
    },
    selectContainer: {
      display: 'flex',
      gap: '8px'
    },
    selectInput: {
      flex: 1,
      padding: '12px 14px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      background: '#f9fafb',
      fontSize: '0.95rem',
      outline: 'none'
    },
    addBtn: {
      background: '#111',
      color: 'white',
      border: 'none',
      padding: '10px',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    toggleContainer: {
      background: '#f3f4f6',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    toggleSwitch: {
      position: 'relative',
      width: '50px',
      height: '24px',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    toggleSlider: {
      position: 'absolute',
      top: '3px',
      width: '18px',
      height: '18px',
      background: 'white',
      borderRadius: '50%',
      transition: 'all 0.3s ease'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    daysGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '6px',
      marginTop: '8px'
    },
    dayCard: {
      padding: '10px 6px',
      textAlign: 'center',
      border: '1px solid #ccc',
      borderRadius: '8px',
      cursor: 'pointer',
      background: 'white',
      fontSize: '0.8rem',
      fontWeight: '600'
    },
    dayCardActive: {
      background: '#dc2626',
      color: 'white',
      borderColor: '#dc2626'
    },
    textarea: {
      width: '100%',
      padding: '12px 14px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      background: '#f9fafb',
      fontSize: '0.95rem',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    actions: {
      display: 'flex',
      gap: '12px',
      paddingTop: '20px',
      borderTop: '1px solid #eee',
      marginTop: '20px'
    },
    btn: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '0.95rem',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      outline: 'none'
    },
    btnSecondary: {
      background: '#f3f4f6',
      color: '#111'
    },
    btnPrimary: {
      background: '#dc2626',
      color: 'white'
    },
    newTypeForm: {
      marginTop: '12px',
      padding: '12px',
      background: '#f9fafb',
      borderRadius: '8px',
      border: '1px dashed #ccc'
    },
    newTypeActions: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px'
    },
    btnSmall: {
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '0.85rem',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none'
    },
    btnSuccess: {
      background: '#111',
      color: 'white'
    },
    footerNote: {
      textAlign: 'center',
      color: '#555',
      marginTop: '16px',
      fontSize: '0.8rem'
    },
    accessDenied: {
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    },
    accessDeniedCard: {
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #ddd',
      padding: '20px',
      textAlign: 'center',
      maxWidth: '350px'
    },
    accessDeniedIcon: {
      width: '48px',
      height: '48px',
      background: '#fee2e2',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 12px'
    },
    accessDeniedTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#111',
      marginBottom: '6px'
    },
    accessDeniedText: {
      color: '#666'
    }
  };

  if (userRole !== "admin") {
    return (
      <div style={styles.accessDenied}>
        <div style={styles.accessDeniedCard}>
          <div style={styles.accessDeniedIcon}>
            <X style={{ width: '24px', height: '24px', color: '#dc2626' }} />
          </div>
          <h2 style={styles.accessDeniedTitle}>Access Denied</h2>
          <p style={styles.accessDeniedText}>You don't have permission to create events.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleDayChange = (day) => {
    const updatedDays = formData.recurringDays.includes(day)
      ? formData.recurringDays.filter((d) => d !== day)
      : [...formData.recurringDays, day];
    setFormData({ ...formData, recurringDays: updatedDays });
  };

  const addNewEventType = () => {
    if (newEventType.trim() && !eventTypes.includes(newEventType.trim())) {
      setEventTypes([...eventTypes, newEventType.trim()]);
      setFormData({ ...formData, eventType: newEventType.trim() });
      setNewEventType("");
      setShowNewTypeForm(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.eventType || !formData.date || !formData.time || !formData.location) {
      alert("Please fill in all required fields.");
      return;
    }
    
    alert("Event successfully created!");
    if (onEventCreated) onEventCreated(formData);
    if (onCancel) onCancel();
  };

  const days = [
    { short: "Mon", full: "Monday" },
    { short: "Tue", full: "Tuesday" },
    { short: "Wed", full: "Wednesday" },
    { short: "Thu", full: "Thursday" },
    { short: "Fri", full: "Friday" },
    { short: "Sat", full: "Saturday" },
    { short: "Sun", full: "Sunday" }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div>
              <h1 style={styles.headerTitle}>Create New Event</h1>
              <p style={styles.headerSubtitle}>Fill in the details to create your event</p>
            </div>
            <button
              style={styles.closeBtn}
              onClick={onCancel}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div style={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            {/* Event Type */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <Tag style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                Event Type *
              </label>
              <div style={styles.selectContainer}>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  style={styles.selectInput}
                  required
                >
                  <option value="">Select Event Type</option>
                  {eventTypes.map((type, i) => (
                    <option key={i} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewTypeForm(true)}
                  style={styles.addBtn}
                >
                  <Plus size={14} />
                </button>
              </div>

              {showNewTypeForm && (
                <div style={styles.newTypeForm}>
                  <input
                    type="text"
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    placeholder="Enter new event type..."
                    style={styles.formInput}
                  />
                  <div style={styles.newTypeActions}>
                    <button
                      type="button"
                      onClick={addNewEventType}
                      style={{...styles.btnSmall, ...styles.btnSuccess}}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewTypeForm(false);
                        setNewEventType("");
                      }}
                      style={{...styles.btnSmall, ...styles.btnSecondary}}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ticketed Toggle */}
            <div style={styles.formGroup}>
              <div style={styles.toggleContainer}>
                <div
                  style={{
                    ...styles.toggleSwitch,
                    background: formData.isTicketed ? '#dc2626' : '#ccc'
                  }}
                  onClick={() => setFormData({ ...formData, isTicketed: !formData.isTicketed })}
                >
                  <div
                    style={{
                      ...styles.toggleSlider,
                      left: formData.isTicketed ? '28px' : '3px'
                    }}
                  ></div>
                </div>
                <label style={{...styles.formLabel, marginBottom: 0, cursor: 'pointer'}}>
                  <DollarSign style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                  Ticketed Event
                </label>
              </div>
            </div>

            {/* Price only if ticketed */}
            {formData.isTicketed && (
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>
                  <DollarSign style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                  Price
                </label>
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g., R80 or Free"
                  style={styles.formInput}
                />
              </div>
            )}

            {/* Location */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <MapPin style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                Location *
              </label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter event location..."
                style={styles.formInput}
                required
              />
            </div>

        {/* Date and Time */}
<div style={styles.grid2}>
  <div style={styles.formGroup}>
    <label style={styles.formLabel}>
      <Calendar style={{ width: '14px', height: '14px', color: '#dc2626' }} />
      Date *
    </label>
    <input
      type="date"
      name="date"
      value={formData.date}
      onChange={handleChange}
      style={styles.formInput}
      required
    />
  </div>
  <div style={styles.formGroup}>
    <label style={styles.formLabel}>
      <Clock style={{ width: '14px', height: '14px', color: '#dc2626' }} />
      Time *
    </label>
    <input
      type="time"
      name="time"
      value={formData.time}
      onChange={handleChange}
      style={styles.formInput}
      required
    />
  </div>
</div>

{/* Recurring Days */}
<div style={styles.formGroup}>
  <label style={styles.formLabel}>
    <Calendar style={{ width: '14px', height: '14px', color: '#dc2626' }} />
    Recurring Days
  </label>
  <div style={styles.daysGrid}>
    {days.map((day) => (
      <div
        key={day.full}
        onClick={() => handleDayChange(day.full)}
        style={{
          ...styles.dayCard,
          ...(formData.recurringDays.includes(day.full) ? styles.dayCardActive : {})
        }}
      >
        {day.short}
      </div>
    ))}
  </div>
</div>

{/* Event Leader */}
<div style={styles.formGroup}>
  <label style={styles.formLabel}>
    <User style={{ width: '14px', height: '14px', color: '#dc2626' }} />
    Event Leader
  </label>
  <input
    type="text"
    name="eventLeader"
    value={formData.eventLeader}
    onChange={handleChange}
    placeholder="Enter leader's name..."
    style={styles.formInput}
  />
</div>

{/* Description */}
<div style={styles.formGroup}>
  <label style={styles.formLabel}>
    <FileText style={{ width: '14px', height: '14px', color: '#dc2626' }} />
    Description
  </label>
  <textarea
    name="description"
    value={formData.description}
    onChange={handleChange}
    placeholder="Enter event description..."
    style={styles.textarea}
  />
</div>

{/* Actions */}
<div style={styles.actions}>
  <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={onCancel}>
    Cancel
  </button>
  <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>
    Create Event
  </button>
</div>
          </form>
      </div>
    </div>
  </div>
  );
};

export default CreateEvents;



