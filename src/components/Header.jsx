import React, { useState } from "react";
import EventRegistrationForm from "./EventRegistrationForm";

export default function Home() {
  const [openPopup, setOpenPopup] = useState(false);
  
  const sections = [
    { image: "/banner.jpg" },         // First (purple) image
    { image: "homebanner1.jpg" },
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
            ...(index === 0 ? styles.firstSection : {}),
          }}
        >
          {/* Clean profile icon only on the first image */}
          {index === 0 && (
            <div style={styles.profileIcon}>
              <div style={styles.profileIconInner}>
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  style={styles.profileSvg}
                >
                  <path 
                    d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}
          
          <img
            src={sec.image}
            alt={`Slide ${index + 1}`}
            style={styles.image}
            loading="lazy"
          />
        </section>
      ))}
      
      <EventRegistrationForm
        open={openPopup}
        onClose={() => setOpenPopup(false)}
      />
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "100%",
    margin: 0,
    padding: 0,
    overflowX: "hidden",
    overflowY: "auto",
    position: "relative",
  },
  section: {
    width: "100vw",           // Use viewport width
    height: "100vh",          // Use viewport height for better mobile support
    minHeight: "100dvh",      // Fallback with dynamic viewport height
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: 0,
    margin: 0,
  },
  firstSection: {
    marginTop: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
    maxWidth: "100%",         // Ensure no overflow
    maxHeight: "100%",        // Ensure no overflow
  },
  profileIcon: {
    position: "absolute",
    top: "20px",
    right: "20px",
    zIndex: 20,
    cursor: "pointer",
    // Remove any background - make it completely clean
  },
  profileIconInner: {
    width: "44px",
    height: "44px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(8px)",
    transition: "all 0.3s ease",
  },
  profileSvg: {
    color: "#666",
    transition: "color 0.3s ease",
  },
  
  // Media queries for better mobile responsiveness
  '@media (max-width: 768px)': {
    profileIcon: {
      top: "16px",
      right: "16px",
    },
    profileIconInner: {
      width: "40px",
      height: "40px",
    },
  },
  
  '@media (max-width: 480px)': {
    profileIcon: {
      top: "12px",
      right: "12px",
    },
    profileIconInner: {
      width: "36px",
      height: "36px",
    },
  },
};