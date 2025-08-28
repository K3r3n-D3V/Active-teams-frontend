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
  const { user, logout, updateProfilePic } = useContext(AuthContext);

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

  // NEW: handle profile picture change
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newPicUrl = reader.result;
      updateProfilePic(newPicUrl);
    };
    reader.readAsDataURL(file);
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
            sx={{ width: 40, height: 40, border: "2px solid white", cursor: "pointer" }}
          >
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProfilePicChange}
            />
          </Avatar>
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
