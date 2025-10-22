// import React, { useState, useContext, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   TextField,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Button,
//   Typography,
//   IconButton,
//   useTheme,
//   useMediaQuery,
//   Autocomplete,
// } from "@mui/material";
// import Visibility from "@mui/icons-material/Visibility";
// import VisibilityOff from "@mui/icons-material/VisibilityOff";
// import Brightness4Icon from "@mui/icons-material/Brightness4";
// import Brightness7Icon from "@mui/icons-material/Brightness7";
// import darkLogo from "../assets/active-teams.png";
// import { UserContext } from "../contexts/UserContext";
// import { AuthContext } from "../contexts/AuthContext";
// import axios from "axios";

// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// // WelcomeOverlay component remains the same
// const WelcomeOverlay = ({ name, mode }) => {
//   const pieces = Array.from({ length: 90 }).map((_, index) => {
//     const left = Math.random() * 100;
//     const size = 6 + Math.random() * 8;
//     const height = size * (1.4 + Math.random());
//     const rotate = Math.random() * 360;
//     const dur = 2 + Math.random() * 1.5;
//     const delay = Math.random() * 0.6;
//     const colors = [
//       "#f94144", "#f3722c", "#f8961e", "#f9844a", "#f9c74f",
//       "#90be6d", "#43aa8b", "#577590", "#9b5de5", "#00bbf9",
//     ];
//     const backgroundColor = colors[Math.floor(Math.random() * colors.length)];
//     const borderRadius = Math.random() > 0.6 ? `${size / 2}px` : "2px";

//     return (
//       <Box
//         key={index}
//         sx={{
//           position: "absolute",
//           top: -20,
//           left: `${left}%`,
//           width: `${size}px`,
//           height: `${height}px`,
//           backgroundColor,
//           borderRadius,
//           opacity: 0.95,
//           transform: `rotate(${rotate}deg)`,
//           animation: `fall ${dur}s linear ${delay}s 1`,
//         }}
//       />
//     );
//   });

//   return (
//     <Box
//       sx={{
//         position: "fixed",
//         inset: 0,
//         zIndex: 2000,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         background: mode === "dark" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)",
//         backdropFilter: "blur(2px)",
//         overflow: "hidden",
//         "@keyframes fall": {
//           "0%": { transform: "translate3d(0, -10vh, 0) rotate(0deg)", opacity: 1 },
//           "80%": { opacity: 1 },
//           "100%": { transform: "translate3d(0, 110vh, 0) rotate(360deg)", opacity: 0.6 },
//         },
//       }}
//     >
//       <Box sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{pieces}</Box>
//       <Box
//         sx={{
//           position: "relative",
//           px: 4,
//           py: 3,
//           borderRadius: 4,
//           boxShadow: 6,
//           textAlign: "center",
//           backgroundColor: mode === "dark" ? "#121212" : "#ffffff",
//           color: mode === "dark" ? "#fff" : "#111",
//           border: mode === "dark" ? "1px solid #2a2a2a" : "1px solid #eaeaea",
//           minWidth: 280,
//         }}
//       >
//         <Typography variant="h5" fontWeight="bold" gutterBottom>
//           Welcome{name ? ", " : ""}{name || "Friend"}!
//         </Typography>
//         <Typography variant="body1">
//           Your account is ready. Taking you to your dashboard…
//         </Typography>
//       </Box>
//     </Box>
//   );
// };

// const initialForm = {
//   name: "",
//   surname: "",
//   date_of_birth: "",
//   home_address: "",
//   title: "",
//   invited_by: "",
//   phone_number: "",
//   email: "",
//   gender: "",
//   password: "",
//   confirm_password: "",
// };

// const Signup = ({ onSignup, mode, setMode }) => {
//   const theme = useTheme();
//   const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
//   const navigate = useNavigate();
//   const { setUserProfile } = useContext(UserContext);
//   const { login } = useContext(AuthContext);
//   const [showWelcome, setShowWelcome] = useState(false);
//   const [welcomeName, setWelcomeName] = useState("");

//   const [form, setForm] = useState(initialForm);
//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
//   // Invited By async search state - FIXED
//   const [invitedOptions, setInvitedOptions] = useState([]);
//   const [loadingInvited, setLoadingInvited] = useState(false);
//   const [invitedSearch, setInvitedSearch] = useState("");

//   // Server-side search for invited_by field - FIXED
//   const fetchInvitedOptions = async (query) => {
//     if (!query?.trim()) {
//       setInvitedOptions([]);
//       return;
//     }
//     try {
//       setLoadingInvited(true);
//       const res = await axios.get(`${BACKEND_URL}/people/search`, {
//         params: { query, limit: 20 },
//       });
      
//       // Handle different response formats
//       let results = [];
//       if (Array.isArray(res.data)) {
//         results = res.data;
//       } else if (res.data?.results) {
//         results = res.data.results;
//       } else if (res.data?.people) {
//         results = res.data.people;
//       } else if (res.data) {
//         results = [res.data];
//       }
      
//       const mapped = results.map((p) => ({
//         label: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim() || 'Unknown',
//         value: p._id || p.id || `${p.Name || p.name} ${p.Surname || p.surname}`,
//         person: p,
//       }));
      
//       setInvitedOptions(mapped);
//     } catch (err) {
//       console.error("Failed to search people:", err);
//       // Fallback: create an option from the current search
//       if (query.trim()) {
//         setInvitedOptions([{
//           label: query,
//           value: query,
//           person: { name: query }
//         }]);
//       } else {
//         setInvitedOptions([]);
//       }
//     } finally {
//       setLoadingInvited(false);
//     }
//   };

//   // Debounce invited_by search input - FIXED
//   useEffect(() => {
//     const handler = setTimeout(() => {
//       if (invitedSearch && invitedSearch.trim().length >= 2) {
//         fetchInvitedOptions(invitedSearch.trim());
//       } else {
//         setInvitedOptions([]);
//       }
//     }, 500); // Increased delay for better debouncing
//     return () => clearTimeout(handler);
//   }, [invitedSearch]);

//   const validate = () => {
//     const newErrors = {};
//     if (!form.name.trim()) newErrors.name = "Name is required";
//     if (!form.surname.trim()) newErrors.surname = "Surname is required";
//     if (!form.date_of_birth) newErrors.date_of_birth = "Date of Birth is required";
//     else if (new Date(form.date_of_birth) > new Date())
//       newErrors.date_of_birth = "Date cannot be in the future";
//     if (!form.home_address.trim()) newErrors.home_address = "Home Address is required";
//     if (!form.title.trim()) newErrors.title = "Title is required";
//     if (!form.invited_by.trim()) newErrors.invited_by = "Invited By is required";
//     if (!form.phone_number.trim()) newErrors.phone_number = "Phone Number is required";
//     if (!form.email.trim()) newErrors.email = "Email is required";
//     else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
//     if (!form.gender) newErrors.gender = "Select a gender";
//     if (!form.password) newErrors.password = "Password is required";
//     else if (form.password.length < 6)
//       newErrors.password = "Password must be at least 6 characters";
//     if (!form.confirm_password) newErrors.confirm_password = "Confirm your password";
//     else if (form.confirm_password !== form.password)
//       newErrors.confirm_password = "Passwords do not match";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm({ ...form, [name]: value });
    
//     // Clear error when user types
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: "" }));
//     }
//   };

//   // Handle autocomplete change for invited_by - FIXED
//   const handleInvitedByChange = (event, newValue) => {
//     let invitedByValue = "";
    
//     if (typeof newValue === "string") {
//       invitedByValue = newValue;
//     } else if (newValue && newValue.label) {
//       invitedByValue = newValue.label;
//     }
    
//     setForm(prev => ({ ...prev, invited_by: invitedByValue }));
    
//     // Clear error when user selects/types something
//     if (errors.invited_by) {
//       setErrors(prev => ({ ...prev, invited_by: "" }));
//     }
//   };

//   // Handle input change for invited_by - FIXED
//   const handleInvitedByInputChange = (event, newInputValue) => {
//     setInvitedSearch(newInputValue);
    
//     // Also update the form if user is typing freely
//     if (event && event.type === 'change') {
//       setForm(prev => ({ ...prev, invited_by: newInputValue }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     setLoading(true);

//     const submitData = { 
//       ...form,
//       // Ensure title is properly saved
//       title: form.title || "",
//       // Ensure invited_by is properly saved
//       invited_by: form.invited_by || ""
//     };
//     delete submitData.confirm_password;
    
//     try {
//       const res = await fetch(`${BACKEND_URL}/signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(submitData),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         alert(data?.detail || "Signup failed. Please try again.");
//       } else {
//         const userData = {
//           name: submitData.name,
//           surname: submitData.surname,
//           date_of_birth: submitData.date_of_birth,
//           home_address: submitData.home_address,
//           address: submitData.home_address,
//           title: submitData.title, // Ensure title is saved
//           invited_by: submitData.invited_by, // Ensure invited_by is saved
//           phone_number: submitData.phone_number,
//           email: submitData.email,
//           gender: submitData.gender,
//         };
//         setUserProfile(userData);
        
//         if (onSignup) onSignup(submitData);

//         try {
//           await login(submitData.email, submitData.password);
//           // Store password temporarily in sessionStorage for display in profile
//           sessionStorage.setItem('tempPassword', submitData.password);
//           sessionStorage.setItem('showPasswordInProfile', 'true');
//         } catch (loginErr) {
//           console.error("Auto-login failed:", loginErr);
//           navigate("/login");
//           return;
//         }
        
//         setWelcomeName(submitData.name || submitData.email);
//         setShowWelcome(true);
//         setTimeout(() => {
//           setForm(initialForm);
//           setShowWelcome(false);
//           navigate("/");
//         }, 2000);
//       }
//     } catch (error) {
//       console.error("Signup error:", error);
//       alert("Network or server error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Box
//       sx={{
//         position: "relative",
//         minHeight: "100vh",
//         background: theme.palette.background.default,
//         color: theme.palette.text.primary,
//         p: 2,
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       {showWelcome && <WelcomeOverlay name={welcomeName} mode={mode} />}
      
//       <Box sx={{ position: "absolute", top: 16, right: 16 }}>
//         <IconButton
//           onClick={() => {
//             const next = mode === "light" ? "dark" : "light";
//             localStorage.setItem("themeMode", next);
//             setMode(next);
//           }}
//           sx={{
//             color: mode === "dark" ? "#fff" : "#000",
//             backgroundColor: mode === "dark" ? "#1f1f1f" : "#e0e0e0",
//             "&:hover": {
//               backgroundColor: mode === "dark" ? "#2c2c2c" : "#c0c0c0",
//             },
//           }}
//         >
//           {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
//         </IconButton>
//       </Box>
      
//       <Box
//         sx={{
//           maxWidth: 800,
//           width: "100%",
//           display: "flex",
//           flexDirection: "column",
//           gap: 3,
//           p: 3,
//           borderRadius: 4,
//           boxShadow: 3,
//           background: theme.palette.background.paper,
//         }}
//       >
//         <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
//           <img
//             src={darkLogo}
//             alt="The Active Church Logo"
//             style={{
//               maxHeight: isSmallScreen ? 60 : 80,
//               maxWidth: "100%",
//               objectFit: "contain",
//               filter: mode === "dark" ? "invert(1)" : "none",
//               transition: "filter 0.3s ease-in-out",
//             }}
//           />
//         </Box>

//         <Typography variant="h5" align="center" fontWeight="bold">
//           FILL IN YOUR DETAILS
//         </Typography>

//         <Box
//           component="form"
//           onSubmit={handleSubmit}
//           display="flex"
//           flexDirection="column"
//           gap={3}
//         >
//           <Box
//             display="grid"
//             gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
//             gap={2.5}
//           >
//             {[
//               ["name", "Name"],
//               ["surname", "Surname"],
//               ["date_of_birth", "Date Of Birth", "date"],
//               ["email", "Email Address", "email"],
//               ["home_address", "Home Address"],
//               ["phone_number", "Phone Number"],
//             ].map(([name, label, type]) => (
//               <TextField
//                 key={name}
//                 label={label}
//                 name={name}
//                 type={type || "text"}
//                 value={form[name]}
//                 onChange={handleChange}
//                 error={!!errors[name]}
//                 helperText={errors[name]}
//                 fullWidth
//                 InputLabelProps={type === "date" ? { shrink: true } : undefined}
//                 sx={{
//                   "& .MuiOutlinedInput-root": { borderRadius: 3 },
//                   "& .MuiFormHelperText-root": { color: theme.palette.error.main },
//                 }}
//               />
//             ))}

//             {/* Title - Select - ENSURED PROPER SAVING */}
//             <FormControl fullWidth error={!!errors.title}>
//               <InputLabel>Title</InputLabel>
//               <Select
//                 name="title"
//                 value={form.title}
//                 onChange={handleChange}
//                 label="Title"
//                 sx={{ borderRadius: 3 }}
//               >
//                 <MenuItem value=""><em>Select Title</em></MenuItem>
//                 <MenuItem value="Mr">Mr</MenuItem>
//                 <MenuItem value="Mrs">Mrs</MenuItem>
//                 <MenuItem value="Miss">Miss</MenuItem>
//                 <MenuItem value="Ms">Ms</MenuItem>
//                 <MenuItem value="Dr">Dr</MenuItem>
//                 <MenuItem value="Prof">Prof</MenuItem>
//                 <MenuItem value="Pastor">Pastor</MenuItem>
//                 <MenuItem value="Bishop">Bishop</MenuItem>
//                 <MenuItem value="Apostle">Apostle</MenuItem>
//               </Select>
//               {errors.title && (
//                 <Typography variant="caption" color="error">
//                   {errors.title}
//                 </Typography>
//               )}
//             </FormControl>

//             {/* Invited By - FIXED Autocomplete */}
//             <Autocomplete
//               freeSolo
//               disabled={loading}
//               options={invitedOptions}
//               loading={loadingInvited}
//               getOptionLabel={(option) => typeof option === "string" ? option : option.label}
//               value={form.invited_by}
//               onChange={handleInvitedByChange}
//               onInputChange={handleInvitedByInputChange}
//               inputValue={invitedSearch}
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="Invited By"
//                   name="invited_by"
//                   error={!!errors.invited_by}
//                   helperText={errors.invited_by || (loadingInvited ? "Searching..." : "Type to search for people")}
//                   fullWidth
//                   sx={{
//                     "& .MuiOutlinedInput-root": { borderRadius: 3 },
//                     "& .MuiFormHelperText-root": { 
//                       color: errors.invited_by ? theme.palette.error.main : theme.palette.text.secondary 
//                     },
//                   }}
//                 />
//               )}
//               renderOption={(props, option) => (
//                 <li {...props} key={option.value}>
//                   {option.label}
//                 </li>
//               )}
//             />

//             <FormControl fullWidth error={!!errors.gender}>
//               <InputLabel>Gender</InputLabel>
//               <Select
//                 name="gender"
//                 value={form.gender}
//                 onChange={handleChange}
//                 label="Gender"
//                 sx={{ borderRadius: 3 }}
//               >
//                 <MenuItem value="">
//                   <em>Select Gender</em>
//                 </MenuItem>
//                 <MenuItem value="male">Male</MenuItem>
//                 <MenuItem value="female">Female</MenuItem>
//               </Select>
//               {errors.gender && (
//                 <Typography variant="caption" color="error">
//                   {errors.gender}
//                 </Typography>
//               )}
//             </FormControl>

//             {/* Password Fields - KEPT AS REQUESTED */}
//             <TextField
//               label="Password"
//               name="password"
//               type={showPassword ? "text" : "password"}
//               value={form.password}
//               onChange={handleChange}
//               error={!!errors.password}
//               helperText={errors.password}
//               fullWidth
//               InputProps={{
//                 endAdornment: (
//                   <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
//                     {showPassword ? <Visibility /> : <VisibilityOff />}
//                   </IconButton>
//                 ),
//               }}
//               sx={{
//                 "& .MuiOutlinedInput-root": { borderRadius: 3 },
//                 "& .MuiFormHelperText-root": { color: theme.palette.error.main },
//               }}
//             />

//             <TextField
//               label="Confirm Password"
//               name="confirm_password"
//               type={showConfirmPassword ? "text" : "password"}
//               value={form.confirm_password}
//               onChange={handleChange}
//               error={!!errors.confirm_password}
//               helperText={errors.confirm_password}
//               fullWidth
//               InputProps={{
//                 endAdornment: (
//                   <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
//                     {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
//                   </IconButton>
//                 ),
//               }}
//               sx={{
//                 "& .MuiOutlinedInput-root": { borderRadius: 3 },
//                 "& .MuiFormHelperText-root": { color: theme.palette.error.main },
//               }}
//             />
//           </Box>

//           {Object.keys(errors).length > 0 && (
//             <Typography color="error" textAlign="center" mt={1}>
//               Please fix the highlighted errors above.
//             </Typography>
//           )}

//           <Box textAlign="center">
//             <Button
//               type="submit"
//               variant="contained"
//               size="large"
//               disabled={loading}
//               sx={{
//                 backgroundColor: "#000",
//                 color: "#fff",
//                 borderRadius: 8,
//                 px: 4,
//                 py: 1.5,
//                 fontWeight: "bold",
//                 "&:hover": {
//                   backgroundColor: "#222",
//                 },
//                 "&:active": {
//                   backgroundColor: "#444",
//                 },
//               }}
//             >
//               {loading ? "Signing Up..." : "Sign Up"}
//             </Button>
//           </Box>

//           <Box textAlign="center" mt={1}>
//             <Typography>
//               Already have an account?{" "}
//               <Typography
//                 component="span"
//                 sx={{ color: "#42a5f5", cursor: "pointer", textDecoration: "underline" }}
//                 onClick={() => navigate("/login")}
//               >
//                 Log In
//               </Typography>
//             </Typography>
//           </Box>
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default Signup;


import React, { useState, useContext, useEffect } from "react";
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

// WelcomeOverlay component
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
          Your account is ready. Taking you to your dashboard…
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
  const [invitedSearch, setInvitedSearch] = useState("");
  const [allPeople, setAllPeople] = useState([]);

  // Fetch all people once and cache
  const fetchAllPeople = async () => {
    try {
      setLoadingInvited(true);
      const res = await axios.get(`${BACKEND_URL}/people/all`);
      if (Array.isArray(res.data)) {
        const mapped = res.data.map((p) => ({
          label: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim() || 'Unknown',
          value: p._id || p.id || `${p.Name || p.name} ${p.Surname || p.surname}`,
          person: p,
        }));
        setAllPeople(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch all people:", err);
      setAllPeople([]);
    } finally {
      setLoadingInvited(false);
    }
  };

  useEffect(() => {
    fetchAllPeople();
  }, []);

  // Search invited_by field: use cached allPeople or backend search
  const fetchInvitedOptions = async (query) => {
    if (!query?.trim()) {
      setInvitedOptions([]);
      return;
    }

    const lowerQuery = query.trim().toLowerCase();

    // Filter cached allPeople first
    let filtered = allPeople.filter((p) =>
      p.label.toLowerCase().includes(lowerQuery)
    );

    if (filtered.length > 0) {
      setInvitedOptions(filtered.slice(0, 50)); // limit to 50 options
    } else {
      // fallback to backend search if no match locally
      try {
        setLoadingInvited(true);
        const res = await axios.get(`${BACKEND_URL}/people/search`, {
          params: { query, limit: 20 },
        });

        let results = [];
        if (Array.isArray(res.data)) results = res.data;
        else if (res.data?.results) results = res.data.results;
        else if (res.data?.people) results = res.data.people;
        else if (res.data) results = [res.data];

        const mapped = results.map((p) => ({
          label: `${p.Name || p.name || ""} ${p.Surname || p.surname || ""}`.trim() || 'Unknown',
          value: p._id || p.id || `${p.Name || p.name} ${p.Surname || p.surname}`,
          person: p,
        }));

        setInvitedOptions(mapped);
      } catch (err) {
        console.error("Backend search failed:", err);
        setInvitedOptions([{ label: query, value: query, person: { name: query } }]);
      } finally {
        setLoadingInvited(false);
      }
    }
  };

  // Debounced input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (invitedSearch && invitedSearch.trim().length >= 2) {
        fetchInvitedOptions(invitedSearch.trim());
      } else {
        setInvitedOptions([]);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [invitedSearch, allPeople]);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleInvitedByChange = (event, newValue) => {
    let invitedByValue = "";
    if (typeof newValue === "string") invitedByValue = newValue;
    else if (newValue && newValue.label) invitedByValue = newValue.label;
    setForm(prev => ({ ...prev, invited_by: invitedByValue }));
    if (errors.invited_by) setErrors(prev => ({ ...prev, invited_by: "" }));
  };

  const handleInvitedByInputChange = (event, newInputValue) => {
    setInvitedSearch(newInputValue);
    if (event && event.type === 'change') {
      setForm(prev => ({ ...prev, invited_by: newInputValue }));
    }
  };

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
                  "& .MuiOutlinedInput-root": { borderRadius: 3 },
                  "& .MuiFormHelperText-root": { color: theme.palette.error.main },
                }}
              />
            ))}

            <FormControl fullWidth error={!!errors.title}>
              <InputLabel>Title</InputLabel>
              <Select name="title" value={form.title} onChange={handleChange} label="Title" sx={{ borderRadius: 3 }}>
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

            <Autocomplete
              freeSolo
              disabled={loading}
              options={invitedOptions}
              loading={loadingInvited}
              getOptionLabel={(option) => typeof option === "string" ? option : option.label}
              value={form.invited_by}
              onChange={handleInvitedByChange}
              onInputChange={handleInvitedByInputChange}
              inputValue={invitedSearch}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Invited By"
                  name="invited_by"
                  error={!!errors.invited_by}
                  helperText={errors.invited_by || (loadingInvited ? "Searching..." : "Type to search for people")}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 3 },
                    "& .MuiFormHelperText-root": { 
                      color: errors.invited_by ? theme.palette.error.main : theme.palette.text.secondary 
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.value}>{option.label}</li>
              )}
            />

            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select name="gender" value={form.gender} onChange={handleChange} label="Gender" sx={{ borderRadius: 3 }}>
                <MenuItem value=""><em>Select Gender</em></MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
              {errors.gender && <Typography variant="caption" color="error">{errors.gender}</Typography>}
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
            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: 8,
              px: 4,
              py: 1.5,
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#222" },
              "&:active": { backgroundColor: "#444" },
            }}>
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
