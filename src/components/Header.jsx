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
        >
          <h1 style={styles.text}>Click Anywhere to Register</h1>
        </section>
      ))}

      {/* Registration Popup */}
      <EventRegistrationForm open={openPopup} onClose={() => setOpenPopup(false)} />
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
    minHeight: "100vh", // full screen height
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5vw",
    boxSizing: "border-box",
    transition: "0.3s",
  },
  text: {
    color: "#fff",
    fontSize: "clamp(1.5rem, 5vw, 3rem)",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: "1em 2em",
    borderRadius: "10px",
    textAlign: "center",
    maxWidth: "90%",
    wordWrap: "break-word",
  },
};
