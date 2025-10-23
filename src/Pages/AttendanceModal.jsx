import React, { useState, useEffect } from "react";
import { Search, UserPlus, X, CheckCircle, ChevronDown, Menu, ArrowLeft } from "lucide-react";

const AddPersonToEvents = ({ isOpen, onClose, onPersonAdded }) => {
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
  const [showLeaderModal, setShowLeaderModal] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const fetchInviters = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setInviterResults([]);
      return;
    }

    try {
      setLoadingInviters(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append("name", searchTerm);
      params.append("perPage", "20");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });
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

  const validateForm = () => {
    if (!formData.name || !formData.surname || !formData.email) {
      setAlert({
        open: true,
        type: "error",
        message: "Please fill in required fields (Name, Surname, Email)",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      setShowLeaderModal(true);
    }
  };

  const handleSubmit = async (leaderInfo) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Transform data to match backend expectations - using CAPITAL field names
      const personData = {
        Name: formData.name.trim(),
        Surname: formData.surname.trim(),
        Email: formData.email.toLowerCase().trim(),
        Phone: formData.mobile || "",
        Address: formData.address || "",
        Gender: formData.gender || "",
        DateOfBirth: formData.dob || "",
        InvitedBy: formData.invitedBy || "",
        "Leader @1": leaderInfo.leader1 || "",
        "Leader @12": leaderInfo.leader12 || "",
        "Leader @144": leaderInfo.leader144 || "",
        "Leader @1728": "", // Empty for now
        Stage: "Win", // Default stage as per backend
      };

      console.log("📤 Sending person data to backend:", personData);

      const response = await fetch(`${BACKEND_URL}/people`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(personData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Person created successfully:", data);

        setAlert({
          open: true,
          type: "success",
          message: "Person added successfully!",
        });

        if (typeof onPersonAdded === "function") {
          onPersonAdded(data.person || data); // Pass the created person data
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
          setShowLeaderModal(false);
        }, 1500);
      } else {
        const error = await response.json();
        console.error("❌ Add person error:", error);

        // Handle validation errors properly
        let errorMessage = "Failed to add person";
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map(err => err.msg || err).join(', ');
          }
        }

        setAlert({
          open: true,
          type: "error",
          message: errorMessage,
        });
        setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      }
    } catch (error) {
      console.error("❌ Network error adding person:", error);
      setAlert({
        open: true,
        type: "error",
        message: "Network error: Could not connect to server",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
    }
  };
  const handleClose = () => {
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
    setShowLeaderModal(false);
    onClose();
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
      padding: "20px",
    },
    title: {
      fontSize: "clamp(20px, 4vw, 24px)",
      fontWeight: "600",
      marginBottom: "20px",
      color: "#333",
      textAlign: "center",
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
      width: "100%",
      boxSizing: "border-box",
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
      flexWrap: "wrap",
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
      flexWrap: "wrap",
    },
    closeBtn: {
      flex: "1 1 120px",
      background: "transparent",
      border: "1px solid #ddd",
      color: "#666",
      padding: "12px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      minWidth: "120px",
    },
    nextBtn: {
      flex: "1 1 120px",
      background: "#6366f1",
      color: "#fff",
      border: "none",
      padding: "12px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      minWidth: "120px",
    },
  };

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h2 style={styles.title}>Create New Person</h2>
          <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px',
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '10px'
            }}>
              <div style={{ fontWeight: '600', color: '#333' }}>NEW PERSON INFO</div>
              <div style={{ fontWeight: '600', color: '#333' }}>LEADER INFO</div>
            </div>

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
              <label style={styles.label}>Gender **</label>
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
              <button type="button" style={styles.closeBtn} onClick={handleClose}>
                CANCEL
              </button>
              <button type="button" style={styles.nextBtn} onClick={handleNext}>
                NEXT
              </button>
            </div>
          </form>
        </div>
      </div>

      {showLeaderModal && (
        <LeaderSelectionModal
          isOpen={showLeaderModal}
          onClose={() => setShowLeaderModal(false)}
          onBack={() => setShowLeaderModal(false)}
          onSubmit={handleSubmit}
          personData={formData}
        />
      )}

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
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          {alert.message}
        </div>
      )}
    </>
  );
};

const LeaderSelectionModal = ({ isOpen, onBack, onSubmit, personData }) => {
  const [leaderData, setLeaderData] = useState({
    leader1: "",
    leader12: "",
    leader144: ""
  });

  const [leaderSearches, setLeaderSearches] = useState({
    leader1: "",
    leader12: "",
    leader144: ""
  });

  const [leaderResults, setLeaderResults] = useState({
    leader1: [],
    leader12: [],
    leader144: []
  });

  const [showDropdowns, setShowDropdowns] = useState({
    leader1: false,
    leader12: false,
    leader144: false,
  });

  const [loadingLeaders, setLoadingLeaders] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const fetchLeaders = async (searchTerm, leaderField) => {
    if (!searchTerm || searchTerm.length < 2) {
      setLeaderResults(prev => ({ ...prev, [leaderField]: [] }));
      return;
    }

    try {
      setLoadingLeaders(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append("name", searchTerm);
      params.append("perPage", "20");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });
      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p.leader1 || "",
        leader12: p["Leader @12"] || p.leader12 || "",
        leader144: p["Leader @144"] || p.leader144 || "",
      }));

      setLeaderResults(prev => ({ ...prev, [leaderField]: formatted }));
    } catch (err) {
      console.error("Error fetching leaders:", err);
    } finally {
      setLoadingLeaders(false);
    }
  };

  useEffect(() => {
    const delays = {};

    Object.keys(leaderSearches).forEach(field => {
      if (delays[field]) clearTimeout(delays[field]);

      delays[field] = setTimeout(() => {
        if (leaderSearches[field].length >= 2) {
          fetchLeaders(leaderSearches[field], field);
        }
      }, 300);
    });

    return () => {
      Object.values(delays).forEach(delay => clearTimeout(delay));
    };
  }, [leaderSearches]);

  const handleLeaderSelect = (person, leaderField) => {
    setLeaderData(prev => ({
      ...prev,
      [leaderField]: person.fullName
    }));
    setLeaderSearches(prev => ({
      ...prev,
      [leaderField]: person.fullName
    }));
    setShowDropdowns(prev => ({ ...prev, [leaderField]: false }));
  };

  const handleLeaderSearchChange = (value, leaderField) => {
    setLeaderSearches(prev => ({ ...prev, [leaderField]: value }));
    setLeaderData(prev => ({ ...prev, [leaderField]: value }));
    setShowDropdowns(prev => ({ ...prev, [leaderField]: true }));
  };

  const handleSave = () => {
    onSubmit(leaderData);
  };

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
      zIndex: 10001,
      padding: "10px",
    },
    modal: {
      background: "#fff",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "20px",
    },
    title: {
      fontSize: "clamp(20px, 4vw, 24px)",
      fontWeight: "600",
      marginBottom: "20px",
      color: "#333",
      textAlign: "center",
    },
    headerSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px',
      borderBottom: '1px solid #e0e0e0',
      paddingBottom: '10px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
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
      width: "100%",
      boxSizing: "border-box",
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
    dropdownEmpty: {
      padding: "12px",
      color: "#999",
      textAlign: "center",
      fontSize: "14px",
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      marginTop: "24px",
      flexWrap: "wrap",
    },
    backBtn: {
      flex: "1 1 120px",
      background: "transparent",
      border: "1px solid #ddd",
      color: "#666",
      padding: "12px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      minWidth: "120px",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    saveBtn: {
      flex: "1 1 120px",
      background: "#28a745",
      color: "#fff",
      border: "none",
      padding: "12px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      minWidth: "120px",
    },
  };

  const renderLeaderDropdown = (leaderField) => {
    if (!showDropdowns[leaderField] || leaderSearches[leaderField].length < 2) {
      return null;
    }

    return (
      <div style={styles.dropdown}>
        {loadingLeaders && (
          <div style={styles.dropdownEmpty}>Loading...</div>
        )}
        {!loadingLeaders && leaderResults[leaderField].length === 0 && (
          <div style={styles.dropdownEmpty}>No people found</div>
        )}
        {!loadingLeaders && leaderResults[leaderField].map((person) => (
          <div
            key={`${leaderField}-${person.id}`}
            style={styles.dropdownItem}
            onClick={() => handleLeaderSelect(person, leaderField)}
            onMouseEnter={(e) => e.target.style.background = "#f8f9fa"}
            onMouseLeave={(e) => e.target.style.background = "transparent"}
          >
            <div style={{ fontWeight: "500" }}>{person.fullName}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {person.email} • {person[leaderField] || `No ${leaderField}`}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Create New Person</h2>

        <div style={styles.headerSection}>
          <div style={{ fontWeight: '600', color: '#999' }}>NEW PERSON INFO</div>
          <div style={{ fontWeight: '600', color: '#333' }}>LEADER INFO</div>
        </div>

        <div style={{ height: '2px', background: '#e0e0e0', margin: '20px 0' }}></div>

        <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Leader @1</label>
            <input
              type="text"
              value={leaderSearches.leader1}
              onChange={(e) => handleLeaderSearchChange(e.target.value, 'leader1')}
              onFocus={() => setShowDropdowns(prev => ({ ...prev, leader1: true }))}
              style={styles.input}
              placeholder="Leader @1..."
              autoComplete="off"
            />
            {renderLeaderDropdown('leader1')}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Leader @12</label>
            <input
              type="text"
              value={leaderSearches.leader12}
              onChange={(e) => handleLeaderSearchChange(e.target.value, 'leader12')}
              onFocus={() => setShowDropdowns(prev => ({ ...prev, leader12: true }))}
              style={styles.input}
              placeholder="Leader @12..."
              autoComplete="off"
            />
            {renderLeaderDropdown('leader12')}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Leader @144</label>
            <input
              type="text"
              value={leaderSearches.leader144}
              onChange={(e) => handleLeaderSearchChange(e.target.value, 'leader144')}
              onFocus={() => setShowDropdowns(prev => ({ ...prev, leader144: true }))}
              style={styles.input}
              placeholder="Leader @144..."
              autoComplete="off"
            />
            {renderLeaderDropdown('leader144')}
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.backBtn}
              onClick={onBack}
            >
              <ArrowLeft size={16} />
              BACK
            </button>
            <button
              type="button"
              style={styles.saveBtn}
              onClick={handleSave}
            >
              SAVE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AttendanceModal = ({ isOpen, onClose, onSubmit, event, onAttendanceSubmitted, currentUser }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [checkedIn, setCheckedIn] = useState({});
  const [decisions, setDecisions] = useState({});
  const [decisionTypes, setDecisionTypes] = useState({});
  const [openDecisionDropdown, setOpenDecisionDropdown] = useState(null);
  const [priceTiers, setPriceTiers] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [paidAmounts, setPaidAmounts] = useState({});
  const [openPriceTierDropdown, setOpenPriceTierDropdown] = useState(null);
  const [openPaymentDropdown, setOpenPaymentDropdown] = useState(null);
  const [people, setPeople] = useState([]);
  const [commonAttendees, setCommonAttendees] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [associateSearch, setAssociateSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [manualHeadcount, setManualHeadcount] = useState("");
  const [didNotMeet, setDidNotMeet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [leader1Filter, setLeader1Filter] = useState("");
  const [leader12Filter, setLeader12Filter] = useState("");
  const [leader144Filter, setLeader144Filter] = useState("");
  const [leader1728Filter, setLeader1728Filter] = useState("");
  const [showDidNotMeetConfirm, setShowDidNotMeetConfirm] = useState(false);
  const [persistentCommonAttendees, setPersistentCommonAttendees] = useState([]);
  const [peopleCache, setPeopleCache] = useState({});

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const isTicketedEvent = event?.isTicketed || false;
  const eventPriceTiers = event?.priceTiers || [];

  const decisionOptions = [
    { value: "first-time", label: "First-time commitment" },
    { value: "re-commitment", label: "Re-commitment" },
  ];

  const availablePaymentMethods = [...new Set(eventPriceTiers.map(t => t.paymentMethod))];

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (event) {
      const eventId = event._id || event.id;
      const storedAttendees = localStorage.getItem(`commonAttendees_${eventId}`);
      if (storedAttendees) {
        try {
          setPersistentCommonAttendees(JSON.parse(storedAttendees));
        } catch (error) {
          console.error("Error loading persistent attendees:", error);
        }
      }
    }
  }, [event]);

  const fetchPeople = async (filter = "", leader1 = "", leader12 = "", leader144 = "", leader1728 = "") => {
    // Create a cache key based on all search parameters
    const cacheKey = `${filter}-${leader1}-${leader12}-${leader144}-${leader1728}`;

    // Check if we have cached results for this exact search
    if (peopleCache[cacheKey]) {
      console.log("📦 Using cached results for:", cacheKey);
      setPeople(peopleCache[cacheKey]);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();

      if (filter && filter.trim().length > 0) {
        params.append("name", filter.trim());
      }

      const leaderFilters = [];
      if (leader1 && leader1.trim().length > 0) leaderFilters.push(leader1.trim());
      if (leader12 && leader12.trim().length > 0) leaderFilters.push(leader12.trim());
      if (leader144 && leader144.trim().length > 0) leaderFilters.push(leader144.trim());
      if (leader1728 && leader1728.trim().length > 0) leaderFilters.push(leader1728.trim());

      if (leaderFilters.length > 0) {
        params.append("leaders", leaderFilters.join(","));
      }

      params.append("perPage", "50");
      params.append("page", "1");

      console.log("🔍 Fetching people with params:", params.toString());

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      console.log(`✅ Found ${peopleArray.length} people`);

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p.leader1 || "",
        leader12: p["Leader @12"] || p.leader12 || "",
        leader144: p["Leader @144"] || p.leader144 || "",
        leader1728: p["Leader @1728"] || p.leader1728 || "",
        phone: p.Phone || p.phone || "",
      }));

      // Cache the results
      setPeopleCache(prev => ({
        ...prev,
        [cacheKey]: formatted
      }));

      setPeople(formatted);
    } catch (err) {
      console.error("Error fetching people:", err);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommonAttendees = async (cellId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${BACKEND_URL}/events/cell/${cellId}/common-attendees`, { headers });
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

  const savePersistentCommonAttendees = (attendees) => {
    if (event) {
      const eventId = event._id || event.id;
      localStorage.setItem(`commonAttendees_${eventId}`, JSON.stringify(attendees));
    }
  };

  const loadExistingAttendance = async () => {
    if (!event) return;

    const eventId = event._id || event.id;

    console.log("📥 Loading attendance data for event:", eventId);
    console.log("   Event status:", event.status);
    console.log("   Event attendees count:", event.attendees?.length || 0);

    const hasCurrentWeekData =
      event.status === 'complete' ||
      event.status === 'did_not_meet' ||
      (event.attendees && event.attendees.length > 0);

    if (hasCurrentWeekData) {
      console.log("✅ Current week HAS data - loading checked state");

      const newCheckedIn = {};
      const newDecisions = {};
      const newDecisionTypes = {};
      const newPriceTiers = {};
      const newPaymentMethods = {};
      const newPaidAmounts = {};

      if (event.attendees && Array.isArray(event.attendees)) {
        event.attendees.forEach(attendee => {
          if (attendee.id) {
            newCheckedIn[attendee.id] = true;

            if (attendee.decision) {
              newDecisions[attendee.id] = true;
              newDecisionTypes[attendee.id] = attendee.decision;
            }

            if (isTicketedEvent) {
              if (attendee.priceTier) {
                newPriceTiers[attendee.id] = {
                  name: attendee.priceTier,
                  price: attendee.price || 0,
                  ageGroup: attendee.ageGroup || "",
                  memberType: attendee.memberType || ""
                };
              }
              if (attendee.paymentMethod) {
                newPaymentMethods[attendee.id] = attendee.paymentMethod;
              }
              if (attendee.paid !== undefined) {
                newPaidAmounts[attendee.id] = attendee.paid;
              }
            }
          }
        });
      }

      setCheckedIn(newCheckedIn);
      setDecisions(newDecisions);
      setDecisionTypes(newDecisionTypes);
      setPriceTiers(newPriceTiers);
      setPaymentMethods(newPaymentMethods);
      setPaidAmounts(newPaidAmounts);

      if (event.totalHeadcount) {
        setManualHeadcount(event.totalHeadcount.toString());
      }

      if (event.did_not_meet) {
        setDidNotMeet(true);
      }

      console.log("✅ Loaded current week state (checked):", {
        checkedCount: Object.keys(newCheckedIn).length
      });

    } else {
      console.log("🆕 New week detected - fetching last week's attendees (unchecked)");

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${BACKEND_URL}/events/${eventId}/last-attendance`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.has_previous_attendance && data.attendees) {
            console.log("📋 Found previous week's attendees:", data.attendees.length);
            console.log("   Last week:", data.last_week);

            const previousAttendees = data.attendees.map(attendee => ({
              id: attendee.id,
              fullName: attendee.name || attendee.fullName || "",
              email: attendee.email || "",
              leader12: attendee.leader12 || "",
              leader144: attendee.leader144 || "",
              phone: attendee.phone || ""
            }));

            const merged = [...persistentCommonAttendees];
            previousAttendees.forEach(prevAttendee => {
              if (!merged.some(p => p.id === prevAttendee.id)) {
                merged.push(prevAttendee);
              }
            });

            setPersistentCommonAttendees(merged);
            savePersistentCommonAttendees(merged);

            console.log("✅ Pre-populated names from last week (UNCHECKED)");
          } else {
            console.log("ℹ️ No previous attendance found - starting fresh");
          }
        } else {
          console.log("⚠️ Could not fetch last attendance:", response.status);
        }
      } catch (error) {
        console.error("❌ Error fetching last attendance:", error);
      }

      setCheckedIn({});
      setDecisions({});
      setDecisionTypes({});
      setPriceTiers({});
      setPaymentMethods({});
      setPaidAmounts({});
      setManualHeadcount("");
      setDidNotMeet(false);

      console.log("✅ Ready for new week - all states cleared");
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      console.log("🎯 Modal opened with event:", event);

      setSearchName("");
      setAssociateSearch("");
      setActiveTab(0);
      setShowMobileMenu(false);

      loadExistingAttendance();
      fetchPeople();

      if (event.eventType === "cell") {
        fetchCommonAttendees(event._id || event.id);
      } else {
        setCommonAttendees([]);
      }

      if (event.did_not_meet) {
        setDidNotMeet(true);
      }
    }
  }, [isOpen, event]);
  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen && activeTab === 1) {
        // Only search if we have at least 2 characters or no search term
        if (associateSearch.length >= 2 || associateSearch.length === 0) {
          fetchPeople(associateSearch, leader1Filter, leader12Filter, leader144Filter, leader1728Filter);
        }
      }
    }, 200); // Reduced from 300ms to 200ms for faster response
    return () => clearTimeout(delay);
  }, [associateSearch, isOpen, activeTab, leader1Filter, leader12Filter, leader144Filter, leader1728Filter]);

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
        setAlert({
          open: true,
          type: "warning",
          message: `You have unchecked ${name}`,
        });
        setTimeout(() => setAlert({ open: false, type: "warning", message: "" }), 3000);

        setDecisions((prev) => ({ ...prev, [id]: false }));
        setDecisionTypes((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        setPriceTiers((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        setPaymentMethods((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        setPaidAmounts((prev) => {
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

  const handlePriceTierSelect = (id, tierIndex) => {
    const selectedTier = eventPriceTiers[tierIndex];
    setPriceTiers((prev) => ({
      ...prev,
      [id]: {
        name: selectedTier.name,
        price: parseFloat(selectedTier.price),
        ageGroup: selectedTier.ageGroup,
        memberType: selectedTier.memberType,
      }
    }));
    setOpenPriceTierDropdown(null);
  };

  const handlePaymentMethodSelect = (id, method) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [id]: method
    }));
    setOpenPaymentDropdown(null);
  };

  const handlePaidAmountChange = (id, value) => {
    const numValue = parseFloat(value) || 0;
    setPaidAmounts((prev) => ({
      ...prev,
      [id]: numValue
    }));
  };

  const calculateOwing = (id) => {
    const price = priceTiers[id]?.price || 0;
    const paid = paidAmounts[id] || 0;
    return price - paid;
  };

  const handleAssociatePerson = (person) => {
    const isAlreadyAdded = persistentCommonAttendees.some((p) => p.id === person.id);

    if (isAlreadyAdded) {
      if (window.confirm(`Are you sure you want to remove ${person.fullName} from common attendees?`)) {
        const updatedAttendees = persistentCommonAttendees.filter(p => p.id !== person.id);
        setPersistentCommonAttendees(updatedAttendees);
        savePersistentCommonAttendees(updatedAttendees);

        setAlert({
          open: true,
          type: "warning",
          message: `You have removed ${person.fullName} from common attendees`,
        });
        setTimeout(() => setAlert({ open: false, type: "warning", message: "" }), 3000);
      }
    } else {
      const updatedAttendees = [...persistentCommonAttendees, person];
      setPersistentCommonAttendees(updatedAttendees);
      savePersistentCommonAttendees(updatedAttendees);

      setAlert({
        open: true,
        type: "success",
        message: `${person.fullName} added to common attendees`,
      });
      setTimeout(() => setAlert({ open: false, type: "success", message: "" }), 3000);
    }
  };

  const getAllCommonAttendees = () => {
    const combined = [...commonAttendees];

    persistentCommonAttendees.forEach(persistentAttendee => {
      if (!combined.some(common => common.id === persistentAttendee.id)) {
        combined.push(persistentAttendee);
      }
    });

    return combined;
  };

  const handleSave = async () => {
    const attendeesList = Object.keys(checkedIn).filter((id) => checkedIn[id]);

    if (!didNotMeet && attendeesList.length === 0) {
      setAlert({
        open: true,
        type: "error",
        message: "Please check in at least one attendee before saving.",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      return;
    }

    if (isTicketedEvent && !didNotMeet) {
      for (const id of attendeesList) {
        if (!priceTiers[id]) {
          setAlert({
            open: true,
            type: "error",
            message: "Please select a price tier for all checked-in attendees.",
          });
          setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
          return;
        }
        if (!paymentMethods[id]) {
          setAlert({
            open: true,
            type: "error",
            message: "Please select a payment method for all checked-in attendees.",
          });
          setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
          return;
        }
      }
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

    const allPeople = getAllCommonAttendees();

    const selectedAttendees = attendeesList.map((id) => {
      const person = allPeople.find((p) => p.id === id);
      const attendee = {
        id: person?.id,
        name: person?.fullName || "",
        email: person?.email || "",
        fullName: person?.fullName || "",
        leader12: person?.leader12 || "",
        leader144: person?.leader144 || "",
        phone: person?.phone || "",
        time: new Date().toISOString(),
        decision: decisions[id] ? decisionTypes[id] || "" : "",
      };

      if (isTicketedEvent) {
        attendee.priceTier = priceTiers[id]?.name || "";
        attendee.price = priceTiers[id]?.price || 0;
        attendee.ageGroup = priceTiers[id]?.ageGroup || "";
        attendee.memberType = priceTiers[id]?.memberType || "";
        attendee.paymentMethod = paymentMethods[id] || "";
        attendee.paid = paidAmounts[id] || 0;
        attendee.owing = calculateOwing(id);
      }

      return attendee;
    });

    console.log("📝 Preparing to submit attendance:");
    console.log("   Event ID:", eventId);
    console.log("   Did Not Meet:", didNotMeet);
    console.log("   Attendees Count:", selectedAttendees.length);

    try {
      let result;

      if (typeof onSubmit === "function") {
        console.log("🔄 Using onSubmit prop...");

        if (didNotMeet) {
          result = await onSubmit("did_not_meet");
        } else {
          result = await onSubmit(selectedAttendees);
        }
      } else {
        console.log("🔄 Using direct API call (onSubmit not available)...");

        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const payload = {
          attendees: selectedAttendees,
          leaderEmail: currentUser?.email || "",
          leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
          did_not_meet: didNotMeet,
          isTicketed: isTicketedEvent,
        };

        const response = await fetch(`${BACKEND_URL}/submit-attendance/${eventId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });

        result = await response.json();
        result.success = response.ok;
      }

      console.log("✅ Submission result:", result);

      if (result?.success) {
        setAlert({
          open: true,
          type: "success",
          message: didNotMeet
            ? "Event marked as 'Did Not Meet' successfully!"
            : `Attendance saved successfully for ${selectedAttendees.length} attendees!`,
        });

        if (typeof onAttendanceSubmitted === "function") {
          onAttendanceSubmitted();
        }

        setTimeout(() => {
          setAlert({ open: false, type: "success", message: "" });
          onClose();
        }, 1500);
      } else {
        console.error("❌ Submission failed:", result);
        setAlert({
          open: true,
          type: "error",
          message: result?.message || result?.detail || "Failed to save attendance.",
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

  const handleDidNotMeet = () => {
    setShowDidNotMeetConfirm(true);
  };

  const confirmDidNotMeet = async () => {
    setShowDidNotMeetConfirm(false);
    setDidNotMeet(true);
    setCheckedIn({});
    setDecisions({});
    setManualHeadcount("");
    setPriceTiers({});
    setPaymentMethods({});
    setPaidAmounts({});

    try {
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

      let result;

      if (typeof onSubmit === "function") {
        result = await onSubmit("did_not_meet");
      } else {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const payload = {
          attendees: [],
          leaderEmail: currentUser?.email || "",
          leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
          did_not_meet: true,
          isTicketed: isTicketedEvent,
        };

        const response = await fetch(`${BACKEND_URL}/submit-attendance/${eventId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });

        result = await response.json();
        result.success = response.ok;
      }

      if (result?.success) {
        setAlert({
          open: true,
          type: "success",
          message: "Event marked as 'Did Not Meet' successfully!",
        });

        if (typeof onAttendanceSubmitted === "function") {
          onAttendanceSubmitted();
        }

        setTimeout(() => {
          setAlert({ open: false, type: "success", message: "" });
          onClose();
        }, 1500);
      } else {
        setAlert({
          open: true,
          type: "error",
          message: result?.message || result?.detail || "Failed to mark event as 'Did Not Meet'.",
        });
        setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
      }
    } catch (error) {
      console.error("❌ Error marking event as 'Did Not Meet':", error);
      setAlert({
        open: true,
        type: "error",
        message: "Something went wrong while marking event as 'Did Not Meet'.",
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 3000);
    }
  };

  const cancelDidNotMeet = () => {
    setShowDidNotMeetConfirm(false);
  };

  const handlePersonAdded = (newPerson) => {
    console.log("✅ New person added:", newPerson);

    // Refresh the people list
    fetchPeople();

    // If this is a cell event, refresh common attendees
    if (event && event.eventType === "cell") {
      fetchCommonAttendees(event._id || event.id);
    }

    // Close the add person modal
    setShowAddPersonModal(false);

    // Show success message
    setAlert({
      open: true,
      type: "success",
      message: `${newPerson.Name} ${newPerson.Surname} added successfully!`,
    });
    setTimeout(() => setAlert({ open: false, type: "success", message: "" }), 3000);
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
      maxWidth: "1200px",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    },
    header: {
      padding: "clamp(15px, 3vw, 20px) clamp(20px, 3vw, 30px)",
      borderBottom: "1px solid #e0e0e0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "10px",
    },
    title: {
      fontSize: "clamp(18px, 4vw, 24px)",
      fontWeight: "600",
      margin: 0,
      color: "#333",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
    ticketBadge: {
      background: "#ffc107",
      color: "#000",
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase",
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
      whiteSpace: "nowrap",
    },
    tabsContainer: {
      borderBottom: "1px solid #e0e0e0",
      padding: "0 clamp(15px, 3vw, 30px)",
      display: "flex",
      gap: 0,
      position: "relative",
    },
    mobileMenuButton: {
      background: "none",
      border: "none",
      padding: "12px",
      cursor: "pointer",
      color: "#6366f1",
      display: isMobile ? "flex" : "none",
      alignItems: "center",
    },
    tab: {
      padding: "clamp(12px, 2vw, 16px) clamp(15px, 2vw, 24px)",
      fontSize: "14px",
      fontWeight: "600",
      background: "none",
      border: "none",
      borderBottom: "3px solid transparent",
      cursor: "pointer",
      color: "#999",
      transition: "all 0.2s",
      whiteSpace: "nowrap",
      flex: isMobile ? "1" : "none",
    },
    tabActive: {
      color: "#6366f1",
      borderBottom: "3px solid #6366f1",
    },
    contentArea: {
      flex: 1,
      overflowY: "auto",
      padding: "clamp(15px, 3vw, 20px) clamp(15px, 3vw, 30px)",
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
    tableContainer: {
      overflowX: "auto",
      marginBottom: "20px",
      WebkitOverflowScrolling: "touch",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: isMobile ? "600px" : "auto",
    },
    th: {
      textAlign: "left",
      padding: "12px 8px",
      borderBottom: "2px solid #e0e0e0",
      fontSize: "13px",
      color: "#666",
      fontWeight: "600",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },
    td: {
      padding: "12px 8px",
      borderBottom: "1px solid #f0f0f0",
      fontSize: "14px",
      color: "#333",
      whiteSpace: "nowrap",
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
      minWidth: isMobile ? "140px" : "180px",
      justifyContent: "space-between",
    },
    // In AttendanceModal.jsx, find the decisionMenu style and update it:
    decisionMenu: {
      position: "absolute",
      top: "100%",
      left: "0",
      marginTop: "4px",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 10000,
      minWidth: isMobile ? "140px" : "200px",
      maxHeight: "300px",
      overflowY: "auto",
    },
    decisionMenuItem: {
      padding: "10px 12px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#333",
      transition: "background 0.2s",
    },
    priceTierButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      background: "#fff3cd",
      border: "1px solid #ffc107",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#856404",
      minWidth: isMobile ? "160px" : "200px",
      justifyContent: "space-between",
      fontWeight: "500",
    },
    paymentButton: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      background: "#d1ecf1",
      border: "1px solid #17a2b8",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#0c5460",
      minWidth: isMobile ? "120px" : "150px",
      justifyContent: "space-between",
      fontWeight: "500",
    },
    priceInput: {
      padding: "8px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      backgroundColor: "#f8f9fa",
      color: "#666",
      width: isMobile ? "80px" : "100px",
      textAlign: "right",
    },
    paidInput: {
      padding: "8px 12px",
      fontSize: "14px",
      borderRadius: "6px",
      border: "1px solid #28a745",
      backgroundColor: "#fff",
      color: "#333",
      width: isMobile ? "80px" : "100px",
      textAlign: "right",
    },
    owingText: {
      padding: "8px 12px",
      fontSize: "14px",
      fontWeight: "600",
      textAlign: "right",
    },
    owingPositive: {
      color: "#28a745",
    },
    owingNegative: {
      color: "#dc3545",
    },
    statsContainer: {
      display: "flex",
      gap: "15px",
      marginBottom: "20px",
      flexWrap: "wrap",
    },
    statBox: {
      flex: "1 1 calc(25% - 15px)",
      background: "#f8f9fa",
      padding: "clamp(15px, 2vw, 20px)",
      borderRadius: "8px",
      textAlign: "center",
      position: "relative",
      minWidth: "120px",
    },
    statBoxInput: {
      flex: "1 1 calc(25% - 15px)",
      background: "#f8f9fa",
      padding: "clamp(15px, 2vw, 20px)",
      borderRadius: "8px",
      textAlign: "center",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "120px",
    },
    headcountInput: {
      fontSize: "clamp(24px, 4vw, 36px)",
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
      fontSize: "clamp(24px, 4vw, 36px)",
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
      fontSize: "14px",
      color: "#666",
      marginTop: "8px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    footer: {
      padding: "clamp(15px, 3vw, 20px) clamp(15px, 3vw, 30px)",
      borderTop: "1px solid #e0e0e0",
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
    },
    closeBtn: {
      background: "transparent",
      border: "1px solid #ddd",
      color: "#666",
      padding: "12px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      flex: isMobile ? "1 1 100%" : "none",
      minWidth: "120px",
    },
    didNotMeetBtn: {
      background: "#dc3545",
      color: "#fff",
      border: "none",
      padding: "12px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      flex: isMobile ? "1 1 100%" : "none",
      minWidth: "140px",
      transition: "background-color 0.2s",
    },
    saveBtn: {
      background: "#28a745",
      color: "#fff",
      border: "none",
      padding: "12px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      flex: isMobile ? "1 1 100%" : "none",
      minWidth: "120px",
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
      maxWidth: "90vw",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      textAlign: "center",
    },
    alertSuccess: {
      background: "#28a745",
    },
    alertError: {
      background: "#dc3545",
    },
    mobileAttendeeCard: {
      background: "#f8f9fa",
      borderRadius: "8px",
      padding: "15px",
      marginBottom: "10px",
      border: "1px solid #e0e0e0",
    },
    mobileCardRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    },
    mobileCardInfo: {
      flex: 1,
    },
    mobileCardName: {
      fontWeight: "600",
      fontSize: "16px",
      marginBottom: "4px",
    },
    mobileCardEmail: {
      fontSize: "14px",
      color: "#666",
    },
    persistentBadge: {
      background: "#17a2b8",
      color: "#fff",
      padding: "2px 6px",
      borderRadius: "4px",
      fontSize: "10px",
      fontWeight: "600",
      marginLeft: "8px",
    },
    confirmOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10002,
      padding: "20px",
    },
    confirmModal: {
      background: "#fff",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "450px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      overflow: "hidden",
    },
    confirmHeader: {
      padding: "20px 24px 0",
      textAlign: "center",
    },
    confirmTitle: {
      fontSize: "20px",
      fontWeight: "600",
      color: "#333",
      margin: 0,
    },
    confirmBody: {
      padding: "24px",
      textAlign: "center",
    },
    confirmIcon: {
      marginBottom: "16px",
      display: "flex",
      justifyContent: "center",
    },
    confirmMessage: {
      fontSize: "16px",
      color: "#333",
      margin: "0 0 12px 0",
      lineHeight: "1.5",
    },
    confirmSubMessage: {
      fontSize: "14px",
      color: "#666",
      margin: 0,
      lineHeight: "1.4",
    },
    confirmFooter: {
      padding: "20px 24px 24px",
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
      borderTop: "1px solid #e0e0e0",
    },
    confirmCancelBtn: {
      padding: "10px 20px",
      background: "transparent",
      border: "1px solid #ddd",
      borderRadius: "6px",
      color: "#666",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      minWidth: "80px",
      transition: "all 0.2s",
    },
    confirmProceedBtn: {
      padding: "10px 20px",
      background: "#dc3545",
      border: "none",
      borderRadius: "6px",
      color: "#fff",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      minWidth: "140px",
      transition: "all 0.2s",
    },
    filterContainer: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    },
    leaderInputGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    leaderInput: {
      padding: '8px 12px',
      fontSize: '14px',
      borderRadius: '6px',
      border: '1px solid #ddd',
      backgroundColor: '#fff',
      color: '#333',
      width: '120px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    clearFilterBtn: {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: "#666",
      padding: "4px",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };

  const allCommonAttendees = getAllCommonAttendees();

  const filteredCommonAttendees = allCommonAttendees.filter(
    (person) =>
      person.fullName &&
      person.fullName.toLowerCase().includes(searchName.toLowerCase())
  );

  const filteredPeople = people.filter(
    (person) =>
      person.fullName &&
      person.fullName.toLowerCase().includes(associateSearch.toLowerCase())
  );

  const attendeesCount = Object.values(checkedIn).filter(Boolean).length;
  const totalHeadcount = manualHeadcount || Object.keys(checkedIn).length;
  const decisionsCount = Object.values(decisions).filter(Boolean).length;

  const firstTimeCount = Object.keys(decisionTypes).filter(
    (id) => decisions[id] && decisionTypes[id] === "first-time"
  ).length;

  const reCommitmentCount = Object.keys(decisionTypes).filter(
    (id) => decisions[id] && decisionTypes[id] === "re-commitment"
  ).length;

  const totalPaid = Object.keys(checkedIn)
    .filter(id => checkedIn[id])
    .reduce((sum, id) => sum + (paidAmounts[id] || 0), 0);

  const totalOwing = Object.keys(checkedIn)
    .filter(id => checkedIn[id])
    .reduce((sum, id) => sum + calculateOwing(id), 0);

  const renderMobileAttendeeCard = (person) => {
    const isPersistent = persistentCommonAttendees.some(p => p.id === person.id);

    return (
      <div key={person.id} style={styles.mobileAttendeeCard}>
        <div style={styles.mobileCardRow}>
          <div style={styles.mobileCardInfo}>
            <div style={styles.mobileCardName}>
              {person.fullName}
              {isPersistent && <span style={styles.persistentBadge}>ADDED</span>}
            </div>
            <div style={styles.mobileCardEmail}>{person.email}</div>
            {!isTicketedEvent && (
              <>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Leader @12: {person.leader12}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Phone: {person.phone}
                </div>
              </>
            )}
          </div>
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
        </div>

        {checkedIn[person.id] && (
          <>
            {isTicketedEvent ? (
              <>
                <div style={styles.mobileCardRow}>
                  <div style={styles.decisionDropdown}>
                    <button
                      style={styles.priceTierButton}
                      onClick={() =>
                        setOpenPriceTierDropdown(
                          openPriceTierDropdown === person.id ? null : person.id
                        )
                      }
                    >
                      <span>
                        {priceTiers[person.id]
                          ? `${priceTiers[person.id].name} (R${priceTiers[person.id].price.toFixed(2)})`
                          : "Select Price Tier"}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
                <div style={styles.mobileCardRow}>
                  <div style={styles.decisionDropdown}>
                    <button
                      style={styles.paymentButton}
                      onClick={() =>
                        setOpenPaymentDropdown(
                          openPaymentDropdown === person.id ? null : person.id
                        )
                      }
                    >
                      <span>
                        {paymentMethods[person.id] || "Select Payment"}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
                <div style={styles.mobileCardRow}>
                  <span>Price: R{priceTiers[person.id]?.price.toFixed(2) || "0.00"}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paidAmounts[person.id] || ""}
                    onChange={(e) =>
                      handlePaidAmountChange(person.id, e.target.value)
                    }
                    placeholder="0.00"
                    style={styles.paidInput}
                  />
                </div>
                <div style={styles.mobileCardRow}>
                  <span>Owing:</span>
                  <span style={{
                    ...styles.owingText,
                    ...(calculateOwing(person.id) === 0
                      ? styles.owingPositive
                      : styles.owingNegative),
                  }}>
                    R{calculateOwing(person.id).toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div style={styles.mobileCardRow}>
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
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h1 style={styles.title}>
              Current Event Information
              {isTicketedEvent && (
                <span style={styles.ticketBadge}>Ticketed Event</span>
              )}
            </h1>

            <div style={styles.filterContainer}>
              <div style={styles.leaderInputGroup}>
                <input
                  type="text"
                  placeholder="Leader at 1"
                  value={leader1Filter}
                  onChange={(e) => {
                    setLeader1Filter(e.target.value);
                    const timeoutId = setTimeout(() => {
                      fetchPeople(associateSearch, e.target.value, leader12Filter, leader144Filter, leader1728Filter);
                    }, 500);
                  }}
                  style={styles.leaderInput}
                />
              </div>
              <div style={styles.leaderInputGroup}>
                <input
                  type="text"
                  placeholder="Leader at 12"
                  value={leader12Filter}
                  onChange={(e) => {
                    setLeader12Filter(e.target.value);
                    const timeoutId = setTimeout(() => {
                      fetchPeople(associateSearch, leader1Filter, e.target.value, leader144Filter, leader1728Filter);
                    }, 500);
                  }}
                  style={styles.leaderInput}
                />
              </div>
              <div style={styles.leaderInputGroup}>
                <input
                  type="text"
                  placeholder="Leader at 144"
                  value={leader144Filter}
                  onChange={(e) => {
                    setLeader144Filter(e.target.value);
                    const timeoutId = setTimeout(() => {
                      fetchPeople(associateSearch, leader1Filter, leader12Filter, e.target.value, leader1728Filter);
                    }, 500);
                  }}
                  style={styles.leaderInput}
                />
              </div>
              <div style={styles.leaderInputGroup}>
                <input
                  type="text"
                  placeholder="Leader at 1728"
                  value={leader1728Filter}
                  onChange={(e) => {
                    setLeader1728Filter(e.target.value);
                    const timeoutId = setTimeout(() => {
                      fetchPeople(associateSearch, leader1Filter, leader12Filter, leader144Filter, e.target.value);
                    }, 500);
                  }}
                  style={styles.leaderInput}
                />
              </div>

              {(leader1Filter || leader12Filter || leader144Filter || leader1728Filter) && (
                <button
                  style={styles.clearFilterBtn}
                  onClick={() => {
                    setLeader1Filter("");
                    setLeader12Filter("");
                    setLeader144Filter("");
                    setLeader1728Filter("");
                    fetchPeople(associateSearch, "", "", "", "");
                  }}
                  title="Clear all leader filters"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              style={styles.addPersonBtn}
              onClick={() => setShowAddPersonModal(true)}
            >
              <UserPlus size={18} />
              {isMobile ? "Add" : "Add Person"}
            </button>
          </div>

          <div style={styles.tabsContainer}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 0 ? styles.tabActive : {})
              }}
              onClick={() => setActiveTab(0)}
            >
              CAPTURE ATTENDEES
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 1 ? styles.tabActive : {})
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
                {isMobile ? (
                  <div>
                    {loading && (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        Loading...
                      </div>
                    )}
                    {!loading && filteredCommonAttendees.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                        No attendees found.
                      </div>
                    )}
                    {filteredCommonAttendees.map(renderMobileAttendeeCard)}
                  </div>
                ) : (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Attendees Name</th>
                          <th style={styles.th}>Attendees Email</th>
                          {!isTicketedEvent && (
                            <>
                              <th style={styles.th}>Attendees Leader @12</th>
                              <th style={styles.th}>Attendees Leader @144</th>
                              <th style={styles.th}>Attendees Number</th>
                            </>
                          )}
                          <th style={{ ...styles.th, textAlign: "center" }}>Check In</th>
                          {isTicketedEvent && (
                            <>
                              <th style={{ ...styles.th, textAlign: "center" }}>Price Tier</th>
                              <th style={{ ...styles.th, textAlign: "center" }}>Payment Method</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Price</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Paid</th>
                              <th style={{ ...styles.th, textAlign: "right" }}>Owing</th>
                            </>
                          )}
                          {!isTicketedEvent && (
                            <th style={{ ...styles.th, textAlign: "center" }}>Decision</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td colSpan={isTicketedEvent ? "8" : "7"} style={{ ...styles.td, textAlign: "center" }}>
                              Loading...
                            </td>
                          </tr>
                        )}
                        {!loading && filteredCommonAttendees.length === 0 && (
                          <tr>
                            <td colSpan={isTicketedEvent ? "8" : "7"} style={{ ...styles.td, textAlign: "center" }}>
                              No attendees found.
                            </td>
                          </tr>
                        )}
                        {filteredCommonAttendees.map((person) => {
                          const isPersistent = persistentCommonAttendees.some(p => p.id === person.id);

                          return (
                            <tr key={person.id}>
                              <td style={styles.td}>
                                {person.fullName}
                                {isPersistent && <span style={styles.persistentBadge}>ADDED</span>}
                              </td>
                              <td style={styles.td}>{person.email}</td>
                              {!isTicketedEvent && (
                                <>
                                  <td style={styles.td}>{person.leader12}</td>
                                  <td style={styles.td}>{person.leader144}</td>
                                  <td style={styles.td}>{person.phone}</td>
                                </>
                              )}
                              <td style={{ ...styles.td, ...styles.radioCell }}>
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

                              {isTicketedEvent && (
                                <>
                                  <td style={{ ...styles.td, ...styles.radioCell }}>
                                    {checkedIn[person.id] ? (
                                      <div style={{ ...styles.decisionDropdown, position: 'relative', zIndex: openPriceTierDropdown === person.id ? 10001 : 1 }}>
                                        <button
                                          style={styles.priceTierButton}
                                          onClick={(e) => {
                                            e.stopPropagation(); // ✅ Prevent event bubbling
                                            setOpenPriceTierDropdown(
                                              openPriceTierDropdown === person.id ? null : person.id
                                            );
                                          }}
                                        >
                                          <span>
                                            {priceTiers[person.id]
                                              ? `${priceTiers[person.id].name} (R${priceTiers[person.id].price.toFixed(2)})`
                                              : "Select Price Tier"}
                                          </span>
                                          <ChevronDown size={16} />
                                        </button>
                                        {openPriceTierDropdown === person.id && (
                                          <div style={styles.decisionMenu}>
                                            {eventPriceTiers && eventPriceTiers.length > 0 ? (
                                              eventPriceTiers.map((tier, index) => (
                                                <div
                                                  key={index}
                                                  style={styles.decisionMenuItem}
                                                  onClick={(e) => {
                                                    e.stopPropagation(); // ✅ Prevent event bubbling
                                                    handlePriceTierSelect(person.id, index);
                                                  }}
                                                  onMouseEnter={(e) =>
                                                    (e.target.style.background = "#f0f0f0")
                                                  }
                                                  onMouseLeave={(e) =>
                                                    (e.target.style.background = "transparent")
                                                  }
                                                >
                                                  {tier.name} - R{parseFloat(tier.price).toFixed(2)}
                                                  <div style={{ fontSize: "12px", color: "#666" }}>
                                                    {tier.ageGroup} • {tier.memberType}
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <div style={{ padding: "12px", textAlign: "center", color: "#999" }}>
                                                No price tiers available
                                              </div>
                                            )}
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

                                  <td style={{ ...styles.td, ...styles.radioCell }}>
                                    {checkedIn[person.id] ? (
                                      <div style={styles.decisionDropdown}>
                                        <button
                                          style={styles.paymentButton}
                                          onClick={() =>
                                            setOpenPaymentDropdown(
                                              openPaymentDropdown === person.id ? null : person.id
                                            )
                                          }
                                        >
                                          <span>
                                            {paymentMethods[person.id] || "Select Payment"}
                                          </span>
                                          <ChevronDown size={16} />
                                        </button>
                                        {openPaymentDropdown === person.id && (
                                          <div style={styles.decisionMenu}>
                                            {availablePaymentMethods.map((method, index) => (
                                              <div
                                                key={index}
                                                style={styles.decisionMenuItem}
                                                onClick={() =>
                                                  handlePaymentMethodSelect(person.id, method)
                                                }
                                                onMouseEnter={(e) =>
                                                  (e.target.style.background = "#f0f0f0")
                                                }
                                                onMouseLeave={(e) =>
                                                  (e.target.style.background = "transparent")
                                                }
                                              >
                                                {method}
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

                                  <td style={{ ...styles.td, textAlign: "right" }}>
                                    {checkedIn[person.id] && priceTiers[person.id] ? (
                                      <span style={styles.priceInput}>
                                        R{priceTiers[person.id].price.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span style={{ color: "#ccc" }}>-</span>
                                    )}
                                  </td>

                                  <td style={{ ...styles.td, textAlign: "right" }}>
                                    {checkedIn[person.id] ? (
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={paidAmounts[person.id] || ""}
                                        onChange={(e) =>
                                          handlePaidAmountChange(person.id, e.target.value)
                                        }
                                        placeholder="0.00"
                                        style={styles.paidInput}
                                      />
                                    ) : (
                                      <span style={{ color: "#ccc" }}>-</span>
                                    )}
                                  </td>

                                  <td style={{ ...styles.td, textAlign: "right" }}>
                                    {checkedIn[person.id] && priceTiers[person.id] ? (
                                      <span
                                        style={{
                                          ...styles.owingText,
                                          ...(calculateOwing(person.id) === 0
                                            ? styles.owingPositive
                                            : styles.owingNegative),
                                        }}
                                      >
                                        R{calculateOwing(person.id).toFixed(2)}
                                      </span>
                                    ) : (
                                      <span style={{ color: "#ccc" }}>-</span>
                                    )}
                                  </td>
                                </>
                              )}

                              {!isTicketedEvent && (
                                <td style={{ ...styles.td, ...styles.radioCell }}>
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
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

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

                  {!isTicketedEvent && (
                    <div style={styles.statBox}>
                      <div style={{ ...styles.statNumber, color: "#ffc107" }}>
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
                  )}

                  {isTicketedEvent && (
                    <>
                      <div style={styles.statBox}>
                        <div style={{ ...styles.statNumber, color: "#28a745" }}>
                          R{totalPaid.toFixed(2)}
                        </div>
                        <div style={styles.statLabel}>Total Paid</div>
                      </div>
                      <div style={styles.statBox}>
                        <div style={{
                          ...styles.statNumber,
                          color: totalOwing === 0 ? "#28a745" : "#dc3545"
                        }}>
                          R{totalOwing.toFixed(2)}
                        </div>
                        <div style={styles.statLabel}>Total Owing</div>
                      </div>
                    </>
                  )}
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

                {isMobile ? (
                  <div>
                    {loading && (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        Loading...
                      </div>
                    )}
                    {!loading && filteredPeople.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                        No people found.
                      </div>
                    )}
                    {filteredPeople.map((person) => {
                      const isAlreadyAdded = persistentCommonAttendees.some((p) => p.id === person.id);

                      return (
                        <div key={person.id} style={styles.mobileAttendeeCard}>
                          <div style={styles.mobileCardRow}>
                            <div style={styles.mobileCardInfo}>
                              <div style={styles.mobileCardName}>
                                {person.fullName}
                                {isAlreadyAdded && <span style={styles.persistentBadge}>ADDED</span>}
                              </div>
                              <div style={styles.mobileCardEmail}>{person.email}</div>
                              <div style={{ fontSize: "12px", color: "#666" }}>
                                Leader @12: {person.leader12}
                              </div>
                              <div style={{ fontSize: "12px", color: "#666" }}>
                                Phone: {person.phone}
                              </div>
                            </div>
                            <button
                              style={{
                                ...styles.iconButton,
                                color: isAlreadyAdded ? "#dc3545" : "#6366f1",
                                cursor: "pointer",
                              }}
                              onClick={() => handleAssociatePerson(person)}
                              title={isAlreadyAdded ? "Remove from common attendees" : "Add to common attendees"}
                            >
                              {isAlreadyAdded ? <X size={20} /> : <UserPlus size={20} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.tableContainer}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th}>Leader @12</th>
                          <th style={styles.th}>Leader @144</th>
                          <th style={styles.th}>Phone</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>Add</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>
                              Loading...
                            </td>
                          </tr>
                        )}
                        {!loading && filteredPeople.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>
                              No people found.
                            </td>
                          </tr>
                        )}
                        {filteredPeople.map((person) => {
                          const isAlreadyAdded = persistentCommonAttendees.some((p) => p.id === person.id);

                          return (
                            <tr key={person.id}>
                              <td style={styles.td}>
                                {person.fullName}
                                {isAlreadyAdded && <span style={styles.persistentBadge}>ADDED</span>}
                              </td>
                              <td style={styles.td}>{person.email}</td>
                              <td style={styles.td}>{person.leader12}</td>
                              <td style={styles.td}>{person.leader144}</td>
                              <td style={styles.td}>{person.phone}</td>
                              <td style={{ ...styles.td, textAlign: "center" }}>
                                <button
                                  style={{
                                    ...styles.iconButton,
                                    opacity: isAlreadyAdded ? 0.3 : 1,
                                    cursor: isAlreadyAdded ? "not-allowed" : "pointer",
                                  }}
                                  onClick={() => handleAssociatePerson(person)}
                                  disabled={isAlreadyAdded}
                                >
                                  <UserPlus size={20} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={styles.footer}>
            <button style={styles.closeBtn} onClick={onClose}>
              CLOSE
            </button>
            <div style={{ display: "flex", gap: "12px", flex: isMobile ? "1 1 100%" : "none", flexWrap: isMobile ? "wrap" : "nowrap" }}>
              <button
                style={styles.didNotMeetBtn}
                onClick={handleDidNotMeet}
              >
                DID NOT MEET
              </button>
              <button
                style={styles.saveBtn}
                onClick={handleSave}
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDidNotMeetConfirm && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmModal}>
            <div style={styles.confirmHeader}>
              <h3 style={styles.confirmTitle}>Confirm Event Status</h3>
            </div>
            <div style={styles.confirmBody}>
              <div style={styles.confirmIcon}>
                <X size={32} color="#dc3545" />
              </div>
              <p style={styles.confirmMessage}>
                Are you sure you want to mark this event as <strong>'Did Not Meet'</strong>?
              </p>
              <p style={styles.confirmSubMessage}>
                This will clear all current attendance data and cannot be undone.
              </p>
            </div>
            <div style={styles.confirmFooter}>
              <button
                style={styles.confirmCancelBtn}
                onClick={cancelDidNotMeet}
              >
                Cancel
              </button>
              <button
                style={styles.confirmProceedBtn}
                onClick={confirmDidNotMeet}
              >
                Mark as Did Not Meet
              </button>
            </div>
          </div>
        </div>
      )}

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