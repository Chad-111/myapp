import React, { useEffect, useState } from 'react';
import { getAuthToken } from '../../../components/utils/auth';

const POSITION_LIMITS = {
    nfl: { "QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLX": 1, "DST": 1, "K": 1 },
    ncaaf: { "QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLX": 1, "DST": 1, "K": 1 },
    nhl: { "F": 4, "C": 2, "D": 4, "G": 2 },
    nba: { "PG": 2, "SG": 2, "SF": 2, "PF": 2, "C": 2 },
    mlb: { "IF": 6, "OF": 4, "P": 5, "C": 2 }
};

const FLEX_MAP = {
    nfl: { FLX: ["RB", "WR", "TE"] },
    ncaaf: { FLX: ["RB", "WR", "TE"] },
    mlb: {
        IF: ["1B", "2B", "SS", "3B", "IF"],
        OF: ["OF", "LF", "CF", "RF"],
        P: ["SP", "RP", "CP", "P"]
    },
    nhl: {
        F: ["RW", "LW", "F"]
    }
};

const ManageLineup = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalPosition, setModalPosition] = useState("");
    const [team, setTeam] = useState();
    const [teamId, setTeamId] = useState();
    const [roster, setRoster] = useState([]);
    const [sport, setSport] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeam = async () => {
            const authToken = getAuthToken();
            const urlParts = window.location.pathname.split('/');
            const code = urlParts[urlParts.length - 1];
        
            try {
                const response = await fetch('/api/team/getteam', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": 'Bearer ' + authToken
                    },
                    body: JSON.stringify({ code: code })
                });
                const data = await response.json();
                setTeam(data.team_name);
                setTeamId(data.team_id);
                setRoster(data.roster);
                setSport(data.sport);
        
                // 🧠 Build initialLineup based on returned roster's current starting positions
                const initialLineup = {};
                Object.keys(POSITION_LIMITS[data.sport]).forEach(pos => {
                    initialLineup[pos] = 0;
                });
        
                data.roster.forEach(player => {
                    if (player.position !== "BEN") {
                        if (initialLineup[player.position] !== undefined) {
                            initialLineup[player.position]++;
                        } else {
                            // Safety: if backend sent unexpected starting position
                            initialLineup[player.position] = 1;
                        }
                    }
                });
        
            } catch (err) {
                console.log(err);
                setError('Failed to fetch team data.');
            } finally {
                setLoading(false);
            }
        };
        

        fetchTeam();
    }, []);

    const openFillSlotModal = (position) => {
        setModalPosition(position);
        setShowModal(true);
    };

    const handleAssignToSlot = (playerId, position) => {
        const updatedRoster = [...roster];
        const index = updatedRoster.findIndex(p => p.player_id === playerId);
        if (index === -1) return;
    
        updatedRoster[index].position = position;
        setRoster(updatedRoster);
    
    
        setShowModal(false);
        setModalPosition("");
    };

    
    const handleToggleStart = (playerId) => {
        const updatedRoster = [...roster];
        const index = updatedRoster.findIndex(p => p.player_id === playerId);
        if (index === -1) return;
    
        const player = updatedRoster[index];
        const playerDefaultPos = player.default_position;
    
        if (player.position !== 'BEN') {
            // Move to bench
            updatedRoster[index].position = "BEN";
        } else {
            const maxAllowed = POSITION_LIMITS[sport][playerDefaultPos] || 0;
            const currentCount = roster.filter(
                p => p.position === playerDefaultPos
            ).length;

            if (currentCount < maxAllowed) {
                updatedRoster[index].position = playerDefaultPos;
                setRoster(updatedRoster);
                return;
            } else {
                // Try flex
                let assignedFlex = null;
                const flexOptions = FLEX_MAP[sport];
                if (flexOptions) {
                    for (const flexPos in flexOptions) {
                        if (flexOptions[flexPos].includes(playerDefaultPos)) {
                            const flexCurrent = roster.filter(p => p.position === flexPos).length;
                            const flexMax = POSITION_LIMITS[sport][flexPos] || 0;

                            if (flexCurrent < flexMax) {
                                updatedRoster[index].position = flexPos;
                                setRoster(updatedRoster);
                                return;
                            }

                        }
                    }
                }
    
                if (assignedFlex) {
                    updatedRoster[index].position = assignedFlex;
                } else {
                    alert(`Cannot start more players at ${playerDefaultPos} or eligible flex.`);
                    return;
                }
            }
        }
    
        setRoster(updatedRoster);
    };
    

    const getSortedRosterWithEmptySlots = () => {
        const positionOrder = Object.keys(POSITION_LIMITS[sport]);
        const slots = [];
    
        // 1. Add starters per position in order
        positionOrder.forEach(pos => {
            const max = POSITION_LIMITS[sport][pos];
            const filled = roster.filter(p => p.position === pos);
            const numFilled = filled.length;
    
            for (let i = 0; i < max; i++) {
                if (i < numFilled) {
                    slots.push(filled[i]);  // player in position
                } else {
                    slots.push({ empty: true, position: pos });  // empty slot
                }
            }
        });
    
        // 2. Add bench players
        const bench = roster.filter(p => p.position === "BEN");
        return [...slots, ...bench];
    };
    
    

    const handleSaveLineup = async () => {
        const authToken = getAuthToken();
        try {
            const response = await fetch('/api/team/changelineup', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + authToken
                },
                body: JSON.stringify({
                    team_id: teamId,
                    lineup: roster.map(player => ({
                        player_id: player.player_id,
                        new_position: player.position
                    }))
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Lineup successfully saved!');
            } else {
                alert(data.error || 'Failed to save lineup.');
            }
        } catch (err) {
            alert('Error saving lineup.');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const eligibleBenchPlayers = roster.filter(p => {
        if (p.position !== "BEN") return false;
        if (modalPosition === "") return false;
    
        // Default position matches slot OR is valid flex
        const isDirectMatch = p.default_position === modalPosition;
        const isFlexMatch = FLEX_MAP[sport]?.[modalPosition]?.includes(p.default_position);
    
        return isDirectMatch || isFlexMatch;
    });
    

    return (
        <>
        <div>
            <h1>Manage Lineup</h1>
            {team ? (
                <h2>{team}</h2>
            ) : (
                <p>No team data available.</p>
            )}
            <button onClick={handleSaveLineup} style={{ marginBottom: "20px", padding: "10px" }}>
                Save Lineup
            </button>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>First Name</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Last Name</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Player ID</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Team</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Default Position</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Current Position</th>
                            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getSortedRosterWithEmptySlots().map((player, index) => (

                            <tr key={index} style={{ backgroundColor: player.empty ? "#f9f9f9" : (player.position === "BEN" ? "#fff" : "#eaffea") }}>

                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {player.empty ? "-" : player.first_name}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {player.empty ? "-" : player.last_name}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {player.empty ? "-" : player.player_id}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {player.empty ? "-" : player.team}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {player.empty ? player.position : player.default_position}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {player.empty ? player.position : player.position}
                                </td>
                                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                                    {player.empty ? (
                                        <td colSpan="7" style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>
                                        <em style={{ color: "#aaa" }}>Empty {player.position} slot</em>
                                        <button style={{ marginLeft: "10px" }} onClick={() => openFillSlotModal(player.position)}>
                                            Fill Slot
                                        </button>
                                        </td>
                                    
                                    ) : (
                                        <button onClick={() => handleToggleStart(player.player_id)}>
                                            {player.position !== "BEN" ? "Bench" : "Start"}
                                        </button>
                                    )}
                                </td>
                            </tr>

                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <div>{showModal && (
            <div style={{
                position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center"
            }}>
                <div style={{
                    backgroundColor: "#fff",
                    padding: "25px",
                    borderRadius: "12px",
                    width: "600px",              // wider modal
                    maxHeight: "85vh",           // taller scrollable content
                    overflowY: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)" // optional subtle shadow
                }}>
                    <h4>Select Player for {modalPosition}</h4>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {eligibleBenchPlayers.length === 0 && <li>No eligible players</li>}
                        {eligibleBenchPlayers.map((player) => (
                            <li key={player.player_id} style={{ margin: "10px 0" }}>
                                {player.first_name} {player.last_name} ({player.default_position}) – {player.team}
                                <button style={{ float: "right" }} onClick={() => handleAssignToSlot(player.player_id, modalPosition)}>
                                    Assign
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => setShowModal(false)} style={{ marginTop: "15px" }}>
                        Cancel
                    </button>
                </div>
            </div>
        )}
        </div>
        </>
        
    );
};

export default ManageLineup;
