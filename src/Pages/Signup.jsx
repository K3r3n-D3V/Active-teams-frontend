import React, { useState } from "react";
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
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

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
  const navigate = useNavigate();
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
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.confirm_password) newErrors.confirm_password = "Confirm your password";
    else if (form.confirm_password !== form.password) newErrors.confirm_password = "Passwords do not match";
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
  try {
    const res = await fetch("http://localhost:8000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      // Show error from backend or fallback message
      alert(data?.detail || "Signup failed. Please try again.");
    } else {
      alert("User created successfully!");
      if (onSignup) onSignup(form); // Optional callback
      setForm(initialForm);
      navigate("/login"); // redirect after success
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
      {/* Dark/Light Toggle (Same as Sidebar) */}
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
        <Typography variant="h4" align="center" fontWeight="bold">
          FILL IN YOUR DETAILS
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          display="grid"
          gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
          gap={2}
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
              sx={{ borderRadius: 3, "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
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
                <IconButton onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              ),
            }}
            sx={{ borderRadius: 3, "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
          />

          <TextField
            label="Confirm New Password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            value={form.confirm_password}
            onChange={handleChange}
            error={!!errors.confirm_password}
            helperText={errors.confirm_password}
            fullWidth
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              ),
            }}
            sx={{ borderRadius: 3, "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
          />
        </Box>

        <Box textAlign="center" mt={2}>
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
              color="primary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/login")}
            >
              Log In
            </Typography>
          </Typography>
        </Box>
      </Box>
    </Box>  
  );
};

export default Signup;
