import { React } from 'react'
import { useContext, useEffect, useState } from 'react';
import { RedirectContext } from "../../App";
import { useNavigate, useLocation } from 'react-router-dom'
import { getAuthToken } from "../../components/utils/auth";
import { useTranslation } from 'react-i18next';

const rulesetOptions = {
    nfl: [
        { value: "default", label: "Default (PPR)" },
        { value: "half-ppr", label: "Half-PPR" },
        { value: "custom", label: "Custom" }
    ],
    ncaaf: [
        { value: "default", label: "Default (PPR)" },
        { value: "half-ppr", label: "Half-PPR" },
        { value: "custom", label: "Custom" }
    ],
    nhl: [
        { value: "default", label: "Default" },
        { value: "custom", label: "Custom" }
    ],
    nba: [
        { value: "default", label: "Default" },
        { value: "custom", label: "Custom" }
    ],
    mlb: [
        { value: "default", label: "Default" },
        { value: "custom", label: "Custom" }
    ]
};

function LeagueCreation() {
    const location = useLocation();
    const [teamName, setTeamName] = useState("");
    const [leagueName, setLeagueName] = useState("");
    const [error, setError] = useState("");
    const [sport, setSport] = useState("");
    const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
    const [ruleset, setRuleset] = useState("default");
    const navigate = useNavigate();
    const authToken = getAuthToken();
    const { t } = useTranslation();

    useEffect(() => {
        // Reset ruleset when sport changes
        setRuleset("");
    }, [sport]);



    const handleCreateLeague = async (e) => {
        e.preventDefault();
        // Handle league creation logic here
        try {
            let ruleset_specs = {}
            let response;
            if (ruleset == "custom") {
                setRedirectLocation("/fantasy/dashboard");
                navigate("/fantasy/create-ruleset", { state: { creation: true, sport: sport, league_name: leagueName, team_name: teamName } }) // need to create

            } else {
                if (ruleset == "half-ppr") {
                    ruleset_specs = { "points_reception": 0.5 }
                    response = await fetch("/api/league/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": 'Bearer ' + authToken
                        },
                        body: JSON.stringify({
                            "access_token": authToken,
                            "league_name": leagueName,
                            "sport": sport,
                            "team_name": teamName,
                            "ruleset": ruleset_specs
                        }),
                    });
                } else {


                    response = await fetch("/api/league/create", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": 'Bearer ' + authToken
                        },
                        body: JSON.stringify({
                            "access_token": authToken,
                            "league_name": leagueName,
                            "sport": sport,
                            "team_name": teamName
                        }),
                    });
                }
                if (!response.ok) {
                    if (response.status == 422) {
                        setRedirectLocation(location.pathname);
                        navigate("/login")
                    } else {
                        throw new Error("League get failed");
                    }
                }

                const data = await response.json();
                console.log("Message", data);

                navigate("/fantasy/dashboard")
            }


        } catch (error) {
            console.error("Error:", error);
            setError("League creation failed. Please try again.");
        }
    }

    return (
        <div className="container py-5" style={{ maxWidth: "600px" }}>
            <div className="card shadow border-0">
                <div className="card-body p-4">
                    <h2 className="text-center mb-4">{t('league.createTitle')}</h2>
                    {error && (
                        <div className="alert alert-danger text-center" role="alert">
                            {t(`league.errors.${error}`) || error}
                        </div>
                    )}

                    <form onSubmit={handleCreateLeague} className="needs-validation">
                        <div className="form-floating mb-3">
                            <select
                                className="form-select"
                                id="sport"
                                required
                                value={sport}
                                onChange={(e) => setSport(e.target.value)}
                            >
                                <option value="" disabled>{t('league.selectSport')}</option>
                                <option value="nhl">{t('sports.nhl')}</option>
                                <option value="ncaaf">{t('sports.ncaaf')}</option>
                                <option value="mlb">{t('sports.mlb')}</option>
                                <option value="nba">{t('sports.nba')}</option>
                                <option value="nfl">{t('sports.nfl')}</option>
                            </select>
                            <label htmlFor="sport">{t('league.sport')}</label>
                        </div>

                        <div className="form-floating mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="league_name"
                                placeholder="League Name"
                                required
                                value={leagueName}
                                onChange={(e) => setLeagueName(e.target.value)}
                            />
                            <label htmlFor="league_name">{t('league.name')}</label>
                        </div>

                        <div className="form-floating mb-4">
                            <input
                                type="text"
                                className="form-control"
                                id="team_name"
                                placeholder="Team Name"
                                required
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                            />
                            <label htmlFor="team_name">{t('league.teamName')}</label>
                        </div>

                        <div className="form-floating mb-5">
                            <select
                                className="form-select"
                                id="sport"
                                required
                                value={ruleset}
                                onChange={(e) => setRuleset(e.target.value)}
                            >
                                <option value="" disabled>{t('league.selectRuleset')}</option>
                                {sport && rulesetOptions[sport]?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
                            {t('league.createButton')}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );

}


export default LeagueCreation;