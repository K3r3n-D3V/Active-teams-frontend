// components/Modal.jsx
import React from "react";

export default function Modal({ isOpen, onClose, children , darkMode}) {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${darkMode ? "dark-mode" : ""}`}>
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}