import React, { useState, useEffect } from "react";
import { Search, UserPlus, X, CheckCircle, ChevronDown } from "lucide-react";

const AddPersonToEvents = ({ isOpen, onClose, onPersonAdded, event }) => {
  const [formData, setFormData] = useState({
    invitedBy: "",
    name: "",
    surname: "",
    gender: "",
    email: "",
    mobile: "",
    dob: "",
    address: "",
  });
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
  const [inviterSearch, setInviterSearch] = useState("");
  const [inviterResults, setInviterResults] = useState([]);
  const [showInviterDropdown, setShowInviterDropdown] = useState(false);
  const [loadingInviters, setLoadingInviters] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const fetchInviters = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setInviterResults([]);
      return;
    }

    try {
      setLoadingInviters(true);
      const params = new URLSearchParams();
      params.append("name", searchTerm);
      params.append("perPage", "20");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`);
      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
      }));

      setInviterResults(formatted);
    } catch (err) {
      console.error("Error fetching inviters:", err);
    } finally {
      setLoadingInviters(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchInviters(inviterSearch);
    }, 300);
    return () => clearTimeout(delay);
  }, [inviterSearch]);

  const handleInviterSelect = (person) => {
    setFormData({ ...formData, invitedBy: person.fullName });
    setInviterSearch(person.fullName);
    setShowInviterDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.surname || !formData.email) {
      setAlert({
        open: true,
        type: "error",
        message: "Please fill in required fields (Name, Surname, Email)",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: formData.name,
          Surname: formData.surname,
          Email: formData.email,
          Phone: formData.mobile,
          Gender: formData.gender,
          DateOfBirth: formData.dob,
          Address: formData.address,
          InvitedBy: formData.invitedBy,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlert({
          open: true,
          type: "success",
          message: "Person added successfully!",
        });
        
        if (typeof onPersonAdded === "function") {
          onPersonAdded(data);
        }
        
        setTimeout(() => {
          onClose();
          setFormData({
            invitedBy: "",
            name: "",
            surname: "",
            gender: "",
            email: "",
            mobile: "",
            dob: "",
            address: "",
          });
          setInviterSearch("");
          setInviterResults([]);
        }, 1500);
      } else {
        const error = await response.json();
        setAlert({
          open: true,
          type: "error",
          message: error.message || "Failed to add person",
        });
        setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      }
    } catch (error) {
      console.error("Error adding person:", error);
      setAlert({
        open: true,
        type: "error",
        message: "Something went wrong while adding person.",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
      padding: "10px",
    },
    modal: {
      background: "#fff",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "600px",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "30px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "600",
      marginBottom: "24px",
      color: "#333",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    inputGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      position: "relative",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#555",
    },
    input: {
      padding: "12px",
      fontSize: "16px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      outline: "none",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: "4px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      maxHeight: "200px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "12px",
      cursor: "pointer",
      borderBottom: "1px solid #f0f0f0",
      transition: "background 0.2s",
    },
    dropdownItemHover: {
      background: "#f8f9fa",
    },
    dropdownEmpty: {
      padding: "12px",
      color: "#999",
      textAlign: "center",
      fontSize: "14px",
    },
    radioGroup: {
      display: "flex",
      gap: "20px",
      alignItems: "center",
    },
    radioLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      cursor: "pointer",
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      marginTop: "24px",
    },
    closeBtn: {
      flex: 1,
      background: "transparent",
      border: "1px solid #ddd",
      color: "#666",
      padding: "12px 24px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
    },
    saveBtn: {
      flex: 1,
      background: "#28a745",
      color: "#fff",
      border: "none",
      padding: "12px 24px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
    },
  };

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h2 style={styles.title}>Add New Person to Event</h2>
          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Invited By *</label>
              <input
                type="text"
                value={inviterSearch}
                onChange={(e) => {
                  setInviterSearch(e.target.value);
                  setShowInviterDropdown(true);
                }}
                onFocus={() => setShowInviterDropdown(true)}
                style={styles.input}
                placeholder="Start typing to search..."
                autoComplete="off"
              />
              {showInviterDropdown && inviterSearch.length >= 2 && (
                <div style={styles.dropdown}>
                  {loadingInviters && (
                    <div style={styles.dropdownEmpty}>Loading...</div>
                  )}
                  {!loadingInviters && inviterResults.length === 0 && (
                    <div style={styles.dropdownEmpty}>No people found</div>
                  )}
                  {!loadingInviters && inviterResults.map((person) => (
                    <div
                      key={person.id}
                      style={styles.dropdownItem}
                      onClick={() => handleInviterSelect(person)}
                      onMouseEnter={(e) => e.target.style.background = "#f8f9fa"}
                      onMouseLeave={(e) => e.target.style.background = "transparent"}
                    >
                      <div style={{ fontWeight: "500" }}>{person.fullName}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{person.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Surname *</label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Gender *</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === "Male"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  />
                  Male
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === "Female"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  />
                  Female
                </label>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mobile Number *</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Date Of Birth *</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Home Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button type="button" style={styles.closeBtn} onClick={onClose}>
                CLOSE
              </button>
              <button type="submit" style={styles.saveBtn}>
                SAVE
              </button>
            </div>
          </form>
        </div>
      </div>

      {alert.open && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "16px 24px",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "500",
            zIndex: 10001,
            background: alert.type === "success" ? "#28a745" : "#dc3545",
          }}
        >
          {alert.message}
        </div>
      )}
    </>
  );
};

const AttendanceModal = ({ isOpen, onClose, onSubmit, event, onAttendanceSubmitted }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [checkedIn, setCheckedIn] = useState({});
  const [decisions, setDecisions] = useState({});
  const [decisionTypes, setDecisionTypes] = useState({});
  const [openDecisionDropdown, setOpenDecisionDropdown] = useState(null);
  const [people, setPeople] = useState([]);
  const [commonAttendees, setCommonAttendees] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [associateSearch, setAssociateSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const decisionOptions = [
    { value: "first-time", label: "First-time commitment" },
    { value: "re-commitment", label: "Re-commitment" },
  ];

  const fetchPeople = async (filter = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append("name", filter);
      params.append("perPage", "100");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`);
      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader12: p["Leader @12"] || p.leader12 || "",
        leader144: p["Leader @144"] || p.leader144 || "",
        phone: p.Phone || p.phone || "",
      }));

      setPeople(formatted);
    } catch (err) {
      console.error("Error fetching people:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommonAttendees = async (cellId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/events/cell/${cellId}/common-attendees`);
      const data = await res.json();
      const attendeesArray = data.common_attendees || [];

      const formatted = attendeesArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader12: p["Leader @12"] || p.leader12 || "",
        leader144: p["Leader @144"] || p.leader144 || "",
        phone: p.Phone || p.phone || "",
      }));

      setCommonAttendees(formatted);
    } catch (err) {
      console.error("Failed to fetch common attendees:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPeople();
      setCheckedIn({});
      setDecisions({});
      setDecisionTypes({});
      setSearchName("");
      setAssociateSearch("");
      setActiveTab(0);
      setManualHeadcount("");

      if (event && event.eventType === "cell") {
        fetchCommonAttendees(event._id || event.id);
      } else {
        setCommonAttendees([]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen && activeTab === 1) fetchPeople(associateSearch);
    }, 300);
    return () => clearTimeout(delay);
  }, [associateSearch, isOpen, activeTab]);

  const handleCheckIn = (id, name) => {
    setCheckedIn((prev) => {
      const newState = { ...prev, [id]: !prev[id] };
      if (newState[id]) {
        setAlert({
          open: true,
          type: "success",
          message: `${name} has been checked in`,
        });
        setTimeout(() => setAlert({ open: false, type: "success", message: "" }), 3000);
      } else {
        setDecisions((prev) => ({ ...prev, [id]: false }));
        setDecisionTypes((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
      return newState;
    });
  };

  const handleDecisionTypeSelect = (id, type) => {
    setDecisionTypes((prev) => ({
      ...prev,
      [id]: type,
    }));
    setDecisions((prev) => ({
      ...prev,
      [id]: true,
    }));
    setOpenDecisionDropdown(null);
  };

  const handleSave = async () => {
    const attendeesList = Object.keys(checkedIn).filter((id) => checkedIn[id]);

    if (attendeesList.length === 0) {
      setAlert({
        open: true,
        type: "error",
        message: "Please check in at least one attendee before saving.",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      return;
    }

    const eventId = event?.id || event?._id;
    if (!eventId) {
      setAlert({
        open: true,
        type: "error",
        message: "Event ID is missing, cannot submit attendance.",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      return;
    }

    // Get user info from localStorage
    const userStr = localStorage.getItem("userProfile");
    let leaderEmail = "";
    let leaderName = "";

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        leaderEmail = user.email || "";
        leaderName = user.name || user.fullName || "";
      } catch (err) {
        console.error("Error parsing user profile:", err);
      }
    }

    const allPeople = [...commonAttendees, ...people];
    const selectedAttendees = attendeesList.map((id) => {
      const person = allPeople.find((p) => p.id === id);
      return {
        id: person.id,
        name: person.fullName,
        leader12: person.leader12 || "",
        leader144: person.leader144 || "",
        decision: decisions[id] ? decisionTypes[id] || "" : "",
      };
    });

    const payload = {
      attendees: selectedAttendees,
      leaderEmail: leaderEmail,
      leaderName: leaderName,
      did_not_meet: false,
    };

    try {
      if (typeof onSubmit === "function") {
        const result = await onSubmit(payload);
        if (result?.success) {
          setAlert({
            open: true,
            type: "success",
            message: result.message || "Attendance saved successfully!",
          });
          setTimeout(() => onClose(), 1500);
        } else {
          setAlert({
            open: true,
            type: "error",
            message: result?.message || "Failed to save attendance.",
          });
          setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
        }
        return;
      }

      const response = await fetch(`${BACKEND_URL}/submit-attendance/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setAlert({
          open: true,
          type: "success",
          message: "Attendance saved successfully!",
        });

        if (typeof onAttendanceSubmitted === "function") {
          onAttendanceSubmitted(eventId);
        }

        setTimeout(() => onClose(), 1500);
      } else {
        const result = await response.json();
        setAlert({
          open: true,
          type: "error",
          message: result?.message || "Failed to save attendance.",
        });
        setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      setAlert({
        open: true,
        type: "error",
        message: "Something went wrong while saving attendance.",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
    }
  };

  const handleDidNotMeet = async () => {
    const eventId = event?.id || event?._id;
    if (!eventId) {
      setAlert({
        open: true,
        type: "error",
        message: "Event ID is missing.",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      return;
    }

    const payload = {
      status: "did-not-meet",
      did_not_meet: true,
    };

    if (onSubmit) {
      const result = await onSubmit(payload);
      if (result?.success) {
        setAlert({
          open: true,
          type: "success",
          message: result.message || "Event marked as did not meet.",
        });
        setTimeout(() => onClose(), 1500);
      } else {
        setAlert({
          open: true,
          type: "error",
          message: result?.message || "Failed to mark as did not meet.",
        });
        setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      }
    }
  };

  const handleAssociatePerson = (person) => {
    if (!commonAttendees.some((p) => p.id === person.id)) {
      setCommonAttendees((prev) => [...prev, person]);
      setAlert({
        open: true,
        type: "success",
        message: `${person.fullName} added to common attendees`,
      });
      setTimeout(() => setAlert({ open: false, type: "success", message: "" }), 3000);
    }
  };

  const handlePersonAdded = (newPerson) => {
    fetchPeople();
    if (event && event.eventType === "cell") {
      fetchCommonAttendees(event._id || event.id);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "10px",
    },
    modal: {
      position: "relative",
      background: "#fff",
      padding: "0",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "1100px",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    },
    header: {
      padding: "20px 30px",
      borderBottom: "1px solid #e0e0e0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: "24px",
      fontWeight: "600",
      margin: 0,
      color: "#333",
    },
    addPersonBtn: {
      background: "#2563eb",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
      fontWeight: "500",
    },
    tabsContainer: {
      borderBottom: "1px solid #e0e0e0",
      padding: "0 30px",
      display: "flex",
      gap: 0,
    },
    tab: {
      padding: "16px 24px",
      fontSize: "14px",
      fontWeight: "600",
      background: "none",
      border: "none",
      borderBottom: "3px solid transparent",
      cursor: "pointer",
      color: "#999",
      transition: "all 0.2s",
    },
    tabActive: {
      color: "#6366f1",
      borderBottom: "3px solid #6366f1",
    },
    contentArea: {
      flex: 1,
      overflowY: "auto",
      padding: "20px 30px",
    },
    searchBox: {
      position: "relative",
      marginBottom: "20px",
    },
    searchIcon: {
      position: "absolute",
      left: "15px",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#999",
    },
    input: {
      width: "100%",
      padding: "12px 12px 12px 45px",
      fontSize: "16px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      backgroundColor: "#fff",
      color: "#333",
      outline: "none",
      boxSizing: "border-box",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: "20px",
    },
    th: {
      textAlign: "left",
      padding: "12px",
      borderBottom: "2px solid #e0e0e0",
      fontSize: "13px",
      color: "#666",
      fontWeight: "600",
      textTransform: "uppercase",
    },
    td: {
      padding: "16px 12px",
      borderBottom: "1px solid #f0f0f0",
      fontSize: "15px",
      color: "#333",
    },
    radioCell: {
      textAlign: "center",
    },
    radioButton: {
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      border: "2px solid #6366f1",
      background: "#fff",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    },
    radioButtonChecked: {
      background: "#28a745",
      border: "2px solid #28a745",
    },
    radioButtonInner: {
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    decisionDropdown: {
      position: "relative",
      display: "inline-block",
    },
    decisionButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      background: "#f8f9fa",
      border: "1px solid #ddd",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#333",
      minWidth: "180px",
      justifyContent: "space-between",
    },
    decisionMenu: {
      position: "absolute",
      top: "100%",
      left: "0",
      marginTop: "4px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      minWidth: "180px",
    },
    decisionMenuItem: {
      padding: "10px 12px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#333",
      transition: "background 0.2s",
    },
    statsContainer: {
      display: "flex",
      gap: "20px",
      marginBottom: "20px",
    },
    statBox: {
      flex: 1,
      background: "#f8f9fa",
      padding: "20px",
      borderRadius: "8px",
      textAlign: "center",
      position: "relative",
    },
    statBoxInput: {
      flex: 1,
      background: "#f8f9fa",
      padding: "20px",
      borderRadius: "8px",
      textAlign: "center",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    headcountInput: {
      fontSize: "36px",
      fontWeight: "700",
      color: "#17a2b8",
      marginBottom: "8px",
      border: "none",
      borderRadius: "8px",
      padding: "4px 12px",
      width: "100px",
      textAlign: "center",
      background: "transparent",
      outline: "none",
    },
    statNumber: {
      fontSize: "36px",
      fontWeight: "700",
      color: "#28a745",
      marginBottom: "8px",
    },
    statLabel: {
      fontSize: "13px",
      color: "#666",
      textTransform: "uppercase",
      fontWeight: "600",
    },
    decisionBreakdown: {
      fontSize: "15px",
      color: "#666",
      marginTop: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    footer: {
      padding: "20px 30px",
      borderTop: "1px solid #e0e0e0",
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
    },
    closeBtn: {
      background: "transparent",
      border: "1px solid #ddd",
      color: "#666",
      padding: "12px 24px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
    },
    didNotMeetBtn: {
      background: "#dc3545",
      color: "#fff",
      border: "none",
      padding: "12px 24px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
    },
    saveBtn: {
      background: "#28a745",
      color: "#fff",
      border: "none",
      padding: "12px 32px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
    },
    iconButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#6366f1",
      padding: "4px",
    },
    alert: {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "16px 24px",
      borderRadius: "8px",
      color: "#fff",
      fontSize: "15px",
      fontWeight: "500",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      gap: "12px",
      minWidth: "300px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
    alertSuccess: {
      background: "#28a745",
    },
    alertError: {
      background: "#dc3545",
    },
  };

  const filteredCommonAttendees = commonAttendees.filter(
    (person) =>
      person.fullName &&
      person.fullName.toLowerCase().includes(searchName.toLowerCase())
  );

  const filteredPeople = people.filter(
    (person) =>
      person.fullName &&
      person.fullName.toLowerCase().includes(associateSearch.toLowerCase())
  );

  const [manualHeadcount, setManualHeadcount] = useState("");

  const attendeesCount = Object.values(checkedIn).filter(Boolean).length;
  const totalHeadcount = manualHeadcount || Object.keys(checkedIn).length;
  const decisionsCount = Object.values(decisions).filter(Boolean).length;

  const firstTimeCount = Object.keys(decisionTypes).filter(
    (id) => decisions[id] && decisionTypes[id] === "first-time"
  ).length;

  const reCommitmentCount = Object.keys(decisionTypes).filter(
    (id) => decisions[id] && decisionTypes[id] === "re-commitment"
  ).length;

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h1 style={styles.title}>Current Event Information</h1>
            <button
              style={styles.addPersonBtn}
              onClick={() => setShowAddPersonModal(true)}
            >
              <UserPlus size={18} />
              Add Person
            </button>
          </div>

          <div style={styles.tabsContainer}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 0 ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(0)}
            >
              CAPTURE ATTENDEES
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 1 ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab(1)}
            >
              ASSOCIATE PERSON
            </button>
          </div>

          <div style={styles.contentArea}>
            {activeTab === 0 && (
              <>
                <div style={styles.searchBox}>
                  <Search size={20} style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search Person By Name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Attendees Name</th>
                      <th style={styles.th}>Attendees Email</th>
                      <th style={styles.th}>Attendees Leader @12</th>
                      <th style={styles.th}>Attendees Leader @144</th>
                      <th style={styles.th}>Attendees Number</th>
                      <th style={{...styles.th, textAlign: "center"}}>Check In</th>
                      <th style={{...styles.th, textAlign: "center"}}>Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan="7" style={{...styles.td, textAlign: "center"}}>
                          Loading...
                        </td>
                      </tr>
                    )}
                    {!loading && filteredCommonAttendees.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{...styles.td, textAlign: "center"}}>
                          No attendees found.
                        </td>
                      </tr>
                    )}
                    {filteredCommonAttendees.map((person) => (
                      <tr key={person.id}>
                        <td style={styles.td}>{person.fullName}</td>
                        <td style={styles.td}>{person.email}</td>
                        <td style={styles.td}>{person.leader12}</td>
                        <td style={styles.td}>{person.leader144}</td>
                        <td style={styles.td}>{person.phone}</td>
                        <td style={{...styles.td, ...styles.radioCell}}>
                          <button
                            style={{
                              ...styles.radioButton,
                              ...(checkedIn[person.id] ? styles.radioButtonChecked : {}),
                            }}
                            onClick={() => handleCheckIn(person.id, person.fullName)}
                          >
                            {checkedIn[person.id] && (
                              <span style={styles.radioButtonInner}>✓</span>
                            )}
                          </button>
                        </td>
                        <td style={{...styles.td, ...styles.radioCell}}>
                          {checkedIn[person.id] ? (
                            <div style={styles.decisionDropdown}>
                              <button
                                style={styles.decisionButton}
                                onClick={() =>
                                  setOpenDecisionDropdown(
                                    openDecisionDropdown === person.id ? null : person.id
                                  )
                                }
                              >
                                <span>
                                  {decisionTypes[person.id]
                                    ? decisionOptions.find(
                                        (opt) => opt.value === decisionTypes[person.id]
                                      )?.label
                                    : "Select Decision"}
                                </span>
                                <ChevronDown size={16} />
                              </button>
                              {openDecisionDropdown === person.id && (
                                <div style={styles.decisionMenu}>
                                  {decisionOptions.map((option) => (
                                    <div
                                      key={option.value}
                                      style={styles.decisionMenuItem}
                                      onClick={() =>
                                        handleDecisionTypeSelect(person.id, option.value)
                                      }
                                      onMouseEnter={(e) =>
                                        (e.target.style.background = "#f0f0f0")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.background = "transparent")
                                      }
                                    >
                                      {option.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              style={{
                                ...styles.radioButton,
                                opacity: 0.3,
                                cursor: "not-allowed",
                              }}
                              disabled
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={styles.statsContainer}>
                  <div style={styles.statBox}>
                    <div style={styles.statNumber}>{attendeesCount}</div>
                    <div style={styles.statLabel}>Attendees</div>
                  </div>
                  <div style={styles.statBoxInput}>
                    <input
                      type="number"
                      value={manualHeadcount}
                      onChange={(e) => setManualHeadcount(e.target.value)}
                      placeholder={attendeesCount.toString()}
                      style={styles.headcountInput}
                      min="0"
                    />
                    <div style={styles.statLabel}>Total Headcounts</div>
                  </div>
                  <div style={styles.statBox}>
                    <div style={{...styles.statNumber, color: "#ffc107"}}>
                      {decisionsCount}
                    </div>
                    <div style={styles.statLabel}>Decisions</div>
                    {decisionsCount > 0 && (
                      <div style={styles.decisionBreakdown}>
                        {firstTimeCount > 0 && (
                          <span>First-time: {firstTimeCount}</span>
                        )}
                        {reCommitmentCount > 0 && (
                          <span>Re-commitment: {reCommitmentCount}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 1 && (
              <>
                <div style={styles.searchBox}>
                  <Search size={20} style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search to add person to common attendees..."
                    value={associateSearch}
                    onChange={(e) => setAssociateSearch(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Leader @12</th>
                      <th style={styles.th}>Leader @144</th>
                      <th style={styles.th}>Phone</th>
                      <th style={{...styles.th, textAlign: "center"}}>Add</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan="6" style={{...styles.td, textAlign: "center"}}>
                          Loading...
                        </td>
                      </tr>
                    )}
                    {!loading && filteredPeople.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{...styles.td, textAlign: "center"}}>
                          No people found.
                        </td>
                      </tr>
                    )}
                    {filteredPeople.map((person) => (
                      <tr key={person.id}>
                        <td style={styles.td}>{person.fullName}</td>
                        <td style={styles.td}>{person.email}</td>
                        <td style={styles.td}>{person.leader12}</td>
                        <td style={styles.td}>{person.leader144}</td>
                        <td style={styles.td}>{person.phone}</td>
                        <td style={{...styles.td, textAlign: "center"}}>
                          <button
                            style={{
                              ...styles.iconButton,
                              opacity: commonAttendees.some((p) => p.id === person.id) ? 0.3 : 1,
                              cursor: commonAttendees.some((p) => p.id === person.id) ? "not-allowed" : "pointer",
                            }}
                            onClick={() => handleAssociatePerson(person)}
                            disabled={commonAttendees.some((p) => p.id === person.id)}
                          >
                            <UserPlus size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div style={styles.footer}>
            <button style={styles.closeBtn} onClick={onClose}>
              CLOSE
            </button>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={styles.didNotMeetBtn}
                onClick={handleDidNotMeet}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#c82333")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#dc3545")}
              >
                DID NOT MEET
              </button>
              <button
                style={styles.saveBtn}
                onClick={handleSave}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#218838")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#28a745")}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      </div>

      {alert.open && (
        <div
          style={{
            ...styles.alert,
            ...(alert.type === "success" ? styles.alertSuccess : styles.alertError),
          }}
        >
          {alert.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <X size={20} />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      <AddPersonToEvents
        isOpen={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        onPersonAdded={handlePersonAdded}
        event={event}
      />
    </>
  );
};

export default AttendanceModal;