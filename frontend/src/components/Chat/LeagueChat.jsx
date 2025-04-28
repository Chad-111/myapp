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
        <div className="chat-window">
            <div className="chat-header">
                <button
                    onClick={() => setView("list")}
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
                                <div className="message-sender">
                                    {isMe ? "You" : userMap[msg.sender_id] || msg.sender_id}
                                </div>
                                {msg.content}
                            </div>
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
