
// import React, { useContext, useState } from 'react';
// import {
//   Avatar,
//   IconButton,
//   Tooltip,
//   Menu,
//   MenuItem,
//   Divider,
//   ListItemIcon,
//   useTheme,
// } from '@mui/material';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { UserContext } from '../contexts/UserContext.jsx';
// import MoreVertIcon from '@mui/icons-material/MoreVert';
// import LogoutIcon from '@mui/icons-material/Logout';
// import axios from 'axios';

// export default function TopbarProfile() {
//   const navigate = useNavigate();
//   const { user, setUser, profilePic } = useContext(UserContext);
//   const location = useLocation();
//   const theme = useTheme();

//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);

//   const handleProfileClick = () => {
//     navigate('/profile');
//   };

//   const handleMenuToggle = (event) => {
//     if (anchorEl) {
//       setAnchorEl(null); // close if already open
//     } else {
//       setAnchorEl(event.currentTarget); // open if closed
//     }
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleLogout = async () => {
//     try {
//       if (user?._id) {
//         await axios.post('http://localhost:8000/logout', { user_id: user._id });
//       }

//       setUser(null);
//       localStorage.removeItem('user');
//       navigate('/login');
//     } catch (err) {
//       console.error('Logout failed:', err);
//     } finally {
//       handleMenuClose();
//     }
//   };

//   if (location.pathname === '/signup' || location.pathname === '/login') {
//     return null;
//   }

//   return (
//     <>
//       <Tooltip title="Go to Profile">
//         <IconButton
//           onClick={handleProfileClick}
//           sx={{
//             position: 'absolute',
//             top: 16,
//             right: 32,
//             zIndex: 1200,
//             p: 0,
//           }}
//         >
//           <Avatar
//             alt="Profile"
//             src={profilePic}
//             sx={{
//               width: 40,
//               height: 40,
//               border: '2px solid white',
//             }}
//           />
//         </IconButton>
//       </Tooltip>

//       <IconButton
//         onClick={handleMenuToggle}
//         sx={{
//           position: 'absolute',
//           top: 16,
//           right: 5,
//           zIndex: 1200,
//         }}
//       >
//         <MoreVertIcon />
//       </IconButton>

//       <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleMenuClose}
//         anchorOrigin={{
//           vertical: 'bottom',
//           horizontal: 'right',
//         }}
//         transformOrigin={{
//           vertical: 'top',
//           horizontal: 'right',
//         }}
//         PaperProps={{
//           elevation: 4,
//           sx: {
//             minWidth: 160,
//             borderRadius: 2,
//             backgroundColor: theme.palette.background.paper,
//             color: theme.palette.text.primary,
//             boxShadow: theme.shadows[6],
//           },
//         }}
//       >
//         <MenuItem
//           onClick={handleLogout}
//           sx={{
//             "&:hover": {
//               backgroundColor:
//                 theme.palette.mode === "dark" ? "#333" : theme.palette.grey[200],
//             },
//             px: 2,
//             py: 1.2,
//             fontSize: 14,
//           }}
//         >
//           <ListItemIcon>
//             <LogoutIcon fontSize="small" />
//           </ListItemIcon>
//           Logout
//         </MenuItem>
//       </Menu>
//     </>
//   );
// }

// import React, { useContext, useState } from "react";
// import {
//   Avatar,
//   IconButton,
//   Tooltip,
//   Menu,
//   MenuItem,
//   Divider,
//   ListItemIcon,
//   useTheme,
// } from "@mui/material";
// import { useNavigate, useLocation } from "react-router-dom";
// import { UserContext } from "../contexts/UserContext.jsx";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
// import LogoutIcon from "@mui/icons-material/Logout";
// import { logout } from "../services/authService.js"; // your API helper

// export default function TopbarProfile() {
//   const navigate = useNavigate();
//   const { user, setUser, profilePic } = useContext(UserContext);
//   const location = useLocation();
//   const theme = useTheme();

//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);

//   if (location.pathname === "/signup" || location.pathname === "/login") {
//     return null; // hide Topbar on login/signup pages
//   }

//   const handleProfileClick = () => {
//     navigate("/profile");
//   };

//   const handleMenuToggle = (event) => {
//     if (anchorEl) setAnchorEl(null);
//     else setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleLogout = async () => {
//     try {
//       const accessToken =
//         user?.access_token || localStorage.getItem("access_token");

//       if (accessToken) {
//         await logout(accessToken); // call API to invalidate token
//       }

//       // Clear user state & localStorage
//       setUser(null);
//       localStorage.removeItem("user");
//       localStorage.removeItem("access_token");
//       localStorage.removeItem("refresh_token");

//       navigate("/login");
//     } catch (err) {
//       console.error("Logout failed:", err);
//     } finally {
//       handleMenuClose();
//     }
//   };

//   return (
//     <>
//       {/* Profile Avatar */}
//       <Tooltip title="Go to Profile">
//         <IconButton
//           onClick={handleProfileClick}
//           sx={{
//             position: "absolute",
//             top: 16,
//             right: 32,
//             zIndex: 1200,
//             p: 0,
//           }}
//         >
//           <Avatar
//             alt="Profile"
//             src={profilePic}
//             sx={{
//               width: 40,
//               height: 40,
//               border: "2px solid white",
//             }}
//           />
//         </IconButton>
//       </Tooltip>

//       {/* More menu button */}
//       <IconButton
//         onClick={handleMenuToggle}
//         sx={{
//           position: "absolute",
//           top: 16,
//           right: 5,
//           zIndex: 1200,
//         }}
//       >
//         <MoreVertIcon />
//       </IconButton>

//       {/* Menu */}
//       <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleMenuClose}
//         anchorOrigin={{
//           vertical: "bottom",
//           horizontal: "right",
//         }}
//         transformOrigin={{
//           vertical: "top",
//           horizontal: "right",
//         }}
//         PaperProps={{
//           elevation: 4,
//           sx: {
//             minWidth: 160,
//             borderRadius: 2,
//             backgroundColor: theme.palette.background.paper,
//             color: theme.palette.text.primary,
//             boxShadow: theme.shadows[6],
//           },
//         }}
//       >
//         <MenuItem
//           onClick={handleLogout}
//           sx={{
//             "&:hover": {
//               backgroundColor:
//                 theme.palette.mode === "dark" ? "#333" : theme.palette.grey[200],
//             },
//             px: 2,
//             py: 1.2,
//             fontSize: 14,
//           }}
//         >
//           <ListItemIcon>
//             <LogoutIcon fontSize="small" />
//           </ListItemIcon>
//           Logout
//         </MenuItem>
//       </Menu>
//     </>
//   );
// }



// import React, { useContext, useState } from "react";
// import {
//   Avatar,
//   IconButton,
//   Tooltip,
//   Menu,
//   MenuItem,
//   ListItemIcon,
//   useTheme,
// } from "@mui/material";
// import { useNavigate, useLocation } from "react-router-dom";
// import MoreVertIcon from "@mui/icons-material/MoreVert";
// import LogoutIcon from "@mui/icons-material/Logout";
// import { AuthContext } from "../contexts/AuthContext";

// export default function TopbarProfile() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const theme = useTheme();

//   const { user, logout } = useContext(AuthContext);
//   const profilePic = user?.profilePic || ""; // fallback if you store profile pic in user

//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);

//   if (location.pathname === "/signup" || location.pathname === "/login") {
//     return null; // hide Topbar on login/signup pages
//   }

//   const handleProfileClick = () => {
//     navigate("/profile");
//   };

//   const handleMenuToggle = (event) => {
//     setAnchorEl(anchorEl ? null : event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleLogout = async () => {
//     try {
//       await logout(); // call AuthContext logout
//       navigate("/login"); // redirect to login
//     } catch (err) {
//       console.error("Logout failed:", err);
//     } finally {
//       handleMenuClose();
//     }
//   };

//   return (
//     <>
//       {/* Profile Avatar */}
//       <Tooltip title="Go to Profile">
//         <IconButton
//           onClick={handleProfileClick}
//           sx={{
//             position: "absolute",
//             top: 16,
//             right: 32,
//             zIndex: 1200,
//             p: 0,
//           }}
//         >
//           <Avatar
//             alt="Profile"
//             src={profilePic}
//             sx={{
//               width: 40,
//               height: 40,
//               border: "2px solid white",
//             }}
//           />
//         </IconButton>
//       </Tooltip>

//       {/* More menu button */}
//       <IconButton
//         onClick={handleMenuToggle}
//         sx={{
//           position: "absolute",
//           top: 16,
//           right: 5,
//           zIndex: 1200,
//         }}
//       >
//         <MoreVertIcon />
//       </IconButton>

//       {/* Menu */}
//       <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={handleMenuClose}
//         anchorOrigin={{
//           vertical: "bottom",
//           horizontal: "right",
//         }}
//         transformOrigin={{
//           vertical: "top",
//           horizontal: "right",
//         }}
//         PaperProps={{
//           elevation: 4,
//           sx: {
//             minWidth: 160,
//             borderRadius: 2,
//             backgroundColor: theme.palette.background.paper,
//             color: theme.palette.text.primary,
//             boxShadow: theme.shadows[6],
//           },
//         }}
//       >
//         <MenuItem
//           onClick={handleLogout}
//           sx={{
//             "&:hover": {
//               backgroundColor:
//                 theme.palette.mode === "dark" ? "#333" : theme.palette.grey[200],
//             },
//             px: 2,
//             py: 1.2,
//             fontSize: 14,
//           }}
//         >
//           <ListItemIcon>
//             <LogoutIcon fontSize="small" />
//           </ListItemIcon>
//           Logout
//         </MenuItem>
//       </Menu>
//     </>
//   );
// }


import React, { useContext, useState } from "react";
import {
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  useTheme,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";

export default function TopbarProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useContext(AuthContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  if (location.pathname === "/signup" || location.pathname === "/login") return null;

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleMenuToggle = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      handleMenuClose();
      navigate("/login");
    }
  };

  return (
    <>
      {/* Profile Avatar */}
      <Tooltip title="Go to Profile">
        <IconButton
          onClick={handleProfileClick}
          sx={{ position: "absolute", top: 16, right: 32, zIndex: 1200, p: 0 }}
        >
          <Avatar
            alt={user?.name || "Profile"}
            src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/147/147144.png"}
            sx={{ width: 40, height: 40, border: "2px solid white" }}
          />
        </IconButton>
      </Tooltip>

      {/* More Options Menu Button */}
      <IconButton
        onClick={handleMenuToggle}
        sx={{ position: "absolute", top: 16, right: 5, zIndex: 1200 }}
      >
        <MoreVertIcon />
      </IconButton>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 4,
          sx: {
            minWidth: 160,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.shadows[6],
          },
        }}
      >
        <MenuItem
          onClick={handleLogout}
          sx={{
            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark" ? "#333" : theme.palette.grey[200],
            },
            px: 2,
            py: 1.2,
            fontSize: 14,
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
