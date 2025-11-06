import React, { useState, useEffect } from "react";
import { ArrowLeft, UserPlus,  Search,  CheckCircle, ChevronDown , X, Menu} from "lucide-react"; 

let globalPeopleCache = {
  data: [],
  timestamp: null,
  expiry: 5 * 60 * 1000 
};

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
  const [preloadedPeople, setPreloadedPeople] = useState([]);
  const [touched, setTouched] = useState({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [autoFilledLeaders, setAutoFilledLeaders] = useState({
    leader1: "",
    leader12: "",
    leader144: ""
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  useEffect(() => {
    if (isOpen) {
      loadPreloadedPeople();
    }
  }, [isOpen]);
  
  const loadPreloadedPeople = async () => {
    const now = Date.now();
    if (globalPeopleCache.data.length > 0 && globalPeopleCache.timestamp && 
        (now - globalPeopleCache.timestamp) < globalPeopleCache.expiry) {
      console.log("📦 Using cached people data in AddPersonToEvents");
      setPreloadedPeople(globalPeopleCache.data);
      return;
    }

    try {
      console.log("🔄 Fetching fresh people data for AddPersonToEvents cache");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append("perPage", "500");
      params.append("page", "1");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p.leader1 || p.leaders?.[0] || "",
        leader12: p["Leader @12"] || p.leader12 || p.leaders?.[1] || "",
        leader144: p["Leader @144"] || p.leader144 || p.leaders?.[2] || "",
        phone: p.Number || p.Phone || p.phone || "",
      }));

      // Update global cache
      globalPeopleCache = {
        data: formatted,
        timestamp: now,
        expiry: 5 * 60 * 1000
      };

      setPreloadedPeople(formatted);
      console.log(`✅ Pre-loaded ${formatted.length} people into AddPersonToEvents cache`);
    } catch (err) {
      console.error("Error pre-loading people in AddPersonToEvents:", err);
      if (globalPeopleCache.data.length > 0) {
        setPreloadedPeople(globalPeopleCache.data);
      }
    }
  };

  const fetchInviters = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      setInviterResults([]);
      return;
    }

    try {
      setLoadingInviters(true);
      
      // Use preloaded data first for instant results
      const filteredFromCache = preloadedPeople.filter(person =>
        person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredFromCache.length > 0) {
        setInviterResults(filteredFromCache.slice(0, 20));
      } else {
        // Fallback to API if no cached results
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
          leader1: p["Leader @1"] || p.leader1 || p.leaders?.[0] || "",
          leader12: p["Leader @12"] || p.leader12 || p.leaders?.[1] || "",
          leader144: p["Leader @144"] || p.leader144 || p.leaders?.[2] || "",
        }));

        setInviterResults(formatted);
      }
    } catch (err) {
      console.error("Error fetching inviters:", err);
    } finally {
      setLoadingInviters(false);
    }
  };

  // Debounced search with immediate cache lookup
  useEffect(() => {
    const delay = setTimeout(() => {
      if (inviterSearch.length >= 1) {
        fetchInviters(inviterSearch);
      } else {
        setInviterResults([]);
      }
    }, 150);
    
    return () => clearTimeout(delay);
  }, [inviterSearch]);

  const handleInviterSelect = (person) => {
    setFormData({ ...formData, invitedBy: person.fullName });
    setInviterSearch(person.fullName);
    setShowInviterDropdown(false);
    setTouched({ ...touched, invitedBy: true });

    // ✅ Auto-fill ALL leaders including Leader @144 (can be empty string if inviter doesn't have it)
    const leadersToFill = {
      leader1: person.leader1 || "",
      leader12: person.leader12 || "",
      leader144: person.leader144 || "" // Auto-fill even if empty
    };
    
    setAutoFilledLeaders(leadersToFill);
    
    console.log("✅ Auto-filled all leaders from inviter:", {
      inviter: person.fullName,
      leaders: leadersToFill
    });
  };

  

  const isFieldEmpty = (fieldName) => {
    const value = fieldName === 'invitedBy' ? inviterSearch : formData[fieldName];
    return !value || value.trim() === "";
  };

  const showError = (fieldName) => {
    return attemptedSubmit && isFieldEmpty(fieldName);
  };

  const validateForm = () => {
    setAttemptedSubmit(true);

    const requiredFields = {
      name: formData.name?.trim(),
      surname: formData.surname?.trim(), 
      email: formData.email?.trim(),
      mobile: formData.mobile?.trim(),
      dob: formData.dob?.trim(),
      address: formData.address?.trim()
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      setAlert({
        open: true,
        type: "error",
        message: `Please fill in all required fields: ${missingFields.join(', ')}`,
      });
      setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 4000);
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setAlert({
        open: true,
        type: "error",
        message: "Please enter a valid email address",
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

      // ✅ Use EXACT lowercase field names with leaders array
      const personData = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.toLowerCase().trim(),
        number: formData.mobile || "",
        address: formData.address || "",
        gender: formData.gender || "",
        dob: formData.dob || "",
        invitedBy: formData.invitedBy || "",
        leaders: [
          leaderInfo.leader1 || "",
          leaderInfo.leader12 || "",
          leaderInfo.leader144 || "", // Can be empty - that's OK
          "" // leader1728 (empty string)
        ],
        stage: "Win",
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

        // Invalidate cache since we added a new person
        globalPeopleCache = {
          data: [],
          timestamp: null,
          expiry: 5 * 60 * 1000
        };

        setAlert({
          open: true,
          type: "success",
          message: "Person added successfully!",
        });

        if (typeof onPersonAdded === "function") {
          onPersonAdded(data.person || data);
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
          setAttemptedSubmit(false);
          setTouched({});
          setAutoFilledLeaders({
            leader1: "",
            leader12: "",
            leader144: ""
          });
        }, 1500);
      } else {
        const error = await response.json();
        console.error("❌ Add person error - FULL DETAILS:", {
          status: response.status,
          statusText: response.statusText,
          error: error,
          sentData: personData
        });

        let errorMessage = "Failed to add person";
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map(err => {
              const field = err.loc?.[err.loc.length - 1] || 'field';
              return `${field}: ${err.msg || err}`;
            }).join(', ');
          } else if (typeof error.detail === 'object') {
            errorMessage = JSON.stringify(error.detail);
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        setAlert({
          open: true,
          type: "error",
          message: errorMessage,
        });
        setTimeout(() => setAlert({ open: false, type: "error", message: "" }), 5000);
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
    setAttemptedSubmit(false);
    setTouched({});
    setAutoFilledLeaders({
      leader1: "",
      leader12: "",
      leader144: ""
    });
    onClose();
  };

  if (!isOpen) return null;

  // Get current theme from localStorage or default to light
  const getCurrentTheme = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  };

  const currentTheme = getCurrentTheme();
  const isDarkMode = currentTheme === 'dark';

  // Theme-aware styles
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
      background: isDarkMode ? "#1e1e1e" : "#fff",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "600px",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "20px",
      color: isDarkMode ? "#fff" : "#333",
    },
    title: {
      fontSize: "clamp(20px, 4vw, 24px)",
      fontWeight: "600",
      marginBottom: "20px",
      color: isDarkMode ? "#fff" : "#333",
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
      color: isDarkMode ? "#ccc" : "#555",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    required: {
      color: "#dc3545",
      fontSize: "12px",
      fontWeight: "600",
    },
    input: {
      padding: "12px",
      fontSize: "16px",
      borderRadius: "8px",
      border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      background: isDarkMode ? "#2a2a2a" : "#fff",
      color: isDarkMode ? "#ffffff" : "#333",
    },
    inputError: {
      padding: "12px",
      fontSize: "16px",
      borderRadius: "8px",
      border: "2px solid #dc3545",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      background: isDarkMode ? "#2a2a2a" : "#fff",
      color: isDarkMode ? "#ffffff" : "#333",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: "4px",
      background: isDarkMode ? "#2a2a2a" : "#fff",
      border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      maxHeight: "200px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "12px",
      cursor: "pointer",
      borderBottom: `1px solid ${isDarkMode ? "#3a3a3a" : "#f0f0f0"}`,
      transition: "background 0.2s",
      color: isDarkMode ? "#ffffff" : "#333",
      background: isDarkMode ? "#2a2a2a" : "#fff",
    },
    dropdownEmpty: {
      padding: "12px",
      color: isDarkMode ? "#aaa" : "#999",
      textAlign: "center",
      fontSize: "14px",
      background: isDarkMode ? "#2a2a2a" : "#fff",
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
      color: isDarkMode ? "#ccc" : "#555",
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
      border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
      color: isDarkMode ? "#ccc" : "#666",
      padding: "12px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      minWidth: "120px",
      transition: "all 0.2s ease",
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
      transition: "all 0.2s ease",
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
              borderBottom: `1px solid ${isDarkMode ? "#444" : "#e0e0e0"}`,
              paddingBottom: '10px'
            }}>
              <div style={{ fontWeight: '600', color: isDarkMode ? "#ccc" : "#333" }}>NEW PERSON INFO</div>
              <div style={{ fontWeight: '600', color: isDarkMode ? "#ccc" : "#333" }}>LEADER INFO</div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Invited By
                {showError('invitedBy') && <span style={styles.required}>Required</span>}
              </label>
              <input
                type="text"
                value={inviterSearch}
                onChange={(e) => {
                  setInviterSearch(e.target.value);
                  setShowInviterDropdown(true);
                  setTouched({ ...touched, invitedBy: true });
                }}
                onFocus={() => {
                  setShowInviterDropdown(true);
                  // Show recent people when focused
                  if (inviterSearch.length === 0 && preloadedPeople.length > 0) {
                    setInviterResults(preloadedPeople.slice(0, 10));
                  }
                }}
                onBlur={() => setTouched({ ...touched, invitedBy: true })}
                style={showError('invitedBy') ? styles.inputError : styles.input}
                placeholder="Start typing to search..."
                autoComplete="off"
              />
              {showInviterDropdown && (
                <div style={styles.dropdown}>
                  {loadingInviters && (
                    <div style={styles.dropdownEmpty}>Loading...</div>
                  )}
                  {!loadingInviters && inviterResults.length === 0 && inviterSearch.length >= 1 && (
                    <div style={styles.dropdownEmpty}>No people found</div>
                  )}
                  {!loadingInviters && inviterSearch.length === 0 && (
                    <div style={styles.dropdownEmpty}>Type to search people...</div>
                  )}
                  {!loadingInviters && inviterResults.map((person) => (
                    <div
                      key={person.id}
                      style={styles.dropdownItem}
                      onClick={() => handleInviterSelect(person)}
                      onMouseEnter={(e) => e.target.style.background = isDarkMode ? "#3a3a3a" : "#f8f9fa"}
                      onMouseLeave={(e) => e.target.style.background = isDarkMode ? "#2a2a2a" : "#fff"}
                    >
                      <div style={{ fontWeight: "500" }}>{person.fullName}</div>
                      <div style={{ fontSize: "12px", color: isDarkMode ? "#999" : "#666" }}>
                        {person.email}
                        {person.leader1 && <span> • L@1: {person.leader1}</span>}
                        {person.leader12 && <span> • L@12: {person.leader12}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Name
                {showError('name') && <span style={styles.required}>Required</span>}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => setTouched({ ...touched, name: true })}
                style={showError('name') ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Surname
                {showError('surname') && <span style={styles.required}>Required</span>}
              </label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                onBlur={() => setTouched({ ...touched, surname: true })}
                style={showError('surname') ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Gender</label>
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
              <label style={styles.label}>
                Email Address
                {showError('email') && <span style={styles.required}>Required</span>}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => setTouched({ ...touched, email: true })}
                style={showError('email') ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Mobile Number
                {showError('mobile') && <span style={styles.required}>Required</span>}
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                onBlur={() => setTouched({ ...touched, mobile: true })}
                style={showError('mobile') ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Date Of Birth
                {showError('dob') && <span style={styles.required}>Required</span>}
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                onBlur={() => setTouched({ ...touched, dob: true })}
                style={showError('dob') ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Home Address
                {showError('address') && <span style={styles.required}>Required</span>}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                onBlur={() => setTouched({ ...touched, address: true })}
                style={showError('address') ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button 
                type="button" 
                style={styles.closeBtn} 
                onClick={handleClose}
                onMouseEnter={(e) => e.target.style.background = isDarkMode ? "#3d3d3d" : "#f8f9fa"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >
                CANCEL
              </button>
              <button 
                type="button" 
                style={styles.nextBtn} 
                onClick={handleNext}
                onMouseEnter={(e) => e.target.style.background = "#4f46e5"}
                onMouseLeave={(e) => e.target.style.background = "#6366f1"}
              >
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
          preloadedPeople={preloadedPeople}
          autoFilledLeaders={autoFilledLeaders}
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

const LeaderSelectionModal = ({ isOpen, onBack, onSubmit,  preloadedPeople = [], autoFilledLeaders }) => {
  const [leaderData, setLeaderData] = useState({
    leader1: "",
    leader12: "",
    leader144: "" // Optional - can be empty if inviter doesn't have one
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

  // ✅ Auto-fill ALL leaders including Leader @144 (even if empty)
  useEffect(() => {
    if (isOpen && autoFilledLeaders) {
      console.log("🔄 Auto-filling ALL leaders in LeaderSelectionModal:", autoFilledLeaders);
      
      const filledLeaders = {
        leader1: autoFilledLeaders.leader1 || "",
        leader12: autoFilledLeaders.leader12 || "",
        leader144: autoFilledLeaders.leader144 || "" // Auto-fill even if empty - that's OK!
      };
      
      setLeaderData(filledLeaders);
      setLeaderSearches(filledLeaders);
      
      console.log("✅ All leaders auto-filled (Leader @144 can be empty):", filledLeaders);
    }
  }, [isOpen, autoFilledLeaders]);

  const fetchLeaders = async (searchTerm, leaderField) => {
    if (!searchTerm || searchTerm.length < 1) {
      setLeaderResults(prev => ({ ...prev, [leaderField]: [] }));
      return;
    }

    try {
      setLoadingLeaders(true);
      
      // First try to find in preloaded data for instant results
      const filteredFromCache = preloadedPeople.filter(person =>
        person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person[leaderField]?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredFromCache.length > 0) {
        setLeaderResults(prev => ({ 
          ...prev, 
          [leaderField]: filteredFromCache.slice(0, 15) 
        }));
      } else {
        // Fallback to API search
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const params = new URLSearchParams();
        params.append("name", searchTerm);
        params.append("perPage", "15");

        const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });
        const data = await res.json();
        const peopleArray = data.people || data.results || [];

        const formatted = peopleArray.map((p) => ({
          id: p._id,
          fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
          email: p.Email || p.email || "",
          leader1: p["Leader @1"] || p.leader1 || p.leaders?.[0] || "",
          leader12: p["Leader @12"] || p.leader12 || p.leaders?.[1] || "",
          leader144: p["Leader @144"] || p.leader144 || p.leaders?.[2] || "",
        }));

        setLeaderResults(prev => ({ ...prev, [leaderField]: formatted }));
      }
    } catch (err) {
      console.error("Error fetching leaders:", err);
    } finally {
      setLoadingLeaders(false);
    }
  };

  // Fast search with preloaded data
  useEffect(() => {
    const delays = {};

    Object.keys(leaderSearches).forEach(field => {
      if (delays[field]) clearTimeout(delays[field]);

      delays[field] = setTimeout(() => {
        if (leaderSearches[field].length >= 1) {
          fetchLeaders(leaderSearches[field], field);
        } else {
          setLeaderResults(prev => ({ ...prev, [field]: [] }));
        }
      }, 100);
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
    
    // Show recent people when empty or show cached results immediately
    if (value.length === 0 && preloadedPeople.length > 0) {
      setLeaderResults(prev => ({ 
        ...prev, 
        [leaderField]: preloadedPeople.slice(0, 10) 
      }));
    }
  };

  const handleSave = () => {
    onSubmit(leaderData);
  };

  // Get current theme from localStorage or default to light
  const getCurrentTheme = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  };

  const currentTheme = getCurrentTheme();
  const isDarkMode = currentTheme === 'dark';

  // Theme-aware styles for LeaderSelectionModal
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
      background: isDarkMode ? "#1e1e1e" : "#fff",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "20px",
      color: isDarkMode ? "#fff" : "#333",
    },
    title: {
      fontSize: "clamp(20px, 4vw, 24px)",
      fontWeight: "600",
      marginBottom: "20px",
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
    },
    headerSection: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px',
      borderBottom: `1px solid ${isDarkMode ? "#444" : "#e0e0e0"}`,
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
      color: isDarkMode ? "#ccc" : "#555",
    },
    input: {
      padding: "12px",
      fontSize: "16px",
      borderRadius: "8px",
      border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      background: isDarkMode ? "#2a2a2a" : "#fff",
      color: isDarkMode ? "#ffffff" : "#333",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: "4px",
      background: isDarkMode ? "#2a2a2a" : "#fff",
      border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      maxHeight: "200px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "12px",
      cursor: "pointer",
      borderBottom: `1px solid ${isDarkMode ? "#3a3a3a" : "#f0f0f0"}`,
      transition: "background 0.2s",
      color: isDarkMode ? "#ffffff" : "#333",
      background: isDarkMode ? "#2a2a2a" : "#fff",
    },
    dropdownEmpty: {
      padding: "12px",
      color: isDarkMode ? "#aaa" : "#999",
      textAlign: "center",
      fontSize: "14px",
      background: isDarkMode ? "#2a2a2a" : "#fff",
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
      border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
      color: isDarkMode ? "#ccc" : "#666",
      padding: "12px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "500",
      minWidth: "120px",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: "all 0.2s ease",
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
      transition: "all 0.2s ease",
    },
  };

  const renderLeaderDropdown = (leaderField) => {
    if (!showDropdowns[leaderField]) {
      return null;
    }

    return (
      <div style={styles.dropdown}>
        {loadingLeaders && (
          <div style={styles.dropdownEmpty}>Loading...</div>
        )}
        {!loadingLeaders && leaderResults[leaderField].length === 0 && leaderSearches[leaderField].length >= 1 && (
          <div style={styles.dropdownEmpty}>No people found</div>
        )}
        {!loadingLeaders && leaderSearches[leaderField].length === 0 && (
          <div style={styles.dropdownEmpty}>Type to search leaders...</div>
        )}
        {!loadingLeaders && leaderResults[leaderField].map((person) => (
          <div
            key={`${leaderField}-${person.id}`}
            style={styles.dropdownItem}
            onClick={() => handleLeaderSelect(person, leaderField)}
            onMouseEnter={(e) => e.target.style.background = isDarkMode ? "#3a3a3a" : "#f8f9fa"}
            onMouseLeave={(e) => e.target.style.background = isDarkMode ? "#2a2a2a" : "#fff"}
          >
            <div style={{ fontWeight: "500" }}>{person.fullName}</div>
            <div style={{ fontSize: "12px", color: isDarkMode ? "#999" : "#666" }}>
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
          <div style={{ fontWeight: '600', color: isDarkMode ? "#999" : "#999" }}>NEW PERSON INFO</div>
          <div style={{ fontWeight: '600', color: isDarkMode ? "#ccc" : "#333" }}>LEADER INFO</div>
        </div>

        <div style={{ height: '2px', background: isDarkMode ? "#444" : "#e0e0e0", margin: '20px 0' }}></div>

        <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={leaderSearches.leader1}
              onChange={(e) => handleLeaderSearchChange(e.target.value, 'leader1')}
              onFocus={() => {
                setShowDropdowns(prev => ({ ...prev, leader1: true }));
                if (leaderSearches.leader1.length === 0 && preloadedPeople.length > 0) {
                  setLeaderResults(prev => ({ 
                    ...prev, 
                    leader1: preloadedPeople.slice(0, 10) 
                  }));
                }
              }}
              style={styles.input}
              placeholder="Leader @1..."
              autoComplete="off"
            />
            {renderLeaderDropdown('leader1')}
          </div>

          <div style={styles.inputGroup}>
            <input
              type="text"
              value={leaderSearches.leader12}
              onChange={(e) => handleLeaderSearchChange(e.target.value, 'leader12')}
              onFocus={() => {
                setShowDropdowns(prev => ({ ...prev, leader12: true }));
                if (leaderSearches.leader12.length === 0 && preloadedPeople.length > 0) {
                  setLeaderResults(prev => ({ 
                    ...prev, 
                    leader12: preloadedPeople.slice(0, 10) 
                  }));
                }
              }}
              style={styles.input}
              placeholder="Leader @12..."
              autoComplete="off"
            />
            {renderLeaderDropdown('leader12')}
          </div>

          <div style={styles.inputGroup}>
            <input
              type="text"
              value={leaderSearches.leader144}
              onChange={(e) => handleLeaderSearchChange(e.target.value, 'leader144')}
              onFocus={() => {
                setShowDropdowns(prev => ({ ...prev, leader144: true }));
                if (leaderSearches.leader144.length === 0 && preloadedPeople.length > 0) {
                  setLeaderResults(prev => ({ 
                    ...prev, 
                    leader144: preloadedPeople.slice(0, 10) 
                  }));
                }
              }}
              style={styles.input}
              placeholder="Leader @144 "
              autoComplete="off"
            />
            {renderLeaderDropdown('leader144')}
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={styles.backBtn}
              onClick={onBack}
              onMouseEnter={(e) => e.target.style.background = isDarkMode ? "#3d3d3d" : "#f8f9fa"}
              onMouseLeave={(e) => e.target.style.background = "transparent"}
            >
              <ArrowLeft size={16} />
              BACK
            </button>
            <button
              type="button"
              style={styles.saveBtn}
              onClick={handleSave}
              onMouseEnter={(e) => e.target.style.background = "#218838"}
              onMouseLeave={(e) => e.target.style.background = "#28a745"}
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
    const [searchName, setSearchName] = useState("");
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
  const [preloadedPeople, setPreloadedPeople] = useState([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const isTicketedEvent = event?.isTicketed || false;
  const eventPriceTiers = event?.priceTiers || [];

  const decisionOptions = [
    { value: "first-time", label: "First-time commitment" },
    { value: "re-commitment", label: "Re-commitment" },
  ];

  const availablePaymentMethods = [...new Set(eventPriceTiers.map(t => t.paymentMethod))];

   useEffect(() => {
    if (isOpen && event) {
      console.log("🎯 Modal opened with event:", event);
      console.log("📋 Persistent attendees in event:", event.persistent_attendees);
      console.log("📋 Attendance data:", event.attendance);

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

  // Fixed missing loadPreloadedPeople function
  const loadPreloadedPeople = async () => {
    const now = Date.now();
    if (globalPeopleCache.data.length > 0 && globalPeopleCache.timestamp && 
        (now - globalPeopleCache.timestamp) < globalPeopleCache.expiry) {
      console.log("📦 Using cached people data in AttendanceModal");
      setPreloadedPeople(globalPeopleCache.data);
      return;
    }

    try {
      console.log("🔄 Fetching fresh people data for AttendanceModal cache");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append("perPage", "100");
      params.append("page", "1");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p.leader1 || "",
        leader12: p["Leader @12"] || p.leader12 || "",
        leader144: p["Leader @144"] || p.leader144 || "",
        phone: p.Number || p.Phone || p.phone || "",
      }));

      // Update global cache
      globalPeopleCache = {
        data: formatted,
        timestamp: now,
        expiry: 5 * 60 * 1000
      };

      setPreloadedPeople(formatted);
      console.log(`✅ Pre-loaded ${formatted.length} people into AttendanceModal cache`);
    } catch (err) {
      console.error("Error pre-loading people in AttendanceModal:", err);
      if (globalPeopleCache.data.length > 0) {
        setPreloadedPeople(globalPeopleCache.data);
      }
    }
  }

    // Helper function to get current week identifier
  function get_current_week_identifier() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }


function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const handleSubmitAttendance = (attendanceData) => {
  console.log("📝 Preparing to submit attendance:");
  console.log("   Event ID:", event?._id); // Changed from props.event to event
  console.log("   Did Not Meet:", attendanceData === "did_not_meet");
  console.log("   Checked-in Attendees:", Array.isArray(attendanceData) ? attendanceData.length : 'unknown');
  console.log("   Persistent Attendees:", attendanceData?.all_attendees?.length || 'unknown');
  console.log("   Current Week:", get_current_week_identifier()); // Use your existing function
  
  console.log("🔄 Using onSubmit prop...");
  
  // Call the function passed from Events.jsx
  if (onSubmit) { // Changed from props.onSubmit to onSubmit
    return onSubmit(attendanceData);
  } else {
    console.error("❌ No onSubmit prop provided to AttendanceModal");
    return Promise.resolve({ success: false, message: "No submit handler" });
  }
};

  const fetchPeople = async (filter = "", leader1 = "", leader12 = "", leader144 = "", leader1728 = "") => {
    const cacheKey = `${filter}-${leader1}-${leader12}-${leader144}-${leader1728}`;

    // First try to use cached results
    if (peopleCache[cacheKey]) {
      console.log("📦 Using cached results for:", cacheKey);
      setPeople(peopleCache[cacheKey]);
      return;
    }

    // Then try to filter from preloaded data for instant results
    if (preloadedPeople.length > 0 && (!filter || filter.length < 3)) {
      const filteredFromPreloaded = preloadedPeople.filter(person =>
        person.fullName.toLowerCase().includes(filter.toLowerCase()) ||
        person.email.toLowerCase().includes(filter.toLowerCase())
      );
      
      if (filteredFromPreloaded.length > 0) {
        console.log("⚡ Using preloaded data for instant results");
        setPeople(filteredFromPreloaded.slice(0, 50));
        setPeopleCache(prev => ({
          ...prev,
          [cacheKey]: filteredFromPreloaded.slice(0, 50)
        }));
        return;
      }
    }

    // Fallback to API call
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
        phone: p.Number || p.Phone || p.phone || "",
      }));

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
        phone: p.Number || p.Phone || p.phone || "", 
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

    const currentWeek = getCurrentWeekIdentifier();
    
    // ✅ FIX 1: Always load persistent attendees first
    const persistentList = event.persistent_attendees || [];
    console.log(`📋 Found ${persistentList.length} persistent attendees in event data`);
    
    // ✅ FIX 2: ALWAYS set the persistent list regardless of week status
    setPersistentCommonAttendees(persistentList);
    
    // Check if THIS WEEK has been captured
    const hasCurrentWeekData = 
        event.attendance && 
        event.attendance[currentWeek] && 
        event.attendance[currentWeek].attendees &&
        event.attendance[currentWeek].attendees.length > 0 &&
        event.attendance[currentWeek].status === 'complete';

    const hasCurrentWeekDidNotMeet = 
        event.attendance && 
        event.attendance[currentWeek] && 
        event.attendance[currentWeek].status === 'did_not_meet';

    console.log(`🔍 Current week: ${currentWeek}`);
    console.log(`📊 Has current week data: ${hasCurrentWeekData}`);
    console.log(`📊 Has current week did not meet: ${hasCurrentWeekDidNotMeet}`);

    // ✅ CASE 1: Current week HAS been captured - show checked state
    if (hasCurrentWeekData) {
        console.log("✅ Current week captured - loading checked state");

        const weekData = event.attendance[currentWeek];
        const newCheckedIn = {};
        const newDecisions = {};
        const newDecisionTypes = {};

        // Mark attendees as checked
        weekData.attendees.forEach(attendee => {
            if (attendee.id) {
                newCheckedIn[attendee.id] = true;

                if (attendee.decision) {
                    newDecisions[attendee.id] = true;
                    newDecisionTypes[attendee.id] = attendee.decision;
                }
            }
        });

        setCheckedIn(newCheckedIn);
        setDecisions(newDecisions);
        setDecisionTypes(newDecisionTypes);
        setDidNotMeet(false);

        console.log(`✅ Loaded: ${persistentList.length} names, ${Object.keys(newCheckedIn).length} checked`);
    } 
    // ✅ CASE 2: Current week marked as "did not meet"
    else if (hasCurrentWeekDidNotMeet) {
        console.log("🔴 Current week marked as DID NOT MEET");
        
        setDidNotMeet(true);
        setCheckedIn({});
        
    }
    // ✅ CASE 3: NEW WEEK - Show names but nothing checked
    else {
        console.log("🆕 NEW WEEK - Names listed but NOTHING checked");

        // ✅ CRITICAL: All checkboxes start UNCHECKED
        setCheckedIn({});
        setDecisions({});
        setDecisionTypes({});
        setManualHeadcount("");
        setDidNotMeet(false);

        console.log(`✅ Loaded ${persistentList.length} names - all UNCHECKED (new week)`);
    }
};

function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, '0')}`;
}

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

  useEffect(() => {
    if (isOpen) {
      loadPreloadedPeople();
    }
  }, [isOpen]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen && activeTab === 1) {
        // Use cached/preloaded data for faster response
        if (associateSearch.length < 3 && preloadedPeople.length > 0) {
          const filtered = preloadedPeople.filter(person =>
            person.fullName.toLowerCase().includes(associateSearch.toLowerCase()) ||
            person.email.toLowerCase().includes(associateSearch.toLowerCase())
          );
          setPeople(filtered.slice(0, 50));
        } else {
          fetchPeople(associateSearch, leader1Filter, leader12Filter, leader144Filter, leader1728Filter);
        }
      }
    }, 100);
    
    return () => clearTimeout(delay);
  }, [associateSearch, isOpen, activeTab, leader1Filter, leader12Filter, leader144Filter, leader1728Filter, preloadedPeople]);

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
        const fixedAttendee = {
          ...persistentAttendee,
          fullName: persistentAttendee.fullName || persistentAttendee.name || "Unknown Person",
          email: persistentAttendee.email || "",
          leader12: persistentAttendee.leader12 || "",
          leader144: persistentAttendee.leader144 || "",
          phone: persistentAttendee.phone || "",
        };
        combined.push(fixedAttendee);
      }
    });

    return combined;
  };
  // Calculate statistics
  const attendeesCount = Object.keys(checkedIn).filter(id => checkedIn[id]).length;
  const decisionsCount = Object.keys(decisions).filter(id => decisions[id]).length;
  const firstTimeCount = Object.values(decisionTypes).filter(type => type === "first-time").length;
  const reCommitmentCount = Object.values(decisionTypes).filter(type => type === "re-commitment").length;
  
  const totalPaid = Object.values(paidAmounts).reduce((sum, amount) => sum + amount, 0);
  const totalOwing = Object.keys(checkedIn)
    .filter(id => checkedIn[id])
    .reduce((sum, id) => sum + calculateOwing(id), 0);

  const filteredCommonAttendees = getAllCommonAttendees().filter(person =>
    person.fullName.toLowerCase().includes(searchName.toLowerCase()) ||
    person.email.toLowerCase().includes(searchName.toLowerCase())
  );

  const filteredPeople = people.filter(person =>
    person.fullName.toLowerCase().includes(associateSearch.toLowerCase()) ||
    person.email.toLowerCase().includes(associateSearch.toLowerCase())
  );

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
            checked_in: true 
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
    console.log("   Checked-in Attendees:", selectedAttendees.length);
    console.log("   Persistent Attendees:", persistentCommonAttendees.length);
    console.log("   Current Week:", getCurrentWeekIdentifier());

    try {
        let result;

        if (typeof onSubmit === "function") {
            console.log("🔄 Using onSubmit prop...");

            if (didNotMeet) {
                result = await onSubmit("did_not_meet");
            } else {
                // ✅ CRITICAL: Send both checked-in attendees AND persistent list
                result = await onSubmit({
                    attendees: selectedAttendees,
                    all_attendees: persistentCommonAttendees, // ✅ Send persistent list
                    leaderEmail: currentUser?.email || "",
                    leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
                    did_not_meet: false,
                    isTicketed: isTicketedEvent,
                    week: getCurrentWeekIdentifier()
                });
            }
        } else {
            console.log("🔄 Using direct API call...");

            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            };

            // ✅ CRITICAL: Send both checked-in AND persistent attendees
            const payload = {
                attendees: selectedAttendees,
                all_attendees: persistentCommonAttendees, // ✅ Send persistent list
                leaderEmail: currentUser?.email || "",
                leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
                did_not_meet: didNotMeet,
                isTicketed: isTicketedEvent,
                week: getCurrentWeekIdentifier()
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
        console.error("❌ Error submitting attendance:", error);
        setAlert({
            open: true,
            type: "error",
            message: "Something went wrong while submitting attendance.",
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

            // ✅ CRITICAL: Send persistent list even for "Did Not Meet"
            const payload = {
                attendees: [],
                all_attendees: persistentCommonAttendees, // ✅ Send persistent list
                leaderEmail: currentUser?.email || "",
                leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
                did_not_meet: true,
                isTicketed: isTicketedEvent,
                week: getCurrentWeekIdentifier()
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

    // Invalidate cache since we added a new person
    globalPeopleCache = {
      data: [],
      timestamp: null,
      expiry: 5 * 60 * 1000
    };

    // Refresh the people list and preloaded data
    fetchPeople();
    loadPreloadedPeople();

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

  // Styles definition
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
      gap: "0",
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
    persistentBadge: {
      background: "#6366f1",
      color: "#fff",
      padding: "2px 8px",
      borderRadius: "4px",
      fontSize: "10px",
      fontWeight: "600",
      marginLeft: "8px",
    },
    iconButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    mobileAttendeeCard: {
      background: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "12px",
    },
    mobileCardRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
    },
    mobileCardInfo: {
      flex: 1,
    },
    mobileCardName: {
      fontWeight: "600",
      fontSize: "16px",
      color: "#333",
      marginBottom: "4px",
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
    },
    mobileCardEmail: {
      fontSize: "14px",
      color: "#666",
      marginBottom: "4px",
    },
    confirmOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10002,
      padding: "20px",
    },
    confirmModal: {
      background: "#fff",
      borderRadius: "12px",
      padding: "24px",
      maxWidth: "400px",
      width: "100%",
    },
    confirmHeader: {
      marginBottom: "16px",
    },
    confirmTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#333",
      margin: 0,
    },
    confirmBody: {
      marginBottom: "24px",
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
      margin: "0 0 8px 0",
    },
    confirmSubMessage: {
      fontSize: "14px",
      color: "#666",
      margin: 0,
    },
    confirmFooter: {
      display: "flex",
      gap: "12px",
      justifyContent: "flex-end",
    },
    confirmCancelBtn: {
      background: "transparent",
      border: "1px solid #ddd",
      color: "#666",
      padding: "10px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
    },
    confirmProceedBtn: {
      background: "#dc3545",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
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
      zIndex: 10001,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      maxWidth: "90vw",
      textAlign: "center",
    },
    alertSuccess: {
      background: "#28a745",
    },
    alertError: {
      background: "#dc3545",
    },
  };

  // Mobile attendee card renderer
  const renderMobileAttendeeCard = (person) => {
    const isPersistent = persistentCommonAttendees.some(p => p.id === person.id);
    const isCheckedIn = checkedIn[person.id];

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
              ...(isCheckedIn ? styles.radioButtonChecked : {}),
            }}
            onClick={() => handleCheckIn(person.id, person.fullName)}
          >
            {isCheckedIn && (
              <span style={styles.radioButtonInner}>✓</span>
            )}
          </button>
        </div>

        {isCheckedIn && isTicketedEvent && (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Price Tier Selection */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Price Tier</label>
              <div style={styles.decisionDropdown}>
                <button
                  style={styles.priceTierButton}
                  onClick={() => setOpenPriceTierDropdown(
                    openPriceTierDropdown === person.id ? null : person.id
                  )}
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
                          onClick={() => handlePriceTierSelect(person.id, index)}
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
            </div>

            {/* Payment Method */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Payment Method</label>
              <div style={styles.decisionDropdown}>
                <button
                  style={styles.paymentButton}
                  onClick={() => setOpenPaymentDropdown(
                    openPaymentDropdown === person.id ? null : person.id
                  )}
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
                        onClick={() => handlePaymentMethodSelect(person.id, method)}
                      >
                        {method}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Price</label>
                <span style={styles.priceInput}>
                  R{priceTiers[person.id]?.price.toFixed(2) || "0.00"}
                </span>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Paid</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmounts[person.id] || ""}
                  onChange={(e) => handlePaidAmountChange(person.id, e.target.value)}
                  placeholder="0.00"
                  style={styles.paidInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Owing</label>
                <span
                  style={{
                    ...styles.owingText,
                    ...(calculateOwing(person.id) === 0 ? styles.owingPositive : styles.owingNegative),
                  }}
                >
                  R{calculateOwing(person.id).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {isCheckedIn && !isTicketedEvent && (
          <div style={{ marginTop: "12px" }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Decision</label>
              <div style={styles.decisionDropdown}>
                <button
                  style={styles.decisionButton}
                  onClick={() => setOpenDecisionDropdown(
                    openDecisionDropdown === person.id ? null : person.id
                  )}
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
                        onClick={() => handleDecisionTypeSelect(person.id, option.value)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.header}>
            <h2 style={styles.title}>
              ATTENDANCE
              {isTicketedEvent && (
                <span style={styles.ticketBadge}>Ticketed Event</span>
              )}
            </h2>
            <button
              style={styles.addPersonBtn}
              onClick={() => setShowAddPersonModal(true)}
            >
              <UserPlus size={18} />
              Add New Person
            </button>
          </div>

          <div style={styles.tabsContainer}>
            {isMobile && (
              <button
                style={styles.mobileMenuButton}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu size={20} />
              </button>
            )}
            {(!isMobile || showMobileMenu) && (
              <>
                <button
                  style={{
                    ...styles.tab,
                    ...(activeTab === 0 ? styles.tabActive : {})
                  }}
                  onClick={() => setActiveTab(0)}
                >
CAPTURE ATTENDEES                </button>
                <button
                  style={{
                    ...styles.tab,
                    ...(activeTab === 1 ? styles.tabActive : {})
                  }}
                  onClick={() => setActiveTab(1)}
                >
                  ASSOCIATE PERSON 
                </button>
              </>
            )}
          </div>

          <div style={styles.contentArea}>
            {activeTab === 0 && (
              <>
                <div style={styles.searchBox}>
                  <Search size={20} style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search attendees..."
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
                                            e.stopPropagation();
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
                                                    e.stopPropagation();
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