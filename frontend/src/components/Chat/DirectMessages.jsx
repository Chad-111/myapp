// src/components/Chat/DirectMessages.jsx

import React, { useState, useEffect, useRef } from "react";
import { getAuthToken } from "../utils/auth";
import socket from "../../socket";
import "./Chat.css";

function formatMessageMeta(name, timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date >= today) {
        return `${name} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date >= yesterday) {
        return `${name} · Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return `${name} · ${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
}

const DirectMessages = () => {
    const [usersList, setUsersList] = useState([]);
    const [messagesByUser, setMessagesByUser] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const token = getAuthToken();

    // Fetch current user and users list
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
                const filteredUsers = data.filter(u => u.id !== currentUserId).map(u => ({
                    ...u,
                    latestMessage: "",
                    latestMeta: "",
                }));
                setUsersList(filteredUsers);

                // Fetch latest message for each user
                filteredUsers.forEach((user) => {
                    fetch("/api/chat/direct/messages", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + token,
                        },
                        body: JSON.stringify({ other_user_id: user.id })
                    })
                        .then((res) => res.json())
                        .then((messages) => {
                            if (messages && messages.length > 0) {
                                const lastMsg = messages[messages.length - 1];
                                setUsersList(prev =>
                                    prev.map(u =>
                                        u.id === user.id
                                            ? {
                                                ...u,
                                                latestMessage: lastMsg.content,
                                                latestMeta: formatMessageMeta(
                                                    lastMsg.sender_id === currentUserId
                                                        ? "You"
                                                        : user.username,
                                                    lastMsg.timestamp
                                                )
                                            }
                                            : u
                                    )
                                );
                            }
                        });
                });
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
            setMessagesByUser((prev) => ({
                ...prev,
                [msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id]: [
                    ...(prev[msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id] || []),
                    msg,
                ],
            }));
            setUsersList((prev) =>
                prev.map((u) =>
                    u.id === (msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id)
                        ? {
                            ...u,
                            latestMessage: msg.content,
                            latestMeta: formatMessageMeta(
                                msg.sender_id === currentUserId ? "You" : u.username,
                                msg.timestamp
                            )
                        }
                        : u
                )
            );
        });
        return () => socket.off("receive_direct_message");
    }, [currentUserId]);

    const handleSend = () => {
        if (!input.trim() || !selectedUserId) return;
        const now = new Date();
        socket.emit("send_direct_message", {
            receiver_id: selectedUserId,
            content: input,
        });
        // Optimistically update latestMessage and latestMeta for the selected user
        setUsersList((prev) =>
            prev.map((u) =>
                u.id === selectedUserId
                    ? {
                        ...u,
                        latestMessage: input,
                        latestMeta: formatMessageMeta("You", now)
                    }
                    : u
            )
        );
        setInput("");
    };

    // User List View
    if (!selectedUserId) {
        return (
            <div className="user-list-scrollable">
                {usersList.map((user) => (
                    <div
                        key={user.id}
                        className="user-list-item"
                        onClick={() => setSelectedUserId(user.id)}
                    >
                        <div className="user-list-row">
                            <div className="username">{user.username}</div>
                            <div className="meta">{user.latestMeta}</div>
                        </div>
                        <div className="preview">{user.latestMessage}</div>
                    </div>
                ))}
            </div>
        );
    }

    // Direct Chat View
    return (
        <div className="chat-window">
            <div className="chat-header">
                <button
                    onClick={() => setSelectedUserId(null)}
                    className="chat-back-btn"
                    aria-label="Back to user list"
                >
                    ←
                </button>
                <span className="chat-title">
                    {usersList.find((u) => u.id === selectedUserId)?.username || "Direct Message"}
                </span>
            </div>
            <div className="chat-messages">
                {(messagesByUser[selectedUserId] || []).map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div
                            key={msg.id || Math.random()}
                            className={`message ${isMe ? "my-message" : "their-message"}`}
                        >
                            <div className="message-bubble">
                                {msg.content}
                            </div>
                            {msg.timestamp && (
                                <div className="message-meta">
                                    {formatMessageMeta(
                                        isMe ? "You" : usersList.find(u => u.id === msg.sender_id)?.username || msg.sender_id,
                                        msg.timestamp
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-row">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="chat-input"
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                    onClick={handleSend}
                    className="chat-send"
                    disabled={!selectedUserId}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default DirectMessages;
