// components/Home.jsx
import React, { useState } from "react";
import EventRegistrationForm from "./EventRegistrationForm";

export default function Home() {
  const [openPopup, setOpenPopup] = useState(false);

  const sections = [
    { image: "/banner.jpg" },
    { image: "/homebanner1.jpg" },
    { image: "/event.jpg" },
    { image: "/home.jpg" },
  ];

  return (
    <div style={styles.container}>
      {sections.map((sec, index) => (
        <section
          key={index}
          onClick={() => setOpenPopup(true)}
          style={{
            ...styles.section,
            backgroundImage: `url(${sec.image})`,
          }}
        />
      ))}

      {/* Registration Form as Popup with Close Button */}
      {openPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupContent}>
            <button style={styles.closeButton} onClick={() => setOpenPopup(false)}>
              &times;
            </button>
            <EventRegistrationForm />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    overflowY: "auto",
    scrollBehavior: "smooth",
  },
  section: {
    width: "100%",
    minHeight: "100vh",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    transition: "0.3s",
    cursor: "pointer",
  },
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  popupContent: {
    position: "relative",
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "14px",
    fontSize: "24px",
    fontWeight: "bold",
    background: "none",
    border: "none",
    color: "#333",
    cursor: "pointer",
  },
};
