import React, { useState, useEffect, useRef } from "react";
import socket from "../../socket";
import { getAuthToken } from "../utils/auth";
import "./Chat.css";

const LeagueChat = () => {
    const [leagues, setLeagues] = useState([]);
    const [messagesByLeague, setMessagesByLeague] = useState({});
    const [selectedLeagueId, setSelectedLeagueId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [input, setInput] = useState("");
    const [view, setView] = useState("list"); // "list" or "chat"
    const messagesEndRef = useRef(null);

    const token = getAuthToken();

    // Fetch current user and leagues
    useEffect(() => {
        if (!token) return;

        fetch("/api/me", {
            headers: { Authorization: "Bearer " + token },
        })
            .then((res) => res.json())
            .then((data) => setCurrentUserId(data.id));

        fetch("/api/league/search", {
            method: "POST",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({}),
        })
            .then((res) => res.json())
            .then((data) => {
                setLeagues(
                    data.message.map((l) => ({
                        ...l,
                        latestMessage: "",
                    }))
                );
            });
    }, [token, currentUserId]);

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
                                ? { ...l, latestMessage: lastMsg.content }
                                : l
                        )
                    );
                }
            });
    }, [token, selectedLeagueId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messagesByLeague, selectedLeagueId]);

    useEffect(() => {
        socket.on("receive_message", (msg) => {
            console.log("Received league message:", msg);
            setMessagesByLeague((prev) => ({
                ...prev,
                [msg.league_id]: [...(prev[msg.league_id] || []), msg],
            }));
            setLeagues((prev) =>
                prev.map((l) =>
                    l.league_id === msg.league_id
                        ? { ...l, latestMessage: msg.content }
                        : l
                )
            );
        });
        return () => socket.off("receive_message");
    }, []);

    useEffect(() => {
        if (view === "chat" && selectedLeagueId) {
            console.log("Joining league room:", selectedLeagueId);
            socket.emit("join_league_chat", { league_id: selectedLeagueId });
        }
    }, [view, selectedLeagueId]);

    const handleSend = () => {
        if (!input.trim() || !selectedLeagueId) return;
        console.log("Sending message to league:", selectedLeagueId, "content:", input);
        socket.emit("send_message", {
            league_id: selectedLeagueId,
            content: input,
        });

        // Optimistically update latestMessage for the selected league
        setLeagues(prev =>
            prev.map(l =>
                l.league_id === selectedLeagueId
                    ? { ...l, latestMessage: input }
                    : l
            )
        );

        // Optimistically add the message to the chat window
        setMessagesByLeague(prev => ({
            ...prev,
            [selectedLeagueId]: [
                ...(prev[selectedLeagueId] || []),
                {
                    id: Date.now(), // temporary id
                    league_id: selectedLeagueId,
                    sender_id: currentUserId,
                    content: input,
                }
            ]
        }));

        setInput("");
    };

    // League List View
    if (view === "list") {
        return (
            <div className="user-list-scrollable" style={{ maxHeight: 400, overflowY: "auto" }}>
                {leagues.map((league) => (
                    <div
                        key={league.league_id}
                        className="user-list-item"
                        onClick={() => {
                            setSelectedLeagueId(league.league_id);
                            setView("chat");
                        }}
                        style={{ cursor: "pointer", padding: 12, borderBottom: "1px solid #eee" }}
                    >
                        <div className="username" style={{ fontWeight: "bold" }}>{league.league_name}</div>
                        <div className="preview" style={{ color: "#888", fontSize: "0.9em" }}>
                            {league.latestMessage}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // League Chat View
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
                    aria-label="Back to league list"
                >
                    ←
                </button>
                <span style={{ fontWeight: "bold", fontSize: 18 }}>
                    {leagues.find((l) => l.league_id === selectedLeagueId)?.league_name || "League Chat"}
                </span>
            </div>
            <div className="chat-messages" style={{ minHeight: 200, maxHeight: 300, overflowY: "auto", padding: 12, background: "#fff", borderRadius: 4, marginBottom: 8 }}>
                {(messagesByLeague[selectedLeagueId] || []).map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    // You can fetch usernames if you want, or just show IDs
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
                                    {isMe ? "You" : msg.sender_id}
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
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
                />
                <button
                    onClick={handleSend}
                    className="chat-send"
                    disabled={!selectedLeagueId}
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

export default LeagueChat;
