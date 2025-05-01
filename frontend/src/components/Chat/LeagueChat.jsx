// src/components/Chat/LeagueChat.jsx

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

const LeagueChat = ({
    leagues,
    messagesByLeague,
    selectedLeagueId,
    setSelectedLeagueId,
    currentUserId,
    input,
    setInput,
    messagesEndRef,
    userMap,
    handleSend,
    setSlideDirection,
    setSelectedUserId
}) => {
    // Sort leagues by latestTimestamp (most recent first)
    const sortedLeagues = [...leagues].sort((a, b) => {
        if (!b.latestTimestamp) return -1;
        if (!a.latestTimestamp) return 1;
        return new Date(b.latestTimestamp) - new Date(a.latestTimestamp);
    });

    // Scroll instantly to bottom when opening a chat
    useEffect(() => {
        if (messagesEndRef && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [selectedLeagueId, messagesEndRef]);

    // Smooth scroll when new messages arrive
    useEffect(() => {
        if (messagesEndRef && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messagesByLeague, selectedLeagueId, messagesEndRef]);

    // League List View
    if (!selectedLeagueId) {
        return (
            <div className="user-list-scrollable">
                {sortedLeagues.map((league) => (
                    <div
                        key={league.league_id}
                        className={`user-list-item${league.unreadCount > 0 ? " unread" : ""}`}
                        onClick={() => setSelectedLeagueId(league.league_id)}
                    >
                        <div className="user-list-row">
                            <div className="username">{league.league_name}</div>
                            <div className="meta">{league.latestMeta}</div>
                        </div>
                        <div className="preview">{league.latestMessage}</div>
                        {league.unreadCount > 0 && (
                            <span className="unread-badge">{league.unreadCount}</span>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // League Chat View
    return (
        <div className="chat-window">
            <div className="chat-header">
                <button
                    onClick={() => {
                        setSlideDirection("slide-left");
                        setSelectedLeagueId(null);
                        if (setSelectedUserId) setSelectedUserId(null);
                    }}
                    className="chat-back-btn"
                    aria-label="Back to league list"
                >
                    ↩
                </button>
                <span className="chat-title">
                    {leagues.find((l) => l.league_id === selectedLeagueId)?.league_name || "League Chat"}
                </span>
            </div>
            <div className="chat-messages">
                {(messagesByLeague[selectedLeagueId] || []).map((msg) => {
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
                                        isMe ? "You" : userMap[msg.sender_id] || msg.sender_id,
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
                    disabled={!selectedLeagueId}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default LeagueChat;
