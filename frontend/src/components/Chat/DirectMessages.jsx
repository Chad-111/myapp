// src/components/Chat/DirectMessages.jsx

import React, { useEffect } from "react";
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

const DirectMessages = ({
    usersList,
    messagesByUser,
    selectedUserId,
    setSelectedUserId,
    currentUserId,
    input,
    setInput,
    messagesEndRef,
    handleSend,
    setSlideDirection
}) => {
    // Sort users by latestTimestamp (most recent first)
    const sortedUsers = [...usersList].sort((a, b) => {
        if (!b.latestTimestamp) return -1;
        if (!a.latestTimestamp) return 1;
        return new Date(b.latestTimestamp) - new Date(a.latestTimestamp);
    });

    // Scroll instantly to bottom when opening a chat
    useEffect(() => {
        if (messagesEndRef && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [selectedUserId, messagesEndRef]);

    // Smooth scroll when new messages arrive
    useEffect(() => {
        if (messagesEndRef && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messagesByUser, selectedUserId, messagesEndRef]);

    // User List View
    if (!selectedUserId) {
        return (
            <div className="user-list-scrollable">
                {sortedUsers.map((user) => (
                    <div
                        key={user.id}
                        className={`user-list-item${user.unreadCount > 0 ? " unread" : ""}`}
                        onClick={() => setSelectedUserId(user.id)}
                    >
                        <div className="user-list-row">
                            <div className="username">{user.username}</div>
                            <div className="meta">{user.latestMeta}</div>
                        </div>
                        <div className="preview">{user.latestMessage}</div>
                        {user.unreadCount > 0 && (
                            <span className="unread-badge">{user.unreadCount}</span>
                        )}
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
                    onClick={() => {
                        setSlideDirection("slide-left");
                        setSelectedUserId(null);
                    }}
                    className="chat-back-btn"
                    aria-label="Back to user list"
                >
                    ↩
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
