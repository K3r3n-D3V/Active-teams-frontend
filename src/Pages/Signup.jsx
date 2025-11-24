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
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import darkLogo from "../assets/active-teams.png";
import { UserContext } from "../contexts/UserContext";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const WelcomeOverlay = ({ name, mode }) => {
  const pieces = Array.from({ length: 90 }).map((_, index) => {
    const left = Math.random() * 100;
    const size = 6 + Math.random() * 8;
    const height = size * (1.4 + Math.random());
    const rotate = Math.random() * 360;
    const dur = 2 + Math.random() * 1.5;
    const delay = Math.random() * 0.6;
    const colors = [
      "#f94144", "#f3722c", "#f8961e", "#f9844a", "#f9c74f",
      "#90be6d", "#43aa8b", "#577590", "#9b5de5", "#00bbf9",
    ];
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
        "@keyframes fall": {
          "0%": { transform: "translate3d(0, -10vh, 0) rotate(0deg)", opacity: 1 },
          "80%": { opacity: 1 },
          "100%": { transform: "translate3d(0, 110vh, 0) rotate(360deg)", opacity: 0.6 },
        },
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
        <Typography variant="body1">
          Your account is ready. Taking you to your dashboard...
        </Typography>
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
  
  const [allPeople, setAllPeople] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cacheLoading, setCacheLoading] = useState(true);
  const [cacheError, setCacheError] = useState("");

  useEffect(() => {
    const fetchAllPeople = async () => {
      try {
        setCacheLoading(true);
        setCacheError("");
        
        const response = await axios.get(`${BACKEND_URL}/cache/people`);
        
        if (response.data.success) {
          const peopleData = response.data.cached_data || [];
          setAllPeople(peopleData);
        } else {
          throw new Error("Failed to load cache");
        }
        
      } catch (err) {
        setCacheError("Failed to load people data. You can still type names manually.");
      } finally {
        setCacheLoading(false);
      }
    };

    fetchAllPeople();
  }, []);

  const filteredPeople = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) {
      return allPeople.slice(0, 100);
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    const results = allPeople.filter(person => {
      const fullName = `${person.Name || ''} ${person.Surname || ''}`.toLowerCase().trim();
      const email = (person.Email || '').toLowerCase();
      const name = (person.Name || '').toLowerCase();
      const surname = (person.Surname || '').toLowerCase();
      
      return fullName.includes(query) || 
             name.includes(query) || 
             email.includes(query) || 
             surname.includes(query);
    });

    results.sort((a, b) => {
      const aFullName = `${a.Name || ''} ${a.Surname || ''}`.toLowerCase().trim();
      const bFullName = `${b.Name || ''} ${b.Surname || ''}`.toLowerCase().trim();
      
      if (aFullName.startsWith(query) && !bFullName.startsWith(query)) return -1;
      if (!aFullName.startsWith(query) && bFullName.startsWith(query)) return 1;
      
      if (aFullName === query && bFullName !== query) return -1;
      if (aFullName !== query && bFullName === query) return 1;
      
      return aFullName.length - bFullName.length;
    });

    return results.slice(0, 50);
  }, [allPeople, searchQuery]);

  const autocompleteOptions = useMemo(() => {
    return filteredPeople.map(person => ({
      ...person,
      label: `${person.Name || ''} ${person.Surname || ''}`.trim() || 'Unknown Name',
      key: person._id || person.key,
    }));
  }, [filteredPeople]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.surname.trim()) newErrors.surname = "Surname is required";
    if (!form.date_of_birth) newErrors.date_of_birth = "Date of Birth is required";
    else if (new Date(form.date_of_birth) > new Date())
      newErrors.date_of_birth = "Date cannot be in the future";
    if (!form.home_address.trim()) newErrors.home_address = "Home Address is required";
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleInvitedByChange = (event, newValue) => {
    const invitedByValue = newValue ? newValue.label : "";
    setForm(prev => ({ ...prev, invited_by: invitedByValue }));
    
    if (errors.invited_by) {
      setErrors(prev => ({ ...prev, invited_by: "" }));
    }
  };

  const handleSearchChange = (event, value) => {
    setSearchQuery(value);
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
        const userData = {
          name: submitData.name,
          surname: submitData.surname,
          date_of_birth: submitData.date_of_birth,
          home_address: submitData.home_address,
          invited_by: submitData.invited_by,
          phone_number: submitData.phone_number,
          email: submitData.email,
          gender: submitData.gender,
        };
        setUserProfile(userData);
        
        if (onSignup) onSignup(submitData);

        try {
          await login(submitData.email, submitData.password);
        } catch (loginErr) {
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
      alert("Network or server error occurred.");
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
            alt="The Active Church Logo"
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

        {cacheError && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {cacheError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={3}
        >
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
                  "& .MuiOutlinedInput-root": { 
                    borderRadius: 3,
                    '& fieldset': {
                      borderColor: errors[name] ? theme.palette.error.main : undefined,
                    },
                  },
                  "& .MuiFormHelperText-root": { 
                    color: errors[name] ? theme.palette.error.main : theme.palette.text.secondary 
                  },
                }}
              />
            ))}

            <Box sx={{ gridColumn: { xs: "1", sm: "1" } }}>
              <Autocomplete
                freeSolo
                options={autocompleteOptions}
                getOptionLabel={(option) => typeof option === "string" ? option : option.label}
                value={autocompleteOptions.find(option => option.label === form.invited_by) || form.invited_by}
                onChange={handleInvitedByChange}
                onInputChange={handleSearchChange}
                filterOptions={(x) => x}
                loading={cacheLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Invited By"
                    name="invited_by"
                    error={!!errors.invited_by}
                    helperText={errors.invited_by || "Start typing to search through all people..."}
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
                    sx={{
                      "& .MuiOutlinedInput-root": { 
                        borderRadius: 3,
                        '& fieldset': {
                          borderColor: errors.invited_by ? theme.palette.error.main : undefined,
                        },
                      },
                      "& .MuiFormHelperText-root": { 
                        color: errors.invited_by ? theme.palette.error.main : theme.palette.text.secondary,
                        mx: 0,
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.key || option._id}>
                    <Box>
                      <Typography variant="body1">
                        {option.label}
                      </Typography>
                      {option.Email && (
                        <Typography variant="caption" color="text.secondary">
                          {option.Email}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                sx={{
                  '& .MuiAutocomplete-inputRoot': {
                    paddingRight: '9px !important',
                  }
                }}
              />
            </Box>

            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                label="Gender"
                sx={{ borderRadius: 3 }}
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
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": { 
                  borderRadius: 3,
                  '& fieldset': {
                    borderColor: errors.password ? theme.palette.error.main : undefined,
                  },
                },
                "& .MuiFormHelperText-root": { 
                  color: errors.password ? theme.palette.error.main : theme.palette.text.secondary 
                },
              }}
            />

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
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": { 
                  borderRadius: 3,
                  '& fieldset': {
                    borderColor: errors.confirm_password ? theme.palette.error.main : undefined,
                  },
                },
                "& .MuiFormHelperText-root": { 
                  color: errors.confirm_password ? theme.palette.error.main : theme.palette.text.secondary 
                },
              }}
            />
          </Box>

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Please fix the highlighted errors above.
            </Alert>
          )}

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
                "&:hover": {
                  backgroundColor: "#222",
                },
                "&:active": {
                  backgroundColor: "#444",
                },
                "&:disabled": {
                  backgroundColor: "#666",
                },
              }}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
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