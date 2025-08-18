import React, { useState, useEffect } from "react";

const slides = [
  {
    title: (
      <>
        THE <span style={{ fontStyle: "italic", fontSize: "4rem" }}>Active</span> CHURCH
      </>
    ),
    subtitle: (
      <>
        We are THE ACTIVE CHURCH
        <br />
        A church raising a NEW GENERATION.
        <br />
        A generation that will CHANGE THIS NATION.
        <br />
        To God be the GLORY
        <br />
        Amen.
      </>
    ),
    footer: "– a church that is as alive and vibrant as its name.",
  },
  {
    title: "Raising Kingdom Leaders",
    subtitle: "Empowering people to lead with love, courage, and vision.",
    footer: "– serving the next generation of world changers.",
  },
  {
    title: "Community | Worship | Purpose",
    subtitle: "Join a movement of people growing together in faith and action.",
    footer: "– more than a church, it’s a family.",
  },
];

export default function Header() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // start fade out
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setFade(true); // fade in
      }, 300); // fade duration must match CSS
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.slide,
          opacity: fade ? 1 : 0,
          transition: "opacity 0.4s ease-in-out",
        }}
      >
        <h1 style={styles.title}>{slides[current].title}</h1>
        <p style={styles.subtitle}>{slides[current].subtitle}</p>
        <p style={styles.footer}>{slides[current].footer}</p>
      </div>

      <div style={styles.indicators}>
        {slides.map((_, index) => (
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
    </div>
  );
}

const styles = {
  container: {
    height: "50vh",
    backgroundColor: "#B9A6D3",
    color: "#fff",
    textAlign: "center",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  slide: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    margin: 0,
    fontFamily: "serif",
    fontSize: "3rem",
  },
  subtitle: {
    fontWeight: "bold",
    marginTop: "1rem",
    fontSize: "1.1rem",
    lineHeight: "1.6",
  },
  footer: {
    fontStyle: "italic",
    color: "#eee",
    marginTop: "1rem",
  },
  indicators: {
    position: "absolute",
    bottom: "1.5rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "10px",
  },
  dot: {
    width: "10px",
    height: "10px",
    backgroundColor: "#fff",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "opacity 0.3s ease",
  },
};
