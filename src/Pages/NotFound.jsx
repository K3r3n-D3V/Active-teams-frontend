import React, { useEffect } from "react";


const NotFound = () => {
  // Floating circle animation
  useEffect(() => {
    const circles = document.querySelectorAll(".float-circle");

    circles.forEach((circle) => {
      circle.animate(
        [
          { transform: "translate(0,0)" },
          { transform: "translate(30px,-30px)" },
          { transform: "translate(-30px,-60px)" },
          { transform: "translate(-60px,-30px)" },
          { transform: "translate(0,0)" }
        ],
        {
          duration: 20000,
          iterations: Infinity
        }
      );
    });
  }, []);

  return (
    <div
      style={{
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        minHeight: "100vh",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* Background Circles */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.1,
          zIndex: 0,
        }}
      >
        <div
          className="float-circle"
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            top: "10%",
            left: "20%",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #9b59b6, #e74c3c)",
          }}
        ></div>

        <div
          className="float-circle"
          style={{
            position: "absolute",
            width: 60,
            height: 60,
            top: "60%",
            left: "80%",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #9b59b6, #e74c3c)",
          }}
        ></div>

        <div
          className="float-circle"
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            top: "80%",
            left: "10%",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #9b59b6, #e74c3c)",
          }}
        ></div>
      </div>

      {/* Header */}
      <header
        style={{
          zIndex: 10,
          padding: "20px 40px",
          display: "flex",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ fontSize: 28, fontWeight: 300 }}>
            <span style={{ fontStyle: "italic", fontWeight: 400 }}>The Active </span>
            <span style={{ fontWeight: 700, letterSpacing: 1 }}>CHURCH</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        style={{
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 40,
        }}
      >
        <div
          style={{
            fontSize: 180,
            fontWeight: 700,
            background: "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 20,
            filter: "drop-shadow(0 0 25px rgba(167, 139, 250, 0.4))",
          }}
        >
          404
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 600, marginBottom: 15 }}>
          Page Not Found
        </h1>

        <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 600 }}>
          Oops! The page you're looking for seems to have wandered off.
        </p>
        <p style={{ fontSize: 18, color: "#cbd5e1", maxWidth: 600, marginTop: 10 }}>
          But don't worry, we're here to help you find your way back home.
        </p>

        {/* Bible Verse */}
        <div
          style={{
            fontSize: 16,
            fontStyle: "italic",
            color: "#a78bfa",
            margin: "30px 0",
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          "Ask and it will be given to you; seek and you will find; knock and the
          door will be opened to you."
          <span
            style={{
              display: "block",
              marginTop: 10,
              fontSize: 14,
              color: "#94a3b8",
            }}
          >
            - Matthew 7:7
          </span>
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 40,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* Primary Button */}
          <a
            href="/"
            style={{
              padding: "15px 35px",
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 50,
              background: "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)",
              color: "white",
              textDecoration: "none",
              transition: "0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
          >
            Go Home
          </a>

          {/* Secondary Button */}
          <a
            href="https://activemediahelpdesk.netlify.app/"
            style={{
              padding: "15px 35px",
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 50,
              textDecoration: "none",
              color: "white",
              border: "2px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.1)",
              transition: "0.3s",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
          >
            Help & Support
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          zIndex: 10,
          padding: 20,
          textAlign: "center",
          color: "#94a3b8",
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
        }}
      >
        © 2025 The Active Church. All rights reserved. 
      </footer>
    </div>
  );
};

export default NotFound;