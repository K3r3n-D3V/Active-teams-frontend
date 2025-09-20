import React, { useEffect, useState } from "react";

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [showPrayingHands, setShowPrayingHands] = useState(false);
  const [textPhase, setTextPhase] = useState(0);

  useEffect(() => {
    const textTimer1 = setTimeout(() => setTextPhase(1), 800);
    const textTimer2 = setTimeout(() => setTextPhase(2), 1600);
    const handsTimer = setTimeout(() => setShowPrayingHands(true), 2500);
    const fadeTimer = setTimeout(() => setFadeOut(true), 4500);
    const finishTimer = setTimeout(() => onFinish(), 6000);

    return () => {
      clearTimeout(textTimer1);
      clearTimeout(textTimer2);
      clearTimeout(handsTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className="splash-container"
      style={{
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Flying Birds */}
      <div className="birds-container">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bird"
            style={{
              '--delay': `${i * 0.8}s`,
              '--duration': `${4 + Math.random() * 2}s`,
              '--start-x': `${-10 - Math.random() * 20}%`,
              '--end-x': `${110 + Math.random() * 20}%`,
              '--y': `${20 + Math.random() * 60}%`,
              '--size': `${0.8 + Math.random() * 0.4}`,
            }}
          >
            🕊️
          </div>
        ))}
      </div>

      {/* Floating Clouds */}
      <div className="clouds-container">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="cloud"
            style={{
              '--delay': `${i * 1.2}s`,
              '--x': `${10 + i * 20}%`,
              '--y': `${15 + (i % 2) * 10}%`,
            }}
          >
            ☁️
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Gentle Cross */}
        <div className="cross-container">
          <div className="cross-glow"></div>
          <div className="cross vertical"></div>
          <div className="cross horizontal"></div>
        </div>

        {/* Text Animation */}
        <div className="text-container">
          <h1 className={`main-text active-text ${textPhase >= 1 ? 'visible' : ''}`}>
            ACTIVE
          </h1>
          <h1 className={`main-text church-text ${textPhase >= 2 ? 'visible' : ''}`}>
            CHURCH
          </h1>
          
          <div className="tagline">
            <p className={`subtitle ${textPhase >= 2 ? 'visible' : ''}`}>
              Faith in Action
            </p>
          </div>
        </div>

        {/* Praying Hands */}
        {showPrayingHands && (
          <div className="praying-hands-container">
            <div className="praying-hands main-hands">
              🙏
            </div>
            
            {/* Additional smaller praying hands floating around */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="praying-hands floating-hands"
                style={{
                  '--delay': `${i * 0.3}s`,
                  '--x': `${-200 + i * 80}px`,
                  '--y': `${-100 + (i % 3) * 100}px`,
                  '--scale': `${0.4 + (i % 3) * 0.2}`,
                }}
              >
                🙏
              </div>
            ))}
          </div>
        )}

        {/* Gentle Light Rays */}
        <div className="light-rays">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="light-ray"
              style={{
                '--angle': `${i * 30}deg`,
                '--delay': `${i * 0.2}s`,
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
          background: linear-gradient(135deg, #87CEEB 0%, #E6E6FA 50%, #FFF8DC 100%);
          position: relative;
          transition: opacity 1.5s ease-in-out;
          padding: 20px;
          box-sizing: border-box;
        }

        .birds-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .bird {
          position: absolute;
          font-size: calc(1.5rem * var(--size));
          animation: flyAcross var(--duration) ease-in-out infinite var(--delay);
          left: var(--start-x);
          top: var(--y);
          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
          transform-origin: center;
          will-change: transform;
        }

        .clouds-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .cloud {
          position: absolute;
          font-size: 2rem;
          left: var(--x);
          top: var(--y);
          animation: floatCloud 8s ease-in-out infinite var(--delay);
          opacity: 0.7;
        }

        .main-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          z-index: 2;
          position: relative;
          width: 100%;
          max-width: 90vw;
          padding: 0 20px;
          box-sizing: border-box;
        }

        .cross-container {
          position: relative;
          margin-bottom: 3rem;
          animation: gentleGlow 3s ease-in-out infinite;
        }

        .cross-glow {
          position: absolute;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(255,215,0,0.3), transparent);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .cross {
          background: linear-gradient(45deg, #DAA520, #FFD700);
          border-radius: 3px;
          box-shadow: 0 4px 15px rgba(218, 165, 32, 0.3);
        }

        .cross.vertical {
          width: 8px;
          height: 60px;
          position: relative;
        }

        .cross.horizontal {
          width: 45px;
          height: 8px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .text-container {
          margin-bottom: 2rem;
        }

        .main-text {
          font-family: 'Georgia', 'Times New Roman', serif;
          font-weight: bold;
          margin: 0.5rem 0;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }

        .main-text.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .active-text {
          font-size: clamp(2.5rem, 8vw, 4rem);
          color: #2E8B57;
          letter-spacing: 0.1em;
        }

        .church-text {
          font-size: clamp(2.5rem, 8vw, 4rem);
          color: #4682B4;
          letter-spacing: 0.1em;
        }

        .tagline {
          margin-top: 1rem;
        }

        .subtitle {
          font-family: 'Georgia', serif;
          font-size: clamp(1rem, 3vw, 1.5rem);
          color: #666;
          font-style: italic;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s ease-out 0.5s;
        }

        .subtitle.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .praying-hands-container {
          position: relative;
          margin-top: 2rem;
          width: fit-content;
        }

        .praying-hands {
          font-size: 3rem;
          filter: drop-shadow(2px 2px 6px rgba(0,0,0,0.2));
        }

        .main-hands {
          animation: gentlePray 2s ease-in-out infinite;
        }

        .floating-hands {
          position: absolute;
          font-size: calc(1.5rem * var(--scale));
          animation: floatHands 4s ease-in-out infinite var(--delay);
          left: var(--x);
          top: var(--y);
          opacity: 0.6;
          pointer-events: none;
        }

        .light-rays {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          pointer-events: none;
          z-index: -1;
        }

        .light-ray {
          position: absolute;
          width: 2px;
          height: 150px;
          background: linear-gradient(to bottom, transparent, rgba(255,215,0,0.2), transparent);
          top: 50%;
          left: 50%;
          transform-origin: bottom center;
          transform: translate(-50%, -100%) rotate(var(--angle));
          animation: rotateRay 12s linear infinite var(--delay);
        }

        @keyframes flyAcross {
          0% {
            transform: translateX(-50px) translateY(0) scale(var(--size));
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(calc(100vw + 50px)) translateY(-20px) scale(var(--size));
            opacity: 0;
          }
        }

        @keyframes floatCloud {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(20px) translateY(-10px);
          }
        }

        @keyframes gentleGlow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes gentlePray {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.1);
          }
        }

        @keyframes floatHands {
          0%, 100% {
            transform: translateY(0) rotate(-5deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
            opacity: 0.8;
          }
        }

        @keyframes rotateRay {
          from {
            transform: translate(-50%, -100%) rotate(var(--angle));
          }
          to {
            transform: translate(-50%, -100%) rotate(calc(var(--angle) + 360deg));
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .main-content {
            padding: 0 15px;
          }
          
          .cross-container {
            margin-bottom: 2rem;
          }
          
          .cross-glow {
            width: 80px;
            height: 80px;
          }
          
          .cross.vertical {
            height: 40px;
            width: 6px;
          }
          
          .cross.horizontal {
            width: 30px;
            height: 6px;
          }
          
          .praying-hands {
            font-size: 2rem;
          }
          
          .bird {
            font-size: calc(1rem * var(--size));
          }
          
          .light-rays {
            width: 200px;
            height: 200px;
          }
          
          .light-ray {
            height: 100px;
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: 0 10px;
          }
          
          .floating-hands {
            display: none;
          }
          
          .clouds-container .cloud:nth-child(n+4) {
            display: none;
          }
          
          .birds-container .bird:nth-child(n+6) {
            display: none;
          }
        }

        /* Ensure no body overflow */
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