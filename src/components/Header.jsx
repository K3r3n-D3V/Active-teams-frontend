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
            cursor: "pointer",
          }}
        >
          {/* <h1 style={styles.text}>Click Anywhere to Register</h1> */}
        </section>
      ))}

      {/* Registration Popup */}
      <EventRegistrationForm open={openPopup} onClose={() => setOpenPopup(false)} />
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    overflowY: "scroll",
    scrollBehavior: "smooth",
  },
  section: {
    height: "100vh",
    width: "100%",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
    transition: "0.3s",
  },
  text: {
    color: "#fff",
    fontSize: "clamp(1.5rem, 5vw, 3rem)",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
  },
};
