import { useState, useEffect, useContext, useMemo } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  UserPlus,
  Search,
  ChevronDown,
  X,
  Menu,
   User
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const GEOAPIFY_COUNTRY_CODE = (
  import.meta.env.VITE_GEOAPIFY_COUNTRY_CODE || "za"
).toLowerCase();

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

  const [addressOptions, setAddressOptions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  const [biasLonLat, setBiasLonLat] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBiasLonLat({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        setBiasLonLat(null);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (!GEOAPIFY_API_KEY) {
      setAddressError(
        "Geoapify API key is missing. Add VITE_GEOAPIFY_API_KEY in your .env file.",
      );
      return;
    }

    const query = (formData.address || "").trim();
    if (query.length < 3) {
      setAddressOptions([]);
      setAddressError("");
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setAddressLoading(true);
        setAddressError("");

        const biasParam = biasLonLat
          ? `&bias=proximity:${encodeURIComponent(
              biasLonLat.lon,
            )},${encodeURIComponent(biasLonLat.lat)}`
          : "";

        const url =
          `https://api.geoapify.com/v1/geocode/autocomplete` +
          `?text=${encodeURIComponent(query)}` +
          `&limit=10` +
          `&lang=en` +
          `&filter=countrycode:${encodeURIComponent(GEOAPIFY_COUNTRY_CODE)}` +
          biasParam +
          `&format=json` +
          `&apiKey=${encodeURIComponent(GEOAPIFY_API_KEY)}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Address lookup failed");

        const data = await res.json();
        if (!isActive) return;

        const results = Array.isArray(data?.results) ? data.results : [];

        const mapped = results
          .map((r) => ({
            label: r.formatted || "",
            formatted: r.formatted || "",
            suburb: r.suburb || "",
            city: r.city || r.town || r.village || "",
            state: r.state || "",
            postcode: r.postcode || "",
            lat: r.lat,
            lon: r.lon,
          }))
          .filter((x) => x.label);

        setAddressOptions(mapped);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setAddressError(
          "Could not load address suggestions. Please type manually.",
        );
        setAddressOptions([]);
      } finally {
        if (isActive) setAddressLoading(false);
      }
    }, 350);

    return () => {
      isActive = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [isOpen, formData.address, biasLonLat]);

  const handleAddressInputChange = (value) => {
    setFormData((prev) => ({ ...prev, address: value }));
    setSelectedAddress(null);
    setShowAddressDropdown(true);


  };

  const handleAddressSelect = (option) => {
    const formatted = option?.formatted || option?.label || "";
    setSelectedAddress(option || null);
    setFormData((prev) => ({ ...prev, address: formatted }));
    setShowAddressDropdown(false);
  };

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  useEffect(() => {
    if (isOpen) {
      fetchAllPeople();
    }
  }, [isOpen]);

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

  const filterPeopleOptions = (inputValue) => {
    if (!inputValue) {
      return peopleOptions.slice(0, 30);
    }
    const searchTerm = inputValue.toLowerCase();
    return peopleOptions
      .filter(
        (option) =>
          option.searchText.includes(searchTerm) ||
          option.fullName.toLowerCase().includes(searchTerm) ||
          option.email.toLowerCase().includes(searchTerm) ||
          (option.phone && option.phone.includes(searchTerm)),
      )
      .slice(0, 50);
  };

  const filteredInviterResults = useMemo(() => {
    return filterPeopleOptions(inviterSearchInput);
  }, [inviterSearchInput, peopleOptions]);

  const handleInviterSelect = (person) => {
    console.log("Selected inviter:", person.fullName);

    setFormData((prev) => ({ ...prev, invitedBy: person.fullName }));
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
    setTouched((prev) => ({ ...prev, invitedBy: true }));

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
          finalLeaderInfo.leader1728 || "",
        ].filter((leader) => leader.trim() !== ""),
        stage: "Win",
      };

      console.log("Submitting new person:", payload);
      const response = await authFetch(`${BACKEND_URL}/people`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create person");
      }

      const result = await response.json();
      console.log("Person created:", result);
      toast.success("Person created successfully!");
      await authFetch(`${BACKEND_URL}/cache/refresh`, { method: "POST" });
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
      invitedBy: formData.invitedBy?.trim(),
    };

    const missingFields = Object.keys(requiredFields).filter(
      (key) => !requiredFields[key],
    );

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
                Home Address{" "}
                {showError("address") && (
                  <span style={styles.required}>Required</span>
                )}
              </label>

              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleAddressInputChange(e.target.value)}
                onFocus={() => setShowAddressDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowAddressDropdown(false), 200);
                  setTouched((prev) => ({ ...prev, address: true }));
                }}
                style={showError("address") ? styles.inputError : styles.input}
                placeholder={
                  GEOAPIFY_API_KEY
                    ? "Start typing your address..."
                    : "Missing Geoapify API key. Add VITE_GEOAPIFY_API_KEY in your .env."
                }
                autoComplete="off"
              />

              {showAddressDropdown &&
                (addressLoading ||
                  addressOptions.length > 0 ||
                  addressError) && (
                  <div style={styles.dropdown}>
                    {addressLoading ? (
                      <div style={styles.loadingItem}>
                        Searching addresses...
                      </div>
                    ) : addressOptions.length > 0 ? (
                      addressOptions.map((opt) => (
                        <div
                          key={`${opt.lon ?? ""}-${opt.lat ?? ""}-${opt.label}`}
                          style={styles.dropdownItem}
                          onClick={() => handleAddressSelect(opt)}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              theme.palette.action.hover)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              theme.palette.background.paper)
                          }
                        >
                          <div
                            style={{ fontWeight: "500", marginBottom: "4px" }}
                          >
                            {opt.label}
                          </div>
                          {(opt.suburb ||
                            opt.city ||
                            opt.state ||
                            opt.postcode) && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: theme.palette.text.secondary,
                              }}
                            >
                              {[opt.suburb, opt.city, opt.state, opt.postcode]
                                .filter(Boolean)
                                .join(" • ")}
                            </div>
                          )}
                        </div>
                      ))
                    ) : addressError ? (
                      <div style={styles.dropdownEmpty}>{addressError}</div>
                    ) : formData.address.trim().length < 3 ? (
                      <div style={styles.dropdownEmpty}>
                        Type at least 3 characters...
                      </div>
                    ) : (
                      <div style={styles.dropdownEmpty}>
                        No address matches found.
                      </div>
                    )}
                  </div>
                )}

              {selectedAddress?.lat && selectedAddress?.lon && (
                <div style={styles.hint}>
                  Selected:{" "}
                  {selectedAddress.city || selectedAddress.suburb || "Location"}{" "}
                  • {selectedAddress.state || "SA"}
                </div>
              )}
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
  const isDarkMode = theme.palette.mode === "dark";
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
        const token = localStorage.getItem("access_token");
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
  console.log("leadership set", handleLeaderSelect)

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
  const [attendeeTicketInfo, setAttendeeTicketInfo] = useState({});
  const [openPriceTierDropdown, setOpenPriceTierDropdown] = useState(null);
  const [people, setPeople] = useState([]);
  const [, setCommonAttendees] = useState([]);
  const [associateSearch, setAssociateSearch] = useState("");
  const [loading] = useState(false);
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
  const [, setSelectedEvent] = useState(null);
  const [, setShowAttendanceModal] = useState(false);  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const handleOpenAttendanceModal = async (event) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/events/${event._id || event.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullEvent = await response.json();

      setSelectedEvent(fullEvent);
      setShowAttendanceModal(true);
    } catch (err) {
      console.error("Failed to fetch full event:", err);
      setSelectedEvent(event);
      setShowAttendanceModal(true);
    }
  };

  const isTicketedEvent = event?.isTicketed || false;
  const eventPriceTiers =
    event?.priceTiers ||
    event?.formData?.priceTiers ||
    [];

  const theme = useTheme();

  console.log("Event isTicketed:", event?.isTicketed);
  console.log("Event priceTiers:", event?.priceTiers);
  console.log("Full event object:", event);

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
      recommitment: 0,
    },
  });
  const clearGlobalPeopleCache = () => {
    try {
      if (typeof window !== "undefined") {
        delete window.globalPeopleCache;
        window.clearGlobalPeopleCache = () => {
          delete window.globalPeopleCache;
        };
      }
    } catch (err) {
      console.warn("Failed to clear global people cache", err);
    }
  };

  const loadEventStatistics = async () => {
    if (!event) return;

    try {
      const eventDate = event.date;
      console.log("Loading stats for:", eventDate);

      let weekAttendance = {};
      let firstTimeCount = 0;
      let recommitmentCount = 0;
      let attendeesCount = 0;
      let headcount = 0;
      let totalAssociated = 0;

      if (event.checked_in_count !== undefined || event.total_headcounts !== undefined) {
        attendeesCount = event.checked_in_count || 0;
        headcount = event.total_headcounts || 0;
        totalAssociated = event.total_associated || persistentCommonAttendees.length || 0;

        if (event.decisions) {
          firstTimeCount = event.decisions.first_time || 0;
          recommitmentCount = event.decisions.recommitment || 0;
        }

        if (event.attendees && Array.isArray(event.attendees)) {
          weekAttendance.attendees = event.attendees;

          event.attendees.forEach((att) => {
            const decision = (att.decision || "").toLowerCase();
            if (decision.includes("first")) {
              firstTimeCount++;
            } else if (
              decision.includes("re-commitment") ||
              decision.includes("recommitment")
            ) {
              recommitmentCount++;
            }
          });
        }

        weekAttendance = {
          status: "complete",
          attendees: event.attendees || [],
          total_headcounts: headcount,
          checked_in_count: attendeesCount,
          statistics: {
            total_associated: totalAssociated,
            weekly_attendance: attendeesCount,
            total_headcounts: headcount,
            decisions: {
              first_time: firstTimeCount,
              recommitment: recommitmentCount,
              total: firstTimeCount + recommitmentCount,
            },
          },
        };
      } else if (event.attendance_data) {
        weekAttendance = event.attendance_data;

        if (weekAttendance.statistics) {
          attendeesCount = weekAttendance.statistics.weekly_attendance || 0;
          headcount = weekAttendance.statistics.total_headcounts || 0;
          firstTimeCount = weekAttendance.statistics.decisions?.first_time || 0;
          recommitmentCount =
            weekAttendance.statistics.decisions?.recommitment || 0;
          totalAssociated =
            weekAttendance.statistics.total_associated ||
            persistentCommonAttendees.length;
        } else {
          attendeesCount = weekAttendance.checked_in_count || weekAttendance.attendees?.length || 0;
          headcount = weekAttendance.total_headcounts || 0;
          totalAssociated = persistentCommonAttendees.length;

          if (weekAttendance.attendees) {
            weekAttendance.attendees.forEach((att) => {
              const decision = (att.decision || "").toLowerCase();
              if (decision.includes("first")) {
                firstTimeCount++;
              } else if (
                decision.includes("re-commitment") ||
                decision.includes("recommitment")
              ) {
                recommitmentCount++;
              }
            });
          }
        }
      } else {
        const attendanceData = event.attendance || {};

        if (attendanceData.status === "complete") {
          weekAttendance = attendanceData;
        } else {
          const possibleKeys = Object.keys(attendanceData).filter(
            (key) =>
              typeof attendanceData[key] === "object" &&
              attendanceData[key] !== null,
          );

          console.log("Possible date keys:", possibleKeys);

          for (const key of possibleKeys) {
            const data = attendanceData[key];

            if (data && (data.status === "complete" || data.attendees || data.total_headcounts)) {
              const entryDate = data.event_date_iso || data.event_date_exact;

              if (
                entryDate === eventDate ||
                key === eventDate ||
                eventDate.includes(key) ||
                key.includes(eventDate)
              ) {
                weekAttendance = data;
                console.log(`Using completed week from key: "${key}"`);
                break;
              }
            }
          }
        }

        if (weekAttendance.status === "complete") {
          const stats = weekAttendance.statistics || {};
          attendeesCount = weekAttendance.checked_in_count || weekAttendance.attendees?.length || 0;
          headcount = weekAttendance.total_headcounts || 0;
          firstTimeCount = stats.decisions?.first_time || 0;
          recommitmentCount = stats.decisions?.recommitment || 0;
          totalAssociated =
            stats.total_associated || persistentCommonAttendees.length;

          if (
            firstTimeCount === 0 &&
            recommitmentCount === 0 &&
            weekAttendance.attendees
          ) {
            weekAttendance.attendees.forEach((att) => {
              const decision = (att.decision || "").toLowerCase();
              if (decision.includes("first")) {
                firstTimeCount++;
              } else if (
                decision.includes("re-commitment") ||
                decision.includes("recommitment")
              ) {
                recommitmentCount++;
              }
            });
          }
        } else {
          totalAssociated = persistentCommonAttendees.length;
        }
      }

      console.log("Final statistics:", { attendeesCount, headcount, firstTimeCount, recommitmentCount, totalAssociated });

      setEventStatistics({
        totalAssociated: totalAssociated,
        lastAttendanceCount: attendeesCount,
        lastHeadcount: headcount,
        lastDecisionsCount: firstTimeCount + recommitmentCount,
        lastAttendanceBreakdown: {
          first_time: firstTimeCount,
          recommitment: recommitmentCount,
        },
      });

      if (headcount > 0) {
        setManualHeadcount(headcount.toString());
      } else {
        setManualHeadcount("0");
      }

      window.__lastLoadedAttendance = weekAttendance;
    } catch (error) {
      console.error("Error loading event statistics:", error);
    }
  };

  const loadWeeklyCheckins = () => {
    if (!event) {
      setCheckedIn({});
      setManualHeadcount("0");
      setDidNotMeet(false);
      return;
    }

    setCheckedIn({});
    setDecisions({});
    setDecisionTypes({});
    setAttendeeTicketInfo({});
    setManualHeadcount("0");
    setDidNotMeet(false);

    // Helper function to process attendees
    const processAttendees = (attendees) => {
      const newCheckedIn = {};
      const newDecisions = {};
      const newDecisionTypes = {};
      const newTicketInfo = {};

      attendees.forEach(att => {
        if (att.id) {
          newCheckedIn[att.id] = att.checked_in || false;

          if (att.decision) {
            newDecisions[att.id] = true;
            newDecisionTypes[att.id] = att.decision;
          }

          // Always load ticket info for ticketed events
          if (isTicketedEvent) {
            newTicketInfo[att.id] = {
              priceName: att.priceName || (eventPriceTiers?.[0]?.name) || "",
              price: att.price || (eventPriceTiers?.[0]?.price) || 0,
              ageGroup: att.ageGroup || (eventPriceTiers?.[0]?.ageGroup) || "",
              paymentMethod: att.paymentMethod || "Cash"
            };
          }
        }
      });

      setCheckedIn(newCheckedIn);
      setDecisions(newDecisions);
      setDecisionTypes(newDecisionTypes);
      setAttendeeTicketInfo(newTicketInfo);
    };

    // Check multiple possible locations for attendees
    if (event.attendees && Array.isArray(event.attendees) && event.attendees.length > 0) {
      console.log("Loading checkins from direct event.attendees:", event.attendees.length);
      processAttendees(event.attendees);

      if (event.total_headcounts) {
        setManualHeadcount(event.total_headcounts.toString());
      }
      return;
    }

    if (event.attendance_data && event.attendance_data.attendees) {
      console.log("Loading checkins from attendance_data");
      processAttendees(event.attendance_data.attendees);

      if (event.attendance_data.total_headcounts) {
        setManualHeadcount(event.attendance_data.total_headcounts.toString());
      }
      return;
    }

    // Check nested attendance object
    const attendanceData = event.attendance || {};
    const eventDate = event.date;
    const weekAttendance = attendanceData[eventDate] || attendanceData;

    if (weekAttendance?.attendees?.length > 0) {
      console.log("Loading checkins from attendance by date");
      processAttendees(weekAttendance.attendees);

      if (weekAttendance.total_headcounts) {
        setManualHeadcount(weekAttendance.total_headcounts.toString());
      }
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
        
        // Log to verify we're getting all attendees
        console.log(`Loaded ${allAttendees.length} persistent attendees from database`);
        
        setPersistentCommonAttendees(allAttendees);
        
        // Initialize checkedIn state for all loaded attendees (default to false)
        // But preserve any existing checked-in states
        setCheckedIn(prev => {
          const newCheckedIn = { ...prev };
          allAttendees.forEach(attendee => {
            if (attendee.id && newCheckedIn[attendee.id] === undefined) {
              newCheckedIn[attendee.id] = false;
            }
          });
          return newCheckedIn;
        });
      }
    } catch (error) {
      console.error("Error loading attendees:", error);
    }
  };

  const loadPreloadedPeople = async (forceRefresh = false) => {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (
      !forceRefresh &&
      typeof window !== "undefined" &&
      window.globalPeopleCache &&
      window.globalPeopleCache.data?.length > 0 &&
      window.globalPeopleCache.timestamp &&
      now - window.globalPeopleCache.timestamp < CACHE_DURATION
    ) {
      console.log("Using cached people data in AttendanceModal");
      setPreloadedPeople(window.globalPeopleCache.data);

      if (activeTab === 1 && !associateSearch.trim()) {
        setPeople(window.globalPeopleCache.data.slice(0, 50));
      }
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const params = new URLSearchParams();
      params.append("perPage", "200"); 
      params.append("page", "1");

      const res = await authFetch(`${BACKEND_URL}/people?${params.toString()}`, { headers });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const peopleArray = data.people || data.results || [];

      const formatted = peopleArray.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
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
      console.log(`Pre-loaded ${formatted.length} people into AttendanceModal cache`);

      if (activeTab === 1 && !associateSearch.trim()) {
        setPeople(formatted.slice(0, 50));
      }
    } catch (err) {
      console.error("Error pre-loading people:", err);
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      let eventId = event._id || event.id;
      if (eventId && eventId.includes("_")) {
        eventId = eventId.split("_")[0];
      }
      console.log("Opening modal for event:", eventId, "Date:", event.date);

      setSearchName("");
      setAssociateSearch("");
      setActiveTab(0);
      setCheckedIn({});
      setDecisions({});
      setDecisionTypes({});
      setAttendeeTicketInfo({});
      setManualHeadcount("0");
      setDidNotMeet(false);

      const loadAllData = async () => {
        console.log("Loading all data...");

        await loadPersistentAttendees(eventId);
        await loadEventStatistics();
        loadWeeklyCheckins();
      };

      loadAllData();

      const attendanceData = event.attendance || {};
      const eventDate = event.date;
      const weekAttendance = attendanceData[eventDate] || {};
      
      setDidNotMeet(weekAttendance?.status === "did_not_meet" || false);
    }
  }, [isOpen, event]);

  const fetchPeople = async (q) => {
    if (!q || !q.trim()) {
      if (preloadedPeople.length > 0) {
        setPeople(preloadedPeople.slice(0, 50));
      } else {
        setPeople([]);
      }
      return;
    }

    const query = q.trim();
    const queryLower = query.toLowerCase();

    try {
      if (preloadedPeople.length > 0) {
        const cachedResults = preloadedPeople.filter(person => {
          const fullNameLower = person.fullName.toLowerCase();
          const emailLower = person.email.toLowerCase();
          const searchWordsArray = queryLower.split(/\s+/).filter(word => word.length > 0);
          const nameParts = fullNameLower.split(/\s+/);
          if (emailLower.includes(queryLower)) return true;
          const allWordsMatch = searchWordsArray.every(searchWord =>
            nameParts.some(namePart => namePart.includes(searchWord))
          );

          if (allWordsMatch) return true;
          return nameParts.some(namePart => namePart.startsWith(queryLower));
        });

        if (cachedResults.length > 0) {
          console.log(`Found ${cachedResults.length} results in cache`);
          setPeople(cachedResults);
          return;
        }
      }
      console.log("Searching API for:", query);

      const searchTerms = query.split(/\s+/).filter(word => word.length > 0);
      let results = [];

      if (searchTerms.length === 1) {
        const singleWord = searchTerms[0];

        let res = await authFetch(
          `${BACKEND_URL}/people?name=${encodeURIComponent(singleWord)}`
        );

        if (res.ok) {
          const data = await res.json();
          results = data?.results || data?.people || [];
        }

        if (results.length === 0) {
          res = await authFetch(`${BACKEND_URL}/people?perPage=100`);
          if (res.ok) {
            const data = await res.json();
            const allResults = data?.results || data?.people || [];
            results = allResults.filter(p => {
              const name = (p.Name || "").toLowerCase();
              const surname = (p.Surname || "").toLowerCase();
              return name.includes(singleWord.toLowerCase()) ||
                surname.includes(singleWord.toLowerCase());
            });
          }
        }
      } else {
        let res = await authFetch(
          `${BACKEND_URL}/people?name=${encodeURIComponent(query)}`
        );

        if (res.ok) {
          const data = await res.json();
          results = data?.results || data?.people || [];
        }

        if (results.length === 0) {
          res = await authFetch(`${BACKEND_URL}/people?perPage=100`);
          if (res.ok) {
            const data = await res.json();
            const allResults = data?.results || data?.people || [];

            const searchTermsLower = searchTerms.map(term => term.toLowerCase());
            results = allResults.filter(p => {
              const fullName = `${p.Name || ""} ${p.Surname || ""}`.toLowerCase();
              return searchTermsLower.every(term => fullName.includes(term));
            });
          }
        }
      }

      console.log(`API returned ${results.length} results`);

      const formatted = results.map((p) => ({
        id: p._id,
        fullName: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim(),
        email: p.Email || p.email || "",
        leader1: p["Leader @1"] || p["Leader at 1"] || p["Leader @ 1"] || p.leader1 || (p.leaders && p.leaders[0]) || "",
        leader12: p["Leader @12"] || p["Leader at 12"] || p["Leader @ 12"] || p.leader12 || (p.leaders && p.leaders[1]) || "",
        leader144: p["Leader @144"] || p["Leader at 144"] || p["Leader @ 144"] || p.leader144 || (p.leaders && p.leaders[2]) || "",
        phone: p.Number || p.Phone || p.phone || "",
        searchText: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""} ${p.Email || p.email || ""}`.toLowerCase()
      }));

      const searchTermsLower = queryLower.split(/\s+/).filter(word => word.length > 0);
      const finalFiltered = formatted.filter(person => {
        const fullNameLower = person.fullName.toLowerCase();
        return searchTermsLower.every(term => fullNameLower.includes(term));
      });

      setPeople(finalFiltered);

    } catch (err) {
      console.error("Error fetching people:", err);
      toast.error(err.message);

      if (preloadedPeople.length > 0) {
        const searchTermsLower = queryLower.split(/\s+/).filter(word => word.length > 0);
        const fallbackResults = preloadedPeople.filter(person => {
          const fullNameLower = person.fullName.toLowerCase();
          return searchTermsLower.every(term => fullNameLower.includes(term));
        });
        setPeople(fallbackResults);
      } else {
        setPeople([]);
      }
    }
  };
  
  const fetchCommonAttendees = async (cellId) => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await authFetch(
        `${BACKEND_URL}/events/cell/${cellId}/common-attendees`,
        { headers },
      );
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
    // Clear previous timeout
    const timeoutId = setTimeout(() => {
      if (isOpen && activeTab === 1) {
        if (associateSearch.trim()) {
          fetchPeople(associateSearch);
        } else {
          // Use cached/preloaded people when no search term
          if (preloadedPeople.length > 0) {
            setPeople(preloadedPeople.slice(0, 50));
          } else {
            fetchPeople("");
          }
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
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
    setDecisionTypes((prev) => ({ ...prev, [id]: type }));
    setDecisions((prev) => ({ ...prev, [id]: true }));
    setOpenDecisionDropdown(null);
  };


  const handlePaymentMethodChange = (personId, method) => {
    setAttendeeTicketInfo(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        paymentMethod: method
      }
    }));
  };

  const handlePriceChange = (personId, price) => {
    setAttendeeTicketInfo(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        price: parseFloat(price) || 0
      }
    }));
  };

  const saveAllAttendeesToDatabase = async (attendees) => {
    if (!event) return false;

    let eventId = event._id || event.id;
    if (eventId && eventId.includes("_")) {
      eventId = eventId.split("_")[0];
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await authFetch(
        `${BACKEND_URL}/events/${eventId}/persistent-attendees`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ persistent_attendees: attendees }),
        }
      );

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      console.log(`Saved ${attendees.length} attendees to database`);
      return true;
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save attendees list");
      return false;
    }
  };

  const handleAssociatePerson = async (person) => {
    const isAlreadyAdded = persistentCommonAttendees.some(p => p.id === person.id);

    if (isAlreadyAdded) {
      toast.info(`${person.fullName} is already in attendees list`);
      return;
    }

    // Update UI immediately
    if (isTicketedEvent && eventPriceTiers && eventPriceTiers.length > 0) {
      const defaultTier = eventPriceTiers[0];
      const personWithTicket = {
        ...person,
        priceName: defaultTier.name,
        price: defaultTier.price,
        ageGroup: defaultTier.ageGroup,
        paymentMethod: defaultTier.paymentMethod || "Cash"
      };

      // Optimistic UI update
      setPersistentCommonAttendees(prev => [...prev, personWithTicket]);
      setCheckedIn(prev => ({ ...prev, [person.id]: false }));
      setAttendeeTicketInfo(prev => ({
        ...prev,
        [person.id]: {
          priceName: defaultTier.name,
          price: defaultTier.price,
          ageGroup: defaultTier.ageGroup,
          paymentMethod: defaultTier.paymentMethod || "Cash"
        }
      }));

      // Show success immediately
      toast.success(`${person.fullName} added with ${defaultTier.name} ticket`);

      // Save to database in background (don't await)
      const updated = [...persistentCommonAttendees, personWithTicket];
      saveAllAttendeesToDatabase(updated).catch(error => {
        console.error("Background save failed:", error);
        toast.error("Failed to save to database, but person is added locally");
      });
      
    } else {
      setPersistentCommonAttendees(prev => [...prev, person]);
      setCheckedIn(prev => ({ ...prev, [person.id]: false }));

      toast.success(`${person.fullName} added to attendees list`);

      const updated = [...persistentCommonAttendees, person];
      saveAllAttendeesToDatabase(updated).catch(error => {
        console.error("Background save failed:", error);
        toast.error("Failed to save to database, but person is added locally");
      });
    }
  };

  const handleRemoveAttendee = async (personId, personName) => {
    try {
      const updatedAttendees = persistentCommonAttendees.filter(
        (p) => p.id !== personId,
      );

      setCheckedIn((prev) => {
        const newState = { ...prev };
        delete newState[personId];
        return newState;
      });

      setDecisions((prev) => {
        const newState = { ...prev };
        delete newState[personId];
        return newState;
      });

      setDecisionTypes((prev) => {
        const newState = { ...prev };
        delete newState[personId];
        return newState;
      });

      if (isTicketedEvent) {
        setAttendeeTicketInfo(prev => {
          const newState = { ...prev };
          delete newState[personId];
          return newState;
        });
      }

      setPersistentCommonAttendees(updatedAttendees);

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
    } else if (event?.attendance_data?.attendees?.length > 0) {
      savedAttendees = event.attendance_data.attendees;
    } else if (event?.attendees?.length > 0) {
      savedAttendees = event.attendees;
    }

    const combinedMap = new Map();

    persistent.forEach((att) => {
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
            priceName: att.priceName || "",
            price: att.price || 0,
            ageGroup: att.ageGroup || "",
            paymentMethod: att.paymentMethod || "",
            isPersistent: true
          });
        }
      }
    });

    savedAttendees.forEach((savedAtt) => {
      if (savedAtt && savedAtt.id) {
        const attendeeId = savedAtt.id || savedAtt._id || "";
        if (attendeeId) {
          const existing = combinedMap.get(attendeeId) || {};
          combinedMap.set(attendeeId, {
            ...existing,
            ...savedAtt,
            id: attendeeId,
            fullName:
              savedAtt.fullName ||
              savedAtt.name ||
              existing.fullName ||
              "Unknown Person",
            email: savedAtt.email || existing.email || "",
            leader12: savedAtt.leader12 || existing.leader12 || "",
            leader144: savedAtt.leader144 || existing.leader144 || "",
            phone: savedAtt.phone || existing.phone || "",
            priceName: savedAtt.priceName || existing.priceName || "",
            price: savedAtt.price || existing.price || 0,
            ageGroup: savedAtt.ageGroup || existing.ageGroup || "",
            paymentMethod: savedAtt.paymentMethod || existing.paymentMethod || "",
            checked_in: savedAtt.checked_in !== false,
            decision: savedAtt.decision || existing.decision || "",
            isPersistent: existing.isPersistent || false,
          });
        }
      }
    });

    return Array.from(combinedMap.values());
  };

  const attendeesCount = Object.keys(checkedIn).filter((id) => checkedIn[id]).length;
  console.log("Attendees checked in:", attendeesCount);
  const decisionsCount = Object.keys(decisions).filter((id) => decisions[id]).length;
  console.log("Total decisions made:", decisionsCount);
  const firstTimeCount = Object.values(decisionTypes).filter((type) => type === "first-time").length;
  console.log("First-time decisions count:", firstTimeCount);
  const reCommitmentCount = Object.values(decisionTypes).filter((type) => type === "re-commitment").length;
  console.log("Re-commitment decisions count:", reCommitmentCount);

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
    const attendeesList = Object.keys(checkedIn).filter((id) => checkedIn[id]);
    const finalHeadcount = manualHeadcount ? parseInt(manualHeadcount) : 0;

    let eventId = event?.id || event?._id;
    if (eventId && eventId.includes("_")) {
      eventId = eventId.split("_")[0];
    }

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
          checked_in: true,
          isPersistent: true
        };

        if (isTicketedEvent) {
          const ticketInfo = attendeeTicketInfo[id] || person;
          attendee.priceName = ticketInfo.priceName || "";
          attendee.price = ticketInfo.price || 0;
          attendee.ageGroup = ticketInfo.ageGroup || "";
          attendee.paymentMethod = ticketInfo.paymentMethod || "";
        }

        return attendee;
      }).filter(attendee => attendee !== null);

      const shouldMarkAsDidNotMeet = didNotMeet && attendeesList.length === 0 && finalHeadcount === 0;

      // IMPORTANT: Use persistentCommonAttendees directly, NOT allPeople
      // This ensures we keep ALL associated people, not just the ones currently in the UI
      const payload = {
        attendees: shouldMarkAsDidNotMeet ? [] : selectedAttendees,
        persistent_attendees: persistentCommonAttendees.map(p => ({
          id: p.id,
          name: p.fullName,
          fullName: p.fullName,
          email: p.email,
          leader12: p.leader12,
          leader144: p.leader144,
          phone: p.phone,
          ...(isTicketedEvent && {
            priceName: p.priceName || "",
            price: p.price || 0,
            ageGroup: p.ageGroup || "",
            paymentMethod: p.paymentMethod || ""
          })
        })),
        leaderEmail: currentUser?.email || "",
        leaderName: `${currentUser?.name || ""} ${currentUser?.surname || ""}`.trim(),
        did_not_meet: shouldMarkAsDidNotMeet,
        isTicketed: isTicketedEvent,
        week: get_current_week_identifier(),
        headcount: finalHeadcount
      };

      console.log("Saving payload with persistent attendees:", payload.persistent_attendees.length);

      let result;

      if (typeof onSubmit === "function") {
        result = await onSubmit(payload);
      } else {
        const token = localStorage.getItem("token");
        const response = await authFetch(`${BACKEND_URL}/submit-attendance/${eventId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        result = await response.json();
      }

      if (result && result.success) {
        // After successful save, reload the persistent attendees to ensure sync
        await loadPersistentAttendees(eventId);
        await loadEventStatistics();

        if (typeof onAttendanceSubmitted === "function") {
          await onAttendanceSubmitted();
        }

        if (typeof onClose === "function") {
          onClose();
        }
        
        toast.success(`Attendance saved successfully with ${persistentCommonAttendees.length} associated people`);
      } else {
        throw new Error(result?.message || "Failed to save attendance");
      }

    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(error.message || "Failed to save attendance. Please try again.");
    }
  };

  const downloadAttendanceData = () => {
    try {
      const allPeople = getAllCommonAttendees();
      const checkedInAttendees = Object.keys(checkedIn)
        .filter((id) => checkedIn[id])
        .map((id) => {
          const person = allPeople.find((p) => p && p.id === id);
          if (!person) return null;

          return {
            "Event Name": event?.eventName || "N/A",
            "Event Date": event?.date || "N/A",
            Name: person.fullName || "N/A",
            Email: person.email || "N/A",
            "Leader @12": person.leader12 || "N/A",
            "Leader @144": person.leader144 || "N/A",
            Phone: person.phone || "N/A",
            Decision: decisionTypes[id] || "N/A",
            Status: didNotMeet ? "Did Not Meet" : "Complete",
            ...(isTicketedEvent && {
              'Price Name': attendeeTicketInfo[id]?.priceName || person.priceName || 'N/A',
              'Price': attendeeTicketInfo[id]?.price || person.price || 'N/A',
              'Age Group': attendeeTicketInfo[id]?.ageGroup || person.ageGroup || 'N/A',
              'Payment Method': attendeeTicketInfo[id]?.paymentMethod || person.paymentMethod || 'N/A'
            })
          };
        })
        .filter((att) => att !== null);

      if (checkedInAttendees.length === 0 && didNotMeet) {
        buildXlsFromRows([{
          'Event Name': event?.eventName || 'N/A',
          'Event Date': event?.date || 'N/A',
          'Name': 'No attendees - Event Did Not Meet',
          'Email': '', 'Leader @12': '', 'Leader @144': '',
          'Phone': '', 'Decision': '', 'Status': 'Did Not Meet',
          ...(isTicketedEvent && { 'Price Name': 'N/A', 'Price': 'N/A', 'Age Group': 'N/A', 'Payment Method': 'N/A' })
        }], `attendance_${(event?.eventName || 'event').replace(/\s/g, '_')}_did_not_meet`);
        return;
      }

      if (checkedInAttendees.length === 0) {
        toast.info("No attendance data to download");
        return;
      }

      buildXlsFromRows(
        checkedInAttendees,
        `attendance_${(event?.eventName || "event").replace(/\s/g, "_")}_${didNotMeet ? "did_not_meet" : "complete"}`,
      );

      toast.success(
        `Downloaded ${checkedInAttendees.length} attendance records`,
      );
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download attendance data");
    }
  };

  const buildXlsFromRows = (rows, fileBaseName = "export") => {
    if (!rows || rows.length === 0) {
      toast.info("No data to export");
      return;
    }

    const escapeHtml = (s) =>
      String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const headers = Object.keys(rows[0]);

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%;font-family:Calibri,Arial,sans-serif;}th{background-color:#a3aca3ff;color:white;font-weight:bold;padding:12px 8px;text-align:center;border:1px solid #ddd;font-size:11pt;white-space:nowrap;}td{padding:8px;border:1px solid #ddd;font-size:10pt;text-align:left;}tr:nth-child(even){background-color:#f2f2f2;}</style></head><body><table border="1"><thead><tr>`;

    headers.forEach((h) => { html += `<th>${escapeHtml(h)}</th>`; });
    html += `</tr></thead><tbody>`;
    rows.forEach((row) => {
      html += `<tr>`;
      headers.forEach((h) => { html += `<td>${escapeHtml(row[h] || "")}</td>`; });
      html += `</tr>`;
    });
    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBaseName}_${new Date().toISOString().split("T")[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
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
    setAttendeeTicketInfo({});

    let eventId = event?.id || event?._id;
    if (eventId && eventId.includes("_")) {
      eventId = eventId.split("_")[0];
    }

    if (!eventId) {
      toast.error("Event ID is missing, cannot mark as 'Did Not Meet'.");
      return;
    }

    try {
      const allPeople = getAllCommonAttendees();
      const payload = {
        attendees: [],
        persistent_attendees: allPeople.map(p => ({
          id: p.id,
          fullName: p.fullName,
          email: p.email,
          leader12: p.leader12,
          leader144: p.leader144,
          phone: p.phone,
          ...(isTicketedEvent && {
            priceName: p.priceName || "",
            price: p.price || 0,
            ageGroup: p.ageGroup || "",
            paymentMethod: p.paymentMethod || ""
          })
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
        const response = await authFetch(
          `${BACKEND_URL}/submit-attendance/${eventId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          }
        );
        result = await response.json();
        result.success = response.ok;
      }

      if (result?.success) {
        // Close modal immediately
        if (typeof onClose === "function") {
          onClose();
        }
        
        // Refresh data in background
        if (typeof onAttendanceSubmitted === "function") {
          onAttendanceSubmitted().catch(console.error);
        }
      } else {
        toast.error(result?.message || result?.detail || "Failed to mark event as 'Did Not Meet'.");
      }
    } catch (error) {
      console.error("Error marking event as 'Did Not Meet':", error);
      toast.error("Something went wrong while marking event as 'Did Not Meet'.");
    }
  };
  
  const cancelDidNotMeet = () => {
    setShowDidNotMeetConfirm(false);
  };

  const handlePersonAdded = (newPerson) => {
    console.log("New person added:", newPerson);

    clearGlobalPeopleCache();
    loadPreloadedPeople(true);
    fetchPeople("");

    if (event && event.eventType === "cell") {
      fetchCommonAttendees(event._id || event.id);
    }
    setShowAddPersonModal(false);
    toast.success(`${newPerson.Name} ${newPerson.Surname} added successfully!`);
  };

  console.log("Event object:", event);
  console.log("Price tiers:", event?.priceTiers);
  console.log("Full event keys:", Object.keys(event || {}));

  const renderMobileAttendeeCard = (person) => {
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
                  background: "none", border: "none", cursor: "pointer", padding: "4px",
                  marginLeft: "8px", borderRadius: "4px", color: theme.palette.error.main,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", verticalAlign: "middle",
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
            {isTicketedEvent && (
              <div style={{ fontSize: "12px", color: theme.palette.text.secondary, marginTop: "4px" }}>
                {attendeeTicketInfo[person.id]?.priceName || person.priceName || "No ticket selected"}
                {(attendeeTicketInfo[person.id]?.price || person.price) &&
                  ` - R${(attendeeTicketInfo[person.id]?.price || person.price)}`
                }
              </div>
            )}
          </div>
          <button
            style={{ ...styles.radioButton, ...(isCheckedIn ? styles.radioButtonChecked : {}) }}
            onClick={() => handleCheckIn(person.id)}
          >
            {isCheckedIn && <span style={styles.radioButtonInner}>✓</span>}
          </button>
        </div>

        {isCheckedIn && !isTicketedEvent && (
          <div style={{ marginTop: "12px" }}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Decision</label>
              <div style={styles.decisionDropdown}>
                <button
                  style={styles.decisionButton}
                  onClick={() => setOpenDecisionDropdown(openDecisionDropdown === person.id ? null : person.id)}
                >
                  <span>
                    {decisionTypes[person.id]
                      ? decisionOptions.find((opt) => opt.value === decisionTypes[person.id])?.label
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
                        onMouseEnter={(e) => (e.target.style.background = theme.palette.action.hover)}
                        onMouseLeave={(e) => (e.target.style.background = "transparent")}
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
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: isDarkMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.45)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 9999, padding: 10,
    },
    modal: {
      position: "relative", background: theme.palette.background.paper, padding: 0,
      borderRadius: 12, width: "100%", maxWidth: 1200, maxHeight: "90vh",
      display: "flex", flexDirection: "column", boxSizing: "border-box",
      border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary,
    },
    header: {
      padding: "clamp(12px, 2.5vw, 20px) clamp(16px, 3vw, 30px)",
      borderBottom: `1px solid ${theme.palette.divider}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      flexWrap: "wrap", gap: 10, background: theme.palette.background.default,
    },
    title: {
      fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 600, margin: 0,
      color: theme.palette.text.primary, display: "flex", alignItems: "center",
      gap: 12, flexWrap: "wrap",
    },
    ticketBadge: {
      background: theme.palette.warning.main,
      color: theme.palette.warning.contrastText || "#000",
      padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: "uppercase",
    },
    addPersonBtn: {
      background: theme.palette.primary.main, color: theme.palette.primary.contrastText,
      border: "none", padding: "8px 14px", borderRadius: 8, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap",
    },
    tabsContainer: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: "0 clamp(12px, 3vw, 30px)", display: "flex", gap: 0, position: "relative",
    },
    mobileMenuButton: {
      background: "none", border: "none", padding: 12, cursor: "pointer",
      color: theme.palette.primary.main, display: isMobile ? "flex" : "none", alignItems: "center",
    },
    tab: {
      padding: "clamp(10px, 2vw, 16px) clamp(12px, 2vw, 24px)", fontSize: 14, fontWeight: 600,
      background: "none", border: "none", borderBottom: "3px solid transparent", cursor: "pointer",
      color: theme.palette.text.secondary, transition: "all 0.2s", whiteSpace: "nowrap",
      flex: isMobile ? "1" : "none",
    },
    tabActive: {
      color: theme.palette.primary.main,
      borderBottom: `3px solid ${theme.palette.primary.main}`,
    },
    contentArea: {
      flex: 1, overflowY: "auto",
      padding: "clamp(12px, 3vw, 20px) clamp(12px, 3vw, 30px)",
    },
    searchBox: { position: "relative", marginBottom: 16 },
    searchIcon: {
      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
      color: theme.palette.text.secondary,
    },
    // ── TABLE: horizontal scroll + generous spacing ──
    tableContainer: {
      marginBottom: 16,
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      paddingBottom: 8,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: isTicketedEvent ? 1100 : 780,
    },
    th: {
      textAlign: "left",
      padding: "14px 20px",
      borderBottom: `2px solid ${theme.palette.divider}`,
      fontSize: 13,
      color: theme.palette.text.secondary,
      fontWeight: 600,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      letterSpacing: "0.04em",
    },
    td: {
      padding: "14px 20px",
      borderBottom: `1px solid ${theme.palette.divider}`,
      fontSize: 14,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
    },
    radioCell: { textAlign: "center" },
    radioButton: {
      width: 20, height: 20, borderRadius: "50%",
      border: `2px solid ${theme.palette.primary.main}`, background: theme.palette.background.paper,
      cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
    },
    radioButtonChecked: {
      background: theme.palette.success.main,
      border: `2px solid ${theme.palette.success.main}`,
    },
    radioButtonInner: {
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    },
    decisionDropdown: { position: "relative", display: "inline-block" },
    decisionButton: {
      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
      background: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}`,
      borderRadius: 6, cursor: "pointer", fontSize: 14, color: theme.palette.text.primary,
      minWidth: isMobile ? 140 : 180, justifyContent: "space-between",
    },
    decisionMenu: {
      position: "absolute", top: "100%", left: "0", marginTop: 4,
      background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`,
      borderRadius: 6, boxShadow: theme.shadows[4], zIndex: 10000,
      minWidth: isMobile ? 140 : 200, maxHeight: 300, overflowY: "auto",
    },
    decisionMenuItem: {
      padding: "10px 12px", cursor: "pointer", fontSize: 14,
      color: theme.palette.text.primary, transition: "background 0.15s",
    },
    // New styles for price tier dropdown
    priceTierDropdown: { position: "relative", display: "inline-block" },
    priceTierButton: {
      display: "flex", alignItems: "center", gap: 4, padding: "6px 10px",
      background: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}`,
      borderRadius: 4, cursor: "pointer", fontSize: 13, color: theme.palette.text.primary,
      minWidth: 120, justifyContent: "space-between",
    },
    priceTierMenu: {
      position: "absolute", top: "100%", left: "0", marginTop: 2,
      background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`,
      borderRadius: 4, boxShadow: theme.shadows[4], zIndex: 10000,
      minWidth: 180, maxHeight: 250, overflowY: "auto",
    },
    priceTierMenuItem: {
      padding: "8px 12px", cursor: "pointer", fontSize: 13,
      color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`,
      "&:hover": { background: theme.palette.action.hover },
      "&:last-child": { borderBottom: "none" },
    },
    paymentMethodSelect: {
      padding: "6px 8px",
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 4,
      fontSize: 13,
      color: theme.palette.text.primary,
      cursor: "pointer",
      minWidth: 100,
    },
    priceInput: {
      padding: "6px 8px",
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 4,
      fontSize: 13,
      color: theme.palette.text.primary,
      width: 80,
    },
    statsContainer: { display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" },
    statBox: {
      flex: "1 1 calc(25% - 15px)", background: theme.palette.background.default,
      padding: "clamp(12px, 2vw, 18px)", borderRadius: 8, textAlign: "center",
      position: "relative", minWidth: 120,
    },
    statBoxInput: {
      flex: "1 1 calc(25% - 15px)", background: theme.palette.background.default,
      padding: "clamp(12px, 2vw, 18px)", borderRadius: 8, textAlign: "center",
      position: "relative", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", minWidth: 120,
    },
    headcountInput: {
      fontSize: "clamp(20px, 3.5vw, 32px)", fontWeight: 700, color: theme.palette.info.main,
      marginBottom: 8, border: "none", borderRadius: 8, padding: "4px 12px",
      width: 100, textAlign: "center", background: "transparent", outline: "none",
    },
    statNumber: {
      fontSize: "clamp(20px, 3.5vw, 32px)", fontWeight: 700, color: theme.palette.success.main, marginBottom: 8,
    },
    statLabel: {
      fontSize: 13, color: theme.palette.text.secondary, textTransform: "uppercase", fontWeight: 600,
    },
    decisionBreakdown: {
      fontSize: 14, color: theme.palette.text.secondary, marginTop: 8, display: "flex", flexDirection: "column", gap: 4,
    },
    footer: {
      padding: "clamp(12px, 3vw, 20px)", borderTop: `1px solid ${theme.palette.divider}`,
      display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
    },
    closeBtn: {
      background: "transparent", border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary,
      padding: "12px 20px", borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 500,
      flex: isMobile ? "1 1 100%" : "none", minWidth: 120,
    },
    didNotMeetBtn: {
      background: theme.palette.error.main, color: theme.palette.error.contrastText || "#fff",
      border: "none", padding: "12px 20px", borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 500,
      flex: isMobile ? "1 1 100%" : "none", minWidth: 140,
    },
    saveBtn: {
      background: theme.palette.success.main, color: theme.palette.success.contrastText || "#fff",
      border: "none", padding: "12px 20px", borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 500,
      flex: isMobile ? "1 1 100%" : "none", minWidth: 120,
    },
    persistentBadge: {
      background: theme.palette.primary.main, color: theme.palette.primary.contrastText || "#fff",
      padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, marginLeft: 8,
    },
    iconButton: {
      background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center", color: theme.palette.text.primary,
    },
    mobileAttendeeCard: {
      background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8, padding: 12, marginBottom: 12,
    },
    mobileCardRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
    mobileCardInfo: { flex: 1 },
    mobileCardName: {
      fontWeight: 600, fontSize: 16, color: theme.palette.text.primary,
      marginBottom: 4, display: "flex", alignItems: "center", flexWrap: "wrap",
    },
    mobileCardEmail: { fontSize: 14, color: theme.palette.text.secondary, marginBottom: 4 },
    confirmOverlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: isDarkMode ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.45)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 10002, padding: 20,
    },
    confirmModal: {
      background: theme.palette.background.paper, borderRadius: 12, padding: 24,
      maxWidth: 400, width: "100%", border: `1px solid ${theme.palette.divider}`,
    },
    confirmHeader: { marginBottom: 16 },
    confirmTitle: { fontSize: 18, fontWeight: 600, color: theme.palette.text.primary, margin: 0, textAlign: 'center' },
    confirmBody: { marginBottom: 20, textAlign: "center" },
    confirmMessage: { fontSize: 16, color: theme.palette.text.primary, marginBottom: 8 },
    confirmSubMessage: { fontSize: 14, color: theme.palette.text.secondary, margin: 0 },
    confirmFooter: { display: "flex", gap: 12, justifyContent: "flex-end" },
    confirmCancelBtn: {
      background: "transparent", border: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary,
      padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500,
    },
    confirmProceedBtn: {
      background: theme.palette.error.main, color: theme.palette.error.contrastText || "#fff",
      border: "none", padding: "10px 20px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500,
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
      "&:hover": {
        background: theme.palette.error.light,
        color: theme.palette.error.contrastText,
      },
    },
    inputGroup: { position: "relative" },
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
            <button style={styles.addPersonBtn} onClick={() => setShowAddPersonModal(true)}>
              <UserPlus size={18} />
              Add New Person
            </button>
          </div>

          <div style={styles.tabsContainer}>
            {isMobile && (
              <button style={styles.mobileMenuButton} onClick={() => setShowMobileMenu(!showMobileMenu)}>
                <Menu size={20} />
              </button>
            )}
            {(!isMobile || showMobileMenu) && (
              <>
                <button style={{ ...styles.tab, ...(activeTab === 0 ? styles.tabActive : {}) }} onClick={() => setActiveTab(0)}>
                  CAPTURE ATTENDEES
                </button>
                <button style={{ ...styles.tab, ...(activeTab === 1 ? styles.tabActive : {}) }} onClick={() => setActiveTab(1)}>
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
                      width: "100%", padding: "14px 14px 14px 45px", fontSize: 16, borderRadius: 8,
                      border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
                      backgroundColor: isDarkMode ? theme.palette.background.default : theme.palette.background.paper,
                      color: isDarkMode ? theme.palette.text.primary : '#000',
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = isDarkMode ? theme.palette.action.hover : theme.palette.background.default;
                      e.target.style.borderColor = isDarkMode ? '#777' : '#999';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = isDarkMode ? theme.palette.background.default : theme.palette.background.paper;
                      e.target.style.borderColor = isDarkMode ? '#555' : '#ccc';
                    }}
                  />
                </div>

                {isMobile ? (
                  <div>
                    {loading && <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>}
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
                          {isTicketedEvent && (
                            <>
                              <th style={styles.th}>Price Name</th>
                              <th style={styles.th}>Price (R)</th>
                              <th style={styles.th}>Age Group</th>
                              <th style={styles.th}>Payment Method</th>
                            </>
                          )}
                          <th style={{ ...styles.th, textAlign: "center" }}>Check In</th>
                          {!isTicketedEvent && (
                            <th style={{ ...styles.th, textAlign: "center" }}>Decision</th>
                          )}
                          <th style={{ ...styles.th, textAlign: "center", width: "50px" }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && (
                          <tr>
                            <td colSpan={isTicketedEvent ? "10" : "8"} style={{ ...styles.td, textAlign: "center" }}>
                              Loading...
                            </td>
                          </tr>
                        )}
                        {!loading && filteredCommonAttendees.length === 0 && (
                          <tr>
                            <td colSpan={isTicketedEvent ? "10" : "8"} style={{ ...styles.td, textAlign: "center" }}>
                              No attendees found.
                            </td>
                          </tr>
                        )}
                        {filteredCommonAttendees.map((person) => {
                          const ticketInfo = attendeeTicketInfo[person.id] || person;

                          return (
                            <tr key={person.id}>
                              <td style={styles.td}>{person.fullName || "Unknown Name"}</td>
                              <td style={styles.td}>{person.email || "No email"}</td>
                              <td style={styles.td}>{person.leader12 || ""}</td>
                              <td style={styles.td}>{person.leader144 || ""}</td>
                              <td style={styles.td}>{person.phone || ""}</td>


                              {isTicketedEvent && (
                                <>
                                  {/* Price Name Dropdown - Always visible */}
                                  <td style={styles.td}>
                                    <div style={styles.priceTierDropdown}>
                                      <button
                                        style={styles.priceTierButton}
                                        onClick={() => setOpenPriceTierDropdown(openPriceTierDropdown === person.id ? null : person.id)}
                                      >
                                        <span>{ticketInfo.priceName || "Select Tier"}</span>
                                        <ChevronDown size={14} />
                                      </button>
                                      {openPriceTierDropdown === person.id && eventPriceTiers && eventPriceTiers.length > 0 && (
                                        <div style={styles.priceTierMenu}>
                                          {eventPriceTiers.map((tier, index) => (
                                            <div
                                              key={index}
                                              style={styles.priceTierMenuItem}
                                              onClick={() => {
                                                // Update ticket info when tier is selected - use tier's payment method
                                                setAttendeeTicketInfo(prev => ({
                                                  ...prev,
                                                  [person.id]: {
                                                    priceName: tier.name,
                                                    price: tier.price,
                                                    ageGroup: tier.ageGroup,
                                                    paymentMethod: tier.paymentMethod || "Cash" // Use payment method from the tier
                                                  }
                                                }));
                                                setOpenPriceTierDropdown(null);
                                              }}
                                              onMouseEnter={(e) => (e.currentTarget.style.background = theme.palette.action.hover)}
                                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                            >
                                              <div style={{ fontWeight: 500 }}>{tier.name}</div>
                                              <div style={{ fontSize: 11, color: theme.palette.text.secondary }}>
                                                R{tier.price} • {tier.ageGroup} • {tier.paymentMethod || "Cash"}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {openPriceTierDropdown === person.id && (!eventPriceTiers || eventPriceTiers.length === 0) && (
                                        <div style={styles.priceTierMenu}>
                                          <div style={{ ...styles.priceTierMenuItem, color: theme.palette.text.secondary }}>
                                            No price tiers available
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* Price (R) - Display only, no input */}
                                  <td style={styles.td}>
                                    <span style={{
                                      color: theme.palette.text.primary,
                                      fontWeight: 500
                                    }}>
                                      {ticketInfo.price ? `R${ticketInfo.price}` : "-"}
                                    </span>
                                  </td>

                                  {/* Age Group - Display only */}
                                  <td style={styles.td}>
                                    <span style={{ color: theme.palette.text.secondary }}>
                                      {ticketInfo.ageGroup || "-"}
                                    </span>
                                  </td>

                                  <td style={styles.td}>
                                    <span style={{ color: theme.palette.text.secondary }}>
                                      {ticketInfo.paymentMethod || "-"}
                                    </span>
                                  </td>
                                </>
                              )}

                              <td style={{ ...styles.td, ...styles.radioCell }}>
                                <button
                                  style={{ ...styles.radioButton, ...(checkedIn[person.id] ? styles.radioButtonChecked : {}) }}
                                  onClick={() => handleCheckIn(person.id)}
                                >
                                  {checkedIn[person.id] && <span style={styles.radioButtonInner}>✓</span>}
                                </button>
                              </td>

                              {!isTicketedEvent && (
                                <td style={{ ...styles.td, ...styles.radioCell }}>
                                  {checkedIn[person.id] ? (
                                    <div style={styles.decisionDropdown}>
                                      <button
                                        style={styles.decisionButton}
                                        onClick={() => setOpenDecisionDropdown(openDecisionDropdown === person.id ? null : person.id)}
                                      >
                                        <span>
                                          {decisionTypes[person.id]
                                            ? decisionOptions.find((opt) => opt.value === decisionTypes[person.id])?.label
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
                                              onMouseEnter={(e) => (e.currentTarget.style.background = theme.palette.action.hover)}
                                              onMouseLeave={(e) => (e.target.style.background = "transparent")}
                                            >
                                              {option.label}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <button style={{ ...styles.radioButton, opacity: 0.3, cursor: "not-allowed" }} disabled />
                                  )}
                                </td>
                              )}

                              <td style={{ ...styles.td, textAlign: "center" }}>
                                <button
                                  onClick={() =>
                                    handleRemoveAttendee(
                                      person.id,
                                      person.fullName || "Unknown",
                                    )
                                  }
                                  style={{
                                    background: "none", border: "none", cursor: "pointer", padding: "4px",
                                    borderRadius: "4px", color: theme.palette.error.main,
                                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
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
                    <div
                      style={{
                        ...styles.statNumber,
                        color: theme.palette.info.main,
                      }}
                    >
                      {persistentCommonAttendees.length}
                    </div>
                    <div style={styles.statLabel}>Associated People</div>
                  </div>

                  <div style={styles.statBox}>
                    <div
                      style={{
                        ...styles.statNumber,
                        color: theme.palette.success.main,
                      }}
                    >
                      {
                        Object.keys(checkedIn).filter((id) => checkedIn[id])
                          .length
                      }
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
                        {
                          Object.keys(decisions).filter((id) => decisions[id])
                            .length
                        }
                      </div>
                      <div style={styles.statLabel}>Decisions</div>
                      {Object.keys(decisions).filter((id) => decisions[id])
                        .length > 0 && (
                        <div style={styles.decisionBreakdown}>
                          <span>
                            First-time:{" "}
                            {
                              Object.values(decisionTypes).filter(
                                (type) => type === "first-time",
                              ).length
                            }
                          </span>
                          <span>
                            Re-commitment:{" "}
                            {
                              Object.values(decisionTypes).filter(
                                (type) => type === "re-commitment",
                              ).length
                            }
                          </span>
                        </div>
                      )}
                    </div>
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
                      width: "100%", padding: "14px 14px 14px 45px", fontSize: 16, borderRadius: 8,
                      border: `1px solid ${isDarkMode ? theme.palette.divider : '#ccc'}`,
                      backgroundColor: isDarkMode ? theme.palette.background.default : theme.palette.background.paper,
                      color: isDarkMode ? theme.palette.text.primary : '#000',
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = isDarkMode ? theme.palette.action.hover : theme.palette.background.default;
                      e.target.style.borderColor = isDarkMode ? '#777' : '#999';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = isDarkMode ? theme.palette.background.default : theme.palette.background.paper;
                      e.target.style.borderColor = isDarkMode ? '#555' : '#ccc';
                    }}
                  />
                </div>

                {isMobile ? (
                  <div>
                    {loading && <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>}
                    {!loading && filteredPeople.length === 0 && (
                      <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>No people found.</div>
                    )}
                    {filteredPeople.map((person) => {
                      const isAlreadyAdded = persistentCommonAttendees.some((p) => p.id === person.id);
                      return (
                        <div key={person.id} style={styles.mobileAttendeeCard}>
                          <div style={styles.mobileCardRow}>
                            <div style={styles.mobileCardInfo}>
                              <div style={styles.mobileCardName}>{person.fullName}</div>
                              <div style={styles.mobileCardEmail}>{person.email}</div>
                              <div style={{ fontSize: "12px", color: "#666" }}>Leader @12: {person.leader12}</div>
                              <div style={{ fontSize: "12px", color: "#666" }}>Phone: {person.phone}</div>
                            </div>
                            <button
                              style={{ ...styles.iconButton, color: isAlreadyAdded ? "#dc3545" : "#6366f1", cursor: isAlreadyAdded ? "not-allowed" : "pointer", opacity: isAlreadyAdded ? 0.3 : 1 }}
                              onClick={() => handleAssociatePerson(person)}
                              disabled={isAlreadyAdded}
                              title={isAlreadyAdded ? "Already added" : "Add to common attendees"}
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
                          <th style={{ ...styles.th, textAlign: "center" }}>Add</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading && <tr><td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>Loading...</td></tr>}
                        {!loading && filteredPeople.length === 0 && (
                          <tr><td colSpan="6" style={{ ...styles.td, textAlign: "center" }}>No people found.</td></tr>
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
                                  style={{ ...styles.iconButton, color: isAlreadyAdded ? "#dc3545" : "#6366f1", cursor: isAlreadyAdded ? "not-allowed" : "pointer", opacity: isAlreadyAdded ? 0.3 : 1 }}
                                  onClick={() => handleAssociatePerson(person)}
                                  disabled={isAlreadyAdded}
                                  title={isAlreadyAdded ? "Already added" : "Add to common attendees"}
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
            <button style={styles.closeBtn} onClick={onClose}>CLOSE</button>

            <button
              onClick={() => downloadAttendanceData()}
              style={{
                background: theme.palette.info.main, color: theme.palette.info.contrastText || "#fff",
                border: "none", padding: "12px 20px", borderRadius: 6, cursor: "pointer", fontSize: 16, fontWeight: 500,
                flex: isMobile ? "1 1 100%" : "none", minWidth: 120,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
              title="Download attendance data"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              DOWNLOAD DATA
            </button>

            <div style={{ display: "flex", gap: "12px", flex: isMobile ? "1 1 100%" : "none", flexWrap: isMobile ? "wrap" : "nowrap" }}>
              <button style={styles.didNotMeetBtn} onClick={handleDidNotMeet}>DID NOT MEET</button>
              <button style={styles.saveBtn} onClick={handleSave}>SAVE</button>
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
                Are you sure you want to mark this event as <strong>'Did Not Meet'</strong>?
              </p>
              <p style={styles.confirmSubMessage}>
                This will clear all current attendance data and cannot be undone.
              </p>
            </div>
            <div style={styles.confirmFooter}>
              <button style={styles.confirmCancelBtn} onClick={cancelDidNotMeet}>Cancel</button>
              <button style={styles.confirmProceedBtn} onClick={confirmDidNotMeet}>Mark as Did Not Meet</button>
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
          input[type="text"]:focus, input[type="text"]:active,
          input[type="text"]:-webkit-autofill, input[type="text"]:-webkit-autofill:hover,
          input[type="text"]:-webkit-autofill:focus, input[type="text"]:-webkit-autofill:active {
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