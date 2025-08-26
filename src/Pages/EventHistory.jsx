import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Utility to save history — this can be imported in other components
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
    status, // "attended" or "did-not-meet"
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

  const didNotMeetEvents = events.filter((event) =>
    event.history.some((h) => h.status === "did-not-meet")
  );

  const attendedEvents = events.filter((e) =>
    e.history?.some((h) => h.status === "attended")
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📜 Event History</h1>

      {events.length === 0 ? (
        <div style={styles.emptyState}>
          <h2 style={styles.emptyTitle}>🕐 No Event History Yet</h2>
          <p style={styles.emptyText}>
            Start capturing attendance or marking events as "did not meet" to see your history here.
          </p>
          <button style={styles.backBtn} onClick={() => navigate("/events")}>
            🔙 Go to Events
          </button>
        </div>
      ) : (
        <>
          {/* ❌ Did Not Meet Events */}
          <section style={styles.section}>
            <h2 style={styles.missedHeader}>❌ Events Marked as "Did Not Meet"</h2>
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
                      🗑️ Delete
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

          {/* ✅ Attended Events */}
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
                      🗑️ Delete
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

          {/* 📊 Summary */}
          <section style={styles.section}>
            <h2 style={styles.summaryHeader}>📊 Summary</h2>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryNumber}>{attendedEvents.length}</div>
                <div style={styles.summaryLabel}>Events with Attendance</div>
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

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    color: "#000",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#fff",
  },
  header: {
    fontSize: "2.5rem",
    marginBottom: "2rem",
    color: "#000",
    textAlign: "center",
  },
  missedHeader: {
    color: "#000",
    fontSize: "1.5rem",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  attendedHeader: {
    color: "#000",
    fontSize: "1.5rem",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  summaryHeader: {
    color: "#000",
    fontSize: "1.5rem",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  section: {
    marginBottom: "3rem",
  },
  noData: {
    color: "#000",
    fontStyle: "italic",
    textAlign: "center",
    padding: "2rem",
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
    border: "1px solid #000",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    color: "#000",
  },
  attendedCard: {
    backgroundColor: "#fff",
    // border: "1px solid #000",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    color: "#000",
  },
  deleteBtn: {
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "1rem",
  },
  cardHeader: {
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "1.3rem",
    color: "#000",
    display: "block",
  },
  historyList: {
    listStyle: "none",
    paddingLeft: 0,
    margin: 0,
  },
  historyItem: {
    marginBottom: "1rem",
    padding: "0.5rem 0",
    borderBottom: "1px solid #ccc",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  missedText: {
    color: "#000",
    fontWeight: "bold",
  },
  attendedText: {
    color: "#42a5f5",
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: "0.85rem",
    color: "#000",
  },
  reasonText: {
    fontStyle: "italic",
    color: "#000",
  },
  attendeesSection: {
    marginTop: "0.5rem",
  },
  attendeesTitle: {
    fontWeight: "bold",
  },
  attendeesList: {
    marginTop: "0.3rem",
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  attendeeBadge: {
    backgroundColor: "#eee",
    padding: "0.2rem 0.5rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    color: "#000",
  },
  backBtn: {
    marginTop: "2rem",
    padding: "0.8rem 1.6rem",
    fontSize: "1rem",
    backgroundColor: "#42a5f5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  summaryGrid: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  summaryCard: {
    flex: "1 1 200px",
    // border: "1px solid #000",
    borderRadius: "8px",
    padding: "1rem",
    textAlign: "center",
    backgroundColor: "#f9f9f9",
  },
  summaryNumber: {
    fontSize: "2rem",
    fontWeight: "bold",
  },
  summaryLabel: {
    marginTop: "0.5rem",
    fontSize: "1rem",
  },
};

export default EventHistory;
