import React from "react";
import { useParams } from "react-router-dom";

export default function EventRegistrationForm() {
  const { eventId } = useParams();

  const eventName = "Encounter";
  const price = 80;

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <h2 style={styles.heading}>🎟️ Register for Event</h2>
        <p style={styles.subtext}>Event ID: <strong>{eventId}</strong></p>

        {/* Event and Rate Info */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Event Details</h3>
          <div style={styles.formRow}>
            <input type="text" value={eventName} disabled style={styles.input} />
            <select style={styles.select}>
              <option value="adult">Adult</option>
              <option value="child">Child</option>
            </select>
            <select style={styles.select}>
              <option value="guide">Guide</option>
              <option value="leader">Leader</option>
            </select>
            <input type="text" value={`R${price.toFixed(2)}`} disabled style={styles.input} />
          </div>
        </section>

        {/* Registration Details */}
        <section style={styles.section}>
          <div style={styles.columns}>
            {/* Personal Info */}
            <div style={styles.column}>
              <h3 style={styles.sectionTitle}>👤 Personal Information</h3>
              <input type="text" placeholder="Full Name" style={styles.inputFull} />
              <input type="email" placeholder="Email Address" style={styles.inputFull} />
              <input type="text" placeholder="Home Address" style={styles.inputFull} />
              <p style={styles.total}>TOTAL: <strong>R{price.toFixed(2)}</strong></p>
            </div>

            {/* Payment */}
            <div style={styles.column}>
              <h3 style={styles.sectionTitle}>💳 Payment</h3>
              <div style={styles.paymentCard}>
                <p style={styles.paymentText}>Payment for <strong>{eventName}</strong></p>
                <p style={styles.paymentNote}>Secure payment via Yoco</p>
                <a
                  href="https://pay.yoco.com/your-link-here"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.payButton}
                >
                  Pay Now
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// 🔧 Styles
const styles = {
  pageWrapper: {
    backgroundColor: "#f2f4f8",
    minHeight: "100vh",
    padding: "40px 20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "#fff",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
    animation: "fadeIn 0.3s ease-in-out",
  },
  heading: {
    fontSize: "28px",
    marginBottom: "8px",
    color: "#333",
  },
  subtext: {
    fontSize: "14px",
    color: "#888",
    marginBottom: "24px",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "20px",
    color: "#444",
    marginBottom: "16px",
  },
  formRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  input: {
    flex: "1 1 180px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#f7f7f7",
  },
  inputFull: {
    width: "100%",
    padding: "10px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#f7f7f7",
  },
  select: {
    flex: "1 1 180px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
  },
  columns: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
  },
  column: {
    flex: "1 1 300px",
  },
  paymentCard: {
    backgroundColor: "#fefefe",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
  },
  paymentText: {
    fontSize: "16px",
    fontWeight: "500",
    marginBottom: "8px",
  },
  paymentNote: {
    fontSize: "14px",
    color: "#777",
    marginBottom: "20px",
  },
  payButton: {
    display: "inline-block",
    backgroundColor: "#000",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: "600",
    textDecoration: "none",
    transition: "background 0.3s",
  },
  total: {
    fontSize: "16px",
    marginTop: "12px",
  },
};
