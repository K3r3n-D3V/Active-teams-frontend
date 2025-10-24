import React, { useState, useContext, useEffect, useCallback } from "react";
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
  Alert,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { LoadingButton } from "@mui/lab";
import { debounce } from "lodash";
import darkLogo from "../assets/active-teams.png";
import { UserContext } from "../contexts/UserContext";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// WelcomeOverlay component (unchanged)
const WelcomeOverlay = ({ name, mode }) => {
  // ... (unchanged)
};

const initialForm = {
  name: "",
  surname: "",
  date_of_birth: "",
  home_address: "",
  title: "",
  invited_by: "",
  phone_number: "",
  email: "",
  gender: "",
  password: "",
  confirm_password: "",
};

const Signup = ({ onSignup, mode, setMode }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { setUserProfile } = useContext(UserContext);
  const { login } = useContext(AuthContext);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Invited By autocomplete states
  const [invitedOptions, setInvitedOptions] = useState([]);
  const [loadingInvited, setLoadingInvited] = useState(false);
  const [allPeopleCache, setAllPeopleCache] = useState([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPeople, setTotalPeople] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [invitedSearch, setInvitedSearch] = useState("");
  const [invitedError, setInvitedError] = useState("");

  // Silent background loading states
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [targetLoadCount] = useState(5000);
  const [maxLoadCount] = useState(8000);

  // Helper text logic - SIMPLIFIED, no loading messages
  const getHelperText = () => {
    if (errors.invited_by) {
      return errors.invited_by;
    }
    return "Type to search people...";
  };

  // Helper text color logic
  const getHelperTextColor = () => {
    if (errors.invited_by) {
      return theme.palette.error.main;
    }
    return theme.palette.text.secondary;
  };

  // FAST LOCAL SEARCH - PRIMARY METHOD
  const searchLocalPeople = useCallback((query) => {
    if (!query || query.length < 2) {
      setInvitedOptions([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();

    // Use efficient search
    const filtered = allPeopleCache.filter(person => {
      const name = `${person.Name || person.name || ''} ${person.Surname || person.surname || ''}`.toLowerCase();
      return name.includes(searchTerm);
    });

    setInvitedOptions(filtered.slice(0, 100)); // Limit to 100 for performance
  }, [allPeopleCache]);

  // ULTRA-FAST API SEARCH - Fallback method
  const searchApiPeople = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setInvitedOptions([]);
      return;
    }

    try {
      setLoadingInvited(true);
      
      const res = await axios.get(`${BACKEND_URL}/people/search-fast`, {
        params: { 
          query: query.trim(),
          limit: 200
        },
        timeout: 3000
      });
      
      setInvitedOptions(res.data.results || []);
      
    } catch (err) {
      // Fallback to local cache
      if (allPeopleCache.length > 0) {
        searchLocalPeople(query);
      } else {
        setInvitedOptions([]);
      }
    } finally {
      setLoadingInvited(false);
    }
  }, [allPeopleCache.length, searchLocalPeople]);

  // SILENT BACKGROUND LOADING - No UI indicators
  const loadPeopleSilently = useCallback(async () => {
    try {
      setBackgroundLoading(true);
      
      let allPeople = [];
      let page = 1;
      const perPage = 1000;
      
      // Load initial 4000 people quickly
      while (allPeople.length < 4000) {
        try {
          const res = await axios.get(`${BACKEND_URL}/people`, {
            params: { perPage, page },
            timeout: 10000
          });
          
          if (!res.data || !Array.isArray(res.data.results) || res.data.results.length === 0) {
            break;
          }
          
          const newPeople = res.data.results;
          
          // Efficient deduplication
          const existingIds = new Set(allPeople.map(p => p._id));
          const uniqueNewPeople = newPeople.filter(p => !existingIds.has(p._id));
          
          if (uniqueNewPeople.length > 0) {
            allPeople = [...allPeople, ...uniqueNewPeople];
            setAllPeopleCache(allPeople);
            setCacheLoaded(true);
          }
          
          if (newPeople.length < perPage) break;
          
          page++;
          
          // Continue loading in background without blocking
          if (allPeople.length < 4000) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          console.error("Silent load error:", err);
          break;
        }
      }
      
      setInitialLoadComplete(true);
      console.log(`🎉 Silently loaded ${allPeople.length} people`);
      
      // Continue loading to 5000 in background
      if (allPeople.length < targetLoadCount) {
        loadTo5000Silently(allPeople, page);
      }
      
    } catch (err) {
      console.error("Silent background load failed:", err);
    } finally {
      setBackgroundLoading(false);
    }
  }, [targetLoadCount]);

  // Continue loading to 5000 completely silently
  const loadTo5000Silently = useCallback(async (currentPeople, startPage) => {
    try {
      let allPeople = [...currentPeople];
      let page = startPage;
      const perPage = 1000;
      
      while (allPeople.length < targetLoadCount) {
        try {
          const res = await axios.get(`${BACKEND_URL}/people`, {
            params: { perPage, page },
            timeout: 15000
          });
          
          if (!res.data || !Array.isArray(res.data.results) || res.data.results.length === 0) {
            break;
          }
          
          const newPeople = res.data.results;
          const existingIds = new Set(allPeople.map(p => p._id));
          const uniqueNewPeople = newPeople.filter(p => !existingIds.has(p._id));
          
          if (uniqueNewPeople.length > 0) {
            allPeople = [...allPeople, ...uniqueNewPeople];
            setAllPeopleCache(allPeople);
          }
          
          if (newPeople.length < perPage) break;
          
          page++;
          
          // Very slow background loading - user won't notice
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (err) {
          console.error("Background load error:", err);
          break;
        }
      }
      
      console.log(`🏆 Background load complete: ${allPeople.length} people`);
      
    } catch (err) {
      console.error("Background loading failed:", err);
    }
  }, [targetLoadCount]);

  // Load even more in background up to 8000
  const loadTo8000Silently = useCallback(async () => {
    if (allPeopleCache.length >= maxLoadCount) return;
    
    try {
      let currentPeople = [...allPeopleCache];
      let page = Math.ceil(currentPeople.length / 1000) + 1;
      
      while (currentPeople.length < maxLoadCount) {
        try {
          const res = await axios.get(`${BACKEND_URL}/people`, {
            params: { 
              perPage: 1000,
              page: page
            },
            timeout: 15000
          });
          
          if (!res.data || !Array.isArray(res.data.results) || res.data.results.length === 0) {
            break;
          }
          
          const newPeople = res.data.results;
          const existingIds = new Set(currentPeople.map(p => p._id));
          const uniqueNewPeople = newPeople.filter(p => !existingIds.has(p._id));
          
          if (uniqueNewPeople.length > 0) {
            currentPeople = [...currentPeople, ...uniqueNewPeople];
            setAllPeopleCache(currentPeople);
          }
          
          if (newPeople.length < 1000) break;
          
          page++;
          
          // Very slow loading - completely invisible to user
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (err) {
          console.error("Extended background load error:", err);
          break;
        }
      }
      
      console.log(`🚀 Extended background load: ${currentPeople.length} people`);
      
    } catch (err) {
      console.error("Extended background loading failed:", err);
    }
  }, [allPeopleCache, maxLoadCount]);

  // Start background loading on component mount
  useEffect(() => {
    const startBackgroundLoading = async () => {
      await loadPeopleSilently();
      
      // Start extended loading after a delay
      setTimeout(() => {
        loadTo8000Silently();
      }, 3000);
    };

    startBackgroundLoading();
  }, [loadPeopleSilently, loadTo8000Silently]);

  // COMBINED SEARCH FUNCTION - PRIORITIZE LOCAL, FALLBACK TO API
  const handleInvitedSearch = useCallback((query) => {
    setInvitedSearch(query);
    
    if (!query || query.length < 2) {
      setInvitedOptions([]);
      return;
    }

    if (allPeopleCache.length > 0) {
      searchLocalPeople(query);
    } else {
      searchApiPeople(query);
    }
  }, [searchLocalPeople, searchApiPeople, allPeopleCache.length]);

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (invitedOptions.length > 0 && !form.invited_by) {
        const firstOption = invitedOptions[0];
        const fullName = `${firstOption.Name || firstOption.name || ""} ${firstOption.Surname || firstOption.surname || ""}`.trim();
        setForm(prev => ({ ...prev, invited_by: fullName }));
        setInvitedSearch(fullName);
      }
    }
  };

  // Render person option with details
  const renderPersonOption = (props, option) => {
    const fullName = `${option.Name || option.name || ""} ${option.Surname || option.surname || ""}`.trim();
    
    return (
      <li {...props} key={option._id || option.id || fullName}>
        <Box>
          <Typography variant="body1" fontWeight="medium">
            {fullName}
          </Typography>
          {option.Email && (
            <Typography variant="caption" color="text.secondary" display="block">
              {option.Email}
            </Typography>
          )}
        </Box>
      </li>
    );
  };

  // SIMPLIFIED Listbox component - no loading indicators
  const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    return (
      <ul 
        {...props} 
        ref={ref}
        style={{ 
          maxHeight: '300px',
          overflow: 'auto'
        }}
      />
    );
  });

  // Rest of the component remains the same...
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleInvitedByChange = (event, newValue) => {
    let invitedByValue = "";
    let searchValue = "";
    
    if (typeof newValue === "string") {
      invitedByValue = newValue;
      searchValue = newValue;
    } else if (newValue) {
      invitedByValue = `${newValue.Name || newValue.name || ""} ${newValue.Surname || newValue.surname || ""}`.trim();
      searchValue = invitedByValue;
    }
    
    setForm(prev => ({ ...prev, invited_by: invitedByValue }));
    setInvitedSearch(searchValue);
    if (errors.invited_by) setErrors(prev => ({ ...prev, invited_by: "" }));
    setInvitedError("");
  };

  const handleInvitedByInputChange = (event, newInputValue) => {
    setInvitedSearch(newInputValue);
    
    if (event && event.type === 'change') {
      handleInvitedSearch(newInputValue);
      setForm(prev => ({ ...prev, invited_by: newInputValue }));
    }
  };

  // Clear options when input is cleared
  useEffect(() => {
    if (!invitedSearch) {
      setInvitedOptions([]);
      setInvitedError("");
    }
  }, [invitedSearch]);

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.surname.trim()) newErrors.surname = "Surname is required";
    if (!form.date_of_birth) newErrors.date_of_birth = "Date of Birth is required";
    else if (new Date(form.date_of_birth) > new Date())
      newErrors.date_of_birth = "Date cannot be in the future";
    if (!form.home_address.trim()) newErrors.home_address = "Home Address is required";
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.invited_by.trim()) newErrors.invited_by = "Invited By is required";
    if (!form.phone_number.trim()) newErrors.phone_number = "Phone Number is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    if (!form.gender) newErrors.gender = "Select a gender";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!form.confirm_password) newErrors.confirm_password = "Confirm your password";
    else if (form.confirm_password !== form.password)
      newErrors.confirm_password = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        alert(data?.detail || "Signup failed. Please try again.");
      } else {
        setUserProfile(submitData);

        try {
          await login(submitData.email, submitData.password);
          sessionStorage.setItem('tempPassword', submitData.password);
          sessionStorage.setItem('showPasswordInProfile', 'true');
        } catch (loginErr) {
          console.error("Auto-login failed:", loginErr);
          navigate("/login");
          return;
        }

        setWelcomeName(submitData.name || submitData.email);
        setShowWelcome(true);
        setTimeout(() => {
          setForm(initialForm);
          setShowWelcome(false);
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Network or server error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Input styles
  const roundedInput = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "15px",
    },
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
            "&:hover": {
              backgroundColor: mode === "dark" ? "#2c2c2c" : "#c0c0c0",
            },
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
            alt="Logo"
            style={{
              maxHeight: isSmallScreen ? 60 : 80,
              maxWidth: "100%",
              objectFit: "contain",
              filter: mode === "dark" ? "invert(1)" : "none",
              transition: "filter 0.3s ease-in-out",
            }}
          />
        </Box>

        <Typography variant="h5" align="center" fontWeight="bold">
          FILL IN YOUR DETAILS
        </Typography>

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          {invitedError && (
            <Alert severity="warning" onClose={() => setInvitedError("")} sx={{ mb: 1 }}>
              {invitedError}
            </Alert>
          )}

          {/* REMOVED ALL LOADING INDICATORS */}

          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2.5}>
            {[
              ["name", "Name"],
              ["surname", "Surname"],
              ["date_of_birth", "Date Of Birth", "date"],
              ["email", "Email Address", "email"],
              ["home_address", "Home Address"],
              ["phone_number", "Phone Number"],
            ].map(([name, label, type]) => (
              <TextField
                key={name}
                label={label}
                name={name}
                type={type || "text"}
                value={form[name]}
                onChange={handleChange}
                error={!!errors[name]}
                helperText={errors[name]}
                fullWidth
                InputLabelProps={type === "date" ? { shrink: true } : undefined}
                sx={{
                  ...roundedInput,
                  "& .MuiFormHelperText-root": { color: theme.palette.error.main },
                }}
              />
            ))}

            <FormControl fullWidth error={!!errors.title}>
              <InputLabel>Title</InputLabel>
              <Select 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                label="Title" 
                sx={roundedInput}
              >
                <MenuItem value=""><em>Select Title</em></MenuItem>
                <MenuItem value="Mr">Mr</MenuItem>
                <MenuItem value="Mrs">Mrs</MenuItem>
                <MenuItem value="Miss">Miss</MenuItem>
                <MenuItem value="Ms">Ms</MenuItem>
                <MenuItem value="Dr">Dr</MenuItem>
                <MenuItem value="Prof">Prof</MenuItem>
                <MenuItem value="Pastor">Pastor</MenuItem>
                <MenuItem value="Bishop">Bishop</MenuItem>
                <MenuItem value="Apostle">Apostle</MenuItem>
              </Select>
              {errors.title && <Typography variant="caption" color="error">{errors.title}</Typography>}
            </FormControl>

            {/* SILENT AUTocomplete - No loading indicators */}
            <Autocomplete
              freeSolo
              options={invitedOptions}
              loading={loadingInvited}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return `${option.Name || option.name || ""} ${option.Surname || option.surname || ""}`.trim();
              }}
              value={form.invited_by}
              onChange={handleInvitedByChange}
              onInputChange={handleInvitedByInputChange}
              inputValue={invitedSearch}
              filterOptions={(x) => x}
              renderOption={renderPersonOption}
              ListboxComponent={ListboxComponent}
              noOptionsText={
                invitedSearch.length < 2 
                  ? "Type 2+ characters to search..." 
                  : "No matching people found"
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invited By *"
                  name="invited_by"
                  error={!!errors.invited_by}
                  helperText={getHelperText()}
                  fullWidth
                  onKeyPress={handleKeyPress}
                  placeholder="Type to search people..."
                  sx={{
                    ...roundedInput,
                    "& .MuiFormHelperText-root": { 
                      color: getHelperTextColor(),
                    },
                  }}
                />
              )}
            />

            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select 
                name="gender" 
                value={form.gender} 
                onChange={handleChange} 
                label="Gender" 
                sx={roundedInput}
              >
                <MenuItem value=""><em>Select Gender</em></MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
              {errors.gender && <Typography variant="caption" color="error">{errors.gender}</Typography>}
            </FormControl>

            <TextField
              label="Password *"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                ),
                sx: roundedInput["& .MuiOutlinedInput-root"]
              }}
              sx={{
                "& .MuiFormHelperText-root": { color: theme.palette.error.main },
              }}
            />

            <TextField
              label="Confirm Password *"
              name="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirm_password}
              onChange={handleChange}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                ),
                sx: roundedInput["& .MuiOutlinedInput-root"]
              }}
              sx={{
                "& .MuiFormHelperText-root": { color: theme.palette.error.main },
              }}
            />
          </Box>

          {Object.keys(errors).length > 0 && (
            <Typography color="error" textAlign="center" mt={1}>
              Please fix the highlighted errors above.
            </Typography>
          )}

          <Box textAlign="center">
            <LoadingButton 
              type="submit" 
              variant="contained" 
              size="large" 
              loading={loading}
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                borderRadius: 8,
                px: 4,
                py: 1.5,
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#222" },
                "&:active": { backgroundColor: "#444" },
                "&.MuiLoadingButton-loading": {
                  backgroundColor: "#333",
                }
              }}
            >
              Sign Up
            </LoadingButton>
          </Box>

          <Box textAlign="center" mt={1}>
            <Typography>
              Already have an account?{" "}
              <Typography
                component="span"
                sx={{ color: "#42a5f5", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate("/login")}
              >
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