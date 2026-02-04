import { useState, useEffect, useContext, useMemo } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  UserPlus,
  Search,
  ChevronDown,
  X,
  Menu,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";

const AddPersonToEvents = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  console.log("AddPersonToEvents - isDarkMode:", isDarkMode);
  const { authFetch } = useContext(AuthContext);

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

  const [peopleList, setPeopleList] = useState([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [inviterSearchInput, setInviterSearchInput] = useState("");
  const [showInviterDropdown, setShowInviterDropdown] = useState(false);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [, setTouched] = useState({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [autoFilledLeaders, setAutoFilledLeaders] = useState({
    leader1: "",
    leader12: "",
    leader144: "",
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  // Fetch people data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllPeople();
    }
  }, [isOpen]);

  // Function to fetch people 
  const fetchAllPeople = async () => {
    setIsLoadingPeople(true);
    try {
      const response = await authFetch(`${BACKEND_URL}/cache/people`);

      if (response.ok) {
        const data = await response.json();
        const cachedData = data.cached_data || [];
        setPeopleList(cachedData);
        console.log(`Loaded ${cachedData.length} people from cache`);
      } else {
        await fetchPeopleFallback();
      }
    } catch (err) {
      console.error("Error fetching from cache:", err);
      await fetchPeopleFallback();
    } finally {
      setIsLoadingPeople(false);
    }
  };

  const fetchPeopleFallback = async () => {
    try {
      const response = await authFetch(
        `${BACKEND_URL}/people/simple?per_page=1000`,
      );
      if (response.ok) {
        const data = await response.json();
        const peopleData = data.results || [];
        setPeopleList(peopleData);
        console.log(`Loaded ${peopleData.length} people from fallback`);
      }
    } catch (fallbackErr) {
      console.error("Fallback fetch failed:", fallbackErr);
      setPeopleList([]);
    }
  };

  // Create people options
  const peopleOptions = useMemo(() => {
    return peopleList.map((person) => {
      const fullName = `${person.Name || ""} ${person.Surname || ""}`.trim();
      return {
        id: person._id,
        fullName: fullName,
        email: person.Email || "",
        phone: person.Number || person.Phone || "",
        leader1: person["Leader @1"] || "",
        leader12: person["Leader @12"] || "",
        leader144: person["Leader @144"] || "",
        leader1728: person["Leader @1728"] || "",
        searchText:
          `${person.Name || ""} ${person.Surname || ""} ${person.Email || ""}`.toLowerCase(),
      };
    });
  }, [peopleList]);
  // Filter function
  const filterPeopleOptions = (inputValue) => {
    if (!inputValue) {
      return peopleOptions.slice(0, 30);
    }
    const searchTerm = inputValue.toLowerCase();
    return peopleOptions
      .filter(option =>
        option.searchText.includes(searchTerm) ||
        option.fullName.toLowerCase().includes(searchTerm) ||
        option.email.toLowerCase().includes(searchTerm) ||
        (option.phone && option.phone.includes(searchTerm))
      )
      .slice(0, 50);
  };

  const filteredInviterResults = useMemo(() => {
    return filterPeopleOptions(inviterSearchInput);
  }, [inviterSearchInput, peopleOptions]);

  const handleInviterSelect = (person) => {
    console.log("Selected inviter:", person.fullName);

    setFormData(prev => ({ ...prev, invitedBy: person.fullName }));
    setInviterSearchInput(person.fullName);
    setShowInviterDropdown(false);
    setTouched((prev) => ({ ...prev, invitedBy: true }));

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
    const isLeader12 =
      leader1Raw && !leader12Raw && !leader144Raw && !leader1728Raw;
    const isLeader1 =
      leader1Raw === normalizedFull ||
      (!leader1Raw && !leader12Raw && !leader144Raw && !leader1728Raw);

    console.log("Leadership detection:", {
      isLeader144,
      isLeader12,
      isLeader1,
      isSelfL1: leader1Raw === normalizedFull,
    });

    if (isLeader144) {
      leadersToFill = {
        leader1: person.leader1 || "",
        leader12: person.leader12 || "",
        leader144: person.fullName || "",
      };
      console.log("DETECTED: Leader @144");
    } else if (isLeader12) {
      leadersToFill = {
        leader1: person.leader1 || "",
        leader12: person.fullName || "",
        leader144: "",
      };
      console.log("DETECTED: Leader @12");
    } else if (isLeader1) {
      leadersToFill = {
        leader1: person.fullName || "",
        leader12: "",
        leader144: "",
      };
      console.log("DETECTED: Leader @1");
    } else {
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

  const handleInviterInputChange = (value) => {
    setInviterSearchInput(value);
    setShowInviterDropdown(true);
    setTouched(prev => ({ ...prev, invitedBy: true }));

    if (value.trim() === "") {
      setFormData((prev) => ({ ...prev, invitedBy: "" }));
      setAutoFilledLeaders({
        leader1: "",
        leader12: "",
        leader144: "",
      });
    }
  };

  const handleSubmit = async (finalLeaderInfo) => {
    try {
      const payload = {
        invitedBy: formData.invitedBy,
        name: formData.name,
        surname: formData.surname,
        gender: formData.gender,
        email: formData.email,
        number: formData.mobile,
        dob: formData.dob,
        address: formData.address,
        leaders: [
          finalLeaderInfo.leader1 || "",
          finalLeaderInfo.leader12 || "",
          finalLeaderInfo.leader144 || "",
          finalLeaderInfo.leader1728 || ""
        ].filter(leader => leader.trim() !== ""),
        stage: "Win",
      };

      console.log("Submitting new person:", payload);
      const response = await authFetch(`${BACKEND_URL}/people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create person');
      }

      const result = await response.json();
      console.log("Person created:", result);
      toast.success("Person created successfully!");
      await authFetch(`${BACKEND_URL}/cache/refresh`, { method: 'POST' });
      handleClose();

    } catch (error) {
      console.error("Error creating person:", error);
      toast.error(`Error: ${error.message}`);
    }
  };
  const isFieldEmpty = (fieldName) => {
    const value =
      fieldName === "invitedBy" ? inviterSearchInput : formData[fieldName];
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
      address: formData.address?.trim(),
      invitedBy: formData.invitedBy?.trim()
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${missingFields.join(", ")}`,
      );
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
    setInviterSearchInput("");
    setPeopleList([]);
    setShowInviterDropdown(false);
    setShowLeaderModal(false);
    setAttemptedSubmit(false);
    setTouched({});
    setAutoFilledLeaders({
      leader1: "",
      leader12: "",
      leader144: "",
    });
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
      border: `1px solid ${theme.palette.divider}`,
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
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
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
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
      maxHeight: "250px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "12px",
      cursor: "pointer",
      borderBottom: `1px solid ${theme.palette.divider}`,
      transition: "background 0.2s",
      color: theme.palette.text.primary,
      background: theme.palette.background.paper,
    },
    dropdownEmpty: {
      padding: "12px",
      color: theme.palette.text.secondary,
      textAlign: "center",
      fontSize: "14px",
      background: theme.palette.background.paper,
    },
    loadingItem: {
      padding: "12px",
      color: theme.palette.text.secondary,
      textAlign: "center",
      fontSize: "14px",
      background: theme.palette.background.paper,
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
                borderBottom: `1px solid ${theme.palette.divider}`,
                paddingBottom: "10px",
              }}
            >
              <div
                style={{
                  fontWeight: "600",
                  color: theme.palette.text.secondary,
                }}
              >
                NEW PERSON INFO
              </div>
              <div
                style={{
                  fontWeight: "600",
                  color: theme.palette.text.secondary,
                }}
              >
                LEADER INFO
              </div>
            </div>

            {/* Invited By Field - FIXED to match AddPersonDialog */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Invited By
                {showError("invitedBy") && (
                  <span style={styles.required}>Required</span>
                )}
              </label>
              <input
                type="text"
                value={inviterSearchInput}
                onChange={(e) => handleInviterInputChange(e.target.value)}
                onFocus={() => {
                  setShowInviterDropdown(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setShowInviterDropdown(false);
                  }, 200);
                  setTouched((prev) => ({ ...prev, invitedBy: true }));
                }}
                style={
                  showError("invitedBy") ? styles.inputError : styles.input
                }
                placeholder={
                  isLoadingPeople
                    ? "Loading people..."
                    : "Type to search all people..."
                }
                autoComplete="off"
                disabled={isLoadingPeople}
              />

              {showInviterDropdown && (
                <div style={styles.dropdown}>
                  {isLoadingPeople ? (
                    <div style={styles.loadingItem}>Loading people data...</div>
                  ) : filteredInviterResults.length > 0 ? (
                    filteredInviterResults.map((person) => (
                      <div
                        key={person.id}
                        style={styles.dropdownItem}
                        onClick={() => handleInviterSelect(person)}
                        onMouseEnter={(e) =>
                          (e.target.style.background =
                            theme.palette.action.hover)
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.background =
                            theme.palette.background.paper)
                        }
                      >
                        <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                          {person.fullName}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: theme.palette.text.secondary,
                          }}
                        >
                          {person.email || person.phone || "No contact info"}
                          {person.leader1 && (
                            <div style={{ marginTop: "2px", fontSize: "11px" }}>
                              L@1: {person.leader1}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : inviterSearchInput.trim() === "" ? (
                    <div style={styles.dropdownEmpty}>
                      {peopleOptions.length > 0
                        ? "Start typing to search people..."
                        : "No people data available"}
                    </div>
                  ) : (
                    <div style={styles.dropdownEmpty}>
                      No matches found for "{inviterSearchInput}"
                    </div>
                  )}
                </div>
              )}

              {isLoadingPeople && (
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.palette.text.secondary,
                    marginTop: "4px",
                  }}
                >
                  Loading people data...
                </div>
              )}
            </div>

            {/* ALL OTHER FIELDS PRESERVED */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Name
                {showError("name") && (
                  <span style={styles.required}>Required</span>
                )}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                style={showError("name") ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Surname
                {showError("surname") && (
                  <span style={styles.required}>Required</span>
                )}
              </label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) =>
                  setFormData({ ...formData, surname: e.target.value })
                }
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, surname: true }))
                }
                style={showError("surname") ? styles.inputError : styles.input}
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
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  />
                  Male
                </label>
                <label style={styles.radioLabel}>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === "Female"}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  />
                  Female
                </label>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Email Address
                {showError("email") && (
                  <span style={styles.required}>Required</span>
                )}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                style={showError("email") ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Mobile Number
                {showError("mobile") && (
                  <span style={styles.required}>Required</span>
                )}
              </label>
              <input
                type="tel"
                value={formData.mobile}
                maxLength={10}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                onBlur={() => setTouched((prev) => ({ ...prev, mobile: true }))}
                style={showError("mobile") ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Date Of Birth
                {showError("dob") && (
                  <span style={styles.required}>Required</span>
                )}
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
                onBlur={() => setTouched((prev) => ({ ...prev, dob: true }))}
                style={showError("dob") ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Home Address
                {showError("address") && (
                  <span style={styles.required}>Required</span>
                )}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, address: true }))
                }
                style={showError("address") ? styles.inputError : styles.input}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={styles.closeBtn}
                onClick={handleClose}
                disabled={isLoadingPeople}
                onMouseEnter={(e) =>
                  (e.target.style.background = theme.palette.action.hover)
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = theme.palette.background.paper)
                }
              >
                CANCEL
              </button>
              <button
                type="button"
                style={styles.nextBtn}
                onClick={handleNext}
                disabled={isLoadingPeople}
                onMouseEnter={(e) =>
                  (e.target.style.background = theme.palette.primary.dark)
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = theme.palette.primary.main)
                }
              >
                NEXT
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* LeaderSelectionModal - Keep as is */}
      {showLeaderModal && (
        <LeaderSelectionModal
          isOpen={showLeaderModal}
          onClose={() => setShowLeaderModal(false)}
          onBack={() => setShowLeaderModal(false)}
          onSubmit={handleSubmit}
          personData={formData}
          preloadedPeople={peopleOptions}
          autoFilledLeaders={autoFilledLeaders}
        />
      )}
    </>
  );
};

const LeaderSelectionModal = ({
  isOpen,
  onBack,
  onSubmit,
  preloadedPeople = [],
  autoFilledLeaders,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { authFetch } = useContext(AuthContext);

  const [leaderData, setLeaderData] = useState({
    leader1: "",
    leader12: "",
    leader144: "",
  });

  const [leaderSearches, setLeaderSearches] = useState({
    leader1: "",
    leader12: "",
    leader144: "",
  });

  const [, setLeaderResults] = useState({
    leader1: [],
    leader12: [],
    leader144: [],
  });

  const [, setShowDropdowns] = useState({
    leader1: false,
    leader12: false,
    leader144: false,
  });

  const [, setLoadingLeaders] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  useEffect(() => {
    if (isOpen && autoFilledLeaders) {
      const filledLeaders = {
        leader1: autoFilledLeaders.leader1 || "",
        leader12: autoFilledLeaders.leader12 || "",
        leader144: autoFilledLeaders.leader144 || "",
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
          person.email.toLowerCase().includes(searchTerm.toLowerCase()),
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

        const res = await authFetch(
          `${BACKEND_URL}/people?${params.toString()}`,
          { headers },
        );
        const data = await res.json();
        const peopleArray = data.people || data.results || [];

        const formatted = peopleArray.map((p) => {
          const leader1 =
            p["Leader @1"] ||
            p["Leader at 1"] ||
            p["Leader @ 1"] ||
            p.leader1 ||
            (p.leaders && p.leaders[0]) ||
            "";
          const leader12 =
            p["Leader @12"] ||
            p["Leader at 12"] ||
            p["Leader @ 12"] ||
            p.leader12 ||
            (p.leaders && p.leaders[1]) ||
            "";
          const leader144 =
            p["Leader @144"] ||
            p["Leader at 144"] ||
            p["Leader @ 144"] ||
            p.leader144 ||
            (p.leaders && p.leaders[2]) ||
            "";
          const leader1728 =
            p["Leader @1728"] ||
            p["Leader @ 1728"] ||
            p["Leader at 1728"] ||
            p["Leader @ 1728"] ||
            p.leader1728 ||
            (p.leaders && p.leaders[3]) ||
            "";

          return {
            id: p._id,
            fullName:
              `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
            email: p.Email || p.email || "",
            leader1: leader1,
            leader12: leader12,
            leader144: leader144,
            leader1728: leader1728,
          };
        });

        setLeaderResults((prev) => ({ ...prev, [leaderField]: formatted }));
      }
    } catch (err) {
      console.error(`Error fetching leaders for ${leaderField}:`, err);
    } finally {
      setLoadingLeaders(false);
    }
  };

  useEffect(() => {
    const delays = {};

    ["leader1", "leader12", "leader144"].forEach((field) => {
      const searchTerm = leaderSearches[field];
      if (searchTerm.length >= 1) {
        delays[field] = setTimeout(() => {
          fetchLeaders(searchTerm, field);
        }, 150);
      } else {
        setLeaderResults((prev) => ({ ...prev, [field]: [] }));
      }
    });

    return () => {
      Object.values(delays).forEach(clearTimeout);
    };
  }, [leaderSearches, preloadedPeople]);

  const handleLeaderSelect = (person, field) => {
    setLeaderData((prev) => ({ ...prev, [field]: person.fullName }));
    setLeaderSearches((prev) => ({ ...prev, [field]: person.fullName }));
    setShowDropdowns((prev) => ({ ...prev, [field]: false }));
  };

  const handleSearchChange = (e, field) => {
    const value = e.target.value;
    setLeaderSearches((prev) => ({ ...prev, [field]: value }));
    setShowDropdowns((prev) => ({ ...prev, [field]: true }));
  };

  const handleClearField = (field) => {
    setLeaderData((prev) => ({ ...prev, [field]: "" }));
    setLeaderSearches((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmitLeaders = () => {
    const finalLeaderInfo = {
      leader1: leaderData.leader1 || "",
      leader12: leaderData.leader12 || "",
      leader144: leaderData.leader144 || "",
      leader1728: "",
    };
    onSubmit(finalLeaderInfo);
  };

  const leaderLabels = {
    leader1: "Leader @1",
    leader12: "Leader @12",
    leader144: "Leader @144",
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
      backgroundColor: theme.palette.background.paper,
      borderRadius: "12px",
      width: "100%",
      maxWidth: "500px",
      maxHeight: "80vh",
      overflowY: "auto",
      padding: "24px",
      color: theme.palette.text.primary,
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
      color: theme.palette.text.secondary,
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
      border: `1px solid ${theme.palette.divider}`,
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
      transition: "background-color 5000s ease-in-out 0s",
    },
    clearButton: {
      position: "absolute",
      right: "8px",
      background: "none",
      border: "none",
      color: theme.palette.text.disabled,
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
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1003,
      maxHeight: "160px",
      overflowY: "auto",
    },
    dropdownItem: {
      padding: "10px 12px",
      cursor: "pointer",
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      backgroundColor: theme.palette.background.paper,
      fontSize: "14px",
    },
    dropdownEmpty: {
      padding: "12px",
      color: theme.palette.text.disabled,
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
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.secondary,
      padding: "12px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
    },
    submitBtn: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      border: "none",
      padding: "12px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      flex: 1,
    },
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Set Leadership</h2>

        <div style={styles.leaderGroup}>
          {["leader1", "leader12", "leader144"].map((field) => (
            <div key={field} style={styles.inputGroup}>
              <label style={styles.label}>{leaderLabels[field]}</label>

              <div style={styles.inputContainer}>
                <input
                  value={leaderSearches[field]}
                  onBlur={() =>
                    setTimeout(
                      () =>
                        setShowDropdowns((prev) => ({
                          ...prev,
                          [field]: false,
                        })),
                      200,
                    )
                  }
                  style={styles.input}
                  placeholder={`Type to search...`}
                  autoComplete="off"
                />
              </div>
            </div>
          ))}
        </div>

        <div style={styles.buttonGroup}>
          <button type="button" style={styles.backBtn} onClick={onBack}>
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

const AttendanceModal = ({
  isOpen,
  onClose,
  onSubmit,
  event,
  onAttendanceSubmitted,
  currentUser,
}) => {
  const { authFetch } = useContext(AuthContext);
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
  const [, setCommonAttendees] = useState([]);
  const [associateSearch, setAssociateSearch] = useState("");
  const [loading,] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [manualHeadcount, setManualHeadcount] = useState("");
  const [didNotMeet, setDidNotMeet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDidNotMeetConfirm, setShowDidNotMeetConfirm] = useState(false);
  const [persistentCommonAttendees, setPersistentCommonAttendees] = useState(
    [],
  );
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
  const [, setEventStatistics] = useState({
    totalAssociated: 0,
    lastAttendanceCount: 0,
    lastHeadcount: 0,
    lastDecisionsCount: 0,
    lastAttendanceBreakdown: {
      first_time: 0,
      recommitment: 0
    }
  });

  const availablePaymentMethods = [
    ...new Set(eventPriceTiers.map((t) => t.paymentMethod)),
  ];

  const clearGlobalPeopleCache = () => {
    try {
      if (typeof window !== "undefined") {
        delete window.globalPeopleCache;
        window.clearGlobalPeopleCache = () => { delete window.globalPeopleCache; };
      }
    } catch (err) {
      console.warn("Failed to clear global people cache", err);
    }
  };

const loadEventStatistics = async () => {
  if (!event) return;

  try {
    const eventDate = event.date;
    console.log(" Loading stats for:", eventDate);

    const attendanceData = event.attendance || {};
    console.log(" Full attendance data structure:", attendanceData);
    let weekAttendance = {};
    
    if (attendanceData.status === "complete") {
      console.log(" Found completed data directly in attendance object");
      weekAttendance = attendanceData;
    } else {
      console.log(" Searching for date key in attendance data...");
      
      // Try all possible date formats
      const possibleKeys = Object.keys(attendanceData).filter(key => 
        typeof attendanceData[key] === 'object' && attendanceData[key] !== null
      );
      
      console.log("Possible date keys:", possibleKeys);
      
      // Try to match the date in any format
      for (const key of possibleKeys) {
        const data = attendanceData[key];
        
        // Check if this looks like week data
        if (data && (data.status === "complete" || data.attendees || data.total_headcounts)) {
          console.log(` Checking key "${key}":`, {
            status: data.status,
            attendees: data.attendees?.length || 0
          });
          
          if (data.status === "complete") {
            weekAttendance = data;
            console.log(` Using completed week from key: "${key}"`);
            break;
          }
        }
      }
    }

    console.log(" Final week attendance data:", {
      status: weekAttendance?.status,
      attendeesCount: weekAttendance?.attendees?.length || 0,
      headcount: weekAttendance?.total_headcounts || 0
    });

    const isCompleted = weekAttendance?.status === "complete";

    if (isCompleted) {
      const attendees = weekAttendance.attendees || [];
      console.log(" Loading COMPLETED week with", attendees.length, "attendees");

      let firstTimeCount = 0;
      let recommitmentCount = 0;

      attendees.forEach(att => {
        const decision = (att.decision || "").toLowerCase();
        if (decision.includes("first")) {
          firstTimeCount++;
        } else if (decision.includes("re-commitment") || decision.includes("recommitment")) {
          recommitmentCount++;
        }
      });

      setEventStatistics({
        totalAssociated: persistentCommonAttendees.length,
        lastAttendanceCount: attendees.length,
        lastHeadcount: weekAttendance.total_headcounts || 0,
        lastDecisionsCount: firstTimeCount + recommitmentCount,
        lastAttendanceBreakdown: {
          first_time: firstTimeCount,
          recommitment: recommitmentCount
        }
      });

      if (weekAttendance.total_headcounts > 0) {
        setManualHeadcount(weekAttendance.total_headcounts.toString());
      } else {
        setManualHeadcount("0");
      }
      
    } else {
      // For INCOMPLETE weeks or no data found
      console.log(" No completed week data found, showing zeros");
      setEventStatistics({
        totalAssociated: persistentCommonAttendees.length,
        lastAttendanceCount: 0,
        lastHeadcount: 0,
        lastDecisionsCount: 0,
        lastAttendanceBreakdown: {
          first_time: 0,
          recommitment: 0
        }
      });
      setManualHeadcount("0");
    }
  } catch (error) {
    console.error("Error loading event statistics:", error);
  }
};

const formatDateToISO = (dateString) => {
  try {
    const parts = dateString.match(/\d+/g);
    if (parts && parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

const loadWeeklyCheckins = () => {
  if (!event) {
    setCheckedIn({});
    setManualHeadcount("0");
    setDidNotMeet(false);
    return;
  }

  // Reset all states
  setCheckedIn({});
  setDecisions({});
  setDecisionTypes({});
  setPriceTiers({});
  setPaymentMethods({});
  setPaidAmounts({});
  setManualHeadcount("0");
  setDidNotMeet(false);

  const attendanceData = event.attendance || {};
  console.log(" Loading checkins from:", attendanceData);

  // Find completed week data
  let weekAttendance = {};
  
  if (attendanceData.status === "complete") {
    weekAttendance = attendanceData;
    console.log(" Found checkin data directly");
  } else {
    // Look for completed week in object keys
    const possibleKeys = Object.keys(attendanceData).filter(key => 
      typeof attendanceData[key] === 'object'
    );
    
    for (const key of possibleKeys) {
      const data = attendanceData[key];
      if (data && data.status === "complete") {
        weekAttendance = data;
        console.log(` Found checkins in key: "${key}"`);
        break;
      }
    }
  }

  const isCompleted = weekAttendance?.status === "complete";

  if (isCompleted) {
    console.log(" Loading completed week checkins");
    
    const attendees = weekAttendance.attendees || [];
    
    if (attendees.length > 0) {
      const newCheckedIn = {};
      const newDecisions = {};
      const newDecisionTypes = {};
      const newPriceTiers = {};
      const newPaymentMethods = {};
      const newPaidAmounts = {};
      
      attendees.forEach(att => {
        if (att.id) {
          newCheckedIn[att.id] = true;

          if (att.decision) {
            newDecisions[att.id] = true;
            newDecisionTypes[att.id] = att.decision;
          }

          if (isTicketedEvent) {
            if (att.priceTier || att.price) {
              newPriceTiers[att.id] = {
                name: att.priceTier || "",
                price: att.price || 0,
                ageGroup: att.ageGroup || "",
                memberType: att.memberType || ""
              };
            }
            if (att.paymentMethod) {
              newPaymentMethods[att.id] = att.paymentMethod;
            }
            if (att.paid !== undefined) {
              newPaidAmounts[att.id] = att.paid;
            }
          }
        }
      });

      console.log("👥 Setting", attendees.length, "checkins");
      setCheckedIn(newCheckedIn);
      setDecisions(newDecisions);
      setDecisionTypes(newDecisionTypes);
      setPriceTiers(newPriceTiers);
      setPaymentMethods(newPaymentMethods);
      setPaidAmounts(newPaidAmounts);
    }

    const headcount = weekAttendance.total_headcounts || 0;
    setManualHeadcount(headcount.toString());
    
  } else {
    console.log(" No checkins to load");
  }
};

  const loadPersistentAttendees = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await authFetch(
        `${BACKEND_URL}/events/${eventId}/persistent-attendees`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const allAttendees = data.persistent_attendees || [];
        setPersistentCommonAttendees(allAttendees);
      }
    } catch (error) {
      console.error("Error loading attendees:", error);
    }
  };

  const loadPreloadedPeople = async (forceRefresh = false) => {
    const now = Date.now();

    if (
      !forceRefresh &&
      typeof window !== 'undefined' &&
      window.globalPeopleCache &&
      window.globalPeopleCache.data?.length > 0 &&
      window.globalPeopleCache.timestamp &&
      now - window.globalPeopleCache.timestamp < (window.globalPeopleCache.expiry || 5 * 60 * 1000)
    ) {
      console.log("Using cached people data in AttendanceModal");
      setPreloadedPeople(window.globalPeopleCache.data);

      if (activeTab === 1 && !associateSearch.trim()) {
        setPeople(window.globalPeopleCache.data.slice(0, 50));
      }
      return;
    }

    // Otherwise fetch fresh people from backend and rebuild cache
    try {
      console.log(forceRefresh ? "Force-refreshing people cache" : "Fetching fresh people for AttendanceModal cache");
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append("perPage", "100");
      params.append("page", "1");

      const res = await authFetch(
        `${BACKEND_URL}/people?${params.toString()}`,
        {
          headers,
        },
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName:
          `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p["Leader at 1"] || p.leader1 || p.leaders?.[0] || "",
        leader12: p["Leader @12"] || p["Leader at 12"] || p.leader12 || p.leaders?.[1] || "",
        leader144: p["Leader @144"] || p["Leader at 144"] || p.leader144 || p.leaders?.[2] || "",
        phone: p.Number || p.Phone || p.phone || "",
        searchText: `${(p.Name || p.name || "")} ${(p.Surname || p.surname || "")} ${(p.Email || p.email || "")}`.toLowerCase()
      }));

      window.globalPeopleCache = {
        data: formatted,
        timestamp: now,
        expiry: 5 * 60 * 1000,
      };

      setPreloadedPeople(formatted);
      console.log(
        `Pre-loaded ${formatted.length} people into AttendanceModal cache`,
      );

      if (activeTab === 1 && !associateSearch.trim()) {
        setPeople(formatted.slice(0, 50));
      }
    } catch (err) {
      console.error("Error pre-loading people in AttendanceModal:", err);
    }
  };
  useEffect(() => {
  if (isOpen && event) {
    let eventId = event._id || event.id;
    if (eventId && eventId.includes("_")) {
      eventId = eventId.split("_")[0];
    }
    console.log(" Opening modal for event:", eventId, "Date:", event.date);

    // Reset all form states
    setSearchName("");
    setAssociateSearch("");
    setActiveTab(0);
    setCheckedIn({});
    setDecisions({});
    setDecisionTypes({});
    setPriceTiers({});
    setPaymentMethods({});
    setPaidAmounts({});
    setManualHeadcount("0");
    setDidNotMeet(false);

    const loadAllData = async () => {
      console.log(" Loading all data...");
      
      // Load persistent attendees first
      await loadPersistentAttendees(eventId);
      
      // Then load statistics
      await loadEventStatistics();
      
      // Finally load check-ins
      loadWeeklyCheckins();
    };

    loadAllData();
    fetchPeople();

    const attendanceData = event.attendance || {};
    const eventDate = event.date;
    const weekAttendance = attendanceData[eventDate] || {};
    
    setDidNotMeet(weekAttendance?.status === "did_not_meet" || false);
  }
}, [isOpen, event]);

const fetchPeople = async (q = "") => {  // Add default value for q
  if (!q) {
    if (preloadedPeople.length > 0) {
      console.log(" Showing preloaded people list");
      setPeople(preloadedPeople.slice(0, 50));
    } else {
      setPeople([]);
    }
    return;
  }

  const queryLower = q.toLowerCase();

  try {
    const res = await authFetch(
      `${BACKEND_URL}/people?name=${encodeURIComponent(q)}`
    );

    if (!res.ok) throw new Error("Failed to fetch people");

    const data = await res.json();
    const results = data?.results || [];
    const filtered = results.filter((p) => {
      const fullNameLower =
        `${p.Name || ""} ${p.Surname || ""}`.toLowerCase();

      if (fullNameLower.includes(queryLower)) return true;

      const queryWords = queryLower.split(/\s+/).filter(Boolean);
      return queryWords.every((word) => fullNameLower.includes(word));
    });

    const formatted = filtered.map((p) => ({
      id: p._id,
      fullName:
        `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
      email: p.Email || p.email || "",
      leader1:
        p["Leader @1"] ||
        p["Leader at 1"] ||
        p["Leader @ 1"] ||
        p.leader1 ||
        (p.leaders && p.leaders[0]) ||
        "",
      leader12:
        p["Leader @12"] ||
        p["Leader at 12"] ||
        p["Leader @ 12"] ||
        p.leader12 ||
        (p.leaders && p.leaders[1]) ||
        "",
      leader144:
        p["Leader @144"] ||
        p["Leader at 144"] ||
        p["Leader @ 144"] ||
        p.leader144 ||
        (p.leaders && p.leaders[2]) ||
        "",
      phone: p.Number || p.Phone || p.phone || "",
    }));

    setPeople(formatted);
  } catch (err) {
    console.error("Error fetching people:", err);
    toast.error(err.message);
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

      const res = await authFetch(
        `${BACKEND_URL}/events/cell/${cellId}/common-attendees`,
        { headers },
      );
      const data = await res.json();
      const attendeesArray = data.common_attendees || [];

      const formatted = attendeesArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${
          p.Surname || p.surname || ""
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

  const savePersistentCommonAttendeesToDB = async (attendees) => {
    if (!event) return false;

    let eventId = event._id || event.id;

    if (eventId && eventId.includes("_")) {
      const parts = eventId.split("_");
      eventId = parts[0];
      console.log(`Cleaned event ID: ${eventId} (removed date suffix)`);
    }

    if (!eventId) {
      toast.error("No event ID found");
      return false;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const formattedAttendees = attendees
        .map((p) => ({
          id: p.id || p._id || "",
          name: p.fullName || p.name || "",
          fullName: p.fullName || p.name || "",
          email: p.email || "",
          leader12: p.leader12 || "",
          leader144: p.leader144 || "",
          phone: p.phone || "",
        }))
        .filter((p) => p.id);

      console.log(
        `Saving ${formattedAttendees.length} attendees for event: ${eventId}`,
      );

      const response = await authFetch(
        `${BACKEND_URL}/events/${eventId}/persistent-attendees`,
        {
          method: "PUT",
          headers: headers,
          body: JSON.stringify({
            persistent_attendees: formattedAttendees,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save: ${response.status} - ${errorText}`);
      }

      console.log(" Attendees saved to database");
      return true;
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save attendees");
      return false;
    }
  };

  function get_current_week_identifier() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }

  function getWeekNumber(date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPreloadedPeople();
    }
  }, [isOpen]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (isOpen && activeTab === 1) {
        if (associateSearch.trim()) {
          fetchPeople(associateSearch);
        } else {
          fetchPeople("");
        }
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [associateSearch, isOpen, activeTab, preloadedPeople]);

  const handleCheckIn = (id) => {
    setCheckedIn((prev) => {
      const isNowChecked = !prev[id];
      const newState = { ...prev, [id]: isNowChecked };
      if (isNowChecked) {
        toast.success("Person checked in for this week");
      } else {
        setDecisions((prevDec) => ({ ...prevDec, [id]: false }));
        setDecisionTypes((prevTypes) => {
          const updated = { ...prevTypes };
          delete updated[id];
          return updated;
        });
        toast.warning("Person unchecked for this week");
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

  const saveAllAttendeesToDatabase = async (attendees) => {
    if (!event) return false;

    // Get clean event ID
    let eventId = event._id || event.id;
    if (eventId && eventId.includes("_")) {
      eventId = eventId.split("_")[0];
    }

    try {
      const token = localStorage.getItem("token");
      const response = await authFetch(
        `${BACKEND_URL}/events/${eventId}/persistent-attendees`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            persistent_attendees: attendees,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      console.log(` Saved ${attendees.length} attendees to database`);
      return true;
    } catch (error) {
      console.error(" Failed to save:", error);
      toast.error("Failed to save attendees list");
      return false;
    }
  };
  const handleAssociatePerson = async (person) => {
    const isAlreadyAdded = persistentCommonAttendees.some(
      (p) => p.id === person.id,
    );

    if (isAlreadyAdded) {
      toast.info(`${person.fullName} is already in attendees list`);
      return;
    } else {
      const updated = [...persistentCommonAttendees, person];
      setPersistentCommonAttendees(updated);

      await saveAllAttendeesToDatabase(updated);

      toast.success(`${person.fullName} added to attendees list`);
    }
  };

  const handleRemoveAttendee = async (personId, personName) => {
    try {
      const updatedAttendees = persistentCommonAttendees.filter(p => p.id !== personId);

      setCheckedIn(prev => {
        const newState = { ...prev };
        delete newState[personId];
        return newState;
      });

      // Remove from decisions if exists
      setDecisions(prev => {
        const newState = { ...prev };
        delete newState[personId];
        return newState;
      });

      setDecisionTypes(prev => {
        const newState = { ...prev };
        delete newState[personId];
        return newState;
      });

      // Remove from ticketed event states if exists
      if (isTicketedEvent) {
        setPriceTiers(prev => {
          const newState = { ...prev };
          delete newState[personId];
          return newState;
        });

        setPaymentMethods(prev => {
          const newState = { ...prev };
          delete newState[personId];
          return newState;
        });

        setPaidAmounts(prev => {
          const newState = { ...prev };
          delete newState[personId];
          return newState;
        });
      }

      // Update state
      setPersistentCommonAttendees(updatedAttendees);

      // Save to database
      const success = await saveAllAttendeesToDatabase(updatedAttendees);

      if (success) {
        toast.success(`${personName} removed from attendees`);
      } else {
        toast.error("Failed to remove attendee from database");
      }
    } catch (error) {
      console.error("Error removing attendee:", error);
      toast.error("Error removing attendee");
    }
  };

  const getAllCommonAttendees = () => {
    const persistent = [...(persistentCommonAttendees || [])];
    let savedAttendees = [];

    if (event?.attendance?.attendees?.length > 0) {
      savedAttendees = event.attendance.attendees;
    }
    else if (event?.attendees?.length > 0) {
      savedAttendees = event.attendees;
    }

    const combinedMap = new Map();

    persistent.forEach(att => {
      if (att && att.id) {
        const attendeeId = att.id || att._id || "";
        if (attendeeId) {
          combinedMap.set(attendeeId, {
            ...att,
            id: attendeeId,
            fullName: att.fullName || att.name || "Unknown Person",
            email: att.email || "",
            leader12: att.leader12 || "",
            leader144: att.leader144 || "",
            phone: att.phone || "",
            isPersistent: true
          });
        }
      }
    });

    savedAttendees.forEach(savedAtt => {
      if (savedAtt && savedAtt.id) {
        const attendeeId = savedAtt.id || savedAtt._id || "";
        if (attendeeId) {
          const existing = combinedMap.get(attendeeId) || {};
          combinedMap.set(attendeeId, {
            ...existing,
            ...savedAtt,
            id: attendeeId,
            fullName: savedAtt.fullName || savedAtt.name || existing.fullName || "Unknown Person",
            email: savedAtt.email || existing.email || "",
            leader12: savedAtt.leader12 || existing.leader12 || "",
            leader144: savedAtt.leader144 || existing.leader144 || "",
            phone: savedAtt.phone || existing.phone || "",
            checked_in: savedAtt.checked_in !== false,
            decision: savedAtt.decision || existing.decision || "",
            isPersistent: existing.isPersistent || false
          });
        }
      }
    });

    return Array.from(combinedMap.values());
  };

  const attendeesCount = Object.keys(checkedIn).filter(
    (id) => checkedIn[id],
  ).length;
  const decisionsCount = Object.keys(decisions).filter(
    (id) => decisions[id],
  ).length;
  const firstTimeCount = Object.values(decisionTypes).filter(
    (type) => type === "first-time",
  ).length;
  const reCommitmentCount = Object.values(decisionTypes).filter(
    (type) => type === "re-commitment",
  ).length;
  const totalPaid = Object.values(paidAmounts).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const totalOwing = Object.keys(checkedIn)
    .filter((id) => checkedIn[id])
    .reduce((sum, id) => sum + calculateOwing(id), 0);
  const filteredCommonAttendees = getAllCommonAttendees().filter(person =>
    person.fullName.toLowerCase().includes(searchName.toLowerCase()) ||
    person.email.toLowerCase().includes(searchName.toLowerCase())
  );

  const filteredPeople = people.filter(
    (person) =>
      person.fullName.toLowerCase().includes(associateSearch.toLowerCase()) ||
      person.email.toLowerCase().includes(associateSearch.toLowerCase()),
  );

  const handleSave = async () => {
    const allPeople = getAllCommonAttendees();
    console.log("[SAVE] All people for save:", allPeople.length);

    const attendeesList = Object.keys(checkedIn).filter((id) => checkedIn[id]);
    console.log("[SAVE] Checked-in attendees:", attendeesList.length, attendeesList);

    // Get manual headcount from input
    const finalHeadcount = manualHeadcount ? parseInt(manualHeadcount) : 0;

    console.log("[SAVE] === DEBUG INFO ===");
    console.log("[SAVE] Did not meet state:", didNotMeet);
    console.log("[SAVE] Attendees checked in:", attendeesList.length);
    console.log("[SAVE] Manual headcount:", finalHeadcount);
    console.log("[SAVE] Decisions count:", decisionsCount);

    // Get clean event ID
    let eventId = event?.id || event?._id;
    if (eventId && eventId.includes("_")) {
      const parts = eventId.split("_");
      eventId = parts[0];
    }

    if (!eventId) {
      toast.error("Event ID is missing, cannot submit attendance.");
      return;
    }

    try {
      const selectedAttendees = attendeesList.map((id) => {
        const person = allPeople.find((p) => p && p.id === id);

        if (!person) {
          console.warn(`[SAVE] Person with id ${id} not found in allPeople`);
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
          checked_in: true,
          isPersistent: true
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

      console.log("[SAVE] Final selected attendees:", selectedAttendees.length, selectedAttendees);

      // Only mark as "Did Not Meet" if NO attendees AND NO headcount
      const shouldMarkAsDidNotMeet = didNotMeet && attendeesList.length === 0 && finalHeadcount === 0;

      console.log("[SAVE] Should mark as 'Did Not Meet'?", shouldMarkAsDidNotMeet);
      console.log("[SAVE] Reason - didNotMeet:", didNotMeet);

      const payload = {
        attendees: shouldMarkAsDidNotMeet ? [] : selectedAttendees,
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
        did_not_meet: shouldMarkAsDidNotMeet, // This will be FALSE if we have attendees
        isTicketed: isTicketedEvent,
        week: get_current_week_identifier(),
        headcount: finalHeadcount
      };

      console.log("[SAVE] Full payload being sent:");
      console.log("[SAVE] - did_not_meet:", payload.did_not_meet);
      console.log("[SAVE] - attendees count:", payload.attendees.length);
      console.log("[SAVE] - headcount:", payload.headcount);
      console.log("[SAVE] - week:", payload.week);

      let result;

      if (typeof onSubmit === "function") {
        result = await onSubmit(payload);
      } else {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const response = await authFetch(`${BACKEND_URL}/submit-attendance/${eventId}`, {
          method: "PUT",
          headers: headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[SAVE] Server error response:", errorText);
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        result = await response.json();
      }

      console.log("[SAVE] Save result:", result);

      if (result && result.success) {
        await loadEventStatistics();

        if (typeof onAttendanceSubmitted === "function") {
          await onAttendanceSubmitted();
        }

        if (typeof onClose === "function") {
          onClose();
        }
        if (typeof onAttendanceSubmitted === "function") {
          console.log("[SAVE] Calling onAttendanceSubmitted to refresh data");
          await onAttendanceSubmitted();
        }

        if (typeof onClose === "function") {
          onClose();
        }
      } else {
        console.error("[SAVE] Save failed:", result);
        throw new Error(result?.message || "Failed to save attendance");
      }

    } catch (error) {
      console.error("[SAVE] Error saving attendance:", error);
      toast.error(error.message || "Failed to save attendance. Please try again.");
    }
  };

  const downloadCheckedInAttendance = () => {
    try {
      const allPeople = getAllCommonAttendees();
      const attendeesList = Object.keys(checkedIn).filter((id) => checkedIn[id]);

      if (attendeesList.length === 0) {
        toast.info("No checked-in attendees to export");
        return;
      }

      // Build headers and rows
      const headers = ["Name", "Email", "Leader @12", "Leader @144", "Phone", "Decision", "Checked In"];
      const formatted = attendeesList.map((id) => {
        const person = allPeople.find((p) => p && p.id === id) || {};
        return {
          Name: person.fullName || "",
          Email: person.email || "",
          "Leader @12": person.leader12 || "",
          "Leader @144": person.leader144 || "",
          Phone: person.phone || "",
          Decision: decisionTypes[id] || "",
          "Checked In": "Yes",
        };
      });

      // Column widths for Excel
      const columnWidths = [200, 220, 160, 160, 120, 140, 80];
      const xmlCols = columnWidths
        .map(
          (w, i) =>
            `                    <x:Column ss:Index="${i + 1}" ss:AutoFitWidth="0" ss:Width="${w}"/>`,
        )
        .join("\n");

      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
          <head>
            <meta charset="utf-8">
            <!--[if gte mso 9]>
            <xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>Attendance</x:Name>
                    <x:WorksheetOptions>
                      <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                    <x:WorksheetColumns>
${xmlCols}
                    </x:WorksheetColumns>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
              table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; }
              th { background-color: #a3aca3ff; color: white; font-weight: bold; padding: 12px 8px; text-align: center; border: 1px solid #ddd; font-size: 11pt; white-space: nowrap; }
              td { padding: 8px; border: 1px solid #ddd; font-size: 10pt; text-align: left; }
              tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <table border="1">
              <thead><tr>
      `;

      headers.forEach((h) => {
        html += `                <th>${h}</th>\n`;
      });
      html += `              </tr></thead><tbody>\n`;

      formatted.forEach((row) => {
        html += `              <tr>\n`;
        headers.forEach((h) => {
          const val = row[h] || "";
          html += `                <td>${String(val).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>\n`;
        });
        html += `              </tr>\n`;
      });

      html += `            </tbody></table></body></html>`;

      const blob = new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const safeEventName = (event?.Event_Name || event?.eventName || event?.EventName || "event")
        .toString()
        .replace(/\s/g, "_");
      const fileName = `attendance_${safeEventName}_${new Date().toISOString().split("T")[0]}.xls`;
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Error exporting attendance:", err);
      toast.error("Failed to export attendance: " + (err?.message || ""));
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
        toast.error("Event ID is missing, cannot submit attendance.");
        return;
      }

      const allPeople = getAllCommonAttendees();
      const payload = {
        attendees: [],
        persistent_attendees: allPeople.map(p => ({
          id: p.id,
          fullName: p.fullName,
          email: p.email,
          leader12: p.leader12,
          leader144: p.leader144,
          phone: p.phone
        })),
        leaderEmail: currentUser?.email || "",
        leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
        did_not_meet: true,
        isTicketed: isTicketedEvent,
        week: get_current_week_identifier()
      };

      let result;

      if (typeof onSubmit === "function") {
        result = await onSubmit(payload);
      } else {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const response = await authFetch(
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
        if (typeof onAttendanceSubmitted === "function") {
          onAttendanceSubmitted();
        }

        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        toast.error(result?.message || result?.detail || "Failed to mark event as 'Did Not Meet'.");
      }
    } catch (error) {
      console.error(" Error marking event as 'Did Not Meet':", error);
      toast.error("Something went wrong while marking event as 'Did Not Meet'.");
    }
  };

  const cancelDidNotMeet = () => {
    setShowDidNotMeetConfirm(false);
  };

  const handlePersonAdded = (newPerson) => {
    console.log(" New person added:", newPerson);

    // Clear caches and reload fresh people from DB
    clearGlobalPeopleCache();
    loadPreloadedPeople(true);
    fetchPeople();

    if (event && event.eventType === "cell") {
      fetchCommonAttendees(event._id || event.id);
    }
    setShowAddPersonModal(false);
    toast.success(`${newPerson.Name} ${newPerson.Surname} added successfully!`);
  };

  const renderMobileAttendeeCard = (person) => {
    const isPersistent = persistentCommonAttendees.some(
      (p) => p.id === person.id,
    );
    const isCheckedIn = checkedIn[person.id];

    return (
      <div key={person.id} style={styles.mobileAttendeeCard}>
        <div style={styles.mobileCardRow}>
          <div style={styles.mobileCardInfo}>
            <div style={styles.mobileCardName}>
              {person.fullName}
              <button
                onClick={() => handleRemoveAttendee(person.id, person.fullName)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  marginLeft: "8px",
                  borderRadius: "4px",
                  color: theme.palette.error.main,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  verticalAlign: "middle",
                }}
                title="Remove from attendees"
              >
                <X size={16} />
              </button>
            </div>
            <div style={styles.mobileCardEmail}>{person.email}</div>
            {!isTicketedEvent && (
              <>
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.palette.text.secondary,
                  }}
                >
                  Leader @12: {person.leader12}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: theme.palette.text.secondary,
                  }}
                >
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
                      openPriceTierDropdown === person.id ? null : person.id,
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
                            (e.target.style.background =
                              theme.palette.action.hover)
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.background = "transparent")
                          }
                        >
                          {tier.name} - R{parseFloat(tier.price).toFixed(2)}
                          <div
                            style={{
                              fontSize: "12px",
                              color: theme.palette.text.secondary,
                            }}
                          >
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
                      openPaymentDropdown === person.id ? null : person.id,
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
                          (e.target.style.background =
                            theme.palette.action.hover)
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
                      openDecisionDropdown === person.id ? null : person.id,
                    )
                  }
                >
                  <span>
                    {decisionTypes[person.id]
                      ? decisionOptions.find(
                          (opt) => opt.value === decisionTypes[person.id],
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
                          (e.target.style.background =
                            theme.palette.action.hover)
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
      textAlign: "center",
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
    removeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px",
      borderRadius: "4px",
      color: theme.palette.error.main,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto",
      transition: "all 0.2s",
      '&:hover': {
        background: theme.palette.error.light,
        color: theme.palette.error.contrastText,
      }
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
                      border: `1px solid ${isDarkMode ? "#555" : "#ccc"}`,
                      backgroundColor: isDarkMode
                        ? theme.palette.background.default
                        : theme.palette.background.paper,
                      color: isDarkMode ? theme.palette.text.primary : "#000",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = isDarkMode
                        ? theme.palette.action.hover
                        : theme.palette.background.default;
                      e.target.style.borderColor = isDarkMode ? "#777" : "#999";
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = isDarkMode
                        ? theme.palette.background.default
                        : theme.palette.background.paper;
                      e.target.style.borderColor = isDarkMode ? "#555" : "#ccc";
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
                          <th style={styles.th}>Attendees Leader @12</th>
                          <th style={styles.th}>Attendees Leader @144</th>
                          <th style={styles.th}>Attendees Number</th>
                          <th style={{ ...styles.th, textAlign: "center" }}>
                            Check In
                          </th>
                          <th style={{ ...styles.th, textAlign: "center" }}>
                            Decision
                          </th>
                          <th style={{ ...styles.th, textAlign: "center", width: "50px" }}>
                            Remove
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td
                              colSpan="8"
                              style={{ ...styles.td, textAlign: "center" }}
                            >
                              Loading...
                            </td>
                          </tr>
                        )}
                        {!loading && filteredCommonAttendees.length === 0 && (
                          <tr>
                            <td
                              colSpan="8"
                              style={{ ...styles.td, textAlign: "center" }}
                            >
                              No attendees found.
                            </td>
                          </tr>
                        )}
                        {filteredCommonAttendees.map((person) => {
                          const isPersistent = persistentCommonAttendees.some(
                            (p) => p.id === person.id,
                          );

                          return (
                            <tr key={person.id}>
                              <td style={styles.td}>
                                {person.fullName || "Unknown Name"}
                              </td>

                              <td style={styles.td}>{person.email || "No email"}</td>

                              <td style={styles.td}>{person.leader12 || ""}</td>

                              <td style={styles.td}>{person.leader144 || ""}</td>

                              <td style={styles.td}>{person.phone || ""}</td>

                              <td style={{ ...styles.td, ...styles.radioCell }}>
                                <button
                                  style={{
                                    ...styles.radioButton,
                                    ...(checkedIn[person.id]
                                      ? styles.radioButtonChecked
                                      : {}),
                                  }}
                                  onClick={() =>
                                    handleCheckIn(person.id, person.fullName || "Unknown")
                                  }
                                >
                                  {checkedIn[person.id] && (
                                    <span style={styles.radioButtonInner}>
                                      ✓
                                    </span>
                                  )}
                                </button>
                              </td>

                              {/* Column 7: Decision */}
                              <td style={{ ...styles.td, ...styles.radioCell }}>
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
                                              (e.currentTarget.style.background = theme.palette.action.hover)
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

                              <td style={{ ...styles.td, textAlign: "center" }}>
                                <button
                                  onClick={() => handleRemoveAttendee(person.id, person.fullName || "Unknown")}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "4px",
                                    color: theme.palette.error.main,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto",
                                  }}
                                  title="Remove from attendees"
                                >
                                  <X size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={styles.statsContainer}>
                  <div style={styles.statBox}>
                    <div style={{ ...styles.statNumber, color: theme.palette.info.main }}>
                      {persistentCommonAttendees.length}
                    </div>
                    <div style={styles.statLabel}>Associated People</div>
                  </div>

                  <div style={styles.statBox}>
                    <div style={{ ...styles.statNumber, color: theme.palette.success.main }}>
                      {/* Show current week's checked-in count only */}
                      {Object.keys(checkedIn).filter(id => checkedIn[id]).length}
                    </div>
                    <div style={styles.statLabel}>Attendees</div>
                  </div>

                  <div style={styles.statBoxInput}>
                    <input
                      type="number"
                      value={manualHeadcount}
                      onChange={(e) => setManualHeadcount(e.target.value)}
                      placeholder="0"
                      style={styles.headcountInput}
                      min="0"
                    />
                    <div style={styles.statLabel}>Total Headcounts</div>
                  </div>

                  {!isTicketedEvent && (
                    <div style={styles.statBox}>
                      <div style={{ ...styles.statNumber, color: "#ffc107" }}>
                        {/* Show current week's decisions*/}
                        {Object.keys(decisions).filter(id => decisions[id]).length}
                      </div>
                      <div style={styles.statLabel}>Decisions</div>
                      {Object.keys(decisions).filter(id => decisions[id]).length > 0 && (
                        <div style={styles.decisionBreakdown}>
                          <span>First-time: {Object.values(decisionTypes).filter(type => type === "first-time").length}</span>
                          <span>Re-commitment: {Object.values(decisionTypes).filter(type => type === "re-commitment").length}</span>
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
                      border: `1px solid ${isDarkMode ? theme.palette.divider : "#ccc"}`,
                      backgroundColor: isDarkMode
                        ? theme.palette.background.default
                        : theme.palette.background.paper,
                      color: isDarkMode ? theme.palette.text.primary : "#000",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = isDarkMode
                        ? theme.palette.action.hover
                        : theme.palette.background.default;
                      e.target.style.borderColor = isDarkMode ? "#777" : "#999";
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = isDarkMode
                        ? theme.palette.background.default
                        : theme.palette.background.paper;
                      e.target.style.borderColor = isDarkMode ? "#555" : "#ccc";
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
                        (p) => p.id === person.id,
                      );

                      return (
                        <div key={person.id} style={styles.mobileAttendeeCard}>
                          <div style={styles.mobileCardRow}>
                            <div style={styles.mobileCardInfo}>
                              <div style={styles.mobileCardName}>
                                {person.fullName}
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
                                cursor: isAlreadyAdded ? "not-allowed" : "pointer",
                                opacity: isAlreadyAdded ? 0.3 : 1,
                              }}
                              onClick={() => handleAssociatePerson(person)}
                              disabled={isAlreadyAdded}
                              title={
                                isAlreadyAdded
                                  ? "Already added"
                                  : "Add to common attendees"
                              }
                            >
                              <UserPlus size={20} />
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
                            (p) => p.id === person.id,
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
                                    color: isAlreadyAdded ? "#dc3545" : "#6366f1",
                                    cursor: isAlreadyAdded ? "not-allowed" : "pointer",
                                    opacity: isAlreadyAdded ? 0.3 : 1,
                                  }}
                                  onClick={() => handleAssociatePerson(person)}
                                  disabled={isAlreadyAdded}
                                  title={
                                    isAlreadyAdded
                                      ? "Already added"
                                      : "Add to common attendees"
                                  }
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
            <button
              style={{
                ...styles.saveBtn,
                background: attendeesCount > 0 ? "#1976d2" : "#ccc",
                cursor: attendeesCount > 0 ? "pointer" : "not-allowed",
                minWidth: 180,
              }}
              onClick={downloadCheckedInAttendance}
              disabled={attendeesCount === 0}
              title={
                attendeesCount === 0
                  ? "Check in at least one person to enable download"
                  : "Download checked-in attendance (XLS)"
              }
            >
              DOWNLOAD ATTENDANCE (XLS)
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
