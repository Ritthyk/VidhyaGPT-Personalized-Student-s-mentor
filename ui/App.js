import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import ChatApp from "./ChatApp"; // Update to use the combined component
import "bootstrap/dist/css/bootstrap.min.css";
import TypewriterSidebar from "./typewriter";
// import "./App.css";

// Initialize WebSocket connection
const socket = io("http://localhost:5000");

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for messages from the backend
    socket.on("response", (data) => {
      setMessages((prevMessages) => [...prevMessages, { sender: "assistant", text: data }]);
    });

    return () => {
      socket.off("response"); // Clean up the listener
      socket.disconnect(); // Ensure the socket is disconnected on component unmount
    };
  }, []);

  const handleUserMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, { sender: "user", text: message }]);
    socket.emit("user_message", message);
  };

  return (
    <div className="App">
      {/* <h1>Chat with AI Assistant</h1> */}
      <TypewriterSidebar text="Welcome to the chat!" />
      <ChatApp messages={messages} onUserMessage={handleUserMessage} />
    </div>
  );
}

export default App;

