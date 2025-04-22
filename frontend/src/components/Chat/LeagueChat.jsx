import React, { useState, useEffect, useRef } from 'react';
import socket from '../../socket';
import { getAuthToken } from '../utils/auth';
import LeagueSelector from "./LeagueSelector";
import "./LeagueChat.css";

const LeagueChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    // Missing implementation for loadMessages
    const loadMessages = async () => {
        const token = getAuthToken();
        const leagueId = localStorage.getItem("league_id");

        try {
            const response = await fetch(`http://localhost:5000/api/league/${leagueId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setMessages(data.messages);
        } catch (error) {
            console.error("Error loading messages:", error);
        }
    };

    // Missing implementation for handleSend
    const handleSend = () => {
        if (!input.trim()) return;

        const leagueId = localStorage.getItem("league_id");
        socket.emit("send_message", {
            league_id: leagueId,
            content: input
        });
        setInput("");
    };

    useEffect(() => {
        // Load initial messages
        loadMessages();

        // Listen for new messages
        socket.on("receive_message", (message) => {
            setMessages(prev => [...prev, message]);
        });

        // Join the league chat room
        const leagueId = localStorage.getItem("league_id");
        socket.emit("join_league_chat", { league_id: leagueId });

        return () => {
            socket.off("receive_message");
        };
    }, []);

    return (
        <div className="league-chat">
            <div className="message-container" ref={messagesEndRef}>
                {messages.map((msg, index) => (
                    <div key={index} className="message">
                        <strong>{msg.sender_id}:</strong> {msg.content}
                    </div>
                ))}
            </div>
            <div className="input-container">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                />
                <button onClick={handleSend}>Send</button>
            </div>
        </div>
    );
};

export default LeagueChat;
