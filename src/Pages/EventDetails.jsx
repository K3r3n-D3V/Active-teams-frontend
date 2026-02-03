import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/EventDetails.module.css";

const EventDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { event } = location.state || {};

  if (!event) {
    return (
      <div className={styles.container}>
        <h2>No event details found.</h2>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  // Get the latest event instance (in case there are multiple histories)
  const latest = [...event.history].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )[0];

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>📋 Event Details</h1>

      <div className={styles.detailsBox}>
        <p><strong>Event Name:</strong> {event.service_name}</p>
        <p><strong>Event Type:</strong> {event.eventType}</p>
        {/* <p><strong>Leader:</strong> {event.leader}</p> */}
        <p><strong>Date:</strong> {new Date(latest.timestamp).toLocaleDateString("en-GB")}</p>
        <p><strong>Status:</strong> {latest.status === "attended" ? "Attended" : "Did Not Meet"}</p>
      </div>

      <h2 className={styles.attendeesHeader}>👥 Attendees</h2>
      {latest.attendees && latest.attendees.length > 0 ? (
        <ul className={styles.attendeeList}>
          {latest.attendees.map((person, index) => (
            <li key={index} className={styles.attendeeItem}>
              {person.fullName || `${person.name} ${person.surname}`}
            </li>
          ))}
        </ul>
      ) : (
        <p>No attendees captured for this event.</p>
      )}

      <button className={styles.backBtn} onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default EventDetails;
