import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getAuthToken } from "../../../components/utils/auth";
import { RedirectContext } from "../../../App";
import FantasyHomeButton from "../../../components/FantasyHomeButton";
import useLeagueData from "../../../components/utils/LeagueHook"
import { useLeagueContext } from "../../../components/utils/LeagueContext";
import { useTranslation } from 'react-i18next';

const LeagueSettings = () => {
  // Extract league code from params or query string
  const { code } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leagueCode = code || queryParams.get("code");
  const { t } = useTranslation();

  // Use the context
  const { setCurrentLeagueCode } = useLeagueContext();

  // Update the context when the page loads
  useEffect(() => {
    if (leagueCode) {
      setCurrentLeagueCode(leagueCode);
    }
  }, [leagueCode, setCurrentLeagueCode]);

  const navigate = useNavigate();
  const { redirectLocation, setRedirectLocation } = useContext(RedirectContext);
  const authToken = getAuthToken();

  // State for errors and authorization
  const [error, setError] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use the custom hook to get league data
  const {
    league,
    teams,
    loading: leagueLoading,
    error: leagueError
  } = useLeagueData(leagueCode);

  // Check if user is commissioner
  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const response = await fetch("/api/league/verify_commissioner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ code: leagueCode }),
        });

        if (!response.ok) {
          navigate("/unauthorized"); // Or back to dashboard
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        console.error("Authorization check failed:", err);
        navigate("/unauthorized");
      } finally {
        setLoading(false);
      }
    };

    if (leagueCode) {
      verifyAccess();
    }
  }, [leagueCode, authToken, navigate]);

  const handleScoringUpdate = async (e) => {
    e.preventDefault();

    try {
      if (!league) {
        throw new Error("League data not available");
      }

      const sport = league.sport;
      const league_id = league.id;
      const creation = false;

      setRedirectLocation("/league/settings/" + leagueCode);
      navigate("/fantasy/create-ruleset", {
        state: {
          creation: creation,
          sport: sport,
          league_id: league_id
        }
      });
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to navigate to scoring rules. Please try again.");
    }
  };

  // Loading states
  if (loading || leagueLoading) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>League Settings</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="text-center mt-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || leagueError || !authorized) {
    return (
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>League Settings</h1>
          <FantasyHomeButton leagueCode={leagueCode} />
        </div>
        <div className="alert alert-danger">{error || leagueError || t('settings.unauthorized')}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{league?.name} {t('settings.title')}</h1>
        <FantasyHomeButton leagueCode={leagueCode} />
      </div>

      {/* League Info Card */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">{t('settings.infoHeader')}</div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>{t('settings.leagueName')}:</strong> {league?.name}</p>
              <p><strong>{t('settings.sport')}:</strong> {league?.sport}</p>
              <p><strong>{t('settings.code')}:</strong> {leagueCode}</p>
            </div>
            <div className="col-md-6">
              <p><strong>{t('settings.teams')}:</strong> {teams?.length || 0}</p>
              <p><strong>{t('settings.status')}:</strong> {league?.status || t('settings.inProgress')}</p>
              <p><strong>{t('settings.commissioner')}:</strong> {league?.commissioner_id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Options */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <strong>{t('settings.scoringTitle')}</strong>
            </div>
            <div className="card-body">
              <p>{t('settings.scoringDesc1')}</p>
              <p>{t('settings.scoringDesc2')}</p>
              <button className="btn btn-primary" onClick={handleScoringUpdate}>
                {t('settings.updateScoring')}
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <strong>{t('settings.managementTitle')}</strong>
            </div>
            <div className="card-body">
              <p>{t('settings.managementDesc')}</p>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary">{t('settings.manageTeams')}</button>
                <button className="btn btn-outline-primary">{t('settings.schedule')}</button>
                <button className="btn btn-outline-primary">{t('settings.draft')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="card mb-4">
        <div className="card-header bg-light">{t('settings.advanced')}</div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">{t('settings.visibility')}</label>
            <select className="form-select">
              <option>{t('settings.private')}</option>
              <option>{t('settings.public')}</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">{t('settings.tradeDeadline')}</label>
            <input type="date" className="form-control" />
          </div>

          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="waiversEnabled" />
            <label className="form-check-label" htmlFor="waiversEnabled">
              {t('settings.waivers')}
            </label>
          </div>

          <button className="btn btn-success">{t('settings.save')}</button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-danger mb-4">
        <div className="card-header bg-danger text-white">{t('settings.dangerZone')}</div>
        <div className="card-body">
          <p className="text-danger">{t('settings.dangerWarn')}</p>
          <button className="btn btn-outline-danger me-2">{t('settings.reset')}</button>
          <button className="btn btn-danger">{t('settings.delete')}</button>
        </div>
      </div>
    </div>
  );
};

export default LeagueSettings;