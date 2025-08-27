import React, { useState, useContext } from "react";
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
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import darkLogo from "../assets/active-teams.png";
import { UserContext } from "../contexts/UserContext";

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
  confirm_password: "", // Keep confirm_password for validation only
};

const Signup = ({ onSignup, mode, setMode }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { setUserProfile } = useContext(UserContext);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Exclude confirm_password before sending data to backend
    const { confirm_password: _, ...submitData } = form;

    try {
      const res = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.detail || "Signup failed. Please try again.");
      } else {
        // Store user profile data in context
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
        
        alert("User created successfully!");
        if (onSignup) onSignup(submitData);
        setForm(initialForm);
        navigate("/");
      }
    } catch (error) {
      console.error("Signup error:", error);
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
        {/* Logo */}
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
              ["invited_by", "Invited By"],
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
                  "& .MuiOutlinedInput-root": { borderRadius: 3 },
                  "& .MuiFormHelperText-root": { color: theme.palette.error.main },
                }}
              />
            ))}

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
              label="New Password"
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
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 3 },
                "& .MuiFormHelperText-root": { color: theme.palette.error.main },
              }}
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
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 3 },
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
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
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
