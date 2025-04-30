// src/components/ChatWidget.jsx

import React, { useState, useRef } from "react";
import LeagueChat from "./LeagueChat";
import DirectMessages from "./DirectMessages";
import "./ChatWidget.css";

const ChatWidget = () => {
    const [visible, setVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("league");
    const prevTab = useRef("league");

    // Determine slide direction
    const getSlideClass = () => {
        if (activeTab === prevTab.current) return "";
        const direction = activeTab === "league" ? "slide-left" : "slide-right";
        prevTab.current = activeTab;
        return direction;
    };

    return (
        <div className={`chat-widget ${visible ? "open" : ""}`}>
            <div className="chat-toggle" onClick={() => setVisible(!visible)}>
                💬
            </div>

            {visible && (
                <div className="chat-container">
                    <div className="chat-tabs">
                        <button
                            className={activeTab === "league" ? "active" : ""}
                            onClick={() => setActiveTab("league")}
                        >
                            League Chat
                        </button>
                        <button
                            className={activeTab === "direct" ? "active" : ""}
                            onClick={() => setActiveTab("direct")}
                        >
                            Direct Messages
                        </button>
                    </div>

                    <div className={`chat-body-transition ${getSlideClass()}`}>
                        {activeTab === "league" ? <LeagueChat /> : <DirectMessages />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
