// components/Hero.jsx
import React, { useState, useEffect } from "react";
import EventRegistrationForm from '../components/EventRegistrationForm';

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
    <div style={styles.sliderBanner}>
      {images.length > 0 && (
        <div
          style={{
            ...styles.slide,
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

      <div style={styles.indicators}>
        {images.map((_, index) => (
          <span
            key={index}
            style={{
              ...styles.dot,
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

const styles = {
  sliderBanner: {
    height: "50vh",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#000",
    color: "#fff",
    textAlign: "center",
  },
  slide: {
    height: "100%",
    width: "100%",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "absolute",
    top: 0,
    left: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  indicators: {
    position: "absolute",
    bottom: "1rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "10px",
    zIndex: 2,
  },
  dot: {
    width: "10px",
    height: "10px",
    backgroundColor: "#fff",
    borderRadius: "50%",
    cursor: "pointer",
  },
};
