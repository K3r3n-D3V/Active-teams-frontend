import React from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/EventRegistrationForm.module.css";

export default function EventRegistrationForm() {
  const { eventId } = useParams();

  const eventName = "Encounter";
  const price = 80;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.card}>
        <h2 className={styles.heading}>🎟️ Register for Event</h2>
        <p className={styles.subtext}>Event ID: <strong>{eventId}</strong></p>

        {/* Event and Rate Info */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Event Details</h3>
          <div className={styles.formRow}>
            <input type="text" value={eventName} disabled className={styles.input} />
            <select className={styles.select}>
              <option value="adult">Adult</option>
              <option value="child">Child</option>
            </select>
            <select className={styles.select}>
              <option value="guide">Guide</option>
              <option value="leader">Leader</option>
            </select>
            <input type="text" value={`R${price.toFixed(2)}`} disabled className={styles.input} />
          </div>
        </section>

        {/* Registration Details */}
        <section className={styles.section}>
          <div className={styles.columns}>
            {/* Personal Info */}
            <div className={styles.column}>
              <h3 className={styles.sectionTitle}>👤 Personal Information</h3>
              <input type="text" placeholder="Full Name" className={styles.inputFull} />
              <input type="email" placeholder="Email Address" className={styles.inputFull} />
              <input type="text" placeholder="Home Address" className={styles.inputFull} />
              <p className={styles.total}>TOTAL: <strong>R{price.toFixed(2)}</strong></p>
            </div>

            {/* Payment */}
            <div className={styles.column}>
              <h3 className={styles.sectionTitle}>💳 Payment</h3>
              <div className={styles.paymentCard}>
                <p className={styles.paymentText}>Payment for <strong>{eventName}</strong></p>
                <p className={styles.paymentNote}>Secure payment via Yoco</p>
                <a
                  href="https://pay.yoco.com/your-link-here"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.payButton}
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