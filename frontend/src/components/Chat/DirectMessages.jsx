// src/components/Chat/DirectMessages.jsx

import React, { useEffect, useState, useRef } from "react";
import socket from "../../socket";
import { getAuthToken } from "../utils/auth";
import "./Chat.css";

const DirectMessages = () => {
    const [usersList, setUsersList] = useState([]);
    const [messagesByUser, setMessagesByUser] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [input, setInput] = useState("");
    const [view, setView] = useState("list"); // "list" or "chat"
    const messagesEndRef = useRef(null);

    const token = getAuthToken();

    // Fetch current user and all users
    useEffect(() => {
        if (!token) return;

        fetch("/api/me", {
            headers: { Authorization: "Bearer " + token },
        })
            .then((res) => res.json())
            .then((data) => setCurrentUserId(data.id));

        fetch("/api/users", {
            headers: { Authorization: "Bearer " + token },
        })
            .then((res) => res.json())
            .then((data) => {
                setUsersList(data.filter(u => u.id !== currentUserId).map(u => ({
                    ...u,
                    latestMessage: "",
                })));
            });
    }, [token, currentUserId]);

    // Load direct messages for the selected user
    useEffect(() => {
        if (!token || !selectedUserId) return;

        fetch("/api/chat/direct/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ other_user_id: selectedUserId })
        })
            .then((res) => res.json())
            .then((data) => {
                setMessagesByUser(prev => ({
                    ...prev,
                    [selectedUserId]: Array.isArray(data) ? data : [],
                }));
                if (data && data.length > 0) {
                    const lastMsg = data[data.length - 1];
                    setUsersList(prev =>
                        prev.map(u =>
                            u.id === selectedUserId
                                ? { ...u, latestMessage: lastMsg.content }
                                : u
                        )
                    );
                }
            });
    }, [token, selectedUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messagesByUser, selectedUserId]);

    useEffect(() => {
        socket.on("receive_direct_message", (msg) => {
            const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
            setMessagesByUser(prev => ({
                ...prev,
                [otherId]: [...(prev[otherId] || []), msg],
            }));
            setUsersList(prev =>
                prev.map(u =>
                    u.id === otherId
                        ? { ...u, latestMessage: msg.content }
                        : u
                )
            );
        });
        return () => socket.off("receive_direct_message");
    }, [currentUserId]);

    const handleSend = () => {
        if (!input.trim() || !selectedUserId) return;
        socket.emit("send_direct_message", {
            receiver_id: selectedUserId,
            content: input,
        });

        // Optimistically update latestMessage for the selected user
        setUsersList(prev =>
            prev.map(u =>
                u.id === selectedUserId
                    ? { ...u, latestMessage: input }
                    : u
            )
        );

        setInput("");
    };

    // --- RENDER ---

    // User List View
    if (view === "list") {
        return (
            <div className="user-list-scrollable" style={{ maxHeight: 400, overflowY: "auto" }}>
                {usersList.map(user => (
                    <div
                        key={user.id}
                        className="user-list-item"
                        onClick={() => {
                            setSelectedUserId(user.id);
                            setView("chat");
                        }}
                        style={{ cursor: "pointer", padding: 12, borderBottom: "1px solid #eee" }}
                    >
                        <div className="username" style={{ fontWeight: "bold" }}>{user.username}</div>
                        <div className="preview" style={{ color: "#888", fontSize: "0.9em" }}>
                            {user.latestMessage}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Chat View
    return (
        <div style={{ width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <button
                    onClick={() => setView("list")}
                    style={{
                        marginRight: 12,
                        background: "none",
                        border: "none",
                        fontSize: 22,
                        cursor: "pointer"
                    }}
                    aria-label="Back to user list"
                >
                    ←
                </button>
                <span style={{ fontWeight: "bold", fontSize: 18 }}>
                    {usersList.find(u => u.id === selectedUserId)?.username || "Chat"}
                </span>
            </div>
            <div className="chat-messages" style={{ minHeight: 200, maxHeight: 300, overflowY: "auto", padding: 12, background: "#fff", borderRadius: 4, marginBottom: 8 }}>
                {(messagesByUser[selectedUserId] || []).map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    const senderName = isMe
                        ? "You"
                        : usersList.find(u => u.id === msg.sender_id)?.username || "Unknown";
                    return (
                        <div
                            key={msg.id || Math.random()}
                            className={`message ${isMe ? "my-message" : "their-message"}`}
                            style={{
                                display: "flex",
                                justifyContent: isMe ? "flex-end" : "flex-start",
                                marginBottom: 8,
                            }}
                        >
                            <div
                                style={{
                                    background: isMe ? "#1976d2" : "#f1f1f1",
                                    color: isMe ? "#fff" : "#222",
                                    borderRadius: 8,
                                    padding: "8px 14px",
                                    maxWidth: "70%",
                                    wordBreak: "break-word",
                                    textAlign: isMe ? "right" : "left",
                                }}
                            >
                                <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 2 }}>
                                    {senderName}
                                </div>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-row" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="chat-input"
                    placeholder="Type a direct message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
                />
                <button
                    onClick={handleSend}
                    className="chat-send"
                    disabled={!selectedUserId}
                    style={{
                        padding: "8px 16px",
                        background: "#1976d2",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer"
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default DirectMessages;
