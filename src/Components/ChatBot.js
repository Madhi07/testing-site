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
        body: JSON.stringify({ ddt_id:"50",question: input }),
      });

      const data = await response.json();
      console.log("Bot Response:", data);

      const { xpath, fill_value, answer, action } = data;

      // Add bot message
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: answer || "I found something.",
          xpath: xpath || "",
          action: action || "",
        },
      ]);

    
      if (xpath) {
        try {
          // Clean XPath if wrapped
          const xpathMatch = xpath.match(/<--\s*XPath:\s*([^>]+)\s*-->/);
          const cleanedXPath = xpathMatch ? xpathMatch[1].trim() : xpath;

          const element = document.evaluate(
            cleanedXPath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue;

          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.style.outline = "2px solid red";

            // Different element actions
            if (element.tagName === "SELECT") {
              let optionFound = false;
              for (let option of element.options) {
                if (option.text === fill_value || option.value === fill_value) {
                  option.selected = true;
                  optionFound = true;
                  break;
                }
              }
              element.dispatchEvent(new Event("change", { bubbles: true }));

              console.log(
                optionFound
                  ? `Selected option: ${fill_value}`
                  : `Option '${fill_value}' not found`
              );
            } else if (element.type === "radio" || element.type === "checkbox") {
              element.checked = true;
              element.dispatchEvent(new Event("change", { bubbles: true }));
              console.log(`Checked: ${fill_value}`);
            } else if (
              element.type === "submit" ||
              element.tagName === "BUTTON" ||
              action?.toLowerCase() === "click"
            ) {
              element.click();
              console.log(`Clicked button: ${cleanedXPath}`);
            } else {
              // Fill input fields
              if (fill_value !== undefined) {
                element.value = fill_value;
                element.dispatchEvent(new Event("input", { bubbles: true }));
                console.log(`Filled: ${fill_value}`);
              }
            }

            setTimeout(() => {
              element.style.outline = "";
            }, 1500);
          } else {
            console.warn("Element not found for XPath:", cleanedXPath);
          }
        } catch (err) {
          console.error("Error applying XPath logic:", err);
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
