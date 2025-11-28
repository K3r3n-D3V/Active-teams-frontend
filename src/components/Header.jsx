import React, { useState } from "react";

// Placeholder for EventRegistrationForm - replace with your actual component
const EventRegistrationForm = () => (
  <div style={{ padding: "20px" }}>
    <h2>Event Registration</h2>
    <p>Your registration form goes here</p>
  </div>
);

export default function Home() {
  const [openPopup, setOpenPopup] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const sections = [
    { image: "/Untitled.jpg" },
    { image: "/newposter.jpg" },
    { image: "/homebanner1.jpg" },
    { image: "/home.jpg" },
  ];

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageLoad = (index) => {
    setImagesLoaded(prev => ({ ...prev, [index]: true }));
  };

  const getSectionHeight = () => {
    if (windowWidth < 480) return '80vh'; // Small phones
    if (windowWidth < 768) return '85vh'; // Tablets portrait
    if (windowWidth < 1024) return '90vh'; // Tablets landscape / small laptops
    return '100vh'; // Desktop
  };

  return (
    <div style={styles.container}>
      {sections.map((sec, index) => (
        <section
          key={index}
          onClick={() => setOpenPopup(true)}
          style={{
            ...styles.section,
            minHeight: getSectionHeight(),
          }}
        >
          {!imagesLoaded[index] && (
            <div style={styles.loader}>Loading...</div>
          )}
          <img
            src={sec.image}
            alt={`Section ${index + 1}`}
            onLoad={() => handleImageLoad(index)}
            style={{
              ...styles.image,
              opacity: imagesLoaded[index] ? 1 : 0,
            }}
            loading="lazy"
          />
        </section>
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
    position: "relative",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f0f0f0",
  },
  image: {
    width: "100%",
    height: "100%",
    minHeight: "inherit",
    objectFit: "cover",
    objectPosition: "center",
    transition: "opacity 0.3s ease-in-out",
    display: "block",
  },
  loader: {
    position: "absolute",
    fontSize: "18px",
    color: "#666",
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
    padding: "clamp(1rem, 4vw, 2rem)",
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
    fontSize: "clamp(18px, 2.5vw, 24px)",
    fontWeight: "bold",
    background: "none",
    border: "none",
    color: "#333",
    cursor: "pointer",
  },
};