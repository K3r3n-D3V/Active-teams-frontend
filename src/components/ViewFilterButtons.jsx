/**
 * ViewFilterButtons.jsx - Reusable component for view filtering
 * 
 * Displays view filter options (All, Personal) for leaders and admins
 * to switch between viewing all subordinates or personal entries.
 */

import React, { useCallback, useMemo } from 'react';

const styles = {
  viewFilterContainer: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  viewFilterLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#495057",
  },
  viewFilterRadio: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
  },
  viewFilterText: {
    fontSize: "1.1rem",
    transition: "all 0.2s ease",
  },
};

/**
 * ViewFilterButtons Component
 * 
 * Shows/hides based on user role and selected event type.
 * Only visible to Admins and Leaders at 12 when viewing CELLS.
 * 
 * @param {string} viewFilter - Current view filter value
 * @param {Function} setViewFilter - Callback to update view filter
 * @param {Function} setCurrentPage - Callback to reset pagination
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {boolean} isLeaderAt12 - Whether current user is leader at 12
 * @param {boolean} isRegularUser - Whether current user is regular user
 * @param {boolean} isRegistrant - Whether current user is registrant
 * @param {string} selectedEventTypeFilter - Currently selected event type
 * @returns {JSX.Element|null} View filter buttons or null
 */
const ViewFilterButtons = ({
  viewFilter,
  setViewFilter,
  setCurrentPage,
  isAdmin,
  isLeaderAt12,
  isRegularUser,
  isRegistrant,
  selectedEventTypeFilter,
}) => {
  // IMPORTANT: All hooks must be called at the top level, before any conditional returns
  // This is required by React's rules of hooks
  const shouldShowToggle = useMemo(() => {
    return (
      (isAdmin || isLeaderAt12) &&
      (selectedEventTypeFilter === "" ||
        selectedEventTypeFilter === "CELLS")
    );
  }, [isAdmin, isLeaderAt12, selectedEventTypeFilter]);

  const handleViewFilterChange = useCallback((newViewFilter) => {
    setViewFilter(newViewFilter);
    setCurrentPage(1);
  }, [setViewFilter, setCurrentPage]);

  const getAllLabel = useCallback(() => {
    if (isAdmin) return "VIEW ALL";
    if (isLeaderAt12) return "DISCIPLES";
    return "ALL";
  }, [isAdmin, isLeaderAt12]);

  const getPersonalLabel = useCallback(() => {
    if (isAdmin) return "PERSONAL";
    if (isLeaderAt12) return "PERSONAL";
    return "PERSONAL";
  }, [isAdmin, isLeaderAt12]);

  // Early returns AFTER all hooks have been called
  if (isRegularUser || isRegistrant) {
    return null;
  }

  if (
    selectedEventTypeFilter &&
    selectedEventTypeFilter !== "" &&
    selectedEventTypeFilter !== "CELLS"
  ) {
    return null;
  }

  if (!shouldShowToggle) {
    return null;
  }

  return (
    <div style={styles.viewFilterContainer}>
      <span style={styles.viewFilterLabel}>View:</span>
      <label style={styles.viewFilterRadio}>
        <input
          type="radio"
          name="viewFilter"
          value="all"
          checked={viewFilter === "all"}
          onChange={(e) => handleViewFilterChange(e.target.value)}
          aria-label={getAllLabel()}
        />
        <span style={styles.viewFilterText}>{getAllLabel()}</span>
      </label>
      <label style={styles.viewFilterRadio}>
        <input
          type="radio"
          name="viewFilter"
          value="personal"
          checked={viewFilter === "personal"}
          onChange={(e) => handleViewFilterChange(e.target.value)}
          aria-label={getPersonalLabel()}
        />
        <span style={styles.viewFilterText}>{getPersonalLabel()}</span>
      </label>
    </div>
  );
};

export default ViewFilterButtons;
