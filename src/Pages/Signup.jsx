import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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

// ==========================
// WelcomeOverlay (placeholder)
// ==========================
const WelcomeOverlay = ({ name, mode }) => {
  // ... unchanged
};

// ==========================
// Initial Form State
// ==========================
const initialForm = {
  name: "",
  surname: "",
  date_of_birth: "",
  home_address: "",
  invited_by: "",
  phone_number: "",
  email: "",
  gender: "",
  password: "",
  confirm_password: "",
};

// ==========================
// Signup Component
// ==========================
const Signup = ({ onSignup, mode, setMode }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { setUserProfile } = useContext(UserContext);
  const { login } = useContext(AuthContext);

  // ==========================
  // States
  // ==========================
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Invited By Autocomplete
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

  // Abort controller ref for cancelling in-flight search requests
  const searchControllerRef = useRef(null);

  // Background Loading States
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  // We'll first load 8000, then try to load another 8000 (total 16000)
  const [targetLoadCount] = useState(8000);
  const [maxLoadCount] = useState(16000);

  // ==========================
  // Helper Functions
  // ==========================
  const getHelperText = () => {
    if (errors.invited_by) {
      return errors.invited_by;
    }
  };

  const getHelperTextColor = () => {
    if (errors.invited_by) {
      return theme.palette.error.main;
    }
    return theme.palette.text.secondary;
  };

  // ==========================
  // Search Functions
  // ==========================
  const searchLocalPeople = useCallback(
    (query) => {
      if (!query || query.length < 2) {
        setInvitedOptions([]);
        return;
      }
      const searchTerm = query.toLowerCase().trim();
      const filtered = allPeopleCache.filter((person) => {
        const name = `${person.Name || person.name || ""} ${
          person.Surname || person.surname || ""
        }`.toLowerCase();
        return name.includes(searchTerm);
      });
      setInvitedOptions(filtered.slice(0, 100));
    },
    [allPeopleCache]
  );

  const searchApiPeople = useCallback(
    async (query) => {
      if (!query || query.length < 2) {
        setInvitedOptions([]);
        return;
      }
      try {
        setLoadingInvited(true);

        // Cancel previous request if still in-flight
        if (searchControllerRef.current) {
          try {
            searchControllerRef.current.abort();
          } catch (e) {}
        }

        const controller = new AbortController();
        searchControllerRef.current = controller;

        // Ask server for a smaller result set to make responses faster
        const res = await axios.get(`${BACKEND_URL}/people/search-fast`, {
          params: { query: query.trim(), limit: 50 },
          timeout: 2500,
          signal: controller.signal,
        });

        setInvitedOptions(res.data.results || []);
      } catch (err) {
        // If aborted, just ignore. Otherwise fallback to local search if available.
        if (axios.isCancel && axios.isCancel(err)) {
          // cancelled
        } else if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          // axios cancellation
        } else if (allPeopleCache.length > 0) {
          searchLocalPeople(query);
        } else {
          setInvitedOptions([]);
        }
      } finally {
        setLoadingInvited(false);
      }
    },
    [allPeopleCache.length, searchLocalPeople]
  );

  // Debounced version of the API search to avoid too many network calls on fast typing
  const debouncedSearchApi = useMemo(() => debounce(searchApiPeople, 250), [searchApiPeople]);

  // ==========================
  // Background People Loading
  // ==========================
  const loadPeopleSilently = useCallback(async () => {
    try {
      setBackgroundLoading(true);
      let allPeople = [];
      let page = 1;
      const perPage = 10000;

      while (allPeople.length < 10000) {
        try {
          const res = await axios.get(`${BACKEND_URL}/people`, {
            params: { perPage, page },
            timeout: 20000,
          });
          if (
            !res.data ||
            !Array.isArray(res.data.results) ||
            res.data.results.length === 0
          ) {
            break;
          }

          const newPeople = res.data.results;
          const existingIds = new Set(allPeople.map((p) => p._id));
          const uniqueNewPeople = newPeople.filter((p) => !existingIds.has(p._id));

          if (uniqueNewPeople.length > 0) {
            allPeople = [...allPeople, ...uniqueNewPeople];
            setAllPeopleCache(allPeople);
            setCacheLoaded(true);
          }

          if (newPeople.length < perPage) break;
          page++;

          if (allPeople.length < 10000) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (err) {
          console.error("Silent load error:", err);
          break;
        }
      }

      setInitialLoadComplete(true);
      console.log(`🎉 Silently loaded ${allPeople.length} people`);

      if (allPeople.length < targetLoadCount) {
        loadToTargetSilently(allPeople, page);
      }
    } catch (err) {
      console.error("Silent background load failed:", err);
    } finally {
      setBackgroundLoading(false);
    }
  }, [targetLoadCount]);

  const loadToTargetSilently = useCallback(
    async (currentPeople, startPage) => {
      try {
        let allPeople = [...currentPeople];
        let page = startPage;
        const perPage = 3000;

        while (allPeople.length < targetLoadCount) {
          try {
            const res = await axios.get(`${BACKEND_URL}/people`, {
              params: { perPage, page },
              timeout: 15000,
            });

            if (
              !res.data ||
              !Array.isArray(res.data.results) ||
              res.data.results.length === 0
            ) {
              break;
            }

            const newPeople = res.data.results;
            const existingIds = new Set(allPeople.map((p) => p._id));
            const uniqueNewPeople = newPeople.filter((p) => !existingIds.has(p._id));

            if (uniqueNewPeople.length > 0) {
              allPeople = [...allPeople, ...uniqueNewPeople];
              setAllPeopleCache(allPeople);
            }

            if (newPeople.length < perPage) break;
            page++;
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (err) {
            console.error("Background load error:", err);
            break;
          }
        }

        console.log(`🏆 Background load complete (target): ${allPeople.length} people`);

        // After reaching target, attempt to extend to max
        if (allPeople.length >= targetLoadCount && allPeople.length < maxLoadCount) {
          // start next phase from next page
          const nextPage = page;
          setTimeout(() => {
            loadToMaxSilently();
          }, 1000);
        }
      } catch (err) {
        console.error("Background loading failed:", err);
      }
    },
    [targetLoadCount, maxLoadCount]
  );

  const loadToMaxSilently = useCallback(async () => {
    if (allPeopleCache.length >= maxLoadCount) return;
    try {
      let currentPeople = [...allPeopleCache];
      let page = Math.ceil(currentPeople.length / 1000) + 1;

      while (currentPeople.length < maxLoadCount) {
        try {
          const res = await axios.get(`${BACKEND_URL}/people`, {
            params: { perPage: 3000, page },
            timeout: 15000,
          });

          if (
            !res.data ||
            !Array.isArray(res.data.results) ||
            res.data.results.length === 0
          ) {
            break;
          }

          const newPeople = res.data.results;
          const existingIds = new Set(currentPeople.map((p) => p._id));
          const uniqueNewPeople = newPeople.filter((p) => !existingIds.has(p._id));

          if (uniqueNewPeople.length > 0) {
            currentPeople = [...currentPeople, ...uniqueNewPeople];
            setAllPeopleCache(currentPeople);
          }

          if (newPeople.length < 1000) break;
          page++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
          console.error("Extended background load error:", err);
          break;
        }
      }

      console.log(`🚀 Extended background load (max): ${currentPeople.length} people`);
      // After finishing max load, if we still haven't reached max but can, start another batch
      if (currentPeople.length < maxLoadCount) {
        // nothing more to do - server returned less than requested
      } else if (currentPeople.length >= maxLoadCount && maxLoadCount < Number.MAX_SAFE_INTEGER) {
        // Now attempt another batch of maxLoadCount (another 8000)
        // Increase maxLoadCount by targetLoadCount to allow another phase
        // Note: because maxLoadCount is state and not writable here, we'll trigger another run manually
        console.log("Starting next batch to load another set up to maxLoadCount (phase 2)");
        // Attempt another run to add up to maxLoadCount more by calling this function again
        // We'll effectively try to fetch until we reach (2 * maxLoadCount) overall.
        // For clarity, call anotherRoundLoad which will attempt similar behavior.
        await (async function anotherRoundLoad() {
          let morePeople = [...currentPeople];
          let page2 = page;
          const targetSecondPhase = maxLoadCount * 2;
          while (morePeople.length < targetSecondPhase) {
            try {
              const res2 = await axios.get(`${BACKEND_URL}/people`, {
                params: { perPage: 3000, page: page2 },
                timeout: 15000,
              });
              if (!res2.data || !Array.isArray(res2.data.results) || res2.data.results.length === 0) break;
              const newP = res2.data.results;
              const existingIds2 = new Set(morePeople.map((p) => p._id));
              const uniqueNew = newP.filter((p) => !existingIds2.has(p._id));
              if (uniqueNew.length > 0) {
                morePeople = [...morePeople, ...uniqueNew];
                setAllPeopleCache(morePeople);
              }
              if (newP.length < 3000) break;
              page2++;
              await new Promise((resolve) => setTimeout(resolve, 1500));
            } catch (err) {
              console.error("Second phase load error:", err);
              break;
            }
          }
          console.log(`🎯 Second batch complete: ${morePeople.length} people`);
        })();
      }
    } catch (err) {
      console.error("Extended background loading failed:", err);
    }
  }, [allPeopleCache, maxLoadCount]);

  // ==========================
  // useEffect - Load people silently
  // ==========================
  useEffect(() => {
    const startBackgroundLoading = async () => {
      await loadPeopleSilently();
      setTimeout(() => {
        // call the renamed loader that extends the cache to the configured max
        loadToMaxSilently();
      }, 3000);
    };
    startBackgroundLoading();
  }, [loadPeopleSilently, loadToMaxSilently]);

  // ==========================
  // Autocomplete Handlers
  // ==========================
  const handleInvitedSearch = useCallback(
    (query) => {
      setInvitedSearch(query);
      if (!query || query.length < 2) {
        setInvitedOptions([]);
        return;
      }
      if (allPeopleCache.length > 0) {
        // very fast local filtering
        searchLocalPeople(query);
      } else {
        // debounce network calls
        debouncedSearchApi(query);
      }
    },
    [searchLocalPeople, searchApiPeople, allPeopleCache.length]
  );

  const handleInvitedByChange = (event, newValue) => {
    let invitedByValue = "";
    let searchValue = "";

    if (typeof newValue === "string") {
      invitedByValue = newValue;
      searchValue = newValue;
    } else if (newValue) {
      invitedByValue = `${newValue.Name || newValue.name || ""} ${
        newValue.Surname || newValue.surname || ""
      }`.trim();
      searchValue = invitedByValue;
    }

    setForm((prev) => ({ ...prev, invited_by: invitedByValue }));
    setInvitedSearch(searchValue);
    if (errors.invited_by) setErrors((prev) => ({ ...prev, invited_by: "" }));
    setInvitedError("");
  };

  const handleInvitedByInputChange = (event, newInputValue) => {
    setInvitedSearch(newInputValue);
    if (event && event.type === "change") {
      handleInvitedSearch(newInputValue);
      setForm((prev) => ({ ...prev, invited_by: newInputValue }));
    }
  };

  // Cancel any in-flight search requests and debounced calls on unmount
  useEffect(() => {
    return () => {
      if (searchControllerRef.current) {
        try {
          searchControllerRef.current.abort();
        } catch (e) {}
      }
      if (debouncedSearchApi && debouncedSearchApi.cancel) debouncedSearchApi.cancel();
    };
  }, [debouncedSearchApi]);

  // Clear options when input is cleared
  useEffect(() => {
    if (!invitedSearch) {
      setInvitedOptions([]);
      setInvitedError("");
    }
  }, [invitedSearch]);

  // ==========================
  // Form Handling
  // ==========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.surname.trim()) newErrors.surname = "Surname is required";
    if (!form.date_of_birth)
      newErrors.date_of_birth = "Date of Birth is required";
    else if (new Date(form.date_of_birth) > new Date())
      newErrors.date_of_birth = "Date cannot be in the future";
    if (!form.home_address.trim())
      newErrors.home_address = "Home Address is required";
    if (!form.invited_by.trim()) newErrors.invited_by = "Invited By is required";
    if (!form.phone_number.trim())
      newErrors.phone_number = "Phone Number is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email";
    if (!form.gender) newErrors.gender = "Select a gender";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!form.confirm_password)
      newErrors.confirm_password = "Confirm your password";
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
          sessionStorage.setItem("tempPassword", submitData.password);
          sessionStorage.setItem("showPasswordInProfile", "true");
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

  // ==========================
  // UI Styles
  // ==========================
  const roundedInput = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "15px",
    },
  };

  // ==========================
  // Render
  // ==========================
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

      {/* Theme Toggle */}
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

      {/* Signup Form */}
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

        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          {invitedError && (
            <Alert
              severity="warning"
              onClose={() => setInvitedError("")}
              sx={{ mb: 1 }}
            >
              {invitedError}
            </Alert>
          )}

          {/* Input Fields */}
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
            gap={2.5}
          >
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
                  "& .MuiFormHelperText-root": {
                    color: theme.palette.error.main,
                  },
                }}
              />
            ))}

            {/* Invited By Autocomplete */}
            <Autocomplete
              freeSolo
              options={invitedOptions}
              loading={loadingInvited}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option;
                return `${option.Name || option.name || ""} ${
                  option.Surname || option.surname || ""
                }`.trim();
              }}
              value={form.invited_by}
              onChange={handleInvitedByChange}
              onInputChange={handleInvitedByInputChange}
              inputValue={invitedSearch}
              filterOptions={(x) => x}
              renderOption={(props, option) => {
                const fullName = `${option.Name || option.name || ""} ${
                  option.Surname || option.surname || ""
                }`.trim();
                return (
                  <li {...props} key={option._id || option.id || fullName}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {fullName}
                      </Typography>
                      {option.Email && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {option.Email}
                        </Typography>
                      )}
                    </Box>
                  </li>
                );
              }}
              ListboxProps={{ style: { maxHeight: "300px", overflow: "auto" } }}
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

            {/* Gender Select */}
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                label="Gender"
                sx={{ borderRadius: "15px" }}
              >
                <MenuItem value="">
                  <em>Select Gender</em>
                </MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
              {errors.gender && (
                <Typography variant="caption" color="error">
                  {errors.gender}
                </Typography>
              )}
            </FormControl>

            {/* Password Fields */}
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
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                ),
              }}
              sx={{
                "& .MuiFormHelperText-root": {
                  color: theme.palette.error.main,
                },
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
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                ),
              }}
              sx={{
                "& .MuiFormHelperText-root": {
                  color: theme.palette.error.main,
                },
              }}
            />
          </Box>

          {/* Error Summary */}
          {Object.keys(errors).length > 0 && (
            <Typography color="error" textAlign="center" mt={1}>
              Please fix the highlighted errors above.
            </Typography>
          )}

          {/* Submit */}
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
                "&.MuiLoadingButton-loading": { backgroundColor: "#333" },
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
                sx={{
                  color: "#42a5f5",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
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
