// src/components/Chat/LeagueChat.jsx

import React, { useState, useEffect, useRef } from "react";
import socket from "../../socket";
import { getAuthToken } from "../utils/auth";
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

const LeagueChat = () => {
    const [leagues, setLeagues] = useState([]);
    const [messagesByLeague, setMessagesByLeague] = useState({});
    const [selectedLeagueId, setSelectedLeagueId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const [userMap, setUserMap] = useState({});

    const token = getAuthToken();

    // Fetch current user and leagues
    useEffect(() => {
        if (!token) return;

        fetch("/api/me", {
            headers: { Authorization: "Bearer " + token },
        })
            .then((res) => res.json())
            .then((data) => setCurrentUserId(data.id));

        fetch("/api/users", {
            headers: { Authorization: "Bearer " + token }
        })
            .then(res => res.json())
            .then(users => {
                const map = {};
                users.forEach(u => { map[u.id] = u.username; });
                setUserMap(map);
            });
    }, [token]);

    useEffect(() => {
        if (!token || !currentUserId || Object.keys(userMap).length === 0) return;

        fetch("/api/league/search", {
            method: "POST",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({}), // always send a body
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data.message) {
                    throw new Error(data.error || "No leagues found");
                }
                const leagues = data.message.map((l) => ({
                    ...l,
                    latestMessage: "",
                    latestMeta: "",
                }));
                setLeagues(leagues);

                // Join all league rooms for live updates
                leagues.forEach((league) => {
                    socket.emit("join_league_chat", { league_id: league.league_id });
                });

                // Fetch latest message for each league
                leagues.forEach((league) => {
                    fetch(`/api/league/${league.league_id}/messages`, {
                        headers: { Authorization: "Bearer " + token },
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.messages && data.messages.length > 0) {
                                const lastMsg = data.messages[data.messages.length - 1];
                                setLeagues(prev =>
                                    prev.map(l =>
                                        l.league_id === league.league_id
                                            ? {
                                                ...l,
                                                latestMessage: lastMsg.content,
                                                latestMeta: formatMessageMeta(
                                                    lastMsg.sender_id === currentUserId
                                                        ? "You"
                                                        : userMap[lastMsg.sender_id] || lastMsg.sender_id,
                                                    lastMsg.timestamp
                                                )
                                            }
                                            : l
                                    )
                                );
                            }
                        });
                });
            })
            .catch(e => {
                console.error(e.message || e);
            });
    }, [token, currentUserId, userMap]);

    // Load messages for the selected league
    useEffect(() => {
        if (!token || !selectedLeagueId) return;

        fetch(`/api/league/${selectedLeagueId}/messages`, {
            headers: { Authorization: "Bearer " + token },
        })
            .then((res) => res.json())
            .then((data) => {
                setMessagesByLeague((prev) => ({
                    ...prev,
                    [selectedLeagueId]: Array.isArray(data.messages) ? data.messages : [],
                }));
                if (data.messages && data.messages.length > 0) {
                    const lastMsg = data.messages[data.messages.length - 1];
                    setLeagues((prev) =>
                        prev.map((l) =>
                            l.league_id === selectedLeagueId
                                ? {
                                    ...l,
                                    latestMessage: lastMsg.content,
                                    latestMeta: formatMessageMeta(
                                        lastMsg.sender_id === currentUserId
                                            ? "You"
                                            : userMap[lastMsg.sender_id] || lastMsg.sender_id,
                                        lastMsg.timestamp
                                    )
                                }
                                : l
                        )
                    );
                }
            });
    }, [token, selectedLeagueId]);

    useEffect(() => {
        // Instant scroll when switching chats
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [selectedLeagueId]);

    useEffect(() => {
        // Smooth scroll when new messages arrive in the current chat
        if (messagesByLeague[selectedLeagueId]?.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messagesByLeague, selectedLeagueId]);

    useEffect(() => {
        socket.on("receive_message", (msg) => {
            setMessagesByLeague((prev) => ({
                ...prev,
                [msg.league_id]: [...(prev[msg.league_id] || []), msg],
            }));
            setLeagues((prev) =>
                prev.map((l) =>
                    l.league_id === msg.league_id
                        ? {
                            ...l,
                            latestMessage: msg.content,
                            latestMeta: formatMessageMeta(
                                msg.sender_id === currentUserId ? "You" : userMap[msg.sender_id] || msg.sender_id,
                                msg.timestamp
                            )
                        }
                        : l
                )
            );
        });
        return () => socket.off("receive_message");
    }, [currentUserId, userMap]);

    const handleSend = () => {
        if (!input.trim() || !selectedLeagueId) return;
        socket.emit("send_message", {
            league_id: selectedLeagueId,
            content: input,
        });

        // Optimistically update latestMessage for the selected league
        const now = new Date();
        setLeagues(prev =>
            prev.map(l =>
                l.league_id === selectedLeagueId
                    ? {
                        ...l,
                        latestMessage: input,
                        latestMeta: formatMessageMeta("You", now)
                    }
                    : l
            )
        );

        setInput("");
    };

    // Remove view state: just use selectedLeagueId for view switching
    if (!selectedLeagueId) {
        // League List View
        return (
            <div className="user-list-scrollable">
                {leagues.map((league) => (
                    <div
                        key={league.league_id}
                        className="user-list-item"
                        onClick={() => setSelectedLeagueId(league.league_id)}
                    >
                        <div className="user-list-row">
                            <div className="username">{league.league_name}</div>
                            <div className="meta">{league.latestMeta}</div>
                        </div>
                        <div className="preview">
                            {league.latestMessage}
                        </div>
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
                    onClick={() => setSelectedLeagueId(null)}
                    className="chat-back-btn"
                    aria-label="Back to league list"
                >
                    ←
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
