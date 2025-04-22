// src/components/Chat/LeagueSelector.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";

export default function LeagueSelector({ onSelect }) {
    const [leagues, setLeagues] = useState([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState(localStorage.getItem("league_id"));

    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const res = await axios.post(
                    "/api/league/search",
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${getAuthToken()}`,
                        },
                    }
                );
                setLeagues(res.data.message);
            } catch (err) {
                console.error("Failed to load leagues", err);
            }
        };

        fetchLeagues();
    }, []);

    const handleSelect = async (league) => {
        localStorage.setItem("league_id", league.league_id);
        const initRes = await axios.post(
            "/api/chat/league/init",
            { league_id: league.league_id },
            {
                headers: {
                    Authorization: `Bearer ${getAuthToken()}`,
                },
            }
        );

        localStorage.setItem("chat_id", initRes.data.chat_id);
        setSelectedLeagueId(league.league_id);
        onSelect(); // callback to refresh chat
    };

    return (
        <div style={{ paddingBottom: "10px" }}>
            <label>Select League:</label>
            <select
                onChange={(e) => {
                    const league = leagues.find(l => l.league_id === parseInt(e.target.value));
                    handleSelect(league);
                }}
                value={selectedLeagueId || ""}
            >
                <option value="" disabled>Select a league</option>
                {leagues.map((l) => (
                    <option key={l.league_id} value={l.league_id}>
                        {l.league_name}
                    </option>
                ))}
            </select>
        </div>
    );
}
