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
import { UserContext } from "../contexts/UserContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";

export default function TopbarProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const { profilePic, userProfile, clearUserData } = useContext(UserContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Hide on auth routes
  if (location.pathname === "/signup" || location.pathname === "/login")
    return null;

  const handleMenuToggle = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    clearUserData();
    handleMenuClose();
    navigate("/login");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <>
      {/* Avatar that navigates to Profile */}
      <Tooltip title="Go to Profile">
        <IconButton
          sx={{ position: "absolute", top: 16, right: 48, zIndex: 1200, p: 0 }}
          onClick={handleProfileClick}
        >
          <Avatar
            alt={userProfile?.name || "Profile"}
            src={profilePic}
            sx={{
              width: 40,
              height: 40,
              border: "2px solid white",
              cursor: "pointer",
            }}
          />
        </IconButton>
      </Tooltip>

      {/* More Options */}
      <IconButton
        onClick={handleMenuToggle}
        sx={{ position: "absolute", top: 16, right: 8, zIndex: 1200 }}
      >
        <MoreVertIcon />
      </IconButton>

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
