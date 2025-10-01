// EventHistory.jsx - Fixed Version
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

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
  const theme = useTheme();
  const [events, setEvents] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [activeFilter, setActiveFilter] = useState("complete");
  const location = useLocation();

  const isDarkMode = theme.palette.mode === 'dark';

  const getEventHistory = () => {
    const history = localStorage.getItem("eventHistory");
    return history ? JSON.parse(history) : [];
  };

  const groupHistoryByEvent = () => {
    const rawHistory = getEventHistory();
    const grouped = {};
    
    rawHistory.forEach((entry) => {
      const eventKey = entry.eventId || entry.service_name;
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

  useEffect(() => {
    const onHistoryUpdated = () => {
      setEvents(groupHistoryByEvent());
    };

    window.addEventListener("eventHistoryUpdated", onHistoryUpdated);
    setEvents(groupHistoryByEvent());

    return () => {
      window.removeEventListener("eventHistoryUpdated", onHistoryUpdated);
    };
  }, []);

  useEffect(() => {
    setEvents(groupHistoryByEvent());
  }, [location]);

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

  const completeEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "attended")
  );
  
  const incompleteEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "did-not-meet")
  );
  
  const didNotMeetEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "did-not-meet")
  );

  const openEventDetails = (eventId) => {
    const selectedEvent = events.find((e) => e._id === eventId);
    navigate("/event-details", { state: { event: selectedEvent } });
  };

  const eventsToShow =
    activeFilter === "complete"
      ? completeEvents
      : activeFilter === "incomplete"
      ? incompleteEvents
      : activeFilter === "did-not-meet"
      ? didNotMeetEvents
      : filteredEvents;

  const styles = getStyles(theme);

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Events History</h1>

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
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1d4ed8"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
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

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.tableHeaderCell}>Event Name</th>
              <th style={styles.tableHeaderCell}>Leader @12</th>
              <th style={styles.tableHeaderCell}>Leader's Email</th>
              <th style={styles.tableHeaderCell}>Day</th>
              <th style={styles.tableHeaderCell}>Date Of Event</th>
              <th style={{ ...styles.tableHeaderCell, textAlign: "center" }}>View Attendees</th>
            </tr>
          </thead>

          <tbody>
            {eventsToShow.map((event) => {
              const latest = [...event.history]
                .filter((h) =>
                  activeFilter === "complete"
                    ? h.status === "attended"
                    : h.status === "did-not-meet"
                )
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

              return (
                <tr 
                  key={event._id} 
                  style={styles.tr}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? theme.palette.grey[800] : theme.palette.grey[50]}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? theme.palette.grey[900] : '#fff'}
                >
                  <td style={styles.td}>{event.service_name}</td>
                  <td style={styles.td}>{event.leader12 || "-"}</td>
                  <td style={styles.td}>{event.leader12_email || "-"}</td>
                  <td style={styles.td}>{event.day}</td>
                  <td style={styles.td}>
                    {latest?.closedAt || 
                      (latest && new Date(latest.timestamp).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit", 
                        year: "numeric",
                      }).replace(/\//g, " - "))}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <button
                      style={styles.iconBtn}
                      onClick={() => openEventDetails(event._id)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
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

      {eventsToShow.length === 0 && (
        <div style={styles.noEventsMessage}>
          No events found for the selected filter.
        </div>
      )}

      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        style={styles.hiddenDateInput}
      />

      <section style={styles.summarySection}>
        <h2 style={styles.summaryHeader}>Summary</h2>
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

      <button 
        style={styles.backBtn} 
        onClick={() => navigate("/events")}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? theme.palette.grey[800] : theme.palette.grey[50];
          e.currentTarget.style.borderColor = isDarkMode ? theme.palette.grey[700] : theme.palette.grey[300];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? theme.palette.grey[900] : '#fff';
          e.currentTarget.style.borderColor = isDarkMode ? theme.palette.grey[800] : theme.palette.grey[200];
        }}
      >
        Back to Events
      </button>
    </div>
  );
};

const getStyles = (theme) => {
  const isDarkMode = theme.palette.mode === 'dark';
  
  return {
    container: {
      maxWidth: "100%",
      minHeight: "100vh",
      padding: "1.5rem",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: isDarkMode ? theme.palette.grey[900] : theme.palette.grey[100],
    },
    header: {
      fontSize: "2rem",
      fontWeight: "600",
      textAlign: "left",
      marginBottom: "1.5rem",
      color: isDarkMode ? '#fff' : '#000',
      paddingLeft: "0.5rem",
    },
    searchSection: {
      marginBottom: "1.5rem",
      backgroundColor: isDarkMode ? theme.palette.grey[800] : '#fff',
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
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
      border: isDarkMode ? `1px solid ${theme.palette.grey[700]}` : `1px solid ${theme.palette.grey[300]}`,
      outline: "none",
      flex: "1",
      backgroundColor: isDarkMode ? theme.palette.grey[900] : '#fff',
      color: isDarkMode ? '#fff' : '#000',
      maxWidth: "500px",
      minWidth: "250px",
    },
    filterButton: {
      padding: "0.75rem 2rem",
      fontSize: "0.95rem",
      borderRadius: "6px",
      border: "none",
      backgroundColor: "#2563eb",
      color: "#fff",
      fontWeight: "600",
      cursor: "pointer",
      textTransform: "capitalize",
      transition: "background-color 0.2s",
    },
    filterTabs: {
      display: "flex",
      justifyContent: "flex-start",
      gap: "0.75rem",
      marginBottom: "0",
      flexWrap: "wrap",
    },
    filterBtn: {
      padding: "0.65rem 1.5rem",
      border: isDarkMode ? `1px solid ${theme.palette.grey[700]}` : `1px solid ${theme.palette.grey[300]}`,
      backgroundColor: isDarkMode ? theme.palette.grey[800] : '#fff',
      color: isDarkMode ? theme.palette.grey[400] : theme.palette.grey[700],
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "0.9rem",
      textTransform: "uppercase",
      borderRadius: "6px",
      transition: "all 0.2s",
    },
    activeIncompleteBtn: {
      backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",   
      borderColor: isDarkMode ? "#4b5563" : "#d1d5db",        
      color: isDarkMode ? "#e5e7eb" : "#374151",              
    },
    activeCompleteBtn: {
      backgroundColor: isDarkMode ? "#065f46" : "#059669",
      borderColor: isDarkMode ? "#047857" : "#047857",
      color: "#fff",  
    },
    activeDidNotMeetBtn: {
      backgroundColor: isDarkMode ? "#7f1d1d" : "#dc2626",   
      borderColor: isDarkMode ? "#991b1b" : "#b91c1c",       
      color: "#fff",                                                  
    },
    tableContainer: {
      overflowX: "auto",
      borderRadius: "12px",
      boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
      marginBottom: "2rem",
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0",
      backgroundColor: isDarkMode ? theme.palette.grey[900] : '#fff',
      borderRadius: "12px",
      overflow: "hidden",
    },
    tableHeaderRow: {
      backgroundColor: isDarkMode ? theme.palette.grey[800] : theme.palette.grey[700],
    },
    tableHeaderCell: {
      color: "#fff",
      padding: "16px 20px",
      fontSize: "0.9rem",
      textAlign: "left",
      fontWeight: "600",
      borderBottom: isDarkMode ? `2px solid ${theme.palette.grey[900]}` : "2px solid #1f2937",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    tr: {
      backgroundColor: isDarkMode ? theme.palette.grey[900] : '#fff',
      transition: "background-color 0.15s",
      cursor: "pointer",
    },
    td: {
      padding: "16px 20px",
      borderBottom: isDarkMode ? `1px solid ${theme.palette.grey[800]}` : `1px solid ${theme.palette.grey[100]}`,
      fontSize: "0.95rem",
      color: isDarkMode ? theme.palette.grey[300] : theme.palette.grey[800],
    },
    iconBtn: {
      background: "#3b82f6",
      border: "none",
      cursor: "pointer",
      color: "#fff",
      fontSize: "1.1rem",
      padding: "8px 12px",
      borderRadius: "6px",
      transition: "background-color 0.2s",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
    noEventsMessage: {
      textAlign: 'center',
      padding: '2rem',
      fontSize: '1.1rem',
      color: isDarkMode ? theme.palette.grey[400] : theme.palette.grey[600],
      backgroundColor: isDarkMode ? theme.palette.grey[800] : '#fff',
      borderRadius: '12px',
      marginBottom: '2rem',
      boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
    },
    hiddenDateInput: {
      display: "none",
    },
    summarySection: {
      marginTop: "2rem",
      backgroundColor: isDarkMode ? theme.palette.grey[800] : '#fff',
      padding: "2rem",
      borderRadius: "12px",
      boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
    },
    summaryHeader: {
      textAlign: "left",
      fontSize: "1.5rem",
      fontWeight: "600",
      marginBottom: "1.5rem",
      color: isDarkMode ? '#fff' : '#000',
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1.5rem",
    },
    summaryCard: {
      backgroundColor: isDarkMode ? theme.palette.grey[900] : theme.palette.grey[50],
      padding: "1.5rem",
      borderRadius: "10px",
      border: isDarkMode ? `1px solid ${theme.palette.grey[800]}` : `1px solid ${theme.palette.grey[200]}`,
      textAlign: "center",
    },
    summaryNumber: {
      fontSize: "2.5rem",
      fontWeight: "700",
      color: "#3b82f6",
      marginBottom: "0.5rem",
    },
    summaryLabel: {
      fontSize: "1rem",
      fontWeight: "500",
      color: isDarkMode ? theme.palette.grey[400] : theme.palette.grey[600],
    },
    backBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      margin: "2rem 0 1rem",
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      border: isDarkMode ? `1px solid ${theme.palette.grey[800]}` : `1px solid ${theme.palette.grey[200]}`,
      backgroundColor: isDarkMode ? theme.palette.grey[900] : '#fff',
      color: isDarkMode ? '#fff' : '#000',
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
    },
  };
};

export default EventHistory;