/**
 * MobileEventCard.jsx - Mobile-optimized event display component
 * 
 * Renders individual events as cards for mobile/tablet views.
 * Provides touch-friendly interface with action buttons for
 * attendance, editing, and deletion based on user permissions.
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * Utility function to format recurring days
 */
const formatRecurringDays = (recurringDays) => {
  if (!recurringDays || recurringDays.length === 0) {
    return null;
  }

  if (recurringDays.length === 1) {
    return `Every ${recurringDays[0]}`;
  }

  const dayOrder = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };

  const sorted = [...recurringDays].sort((a, b) => dayOrder[a] - dayOrder[b]);

  if (sorted.length === 2) {
    return `Every ${sorted[0]} & ${sorted[1]}`;
  }

  const last = sorted.pop();
  return `Every ${sorted.join(", ")} & ${last}`;
};

/**
 * Formats date into readable string
 */
const formatDate = (date) => {
  if (!date) return "Not set";
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return "Not set";
  return dateObj
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, " - ");
};

/**
 * MobileEventCard Component
 * 
 * Renders event as a card with key information and action buttons.
 * 
 * @param {Object} event - The event object to display
 * @param {Function} onOpenAttendance - Callback for opening attendance modal
 * @param {Function} onEdit - Callback for editing the event
 * @param {Function} onDelete - Callback for deleting the event
 * @param {boolean} showDelete - Whether to show the delete button
 * @param {boolean} isOverdue - Whether the event is overdue
 * @param {Object} theme - MUI theme object
 * @param {Object} styles - Component styles object
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {boolean} isLeaderAt12 - Whether current user is leader at 12
 * @param {string} currentUserLeaderAt1 - Current user's leader at 1 identifier
 * @param {string} selectedEventTypeFilter - Currently selected event type filter
 * @returns {JSX.Element} Mobile event card
 */
const MobileEventCard = ({
  event,
  onOpenAttendance,
  onEdit,
  onDelete,
  showDelete,
  isOverdue,
  theme,
  styles,
  isAdmin,
  isLeaderAt12,
  currentUserLeaderAt1,
  selectedEventTypeFilter,
}) => {
  if (!theme) {
    return <Box sx={{ height: 100 }} />;
  }

  const isDark = theme.palette.mode === "dark";
  const borderColor = isDark ? theme.palette.divider : "#e9ecef";

  const attendeesCount = event.attendees?.length || 0;
  const isCellEvent =
    selectedEventTypeFilter === "" ||
    selectedEventTypeFilter === "CELLS" ||
    selectedEventTypeFilter === "Cells";

  return (
    <div
      style={{
        ...styles.mobileCard,
        borderColor: borderColor,
        backgroundColor: isDark ? theme.palette.background.default : "#fff",
      }}
      role="article"
      aria-label={`Event: ${event.eventName || 'N/A'}`}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          marginBottom: "0.75rem",
          color: isDark ? "#fff" : "#333",
        }}
      >
        {event.eventName || "N/A"}
      </Typography>

      {event.is_recurring &&
        event.recurring_days &&
        event.recurring_days.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
              padding: "0.25rem 0.5rem",
              backgroundColor: isDark ? "rgba(33, 150, 243, 0.1)" : "#e3f2fd",
              borderRadius: "8px",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "#2196f3",
                fontWeight: "bold",
                fontSize: "0.7rem",
              }}
            >
              RECURRING
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isDark ? "#fff" : "#666",
                fontSize: "0.7rem",
              }}
            >
              {formatRecurringDays(event.recurring_days)}
            </Typography>
          </Box>
        )}

      {isOverdue && (
        <Typography
          variant="caption"
          sx={{ color: theme.palette.error.main, fontWeight: "bold" }}
        >
          OVERDUE!
        </Typography>
      )}

      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Date:</span>
        <span style={styles.mobileCardValue}>{formatDate(event.date)}</span>
      </div>

      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Leader:</span>
        <span style={styles.mobileCardValue}>
          {event.eventLeaderName || "N/A"}
        </span>
      </div>

      {isCellEvent && (
        <div style={styles.mobileCardRow}>
          <span style={styles.mobileCardLabel}>Leader @1:</span>
          <span style={styles.mobileCardValue}>{event.leader1 || "N/A"}</span>
        </div>
      )}

      <div style={styles.mobileCardRow}>
        <span style={styles.mobileCardLabel}>Leader @12:</span>
        <span style={styles.mobileCardValue}>{event.leader12 || "N/A"}</span>
      </div>

      <div style={styles.mobileActions}>
        <Tooltip title={`View Attendance (${attendeesCount} people)`}>
          <IconButton
            onClick={() => onOpenAttendance(event)}
            size="small"
            sx={{ color: theme.palette.primary.main }}
            aria-label="View attendance"
          >
            <CheckBoxIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Edit Event">
          <IconButton
            onClick={() => onEdit(event)}
            size="small"
            sx={{ color: "#ffc107" }}
            aria-label="Edit event"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {showDelete && (
          <Tooltip title="Delete Event">
            <IconButton
              onClick={() => onDelete(event)}
              size="small"
              sx={{ color: theme.palette.error.main }}
              aria-label="Delete event"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default MobileEventCard;
