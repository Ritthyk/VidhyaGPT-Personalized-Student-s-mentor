import React, { useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
// import "./App.css"; // Your existing styles
import "./styles/ChatDisplay.css"; // Ensure this path is correct for your project structure
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faMicrophone, faUpload } from '@fortawesome/free-solid-svg-icons';
import TypewriterSidebar from "./typewriter";

function ChatApp({ messages, onUserMessage, onFileUpload }) {
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingMessage, setRecordingMessage] = useState("");
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Add a default message
  const defaultMessage = { sender: "assistant", text: "Hello! How can I assist you today?" };

  const sendMessage = () => {
    if (inputMessage.trim()) {
      onUserMessage(inputMessage); // Use the prop function
      setInputMessage("");

      // Optionally: Add a dummy response if needed
    }
  };

  const handleTextChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(!isRecording);
  };

  const startRecording = async () => {
    setRecordingMessage("");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.start();

    mediaRecorderRef.current.onstop = () => {
      setRecordingMessage("Recording Stopped");
    };
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    
    <div className="chat-container">
        
        {/* <TypewriterSidebar text="Welcome to the chat! This is a typewriter effect sidebar that introduces the app's features and guides the user. Enjoy your experience!" /> */}
      <div className="chat-display-container">
        {/* Include the default message in the display */}
        {messages.length === 0 && (
          <div className={`message assistant-message`}>
            {defaultMessage.text}
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === "user" ? "user-message" : "assistant-message"}`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className="input-container">
      <label htmlFor="file-upload" className="btn file-upload-button">
          <FontAwesomeIcon icon={faUpload} />
        </label>
        <input
          id="file-upload"
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <textarea
          className="message-input"
          rows="1"
          placeholder="Type a message or press the mic to record..."
          value={inputMessage}
          onChange={handleTextChange}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <div className="buttons-container">
          <button className="btn send-button" onClick={sendMessage}>
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          <button className="btn mic-button" onClick={handleRecord}>
            {isRecording ? "Stop" : <FontAwesomeIcon icon={faMicrophone} />}
          </button>
        </div>
        {recordingMessage && (
          <p className="recording-indicator">{recordingMessage}</p>
        )}
      </div>
    </div>
  );
}

export default ChatApp;
