import React, { useContext, useEffect, useState } from 'react';
import { RedirectContext } from "../../App";
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuthToken } from "../../components/utils/auth";

const FantasyDashboard = () => {
    const location = useLocation();
    const [leagues, setLeagues] = useState([]);
    const [joinableLeagues, setJoinableLeagues] = useState([]);
    const [showJoinable, setShowJoinable] = useState(false);
    const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
    const navigate = useNavigate();

    const authToken = getAuthToken();

    const createLeague = () => navigate("/fantasy/create");

    const fetchJoinableLeagues = async () => {
        try {
            const response = await fetch("/api/league/joinable", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + authToken
                }
            });
            const data = await response.json();
            setJoinableLeagues(data.leagues || []);
            setShowJoinable(true);
        } catch (error) {
            console.error("Error fetching joinable leagues:", error);
        }
    };

    const navToTeamHub = async (team) => {
        try {
            const response = await fetch("/api/team/geturl", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": 'Bearer ' + authToken
                },
                body: JSON.stringify({ "team_id": team.id }),
            });

            const data = await response.json();
            navigate("/team/home/" + data.code);
        } catch (error) {
            console.error("Error navigating to team:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/league/search", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": 'Bearer ' + authToken
                    },
                    body: JSON.stringify({ "access_token": authToken }),
                });

                if (!response.ok) {
                    if (response.status === 422) {
                        setRedirectLocation(location.pathname);
                        navigate("/login");
                    } else {
                        throw new Error("League get failed");
                    }
                }

                const data = await response.json();
                setLeagues(data.message || []);
            } catch (error) {
                console.error("Error fetching user leagues:", error);
            }
        };

        fetchData();
    }, [location]);

    return (
        <div className="mt-3 container">
            <h1>Fantasy Dashboard</h1>
            <div className="mb-4 d-flex gap-2">
                <button className="btn btn-success" onClick={createLeague}>Create League</button>
                <button className="btn btn-outline-primary" onClick={fetchJoinableLeagues}>Find a League</button>
            </div>

            {showJoinable && (
                <div className="mt-4">
                    <h3>Available Leagues to Join</h3>
                    {joinableLeagues.length === 0 ? (
                        <p className="text-muted">No available leagues.</p>
                    ) : (
                        <div className="row">
                            {joinableLeagues.map((league) => (
                                <div key={league.id} className="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                                    <div className="card h-100 shadow-sm">
                                        <div className="card-body">
                                            <h5 className="card-title">{league.name}</h5>
                                            <p className="mb-1"><strong>Sport:</strong> {league.sport}</p>
                                            <p className="mb-0"><strong>Commissioner:</strong> {league.commissioner}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-5">
                <h3>Your Leagues</h3>
                <div className="row">
                    {leagues.map((league) => (
                        <div key={league.id} className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                            <div
                                className="card h-100 shadow-sm"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navToTeamHub(league)}
                            >
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{league.league_name}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">{league.name}</h6>
                                    <p className="mb-1"><strong>Sport:</strong> {league.sport}</p>
                                    <p className="mb-1"><strong>Rank:</strong> {league.league_rank}</p>
                                    {'wins' in league && 'losses' in league && (
                                        <p className="mb-0">
                                            <strong>Record:</strong> {league.wins}-{league.losses}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FantasyDashboard;
