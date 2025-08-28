import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Utility to save history
export const saveToEventHistory = ({
  eventId,
  service_name,
  eventType,
  status,
  attendees = [],
  reason = "",
}) => {
  const currentHistory = JSON.parse(localStorage.getItem("eventHistory")) || [];

  const newEntry = {
    eventId,
    service_name,
    eventType,
    status,
    attendees,
    reason,
    timestamp: new Date().toISOString(),
  };

  currentHistory.push(newEntry);
  localStorage.setItem("eventHistory", JSON.stringify(currentHistory));
};

const EventHistory = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [expandedDidNotMeet, setExpandedDidNotMeet] = useState(null);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");

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
          history: [],
        };
      }
      grouped[eventKey].history.push({
        status: entry.status,
        timestamp: entry.timestamp,
        attendees: entry.attendees,
        reason: entry.reason,
      });
    });
    return Object.values(grouped);
  };

  useEffect(() => {
    setEvents(groupHistoryByEvent());
  }, []);

  useEffect(() => {
    if (location.state && location.state.expandEventId) {
      setExpandedDidNotMeet(location.state.expandEventId);
    }
  }, [location.state]);

  const toggleExpandDidNotMeet = (id) => {
    setExpandedDidNotMeet((prev) => (prev === id ? null : id));
  };

  const handleDeleteEvent = (eventKey) => {
    const currentHistory = getEventHistory();
    const updatedHistory = currentHistory.filter(
      (entry) => (entry.eventId || entry.service_name) !== eventKey
    );
    localStorage.setItem("eventHistory", JSON.stringify(updatedHistory));
    setEvents(groupHistoryByEvent());
  };

  const filteredEvents = events.filter((event) => {
    const matchesName = filterName
      ? event.service_name.toLowerCase().includes(filterName.toLowerCase())
      : true;

    const matchesDate = filterDate
      ? event.history.some((h) =>
          new Date(h.timestamp).toISOString().startsWith(filterDate)
        )
      : true;

    return matchesName && matchesDate;
  });

  const didNotMeetEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "did-not-meet")
  );

  const attendedEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "attended")
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📜 Event History</h1>

      {/* Filter Section */}
      <div style={styles.filterSection}>
        <input
          type="text"
          placeholder="Search by event name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          style={styles.filterInput}
        />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={styles.filterInput}
        />
      </div>

      {events.length === 0 ? (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>🕐 No Event History</h2>
          <p style={styles.emptyText}>
            Capture attendance or mark events as "did not meet" to see your history.
          </p>
          <button style={styles.backBtn} onClick={() => navigate("/events")}>
            🔙 Go to Events
          </button>
        </div>
      ) : (
        <>
          {/* Did Not Meet Events */}
          <section style={styles.section}>
            <h2 style={styles.missedHeader}>❌ Events Did Not Meet</h2>
            {didNotMeetEvents.length === 0 ? (
              <p style={styles.noData}>No events marked as did not meet.</p>
            ) : (
              <ul style={styles.cardList}>
                {didNotMeetEvents.map((event) => (
                  <li key={event._id} style={styles.missedCard}>
                    <div
                      style={{ ...styles.cardHeader, cursor: "pointer" }}
                      onClick={() => toggleExpandDidNotMeet(event._id)}
                      aria-expanded={expandedDidNotMeet === event._id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpandDidNotMeet(event._id);
                        }
                      }}
                    >
                      <strong style={styles.cardTitle}>
                        {event.service_name} <small>({event.eventType})</small>
                      </strong>
                    </div>

                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteEvent(event._id)}
                    >
                      🗑️
                    </button>

                    {expandedDidNotMeet === event._id && (
                      <ul style={styles.historyList}>
                        {event.history
                          .filter((h) => h.status === "did-not-meet")
                          .map((h, index) => (
                            <li key={index} style={styles.historyItem}>
                              <div style={styles.statusRow}>
                                <span style={styles.missedText}>❌ Did Not Meet</span>
                                <span style={styles.timestamp}>
                                  {new Date(h.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {h.reason && (
                                <div style={styles.reasonText}>Reason: {h.reason}</div>
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Attended Events */}
          <section style={styles.section}>
            <h2 style={styles.attendedHeader}>✅ Events with Attendance</h2>
            {attendedEvents.length === 0 ? (
              <p style={styles.noData}>No attended events.</p>
            ) : (
              <ul style={styles.cardList}>
                {attendedEvents.map((event) => (
                  <li key={event._id} style={styles.attendedCard}>
                    <div style={styles.cardHeader}>
                      <strong style={styles.cardTitle}>
                        {event.service_name} <small>({event.eventType})</small>
                      </strong>
                    </div>

                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteEvent(event._id)}
                    >
                      🗑️
                    </button>

                    <ul style={styles.historyList}>
                      {event.history
                        .filter((h) => h.status === "attended")
                        .map((h, index) => (
                          <li key={index} style={styles.historyItem}>
                            <div style={styles.statusRow}>
                              <span style={styles.attendedText}>✅ Attendance Captured</span>
                              <span style={styles.timestamp}>
                                {new Date(h.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {h.attendees && h.attendees.length > 0 && (
                              <div style={styles.attendeesSection}>
                                <strong style={styles.attendeesTitle}>Attendees:</strong>
                                <div style={styles.attendeesList}>
                                  {h.attendees.map((attendee, idx) => (
                                    <span key={idx} style={styles.attendeeBadge}>
                                      {attendee}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Summary */}
          <section style={styles.section}>
            <h2 style={styles.summaryHeader}>📊 Summary</h2>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryNumber}>{attendedEvents.length}</div>
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

          <button style={styles.backBtn} onClick={() => navigate("/events")}>
            🔙 Back to Events
          </button>
        </>
      )}
    </div>
  );
};

// Modern responsive styles
const styles = {
  container: {
    padding: "2rem 1rem",
    maxWidth: "1100px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f5f6fa",
    color: "#333",
  },
  header: {
    fontSize: "2.2rem",
    textAlign: "center",
    marginBottom: "2rem",
    color: "#2f3640",
  },
  filterSection: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  filterInput: {
    padding: "0.6rem 1rem",
    fontSize: "1rem",
    borderRadius: "12px",
    border: "1px solid #dcdde1",
    flex: "1 1 200px",
    minWidth: "150px",
    outline: "none",
    transition: "all 0.2s",
  },
  section: {
    marginBottom: "3rem",
  },
  missedHeader: {
    fontSize: "1.4rem",
    marginBottom: "1rem",
    color: "#e84118",
    fontWeight: "600",
  },
  attendedHeader: {
    fontSize: "1.4rem",
    marginBottom: "1rem",
    color: "#44bd32",
    fontWeight: "600",
  },
  summaryHeader: {
    fontSize: "1.4rem",
    marginBottom: "1rem",
    color: "#40739e",
    fontWeight: "600",
  },
  cardList: {
    listStyle: "none",
    paddingLeft: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  missedCard: {
    backgroundColor: "#fff",
    borderLeft: "6px solid #e84118",
    padding: "1rem",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  },
  attendedCard: {
    backgroundColor: "#fff",
    borderLeft: "6px solid #44bd32",
    padding: "1rem",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    marginBottom: "0.8rem",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#2f3640",
  },
  historyList: {
    listStyle: "none",
    paddingLeft: 0,
    margin: 0,
  },
  historyItem: {
    marginBottom: "0.8rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #dcdde1",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "0.5rem",
    alignItems: "center",
  },
  missedText: { color: "#e84118", fontWeight: "600" },
  attendedText: { color: "#44bd32", fontWeight: "600" },
  timestamp: { fontSize: "0.85rem", color: "#718093" },
  reasonText: { fontStyle: "italic", color: "#718093" },
  attendeesSection: { marginTop: "0.5rem" },
  attendeesTitle: { fontWeight: "600" },
  attendeesList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginTop: "0.3rem",
  },
  attendeeBadge: {
    backgroundColor: "#f1f2f6",
    color: "#2f3640",
    padding: "0.2rem 0.6rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
  },
  deleteBtn: {
   backgroundColor: "#fff",
  color: "#e84118", 
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "0.5rem",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  backBtn: {
    marginTop: "2rem",
    padding: "0.8rem 1.6rem",
    fontSize: "1rem",
    backgroundColor: "#40739e",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
    width: "fit-content",
  },
  summaryGrid: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  summaryCard: {
    flex: "1 1 200px",
    borderRadius: "12px",
    padding: "1rem",
    textAlign: "center",
    backgroundColor: "#fff",
    boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
  },
  summaryNumber: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#2f3640",
  },
  summaryLabel: { marginTop: "0.3rem", fontSize: "1rem", color: "#718093" },
  emptyState: { textAlign: "center", padding: "2rem 1rem" },
  emptyTitle: { fontSize: "1.6rem", color: "#2f3640", marginBottom: "1rem" },
  emptyText: { color: "#718093", fontSize: "1rem" },
  noData: { textAlign: "center", color: "#718093", padding: "1rem 0" },
};

export default EventHistory;
