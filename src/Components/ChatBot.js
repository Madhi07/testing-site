import React, { useState } from "react";
import "../Styles/ChatBot.css";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  
  const handleSend = async () => {
    if (!input.trim()) return;

    
    setMessages((prev) => [...prev, { from: "user", text: input }]);

    try {
    
      const response = await fetch("http://127.0.0.1:8000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      // Add bot message
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.answer || "I found something.",
          xpath: data.xpath || "",
          action: data.action || "",
        },
      ]);

      // If xpath exists, try to highlight/select element
      if (data.xpath) {
        try {
          const element = document.evaluate(
            data.xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.style.outline = "2px solid red";
            setTimeout(() => {
              element.style.outline = "";
            }, 2000);
          }
        } catch (err) {
          console.error("Error applying XPath:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching response:", error);
    }

    setInput("");
  };

  return (
    <div className="chatbox-container">
      {/* Toggle Button */}
      <button className="chatbox-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✖" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbox">
          <div className="chatbox-header">Assistant</div>

          <div className="chatbox-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.from}>
                {msg.from === "user" ? `> ${msg.text}` : `Bot: ${msg.text}`}
                {msg.xpath && (
                  <div className="xpath">
                    (XPath: <code>{msg.xpath}</code>)
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chatbox-input">
            <input
              type="text"
              value={input}
              placeholder="Ask me something..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
