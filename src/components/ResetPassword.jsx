// import React, { useState, useEffect } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import {
//   Box,
//   TextField,
//   Button,
//   Typography,
//   useTheme,
//   IconButton,
//   InputAdornment,
// } from "@mui/material";
// import Visibility from "@mui/icons-material/Visibility";
// import VisibilityOff from "@mui/icons-material/VisibilityOff";

// const ResetPassword = () => {
//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token");
//   const navigate = useNavigate();
//   const theme = useTheme();

//   const [password, setPassword] = useState("");
//   const [confirm, setConfirm] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");

//   useEffect(() => {
//     if (!token) {
//       setError("Invalid or expired reset token.");
//     }
//   }, [token]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setMessage("");

//     if (password !== confirm) {
//       setError("Passwords do not match.");
//       return;
//     }

//     try {
//       const res = await fetch("http://localhost:8000/reset-password", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, new_password: password }),
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data.detail || "Reset failed.");

//       setMessage("Password reset successful. You can now log in.");
//       setTimeout(() => navigate("/login"), 2000);
//     } catch (err) {
//       setError(err.message || "Something went wrong.");
//     }
//   };

//   return (
//     <Box
//       sx={{
//         minHeight: "100vh",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         background: theme.palette.background.default,
//         px: 2,
//       }}
//     >
//       <Box
//         component="form"
//         onSubmit={handleSubmit}
//         sx={{
//           p: 4,
//           maxWidth: 400,
//           width: "100%",
//           borderRadius: 4,
//           boxShadow: 3,
//           background: theme.palette.background.paper,
//         }}
//       >
//         <Typography variant="h5" fontWeight="bold" mb={2}>
//           Reset Password
//         </Typography>

//         {error && (
//           <Typography color="error" mb={2}>
//             {error}
//           </Typography>
//         )}
//         {message && (
//           <Typography color="success.main" mb={2}>
//             {message}
//           </Typography>
//         )}

//         <TextField
//           label="New Password"
//           type={showPassword ? "text" : "password"}
//           fullWidth
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           sx={{ mb: 2 }}
//           InputProps={{
//             endAdornment: (
//               <InputAdornment position="end">
//                 <IconButton
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   edge="end"
//                   aria-label="toggle password visibility"
//                 >
//                   {showPassword ? <VisibilityOff /> : <Visibility />}
//                 </IconButton>
//               </InputAdornment>
//             ),
//           }}
//         />

//         <TextField
//           label="Confirm Password"
//           type={showConfirm ? "text" : "password"}
//           fullWidth
//           value={confirm}
//           onChange={(e) => setConfirm(e.target.value)}
//           sx={{ mb: 2 }}
//           InputProps={{
//             endAdornment: (
//               <InputAdornment position="end">
//                 <IconButton
//                   onClick={() => setShowConfirm((prev) => !prev)}
//                   edge="end"
//                   aria-label="toggle confirm password visibility"
//                 >
//                   {showConfirm ? <VisibilityOff /> : <Visibility />}
//                 </IconButton>
//               </InputAdornment>
//             ),
//           }}
//         />

//         <Button type="submit" variant="contained" fullWidth>
//           Reset Password
//         </Button>
//       </Box>
//     </Box>
//   );
// };

// export default ResetPassword;

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  useTheme,
  IconButton,
  InputAdornment,
  useMediaQuery,
  Link,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import darkLogo from "../assets/active-teams.png";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or expired reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed.");

      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#fff",
          color: "#000",
          p: 4,
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <Box display="flex" justifyContent="center" mb={2}>
          <img
            src={darkLogo}
            alt="The Active Church"
            style={{
              maxHeight: isSmallScreen ? 60 : 80,
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Heading */}
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Reset Password
        </Typography>

        <Typography
          variant="body2"
          mb={1}
          sx={{ textAlign: "left", display: "block" }}
        >
          Enter and confirm your new password to reset your account.
        </Typography>

        {/* Error / Success Messages */}
        {error && (
          <Typography color="error.main" fontSize={14} mb={2}>
            {error}
          </Typography>
        )}
        {message && (
          <Typography color="success.main" fontSize={14} mb={2}>
            {message}
          </Typography>
        )}

        {/* New Password */}
        <TextField
          label="New Password"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "999px",
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Confirm Password */}
        <TextField
          label="Confirm Password"
          type={showConfirm ? "text" : "password"}
          variant="outlined"
          fullWidth
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "999px",
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirm((prev) => !prev)}
                  edge="end"
                  aria-label="toggle confirm password visibility"
                >
                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: "999px",
            py: 1.2,
            mb: 2,
            "&:hover": {
              backgroundColor: "#222",
            },
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </Button>

        {/* Back to Login */}
        <Typography fontSize={14}>
          Remember your password?{" "}
          <Link href="/login" underline="hover" color="primary">
            Login
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default ResetPassword;
