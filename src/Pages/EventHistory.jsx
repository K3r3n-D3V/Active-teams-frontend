import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useTheme } from "@mui/material/styles";

// Utility to save event history to localStorage
export const saveToEventHistory = ({
  eventId,
  service_name,
  eventType,
  status,
  attendees = [],
  reason = "",
  leader12 = "-",
  leader12_email = "-",
  userEmail = "",
  userName = "",
  userLeader144 = "-",
  closedAt = "",
}) => {
  const currentHistory = JSON.parse(localStorage.getItem("eventHistory")) || [];

  const newEntry = {
    eventId,
    service_name,
    eventType,
    status,
    attendees,
    reason,
    leader12: leader12 || "-",
    leader12_email: leader12_email || "-",
    userEmail: userEmail || "-",
    userName: userName || "-",
    userLeader144: userLeader144 || "-",
    closedAt,
    timestamp: new Date().toISOString(),
  };

  currentHistory.push(newEntry);
  localStorage.setItem("eventHistory", JSON.stringify(currentHistory));

  window.dispatchEvent(new Event("eventHistoryUpdated"));
  console.log("Saved event history:", newEntry);
};

const EventHistory = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const [events, setEvents] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [activeFilter, setActiveFilter] = useState("complete");

  const isDarkMode = theme.palette.mode === "dark";

  // Read event history from localStorage
  const getEventHistory = () => {
    const history = localStorage.getItem("eventHistory");
    return history ? JSON.parse(history) : [];
  };

  // Group raw event history entries by eventId or service_name
  const groupHistoryByEvent = () => {
    const rawHistory = getEventHistory();
    const grouped = {};

    rawHistory.forEach((entry) => {
      const eventKey = entry.eventId || entry.service_name || "unknown";

      if (!grouped[eventKey]) {
        grouped[eventKey] = {
          _id: eventKey,
          service_name: entry.service_name,
          eventType: entry.eventType,
          leader12: entry.leader12 || "-",
          leader12_email: entry.leader12_email || "-",
          day: new Date(entry.timestamp).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          email: entry.userEmail || user?.email || "-",
          history: [],
        };
      }
      grouped[eventKey].history.push({
        status: entry.status,
        timestamp: entry.timestamp,
        attendees: entry.attendees,
        reason: entry.reason,
        closedAt: entry.closedAt,
      });
    });

    return Object.values(grouped);
  };

  // Load events on mount and on custom event
  useEffect(() => {
  // Handler to update events from grouped history
  const handleEventHistoryUpdated = () => {
    setEvents(groupHistoryByEvent());
  };

  // Add event listener on mount
  window.addEventListener("eventHistoryUpdated", handleEventHistoryUpdated);

  // Initial load
  handleEventHistoryUpdated();

  // Cleanup on unmount
  return () => {
    window.removeEventListener("eventHistoryUpdated", handleEventHistoryUpdated);
  };
}, []);

// Update events when location changes (full path)
useEffect(() => {
  setEvents(groupHistoryByEvent());
}, [location]);

// Refresh events if location.state.refresh or timestamp changes
useEffect(() => {
  if (location.state?.refresh) {
    console.log("Refreshing event history from localStorage due to refresh state");
    setEvents(groupHistoryByEvent());
  }
}, [location.state?.refresh, location.state?.timestamp]);


  // Filtering logic
  const filteredEvents = events.filter((event) => {
    const matchesName = filterName
      ? event.service_name.toLowerCase().includes(filterName.toLowerCase()) ||
        event.leader12.toLowerCase().includes(filterName.toLowerCase())
      : true;

    const matchesDate = filterDate
      ? event.history.some((h) =>
          new Date(h.timestamp).toISOString().startsWith(filterDate)
        )
      : true;

    return matchesName && matchesDate;
  });

  // Filtered by status
  const completeEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "attended")
  );

  const incompleteEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "did-not-meet")
  );

  const didNotMeetEvents = incompleteEvents; // same as incomplete based on status

  // Events to display depending on filter
  const eventsToShow =
    activeFilter === "complete"
      ? completeEvents
      : activeFilter === "incomplete"
      ? incompleteEvents
      : activeFilter === "did-not-meet"
      ? didNotMeetEvents
      : filteredEvents;

  // Navigate to event details page with event data in state
  const openEventDetails = (eventId) => {
    const selectedEvent = events.find((e) => e._id === eventId);
    navigate("/event-details", { state: { event: selectedEvent } });
  };

  // Styles with theme awareness
  const styles = getStyles(theme);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Events History</h1>

      {/* Search and filter controls */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by Event Name or Event Leader..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            style={styles.searchInput}
          />
          <button
            style={styles.filterButton}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1d4ed8")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#2563eb")
            }
          >
            Filter
          </button>
        </div>

        <div style={styles.filterTabs}>
          <button
            onClick={() => setActiveFilter("complete")}
            style={
              activeFilter === "complete"
                ? { ...styles.filterBtn, ...styles.activeCompleteBtn }
                : styles.filterBtn
            }
          >
            COMPLETE ({completeEvents.length})
          </button>
          <button
            onClick={() => setActiveFilter("incomplete")}
            style={
              activeFilter === "incomplete"
                ? { ...styles.filterBtn, ...styles.activeIncompleteBtn }
                : styles.filterBtn
            }
          >
            INCOMPLETE ({incompleteEvents.length})
          </button>
          <button
            onClick={() => setActiveFilter("did-not-meet")}
            style={
              activeFilter === "did-not-meet"
                ? { ...styles.filterBtn, ...styles.activeDidNotMeetBtn }
                : styles.filterBtn
            }
          >
            DID NOT MEET ({didNotMeetEvents.length})
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.tableHeaderCell}>Event Name</th>
              {/* <th style={styles.tableHeaderCell}>Leader @12</th> */}
              {/* <th style={styles.tableHeaderCell}>Leader's Email</th> */}
              <th style={styles.tableHeaderCell}>Day</th>
              <th style={styles.tableHeaderCell}>Date Of Event</th>
              <th style={{ ...styles.tableHeaderCell, textAlign: "center" }}>
                View Attendees
              </th>
            </tr>
          </thead>
          <tbody>
            {eventsToShow.map((event) => {
              // Pick latest event record matching active filter
              const filteredHistories = event.history.filter((h) =>
                activeFilter === "complete"
                  ? h.status === "attended"
                  : h.status === "did-not-meet"
              );

              const latest = filteredHistories.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )[0];

              return (
               <tr
                  key={event._id}
                  style={styles.tr}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isDarkMode
                      ? theme.palette.grey[800]
                      : theme.palette.grey[50])
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = isDarkMode
                      ? theme.palette.grey[900]
                      : "#fff")
                  }
                >
                  <td style={styles.td}>{event.service_name}</td>
                  <td style={styles.td}>{event.day}</td>
                  <td style={styles.td}>
                    {latest?.closedAt ||
                      (latest &&
                        new Date(latest.timestamp)
                          .toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                          .replace(/\//g, " - "))}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      style={styles.iconBtn}
                      onClick={() => openEventDetails(event._id)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#2563eb")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#3b82f6")
                      }
                    >
                      <FaRegCalendarAlt />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* No events message */}
      {eventsToShow.length === 0 && (
        <div style={styles.noEventsMessage}>
          No events found for the selected filter.
        </div>
      )}

      {/* Hidden date input for date filter */}
      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        style={styles.hiddenDateInput}
      />

      {/* Summary Section */}
      <section style={styles.summarySection}>
        <h2 style={styles.summaryHeader}>📊 Summary</h2>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>{completeEvents.length}</div>
            <div style={styles.summaryLabel}>Events Attended</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>{didNotMeetEvents.length}</div>
            <div style={styles.summaryLabel}>Events Did Not Meet</div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryNumber}>{events.length}</div>
            <div style={styles.summaryLabel}>Total Events</div>
          </div>
        </div>
      </section>

      {/* Back button */}
      <button
        style={styles.backBtn}
        onClick={() => navigate("/events")}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode
            ? theme.palette.grey[800]
            : theme.palette.grey[50];
          e.currentTarget.style.borderColor = isDarkMode
            ? theme.palette.grey[700]
            : theme.palette.grey[300];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode
            ? theme.palette.grey[900]
            : "#fff";
          e.currentTarget.style.borderColor = isDarkMode
            ? theme.palette.grey[800]
            : theme.palette.grey[200];
        }}
      >
        🔙 Back to Events
      </button>
    </div>
  );
};

// Theme-aware inline styles generator
const getStyles = (theme) => {
  const isDarkMode = theme.palette.mode === "dark";

  return {
    container: {
      maxWidth: "100%",
      minHeight: "100vh",
      padding: "1.5rem",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: isDarkMode
        ? theme.palette.grey[900]
        : theme.palette.grey[100],
    },
    header: {
      fontSize: "2rem",
      fontWeight: "600",
      textAlign: "left",
      marginBottom: "1.5rem",
      color: isDarkMode ? "#fff" : "#000",
      paddingLeft: "0.5rem",
    },
    searchSection: {
      marginBottom: "1.5rem",
      backgroundColor: isDarkMode ? theme.palette.grey[800] : "#fff",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: isDarkMode
        ? "0 2px 8px rgba(0,0,0,0.3)"
        : "0 2px 8px rgba(0,0,0,0.06)",
    },
    searchContainer: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginBottom: "1.5rem",
      flexWrap: "wrap",
    },
    searchInput: {
      padding: "0.75rem 1rem",
      fontSize: "0.95rem",
      borderRadius: "6px",
      border: isDarkMode
        ? `1px solid ${theme.palette.grey[700]}`
        : `1px solid ${theme.palette.grey[300]}`,
      outline: "none",
      flex: "1",
      backgroundColor: isDarkMode ? theme.palette.grey[900] : "#fff",
      color: isDarkMode ? "#fff" : "#000",
      maxWidth: "500px",
      minWidth: "250px",
    },
    filterButton: {
      padding: "0.75rem 2rem",
      fontSize: "0.95rem",
      borderRadius: "6px",
      cursor: "pointer",
      border: "none",
      backgroundColor: "#2563eb",
      color: "#fff",
      transition: "background-color 0.3s ease",
      flexShrink: 0,
    },
    filterTabs: {
      display: "flex",
      gap: "1rem",
      justifyContent: "center",
      flexWrap: "wrap",
    },
    filterBtn: {
      padding: "0.5rem 1rem",
      fontSize: "0.9rem",
      fontWeight: "600",
      borderRadius: "8px",
      cursor: "pointer",
      border: `1px solid ${isDarkMode ? theme.palette.grey[700] : theme.palette.grey[300]}`,
      backgroundColor: isDarkMode ? theme.palette.grey[900] : "#fff",
      color: isDarkMode ? "#ddd" : "#333",
      transition: "all 0.3s ease",
    },
    activeCompleteBtn: {
      backgroundColor: "#22c55e",
      color: "#fff",
      borderColor: "#22c55e",
    },
    activeIncompleteBtn: {
      backgroundColor: "#56759a60",
      color: "#fff",
      borderColor: "#68789e11",
    },
    activeDidNotMeetBtn: {
      backgroundColor: "#ef4444",
      color: "#fff",
      borderColor: "#ef4444",
    },
    tableContainer: {
      overflowX: "auto",
      borderRadius: "12px",
      boxShadow: isDarkMode
        ? "0 2px 8px rgba(0,0,0,0.3)"
        : "0 2px 8px rgba(0,0,0,0.1)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "700px",
    },
    tableHeaderRow: {
      backgroundColor: isDarkMode ? theme.palette.grey[800] : "#000"
    },
    tableHeaderCell: {
      padding: "0.75rem 1rem",
      fontWeight: "700",
      fontSize: "0.9rem",
      color: isDarkMode ? "#ddd" : "#fff",
      textAlign: "left",
      borderBottom: `2px solid ${isDarkMode ? theme.palette.grey[700] : theme.palette.grey[300]}`,
    },
    tr: {
      transition: "background-color 0.2s ease",
      cursor: "default",
    },
    td: {
      padding: "0.75rem 1rem",
      borderBottom: `1px solid ${isDarkMode ? theme.palette.grey[700] : theme.palette.grey[300]}`,
      fontSize: "0.9rem",
      color: isDarkMode ? "#eee" : "#222",
      verticalAlign: "middle",
    },
    iconBtn: {
      backgroundColor: "#3b82f6",
      border: "none",
      padding: "0.5rem",
      borderRadius: "6px",
      color: "#fff",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      fontSize: "1.1rem",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
    noEventsMessage: {
      marginTop: "1rem",
      fontStyle: "italic",
      color: isDarkMode ? "#aaa" : "#555",
      textAlign: "center",
    },
    hiddenDateInput: {
      position: "absolute",
      left: "-9999px",
      width: "0",
      height: "0",
      opacity: 0,
      pointerEvents: "none",
    },
    summarySection: {
      marginTop: "2rem",
      padding: "1rem",
      backgroundColor: isDarkMode ? theme.palette.grey[800] : "#fff",
      borderRadius: "12px",
      boxShadow: isDarkMode
        ? "0 2px 8px rgba(0,0,0,0.3)"
        : "0 2px 8px rgba(0,0,0,0.06)",
    },
    summaryHeader: {
      fontSize: "1.5rem",
      fontWeight: "700",
      marginBottom: "1rem",
      color: isDarkMode ? "#fff" : "#222",
    },
    summaryGrid: {
      display: "flex",
      justifyContent: "space-around",
      gap: "1rem",
      flexWrap: "wrap",
    },
    summaryCard: {
      flex: "1 1 150px",
      textAlign: "center",
      padding: "1rem",
      borderRadius: "8px",
      backgroundColor: isDarkMode ? theme.palette.grey[700] : "#f3f4f6",
      boxShadow: isDarkMode
        ? "0 1px 6px rgba(0,0,0,0.5)"
        : "0 1px 6px rgba(0,0,0,0.1)",
    },
    summaryNumber: {
      fontSize: "2rem",
      fontWeight: "700",
      color: isDarkMode ? "#4ade80" : "#16a34a", // green tone
      marginBottom: "0.25rem",
    },
    summaryLabel: {
      fontSize: "1rem",
      fontWeight: "600",
      color: isDarkMode ? "#ddd" : "#555",
    },
    backBtn: {
      marginTop: "2rem",
      padding: "0.75rem 2rem",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      borderRadius: "8px",
      border: `1px solid ${isDarkMode ? theme.palette.grey[800] : theme.palette.grey[200]}`,
      backgroundColor: isDarkMode ? theme.palette.grey[900] : "#fff",
      color: isDarkMode ? "#ddd" : "#333",
      transition: "all 0.3s ease",
      alignSelf: "flex-start",
    },
  };
};

export default EventHistory;
