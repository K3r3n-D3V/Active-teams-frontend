// components/Home.jsx
import React, { useState } from "react";
import EventRegistrationForm from "./EventRegistrationForm";

export default function Home() {
  const [openPopup, setOpenPopup] = useState(false);

  const sections = [
    { image: "/Untitled.jpg" },
    { image: "/newposter.jpg" },
    { image: "/homebanner1.jpg" },
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

      {openPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popupContent}>
            <button
              style={styles.closeButton}
              onClick={() => setOpenPopup(false)}
            >
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
    minHeight: "100vh", // full screen on desktop
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    transition: "0.3s",
    cursor: "pointer",

    // responsive tweak: smaller height on mobile
    // (simulate media queries in JS)
    ...(window.innerWidth < 768 && { minHeight: "70vh" }),
    ...(window.innerWidth < 480 && { minHeight: "60vh" }),
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
    padding: "1rem",
  },
  popupContent: {
    position: "relative",
    backgroundColor: "#fff",
    padding: "clamp(1rem, 4vw, 2rem)", // scales with screen size
    borderRadius: "8px",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  },
  closeButton: {
    position: "absolute",
    top: "10px",
    right: "14px",
    fontSize: "clamp(18px, 2.5vw, 24px)", // responsive size
    fontWeight: "bold",
    background: "none",
    border: "none",
    color: "#333",
    cursor: "pointer",
  },
};
