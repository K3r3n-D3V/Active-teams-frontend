import React, { useState } from "react";
import EventRegistrationForm from "../components/EventRegistrationForm";

export default function Hero() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <img
        src="https://cdn-icons-png.flaticon.com/512/831/831472.png"
        alt="Chair"
        onClick={() => setOpen(true)}
        style={{
          maxWidth: "300px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      />
      <p
        style={{
          marginTop: "20px",
          fontSize: "12px",
          backgroundColor: "#888",
          display: "inline-block",
          padding: "5px 10px",
          borderRadius: "5px",
          color: "white",
          cursor: "pointer",
        }}
        onClick={() => setOpen(true)}
      >
        CLICK THE BANNER TO REGISTER
      </p>

      <EventRegistrationForm open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
