import React from "react";
import { useNavigate } from "react-router-dom";

const EventHistory = ({ user }) => {
  const navigate = useNavigate();

  // Admin-only access control
  if (!user || user.role?.toLowerCase() !== "admin") {
    return (
      <div style={styles.container}>
        <h1 style={styles.deniedTitle}>Access Denied</h1>
        <p style={styles.deniedText}>You do not have permission to view this page.</p>
      </div>
    );
  }

  // Static data for now
  const events = [
    {
      _id: "1",
      service_name: "Cell Group A",
      eventType: "cell",
      history: [
        { status: "did-not-meet", timestamp: "2025-08-10T18:30:00Z" },
        { status: "attended", timestamp: "2025-08-17T18:30:00Z" },
      ],
    },
    {
      _id: "2",
      service_name: "Sunday Service",
      eventType: "service",
      history: [{ status: "attended", timestamp: "2025-08-18T09:00:00Z" }],
    },
  ];

  const didNotMeetCells = events.filter(
    (e) =>
      e.eventType === "cell" &&
      e.history?.some((h) => h.status === "did-not-meet")
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>📜 Event History</h1>

      {/* ❌ Did Not Meet Cells */}
      <section style={styles.section}>
        <h2 style={styles.missedHeader}>❌ Did Not Meet Cells</h2>
        {didNotMeetCells.length === 0 ? (
          <p style={styles.noData}>No missed cells.</p>
        ) : (
          <ul style={styles.list}>
            {didNotMeetCells.map((event) => (
              <li key={event._id} style={styles.eventItem}>
                <strong style={styles.eventTitle}>{event.service_name}</strong>
                <ul>
                  {event.history
                    .filter((h) => h.status === "did-not-meet")
                    .map((h, index) => (
                      <li key={index} style={styles.missedText}>
                        ❌ Did Not Meet at {new Date(h.timestamp).toLocaleString()}
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 📅 All Past Events */}
      <section style={styles.section}>
        <h2 style={styles.allEventsHeader}>📅 All Past Events</h2>
        <ul style={styles.cardList}>
          {events.map((event) => (
            <li key={event._id} style={styles.card}>
              <strong style={styles.cardTitle}>
                {event.service_name} <small>({event.eventType})</small>
              </strong>
              <ul>
                {event.history?.map((h, index) => (
                  <li key={index} style={h.status === "attended" ? styles.attended : styles.missedText}>
                    {h.status === "attended"
                      ? "✅ Attendance submitted"
                      : "❌ Did Not Meet"}{" "}
                    at {new Date(h.timestamp).toLocaleString()}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <button style={styles.backBtn} onClick={() => navigate("/events")}>
        🔙 Back to Events
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1000px",
    margin: "0 auto",
    color: "#f0f0f0",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    fontSize: "2rem",
    marginBottom: "2rem",
    color: "#fff",
  },
  missedHeader: {
    color: "#ef5350",
    fontSize: "1.5rem",
    marginBottom: "1rem",
  },
  allEventsHeader: {
    color: "#42a5f5",
    fontSize: "1.5rem",
    marginBottom: "1rem",
  },
  section: {
    marginBottom: "2.5rem",
  },
  noData: {
    color: "#aaa",
    fontStyle: "italic",
  },
  list: {
    listStyle: "none",
    paddingLeft: 0,
  },
  eventItem: {
    marginBottom: "1rem",
  },
  eventTitle: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    color: "#fff",
  },
  missedText: {
    color: "#f44336",
    fontSize: "0.95rem",
    marginTop: "0.3rem",
  },
  attended: {
    color: "#4caf50",
    fontSize: "0.95rem",
    marginTop: "0.3rem",
  },
  cardList: {
    listStyle: "none",
    paddingLeft: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
    color: "#fff",
  },
  cardTitle: {
    fontSize: "1.2rem",
    marginBottom: "0.5rem",
  },
  backBtn: {
    marginTop: "2rem",
    padding: "10px 20px",
    backgroundColor: "#1565c0",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deniedTitle: {
    color: "#ef5350",
    fontSize: "1.8rem",
    marginBottom: "1rem",
  },
  deniedText: {
    color: "#ccc",
  },
};

export default EventHistory;
