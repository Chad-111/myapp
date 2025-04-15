// src/components/Chat/DirectMessages.jsx
import React, { useEffect, useState, useRef } from "react";
import socket from "../../socket";
import { getAuthToken } from "../utils/auth";
import "./DirectMessages.css";

const DirectMessages = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const token = getAuthToken();

    useEffect(() => {
        if (!token) return;

        // Fetch direct messages (to this user)
        fetch("/api/chat/direct/messages", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setMessages(data);
            })
            .catch((err) => console.error("Error loading direct messages:", err));
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        socket.on("receive_direct_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("receive_direct_message");
        };
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;
        socket.emit("send_direct_message", {
            receiver_id: 2, // TODO: Replace with actual selected user ID
            content: input,
        });
        setInput("");
    };

    return (
        <div className="direct-chat-container">
            <div className="direct-chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id || Math.random()} className="message">
                        <strong>User {msg.sender_id}:</strong> {msg.content}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="direct-chat-input-row">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="direct-chat-input"
                    placeholder="Type a direct message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button onClick={handleSend} className="direct-chat-send">
                    Send
                </button>
            </div>
        </div>
    );
};

export default DirectMessages;
