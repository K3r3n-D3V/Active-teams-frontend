// components/Hero.jsx
import React, { useState, useEffect } from "react";
import EventRegistrationForm from '../components/EventRegistrationForm';
import styles from "../styles/Hero.module.css";

const images = [
  "/bannerswipper.jpg",
  "/swipper2.jpg",
  "/swipper3.jpg",
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % images.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.sliderBanner}>
      {images.length > 0 && (
        <div
          className={styles.slide}
          style={{
            backgroundImage: `url(${images[current]})`,
            opacity: fade ? 1 : 0,
            transition: "opacity 0.4s ease-in-out",
            cursor: 'pointer',            // show pointer on hover
          }}
          onClick={() => setOpen(true)}    // open the form on click
        >
          {/* You can add any overlay content here if needed */}
        </div>
      )}

      <div className={styles.indicators}>
        {images.map((_, index) => (
          <span
            key={index}
            className={styles.dot}
            style={{
              opacity: index === current ? 1 : 0.3,
            }}
            onClick={() => {
              setFade(false);
              setTimeout(() => {
                setCurrent(index);
                setFade(true);
              }, 300);
            }}
          />
        ))}
      </div>

      <EventRegistrationForm open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
