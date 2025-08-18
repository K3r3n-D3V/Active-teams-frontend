import React from "react";

export default function EventRegistrationForm({ open, onClose }) {
  if (!open) return null;

  const eventName = "Encounter";
  const price = 80;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 999,
        }}
      />

      {/* Popup Form */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#fff",
          borderRadius: "12px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          zIndex: 1000,
          padding: "20px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0 }}>Register Now</h2>
          <button
            onClick={onClose}
            aria-label="Close popup"
            style={{
              background: "transparent",
              border: "none",
              fontSize: "1.5rem",
              fontWeight: "bold",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Your existing form content starts here */}
        <div>
          {/* Top Row - Event Rate Selection */}
          <div
            style={{
              padding: "16px",
              marginBottom: "24px",
              borderRadius: "12px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={eventName}
                disabled
                style={{
                  flex: "1 1 150px",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
                placeholder="Event"
              />
              {/* Person select */}
              <select
                style={{
                  flex: "1 1 150px",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="adult">Adult</option>
                <option value="child">Child</option>
              </select>
              {/* Rate type select */}
              <select
                style={{
                  flex: "1 1 150px",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="guide">Guide</option>
                <option value="leader">Leader</option>
              </select>
              {/* Price */}
              <input
                type="text"
                value={`R${price.toFixed(2)}`}
                disabled
                style={{
                  flex: "1 1 150px",
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
                placeholder="Rate Price"
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            {/* Left: Personal Info */}
            <div style={{ flex: "1 1 280px" }}>
              <h3>Personal Information</h3>
              <p style={{ color: "#666" }}>
                Please provide your contact details
              </p>

              <input
                type="text"
                placeholder="Full Name"
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="email"
                placeholder="Email Address"
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <input
                type="text"
                placeholder="Home Address"
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />

              <p style={{ fontWeight: "600" }}>TOTAL: R{price.toFixed(2)}</p>
            </div>

            {/* Right: Payment Section */}
            <div style={{ flex: "1 1 280px" }}>
              <h3>Credit Card</h3>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#fcfcfc",
                  border: "1px solid #ddd",
                }}
              >
                <p style={{ fontWeight: "600", marginBottom: "8px" }}>
                  Payment for {eventName}
                </p>
                <p style={{ color: "#666", marginBottom: "16px" }}>
                  Process payment through Yoco Integration
                </p>

                <a
                  href="https://pay.yoco.com/whatever-payment-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    backgroundColor: "#000",
                    color: "#fff",
                    textAlign: "center",
                    padding: "10px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600",
                  }}
                >
                  Pay now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
