// src/components/Chat/ChatMessages.jsx

import React, { useEffect, useState } from "react";
import socket from "../../socket";
import axios from "axios";
import { getAuthToken } from "../../utils/auth";

export default function ChatMessages({ activeTab }) {
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                if (activeTab === "league") {
                    const chatId = localStorage.getItem("chat_id"); // set this when league loads
                    const res = await axios.post(
                        "/api/chat/league/messages",
                        { chat_id: chatId },
                        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
                    );
                    setMessages(res.data);
                } else {
                    // TODO: Fetch direct messages later
                    setMessages([]);
                }
            } catch (err) {
                console.error("Error fetching messages", err);
            }
        };

        fetchMessages();
    }, [activeTab]);

    useEffect(() => {
        socket.on("receive_message", (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        return () => {
            socket.off("receive_message");
        };
    }, []);

    return (
        <div className="chat-messages" style={{ maxHeight: "280px", overflowY: "auto" }}>
            {messages.map((msg, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                    <strong>User {msg.sender_id}:</strong> {msg.content}
                </div>
            ))}
        </div>
    );
}
