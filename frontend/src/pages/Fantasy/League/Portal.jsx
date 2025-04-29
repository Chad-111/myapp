import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook";
import { useLeagueContext } from "../../../components/utils/LeagueContext";

const TradePortal = () => {
    // Get league code from URL parameters or query string
    const { code } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const leagueCode = code || queryParams.get("code");

    // Use the league data hook
    const { league, teams, loading, error } = useLeagueData(leagueCode);

    // Use the context
    const { setCurrentLeagueCode } = useLeagueContext();

    // Update the context when the page loads
    useEffect(() => {
        if (leagueCode) {
            setCurrentLeagueCode(leagueCode);
        }
    }, [leagueCode, setCurrentLeagueCode]);

    // Loading state
    if (loading) {
        return (
            <div className="container-fluid mt-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h1>Trade Portal</h1>
                    <FantasyHomeButton leagueCode={leagueCode} />
                </div>
                <div className="text-center mt-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>{league?.name} Trade Portal</h1>
                <FantasyHomeButton leagueCode={leagueCode} />
            </div>
            <p>Welcome to the Trade Portal. Here you can manage your trades and view trade history.</p>
            <p>This should be league independent where only league members matching the ID of a league will have the option to propose a trade.</p>

            {/* Add league info */}
            {league && (
                <div className="card mb-4">
                    <div className="card-header">League Info</div>
                    <div className="card-body">
                        <p><strong>League:</strong> {league.name}</p>
                        <p><strong>Sport:</strong> {league.sport}</p>
                        <p><strong>Teams:</strong> {teams?.length}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradePortal;