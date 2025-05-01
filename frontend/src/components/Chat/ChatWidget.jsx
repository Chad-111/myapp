// src/components/ChatWidget.jsx

import React, { useState, useRef, useEffect } from "react";
import LeagueChat from "./LeagueChat";
import DirectMessages from "./DirectMessages";
import socket from "../../socket";
import { getAuthToken } from "../utils/auth";
import "./ChatWidget.css";

function formatMessageMeta(name, timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date >= today) {
        return `${name} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}`;
    } else if (date >= yesterday) {
        return `${name} · Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}`;
    } else {
        return `${name} · ${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}`;
    }
}

const ChatWidget = () => {
    const [visible, setVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("league");
    const prevTab = useRef("league");
    const [slideDirection, setSlideDirection] = useState("");

    // Direct Messages state
    const [usersList, setUsersList] = useState([]);
    const [messagesByUser, setMessagesByUser] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [dmInput, setDmInput] = useState("");
    const dmMessagesEndRef = useRef(null);

    // League Chat state
    const [leagues, setLeagues] = useState([]);
    const [messagesByLeague, setMessagesByLeague] = useState({});
    const [selectedLeagueId, setSelectedLeagueId] = useState(null);
    const [leagueInput, setLeagueInput] = useState("");
    const leagueMessagesEndRef = useRef(null);
    const [userMap, setUserMap] = useState({});

    // Unread counts
    const [dmUnreadCount, setDmUnreadCount] = useState(0);
    const [leagueUnreadCount, setLeagueUnreadCount] = useState(0);

    const totalUnreadCount = dmUnreadCount + leagueUnreadCount;

    const token = getAuthToken();

    useEffect(() => {
        if (slideDirection) {
            const timer = setTimeout(() => setSlideDirection(""), 400);
            return () => clearTimeout(timer);
        }
    }, [slideDirection]);

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
                    unreadCount: 0,
                    latestTimestamp: null,
                }));
                setUsersList(filteredUsers);

                // Fetch latest message & unread count for each user
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
                            let unread = 0;
                            let lastMsg = null;
                            if (messages && messages.length > 0) {
                                lastMsg = messages[messages.length - 1];
                                unread = messages.filter(
                                    m => !m.read && m.receiver_id === currentUserId
                                ).length;
                            }
                            setUsersList(prev =>
                                prev.map(u =>
                                    u.id === user.id
                                        ? {
                                            ...u,
                                            latestMessage: lastMsg ? lastMsg.content : "",
                                            latestMeta: lastMsg
                                                ? formatMessageMeta(
                                                    lastMsg.sender_id === currentUserId
                                                        ? "You"
                                                        : user.username,
                                                    lastMsg.timestamp
                                                )
                                                : "",
                                            unreadCount: unread,
                                            latestTimestamp: lastMsg ? lastMsg.timestamp : null,
                                        }
                                        : u
                                )
                            );
                        });
                });
            });

        // Fetch user map for league chat
        fetch("/api/users", {
            headers: { Authorization: "Bearer " + token }
        })
            .then(res => res.json())
            .then(users => {
                const map = {};
                users.forEach(u => { map[u.id] = u.username; });
                setUserMap(map);
            });
    }, [token, currentUserId]);

    // Fetch leagues and join rooms
    useEffect(() => {
        if (!token || !currentUserId || Object.keys(userMap).length === 0) return;

        fetch("/api/league/search", {
            method: "POST",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({}),
        })
            .then((res) => res.json())
            .then((data) => {
                if (!data.message) return;
                const leaguesArr = data.message.map((l) => ({
                    ...l,
                    latestMessage: "",
                    latestMeta: "",
                }));
                setLeagues(leaguesArr);

                // Join all league rooms for live updates
                leaguesArr.forEach((league) => {
                    socket.emit("join_league_chat", { league_id: league.league_id });
                });

                // Fetch latest message for each league
                leaguesArr.forEach((league) => {
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
                                                ),
                                                latestTimestamp: lastMsg.timestamp,
                                            }
                                            : l
                                    )
                                );
                            }
                        });
                });
            });
    }, [token, currentUserId, userMap]);

    // Fetch league unread counts and meta
    useEffect(() => {
        if (!token) return;
        fetch("/api/chat/league/summary", {
            headers: { Authorization: "Bearer " + token }
        })
            .then(res => res.json())
            .then(data => {
                setLeagues(prevLeagues => {
                    return prevLeagues.map(l => {
                        const found = data.find(d => d.league_id === l.league_id);
                        if (found) {
                            return {
                                ...l,
                                latestMessage: found.latestMessage,
                                latestMeta: formatMessageMeta(
                                    found.latestMeta.sender_id === currentUserId ? "You" : userMap[found.latestMeta.sender_id] || found.latestMeta.sender_id,
                                    found.latestMeta.timestamp
                                ),
                                unreadCount: found.unreadCount,
                                latestTimestamp: found.latestMeta.timestamp
                            };
                        }
                        return l;
                    });
                });
            });
    }, [token, currentUserId, userMap]);

    // Fetch messages for selected league
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
            });
    }, [token, selectedLeagueId]);

    // Fetch messages for selected user
    useEffect(() => {
        if (!token || !selectedUserId) return;
        fetch("/api/chat/direct/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ other_user_id: selectedUserId }),
        })
            .then(res => res.json())
            .then(data => {
                setMessagesByUser(prev => ({
                    ...prev,
                    [selectedUserId]: Array.isArray(data) ? data : [],
                }));
            });
    }, [token, selectedUserId]);

    // Mark league messages as read
    useEffect(() => {
        if (!token || !selectedLeagueId) return;
        fetch("/api/chat/league/mark_read", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ chat_id: leagues.find(l => l.league_id === selectedLeagueId)?.chat_id })
        }).then(() => {
            setLeagues(prev =>
                prev.map(l =>
                    l.league_id === selectedLeagueId
                        ? { ...l, unreadCount: 0 }
                        : l
                )
            );
        });
    }, [token, selectedLeagueId, leagues]);

    // Mark direct messages as read
    useEffect(() => {
        if (!token || !selectedUserId) return;
        fetch("/api/chat/direct/mark_read", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({ other_user_id: selectedUserId })
        }).then(() => {
            setUsersList(prev =>
                prev.map(u =>
                    u.id === selectedUserId
                        ? { ...u, unreadCount: 0 }
                        : u
                )
            );
        });
    }, [token, selectedUserId]);

    // Socket listeners for real-time updates
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
                prev.map((u) => {
                    const isCurrentChat = u.id === (msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id);
                    const isUnread = msg.receiver_id === currentUserId && msg.sender_id === u.id;
                    const isChatOpen = selectedUserId === u.id;
                    return isCurrentChat
                        ? {
                            ...u,
                            latestMessage: msg.content,
                            latestMeta: formatMessageMeta(
                                msg.sender_id === currentUserId ? "You" : u.username,
                                msg.timestamp
                            ),
                            latestTimestamp: msg.timestamp,
                            unreadCount:
                                isUnread && !isChatOpen
                                    ? (u.unreadCount || 0) + 1
                                    : u.unreadCount || 0,
                        }
                        : u;
                })
            );
        });

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
                            ),
                            latestTimestamp: msg.timestamp,
                            unreadCount:
                                msg.sender_id !== currentUserId && selectedLeagueId !== l.league_id
                                    ? (l.unreadCount || 0) + 1
                                    : l.unreadCount || 0,
                        }
                        : l
                )
            );
        });

        return () => {
            socket.off("receive_direct_message");
            socket.off("receive_message");
        };
    }, [currentUserId, selectedUserId, userMap, selectedLeagueId]);

    // Calculate total unread counts
    useEffect(() => {
        setDmUnreadCount(usersList.reduce((sum, u) => sum + (u.unreadCount || 0), 0));
    }, [usersList]);
    useEffect(() => {
        setLeagueUnreadCount(leagues.reduce((sum, l) => sum + (l.unreadCount || 0), 0));
    }, [leagues]);

    // Slide transition
    const getSlideClass = () => {
        if (activeTab === prevTab.current) return "";
        const direction = activeTab === "league" ? "slide-left" : "slide-right";
        prevTab.current = activeTab;
        return direction;
    };

    // Handle sending direct message
    const handleSendDM = () => {
        if (!dmInput.trim() || !selectedUserId) return;
        socket.emit("send_direct_message", {
            receiver_id: selectedUserId,
            content: dmInput,
        });
        setDmInput("");
    };

    // Handle sending league message
    const handleSendLeague = () => {
        if (!leagueInput.trim() || !selectedLeagueId) return;
        socket.emit("send_message", {
            league_id: selectedLeagueId,
            content: leagueInput,
        });
        setLeagueInput("");
    };

    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        if (tab === "league") {
            setSelectedUserId(null); // Close DM chat when switching to League
        } else if (tab === "direct") {
            setSelectedLeagueId(null); // Close League chat when switching to DM
        }
    };

    return (
        <div className={`chat-widget ${visible ? "open" : ""}`}>
            <div className="chat-toggle" onClick={() => setVisible(!visible)}>
                💬
                {!visible && totalUnreadCount > 0 && (
                    <span className="chat-toggle-unread-badge">{totalUnreadCount}</span>
                )}
            </div>

            {visible && (
                <div className="chat-container">
                    <div className="chat-tabs">
                        <button
                            className={`tab-btn${activeTab === "league" ? " active" : ""}${leagueUnreadCount > 0 ? " unread" : ""}`}
                            onClick={() => handleTabSwitch("league")}
                        >
                            League Chat
                            {leagueUnreadCount > 0 && (
                                <span className="unread-badge">{leagueUnreadCount}</span>
                            )}
                        </button>
                        <button
                            className={`tab-btn${activeTab === "direct" ? " active" : ""}${dmUnreadCount > 0 ? " unread" : ""}`}
                            onClick={() => handleTabSwitch("direct")}
                        >
                            Direct Messages
                            {dmUnreadCount > 0 && (
                                <span className="unread-badge">{dmUnreadCount}</span>
                            )}
                        </button>
                    </div>

                    <div className={`chat-body-transition ${slideDirection || getSlideClass()}`}>
                        {activeTab === "league" ? (
                            <LeagueChat
                                leagues={leagues}
                                setLeagues={setLeagues}
                                messagesByLeague={messagesByLeague}
                                setMessagesByLeague={setMessagesByLeague}
                                selectedLeagueId={selectedLeagueId}
                                setSelectedLeagueId={setSelectedLeagueId}
                                currentUserId={currentUserId}
                                input={leagueInput}
                                setInput={setLeagueInput}
                                messagesEndRef={leagueMessagesEndRef}
                                userMap={userMap}
                                handleSend={handleSendLeague}
                                setSlideDirection={setSlideDirection}
                            />
                        ) : (
                            <DirectMessages
                                usersList={usersList}
                                setUsersList={setUsersList}
                                messagesByUser={messagesByUser}
                                setMessagesByUser={setMessagesByUser}
                                selectedUserId={selectedUserId}
                                setSelectedUserId={setSelectedUserId}
                                currentUserId={currentUserId}
                                input={dmInput}
                                setInput={setDmInput}
                                messagesEndRef={dmMessagesEndRef}
                                handleSend={handleSendDM}
                                setSlideDirection={setSlideDirection}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
