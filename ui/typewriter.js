// TypewriterSidebar.js
import React, { useState, useEffect } from "react";
import "./styles/type.css"; // Ensure this path is correct for your project structure

function TypewriterSidebar({ text }) {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const typingSpeed = 100; // Speed of typing in ms
    const resetDelay = 1000; // Delay before repeating typing effect

    if (index < text.length) {
      // Typing effect
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else {
      // Reset and repeat typing effect after delay
      const resetTimeout = setTimeout(() => {
        setDisplayedText("");
        setIndex(0);
      }, resetDelay);

      return () => clearTimeout(resetTimeout);
    }
  }, [index, text]);

  return (
    <div className="sidebar-container">
      <p>{displayedText}</p>
    </div>
  );
}

export default TypewriterSidebar;
