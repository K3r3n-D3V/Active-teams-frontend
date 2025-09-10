// EventHistory.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarAlt } from "react-icons/fa";

// ✅ Save event history utility
export const saveToEventHistory = ({
  eventId,
  service_name,
  eventType,
  status,
  attendees = [],
  reason = "",
  leader12 = "-",
  leader144 = "-",
  leader1728 = "-",
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
    leader144: leader144 || "-",
    leader1728: leader1728 || "-",
    timestamp: new Date().toISOString(),
  };

  currentHistory.push(newEntry);
  localStorage.setItem("eventHistory", JSON.stringify(currentHistory));
};

const EventHistory = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [activeFilter, setActiveFilter] = useState("incomplete");

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
          leader144: entry.leader144 || "-",
          leader1728: entry.leader1728 || "-",
          day: new Date(entry.timestamp).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          email: user?.email || "-",
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

  const incompleteEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "did-not-meet")
  );
  const completeEvents = filteredEvents.filter((event) =>
    event.history.some((h) => h.status === "attended")
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
      : didNotMeetEvents;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Events History</h1>

      {/* Search and Filter */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by Event Name or Event Type..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            style={styles.searchInput}
          />
          <button style={styles.filterButton}>FILTER</button>
        </div>

        <div style={styles.filterTabs}>
          <button
            onClick={() => setActiveFilter("incomplete")}
            style={
              activeFilter === "incomplete"
                ? { ...styles.filterBtn, ...styles.activeIncompleteBtn }
                : styles.filterBtn
            }
          >
            INCOMPLETE
          </button>
          <button
            onClick={() => setActiveFilter("complete")}
            style={
              activeFilter === "complete"
                ? { ...styles.filterBtn, ...styles.activeCompleteBtn }
                : styles.filterBtn
            }
          >
            COMPLETE
          </button>
          <button
            onClick={() => setActiveFilter("did-not-meet")}
            style={
              activeFilter === "did-not-meet"
                ? { ...styles.filterBtn, ...styles.activeDidNotMeetBtn }
                : styles.filterBtn
            }
          >
            DID NOT MEET
          </button>
        </div>
      </div>

      {/* Table */}
      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeaderRow}>
            <th style={styles.tableHeaderCell}>Event Name</th>
            <th style={styles.tableHeaderCell}>Leader @12</th>
            <th style={styles.tableHeaderCell}>Leader @144</th>
            <th style={styles.tableHeaderCell}>Leader @1728</th>
            <th style={styles.tableHeaderCell}>Day</th>
            <th style={{ ...styles.tableHeaderCell, width: "200px" }}>Email</th>
            <th style={{ ...styles.tableHeaderCell, width: "60px" }}>Date</th>
            <th style={{ ...styles.tableHeaderCell, width: "60px" }}>Open</th>
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
              <tr key={event._id} style={styles.tr}>
                <td style={styles.td}>{event.service_name}</td>
                <td style={styles.td}>{event.leader12}</td>
                <td style={styles.td}>{event.leader144}</td>
                <td style={styles.td}>{event.leader1728}</td>
                <td style={styles.td}>{event.day}</td>
                <td style={{ ...styles.td, width: "200px" }}>{event.email}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  <span>
                    {new Date(latest.timestamp).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).replace(/\//g, " - ")}
                  </span>
                </td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  <button
                    style={styles.iconBtn}
                    onClick={() => openEventDetails(event._id)}
                  >
                    <FaRegCalendarAlt />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        style={styles.hiddenDateInput}
      />

      {/* Summary */}
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

      <button style={styles.backBtn} onClick={() => navigate("/events")}>
        🔙 Back to Events
      </button>
    </div>
  );
};

// ✅ Styles object (same as yours, with small tweaks)
const styles = {
  container: {
    maxWidth: "100%",
    minHeight: "100vh",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f0f0f5",
  },
  header: {
    fontSize: "3rem",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "2rem",
    color: "#000",
  },
  searchSection: {
    marginBottom: "2rem",
  },
  searchContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
    alignItems: "center",
  },
  searchInput: {
    padding: "0.8rem 1.5rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "2px solid #ddd",
    outline: "none",
    width: "400px",
    backgroundColor: "#fff",
  },
  filterButton: {
    padding: "0.8rem 2rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
    textTransform: "uppercase",
  },
  filterTabs: {
    display: "flex",
    justifyContent: "center",
    gap: "0",
    marginBottom: "1.5rem",
  },
  filterBtn: {
    padding: "0.8rem 2rem",
    border: "2px solid #ccc",
    backgroundColor: "#fff",
    color: "#666",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "0.9rem",
    textTransform: "uppercase",
    borderRadius: "0",
    transition: "all 0.3s",
  },
  activeIncompleteBtn: {
    backgroundColor: "#ffc107",
    borderColor: "#ffc107",
    color: "#000",
  },
  activeCompleteBtn: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
    color: "#fff",
  },
  activeDidNotMeetBtn: {
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
    color: "#fff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "2rem",
    backgroundColor: "#fff",
  },
  tableHeaderRow: {
    backgroundColor: "#000",
  },
  tableHeaderCell: {
    color: "#fff",
    padding: "15px 20px",
    fontSize: "1rem",
    textAlign: "left",
    fontWeight: "600",
    border: "1px solid #333",
  },
  tr: {
    backgroundColor: "#fff",
    transition: "background-color 0.25s",
  },
  td: {
    padding: "15px 20px",
    borderBottom: "1px solid #ddd",
    fontSize: "0.95rem",
    color: "#333",
    border: "1px solid #ddd",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#007bff",
    fontSize: "1.5rem",
    padding: "5px",
  },
  hiddenDateInput: {
    display: "none",
  },
  summarySection: {
    marginTop: "3rem",
  },
  summaryHeader: {
    textAlign: "center",
    fontSize: "1.8rem",
    fontWeight: "700",
    marginBottom: "1.5rem",
    color: "#2c3e50",
  },
  summaryGrid: {
    display: "flex",
    justifyContent: "center",
    gap: "3rem",
    flexWrap: "wrap",
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: "1.5rem 2.5rem",
    borderRadius: "20px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
    minWidth: "160px",
    textAlign: "center",
  },
  summaryNumber: {
    fontSize: "2.8rem",
    fontWeight: "700",
    color: "#4a90e2",
    marginBottom: "4px",
  },
  summaryLabel: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#7f8c8d",
  },
  backBtn: {
    display: "block",
    margin: "2rem auto 1rem",
    padding: "0.9rem 2.5rem",
    borderRadius: "30px",
    border: "none",
    backgroundColor: "#4a90e2",
    color: "#fff",
    fontSize: "1.1rem",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default EventHistory;
