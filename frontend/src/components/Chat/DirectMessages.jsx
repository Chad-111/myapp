// src/components/Chat/DirectMessages.jsx

import React, { useEffect, useState, useRef } from "react";
import socket from "../../socket";
import { getAuthToken } from "../utils/auth";
import "./DirectMessages.css";

const DirectMessages = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const messagesEndRef = useRef(null);

    const token = getAuthToken();

    // Fetch available users and current user's ID
    useEffect(() => {
        if (!token) return;

        // Get current user info
        fetch("/api/me", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setCurrentUserId(data.id);
            });

        // Get list of all users
        fetch("/api/users", {
            method: "GET",
            headers: {
                Authorization: "Bearer " + token,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setUsers(data);
            })
            .catch((err) => console.error("Error loading users:", err));
    }, [token]);

    // Load direct messages for the current user
    useEffect(() => {
        if (!token || !selectedUserId) return; // Only fetch if a user is selected

        fetch("/api/chat/direct/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ other_user_id: selectedUserId })
        })
            .then((res) => {
                if (!res.ok) return []; // Return empty array on error
                return res.json();
            })
            .then((data) => {
                setMessages(Array.isArray(data) ? data : []); // Defensive: always set an array
            })
            .catch((err) => {
                setMessages([]); // Defensive: always set an array
                console.error("Error loading direct messages:", err);
            });
    }, [token, selectedUserId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Listen for real-time direct messages
    useEffect(() => {
        socket.on("receive_direct_message", (msg) => {
            console.log("Received direct message:", msg);
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("receive_direct_message");
        };
    }, []);

    // Send a message to the selected user
    const handleSend = () => {
    if (!input.trim() || !selectedUserId) {
        console.log('Input or selected user missing.');
        return;
    }

    console.log('Emitting send_direct_message', { receiver_id: selectedUserId, content: input });

    socket.emit("send_direct_message", {
        receiver_id: selectedUserId,
        content: input,
    }, (response) => {
        console.log("Acknowledgment from backend:", response);
    });

    setInput("");
};


    return (
        <div className="direct-chat-container">
            {/* User selector */}
            <div className="dm-select-user">
                <label>Select User:</label>
                <select
                    onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                    value={selectedUserId || ""}
                >
                    <option value="" disabled>
                        Select a user
                    </option>
                    {users
                        .filter((u) => u.id !== currentUserId)
                        .map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.username}
                            </option>
                        ))}
                </select>
            </div>

            {/* Messages display */}
            <div className="direct-chat-messages">
                {messages.map((msg) => (
                    <div key={msg.id || Math.random()} className="message">
                        <strong>User {msg.sender_id}:</strong> {msg.content}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input + send button */}
            <div className="direct-chat-input-row">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="direct-chat-input"
                    placeholder="Type a direct message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                    onClick={handleSend}
                    className="direct-chat-send"
                    disabled={!selectedUserId}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default DirectMessages;
