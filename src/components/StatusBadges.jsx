/**
 * StatusBadges.jsx - Reusable component for event status filtering
 * 
 * Displays status filter buttons (Incomplete, Complete, Did Not Meet)
 * with visual feedback for selected status.
 */

import React, { useCallback } from 'react';

const styles = {
  statusBadgeContainer: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  statusBadge: {
    padding: "0.6rem 1.2rem",
    borderRadius: "12px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    border: "2px solid",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  statusBadgeIncomplete: {
    backgroundColor: "#FFA500",
    color: "#fff",
    borderColor: "#FFA500",
  },
  statusBadgeComplete: {
    backgroundColor: "#fff",
    color: "#28a745",
    borderColor: "#28a745",
  },
  statusBadgeDidNotMeet: {
    backgroundColor: "#fff",
    color: "#dc3545",
    borderColor: "#dc3545",
  },
  statusBadgeActive: {
    transform: "scale(1.05)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  },
};

/**
 * StatusBadges Component
 * 
 * @param {string} selectedStatus - Currently selected status
 * @param {Function} setSelectedStatus - Callback to update selected status
 * @param {Function} setCurrentPage - Callback to reset pagination
 * @returns {JSX.Element} Status badge buttons
 */
const StatusBadges = ({
  selectedStatus,
  setSelectedStatus,
  setCurrentPage,
}) => {
  const statuses = [
    {
      value: "incomplete",
      label: "INCOMPLETE",
      style: styles.statusBadgeIncomplete,
    },
    {
      value: "complete",
      label: "COMPLETE",
      style: styles.statusBadgeComplete,
    },
    {
      value: "did_not_meet",
      label: "DID NOT MEET",
      style: styles.statusBadgeDidNotMeet,
    },
  ];

  const handleStatusClick = useCallback((statusValue) => {
    setSelectedStatus(statusValue);
    setCurrentPage(1);
  }, [setSelectedStatus, setCurrentPage]);

  return (
    <div style={styles.statusBadgeContainer}>
      {statuses.map((status) => (
        <button
          key={status.value}
          style={{
            ...styles.statusBadge,
            ...status.style,
            ...(selectedStatus === status.value
              ? styles.statusBadgeActive
              : {}),
          }}
          onClick={() => handleStatusClick(status.value)}
          aria-pressed={selectedStatus === status.value}
          aria-label={`Filter by ${status.label}`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};

export default StatusBadges;
