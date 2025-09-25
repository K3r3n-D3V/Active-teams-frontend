import React, { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [textPhase, setTextPhase] = useState(0);
  const [particlesVisible, setParticlesVisible] = useState(false);
  const [crossVisible, setCrossVisible] = useState(false);

  useEffect(() => {
    const crossTimer = setTimeout(() => setCrossVisible(true), 300);
    const textTimer1 = setTimeout(() => setTextPhase(1), 1200);
    const textTimer2 = setTimeout(() => setTextPhase(2), 2000);
    const particlesTimer = setTimeout(() => setParticlesVisible(true), 2800);
    const fadeTimer = setTimeout(() => setFadeOut(true), 4500);
    const finishTimer = setTimeout(() => onFinish(), 5500);

    return () => {
      clearTimeout(crossTimer);
      clearTimeout(textTimer1);
      clearTimeout(textTimer2);
      clearTimeout(particlesTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="splash-container" style={{ opacity: fadeOut ? 0 : 1 }}>
      {/* Animated Background Gradient */}
      <div className="background-gradient"></div>
      
      {/* Geometric Patterns */}
      <div className="geometric-bg">
        <div className="geo-circle geo-1"></div>
        <div className="geo-circle geo-2"></div>
        <div className="geo-circle geo-3"></div>
        <div className="geo-triangle geo-tri-1"></div>
        <div className="geo-triangle geo-tri-2"></div>
      </div>

      {/* Floating Particles */}
      {particlesVisible && (
        <div className="particles-container">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                '--delay': `${i * 0.2}s`,
                '--x': `${Math.random() * 100}%`,
                '--y': `${Math.random() * 100}%`,
                '--size': `${2 + Math.random() * 4}px`,
                '--duration': `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Modern Cross Design */}
        <div className={`cross-container ${crossVisible ? 'visible' : ''}`}>
          <div className="cross-modern">
            <div className="cross-glow-ring"></div>
            <div className="cross-vertical"></div>
            <div className="cross-horizontal"></div>
            <div className="cross-center-dot"></div>
          </div>
        </div>

        {/* Typography */}
        <div className="typography-container">
          <div className="brand-container">
            <h1 className={`brand-text active-text ${textPhase >= 1 ? 'visible' : ''}`}>
              ACTIVE
            </h1>
            <h1 className={`brand-text church-text ${textPhase >= 2 ? 'visible' : ''}`}>
              CHURCH
            </h1>
          </div>
          
          <div className="tagline-container">
            <div className={`tagline-line ${textPhase >= 2 ? 'visible' : ''}`}></div>
            <p className={`tagline ${textPhase >= 2 ? 'visible' : ''}`}>
              Faith in Action
            </p>
            <div className={`tagline-line ${textPhase >= 2 ? 'visible' : ''}`}></div>
          </div>
        </div>

        {/* Elegant Light Rays */}
        <div className="modern-rays">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="modern-ray"
              style={{
                '--angle': `${i * 45}deg`,
                '--delay': `${i * 0.1}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .splash-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          width: 100vw;
          position: relative;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .background-gradient {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            #667eea 0%,
            #764ba2 25%,
            #f093fb 50%,
            #f5576c 75%,
            #4facfe 100%
          );
          background-size: 400% 400%;
          animation: gradientShift 8s ease infinite;
          z-index: 0;
        }

        .geometric-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
        }

        .geo-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          animation: float 6s ease-in-out infinite;
        }

        .geo-1 {
          width: 200px;
          height: 200px;
          top: 10%;
          right: 10%;
          animation-delay: 0s;
        }

        .geo-2 {
          width: 150px;
          height: 150px;
          bottom: 15%;
          left: 15%;
          animation-delay: 2s;
        }

        .geo-3 {
          width: 100px;
          height: 100px;
          top: 60%;
          right: 20%;
          animation-delay: 4s;
        }

        .geo-triangle {
          position: absolute;
          width: 0;
          height: 0;
          border-style: solid;
          animation: rotate 10s linear infinite;
        }

        .geo-tri-1 {
          border-left: 50px solid transparent;
          border-right: 50px solid transparent;
          border-bottom: 87px solid rgba(255, 255, 255, 0.03);
          top: 20%;
          left: 20%;
          animation-delay: 1s;
        }

        .geo-tri-2 {
          border-left: 30px solid transparent;
          border-right: 30px solid transparent;
          border-bottom: 52px solid rgba(255, 255, 255, 0.03);
          bottom: 30%;
          right: 30%;
          animation-delay: 3s;
        }

        .particles-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }

        .particle {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(circle, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1));
          border-radius: 50%;
          animation: particleFloat var(--duration) ease-in-out infinite var(--delay);
        }

        .main-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 3;
          position: relative;
          padding: 2rem;
        }

        .cross-container {
          position: relative;
          margin-bottom: 3rem;
          opacity: 0;
          transform: scale(0.5) rotate(45deg);
          transition: all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .cross-container.visible {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .cross-modern {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cross-glow-ring {
          position: absolute;
          width: 120px;
          height: 120px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: ringPulse 3s ease-in-out infinite;
        }

        .cross-vertical {
          width: 4px;
          height: 60px;
          background: linear-gradient(180deg, #ffffff, #f0f0f0, #ffffff);
          border-radius: 2px;
          position: relative;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }

        .cross-horizontal {
          width: 60px;
          height: 4px;
          background: linear-gradient(90deg, #ffffff, #f0f0f0, #ffffff);
          border-radius: 2px;
          position: absolute;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }

        .cross-center-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: radial-gradient(circle, #ffffff, #e0e0e0);
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
        }

        .typography-container {
          margin-bottom: 2rem;
        }

        .brand-container {
          margin-bottom: 2rem;
        }

        .brand-text {
          font-family: 'SF Pro Display', -apple-system, system-ui, sans-serif;
          font-weight: 800;
          letter-spacing: 0.1em;
          margin: 0.5rem 0;
          opacity: 0;
          transform: translateY(50px) rotateX(90deg);
          transition: all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          background: linear-gradient(135deg, #ffffff, #f0f0f0, #ffffff);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .brand-text.visible {
          opacity: 1;
          transform: translateY(0) rotateX(0deg);
        }

        .active-text {
          font-size: clamp(2.5rem, 8vw, 5rem);
          transition-delay: 0.2s;
        }

        .church-text {
          font-size: clamp(2.5rem, 8vw, 5rem);
          transition-delay: 0.4s;
        }

        .tagline-container {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .tagline-line {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          opacity: 0;
          transform: scaleX(0);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transition-delay: 0.6s;
        }

        .tagline-line.visible {
          opacity: 1;
          transform: scaleX(1);
        }

        .tagline {
          font-family: 'SF Pro Text', -apple-system, system-ui, sans-serif;
          font-size: clamp(1rem, 3vw, 1.5rem);
          font-weight: 300;
          letter-spacing: 0.2em;
          color: rgba(255, 255, 255, 0.9);
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transition-delay: 0.8s;
          text-transform: uppercase;
        }

        .tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .modern-rays {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 400px;
          height: 400px;
          pointer-events: none;
          z-index: -1;
        }

        .modern-ray {
          position: absolute;
          width: 2px;
          height: 200px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 30%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0.1) 70%,
            transparent 100%
          );
          top: 50%;
          left: 50%;
          transform-origin: bottom center;
          transform: translate(-50%, -100%) rotate(var(--angle));
          animation: rayRotate 15s linear infinite var(--delay);
        }

        /* Animations */
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          50% {
            transform: translateY(-100px) scale(1);
            opacity: 1;
          }
        }

        @keyframes ringPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @keyframes rayRotate {
          from {
            transform: translate(-50%, -100%) rotate(var(--angle));
          }
          to {
            transform: translate(-50%, -100%) rotate(calc(var(--angle) + 360deg));
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .main-content {
            padding: 1rem;
          }

          .cross-glow-ring {
            width: 80px;
            height: 80px;
          }

          .cross-vertical {
            height: 40px;
            width: 3px;
          }

          .cross-horizontal {
            width: 40px;
            height: 3px;
          }

          .cross-center-dot {
            width: 6px;
            height: 6px;
          }

          .tagline-line {
            width: 40px;
          }

          .geo-circle {
            display: none;
          }

          .geo-triangle {
            transform: scale(0.5);
          }

          .modern-rays {
            width: 250px;
            height: 250px;
          }

          .modern-ray {
            height: 125px;
          }
        }

        @media (max-width: 480px) {
          .tagline-container {
            flex-direction: column;
            gap: 1rem;
          }

          .tagline-line {
            width: 80px;
          }

          .particles-container .particle:nth-child(n+11) {
            display: none;
          }
        }

        /* Performance optimizations */
        * {
          will-change: auto;
        }

        .brand-text {
          will-change: transform, opacity;
        }

        .cross-container {
          will-change: transform, opacity;
        }

        .particle {
          will-change: transform;
        }

        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
}