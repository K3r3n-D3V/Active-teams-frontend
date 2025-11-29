// components/Home.jsx
import React, { useState, useEffect } from "react";
import EventRegistrationForm from "./EventRegistrationForm";

export default function Home() {
  const [openPopup, setOpenPopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);
    const handler = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const sections = [
    { image: "/reactive.jpeg" },
    { image: "/amenclub.jpeg" },
    { image: "/homebanner1.jpg" },
    { image: "/home.jpg" },
  ];

  return (
    <>
      <div style={styles.container}>
        {sections.map((sec, i) => (
          <section
            key={i}
            onClick={() => setOpenPopup(true)}
            style={{
              ...styles.section,
              backgroundImage: `url(${sec.image})`,
            }}
          />
        ))}
      </div>

      {/* WIDE & ELEGANT BLACK & WHITE MODAL */}
      {openPopup && (
        <div style={styles.overlay}>
          <div
            style={{
              ...styles.modal,
              backgroundColor: isDarkMode ? "#111" : "#fff",
              color: isDarkMode ? "#eee" : "#111",
            }}
          >
            <button style={styles.closeBtn} onClick={() => setOpenPopup(false)}>
              ×
            </button>
            <EventRegistrationForm eventId="ENC2025" />
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  container: {
    width: "100%",
    scrollSnapType: "y mandatory",
    overflowY: "scroll",
    height: "100vh",
  },
  section: {
    width: "100%",
    height: "100vh",
    backgroundSize: "cover",
    backgroundPosition: "center",
    cursor: "pointer",
    scrollSnapAlign: "start",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "1rem",
  },
 // In Home.jsx – make sure modal allows internal scrolling
modal: {
  position: "relative",
  width: "100%",
  maxWidth: "900px",
  maxHeight: "95vh",
  borderRadius: "12px",
  overflow: "hidden",        // This is OK here
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  fontFamily: "'Georgia', serif",
},
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "20px",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    border: "none",
    fontSize: "28px",
    cursor: "pointer",
    zIndex: 10,
  },
};