import React, { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Autocomplete,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import darkLogo from "../assets/active-teams.png";
import { UserContext } from "../contexts/UserContext";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const GEOAPIFY_COUNTRY_CODE = "za";

const WelcomeOverlay = ({ name, mode }) => {
  const pieces = Array.from({ length: 90 }).map((_, index) => {
    const left = Math.random() * 100;
    const size = 6 + Math.random() * 8;
    const height = size * (1.4 + Math.random());
    const rotate = Math.random() * 360;
    const dur = 2 + Math.random() * 1.5;
    const delay = Math.random() * 0.6;
    const colors = ["#f94144","#f3722c","#f8961e","#f9844a","#f9c74f","#90be6d","#43aa8b","#577590","#9b5de5","#00bbf9"];
    const backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const borderRadius = Math.random() > 0.6 ? `${size / 2}px` : "2px";
    return (
      <Box
        key={index}
        sx={{
          position: "absolute",
          top: -20,
          left: `${left}%`,
          width: `${size}px`,
          height: `${height}px`,
          backgroundColor,
          borderRadius,
          opacity: 0.95,
          transform: `rotate(${rotate}deg)`,
          animation: `fall ${dur}s linear ${delay}s 1`,
        }}
      />
    );
  });

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: mode === "dark" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
        backdropFilter: "blur(2px)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{pieces}</Box>
      <Box
        sx={{
          position: "relative",
          px: 4,
          py: 3,
          borderRadius: 4,
          boxShadow: 6,
          textAlign: "center",
          backgroundColor: mode === "dark" ? "#121212" : "#ffffff",
          color: mode === "dark" ? "#fff" : "#111",
          border: mode === "dark" ? "1px solid #2a2a2a" : "1px solid #eaeaea",
          minWidth: 280,
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Welcome{name ? ", " : ""}{name || "Friend"}!
        </Typography>
        <Typography variant="body1">Your account is ready. Taking you to your dashboard...</Typography>
      </Box>
    </Box>
  );
};

const initialForm = {
  name: "",
  surname: "",
  date_of_birth: "",
  home_address: "",
  invited_by: "",
  invited_by_id: "",
  leader: "",
  phone_number: "",
  email: "",
  gender: "",
  password: "",
  confirm_password: "",
  organization: "",
};

const Signup = ({ onSignup, mode, setMode }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { setUserProfile } = useContext(UserContext);
  const { login } = useContext(AuthContext);

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const isDark = mode === "dark";

  const toastOptions = {
    position: "top-center",
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: isDark ? "dark" : "light",
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // People Cache for Invited By
  const [allPeople, setAllPeople] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cacheLoading, setCacheLoading] = useState(true);
  const [cacheError, setCacheError] = useState("");

  // Organizations & Address
  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsError, setOrgsError] = useState("");
  const [addressOptions, setAddressOptions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [biasLonLat, setBiasLonLat] = useState(null);

  // Fetch Organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      setOrgsLoading(true);
      setOrgsError("");
      try {
        const response = await fetch(`${BACKEND_URL}/organizations`);
        if (!response.ok) throw new Error("Failed to fetch organizations");
        const data = await response.json();
        setOrganizations(data.success && Array.isArray(data.organizations) ? data.organizations : []);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrgsError("Could not load organizations. You can still type manually.");
        setOrganizations([]);
      } finally {
        setOrgsLoading(false);
      }
    };
    fetchOrganizations();
  }, [BACKEND_URL]);

  // Fetch People from Cache (Public Endpoint)
  useEffect(() => {
    const fetchAllPeople = async () => {
      try {
        setCacheLoading(true);
        setCacheError("");
        const response = await axios.get(`${BACKEND_URL}/cache/people`);
        if (response.data.success) {
          setAllPeople(response.data.cached_data || []);
        } else {
          throw new Error("Failed to load cache");
        }
      } catch (err) {
        console.error("Cache fetch error:", err);
        toast.error("Failed to load people data. You can still type names manually.", {
          ...toastOptions,
          autoClose: 5000,
        });
        setCacheError("Failed to load people data. You can still type names manually.");
      } finally {
        setCacheLoading(false);
      }
    };
    fetchAllPeople();
  }, [BACKEND_URL]);

  // Geoapify Address Autocomplete
  useEffect(() => {
    if (!GEOAPIFY_API_KEY) {
      setAddressError("Geoapify API key is missing.");
      return;
    }
    const query = (form.home_address || "").trim();
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
          ? `&bias=proximity:${encodeURIComponent(biasLonLat.lon)},${encodeURIComponent(biasLonLat.lat)}`
          : "";
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=10&lang=en&filter=countrycode:${encodeURIComponent(GEOAPIFY_COUNTRY_CODE)}${biasParam}&format=json&apiKey=${encodeURIComponent(GEOAPIFY_API_KEY)}`;
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
        setAddressError("Could not load address suggestions. Please type manually.");
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
  }, [form.home_address, biasLonLat]);

  // Filter People for Autocomplete
  const filteredPeople = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return allPeople.slice(0, 100);
    const query = searchQuery.toLowerCase().trim();
    return allPeople
      .filter((person) => {
        const fullName = `${person.Name || ""} ${person.Surname || ""}`.toLowerCase().trim();
        const email = (person.Email || "").toLowerCase();
        return fullName.includes(query) || email.includes(query);
      })
      .sort((a, b) => {
        const aName = `${a.Name || ""} ${a.Surname || ""}`.toLowerCase().trim();
        const bName = `${b.Name || ""} ${b.Surname || ""}`.toLowerCase().trim();
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (!aName.startsWith(query) && bName.startsWith(query)) return 1;
        return aName.length - bName.length;
      })
      .slice(0, 50);
  }, [allPeople, searchQuery]);

  const autocompleteOptions = useMemo(() => {
    return filteredPeople.map((person) => ({
      ...person,
      label: `${person.Name || ""} ${person.Surname || ""}`.trim() || "Unknown Name",
      key: person._id || person.key,
    }));
  }, [filteredPeople]);

  const inputFieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: isDark ? "#1a1a1a" : "#f8f9fa",
      borderRadius: 3,
      "& fieldset": { borderColor: isDark ? "#333333" : "#e0e0e0" },
      "&:hover fieldset": { borderColor: isDark ? "#555555" : "#b0b0b0" },
      "&.Mui-focused fieldset": { borderColor: "#42a5f5" },
    },
    "& .MuiInputBase-input": {
      color: isDark ? "#ffffff" : "#000000",
      "&:-webkit-autofill": {
        WebkitBoxShadow: isDark ? "0 0 0 100px #1a1a1a inset !important" : "0 0 0 100px #f8f9fa inset !important",
        WebkitTextFillColor: isDark ? "#ffffff !important" : "#000000 !important",
      },
    },
    "& .MuiInputLabel-root": {
      color: isDark ? "#999999" : "#666666",
      "&.Mui-focused": { color: "#42a5f5" },
    },
    "& .MuiFormHelperText-root": {
      color: isDark ? "#999999" : "#666666",
    },
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = "Name is required";
    if (!form.surname?.trim()) newErrors.surname = "Surname is required";
    if (!form.date_of_birth) newErrors.date_of_birth = "Date of Birth is required";
    else if (new Date(form.date_of_birth) > new Date()) newErrors.date_of_birth = "Date cannot be in the future";
    if (!form.home_address?.trim()) newErrors.home_address = "Home Address is required";
    if (!form.phone_number?.trim()) newErrors.phone_number = "Phone Number is required";
    if (!form.email?.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    if (!form.gender) newErrors.gender = "Select a gender";
    if (!form.organization?.trim()) newErrors.organization = "Organization/Church is required";
    if (!form.invited_by?.trim()) newErrors.invited_by = "Invited by is required";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.confirm_password) newErrors.confirm_password = "Confirm your password";
    else if (form.confirm_password !== form.password) newErrors.confirm_password = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleInvitedByChange = (event, newValue) => {
    const invitedByValue = newValue && typeof newValue === "object" ? (newValue.label || "") : (newValue || "");
    const invitedById = newValue && typeof newValue === "object" ? (newValue._id || newValue.key || "") : "";
    setForm((prev) => ({ ...prev, invited_by: invitedByValue, invited_by_id: invitedById }));
    if (errors.invited_by) setErrors((prev) => ({ ...prev, invited_by: "" }));
  };

  const handleSearchChange = (event, value, reason) => {
    setSearchQuery(value);
    if (reason === "input") {
      setForm((prev) => ({ ...prev, invited_by: value || "", invited_by_id: "" }));
      if (errors.invited_by) setErrors((prev) => ({ ...prev, invited_by: "" }));
    }
  };

  const handleGenderChange = (e) => {
    const genderVal = e.target.value;
    setForm((prev) => ({ ...prev, gender: genderVal }));
    if (errors.gender) setErrors((prev) => ({ ...prev, gender: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const submitData = { ...form };
    delete submitData.confirm_password;
    try {
      const res = await fetch(`${BACKEND_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.detail || "Signup failed. Please try again.", toastOptions);
      } else {
        const userData = {
          name: submitData.name,
          surname: submitData.surname,
          date_of_birth: submitData.date_of_birth,
          home_address: submitData.home_address,
          phone_number: submitData.phone_number,
          email: submitData.email,
          gender: submitData.gender,
          organization: submitData.organization,
          invited_by:submitData.invited_by,
        };
        setUserProfile(userData);
        if (onSignup) onSignup(submitData);
        try {
          await login(submitData.email, submitData.password);
          toast.success("You've been signed up!", toastOptions);
        } catch (loginErr) {
          toast.error("Signup successful, but automatic login failed. Please log in.", { ...toastOptions, autoClose: 5000 });
          navigate("/login");
          return;
        }
        setWelcomeName(submitData.name || submitData.email);
        setShowWelcome(true);
        setTimeout(() => {
          setForm(initialForm);
          setShowWelcome(false);
          setSelectedAddress(null);
          setAddressOptions([]);
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      toast.error("Network or server error occurred.", toastOptions);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        background: theme.palette.background.default,
        color: theme.palette.text.primary,
        p: 2,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ToastContainer limit={1} containerStyle={{ zIndex: 99999 }} />
      {showWelcome && <WelcomeOverlay name={welcomeName} mode={mode} />}

      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <IconButton
          onClick={() => {
            const next = mode === "light" ? "dark" : "light";
            localStorage.setItem("themeMode", next);
            setMode(next);
          }}
          sx={{
            color: mode === "dark" ? "#fff" : "#000",
            backgroundColor: mode === "dark" ? "#1f1f1f" : "#e0e0e0",
            "&:hover": { backgroundColor: mode === "dark" ? "#2c2c2c" : "#c0c0c0" },
          }}
        >
          {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>

      <Box
        sx={{
          maxWidth: 800,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          p: 3,
          borderRadius: 4,
          boxShadow: 3,
          background: theme.palette.background.paper,
        }}
      >
        <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
          <img
            src={darkLogo}
            alt="The Active Church Logo"
            style={{
              maxHeight: isSmallScreen ? 60 : 80,
              maxWidth: "100%",
              objectFit: "contain",
              filter: mode === "dark" ? "invert(1)" : "none",
            }}
          />
        </Box>

        <Typography variant="h5" align="center" fontWeight="bold">
          FILL IN YOUR DETAILS
        </Typography>

        {cacheError && <Alert severity="warning" sx={{ borderRadius: 2 }}>{cacheError}</Alert>}

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2.5}>
            {/* Name */}
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} error={!!errors.name} helperText={errors.name} fullWidth sx={inputFieldSx} />

            {/* Surname */}
            <TextField label="Surname" name="surname" value={form.surname} onChange={handleChange} error={!!errors.surname} helperText={errors.surname} fullWidth sx={inputFieldSx} />

            {/* Date of Birth */}
            <TextField label="Date Of Birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} error={!!errors.date_of_birth} helperText={errors.date_of_birth} fullWidth InputLabelProps={{ shrink: true }} sx={inputFieldSx} />

            {/* Email */}
            <TextField label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} fullWidth sx={inputFieldSx} />

            {/* Home Address */}
            <Box sx={{ gridColumn: { xs: "1", sm: "1" } }}>
              <Autocomplete
                freeSolo
                options={addressOptions}
                value={selectedAddress}
                inputValue={form.home_address}
                onInputChange={(event, newInputValue) => {
                  setForm((prev) => ({ ...prev, home_address: newInputValue }));
                  setSelectedAddress(null);
                  if (errors.home_address) setErrors((prev) => ({ ...prev, home_address: "" }));
                }}
                onChange={(event, newValue) => {
                  const formatted = typeof newValue === "string" ? newValue : newValue?.formatted || newValue?.label || "";
                  setSelectedAddress(typeof newValue === "string" ? null : newValue);
                  setForm((prev) => ({ ...prev, home_address: formatted }));
                  if (errors.home_address) setErrors((prev) => ({ ...prev, home_address: "" }));
                }}
                getOptionLabel={(option) => (typeof option === "string" ? option : option.label || "")}
                filterOptions={(x) => x}
                loading={addressLoading}
                ListboxProps={{ sx: { bgcolor: isDark ? "#1a1a1a" : "#ffffff", "& .MuiAutocomplete-option": { color: isDark ? "#ffffff" : "#000000", "&:hover": { bgcolor: isDark ? "#2a2a2a" : "#f5f5f5" } } } }}
                PaperComponent={({ children }) => <Paper sx={{ bgcolor: isDark ? "#1a1a1a" : "#ffffff", border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}` }}>{children}</Paper>}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Home Address"
                    name="home_address"
                    error={!!errors.home_address}
                    helperText={errors.home_address || addressError || (GEOAPIFY_API_KEY ? "Start typing your address..." : "Missing Geoapify API key.")}
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {addressLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={inputFieldSx}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={`${option.lon ?? ""}-${option.lat ?? ""}-${option.label}`}>
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      {(option.suburb || option.city || option.state || option.postcode) && (
                        <Typography variant="caption" color="text.secondary">
                          {[option.suburb, option.city, option.state, option.postcode].filter(Boolean).join(" • ")}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
              />
            </Box>

            {/* Phone Number */}
            <TextField label="Phone Number" name="phone_number" type="text" value={form.phone_number} onChange={handleChange} error={!!errors.phone_number} helperText={errors.phone_number} fullWidth sx={inputFieldSx} />

            {/* Invited By - Full Cache Search */}
            <Box sx={{ gridColumn: { xs: "1", sm: "1" } }}>
              <Autocomplete
                freeSolo
                options={autocompleteOptions}
                getOptionLabel={(option) => (typeof option === "string" ? option : option.label || "")}
                value={autocompleteOptions.find((opt) => opt.label === form.invited_by) || form.invited_by || null}
                onChange={handleInvitedByChange}
                onInputChange={handleSearchChange}
                filterOptions={(x) => x}
                loading={cacheLoading}
                ListboxProps={{
                  sx: {
                    bgcolor: isDark ? "#1a1a1a" : "#ffffff",
                    "& .MuiAutocomplete-option": {
                      color: isDark ? "#ffffff" : "#000000",
                      "&:hover": { bgcolor: isDark ? "#2a2a2a" : "#f5f5f5" },
                      "&[aria-selected='true']": { bgcolor: isDark ? "#333333" : "#e0e0e0", "&:hover": { bgcolor: isDark ? "#3a3a3a" : "#d5d5d5" } },
                    },
                  },
                }}
                PaperComponent={({ children }) => (
                  <Paper sx={{ bgcolor: isDark ? "#1a1a1a" : "#ffffff", border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}` }}>
                    {children}
                  </Paper>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Invited By"
                    name="invited_by"
                    error={!!errors.invited_by}
                    helperText={errors.invited_by || cacheError || "Start typing to search through all people..."}
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {cacheLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={inputFieldSx}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.key || option._id}>
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      {option.Email && <Typography variant="caption" color="text.secondary">{option.Email}</Typography>}
                    </Box>
                  </li>
                )}
              />
            </Box>

            {/* Gender */}
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel sx={{ color: isDark ? "#999999" : "#666666", "&.Mui-focused": { color: "#42a5f5" } }}>Gender</InputLabel>
              <Select name="gender" value={form.gender} onChange={handleGenderChange} label="Gender" sx={{ bgcolor: isDark ? "#1a1a1a" : "#f8f9fa", borderRadius: 3, color: isDark ? "#ffffff" : "#000000", "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "#333333" : "#e0e0e0" } }}>
                <MenuItem value=""><em>Select Gender</em></MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
              {errors.gender && <Typography variant="caption" color="error">{errors.gender}</Typography>}
            </FormControl>

            {/* Organization */}
            <FormControl fullWidth error={!!errors.organization}>
              <Autocomplete
                freeSolo
                options={organizations}
                value={organizations.find((org) => org.name === form.organization) || null}
                inputValue={form.organization}
                onInputChange={(event, newInputValue) => {
                  setForm((prev) => ({ ...prev, organization: newInputValue }));
                  if (errors.organization) setErrors((prev) => ({ ...prev, organization: "" }));
                }}
                onChange={(event, newValue) => {
                  const orgName = newValue?.name || newValue || "";
                  setForm((prev) => ({ ...prev, organization: orgName }));
                  if (errors.organization) setErrors((prev) => ({ ...prev, organization: "" }));
                }}
                getOptionLabel={(option) => (typeof option === "string" ? option : option.name || "")}
                loading={orgsLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Organization / Church"
                    error={!!errors.organization}
                    helperText={errors.organization || orgsError || (orgsLoading ? "Loading organizations..." : "Select or type your organization")}
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {orgsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={inputFieldSx}
                  />
                )}
                ListboxProps={{ sx: { bgcolor: isDark ? "#1a1a1a" : "#ffffff", "& .MuiAutocomplete-option": { color: isDark ? "#ffffff" : "#000000", "&:hover": { bgcolor: isDark ? "#2a2a2a" : "#f5f5f5" } } } }}
                PaperComponent={({ children }) => <Paper sx={{ bgcolor: isDark ? "#1a1a1a" : "#ffffff", border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}` }}>{children}</Paper>}
              />
            </FormControl>

            {/* Password */}
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: isDark ? "#cccccc" : "#666666" }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputFieldSx}
            />

            {/* Confirm Password */}
            <TextField
              label="Confirm Password"
              name="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirm_password}
              onChange={handleChange}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" sx={{ color: isDark ? "#cccccc" : "#666666" }}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputFieldSx}
            />
          </Box>

          {Object.keys(errors).length > 0 && <Alert severity="error" sx={{ borderRadius: 2 }}>Please fix the highlighted errors above.</Alert>}

          <Box textAlign="center">
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || cacheLoading}
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                borderRadius: 8,
                px: 4,
                py: 1.5,
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#222" },
              }}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
          </Box>

          <Box textAlign="center" mt={1}>
            <Typography>
              Already have an account?{" "}
              <Typography component="span" sx={{ color: "#42a5f5", cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/login")}>
                Log In
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Signup;