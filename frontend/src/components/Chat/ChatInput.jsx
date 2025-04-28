// src/components/Chat/ChatInput.jsx

import React, { useState } from "react";
import socket from "../../socket";

export default function ChatInput({ activeTab }) {
    const [text, setText] = useState("");

    const sendMessage = () => {
        const league_id = localStorage.getItem("league_id"); // you must store this on league load
        if (!text || !league_id) return;

        socket.emit("send_message", {
            league_id: league_id,
            content: text,
        });

        setText("");
    };

    return (
        <div className="chat-input" style={{ paddingTop: "10px" }}>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                style={{ width: "100%", padding: "8px" }}
            />
        </div>
    );
}
