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
    minHeight: "100vh",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    transition: "0.3s",
  },
};
