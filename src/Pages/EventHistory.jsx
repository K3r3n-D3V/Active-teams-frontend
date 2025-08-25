import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Utility to save history — this can be imported in other components
export const saveToEventHistory = ({ eventId, service_name, eventType, status, attendees = [], reason = "" }) => {
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
  const [events, setEvents] = useState([]);

  // Load event history from localStorage
  const getEventHistory = () => {
    const history = localStorage.getItem("eventHistory");
    return history ? JSON.parse(history) : [];
  };

  // Group history entries by event
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

  const didNotMeetEvents = events.filter((e) =>
    e.history?.some((h) => h.status.toLowerCase() === "did-not-meet")
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
          {/* ❌ Events Marked as Did Not Meet */}
          <section style={styles.section}>
            <h2 style={styles.missedHeader}>❌ Events Marked as "Did Not Meet"</h2>
            {didNotMeetEvents.length === 0 ? (
              <p style={styles.noData}>No events marked as did not meet.</p>
            ) : (
              <ul style={styles.cardList}>
                {didNotMeetEvents.map((event) => (
                  <li key={event._id} style={styles.missedCard}>
                    <div style={styles.cardHeader}>
                      <strong style={styles.cardTitle}>
                        {event.service_name} <small>({event.eventType})</small>
                      </strong>
                    </div>
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
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ✅ Events with Attendance */}
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

          {/* 📊 All Events Summary */}
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
    color: "#f0f0f0",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    fontSize: "2.5rem",
    marginBottom: "2rem",
    color: "#fff",
    textAlign: "center",
  },
  missedHeader: {
    color: "#ef5350",
    fontSize: "1.5rem",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  attendedHeader: {
    color: "#4caf50",
    fontSize: "1.5rem",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  summaryHeader: {
    color: "#42a5f5",
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
    color: "#aaa",
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
    backgroundColor: "#2d1b1b",
    border: "1px solid #ef5350",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(239, 83, 80, 0.2)",
  },
  attendedCard: {
    backgroundColor: "#1b2d1b",
    border: "1px solid #4caf50",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(76, 175, 80, 0.2)",
  },
  cardHeader: {
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "1.3rem",
    color: "#fff",
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
    borderBottom: "1px solid #333",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  missedText: {
    color: "#ef5350",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  attendedText: {
    color: "#4caf50",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  timestamp: {
    color: "#aaa",
    fontSize: "0.9rem",
  },
  reasonText: {
    color: "#ffb74d",
    fontSize: "0.9rem",
    fontStyle: "italic",
  },
  attendeesSection: {
    marginTop: "0.5rem",
  },
  attendeesTitle: {
    color: "#fff",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  attendeesList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  attendeeBadge: {
    backgroundColor: "#4caf50",
    color: "#fff",
    padding: "0.2rem 0.8rem",
    borderRadius: "16px",
    fontSize: "0.8rem",
    fontWeight: "500",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  summaryCard: {
    backgroundColor: "#1e1e1e",
    padding: "1.5rem",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid #333",
  },
  summaryNumber: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#42a5f5",
    marginBottom: "0.5rem",
  },
  summaryLabel: {
    color: "#aaa",
    fontSize: "0.9rem",
  },
  emptyState: {
    textAlign: "center",
    padding: "4rem 2rem",
    color: "#aaa",
  },
  emptyTitle: {
    fontSize: "2rem",
    marginBottom: "1rem",
    color: "#666",
  },
  emptyText: {
    fontSize: "1.1rem",
    marginBottom: "2rem",
    lineHeight: "1.6",
    maxWidth: "500px",
    margin: "0 auto 2rem auto",
  },
  backBtn: {
    padding: "12px 24px",
    backgroundColor: "#1565c0",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  },
};

export default EventHistory;
