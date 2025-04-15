export default function ChatTabs({ activeTab, setActiveTab }) {
    return (
        <div className="chat-tabs">
            <button
                className={activeTab === "league" ? "active" : ""}
                onClick={() => setActiveTab("league")}
            >
                League Chats
            </button>
            <button
                className={activeTab === "direct" ? "active" : ""}
                onClick={() => setActiveTab("direct")}
            >
                Direct Messages
            </button>
        </div>
    );
}
