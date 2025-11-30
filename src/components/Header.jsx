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
    { image: "/img2.jpeg" },
    { image: "/homebanner1.jpg" },
    { image: "/home.jpg" },
    { image: "/amenclub.jpeg" },
  ];

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
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "1rem",
    },
    modal: {
      position: "relative",
      width: "100%",
      maxWidth: "680px",        // ← Slim & beautiful (your request)
      maxHeight: "94vh",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 25px 70px rgba(0,0,0,0.5)",
      fontFamily: "'Georgia', serif",
      backgroundColor: isDarkMode ? "#111" : "#fff",
      color: isDarkMode ? "#eee" : "#111",
    },
    closeBtn: {
      position: "absolute",
      top: "16px",
      right: "20px",
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      background: "rgba(0,0,0,0.6)",
      color: "white",
      border: "none",
      fontSize: "32px",
      fontWeight: "300",
      cursor: "pointer",
      zIndex: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };

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

      {/* SLIM & ELEGANT MODAL */}
      {openPopup && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
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