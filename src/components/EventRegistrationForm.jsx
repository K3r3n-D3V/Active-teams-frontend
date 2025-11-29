// components/EventRegistrationForm.jsx
import React from "react";

export default function EventRegistrationForm({ eventId = "N/A" }) {
  const eventName = "Encounter";
  const price = 80;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Register for Event</h1>
        <p style={styles.subtitle}>Join us for an unforgettable experience</p>
      </header>

      {/* Scrollable Body */}
      <div style={styles.scrollableBody}>
        <div style={styles.body}>
          {/* Event Details */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Event Details</h2>
            <div style={styles.grid}>
              <input type="text" value={eventName} disabled style={styles.input} />
              <select style={styles.select}>
                <option>Adult</option>
                <option>Child (under 12)</option>
              </select>
              <select style={styles.select}>
                <option>Guide</option>
                <option>Leader</option>
              </select>
              <div style={styles.priceBox}>R{price.toFixed(2)}</div>
            </div>
          </section>

          {/* Personal Information */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Personal Information</h2>
            <div style={styles.formGrid}>
              <input type="text" placeholder="Full Name" style={styles.input} required />
              <input type="email" placeholder="Email Address" style={styles.input} required />
              <input type="tel" placeholder="Phone Number" style={styles.input} />
              <input type="text" placeholder="Home Address" style={styles.input} />
            </div>
          </section>

          {/* Payment */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Payment</h2>
            <div style={styles.paymentCard}>
              <div style={styles.paymentSummary}>
                <span style={{ color: "#000", fontWeight: "600" }}>Total Amount</span>
                <strong style={styles.total}>R{price.toFixed(2)}</strong>
              </div>
              <a
                href={`https://pay.yoco.com/your-link?amount=${price * 100}&reference=${eventId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.payButton}
              >
                Proceed to Secure Payment
              </a>
              <p style={styles.paymentNote}>
                You will be redirected to Yoco (SSL secured)
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxHeight: "95vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },

  header: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "2.5rem 2rem",
    textAlign: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: "2.6rem",
    margin: "0 0 0.4rem",
    fontWeight: "400",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "1.15rem",
    opacity: 0.9,
    margin: 0,
  },

  scrollableBody: {
    flex: 1,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },

  body: {
    padding: "3rem 4rem 4rem",
    color: "#000", // Ensures all text inherits black
  },

  section: { marginBottom: "3.5rem" },
  sectionTitle: {
    fontSize: "1.6rem",
    fontWeight: "600",
    color: "#000",                    // ← Now pure black
    marginBottom: "1.5rem",
    borderBottom: "2px solid #000",
    paddingBottom: "0.5rem",
    display: "inline-block",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },

  input: {
    width: "100%",
    padding: "1rem 1.2rem",
    fontSize: "1.1rem",
    border: "2px solid #000",         // Strong black border
    borderRadius: "0",
    backgroundColor: "transparent",
    color: "#000",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    padding: "1rem 1.2rem",
    fontSize: "1.1rem",
    border: "2px solid #000",
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: "0",
  },

  priceBox: {
    padding: "1rem",
    backgroundColor: "#000",
    color: "#fff",
    fontSize: "1.8rem",
    fontWeight: "bold",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentCard: {
    border: "3px solid #000",
    padding: "2rem",
    textAlign: "center",
    maxWidth: "480px",
    margin: "0 auto",
    backgroundColor: "#fff",
  },

  paymentSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "1.4rem",
    marginBottom: "1.5rem",
    padding: "1rem 0",
    borderBottom: "1px solid #000",   // Black line
    color: "#000",
  },

  total: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#000",
  },

  payButton: {
    display: "block",
    width: "100%",
    backgroundColor: "#000",
    color: "#fff",
    padding: "1.3rem",
    fontSize: "1.3rem",
    fontWeight: "600",
    textDecoration: "none",
    margin: "1.5rem 0",
    transition: "background 0.3s",
    cursor: "pointer",
  },

  paymentNote: {
    fontSize: "0.98rem",
    color: "#000",                    // ← Now black instead of grey
    margin: "1rem 0 0",
    fontWeight: "500",
  },
};

// Responsive + Focus Styles
if (typeof document !== "undefined") {
  const css = `
    @media (max-width: 768px) {
      [style*="grid-template-columns: repeat(2, 1fr)"] {
        grid-template-columns: 1fr !important;
      }
      [style*="padding: 3rem 4rem"] {
        padding: 2rem 1.5rem !important;
      }
      [style*="fontSize: 2.6rem"] {
        font-size: 2rem !important;
      }
    }
    input::placeholder, input::-webkit-input-placeholder {
      color: #333 !important;
      opacity: 1;
    }
    input:focus, select:focus {
      outline: none;
      background-color: #f9f9f9 !important;
      border-color: #000 !important;
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}