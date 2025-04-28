// src/components/Chat/ChatInput.jsx

import React, { useState } from 'react';
import ChatTabs from './ChatTabs';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

export default function ChatWindow() {
    const [activeTab, setActiveTab] = useState("league"); // or "direct"

    return (
        <div className="chat-window">
            <ChatTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <ChatMessages activeTab={activeTab} />
            <ChatInput activeTab={activeTab} />
        </div>
    );
}
