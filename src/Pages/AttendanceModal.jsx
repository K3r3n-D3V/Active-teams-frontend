import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  UserPlus,
  Search,
  CheckCircle,
  ChevronDown,
  X,
  Menu,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import AddPersonDialog from "../components/AddPersonDialog.jsx";


let globalPeopleCache = {
  data: [],
  timestamp: null,
  expiry: 5 * 60 * 1000,
};

const AddPersonToEvents = ({ isOpen, onClose, onPersonAdded }) => {

  const theme = useTheme();

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
  // const [alert, setAlert] = useState({ open: false, type: "success", message: "" });
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

  const loadPreloadedPeople = async (forceRefresh = false) => {
    const now = Date.now();

    if (!forceRefresh && globalPeopleCache.data.length > 0 && globalPeopleCache.timestamp &&
      (now - globalPeopleCache.timestamp) < globalPeopleCache.expiry) {
      console.log("Using cached people data in AddPersonToEvents");
      setPreloadedPeople(globalPeopleCache.data);
      return;
    }

    try {
      console.log("Fetching fresh people data for AddPersonToEvents cache");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append("perPage", "1000");
      params.append("page", "1");
      params.append("sortBy", "updatedAt");
      params.append("sortOrder", "desc");

      if (forceRefresh) {
        params.append("_t", now.toString());
      }

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      console.log(`Fetched ${peopleArray.length} people from server`);

      const formatted = peopleArray.map((p) => {
        // CONSISTENT FIELD MAPPING FOR ALL LEADERSHIP LEVELS
        const leader1 = p["Leader @1"] || p["Leader at 1"] || p["Leader @ 1"] || p.leader1 || (p.leaders && p.leaders[0]) || "";
        const leader12 = p["Leader @12"] || p["Leader at 12"] || p["Leader @ 12"] || p.leader12 || (p.leaders && p.leaders[1]) || "";
        const leader144 = p["Leader @144"] || p["Leader at 144"] || p["Leader @ 144"] || p.leader144 || (p.leaders && p.leaders[2]) || "";
        const leader1728 = p["Leader @1728"] || p["Leader @ 1728"] || p["Leader at 1728"] || p["Leader @ 1728"] || p.leader1728 || (p.leaders && p.leaders[3]) || "";

        return {
          id: p._id,
          fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
          email: p.Email || p.email || "",
          leader1: leader1,
          leader12: leader12,
          leader144: leader144,
          leader1728: leader1728,
          phone: p.Number || p.Phone || p.phone || "",
          rawData: p
        };
      });

      globalPeopleCache = {
        data: formatted,
        timestamp: now,
        expiry: 2 * 60 * 1000
      };

      setPreloadedPeople(formatted);
      console.log(`Pre-loaded ${formatted.length} people into AddPersonToEvents cache`);

      const recentPeople = formatted.slice(0, 5);
      console.log("Most recent people in cache:", recentPeople);
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

      const filteredFromCache = preloadedPeople.filter(person =>
        person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredFromCache.length > 0) {
        setInviterResults(filteredFromCache.slice(0, 20));
      } else {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const params = new URLSearchParams();
        params.append("name", searchTerm);
        params.append("perPage", "20");

        const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });
        const data = await res.json();
        const peopleArray = data.people || data.results || [];

        // CONSISTENT FIELD MAPPING FOR ALL LEADERSHIP LEVELS
        const formatted = peopleArray.map((p) => {
          const leader1 = p["Leader @1"] || p["Leader at 1"] || p["Leader @ 1"] || p.leader1 || (p.leaders && p.leaders[0]) || "";
          const leader12 = p["Leader @12"] || p["Leader at 12"] || p["Leader @ 12"] || p.leader12 || (p.leaders && p.leaders[1]) || "";
          const leader144 = p["Leader @144"] || p["Leader at 144"] || p["Leader @ 144"] || p.leader144 || (p.leaders && p.leaders[2]) || "";
          const leader1728 = p["Leader @1728"] || p["Leader @ 1728"] || p["Leader at 1728"] || p["Leader @ 1728"] || p.leader1728 || (p.leaders && p.leaders[3]) || "";

          return {
            id: p._id,
            fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
            email: p.Email || p.email || "",
            leader1: leader1,
            leader12: leader12,
            leader144: leader144,
            leader1728: leader1728,
            phone: p.Number || p.Phone || p.phone || "",
          };
        });

        setInviterResults(formatted);
        console.log("Inviter search results for '" + searchTerm + "':", formatted);
      }
    } catch (err) {
      console.error("Error fetching inviters:", err);
    } finally {
      setLoadingInviters(false);
    }
  };

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
    console.log("Selected inviter:", person.fullName);
    setFormData({ ...formData, invitedBy: person.fullName });
    setInviterSearch(person.fullName);
    setShowInviterDropdown(false);
    setTouched({ ...touched, invitedBy: true });

    const normalizedFull = (person.fullName || "").trim().toLowerCase();
    const leader1Raw = (person.leader1 || "").trim().toLowerCase();
    const leader12Raw = (person.leader12 || "").trim().toLowerCase();
    const leader144Raw = (person.leader144 || "").trim().toLowerCase();
    const leader1728Raw = (person.leader1728 || "").trim().toLowerCase();

    console.log("Leadership analysis:", {
      inviterName: normalizedFull,
      leader1: person.leader1,
      leader12: person.leader12,
      leader144: person.leader144,
      leader1728: person.leader1728,
    });

    let leadersToFill;

    const isLeader144 = leader12Raw && !leader144Raw && !leader1728Raw;

    const isLeader12 = leader1Raw && !leader12Raw && !leader144Raw && !leader1728Raw;

    // 3. Leader @1: Has their own name as L@1 OR all leadership fields empty
    const isLeader1 = (leader1Raw === normalizedFull) || (!leader1Raw && !leader12Raw && !leader144Raw && !leader1728Raw);

    console.log("Leadership detection:", {
      isLeader144,
      isLeader12,
      isLeader1,
      isSelfL1: leader1Raw === normalizedFull
    });

    if (isLeader144) {
      leadersToFill = {
        leader1: person.leader1 || "",
        leader12: person.leader12 || "",
        leader144: person.fullName || "",
      };
      console.log("DETECTED: Leader @144 - Empty L@144 field with filled L@12");
    }
    else if (isLeader12) {
      leadersToFill = {
        leader1: person.leader1 || "",
        leader12: person.fullName || "",
        leader144: "",
      };
      console.log("DETECTED: Leader @12 - Empty L@12 field with filled L@1");
    }
    else if (isLeader1) {
      leadersToFill = {
        leader1: person.fullName || "",
        leader12: "",
        leader144: "",
      };
      console.log("DETECTED: Leader @1 - All leadership fields empty");
    }

    else {
      leadersToFill = {
        leader1: person.leader1 || "",
        leader12: person.leader12 || "",
        leader144: person.leader144 || "",
      };
      console.log("REGULAR: Person has complete leadership chain");
    }

    setAutoFilledLeaders(leadersToFill);
    console.log("Final auto-filled leaders:", leadersToFill);
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
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);

      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");

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
          leaderInfo.leader144 || "",
          "" // Leader @1728 is always empty for now
        ],
        stage: "Win",
      };
      console.log("Sending person data to backend:", personData);

      const response = await fetch(`${BACKEND_URL}/people`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(personData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Person created successfully:", data);

        globalPeopleCache = {
          data: [],
          timestamp: null,
          expiry: 5 * 60 * 1000
        };

        // setAlert({
        //   open: true,
        //   type: "success",
        //   message: "Person added successfully!",
        // })
        // toast.success("Person added successfully!");;

        if (typeof onPersonAdded === "function") {
          onPersonAdded(data.person || data);
        }

        setTimeout(() => {
          loadPreloadedPeople(true);
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
        console.error("Add person error - FULL DETAILS:", {
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

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Network error adding person:", error);
      toast.error("Network error: Could not connect to server");
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

  const getCurrentTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  };

  const currentTheme = getCurrentTheme();
  const isDarkMode = currentTheme === 'dark';

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
      background: theme.palette.background.paper,
      borderRadius: "12px",
      width: "100%",
      maxWidth: "600px",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "20px",
      color: theme.palette.text.primary,
    },
    title: {
      fontSize: "clamp(20px, 4vw, 24px)",
      fontWeight: "600",
      marginBottom: "20px",
      color: theme.palette.text.primary,
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
      color: theme.palette.text.primary,
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

  // Theme colors
  backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
  color: theme.palette.text.primary,

  // Fix for autofill background
  "&:-webkit-autofill": {
    WebkitBoxShadow: `0 0 0px 1000px ${isDarkMode ? "#1e1e1e" : "#fff"} inset`,
    WebkitTextFillColor: theme.palette.text.primary,
    caretColor: theme.palette.text.primary,
  },
  
  "&:-webkit-autofill:focus": {
    WebkitBoxShadow: `0 0 0px 1000px ${isDarkMode ? "#1e1e1e" : "#fff"} inset`,
    WebkitTextFillColor: theme.palette.text.primary,
  },

  // Remove default autofill styles
  transition: "background-color 5000s ease-in-out 0s",
},

inputError: {
  padding: "12px",
  fontSize: "16px",
  borderRadius: "8px",
  border: "2px solid #dc3545",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",

  // Theme colors
  backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
  color: theme.palette.text.primary,

  // Fix for autofill background in error state
  "&:-webkit-autofill": {
    WebkitBoxShadow: `0 0 0px 1000px ${isDarkMode ? "#1e1e1e" : "#fff"} inset`,
    WebkitTextFillColor: theme.palette.text.primary,
    caretColor: theme.palette.text.primary,
    border: "2px solid #dc3545",
  },
  
  "&:-webkit-autofill:focus": {
    WebkitBoxShadow: `0 0 0px 1000px ${isDarkMode ? "#1e1e1e" : "#fff"} inset`,
    WebkitTextFillColor: theme.palette.text.primary,
    border: "2px solid #dc3545",
  },

  transition: "background-color 5000s ease-in-out 0s",
},
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: "4px",
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      maxHeight: "200px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "12px",
      cursor: "pointer",
      borderBottom: `1px solid ${theme.palette.divider}`,
      transition: "background 0.2s",
      color: theme.palette.text.primary,
      background: theme.palette.background.default,
    },
    dropdownEmpty: {
      padding: "12px",
      color: theme.palette.text.secondary,
      textAlign: "center",
      fontSize: "14px",
      background: theme.palette.background.default,
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
      color: theme.palette.text.primary,
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
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
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
      background: theme.palette.primary.main,
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
                      onMouseEnter={(e) => e.target.style.background = theme.palette.action.hover}
                      onMouseLeave={(e) => e.target.style.background = theme.palette.background.paper}
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
                onMouseEnter={(e) => e.target.style.background = theme.palette.action.hover}
                onMouseLeave={(e) => e.target.style.background = theme.palette.background.paper}
              >
                CANCEL
              </button>
              <button
                type="button"
                style={styles.nextBtn}
                onClick={handleNext}
                onMouseEnter={(e) => e.target.style.background = theme.palette.primary.dark}
                onMouseLeave={(e) => e.target.style.background = theme.palette.primary.main}
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


    </>
  );
};

const LeaderSelectionModal = ({ isOpen, onBack, onSubmit, preloadedPeople = [], autoFilledLeaders }) => {
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
    leader144: false
  });

  const [loadingLeaders, setLoadingLeaders] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
  const theme = useTheme();

  useEffect(() => {
    if (isOpen && autoFilledLeaders) {
      const filledLeaders = {
        leader1: autoFilledLeaders.leader1 || "",
        leader12: autoFilledLeaders.leader12 || "",
        leader144: autoFilledLeaders.leader144 || ""
      };

      setLeaderData(filledLeaders);
      setLeaderSearches(filledLeaders);
    }
  }, [isOpen, autoFilledLeaders]);

  const fetchLeaders = async (searchTerm, leaderField) => {
    if (!searchTerm || searchTerm.length < 1) {
      setLeaderResults((prev) => ({ ...prev, [leaderField]: [] }));
      return;
    }

    try {
      setLoadingLeaders(true);
      const filteredFromCache = preloadedPeople.filter(
        (person) =>
          person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filteredFromCache.length > 0) {
        setLeaderResults((prev) => ({
          ...prev,
          [leaderField]: filteredFromCache.slice(0, 15),
        }));
      } else {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const params = new URLSearchParams();
        params.append("name", searchTerm);
        params.append("perPage", "15");

        const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });
        const data = await res.json();
        const peopleArray = data.people || data.results || [];

        const formatted = peopleArray.map((p) => {
          const leader1 = p["Leader @1"] || p["Leader at 1"] || p["Leader @ 1"] || p.leader1 || (p.leaders && p.leaders[0]) || "";
          const leader12 = p["Leader @12"] || p["Leader at 12"] || p["Leader @ 12"] || p.leader12 || (p.leaders && p.leaders[1]) || "";
          const leader144 = p["Leader @144"] || p["Leader at 144"] || p["Leader @ 144"] || p.leader144 || (p.leaders && p.leaders[2]) || "";
          const leader1728 = p["Leader @1728"] || p["Leader @ 1728"] || p["Leader at 1728"] || p["Leader @ 1728"] || p.leader1728 || (p.leaders && p.leaders[3]) || "";

          return {
            id: p._id,
            fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
            email: p.Email || p.email || "",
            leader1: leader1,
            leader12: leader12,
            leader144: leader144,
            leader1728: leader1728,
          };
        });

        setLeaderResults(prev => ({ ...prev, [leaderField]: formatted }));
      }
    } catch (err) {
      console.error(`Error fetching leaders for ${leaderField}:`, err);
    } finally {
      setLoadingLeaders(false);
    }
  };

  useEffect(() => {
    const delays = {};

    ['leader1', 'leader12', 'leader144'].forEach(field => {
      const searchTerm = leaderSearches[field];
      if (searchTerm.length >= 1) {
        delays[field] = setTimeout(() => {
          fetchLeaders(searchTerm, field);
        }, 150);
      } else {
        setLeaderResults(prev => ({ ...prev, [field]: [] }));
      }
    });

    return () => {
      Object.values(delays).forEach(clearTimeout);
    };
  }, [leaderSearches, preloadedPeople]);

  const handleLeaderSelect = (person, field) => {
    setLeaderData(prev => ({ ...prev, [field]: person.fullName }));
    setLeaderSearches(prev => ({ ...prev, [field]: person.fullName }));
    setShowDropdowns(prev => ({ ...prev, [field]: false }));
  };

  const handleSearchChange = (e, field) => {
    const value = e.target.value;
    setLeaderSearches(prev => ({ ...prev, [field]: value }));
    setShowDropdowns(prev => ({ ...prev, [field]: true }));
  };

  const handleClearField = (field) => {
    setLeaderData(prev => ({ ...prev, [field]: "" }));
    setLeaderSearches(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmitLeaders = () => {
    const finalLeaderInfo = {
      leader1: leaderData.leader1 || "",
      leader12: leaderData.leader12 || "",
      leader144: leaderData.leader144 || "",
      leader1728: ""
    };
    onSubmit(finalLeaderInfo);
  };

  const getCurrentTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  };

  const currentTheme = getCurrentTheme();
  const isDarkMode = currentTheme === 'dark';

  const leaderLabels = {
    leader1: "Leader @1",
    leader12: "Leader @12",
    leader144: "Leader @144"
  };

  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDarkMode ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10002,
      padding: "20px",
      backdropFilter: "blur(8px)",
    },
    modal: {
      background: isDarkMode ? "#1e1e1e" : "#fff",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "80vh",
      overflowY: "auto",
      padding: "24px",
      color: isDarkMode ? "#fff" : "#333",
      boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    },
    title: {
      fontSize: "22px",
      fontWeight: "600",
      marginBottom: "8px",
      textAlign: "center",
      color: theme.palette.text.primary,
    },
    subtitle: {
      fontSize: "14px",
      marginBottom: "24px",
      textAlign: "center",
      color: theme.palette.text.secondary,
    },
    leaderGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      marginBottom: "24px",
    },
    inputGroup: {
      position: "relative",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "6px",
      color: isDarkMode ? "#ccc" : "#555",
      display: "block",
    },
    inputContainer: {
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
input: {
  padding: "12px 40px 12px 12px",
  fontSize: "14px",
  borderRadius: "8px",
  border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  background: isDarkMode ? "#2a2a2a" : "#fff",
  color: isDarkMode ? "#fff" : "#333",
  
  // Fix for autofill
  "&:-webkit-autofill": {
    WebkitBoxShadow: `0 0 0px 1000px ${isDarkMode ? "#2a2a2a" : "#fff"} inset`,
    WebkitTextFillColor: isDarkMode ? "#fff" : "#333",
    caretColor: isDarkMode ? "#fff" : "#333",
  },
  
  "&:-webkit-autofill:focus": {
    WebkitBoxShadow: `0 0 0px 1000px ${isDarkMode ? "#2a2a2a" : "#fff"} inset`,
    WebkitTextFillColor: isDarkMode ? "#fff" : "#333",
  },
  
  transition: "background-color 5000s ease-in-out 0s",
},
    clearButton: {
      position: "absolute",
      right: "8px",
      background: "none",
      border: "none",
      color: isDarkMode ? "#999" : "#999",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "4px",
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: "4px",
      background: isDarkMode ? "#2a2a2a" : "#fff",
      border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1003,
      maxHeight: "160px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "10px 12px",
      cursor: "pointer",
      borderBottom: `1px solid ${isDarkMode ? "#3a3a3a" : "#f0f0f0"}`,
      color: isDarkMode ? "#fff" : "#333",
      background: isDarkMode ? "#2a2a2a" : "#fff",
      fontSize: "14px",
    },
    dropdownEmpty: {
      padding: "12px",
      color: isDarkMode ? "#999" : "#999",
      textAlign: "center",
      fontSize: "14px",
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      marginTop: "16px",
    },
    backBtn: {
      background: "transparent",
      border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
      color: isDarkMode ? "#ccc" : "#666",
      padding: "12px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    },
    submitBtn: {
      background: "#6366f1",
      color: "#fff",
      border: "none",
      padding: "12px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      flex: 1,
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Set Leadership</h2>

        <div style={styles.leaderGroup}>
          {['leader1', 'leader12', 'leader144'].map((field) => (
            <div key={field} style={styles.inputGroup}>
              <label style={styles.label}>{leaderLabels[field]}</label>

              <div style={styles.inputContainer}>
                <input
                  // type="text"
                  value={leaderSearches[field]}
                  // onChange={(e) => handleSearchChange(e, field)}
                  // onFocus={() => setShowDropdowns(prev => ({ ...prev, [field]: true }))}
                  onBlur={() => setTimeout(() => setShowDropdowns(prev => ({ ...prev, [field]: false })), 200)}
                  style={styles.input}
                  placeholder={`Type to search...`}
                  autoComplete="off"
                />
                
                {/* {leaderSearches[field] && (
                  <button 
                    type="button" 
                    style={styles.clearButton}
                    onClick={() => handleClearField(field)}
                  >
                    <X size={14} />
                  </button>
                )} */}
                
                {/* {showDropdowns[field] && leaderSearches[field].length > 0 && (
                  <div style={styles.dropdown}>
                    {loadingLeaders && (
                      <div style={styles.dropdownEmpty}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '14px', 
                            height: '14px', 
                            border: `2px solid ${isDarkMode ? '#555' : '#ddd'}`,
                            borderTop: `2px solid #6366f1`,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Searching...
                        </div>
                      </div>
                    )}
                    {!loadingLeaders && leaderResults[field].length === 0 && (
                      <div style={styles.dropdownEmpty}>No results found</div>
                    )}
                    {!loadingLeaders && leaderResults[field].map((person) => (
                      <div
                        key={person.id}
                        style={styles.dropdownItem}
                        onClick={() => handleLeaderSelect(person, field)}
                        onMouseEnter={(e) => e.target.style.background = isDarkMode ? "#3a3a3a" : "#f5f5f5"}
                        onMouseLeave={(e) => e.target.style.background = isDarkMode ? "#2a2a2a" : "#fff"}
                      >
                        {person.fullName}
                      </div>
                    ))}
                  </div>
                )} */}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="button"
            style={styles.backBtn}
            onClick={onBack}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            style={styles.submitBtn}
            onClick={handleSubmitLeaders}
          >
            Create Person
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// import { toast } from "react-toastify";

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
  // const [alert, setAlert] = useState({
  //   open: false,
  //   type: "success",
  //   message: "",
  // });
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [manualHeadcount, setManualHeadcount] = useState("");
  const [didNotMeet, setDidNotMeet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDidNotMeetConfirm, setShowDidNotMeetConfirm] = useState(false);
  const [persistentCommonAttendees, setPersistentCommonAttendees] = useState([]);
  // const [peopleCache, setPeopleCache] = useState({});
  const [preloadedPeople, setPreloadedPeople] = useState([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const isTicketedEvent = event?.isTicketed || false;
  const eventPriceTiers = event?.priceTiers || [];
  const theme = useTheme();

  const isDarkMode = theme.palette.mode === "dark";
  const decisionOptions = [
    { value: "first-time", label: "First-time commitment" },
    { value: "re-commitment", label: "Re-commitment" },
  ];

  const availablePaymentMethods = [...new Set(eventPriceTiers.map(t => t.paymentMethod))];

  useEffect(() => {
    if (isOpen && event) {
      console.log("=== EVENT DATA DEBUG ===");
      console.log("Full event object:", event);
      console.log("Event ID:", event._id || event.id);
      console.log("Event persistent_attendees:", event.persistent_attendees);
      console.log("Event status:", event.status);
      console.log("Event attendance:", event.attendance);

      // Debug: Check current week calculation
      const currentWeek = getCurrentWeekIdentifier();
      console.log("Current week identifier:", currentWeek);
      console.log("Current week attendance data:", event.attendance ? event.attendance[currentWeek] : "No attendance data");
      console.log("=========================");

      setSearchName("");
      setAssociateSearch("");
      setActiveTab(0);
      setShowMobileMenu(false);

      const loadPersistentData = async () => {
        const eventId = event._id || event.id;

        // Check if we have persistent attendees in the event data
        if (event.persistent_attendees && Array.isArray(event.persistent_attendees) && event.persistent_attendees.length > 0) {
          console.log("Using persistent attendees from event data:", event.persistent_attendees.length);
          setPersistentCommonAttendees(event.persistent_attendees);
        } else {
          console.log("No persistent attendees in event data, fetching from API");
          // Try to fetch from API
          await fetchPersistentAttendees(eventId);
        }
      };

      loadPersistentData();
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

  const loadPreloadedPeople = async () => {
    const now = Date.now();

    // Check if global cache exists and is valid
    if (
      typeof window.globalPeopleCache !== 'undefined' &&
      window.globalPeopleCache.data?.length > 0 &&
      window.globalPeopleCache.timestamp &&
      now - window.globalPeopleCache.timestamp < window.globalPeopleCache.expiry
    ) {
      console.log("Using cached people data in AttendanceModal");
      setPreloadedPeople(window.globalPeopleCache.data);

      // Auto-populate the people list with preloaded data
      if (activeTab === 1 && !associateSearch.trim()) {
        setPeople(window.globalPeopleCache.data.slice(0, 50));
      }
      return;
    }

    try {
      console.log("Fetching fresh people data for AttendanceModal cache");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append("perPage", "100");
      params.append("page", "1");

      const res = await fetch(`${BACKEND_URL}/people?${params.toString()}`, {
        headers,
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p["Leader at 1"] || p["Leader @ 1"] || p.leader1 || p.leaders?.[0] || "",
        leader12: p["Leader @12"] || p["Leader at 12"] || p["Leader @ 12"] || p.leader12 || p.leaders?.[1] || "",
        leader144: p["Leader @144"] || p["Leader at 144"] || p["Leader @ 144"] || p.leader144 || p.leaders?.[2] || "",
        phone: p.Number || p.Phone || p.phone || "",
      }));

      // Update global cache
      window.globalPeopleCache = {
        data: formatted,
        timestamp: now,
        expiry: 5 * 60 * 1000,
      };

      setPreloadedPeople(formatted);
      console.log(`Pre-loaded ${formatted.length} people into AttendanceModal cache`);

      // Auto-populate the people list with fresh data
      if (activeTab === 1 && !associateSearch.trim()) {
        setPeople(formatted.slice(0, 50));
      }
    } catch (err) {
      console.error("Error pre-loading people in AttendanceModal:", err);
    }
  };
  const fetchPeople = async (q = "") => {
    // If no search query, show preloaded people
    if (!q.trim()) {
      if (preloadedPeople.length > 0) {
        console.log("📋 Showing preloaded people list");
        setPeople(preloadedPeople.slice(0, 50)); // Show first 50 preloaded people
      } else {
        setPeople([]);
      }
      return;
    }

    const parts = q.trim().split(/\s+/);
    const name = parts[0];
    const surname = parts.slice(1).join(" ");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/people?name=${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch people");

      const data = await res.json();

      let filtered = (data?.results || data?.people || []).filter(p =>
        p.Name.toLowerCase().includes(name.toLowerCase()) &&
        (!surname || (p.Surname && p.Surname.toLowerCase().includes(surname.toLowerCase())))
      );

      // Sort the results
      filtered.sort((a, b) => {
        const nameA = (a.Name || "").toLowerCase();
        const nameB = (b.Name || "").toLowerCase();
        const surnameA = (a.Surname || "").toLowerCase();
        const surnameB = (b.Surname || "").toLowerCase();

        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        if (surnameA < surnameB) return -1;
        if (surnameA > surnameB) return 1;
        return 0;
      });

      // Format the results consistently
      const formatted = filtered.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p["Leader at 1"] || p["Leader @ 1"] || p.leader1 || (p.leaders && p.leaders[0]) || "",
        leader12: p["Leader @12"] || p["Leader at 12"] || p["Leader @ 12"] || p.leader12 || (p.leaders && p.leaders[1]) || "",
        leader144: p["Leader @144"] || p["Leader at 144"] || p["Leader @ 144"] || p.leader144 || (p.leaders && p.leaders[2]) || "",
        phone: p.Number || p.Phone || p.phone || "",
      }));

      setPeople(formatted);
    } catch (err) {
      console.error("Error fetching people:", err);
      toast.error(err.message);
      // Fallback to preloaded people if search fails
      if (preloadedPeople.length > 0) {
        setPeople(preloadedPeople.slice(0, 50));
      } else {
        setPeople([]);
      }
    }
  };

  const fetchCommonAttendees = async (cellId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch(
        `${BACKEND_URL}/events/cell/${cellId}/common-attendees`,
        { headers }
      );
      const data = await res.json();
      const attendeesArray = data.common_attendees || [];

      const formatted = attendeesArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""
          }`.trim(),
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
      localStorage.setItem(
        `commonAttendees_${eventId}`,
        JSON.stringify(attendees)
      );
    }
  };
  function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }
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

  const loadExistingAttendance = async () => {
    if (!event) return;

    const eventId = event._id || event.id;
    console.log("🔄 Loading attendance data for event:", eventId);

    const currentWeek = getCurrentWeekIdentifier();

    // ALWAYS start with empty state for new week
    setCheckedIn({});
    setDecisions({});
    setDecisionTypes({});
    setManualHeadcount("");
    setDidNotMeet(false);

    console.log(`🆕 NEW WEEK - ${persistentCommonAttendees?.length || 0} names loaded - ALL UNCHECKED`);

    // Only load existing ticks if this week already has attendance data WITH CHECKED-IN ATTENDEES
    const hasCurrentWeekData =
      event.attendance &&
      event.attendance[currentWeek] &&
      event.attendance[currentWeek].attendees;

    const hasCurrentWeekDidNotMeet =
      event.attendance &&
      event.attendance[currentWeek] &&
      event.attendance[currentWeek].status === "did_not_meet";

    console.log(`📅 Current week: ${currentWeek}`);
    console.log(`✅ Has current week data: ${hasCurrentWeekData}`);
    console.log(`❌ Has current week did not meet: ${hasCurrentWeekDidNotMeet}`);

    if (hasCurrentWeekData && !hasCurrentWeekDidNotMeet) {
      const weekData = event.attendance[currentWeek];
      const newCheckedIn = {};
      const newDecisions = {};
      const newDecisionTypes = {};

      console.log(`Found ${weekData.attendees.length} attendees for week ${currentWeek}`);

      // CRITICAL FIX: Only mark as checked if they were explicitly checked last time
      weekData.attendees.forEach(attendee => {
        if (attendee.id && attendee.checked_in) { // DD THIS CHECK
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

      console.log(` Loaded: ${Object.keys(newCheckedIn).length} CHECKED attendees for THIS WEEK`);
    }
    else if (hasCurrentWeekDidNotMeet) {
      console.log(" Current week marked as DID NOT MEET");
      setDidNotMeet(true);
      setCheckedIn({});
    }
    else {
      console.log(" NEW WEEK - Names listed but NOTHING checked");
      console.log(` Loaded ${persistentCommonAttendees?.length || 0} names - all UNCHECKED (new week)`);
    }
  };

  const fetchPersistentAttendees = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await fetch(`${BACKEND_URL}/events/${eventId}/persistent-attendees`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (data.persistent_attendees && Array.isArray(data.persistent_attendees)) {
          console.log("Fetched persistent attendees from API:", data.persistent_attendees.length);
          setPersistentCommonAttendees(data.persistent_attendees);
          return data.persistent_attendees;
        }
      }
    } catch (error) {
      console.error("Error fetching persistent attendees:", error);
    }
    return [];
  };

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Effect: Load persistent attendees from localStorage
  useEffect(() => {
    if (event) {
      const eventId = event._id || event.id;
      const storedAttendees = localStorage.getItem(
        `commonAttendees_${eventId}`
      );
      if (storedAttendees) {
        try {
          setPersistentCommonAttendees(JSON.parse(storedAttendees));
        } catch (error) {
          console.error("Error loading persistent attendees:", error);
        }
      }
    }
  }, [event]);

  // Effect: Load preloaded people when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPreloadedPeople();
    }
  }, [isOpen]);

  // Update the useEffect for associate search
  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen && activeTab === 1) {
        if (associateSearch.trim()) {
          fetchPeople(associateSearch);
        } else {
          // Show preloaded list when no search term
          fetchPeople(""); // This will trigger the preloaded list
        }
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [associateSearch, isOpen, activeTab, preloadedPeople]);

  const handleCheckIn = (id) => {
    setCheckedIn((prev) => {
      const newState = { ...prev, [id]: !prev[id] };

      if (newState[id]) {
      //  toast.success(`${name} has been checked in`);
        // setAlert({
        //   open: true,
        //   type: "success",
        //   message: `${name} has been checked in`,
        // });
        // setTimeout(
        //   () => setAlert({ open: false, type: "success", message: "" }),
        //   3000
        // );
      } else {
        // setAlert({
        //   open: true,
        //   type: "warning",
        //   message: `You have unchecked ${name}`,
        // });
        // setTimeout(
        //   () => setAlert({ open: false, type: "warning", message: "" }),
        //   3000
        // );
        // toast.warning(`You have unchecked ${name}`);

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
      },
    }));
    setOpenPriceTierDropdown(null);
  };

  const handlePaymentMethodSelect = (id, method) => {
    setPaymentMethods((prev) => ({
      ...prev,
      [id]: method,
    }));
    setOpenPaymentDropdown(null);
  };

  const handlePaidAmountChange = (id, value) => {
    const numValue = parseFloat(value) || 0;
    setPaidAmounts((prev) => ({
      ...prev,
      [id]: numValue,
    }));
  };

  const calculateOwing = (id) => {
    const price = priceTiers[id]?.price || 0;
    const paid = paidAmounts[id] || 0;
    return price - paid;
  };

  const handleAssociatePerson = (person) => {
    const isAlreadyAdded = persistentCommonAttendees.some(
      (p) => p.id === person.id
    );

    if (isAlreadyAdded) {
      if (
        window.confirm(
          `Are you sure you want to remove ${person.fullName} from common attendees?`
        )
      ) {
        const updatedAttendees = persistentCommonAttendees.filter(
          (p) => p.id !== person.id
        );
        setPersistentCommonAttendees(updatedAttendees);
        savePersistentCommonAttendees(updatedAttendees);

        toast.warning(`You have removed ${person.fullName} from common attendees`);
      }
    } else {
      const updatedAttendees = [...persistentCommonAttendees, person];
      setPersistentCommonAttendees(updatedAttendees);
      savePersistentCommonAttendees(updatedAttendees);

      // setAlert({
      //   open: true,
      //   type: "success",
      //   message: `${person.fullName} added to common attendees`,
      // });
      // setTimeout(
      //   () => setAlert({ open: false, type: "success", message: "" }),
      //   3000
      // );
      toast.success(`${person.fullName} added to common attendees`);
    }
  };

  const getAllCommonAttendees = () => {
    // FIX: Add proper null/undefined checks
    const combined = [...(persistentCommonAttendees || [])];

    console.log("Getting all common attendees:", {
      persistentCount: persistentCommonAttendees?.length || 0,
      combinedCount: combined.length
    });

    // ✅ FIX: Add validation and filtering for invalid entries
    const fixedAttendees = combined
      .filter(persistentAttendee => persistentAttendee != null)
      .map(persistentAttendee => ({
        ...persistentAttendee,
        id: persistentAttendee.id || persistentAttendee._id || "",
        fullName: persistentAttendee.fullName || persistentAttendee.name || "Unknown Person",
        email: persistentAttendee.email || "",
        leader12: persistentAttendee.leader12 || "",
        leader144: persistentAttendee.leader144 || "",
        phone: persistentAttendee.phone || "",
      }))
      .filter(attendee => attendee.id);

    console.log("Fixed attendees:", fixedAttendees);
    return fixedAttendees;
  };

  // Calculate statistics
  const attendeesCount = Object.keys(checkedIn).filter(
    (id) => checkedIn[id]
  ).length;
  const decisionsCount = Object.keys(decisions).filter(
    (id) => decisions[id]
  ).length;
  const firstTimeCount = Object.values(decisionTypes).filter(
    (type) => type === "first-time"
  ).length;
  const reCommitmentCount = Object.values(decisionTypes).filter(
    (type) => type === "re-commitment"
  ).length;

  const totalPaid = Object.values(paidAmounts).reduce(
    (sum, amount) => sum + amount,
    0
  );
  const totalOwing = Object.keys(checkedIn)
    .filter((id) => checkedIn[id])
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
    const allPeople = getAllCommonAttendees();
    console.log("📊 All people for save:", allPeople);

    const attendeesList = Object.keys(checkedIn).filter((id) => checkedIn[id]);
    console.log("✅ Checked-in attendees:", attendeesList);

    if (!didNotMeet && attendeesList.length === 0) {
      // setAlert({
      //   open: true,
      //   type: "error",
      //   message: "Please check in at least one attendee before saving.",
      // });
      // setTimeout(
      //   () => setAlert({ open: false, type: "error", message: "" }),
      //   3000
      // );
      toast.error("Please check in at least one attendee before saving.");
      return;
    }

    const eventId = event?.id || event?._id;
    if (!eventId) {
      toast.error("Event ID is missing, cannot submit attendance.");
      return;
    }

    try {
      const selectedAttendees = attendeesList.map((id) => {
        const person = allPeople.find((p) => p && p.id === id);

        if (!person) {
          console.warn(`Person with id ${id} not found in allPeople`);
          return null;
        }

        const attendee = {
          id: person.id,
          name: person.fullName || "",
          email: person.email || "",
          fullName: person.fullName || "",
          leader12: person.leader12 || "",
          leader144: person.leader144 || "",
          phone: person.phone || "",
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
      }).filter(attendee => attendee !== null);

      console.log("Final selected attendees:", selectedAttendees);

      let result;

      if (typeof onSubmit === "function") {
        console.log("Using onSubmit prop...");

        const payload = {
          attendees: didNotMeet ? [] : selectedAttendees,
          all_attendees: allPeople,
          persistent_attendees: allPeople.map(p => ({
            id: p.id,
            name: p.fullName,
            fullName: p.fullName,
            email: p.email,
            leader12: p.leader12,
            leader144: p.leader144,
            phone: p.phone
          })),
          leaderEmail: currentUser?.email || "",
          leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
          did_not_meet: didNotMeet,
          isTicketed: isTicketedEvent,
          week: getCurrentWeekIdentifier()
        };

        console.log("Submission payload structure:", {
          attendees_count: payload.attendees.length,
          all_attendees_count: payload.all_attendees.length,
          persistent_attendees_count: payload.persistent_attendees.length,
          did_not_meet: payload.did_not_meet
        });

        result = await onSubmit(payload);

      } else {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const payload = {
          attendees: didNotMeet ? [] : selectedAttendees,
          all_attendees: allPeople,
          persistent_attendees: allPeople.map(p => ({
            id: p.id,
            name: p.fullName,
            fullName: p.fullName,
            email: p.email,
            leader12: p.leader12,
            leader144: p.leader144,
            phone: p.phone
          })),
          leaderEmail: currentUser?.email || "",
          leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
          did_not_meet: didNotMeet,
          isTicketed: isTicketedEvent,
          week: getCurrentWeekIdentifier()
        };

        console.log("Direct API call with eventId:", eventId);

        const response = await fetch(`${BACKEND_URL}/submit-attendance/${eventId}`, {
          method: "PUT",
          headers: headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        result = await response.json();
      }

      console.log("Save result:", result);

      if (result && result.success) {
        toast.success("Attendance saved successfully!");

        if (typeof onClose === "function") {
          onClose();
        }

        if (typeof onAttendanceSubmitted === "function") {
          onAttendanceSubmitted();
        }
      } else {
        throw new Error(result?.message || "Failed to save attendance");
      }

    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(error.message || "Failed to save attendance. Please try again.");
    }
  };

  const handleSubmitAttendance = (attendanceData) => {
    console.log("Preparing to submit attendance:");
    console.log("Event ID:", event?._id);
    console.log("Did Not Meet:", attendanceData === "did_not_meet");
    console.log("Checked-in Attendees:", Array.isArray(attendanceData) ? attendanceData.length : 'unknown');
    console.log("Persistent Attendees:", attendanceData?.all_attendees?.length || 'unknown');
    console.log("Current Week:", get_current_week_identifier());


    if (onSubmit) {
      return onSubmit(attendanceData);
    } else {
      console.error("No onSubmit prop provided to AttendanceModal");
      return Promise.resolve({ success: false, message: "No submit handler" });
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
        // setAlert({
        //   open: true,
        //   type: "error",
        //   message: "Event ID is missing, cannot submit attendance.",
        // });
        // setTimeout(
        //   () => setAlert({ open: false, type: "error", message: "" }),
        //   3000
        // );
        toast.error("Event ID is missing, cannot submit attendance");
        return;
      }

      let result;
      if (typeof onSubmit === "function") {
        const allPeople = getAllCommonAttendees();
        const payload = {
          attendees: [],
          all_attendees: allPeople,
          leaderEmail: currentUser?.email || "",
          leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
          did_not_meet: true,
          isTicketed: isTicketedEvent,
          week: getCurrentWeekIdentifier(),
          persistent_attendees: allPeople.map(p => ({
            id: p.id,
            fullName: p.fullName,
            email: p.email,
            leader12: p.leader12,
            leader144: p.leader144,
            phone: p.phone
          }))
        };

        result = await onSubmit(payload);
      } else {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const allPeople = getAllCommonAttendees();
        const payload = {
          attendees: [],
          all_attendees: allPeople,
          leaderEmail: currentUser?.email || "",
          leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
          did_not_meet: true,
          isTicketed: isTicketedEvent,
          week: getCurrentWeekIdentifier(),
          persistent_attendees: allPeople.map(p => ({
            id: p.id,
            fullName: p.fullName,
            email: p.email,
            leader12: p.leader12,
            leader144: p.leader144,
            phone: p.phone
          }))
        };

        const response = await fetch(
          `${BACKEND_URL}/submit-attendance/${eventId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(payload),
          }
        );
        result = await response.json();
        result.success = response.ok;
      }

      if (result?.success) {
        // setAlert({
        //   open: true,
        //   type: "success",
        //   message: "Event marked as 'Did Not Meet' successfully!",
        // });
        toast.alert("Event marked as 'Did Not Meet' successfully!")

        if (typeof onAttendanceSubmitted === "function") {
          onAttendanceSubmitted();
        }

        // setTimeout(() => {
        //   setAlert({ open: false, type: "success", message: "" });
        //   onClose();
        // }, 1500);
      } else {
        // setAlert({
        //   open: true,
        //   type: "error",
        //   message:
        //     result?.message ||
        //     result?.detail ||
        //     "Failed to mark event as 'Did Not Meet'.",
        // });
        // setTimeout(
        //   () => setAlert({ open: false, type: "error", message: "" }),
        //   3000
        // );
        toast.error(result?.message || result?.detail || "Failed to mark event as 'Did Not Meet'.");
      }
    } catch (error) {
      console.error("❌ Error marking event as 'Did Not Meet':", error);
      // setAlert({
      //   open: true,
      //   type: "error",
      //   message: "Something went wrong while marking event as 'Did Not Meet'.",
      // });
      // setTimeout(
      //   () => setAlert({ open: false, type: "error", message: "" }),
      //   3000
      // );
      // toast.error("Something went wrong while marking event as 'Did Not Meet'.");
    }
  };

  const cancelDidNotMeet = () => {
    setShowDidNotMeetConfirm(false);
  };

  const handlePersonAdded = (newPerson) => {
    console.log(" New person added:", newPerson);

    if (typeof window.globalPeopleCache !== 'undefined') {
      window.globalPeopleCache.data = [];
      window.globalPeopleCache.timestamp = null;
    }

    fetchPeople();
    loadPreloadedPeople();

    if (event && event.eventType === "cell") {
      fetchCommonAttendees(event._id || event.id);
    }

    setShowAddPersonModal(false);

    // Show success message
    // setAlert({
    //   open: true,
    //   type: "success",
    //   message: `${newPerson.Name} ${newPerson.Surname} added successfully!`,
    // });
    // setTimeout(
    //   () => setAlert({ open: false, type: "success", message: "" }),
    //   3000
    // );
    toast.success(`${newPerson.Name} ${newPerson.Surname} added successfully!`);
  };

  // Mobile attendee card renderer
  const renderMobileAttendeeCard = (person) => {
    const isPersistent = persistentCommonAttendees.some(
      (p) => p.id === person.id
    );
    const isCheckedIn = checkedIn[person.id];

    return (
      <div key={person.id} style={styles.mobileAttendeeCard}>
        <div style={styles.mobileCardRow}>
          <div style={styles.mobileCardInfo}>
            <div style={styles.mobileCardName}>
              {person.fullName}
              {isPersistent && (
                <span style={styles.persistentBadge}>Added</span>
              )}
            </div>
            <div style={styles.mobileCardEmail}>{person.email}</div>
            {!isTicketedEvent && (
              <>
                <div style={{ fontSize: "12px", color: theme.palette.text.secondary }}>
                  Leader @12: {person.leader12}
                </div>
                <div style={{ fontSize: "12px", color: theme.palette.text.secondary }}>
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
            {isCheckedIn && <span style={styles.radioButtonInner}>✓</span>}
          </button>
        </div>

        {isCheckedIn && isTicketedEvent && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={styles.inputGroup}>
              <label style={styles.label}>Price Tier</label>
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
                      ? `${priceTiers[person.id].name} (R${priceTiers[
                        person.id
                      ].price.toFixed(2)})`
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
                          onClick={() =>
                            handlePriceTierSelect(person.id, index)
                          }
                          onMouseEnter={(e) =>
                            (e.target.style.background = theme.palette.action.hover)
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.background = "transparent")
                          }
                        >
                          {tier.name} - R{parseFloat(tier.price).toFixed(2)}
                          <div style={{ fontSize: "12px", color: theme.palette.text.secondary }}>
                            {tier.ageGroup} • {tier.memberType}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          color: theme.palette.text.disabled,
                        }}
                      >
                        No price tiers available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Payment Method</label>
              <div style={styles.decisionDropdown}>
                <button
                  style={styles.paymentButton}
                  onClick={() =>
                    setOpenPaymentDropdown(
                      openPaymentDropdown === person.id ? null : person.id
                    )
                  }
                >
                  <span>{paymentMethods[person.id] || "Select Payment"}</span>
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
                          (e.target.style.background = theme.palette.action.hover)
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
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "space-between",
              }}
            >
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
                  onChange={(e) =>
                    handlePaidAmountChange(person.id, e.target.value)
                  }
                  placeholder="0.00"
                  style={styles.paidInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Owing</label>
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
                          (e.target.style.background = theme.palette.action.hover)
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
            </div>
          </div>
        )}
      </div>
    );
  };

  // Theme-aware styles
  const styles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDarkMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: 10,
    },
    modal: {
      position: "relative",
      background: theme.palette.background.paper,
      padding: 0,
      borderRadius: 12,
      width: "100%",
      maxWidth: 1200,
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
    },
    header: {
      padding: "clamp(12px, 2.5vw, 20px) clamp(16px, 3vw, 30px)",
      borderBottom: `1px solid ${theme.palette.divider}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 10,
      background: theme.palette.background.default,
    },
    title: {
      fontSize: "clamp(18px, 4vw, 24px)",
      fontWeight: 600,
      margin: 0,
      color: theme.palette.text.primary,
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },
    ticketBadge: {
      background: theme.palette.warning.main,
      color: theme.palette.warning.contrastText || "#000",
      padding: "4px 12px",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      textTransform: "uppercase",
    },
    addPersonBtn: {
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      border: "none",
      padding: "8px 14px",
      borderRadius: 8,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14,
      fontWeight: 500,
      whiteSpace: "nowrap",
    },
    tabsContainer: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: "0 clamp(12px, 3vw, 30px)",
      display: "flex",
      gap: 0,
      position: "relative",
    },
    mobileMenuButton: {
      background: "none",
      border: "none",
      padding: 12,
      cursor: "pointer",
      color: theme.palette.primary.main,
      display: isMobile ? "flex" : "none",
      alignItems: "center",
    },
    tab: {
      padding: "clamp(10px, 2vw, 16px) clamp(12px, 2vw, 24px)",
      fontSize: 14,
      fontWeight: 600,
      background: "none",
      border: "none",
      borderBottom: "3px solid transparent",
      cursor: "pointer",
      color: theme.palette.text.secondary,
      transition: "all 0.2s",
      whiteSpace: "nowrap",
      flex: isMobile ? "1" : "none",
    },
    tabActive: {
      color: theme.palette.primary.main,
      borderBottom: `3px solid ${theme.palette.primary.main}`,
    },
    contentArea: {
      flex: 1,
      overflowY: "auto",
      padding: "clamp(12px, 3vw, 20px) clamp(12px, 3vw, 30px)",
    },
    searchBox: { position: "relative", marginBottom: 16 },
    searchIcon: {
      position: "absolute",
      left: 12,
      top: "50%",
      transform: "translateY(-50%)",
      color: theme.palette.text.secondary,
    },
    input: {
      width: "100%",
    },
    tableContainer: {
      // overflowX: "auto",
      marginBottom: 16,
      WebkitOverflowScrolling: "touch",
      // overflowY: "hidden",
      // border: "2px solid red",
      paddingBottom: 8,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: isMobile ? 600 : "auto",
    },
    th: {
      textAlign: "left",
      padding: "10px 8px",
      borderBottom: `2px solid ${theme.palette.divider}`,
      fontSize: 13,
      color: theme.palette.text.secondary,
      fontWeight: 600,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },
    td: {
      padding: "10px 8px",
      borderBottom: `1px solid ${theme.palette.divider}`,
      fontSize: 14,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
    },
    radioCell: { textAlign: "center" },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: "50%",
      border: `2px solid ${theme.palette.primary.main}`,
      background: theme.palette.background.paper,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    },
    radioButtonChecked: {
      background: theme.palette.success.main,
      border: `2px solid ${theme.palette.success.main}`,
    },
    radioButtonInner: {
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    decisionDropdown: { position: "relative", display: "inline-block" },
    decisionButton: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      background: theme.palette.action.hover,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      color: theme.palette.text.primary,
      minWidth: isMobile ? 140 : 180,
      justifyContent: "space-between",
    },
    decisionMenu: {
      position: "absolute",
      top: "100%",
      left: "0",
      marginTop: 4,
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 6,
      boxShadow: theme.shadows[4],
      zIndex: 10000,
      minWidth: isMobile ? 140 : 200,
      maxHeight: 300,
      overflowY: "auto",
      // border: "2px solid blue",
    },
    decisionMenuItem: {
      padding: "10px 12px",
      cursor: "pointer",
      fontSize: 14,
      color: theme.palette.text.primary,
      transition: "background 0.15s",
    },

    
    priceTierButton: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      background: theme.palette.warning.light,
      border: `1px solid ${theme.palette.warning.main}`,
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      color: theme.palette.warning.dark,
      minWidth: isMobile ? 160 : 200,
      justifyContent: "space-between",
      fontWeight: 500,
    },
    paymentButton: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      background: theme.palette.info.light,
      border: `1px solid ${theme.palette.info.main}`,
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      color: theme.palette.info.dark,
      minWidth: isMobile ? 120 : 150,
      justifyContent: "space-between",
      fontWeight: 500,
    },
    priceInput: {
      padding: "8px 12px",
      fontSize: 14,
      borderRadius: 6,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.secondary,
      width: isMobile ? 80 : 100,
      textAlign: "right",
    },
    paidInput: {
      padding: "8px 12px",
      fontSize: 14,
      borderRadius: 6,
      border: `1px solid ${theme.palette.success.main}`,
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      width: isMobile ? 80 : 100,
      textAlign: "right",
    },
    owingText: {
      padding: "8px 12px",
      fontSize: 14,
      fontWeight: 600,
      textAlign: "right",
    },
    owingPositive: { color: theme.palette.success.main },
    owingNegative: { color: theme.palette.error.main },
    statsContainer: {
      display: "flex",
      gap: 12,
      marginBottom: 16,
      flexWrap: "wrap",
    },
    statBox: {
      flex: "1 1 calc(25% - 15px)",
      background: theme.palette.background.default,
      padding: "clamp(12px, 2vw, 18px)",
      borderRadius: 8,
      textAlign: "center",
      position: "relative",
      minWidth: 120,
    },
    statBoxInput: {
      flex: "1 1 calc(25% - 15px)",
      background: theme.palette.background.default,
      padding: "clamp(12px, 2vw, 18px)",
      borderRadius: 8,
      textAlign: "center",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 120,
    },
    headcountInput: {
      fontSize: "clamp(20px, 3.5vw, 32px)",
      fontWeight: 700,
      color: theme.palette.info.main,
      marginBottom: 8,
      border: "none",
      borderRadius: 8,
      padding: "4px 12px",
      width: 100,
      textAlign: "center",
      background: "transparent",
      outline: "none",
    },
    statNumber: {
      fontSize: "clamp(20px, 3.5vw, 32px)",
      fontWeight: 700,
      color: theme.palette.success.main,
      marginBottom: 8,
    },
    statLabel: {
      fontSize: 13,
      color: theme.palette.text.secondary,
      textTransform: "uppercase",
      fontWeight: 600,
    },
    decisionBreakdown: {
      fontSize: 14,
      color: theme.palette.text.secondary,
      marginTop: 8,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
    footer: {
      padding: "clamp(12px, 3vw, 20px)",
      borderTop: `1px solid ${theme.palette.divider}`,
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
    },
    closeBtn: {
      background: "transparent",
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      padding: "12px 20px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 500,
      flex: isMobile ? "1 1 100%" : "none",
      minWidth: 120,
    },
    didNotMeetBtn: {
      background: theme.palette.error.main,
      color: theme.palette.error.contrastText || "#fff",
      border: "none",
      padding: "12px 20px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 500,
      flex: isMobile ? "1 1 100%" : "none",
      minWidth: 140,
    },
    saveBtn: {
      background: theme.palette.success.main,
      color: theme.palette.success.contrastText || "#fff",
      border: "none",
      padding: "12px 20px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 16,
      fontWeight: 500,
      flex: isMobile ? "1 1 100%" : "none",
      minWidth: 120,
    },
    persistentBadge: {
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText || "#fff",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 600,
      marginLeft: 8,
    },
    iconButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 4,
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.palette.text.primary,
    },
    mobileAttendeeCard: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    mobileCardRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    mobileCardInfo: { flex: 1 },
    mobileCardName: {
      fontWeight: 600,
      fontSize: 16,
      color: theme.palette.text.primary,
      marginBottom: 4,
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
    },
    mobileCardEmail: {
      fontSize: 14,
      color: theme.palette.text.secondary,
      marginBottom: 4,
    },
    confirmOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDarkMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.45)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10002,
      padding: 20,
    },
    confirmModal: {
      background: theme.palette.background.paper,
      borderRadius: 12,
      padding: 24,
      maxWidth: 400,
      width: "100%",
      border: `1px solid ${theme.palette.divider}`,
    },
    confirmHeader: {
      marginBottom: 16,
    },
    confirmTitle: {
      fontSize: 18,
      fontWeight: 600,
      color: theme.palette.text.primary,
      margin: 0,
      textAlign: 'center',
    },
    confirmBody: {
      marginBottom: 20,
      textAlign: "center",
    },
    confirmIcon: {
      marginBottom: 12,
      display: "flex",
      justifyContent: "center",
    },
    confirmMessage: {
      fontSize: 16,
      color: theme.palette.text.primary,
      marginBottom: 8,
    },
    confirmSubMessage: {
      fontSize: 14,
      color: theme.palette.text.secondary,
      margin: 0,
    },
    confirmFooter: {
      display: "flex",
      gap: 12,
      justifyContent: "flex-end",
    },
    confirmCancelBtn: {
      background: "transparent",
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      padding: "10px 20px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
    },
    confirmProceedBtn: {
      background: theme.palette.error.main,
      color: theme.palette.error.contrastText || "#fff",
      border: "none",
      padding: "10px 20px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
    },
    label: {
      fontSize: 12,
      color: theme.palette.text.secondary,
      marginBottom: 4,
      display: "block",
      fontWeight: 600,
    },
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
    style={{
      width: "100%",
      padding: "14px 14px 14px 45px",
      fontSize: 16,
      borderRadius: 8,
      border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`, // ✅ LIGHT BORDER
      backgroundColor: 'transparent !important',
      background: 'transparent !important',
      color: isDarkMode ? theme.palette.text.primary : '#000',
      outline: "none",
      boxSizing: "border-box",
    }}
    onFocus={(e) => {
      e.target.style.backgroundColor = 'transparent';
      e.target.style.background = 'transparent';
      e.target.style.borderColor = isDarkMode ? '#777' : '#999'; 
    }}
    onBlur={(e) => {
      e.target.style.backgroundColor = 'transparent';
      e.target.style.background = 'transparent';
      e.target.style.borderColor = isDarkMode ? '#555' : '#ccc'; 
    }}
  />
</div>
                {isMobile ? (
                  <div>
                    {loading && (
                      <div style={{ textAlign: "center", padding: "20px" }}>
                        Loading...
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

                          {/* Show regular columns for non-ticketed events */}
                          {!isTicketedEvent && (
                            <>
                              <th style={styles.th}>Attendees Leader @12</th>
                              <th style={styles.th}>Attendees Leader @144</th>
                              <th style={styles.th}>Attendees Number</th>
                            </>
                          )}

                          <th style={{ ...styles.th, textAlign: "center" }}>
                            Check In
                          </th>

                          {/* Show ticketed event columns ONLY for ticketed events */}
                          {isTicketedEvent && (
                            <>
                              <th style={{ ...styles.th, textAlign: "center" }}>
                                Price Tier
                              </th>
                              <th style={{ ...styles.th, textAlign: "center" }}>
                                Payment Method
                              </th>
                              <th style={{ ...styles.th, textAlign: "right" }}>
                                Price
                              </th>
                              <th style={{ ...styles.th, textAlign: "right" }}>
                                Paid
                              </th>
                              <th style={{ ...styles.th, textAlign: "right" }}>
                                Owing
                              </th>
                            </>
                          )}

                          {/* Show decision column ONLY for non-ticketed events */}
                          {!isTicketedEvent && (
                            <th style={{ ...styles.th, textAlign: "center" }}>
                              Decision
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td
                              colSpan={isTicketedEvent ? "8" : "7"}
                              style={{ ...styles.td, textAlign: "center" }}
                            >
                              Loading...
                            </td>
                          </tr>
                        )}
                        {!loading && filteredCommonAttendees.length === 0 && (
                          <tr>
                            <td
                              colSpan={isTicketedEvent ? "8" : "7"}
                              style={{ ...styles.td, textAlign: "center" }}
                            >
                              No attendees found.
                            </td>
                          </tr>
                        )}
                        {filteredCommonAttendees.map((person) => {
                          const isPersistent = persistentCommonAttendees.some(
                            (p) => p.id === person.id
                          );

                          return (
                            <tr key={person.id}>
                              <td style={styles.td}>
                                {person.fullName}
                                {isPersistent && (
                                  <span style={styles.persistentBadge}>
                                    ADDED
                                  </span>
                                )}
                              </td>
                              <td style={styles.td}>{person.email}</td>

                              {/* Regular columns for non-ticketed events */}
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
                                    ...(checkedIn[person.id]
                                      ? styles.radioButtonChecked
                                      : {}),
                                  }}
                                  onClick={() =>
                                    handleCheckIn(person.id, person.fullName)
                                  }
                                >
                                  {checkedIn[person.id] && (
                                    <span style={styles.radioButtonInner}>
                                      ✓
                                    </span>
                                  )}
                                </button>
                              </td>

                              {isTicketedEvent && (
                                <>
                                  <td
                                    style={{
                                      ...styles.td,
                                      ...styles.radioCell,
                                    }}
                                  >
                                    {checkedIn[person.id] ? (
                                      <div
                                        style={{
                                          ...styles.decisionDropdown,
                                          position: "relative",
                                          zIndex:
                                            openPriceTierDropdown === person.id
                                              ? 10001
                                              : 1,
                                        }}
                                      >
                                        <button
                                          style={styles.priceTierButton}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenPriceTierDropdown(
                                              openPriceTierDropdown ===
                                                person.id
                                                ? null
                                                : person.id
                                            );
                                          }}
                                        >
                                          <span>
                                            {priceTiers[person.id]
                                              ? `${priceTiers[person.id].name
                                              } (R${priceTiers[
                                                person.id
                                              ].price.toFixed(2)})`
                                              : "Select Price Tier"}
                                          </span>
                                          <ChevronDown size={16} />
                                        </button>
                                        {openPriceTierDropdown ===
                                          person.id && (
                                            <div style={styles.decisionMenu}>
                                              {eventPriceTiers &&
                                                eventPriceTiers.length > 0 ? (
                                                eventPriceTiers.map(
                                                  (tier, index) => (
                                                    <div
                                                      key={index}
                                                      style={
                                                        styles.decisionMenuItem
                                                      }
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePriceTierSelect(
                                                          person.id,
                                                          index
                                                        );
                                                      }}
                                                      onMouseEnter={(e) =>
                                                      (e.target.style.background =
                                                        "#f0f0f0")
                                                      }
                                                      onMouseLeave={(e) =>
                                                      (e.target.style.background =
                                                        "transparent")
                                                      }
                                                    >
                                                      {tier.name} - R
                                                      {parseFloat(
                                                        tier.price
                                                      ).toFixed(2)}
                                                      <div
                                                        style={{
                                                          fontSize: "12px",
                                                          color: "#666",
                                                        }}
                                                      >
                                                        {tier.ageGroup} •{" "}
                                                        {tier.memberType}
                                                      </div>
                                                    </div>
                                                  )
                                                )
                                              ) : (
                                                <div
                                                  style={{
                                                    padding: "12px",
                                                    textAlign: "center",
                                                    color: "#999",
                                                  }}
                                                >
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

                                  <td
                                    style={{
                                      ...styles.td,
                                      ...styles.radioCell,
                                    }}
                                  >
                                    {checkedIn[person.id] ? (
                                      <div style={styles.decisionDropdown}>
                                        <button
                                          style={styles.paymentButton}
                                          onClick={() =>
                                            setOpenPaymentDropdown(
                                              openPaymentDropdown === person.id
                                                ? null
                                                : person.id
                                            )
                                          }
                                        >
                                          <span>
                                            {paymentMethods[person.id] ||
                                              "Select Payment"}
                                          </span>
                                          <ChevronDown size={16} />
                                        </button>
                                        {openPaymentDropdown === person.id && (
                                          <div style={styles.decisionMenu}>
                                            {availablePaymentMethods.map(
                                              (method, index) => (
                                                <div
                                                  key={index}
                                                  style={
                                                    styles.decisionMenuItem
                                                  }
                                                  onClick={() =>
                                                    handlePaymentMethodSelect(
                                                      person.id,
                                                      method
                                                    )
                                                  }
                                                  onMouseEnter={(e) =>
                                                  (e.target.style.background =
                                                    "#f0f0f0")
                                                  }
                                                  onMouseLeave={(e) =>
                                                  (e.target.style.background =
                                                    "transparent")
                                                  }
                                                >
                                                  {method}
                                                </div>
                                              )
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

                                  <td
                                    style={{ ...styles.td, textAlign: "right" }}
                                  >
                                    {checkedIn[person.id] &&
                                      priceTiers[person.id] ? (
                                      <span style={styles.priceInput}>
                                        R
                                        {priceTiers[person.id].price.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span style={{ color: "#ccc" }}>-</span>
                                    )}
                                  </td>

                                  <td
                                    style={{ ...styles.td, textAlign: "right" }}
                                  >
                                    {checkedIn[person.id] ? (
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={paidAmounts[person.id] || ""}
                                        onChange={(e) =>
                                          handlePaidAmountChange(
                                            person.id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="0.00"
                                        style={styles.paidInput}
                                      />
                                    ) : (
                                      <span style={{ color: "#ccc" }}>-</span>
                                    )}
                                  </td>

                                  <td
                                    style={{ ...styles.td, textAlign: "right" }}
                                  >
                                    {checkedIn[person.id] &&
                                      priceTiers[person.id] ? (
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
                                <td
                                  style={{ ...styles.td, ...styles.radioCell }}
                                >
                                  {checkedIn[person.id] ? (
                                    <div style={styles.decisionDropdown}>
                                      <button
                                        style={styles.decisionButton}
                                        onClick={() =>
                                          setOpenDecisionDropdown(
                                            openDecisionDropdown === person.id
                                              ? null
                                              : person.id
                                          )
                                        }
                                      >
                                        <span>
                                          {decisionTypes[person.id]
                                            ? decisionOptions.find(
                                              (opt) =>
                                                opt.value ===
                                                decisionTypes[person.id]
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
                                                handleDecisionTypeSelect(
                                                  person.id,
                                                  option.value
                                                )
                                              }
                                              onMouseEnter={(e) =>
                                              (e.currentTarget.style.background =
                                                theme.palette.action.hover)
                                              }
                                              onMouseLeave={(e) =>
                                              (e.target.style.background =
                                                "transparent")
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
                        <div
                          style={{
                            ...styles.statNumber,
                            color: totalOwing === 0 ? "#28a745" : "#dc3545",
                          }}
                        >
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
                    style={{
                      width: "100%",
                      padding: "14px 14px 14px 45px",
                      fontSize: 16,
                      borderRadius: 8,
                      border: `1px solid ${isDarkMode ? theme.palette.divider : '#ccc'}`,
                      backgroundColor: 'transparent !important',
                      background: 'transparent !important',
                      color: isDarkMode ? theme.palette.text.primary : '#000',
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.background = 'transparent';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.background = 'transparent';
                    }}
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
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "#666",
                        }}
                      >
                        No people found.
                      </div>
                    )}
                    {filteredPeople.map((person) => {
                      const isAlreadyAdded = persistentCommonAttendees.some(
                        (p) => p.id === person.id
                      );

                      return (
                        <div key={person.id} style={styles.mobileAttendeeCard}>
                          <div style={styles.mobileCardRow}>
                            <div style={styles.mobileCardInfo}>
                              <div style={styles.mobileCardName}>
                                {person.fullName}
                                {isAlreadyAdded && (
                                  <span style={styles.persistentBadge}>
                                    ADDED
                                  </span>
                                )}
                              </div>
                              <div style={styles.mobileCardEmail}>
                                {person.email}
                              </div>
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
                              title={
                                isAlreadyAdded
                                  ? "Remove from common attendees"
                                  : "Add to common attendees"
                              }
                            >
                              {isAlreadyAdded ? (
                                <X size={20} />
                              ) : (
                                <UserPlus size={20} />
                              )}
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
                          <th style={{ ...styles.th, textAlign: "center" }}>
                            Add
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td
                              colSpan="6"
                              style={{ ...styles.td, textAlign: "center" }}
                            >
                              Loading...
                            </td>
                          </tr>
                        )}
                        {!loading && filteredPeople.length === 0 && (
                          <tr>
                            <td
                              colSpan="6"
                              style={{ ...styles.td, textAlign: "center" }}
                            >
                              No people found.
                            </td>
                          </tr>
                        )}
                        {filteredPeople.map((person) => {
                          const isAlreadyAdded = persistentCommonAttendees.some(
                            (p) => p.id === person.id
                          );

                          return (
                            <tr key={person.id}>
                              <td style={styles.td}>
                                {person.fullName}
                                {isAlreadyAdded && (
                                  <span style={styles.persistentBadge}>
                                    ADDED
                                  </span>
                                )}
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
                                    cursor: isAlreadyAdded
                                      ? "not-allowed"
                                      : "pointer",
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
            <div
              style={{
                display: "flex",
                gap: "12px",
                flex: isMobile ? "1 1 100%" : "none",
                flexWrap: isMobile ? "wrap" : "nowrap",
              }}
            >
              <button style={styles.didNotMeetBtn} onClick={handleDidNotMeet}>
                DID NOT MEET
              </button>
              <button style={styles.saveBtn} onClick={handleSave}>
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
                Are you sure you want to mark this event as{" "}
                <strong>'Did Not Meet'</strong>?
              </p>
              <p style={styles.confirmSubMessage}>
                This will clear all current attendance data and cannot be
                undone.
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

      

      <AddPersonToEvents
        isOpen={showAddPersonModal}
        onClose={() => setShowAddPersonModal(false)}
        onPersonAdded={handlePersonAdded}
        event={event}
      />

      <style>
{`
  input[type="text"]:focus,
  input[type="text"]:active,
  input[type="text"]:-webkit-autofill,
  input[type="text"]:-webkit-autofill:hover,
  input[type="text"]:-webkit-autofill:focus,
  input[type="text"]:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
    box-shadow: 0 0 0 1000px transparent inset !important;
    background-color: transparent !important;
    background: transparent !important;
  }
`}
</style>
    </>
    
  );
  
};

export default AttendanceModal;
