import React, { useContext, useState, useEffect } from "react";
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
import { UserContext } from "../contexts/UserContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";

export default function TopbarProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const { profilePic, loadUserProfile } = useContext(UserContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const open = Boolean(anchorEl);

  // Load user profile on mount and when user changes
  useEffect(() => {
    const initializeProfile = async () => {
      if (isAuthenticated && user) {
        setIsLoading(true);
        try {
          // If UserContext has a loadUserProfile function, call it
          if (loadUserProfile) {
            await loadUserProfile();
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, [user, isAuthenticated, loadUserProfile]);

  // Get display name
  const getDisplayName = () => {
    return user?.name || user?.email || "Profile";
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (user?.name) {
      return user.name[0].toUpperCase();
    } else if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Check if using a default avatar (for showing initials)
  const isDefaultAvatar = () => {
    if (!profilePic) return true;
    
    // Check if it's one of the default avatar URLs
    const defaultAvatarUrls = [
      "https://cdn-icons-png.flaticon.com/512/6997/6997662.png", // female
      "https://cdn-icons-png.flaticon.com/512/6997/6997675.png", // male
      "https://cdn-icons-png.flaticon.com/512/147/147144.png"    // neutral
    ];
    
    return defaultAvatarUrls.some(url => profilePic.includes(url));
  };

  // Hide on auth routes
  if (location.pathname === "/signup" || location.pathname === "/login")
    return null;

  const handleMenuToggle = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const displayName = getDisplayName();
  const initials = getInitials();
  const showInitials = isDefaultAvatar();

  return (
    <>
      {/* Avatar that navigates to Profile */}
      <Tooltip title={`Go to Profile (${displayName})`}>
        <IconButton
          sx={{ 
            position: "absolute", 
            top: 16, 
            right: 48, 
            zIndex: 1200, 
            p: 0,
            // Add transition for smooth hover effect
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
          onClick={handleProfileClick}
        >
          <Avatar
            alt={displayName}
            src={!isLoading && profilePic ? profilePic : undefined}
            sx={{
              width: 40,
              height: 40,
              border: `2px solid ${theme.palette.background.paper}`,
              cursor: "pointer",
              // Only show background color for default avatars with initials
              bgcolor: showInitials ? theme.palette.primary.main : 'transparent',
              boxShadow: theme.shadows[2],
              // Smooth transition
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {/* Show initials only for default avatars or while loading */}
            {(showInitials || isLoading) && initials}
          </Avatar>
        </IconButton>
      </Tooltip>

      {/* More Options */}
      <IconButton
        onClick={handleMenuToggle}
        sx={{ 
          position: "absolute", 
          top: 16, 
          right: 8, 
          zIndex: 1200,
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.1)'
          }
        }}
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
            overflow: 'visible',
            // Arrow effect
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            }
          },
        }}
      >
        <MenuItem
          onClick={handleLogout}
          sx={{
            "&:hover": {
              backgroundColor: theme.palette.mode === "dark" 
                ? "rgba(255, 255, 255, 0.1)" 
                : "rgba(0, 0, 0, 0.04)",
            },
            px: 2,
            py: 1.2,
            fontSize: 14,
            borderRadius: 1,
            margin: 0.5,
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}