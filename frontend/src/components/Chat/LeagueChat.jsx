// src/components/Chat/LeagueChat.jsx
import React, { useEffect, useState, useRef } from "react";
import socket from "../../socket";
import { getAuthToken } from "../utils/auth";
import "./LeagueChat.css";

const LeagueChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const chat_id = localStorage.getItem("chat_id");
    const league_id = localStorage.getItem("league_id");
    const token = getAuthToken();

    useEffect(() => {
        if (!chat_id || !league_id || !token) return;

        fetch("/api/chat/league/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ chat_id }),
        })
            .then((res) => res.json())
            .then((data) => {
                setMessages(data);
            })
            .catch((err) => console.error("Error loading messages:", err));
    }, [chat_id]);

    useEffect(() => {
        if (!league_id) return;

        socket.emit("join_league_chat", { league_id });

        socket.on("receive_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off("receive_message");
        };
    }, [league_id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        socket.emit("send_message", { content: input, league_id });
        setInput("");
    };

    return (
        <div className="league-chat">
            <div className="message-container">
                {messages.map((msg) => (
                    <div key={msg.id || Math.random()} className="message">
                        <strong>User {msg.sender_id}:</strong> {msg.content}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
};

export default LeagueChat;
