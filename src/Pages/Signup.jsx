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
  const [loadingMore, setLoadingMore] = useState(false);
  const [invitedSearch, setInvitedSearch] = useState("");
  const [invitedError, setInvitedError] = useState("");
  const [allPeopleCache, setAllPeopleCache] = useState([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPeople, setTotalPeople] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [parallelRequests, setParallelRequests] = useState(0);

  // Helper text logic
  const getHelperText = () => {
    if (errors.invited_by) {
      return errors.invited_by;
    }
    
    if (!cacheLoaded) {
      return "Loading people database...";
    }
    
    if (initialLoadComplete && allPeopleCache.length >= 4000) {
      return `🚀 ${allPeopleCache.length.toLocaleString()}+ people ready for instant search!`;
    }
    
    if (loadingProgress > 0) {
      return `Loading... ${loadingProgress}% (${allPeopleCache.length.toLocaleString()}/${totalPeople.toLocaleString()} people)`;
    }
    
    return `Loading... (${allPeopleCache.length.toLocaleString()}/${totalPeople.toLocaleString()} people)`;
  };

  // Helper text color logic
  const getHelperTextColor = () => {
    if (errors.invited_by) {
      return theme.palette.error.main;
    }
    
    if (initialLoadComplete && allPeopleCache.length >= 4000) {
      return theme.palette.success.main;
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
    console.log("🔍 Local search for:", searchTerm, "in", allPeopleCache.length, "people");

    // Use more efficient search with caching
    const filtered = allPeopleCache.filter(person => {
      const name = `${person.Name || person.name || ''} ${person.Surname || person.surname || ''}`.toLowerCase();
      return name.includes(searchTerm);
    });

    console.log("✅ Local results:", filtered.length);
    setInvitedOptions(filtered.slice(0, 100)); // Limit to 100 for performance
  }, [allPeopleCache]);

  // ULTRA-FAST API SEARCH - Uses new optimized endpoint
  const searchApiPeople = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setInvitedOptions([]);
      return;
    }

    try {
      setLoadingInvited(true);
      setInvitedError("");
      
      console.log("⚡ FAST API search for:", query);
      
      // Use the new FAST endpoint with larger limit
      const res = await axios.get(`${BACKEND_URL}/people/search-fast`, {
        params: { 
          query: query.trim(),
          limit: 200 // Larger limit for better coverage
        },
        timeout: 3000
      });
      
      console.log("✅ FAST API results:", res.data.results?.length || 0);
      setInvitedOptions(res.data.results || []);
      
    } catch (err) {
      console.error("❌ FAST API search failed:", err);
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

  // Load people in parallel for maximum speed
  const loadPeopleParallel = useCallback(async (totalNeeded = 4000) => {
    try {
      console.log(`🚀 Loading ${totalNeeded} people in parallel...`);
      setLoadingInvited(true);
      setLoadingProgress(0);
      
      // First, get total count and initial batch
      const initialRes = await axios.get(`${BACKEND_URL}/people`, {
        params: { 
          perPage: 1000, // Large initial batch
          page: 1
        },
        timeout: 10000
      });
      
      if (!initialRes.data || !Array.isArray(initialRes.data.results)) {
        throw new Error("Invalid response format");
      }
      
      const total = initialRes.data.total || initialRes.data.results.length;
      const totalToLoad = Math.min(total, totalNeeded);
      setTotalPeople(total);
      
      let allPeople = [...initialRes.data.results];
      setAllPeopleCache(allPeople);
      setCacheLoaded(true);
      
      const initialProgress = Math.min(100, Math.round((allPeople.length / totalToLoad) * 100));
      setLoadingProgress(initialProgress);
      
      console.log(`✅ Initial load: ${allPeople.length} people`);
      
      // Calculate how many more pages we need
      const perPage = 1000;
      const totalPages = Math.ceil(totalToLoad / perPage);
      const pagesToLoad = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      
      // Load remaining pages in parallel (up to 4 concurrent requests)
      const concurrentLimit = 4;
      const batches = [];
      
      for (let i = 0; i < pagesToLoad.length; i += concurrentLimit) {
        batches.push(pagesToLoad.slice(i, i + concurrentLimit));
      }
      
      for (const batch of batches) {
        setParallelRequests(batch.length);
        
        const batchPromises = batch.map(page => 
          axios.get(`${BACKEND_URL}/people`, {
            params: { perPage, page },
            timeout: 15000
          }).catch(err => {
            console.error(`❌ Failed to load page ${page}:`, err);
            return { data: { results: [] } }; // Return empty on error
          })
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          if (result.data && Array.isArray(result.data.results)) {
            const newPeople = result.data.results;
            
            // Efficient deduplication
            const existingIds = new Set(allPeople.map(p => p._id));
            const uniqueNewPeople = newPeople.filter(p => !existingIds.has(p._id));
            
            if (uniqueNewPeople.length > 0) {
              allPeople = [...allPeople, ...uniqueNewPeople];
              setAllPeopleCache(allPeople);
              
              const progress = Math.min(100, Math.round((allPeople.length / totalToLoad) * 100));
              setLoadingProgress(progress);
              
              console.log(`✅ Added ${uniqueNewPeople.length} people, total: ${allPeople.length}`);
            }
          }
        }
        
        // Small delay between batches to avoid overwhelming the server
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setInitialLoadComplete(true);
      setHasMore(allPeople.length < total);
      setLoadingProgress(100);
      setParallelRequests(0);
      
      console.log(`🎉 Successfully loaded ${allPeople.length} people!`);
      
    } catch (err) {
      console.error("❌ Parallel load failed:", err);
      // Fallback to sequential loading
      await loadPeopleSequential(4000);
    } finally {
      setLoadingInvited(false);
    }
  }, []);

  // Fallback sequential loading
  const loadPeopleSequential = useCallback(async (totalNeeded = 4000) => {
    try {
      console.log(`🔄 Loading ${totalNeeded} people sequentially...`);
      setLoadingInvited(true);
      setLoadingProgress(0);
      
      let allPeople = [];
      let page = 1;
      const perPage = 1000;
      let total = 0;
      
      while (allPeople.length < totalNeeded) {
        const res = await axios.get(`${BACKEND_URL}/people`, {
          params: { perPage, page },
          timeout: 15000
        });
        
        if (!res.data || !Array.isArray(res.data.results)) {
          break;
        }
        
        if (page === 1) {
          total = res.data.total || res.data.results.length;
          setTotalPeople(total);
          setCacheLoaded(true);
        }
        
        const newPeople = res.data.results;
        if (newPeople.length === 0) break;
        
        // Efficient deduplication
        const existingIds = new Set(allPeople.map(p => p._id));
        const uniqueNewPeople = newPeople.filter(p => !existingIds.has(p._id));
        
        if (uniqueNewPeople.length > 0) {
          allPeople = [...allPeople, ...uniqueNewPeople];
          setAllPeopleCache(allPeople);
          
          const progress = Math.min(100, Math.round((allPeople.length / Math.min(total, totalNeeded)) * 100));
          setLoadingProgress(progress);
          
          console.log(`✅ Page ${page}: ${uniqueNewPeople.length} people, total: ${allPeople.length}`);
        }
        
        if (newPeople.length < perPage) break; // No more pages
        
        page++;
        
        // Small delay between requests
        if (allPeople.length < totalNeeded) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setInitialLoadComplete(true);
      setHasMore(allPeople.length < total);
      setLoadingProgress(100);
      
      console.log(`🎉 Successfully loaded ${allPeople.length} people sequentially!`);
      
    } catch (err) {
      console.error("❌ Sequential load failed:", err);
      setAllPeopleCache([]);
      setCacheLoaded(true);
      setInitialLoadComplete(true);
    } finally {
      setLoadingInvited(false);
    }
  }, []);

  // Load more people progressively (for infinite scroll)
  const loadMorePeople = useCallback(async (page = null) => {
    const targetPage = page || currentPage + 1;
    
    if (loadingMore || !hasMore || allPeopleCache.length >= 10000) return;
    
    try {
      setLoadingMore(true);
      console.log(`📥 Loading more people, page ${targetPage}...`);
      
      const res = await axios.get(`${BACKEND_URL}/people`, {
        params: { 
          perPage: 1000,
          page: targetPage
        },
        timeout: 15000
      });
      
      if (res.data && Array.isArray(res.data.results)) {
        const newPeople = res.data.results;
        
        const existingIds = new Set(allPeopleCache.map(p => p._id));
        const uniqueNewPeople = newPeople.filter(p => !existingIds.has(p._id));
        
        if (uniqueNewPeople.length > 0) {
          setAllPeopleCache(prev => [...prev, ...uniqueNewPeople]);
          console.log(`✅ Added ${uniqueNewPeople.length} more people to cache`);
          
          const totalLoaded = allPeopleCache.length + uniqueNewPeople.length;
          if (totalLoaded >= 4000 && !initialLoadComplete) {
            setInitialLoadComplete(true);
            console.log("🎉 Reached 4000+ people in cache!");
          }
        }
        
        const totalPages = Math.ceil((res.data.total || 0) / 1000);
        setHasMore(targetPage < totalPages);
        setCurrentPage(targetPage);
        
        console.log(`📊 Cache now has ${allPeopleCache.length + uniqueNewPeople.length} people`);
      }
      
    } catch (err) {
      console.error("❌ Failed to load more people:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore, allPeopleCache.length, initialLoadComplete]);

  // Load cache on component mount - 4000 people target
  useEffect(() => {
    const loadMassiveCache = async () => {
      try {
        // Try parallel loading first (fastest)
        await loadPeopleParallel(4000);
      } catch (err) {
        console.error("❌ Massive cache load failed:", err);
      }
    };

    loadMassiveCache();
  }, [loadPeopleParallel]);

  // Load more when user scrolls to bottom (infinite scroll)
  const handleListboxOpen = useCallback(() => {
    if (allPeopleCache.length < 4000 && hasMore && !loadingMore) {
      loadMorePeople();
    }
  }, [allPeopleCache.length, hasMore, loadingMore, loadMorePeople]);

  // COMBINED SEARCH FUNCTION - PRIORITIZE LOCAL, FALLBACK TO API
  const handleInvitedSearch = useCallback((query) => {
    setInvitedSearch(query);
    
    if (!query || query.length < 2) {
      setInvitedOptions([]);
      return;
    }

    if (allPeopleCache.length > 0) {
      searchLocalPeople(query);
      
      // Load more if we have few results and more available
      const localResults = allPeopleCache.filter(person => {
        const name = `${person.Name || ''} ${person.Surname || ''}`.toLowerCase();
        return name.includes(query.toLowerCase());
      });
      
      if (localResults.length < 50 && hasMore && !loadingMore && allPeopleCache.length < 10000) {
        loadMorePeople();
      }
    } else {
      searchApiPeople(query);
    }
  }, [searchLocalPeople, searchApiPeople, allPeopleCache.length, hasMore, loadingMore, loadMorePeople]);

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

  // Custom listbox component for infinite scroll
  const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    const { children, ...other } = props;

    const handleScroll = (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const atBottom = scrollHeight - scrollTop <= clientHeight + 100;
      
      if (atBottom && hasMore && !loadingMore && allPeopleCache.length < 10000) {
        loadMorePeople();
      }
    };

    return (
      <ul 
        {...other} 
        ref={ref}
        onScroll={handleScroll}
        style={{ 
          maxHeight: '300px',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {children}
        {loadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={20} />
            <Typography variant="caption" sx={{ mt: 1 }}>
              Loading more... ({allPeopleCache.length.toLocaleString()}+ loaded)
            </Typography>
          </Box>
        )}
        {!hasMore && allPeopleCache.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              All {totalPeople.toLocaleString()} people loaded ✅
            </Typography>
          </Box>
        )}
        {initialLoadComplete && allPeopleCache.length >= 4000 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
            <Typography variant="caption" color="success.main" fontWeight="bold">
              🚀 {allPeopleCache.length.toLocaleString()}+ people ready for search!
            </Typography>
          </Box>
        )}
      </ul>
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

          {/* Loading Progress Bar */}
          {!initialLoadComplete && cacheLoaded && (
            <Box sx={{ width: '100%', mb: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={loadingProgress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                {parallelRequests > 0 ? `Loading ${parallelRequests} batches in parallel...` : 'Loading people...'} {loadingProgress}%
              </Typography>
            </Box>
          )}

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

            {/* MASSIVE CACHE Autocomplete */}
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
              onOpen={handleListboxOpen}
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
                  placeholder="Type to search from thousands of people..."
                  sx={{
                    ...roundedInput,
                    "& .MuiFormHelperText-root": { 
                      color: getHelperTextColor(),
                      fontSize: '0.75rem',
                      fontWeight: initialLoadComplete && allPeopleCache.length >= 4000 ? 'bold' : 'normal'
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