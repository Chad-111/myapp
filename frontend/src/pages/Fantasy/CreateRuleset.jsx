import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RedirectContext } from "../../App";
import { getAuthToken } from "../../components/utils/auth";
import { useContext } from "react";
import { useTranslation } from 'react-i18next';

const defaultRulesets = {
    nfl: {
        points_passtd: 4.0, points_passyd: 0.04, points_2pt_passtd: 2.0, points_2pt_rushtd: 2.0,
        points_2pt_rectd: 2.0, points_int: -2.0, points_rushtd: 6.0, points_rushyd: 0.1,
        points_rectd: 6.0, points_recyd: 0.1, points_reception: 1.0, points_fumble: -2.0,
        points_sack: 1.0, points_int_def: 2.0, points_fumble_def: 2.0, points_safety: 2.0,
        points_def_td: 6.0, points_block_kick: 2.0, points_shutout: 10.0, points_1_6_pa: 7.0,
        points_7_13_pa: 4.0, points_14_20_pa: 1.0, points_21_27_pa: 0.0, points_28_34_pa: -1.0,
        points_35plus_pa: -4.0, points_kick_return_td: 6.0, points_punt_return_td: 6.0,
        points_fg_0_39: 3.0, points_fg_40_49: 4.0, points_fg_50plus: 5.0, points_fg_miss: -1.0,
        points_xp: 1.0, points_xp_miss: -1.0
    },
    ncaaf: {}, // Same as NFL
    nba: {
        points_point: 1.0, points_rebound: 1.2, points_assist: 1.5, points_steal: 3.0,
        points_block: 3.0, points_turnover: -1.0, points_three_pointer: 0.5,
        points_double_double: 1.5, points_triple_double: 3.0
    },
    mlb: {
        points_hit: 1.0, points_home_run: 4.0, points_rbi: 1.0, points_run: 1.0,
        points_walk: 0.5, points_strikeout: -0.5, points_sb: 2.0, points_cs: -1.0,
        points_ip: 1.0, points_pitcher_strikeout: 1.0, points_win: 5.0,
        points_save: 5.0, points_earned_run: -2.0
    },
    nhl: {
        points_goal: 3.0, points_assist: 2.0, points_shot: 0.5, points_hit: 0.5,
        points_block: 0.5, points_pp_point: 0.5, points_sh_point: 1.0,
        points_shutout: 4.0, points_goal_against: -1.0, points_save: 0.2
    }
};


// ⬅️ Used to sort keys in a nice order
const ruleOrder = {
    nfl: Object.keys(defaultRulesets.nfl),
    ncaaf: Object.keys(defaultRulesets.nfl),
    nba: Object.keys(defaultRulesets.nba),
    mlb: Object.keys(defaultRulesets.mlb),
    nhl: Object.keys(defaultRulesets.nhl)
};

function CreateRuleset() {
    const { t } = useTranslation();
    defaultRulesets.ncaaf = defaultRulesets.nfl;

    const location = useLocation();
    const navigate = useNavigate();
    const authToken = getAuthToken();
    const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
    const { creation, sport, league_name, team_name, league_id } = location.state || {};
    console.log("Sport:", sport);
    console.log("League Name:", league_name);
    console.log("Team Name:", team_name);
    const initialValues = defaultRulesets[sport] || {};
    const [rulesetSpecs, setRulesetSpecs] = useState(initialValues);

    const [error, setError] = useState("");



    const handleChange = (field, value) => {
        setRulesetSpecs(prev => ({
            ...prev,
            [field]: parseFloat(value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (creation) {
            console.log("Submitting ruleset for:", sport, league_name, team_name);
            console.log("Ruleset specs:", rulesetSpecs);

            try {

                const response = await fetch("/api/league/create", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": 'Bearer ' + authToken
                    },
                    body: JSON.stringify({
                        "access_token": authToken,
                        "league_name": league_name,
                        "sport": sport,
                        "team_name": team_name,
                        "ruleset": rulesetSpecs
                    }),
                });

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

                navigate(redirectLocation);


            } catch (error) {
                console.error("Error:", error);
                setError("League creation failed. Please try again.");
            }
        } else {
            try {
                const response = await fetch("/api/league/update-ruleset", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({ access_token: authToken, sport: sport, league_id: league_id, ruleset: rulesetSpecs })
                })

                const data = await response.json();
                console.log("Message", data);

                navigate(redirectLocation);

            } catch (error) {
                console.error("Error:", error);
                setError("Ruleset update failed. Please try again.");
            }
        }

        navigate("/fantasy/dashboard"); // or wherever you want to go after saving
    };

    const fields = ruleOrder[sport] || [];

    return (
        <div className="container py-5" style={{ maxWidth: "700px" }}>
            <div className="card shadow border-0">
                <div className="card-body p-4">
                    <h2 className="text-center mb-4">
                        {t('ruleset.customizeTitle', { sport: sport?.toUpperCase() })}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {fields.map((field) => (
                            <div className="form-floating mb-3" key={field}>
                                <input
                                    type="number"
                                    className="form-control"
                                    id={field}
                                    placeholder={field}
                                    step="0.01"
                                    value={rulesetSpecs[field] ?? ""}
                                    onChange={(e) => handleChange(field, e.target.value)}
                                />
                                <label htmlFor={field}>{t(`ruleset.fields.${field}`, field.replace(/_/g, " "))}</label>
                            </div>
                        ))}

                        <button type="submit" className="btn btn-success w-100 fw-semibold">
                            {t('ruleset.saveAndContinue')}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateRuleset;
