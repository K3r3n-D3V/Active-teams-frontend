import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const EventDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { event } = location.state || {};

  if (!event) {
    return (
      <div style={styles.container}>
        <h2>No event details found.</h2>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // Get the latest event instance (in case there are multiple histories)
  const latest = [...event.history].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )[0];

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Event Details</h1>

      <div style={styles.detailsBox}>
        <p><strong>Event Name:</strong> {event.service_name}</p>
        <p><strong>Event Type:</strong> {event.eventType}</p>
        {/* <p><strong>Leader:</strong> {event.leader}</p> */}
        <p><strong>Date:</strong> {new Date(latest.timestamp).toLocaleDateString("en-GB")}</p>
        <p><strong>Status:</strong> {latest.status === "attended" ? "Attended" : "Did Not Meet"}</p>
      </div>

      <h2 style={styles.attendeesHeader}>Attendees</h2>
      {latest.attendees && latest.attendees.length > 0 ? (
        <ul style={styles.attendeeList}>
          {latest.attendees.map((person, index) => (
            <li key={index} style={styles.attendeeItem}>
              {person.fullName || `${person.name} ${person.surname}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>No attendees captured for this event.</p>
      )}

      <button style={styles.backBtn} onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 800,
    margin: "2rem auto",
    padding: "1.5rem",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    textAlign: "center",
    color: "#2c3e50",
  },
  detailsBox: {
    backgroundColor: "#fff",
    padding: "1rem 1.5rem",
    borderRadius: 8,
    marginBottom: "1.5rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  attendeesHeader: {
    fontSize: "1.4rem",
    marginBottom: "1rem",
    color: "#34495e",
  },
  attendeeList: {
    listStyleType: "none",
    padding: 0,
  },
  attendeeItem: {
    padding: "0.5rem 0",
    borderBottom: "1px solid #ddd",
    color: "#2c3e50",
    fontSize: "1rem",
  },
  backBtn: {
    marginTop: "2rem",
    padding: "0.7rem 1.8rem",
    fontSize: "1rem",
    backgroundColor: "#4a90e2",
    color: "#fff",
    border: "none",
    borderRadius: 24,
    cursor: "pointer",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
};

export default EventDetails;
