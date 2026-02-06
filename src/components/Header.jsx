// components/Home.jsx
import React, { useState } from "react";
import EventRegistrationForm from "./EventRegistrationForm";
import styles from "../styles/Header.module.css";

export default function Home() {
  const [openPopup, setOpenPopup] = useState(false);

  const sections = [
    { image: "/img2.jpeg" },
    { image: "/homebanner1.jpg" },
    { image: "/home.jpg" },
    { image: "/newimage.jpg" }, 
  ];

  return (
    <div className={styles.container}>
      {sections.map((sec, index) => (
        <section
          key={index}
          onClick={() => setOpenPopup(true)}
          className={styles.section}
          style={{
            backgroundImage: `url(${sec.image})`,
          }}
        />
      ))}

      {openPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <button
              className={styles.closeButton}
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